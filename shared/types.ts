// Shared types for WebCube

export type Color = 'white' | 'yellow' | 'green' | 'blue' | 'orange' | 'red'

export type Move = 'R' | "R'" | 'L' | "L'" | 'U' | "U'" | 'D' | "D'" | 'F' | "F'" | 'B' | "B'"

export interface CubeState {
  U: Color[]
  D: Color[]
  F: Color[]
  B: Color[]
  L: Color[]
  R: Color[]
}

export type GameMode = 'practice' | '1v1' | 'coop'

export interface Player {
  id: string
  name: string
  hintsUsed: number
}

export interface Room {
  id: string
  mode: GameMode
  host: string
  players: Player[]
  spectators: Player[]
  maxPlayers: number
  scramble: string | null
  status: 'waiting' | 'playing' | 'finished'
  createdAt: number
  settings: {
    hintEnabled: boolean
    timeLimit: number | null
    chatEnabled: boolean
  }
}
