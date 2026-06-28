import { TournamentManager, type Tournament } from '../../server/rooms/TournamentManager'

export interface TournamentPage {
  element: HTMLElement
}

export interface TournamentPageOptions {
  onBack: () => void
}

export function createTournamentPage(options: TournamentPageOptions): TournamentPage {
  const manager = new TournamentManager()
  let tournament: Tournament | null = null

  const element = document.createElement('div')
  element.className = 'tournament-page'
  element.innerHTML = `
    <div class="tournament-shell">
      <div class="room-header">
        <button class="room-back" data-action="back">返回</button>
        <div>
          <h1>锦标赛</h1>
          <p>单败淘汰 bracket</p>
        </div>
      </div>
      <div class="tournament-controls">
        <select class="room-code-input" data-size>
          <option value="4">4 人</option>
          <option value="8">8 人</option>
          <option value="16">16 人</option>
        </select>
        <button class="room-primary" data-action="create">创建锦标赛</button>
      </div>
      <section class="room-card" data-bracket hidden>
        <div class="room-game-state" data-status></div>
        <div class="tournament-bracket" data-rounds></div>
      </section>
    </div>
  `

  const render = () => {
    const bracket = element.querySelector('[data-bracket]') as HTMLElement
    const status = element.querySelector('[data-status]')!
    const rounds = element.querySelector('[data-rounds]')!
    bracket.hidden = !tournament
    if (!tournament) return

    status.textContent = tournament.champion
      ? `冠军：${tournament.champion.name}`
      : `第 ${tournament.currentRound + 1} 轮进行中`
    rounds.innerHTML = tournament.rounds.map((round, roundIndex) => `
      <section class="tournament-round">
        <h2>第 ${roundIndex + 1} 轮</h2>
        ${round.map((match) => `
          <div class="tournament-match">
            <span>${match.player1?.name ?? '待定'} vs ${match.player2?.name ?? '待定'}</span>
            <div>
              ${match.status === 'finished'
                ? `<strong>胜者：${match.winner?.name}</strong>`
                : `
                  <button class="room-secondary" data-winner="${match.player1?.id}" data-match="${match.id}">${match.player1?.name}</button>
                  <button class="room-secondary" data-winner="${match.player2?.id}" data-match="${match.id}">${match.player2?.name}</button>
                `}
            </div>
          </div>
        `).join('')}
      </section>
    `).join('')
  }

  element.querySelector('[data-action="back"]')?.addEventListener('click', options.onBack)
  element.querySelector('[data-action="create"]')?.addEventListener('click', () => {
    const maxPlayers = Number((element.querySelector('[data-size]') as HTMLSelectElement).value) as 4 | 8 | 16
    tournament = manager.createTournament('WebCube 锦标赛', maxPlayers)
    for (let i = 1; i <= maxPlayers; i++) {
      manager.addPlayer(tournament.id, { id: `p${i}`, name: `玩家 ${i}`, eliminated: false })
    }
    manager.startTournament(tournament.id)
    render()
  })
  element.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const matchId = target.dataset.match
    const winnerId = target.dataset.winner
    if (!tournament || !matchId || !winnerId) return
    manager.reportMatchResult(tournament.id, matchId, winnerId)
    tournament = manager.getTournament(tournament.id) ?? tournament
    render()
  })

  return { element }
}
