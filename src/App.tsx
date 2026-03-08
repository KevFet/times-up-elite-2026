import { useEffect } from 'react'
import { supabase } from './supabase'
import { useGameStore, Room } from './store'
import Lobby from './Lobby'
import Preparation from './Preparation'
import Game from './Game'
import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'

function App() {
    const { room, setRoom, setTeams, setPlayers, setDeck } = useGameStore()
    const { i18n } = useTranslation()

    // Subscribe to real-time changes
    useEffect(() => {
        if (!room?.id) return

        const roomSub = supabase.channel('room_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
                setRoom(payload.new as Room)
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `room_id=eq.${room.id}` }, () => {
                fetchData()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` }, () => {
                fetchData()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'deck', filter: `room_id=eq.${room.id}` }, () => {
                fetchDeck()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(roomSub)
        }
    }, [room?.id])

    const fetchData = async () => {
        if (!room?.id) return
        const { data: teamsData } = await supabase.from('teams').select('*').eq('room_id', room.id).order('created_at')
        const { data: playersData } = await supabase.from('players').select('*').eq('room_id', room.id)
        if (teamsData) setTeams(teamsData)
        if (playersData) setPlayers(playersData)
    }

    const fetchDeck = async () => {
        if (!room?.id) return
        const { data: deckData } = await supabase.from('deck').select('*').eq('room_id', room.id)
        if (deckData) setDeck(deckData)
    }

    const toggleLanguage = () => {
        const langs = ['en', 'fr', 'es']
        const nextLang = langs[(langs.indexOf(i18n.language) + 1) % langs.length]
        i18n.changeLanguage(nextLang)
    }

    return (
        <div className="w-full h-full relative overflow-hidden text-white flex flex-col font-sans">
            <div className="absolute top-4 right-4 z-50">
                <button onClick={toggleLanguage} className="glass-panel p-2 rounded-full hover:bg-white/10 transition">
                    <Languages className="w-5 h-5" />
                    <span className="text-xs uppercase absolute -bottom-4 right-1/2 translate-x-1/2">{i18n.language}</span>
                </button>
            </div>

            <AnimatePresence mode="wait">
                {!room && <Lobby key="lobby" />}
                {room?.status === 'lobby' && <Lobby key="lobby-room" />}
                {room?.status === 'preparation' && <Preparation key="prep" />}
                {room?.status === 'playing' && <Game key="game" />}
            </AnimatePresence>
        </div>
    )
}

export default App
