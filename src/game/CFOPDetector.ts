import { CubeState } from '@shared/types.js'

export type CFOPStep = 'cross' | 'f2l' | 'oll' | 'pll' | 'solved'

export interface CFOPProgress {
  cross: boolean
  f2l: boolean
  oll: boolean
  pll: boolean
  currentStep: CFOPStep
}

/**
 * Detect CFOP solving progress from cube state
 */
export function detectCFOPProgress(state: CubeState): CFOPProgress {
  const cross = detectCross(state)
  const f2l = cross && detectF2L(state)
  const oll = f2l && detectOLL(state)
  const pll = oll && detectPLL(state)

  let currentStep: CFOPStep = 'cross'
  if (pll) currentStep = 'solved'
  else if (oll) currentStep = 'pll'
  else if (f2l) currentStep = 'oll'
  else if (cross) currentStep = 'f2l'

  return { cross, f2l, oll, pll, currentStep }
}

/**
 * Check if white cross is complete (D face edges match center)
 */
function detectCross(state: CubeState): boolean {
  // D face center is yellow (index 4)
  const dCenter = state.D[4]
  // Check D face edges (indices 1, 3, 5, 7)
  const dEdges: string[] = [state.D[1], state.D[3], state.D[5], state.D[7]]
  // All D face stickers should be yellow
  return dEdges.every((c: string) => c === dCenter)
}

/**
 * Check if first two layers are complete
 */
function detectF2L(state: CubeState): boolean {
  // D face should be all yellow
  const dCenter = state.D[4]
  if (!state.D.every((c: string) => c === dCenter)) return false

  // Bottom two layers of side faces should be correct
  // F, R, B, L faces: indices 3,4,5 (bottom row)
  const fBottom = state.F.slice(6, 9)
  const rBottom = state.R.slice(6, 9)
  const bBottom = state.B.slice(6, 9)
  const lBottom = state.L.slice(6, 9)

  // Each bottom row should match its center
  const fCenter = state.F[4]
  const rCenter = state.R[4]
  const bCenter = state.B[4]
  const lCenter = state.L[4]

  return (
    fBottom.every((c: string) => c === fCenter) &&
    rBottom.every((c: string) => c === rCenter) &&
    bBottom.every((c: string) => c === bCenter) &&
    lBottom.every((c: string) => c === lCenter)
  )
}

/**
 * Check if OLL is complete (top face all same color)
 */
function detectOLL(state: CubeState): boolean {
  const uCenter = state.U[4]
  return state.U.every((c: string) => c === uCenter)
}

/**
 * Check if PLL is complete (top layer sides match)
 */
function detectPLL(state: CubeState): boolean {
  // U face should be all same color
  const uCenter = state.U[4]
  if (!state.U.every((c: string) => c === uCenter)) return false

  // Top layer of side faces should match their centers
  // F, R, B, L faces: indices 0,1,2 (top row)
  const fTop = state.F.slice(0, 3)
  const rTop = state.R.slice(0, 3)
  const bTop = state.B.slice(0, 3)
  const lTop = state.L.slice(0, 3)

  const fCenter = state.F[4]
  const rCenter = state.R[4]
  const bCenter = state.B[4]
  const lCenter = state.L[4]

  return (
    fTop.every((c: string) => c === fCenter) &&
    rTop.every((c: string) => c === rCenter) &&
    bTop.every((c: string) => c === bCenter) &&
    lTop.every((c: string) => c === lCenter)
  )
}

/**
 * Get description for current CFOP step
 */
export function getCFOPStepDescription(step: CFOPStep): string {
  switch (step) {
    case 'cross': return '完成白色十字（底层十字）'
    case 'f2l': return '完成前两层（F2L）'
    case 'oll': return '完成顶层朝向（OLL）'
    case 'pll': return '完成顶层排列（PLL）'
    case 'solved': return '魔方已还原！'
  }
}
