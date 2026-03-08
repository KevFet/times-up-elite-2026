import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Player {
    id: string
    room_id: string
    team_id: string | null
    name: string
    is_host: boolean
}

export interface Team {
    id: string
    room_id: string
    name: string
    color: string
    score: number
}

export interface Room {
    id: string
    code: string
    status: 'lobby' | 'preparation' | 'playing' | 'finished'
    current_round: number
}

export interface DeckCard {
    id: string
    room_id: string
    word: string
    status: 'available' | 'played' | 'discarded'
    round_played: number | null
}

interface GameState {
    player: Player | null
    room: Room | null
    teams: Team[]
    players: Player[]
    deck: DeckCard[]
    setPlayer: (player: Player | null) => void
    setRoom: (room: Room | null) => void
    setTeams: (teams: Team[]) => void
    setPlayers: (players: Player[]) => void
    setDeck: (deck: DeckCard[]) => void
}

export const useGameStore = create<GameState>()(
    persist(
        (set) => ({
            player: null,
            room: null,
            teams: [],
            players: [],
            deck: [],
            setPlayer: (player) => set({ player }),
            setRoom: (room) => set({ room }),
            setTeams: (teams) => set({ teams }),
            setPlayers: (players) => set({ players }),
            setDeck: (deck) => set({ deck }),
        }),
        {
            name: 'times-up-storage',
            partialize: (state) => ({ player: state.player, room: state.room }),
        }
    )
)
