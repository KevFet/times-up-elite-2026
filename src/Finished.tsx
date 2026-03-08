import { motion } from 'framer-motion'
import { useGameStore } from './store'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'
import { Trophy, RefreshCcw } from 'lucide-react'
export default function Finished() {
    const { teams, setPlayer, setRoom } = useGameStore()
    const sortedTeams = [...teams].sort((a, b) => b.score - a.score)

    useEffect(() => {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.3 }
        })
    }, [])

    const resetGame = () => {
        // Clear local state
        setPlayer(null)
        setRoom(null)
        // Navigate home or refresh
        window.location.href = '/'
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col items-center justify-center p-6 gap-8 bg-black/40 backdrop-blur-3xl"
        >
            <div className="text-center space-y-2">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(250,204,21,0.5)]"
                >
                    <Trophy className="w-12 h-12 text-black" />
                </motion.div>
                <h1 className="text-5xl font-black italic tracking-tighter uppercase">Game Over!</h1>
                <p className="text-white/50 tracking-widest uppercase">The results are in</p>
            </div>

            <div className="w-full max-w-sm space-y-4">
                {sortedTeams.map((team, i) => (
                    <motion.div
                        key={team.id}
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.2 }}
                        className="glass-panel p-6 rounded-3xl flex items-center justify-between border-l-4"
                        style={{ borderColor: team.color }}
                    >
                        <div>
                            <h3 className="text-xl font-bold" style={{ color: team.color }}>{team.name}</h3>
                            <p className="text-white/30 text-xs uppercase font-black tracking-widest">{i === 0 ? 'Winners' : 'Final Score'}</p>
                        </div>
                        <div className="text-4xl font-black italic">{team.score}</div>
                    </motion.div>
                ))}
            </div>

            <button
                onClick={resetGame}
                className="mt-8 flex items-center gap-2 px-8 py-4 bg-white text-black font-black uppercase rounded-2xl hover:bg-white/90 transition hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
                <RefreshCcw className="w-5 h-5" />
                New Game
            </button>
        </motion.div>
    )
}
