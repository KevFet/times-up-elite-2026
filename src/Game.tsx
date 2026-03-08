import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './supabase'
import { useGameStore, DeckCard } from './store'
import confetti from 'canvas-confetti'

export default function Game() {
    const { room, deck, player, teams } = useGameStore()
    const [timeLeft, setTimeLeft] = useState(30)
    const [isPlaying, setIsPlaying] = useState(false)

    // Only available cards for current round
    const currentDeck = deck.filter(c => c.status === 'available')

    // Total cards for progress bar
    const totalDeckSize = deck.length
    const progress = totalDeckSize > 0 ? ((totalDeckSize - currentDeck.length) / totalDeckSize) * 100 : 0

    const timerRef = useRef<number | null>(null)
    const [currentWordIndex, setCurrentWordIndex] = useState(0)

    useEffect(() => {
        if (isPlaying && timeLeft > 0) {
            timerRef.current = window.setTimeout(() => setTimeLeft(t => t - 1), 1000)
        } else if (timeLeft <= 0) {
            setIsPlaying(false)
            // Play buzzer sound
            const buzzer = new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq') // placeholder
            buzzer.volume = 0.5
            buzzer.play().catch(() => { })
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }, [isPlaying, timeLeft])

    useEffect(() => {
        if (currentDeck.length === 0 && deck.length > 0) {
            // Phase Complete!
            endPhase()
        }
    }, [currentDeck.length])

    const endPhase = () => {
        setIsPlaying(false)
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#e11d48']
        })

        // Check if game over (round 3)
        if (room?.current_round === 3) {
            setTimeout(() => alert('Game Over!'), 2000)
        } else {
            setTimeout(() => advanceRound(), 3000)
        }
    }

    const advanceRound = async () => {
        if (!room) return
        // Reset all cards to available, but maybe keep them mixed
        await supabase.from('deck').update({ status: 'available' }).eq('room_id', room.id)
        await supabase.from('rooms').update({ current_round: room.current_round + 1 }).eq('id', room.id)
    }

    const startTurn = () => {
        setTimeLeft(30)
        setIsPlaying(true)
    }

    const handleCardValidate = async (card: DeckCard) => {
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]) // Haptic feedback

        // Add point to player's team
        if (player?.team_id) {
            const myTeam = teams.find(t => t.id === player.team_id)
            if (myTeam) {
                await supabase.from('teams').update({ score: myTeam.score + 1 }).eq('id', myTeam.id)
            }
        }

        // Mark card as played
        await supabase.from('deck').update({ status: 'played', round_played: room?.current_round }).eq('id', card.id)
    }

    const handleCardPass = async () => {
        // Round 1: pass not allowed typically, but let's just cycle
        if (room?.current_round === 1) return
        setCurrentWordIndex((prev) => (prev + 1) % currentDeck.length)
    }

    const isCritical = timeLeft <= 5 && timeLeft > 0

    return (
        <div className="w-full h-full flex flex-col items-center p-6 relative">

            {/* Progress Bar */}
            <div className="w-full h-2 bg-white/10 rounded-full mt-12 overflow-hidden backdrop-blur-sm border border-white/5 shadow-inner">
                <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-rose-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <div className="flex justify-between w-full mt-4 text-white/50 text-sm font-bold tracking-widest uppercase">
                <span>Round {room?.current_round}</span>
                <span>{currentDeck.length} left</span>
            </div>

            {/* Clock */}
            <motion.div
                className={`w-36 h-36 rounded-full border-4 flex items-center justify-center my-10 relative shadow-[0_0_50px_rgba(255,255,255,0.1)] backdrop-blur-3xl transition-colors duration-300 ${isCritical ? 'border-rose-500 shadow-[0_0_80px_rgba(225,29,72,0.8)] text-rose-500 scale-110' : 'border-white/20 text-white'}`}
                animate={isCritical ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] } : {}}
                transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
            >
                <span className="text-6xl font-black drop-shadow-xl">{timeLeft}</span>
            </motion.div>

            {/* Card Arena */}
            <div className="flex-1 w-full max-w-sm relative flex items-center justify-center">
                {isPlaying ? (
                    <AnimatePresence>
                        {currentDeck.length > 0 && (
                            <motion.div
                                key={currentDeck[currentWordIndex]?.id}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={1}
                                onDragEnd={(_, info) => {
                                    if (info.offset.x > 100) {
                                        handleCardValidate(currentDeck[currentWordIndex])
                                    } else if (info.offset.x < -100) {
                                        handleCardPass()
                                    }
                                }}
                                initial={{ scale: 0.8, opacity: 0, y: 50, rotate: -5 }}
                                animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                                exit={{ scale: 0.8, opacity: 0, x: 200, rotate: 10 }}
                                className="absolute w-full aspect-[3/4] glass-panel rounded-3xl flex flex-col items-center justify-center p-8 bg-white/10 backdrop-blur-2xl border-white/20"
                            >
                                <div className="absolute top-4 w-full flex justify-between px-6 text-xs text-white/30 uppercase font-black">
                                    <span>&larr; Pass (R2+)</span>
                                    <span>Validate &rarr;</span>
                                </div>
                                <h3 className="text-4xl font-black text-center drop-shadow-2xl capitalize">
                                    {currentDeck[currentWordIndex]?.word}
                                </h3>
                            </motion.div>
                        )}
                    </AnimatePresence>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                        <h3 className="text-2xl font-bold italic text-white/50">Your Turn?</h3>
                        <button
                            onClick={startTurn}
                            disabled={currentDeck.length === 0}
                            className="py-6 px-12 rounded-3xl bg-white text-black font-black text-2xl hover:bg-white/90 transition shadow-[0_0_60px_rgba(255,255,255,0.4)] disabled:opacity-20"
                        >
                            START
                        </button>
                    </div>
                )}
            </div>

            {/* Scores */}
            <div className="w-full grid grid-cols-2 gap-4 mt-10 mb-6">
                {teams.map(t => (
                    <div key={t.id} className="glass-panel p-4 rounded-2xl flex flex-col items-center" style={{ borderTop: `2px solid ${t.color}` }}>
                        <span className="text-sm font-bold opacity-70" style={{ color: t.color }}>{t.name}</span>
                        <span className="text-3xl font-black mt-2">{t.score}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
