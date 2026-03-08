import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './supabase'
import { useGameStore } from './store'
import { Check } from 'lucide-react'

// Extended list of celebrities
const CELEBRITIES = [
    // Historical & Science
    "Albert Einstein", "Marie Curie", "Leonardo da Vinci", "Isaac Newton", "Charles Darwin",
    "Nikola Tesla", "Galileo Galilei", "Stephen Hawking", "Thomas Edison", "Alexander Graham Bell",
    "Ada Lovelace", "Alan Turing", "Sigmund Freud", "Aristotle", "Plato", "Socrates",
    "Cleopatra", "Julius Caesar", "Alexander the Great", "Napoleon Bonaparte", "Joan of Arc",
    "Abraham Lincoln", "George Washington", "Winston Churchill", "Nelson Mandela", "Martin Luther King Jr.",
    "Mahatma Gandhi", "Mother Teresa", "Anne Frank", "Rosa Parks", "Malcolm X", "Che Guevara",
    // Music
    "Michael Jackson", "Freddie Mercury", "Elvis Presley", "Beyoncé", "Taylor Swift",
    "Rihanna", "Lady Gaga", "Justin Bieber", "Eminem", "Snoop Dogg", "Jay-Z", "Kanye West",
    "Madonna", "Prince", "David Bowie", "John Lennon", "Paul McCartney", "Bob Marley",
    "Kurt Cobain", "Jim Morrison", "Jimi Hendrix", "Amy Winehouse", "Whitney Houston", "Aretha Franklin",
    "Adele", "Drake", "Ed Sheeran", "Ariana Grande", "Selena Gomez", "Katy Perry",
    "Billie Eilish", "Dua Lipa", "Harry Styles", "Post Malone", "The Weeknd", "Bruno Mars",
    "Shakira", "Jennifer Lopez", "Britney Spears", "Celine Dion", "Elton John", "Mick Jagger",
    // Actors & Cinema
    "Leonardo DiCaprio", "Marilyn Monroe", "Tom Cruise", "Brad Pitt", "Angelina Jolie",
    "Scarlett Johansson", "Will Smith", "Johnny Depp", "Emma Watson", "Daniel Radcliffe",
    "Robert Downey Jr.", "Chris Evans", "Chris Hemsworth", "Mark Ruffalo", "Tom Holland", "Zendaya",
    "Meryl Streep", "Tom Hanks", "Denzel Washington", "Morgan Freeman", "Samuel L. Jackson", "Al Pacino",
    "Robert De Niro", "Julie Andrews", "Audrey Hepburn", "Grace Kelly", "Elizabeth Taylor", "Charlie Chaplin",
    "Arnold Schwarzenegger", "Sylvester Stallone", "Jackie Chan", "Bruce Lee", "Dwayne Johnson", "Kevin Hart",
    "Margot Robbie", "Ryan Gosling", "Jennifer Lawrence", "Gal Gadot", "Natalie Portman", "Keanu Reeves",
    "Benedict Cumberbatch", "Idris Elba", "Heath Ledger", "Joaquin Phoenix", "Christian Bale", "Hugh Jackman",
    "George Clooney", "Julia Roberts", "Sandra Bullock", "Nicole Kidman", "Harrison Ford", "Carrie Fisher",
    "Mark Hamill", "Ian McKellen", "Patrick Stewart", "Maggie Smith", "Viola Davis", "Chadwick Boseman",
    // Sports
    "Lionel Messi", "Cristiano Ronaldo", "Serena Williams", "Roger Federer", "Rafael Nadal", "Novak Djokovic",
    "Michael Jordan", "LeBron James", "Kobe Bryant", "Shaquille O'Neal", "Tiger Woods", "David Beckham",
    "Muhammad Ali", "Mike Tyson", "Conor McGregor", "Lewis Hamilton", "Michael Schumacher", "Usain Bolt",
    "Pele", "Diego Maradona", "Zinedine Zidane", "Ronaldinho", "Neymar Jr", "Kylian Mbappé",
    "Tom Brady", "Patrick Mahomes", "Simone Biles", "Michael Phelps", "Valentino Rossi", "Ayrton Senna",
    "Stephen Curry", "Magic Johnson", "Larry Bird", "Kareem Abdul-Jabbar", "Venus Williams", "Maria Sharapova",
    // Business & Tech
    "Steve Jobs", "Elon Musk", "Bill Gates", "Jeff Bezos", "Mark Zuckerberg", "Warren Buffett",
    "Richard Branson", "Oprah Winfrey", "Henry Ford", "Walt Disney", "Larry Page", "Sergey Brin",
    "Jack Ma", "Tim Cook", "Sheryl Sandberg", "Larry Ellison", "Bernard Arnault", "Amancio Ortega",
    // Arts & Literature
    "Pablo Picasso", "Vincent van Gogh", "Claude Monet", "Salvador Dalí", "Frida Kahlo", "Andy Warhol",
    "William Shakespeare", "Charles Dickens", "Ernest Hemingway", "Mark Twain", "J.K. Rowling", "Stephen King",
    "George Orwell", "Agatha Christie", "Oscar Wilde", "Leo Tolstoy", "Edgar Allan Poe", "Virginia Woolf",
    // Modern Icons & TV
    "Barack Obama", "Michelle Obama", "Donald Trump", "Joe Biden", "Vladimir Putin", "Pope Francis",
    "Dalai Lama", "Princess Diana", "Queen Elizabeth II", "Prince William", "Kate Middleton", "Prince Harry",
    "Meghan Markle", "Kim Kardashian", "Kylie Jenner", "Kendall Jenner", "Kourtney Kardashian", "Khloé Kardashian",
    "Ellen DeGeneres", "Jimmy Fallon", "Jimmy Kimmel", "Conan O'Brien", "Gordon Ramsay", "Jamie Oliver",
    "David Attenborough", "Bear Grylls", "Malala Yousafzai", "Greta Thunberg", "Edward Snowden", "Julian Assange"
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
        // Optimistic UI for start
        const optimRoom = { ...room!, status: 'playing' as const, current_round: 1 }
        useGameStore.setState({ room: optimRoom })

        // Trigger the change for everyone else
        await supabase.from('rooms').update({ status: 'playing', current_round: 1 }).eq('id', room!.id)
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
                                    className="mt-10 px-8 py-4 bg-white text-black font-black uppercase rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:bg-white/90 transition hover:scale-105"
                                >
                                    Start Game
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {!ready && discarded.length === 2 && (
                <div className="fixed bottom-10 left-0 w-full flex justify-center z-[100] px-6">
                    <motion.button
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={validateSelection}
                        className="w-full max-w-sm py-4 rounded-2xl bg-white text-black font-bold text-xl hover:bg-white/90 transition shadow-[0_0_50px_rgba(255,255,255,0.8)] border border-white"
                    >
                        Confirm Final Deck
                    </motion.button>
                </div>
            )}
        </motion.div>
    )
}
