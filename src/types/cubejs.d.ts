declare module 'cubejs' {
  export class Cube {
    constructor()
    init(): Promise<void>
    setState(state: string): void
    solve(): string[]
    scramble(): string[]
  }
}
