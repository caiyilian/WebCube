/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

describe('mobile styles', () => {
  it('prevents browser touch gestures from stealing canvas interaction', () => {
    expect(css).toContain('canvas')
    expect(css).toContain('touch-action: none')
  })

  it('keeps the mobile HUD wrapped and scrollable', () => {
    expect(css).toContain('@media (max-width: 768px)')
    expect(css).toContain('max-height: 38vh')
    expect(css).toContain('overflow-y: auto')
    expect(css).toContain('flex: 1 1 calc(25% - 6px)')
  })
})
