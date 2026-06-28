export interface TournamentPlayer {
  id: string
  name: string
  eliminated: boolean
}

export interface TournamentMatch {
  id: string
  round: number
  player1: TournamentPlayer | null
  player2: TournamentPlayer | null
  winner: TournamentPlayer | null
  status: 'pending' | 'playing' | 'finished'
}

export interface Tournament {
  id: string
  name: string
  players: TournamentPlayer[]
  matches: TournamentMatch[]
  rounds: TournamentMatch[][]
  currentRound: number
  champion: TournamentPlayer | null
  status: 'setup' | 'playing' | 'finished'
  maxPlayers: 4 | 8 | 16
}

export class TournamentManager {
  private tournaments = new Map<string, Tournament>()

  createTournament(name: string, maxPlayers: 4 | 8 | 16): Tournament {
    const id = `tour-${Date.now()}`
    const tournament: Tournament = {
      id,
      name,
      players: [],
      matches: [],
      rounds: [],
      currentRound: 0,
      champion: null,
      status: 'setup',
      maxPlayers,
    }
    this.tournaments.set(id, tournament)
    return tournament
  }

  addPlayer(tournamentId: string, player: TournamentPlayer): boolean {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament || tournament.status !== 'setup') return false
    if (tournament.players.length >= tournament.maxPlayers) return false
    tournament.players.push(player)
    return true
  }

  startTournament(tournamentId: string): boolean {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament || tournament.status !== 'setup') return false
    if (tournament.players.length < 2) return false

    // Shuffle players
    const shuffled = [...tournament.players].sort(() => Math.random() - 0.5)

    // Create first round matches
    const firstRound: TournamentMatch[] = []
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        firstRound.push({
          id: `match-${tournament.currentRound}-${i / 2}`,
          round: tournament.currentRound,
          player1: shuffled[i],
          player2: shuffled[i + 1],
          winner: null,
          status: 'pending',
        })
      }
    }

    tournament.rounds.push(firstRound)
    tournament.matches = firstRound
    tournament.status = 'playing'
    return true
  }

  reportMatchResult(tournamentId: string, matchId: string, winnerId: string): boolean {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament || tournament.status !== 'playing') return false

    const match = tournament.matches.find((m) => m.id === matchId)
    if (!match || match.status !== 'pending') return false

    const winner = match.player1?.id === winnerId ? match.player1 : match.player2
    if (!winner) return false

    match.winner = winner
    match.status = 'finished'

    // Eliminate loser
    const loser = match.player1?.id === winnerId ? match.player2 : match.player1
    if (loser) {
      const player = tournament.players.find((p) => p.id === loser.id)
      if (player) player.eliminated = true
    }

    // Check if round is complete
    const currentRoundMatches = tournament.rounds[tournament.currentRound]
    if (currentRoundMatches.every((m) => m.status === 'finished')) {
      this.advanceRound(tournament)
    }

    return true
  }

  private advanceRound(tournament: Tournament): void {
    const currentRoundMatches = tournament.rounds[tournament.currentRound]
    const winners = currentRoundMatches.map((m) => m.winner!).filter(Boolean)

    if (winners.length === 1) {
      // Tournament finished
      tournament.champion = winners[0]
      tournament.status = 'finished'
      return
    }

    // Create next round
    tournament.currentRound++
    const nextRound: TournamentMatch[] = []
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        nextRound.push({
          id: `match-${tournament.currentRound}-${i / 2}`,
          round: tournament.currentRound,
          player1: winners[i],
          player2: winners[i + 1],
          winner: null,
          status: 'pending',
        })
      }
    }

    tournament.rounds.push(nextRound)
    tournament.matches = nextRound
  }

  getTournament(tournamentId: string): Tournament | undefined {
    return this.tournaments.get(tournamentId)
  }

  getBracket(tournamentId: string): TournamentMatch[][] {
    const tournament = this.tournaments.get(tournamentId)
    return tournament?.rounds || []
  }
}
