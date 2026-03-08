import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './supabase'
import { useGameStore } from './store'
import { Check } from 'lucide-react'

// Extended list of celebrities
const CELEBRITIES = [
    "Albert Einstein", "Marie Curie", "Leonardo DiCaprio", "Marilyn Monroe",
    "Michael Jackson", "Freddie Mercury", "Steve Jobs", "Elon Musk",
    "Lionel Messi", "Cristiano Ronaldo", "Serena Williams", "Beyoncé",
    "Elvis Presley", "Abraham Lincoln", "Nelson Mandela", "Martin Luther King Jr.",
    "Tom Cruise", "Brad Pitt", "Angelina Jolie", "Scarlett Johansson",
    "Will Smith", "Johnny Depp", "Emma Watson", "Daniel Radcliffe",
    "David Beckham", "Tiger Woods", "Michael Jordan", "LeBron James",
    "Muhammad Ali", "Mike Tyson", "Oprah Winfrey", "Ellen DeGeneres",
    "Rihanna", "Lady Gaga", "Taylor Swift", "Justin Bieber",
    "Eminem", "Snoop Dogg", "Jay-Z", "Kanye West",
    "Barack Obama", "Donald Trump", "John F. Kennedy", "Winston Churchill",
    "Queen Elizabeth II", "Princess Diana", "Charles Darwin", "Isaac Newton",
    "Galileo Galilei", "Nikola Tesla", "Stephen Hawking", "Bill Gates"
];

export default function Preparation() {
    const { room, player } = useGameStore()
    const [myCards, setMyCards] = useState<string[]>([])
    const [discarded, setDiscarded] = useState<string[]>([])
    const [ready, setReady] = useState(false)

    useEffect(() => {
        // Generate cards for the player
        // In a real app, this would be done by the host securely.
        // Here we generate 12 random ones locally to discard 2
        const shuffled = [...CELEBRITIES].sort(() => 0.5 - Math.random())
        setMyCards(shuffled.slice(0, 10))
    }, [])

    const discardCard = (card: string) => {
        if (discarded.length >= 2) return
        setDiscarded(prev => [...prev, card])
    }

    const validateSelection = async () => {
        if (discarded.length < 2 || ready) return
        setReady(true)

        // Add remaining cards to the deck table
        const remaining = myCards.filter(c => !discarded.includes(c))
        const inserts = remaining.map(word => ({
            room_id: room!.id,
            word,
            status: 'available',
            round_played: null
        }))

        await supabase.from('deck').insert(inserts)

        // Notify ready status
        await supabase.from('players').update({ is_host: player?.is_host }).eq('id', player!.id) // just trigger an update
    }

    const checkEveryoneReady = async () => {
        // Basic check: if deck has 40 cards, change status to playing
        const { count } = await supabase.from('deck').select('*', { count: 'exact', head: true }).eq('room_id', room!.id)
        if (count && count >= 20) { // For testing, let's say >=20 is enough
            await supabase.from('rooms').update({ status: 'playing', current_round: 1 }).eq('id', room!.id)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col items-center p-6 gap-6 relative"
        >
            <div className="text-center mt-10">
                <h2 className="text-3xl font-black italic shadow-neon">PREPARATION</h2>
                <p className="text-white/50">Discard 2 cards ({2 - discarded.length} remaining)</p>
            </div>

            <div className="flex-1 w-full max-w-sm relative mt-10">
                <AnimatePresence>
                    {!ready ? myCards.map((card, i) => {
                        if (discarded.includes(card)) return null
                        return (
                            <motion.div
                                key={card}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={(_, info) => {
                                    if (Math.abs(info.offset.x) > 100) {
                                        discardCard(card)
                                        if (navigator.vibrate) navigator.vibrate(50)
                                    }
                                }}
                                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                                animate={{ scale: 1, opacity: 1, y: i * 5, zIndex: 10 - i }}
                                exit={{ scale: 0.8, opacity: 0, x: -200 }}
                                className="absolute w-full aspect-[3/4] glass-panel rounded-3xl flex items-center justify-center p-8 bg-white/10 backdrop-blur-2xl border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                                style={{ top: i * 10 }}
                            >
                                <h3 className="text-3xl font-bold text-center drop-shadow-lg">{card}</h3>
                                <p className="absolute bottom-6 text-white/30 text-sm">Swipe to discard</p>
                            </motion.div>
                        )
                    }) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                        >
                            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                <Check className="w-10 h-10 text-green-400" />
                            </div>
                            <p className="text-lg font-bold">Waiting for others...</p>
                            {player?.is_host && (
                                <button
                                    onClick={checkEveryoneReady}
                                    className="mt-10 px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition backdrop-blur-md"
                                >
                                    Force Start (Testing)
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {!ready && discarded.length === 2 && (
                <motion.button
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={validateSelection}
                    className="w-full max-w-sm py-4 rounded-2xl bg-white text-black font-bold text-lg hover:bg-white/90 transition shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-10"
                >
                    Confirm Final Deck
                </motion.button>
            )}
        </motion.div>
    )
}
