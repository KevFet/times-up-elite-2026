import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { supabase } from './supabase'
import { useGameStore, Room, Player } from './store'
import { Play, Plus } from 'lucide-react'

export default function Lobby() {
    const { t } = useTranslation()
    const { room, setRoom, setPlayer, player, teams, players } = useGameStore()
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    const createRoom = async () => {
        if (!name.trim()) return
        setLoading(true)
        const newCode = Math.random().toString(36).substring(2, 6).toUpperCase()

        const { data: roomData, error: roomError } = await supabase.from('rooms').insert([{ code: newCode }]).select().single()
        if (roomError || !roomData) { setLoading(false); return }

        // Create 2 default teams
        const team1 = { room_id: roomData.id, name: 'Team A', color: '#6366f1', score: 0 }
        const team2 = { room_id: roomData.id, name: 'Team B', color: '#e11d48', score: 0 }
        await supabase.from('teams').insert([team1, team2])

        const { data: playerData } = await supabase.from('players').insert([{
            room_id: roomData.id,
            name,
            is_host: true
        }]).select().single()

        setRoom(roomData as Room)
        setPlayer(playerData as Player)
        setLoading(false)
    }

    const joinRoom = async () => {
        if (!name.trim() || !code.trim()) return
        setLoading(true)

        const { data: roomData } = await supabase.from('rooms').select('*').eq('code', code.toUpperCase()).single()
        if (!roomData) { alert('Room not found'); setLoading(false); return }

        const { data: playerData } = await supabase.from('players').insert([{
            room_id: roomData.id,
            name,
            is_host: false
        }]).select().single()

        setRoom(roomData as Room)
        setPlayer(playerData as Player)
        setLoading(false)
    }

    const joinTeam = async (teamId: string) => {
        if (!player) return
        const { data } = await supabase.from('players').update({ team_id: teamId }).eq('id', player.id).select().single()
        setPlayer(data as Player)
    }

    const startGame = async () => {
        if (!room || !player?.is_host) return
        await supabase.from('rooms').update({ status: 'preparation' }).eq('id', room.id)
    }

    if (room) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full h-full flex flex-col items-center justify-center p-6 gap-y-12 max-w-md mx-auto relative z-10"
            >
                <div className="absolute top-10 flex flex-col items-center">
                    <p className="text-white/50 text-sm">{t('room_code')}</p>
                    <h1 className="text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
                        {room.code}
                    </h1>
                </div>

                <div className="w-full space-y-6 mt-20">
                    {teams.map(team => (
                        <div key={team.id} className="glass-panel rounded-3xl p-6 relative overflow-hidden" style={{ borderColor: `${team.color}40` }}>
                            <div className="absolute inset-0 opacity-10" style={{ backgroundColor: team.color }} />
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: team.color }}>
                                {team.name}
                                <span className="text-sm font-normal text-white/50">({players.filter(p => p.team_id === team.id).length})</span>
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {players.filter(p => p.team_id === team.id).map(p => (
                                    <span key={p.id} className="px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-md border border-white/5">
                                        {p.name} {p.id === player?.id && '(You)'}
                                    </span>
                                ))}
                            </div>
                            <button
                                onClick={() => joinTeam(team.id)}
                                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition backdrop-blur-lg"
                            >
                                Join {team.name}
                            </button>
                        </div>
                    ))}

                    {/* Unassigned Players */}
                    {players.filter(p => !p.team_id).length > 0 && (
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <h4 className="text-sm text-white/50 mb-2">Unassigned</h4>
                            <div className="flex flex-wrap gap-2">
                                {players.filter(p => !p.team_id).map(p => (
                                    <span key={p.id} className="text-sm text-white/70">{p.name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {player?.is_host && (
                    <button
                        onClick={startGame}
                        className="w-full py-4 rounded-2xl bg-white text-black font-bold text-lg hover:bg-white/90 transition shadow-[0_0_30px_rgba(255,255,255,0.3)] mt-auto mb-10"
                        disabled={players.some(p => !p.team_id) || teams.some(t => players.filter(p => p.team_id === t.id).length === 0)}
                    >
                        Start Game
                    </button>
                )}
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col items-center justify-center p-6 gap-y-12 max-w-md mx-auto"
        >
            <div className="text-center">
                <h1 className="text-6xl font-black italic tracking-tighter" style={{ textShadow: '0 0 40px rgba(225, 29, 72, 0.5)' }}>
                    {t('lobby_title')}
                </h1>
                <p className="text-white/50 mt-2 text-sm tracking-widest uppercase">Elite Edition 2026</p>
            </div>

            <div className="w-full space-y-4">
                <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white placeholder:text-white/30 backdrop-blur-xl outline-none focus:border-white/30 focus:bg-white/10 transition"
                />
                <input
                    type="text"
                    placeholder={t('room_code')}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white placeholder:text-white/30 backdrop-blur-xl outline-none focus:border-white/30 focus:bg-white/10 transition uppercase tracking-widest"
                />
            </div>

            <div className="w-full space-y-4">
                <button
                    onClick={joinRoom}
                    disabled={loading || !name || !code}
                    className="w-full h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center gap-3 hover:bg-white/20 transition disabled:opacity-50"
                >
                    <Play className="w-5 h-5" />
                    {t('join_room')}
                </button>

                <div className="flex items-center gap-4 w-full">
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-white/30 text-sm">OR</span>
                    <div className="h-px bg-white/10 flex-1" />
                </div>

                <button
                    onClick={createRoom}
                    disabled={loading || !name}
                    className="w-full h-16 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-white/90 transition shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50"
                >
                    <Plus className="w-5 h-5" />
                    {t('create_room')}
                </button>
            </div>
        </motion.div>
    )
}
