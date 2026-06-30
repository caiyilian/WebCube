import React from 'react'
import TestRenderer from 'react-test-renderer'
import GameScreen from '../GameScreen'

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: { mode: 'practice', cubeSize: 3 },
  }),
}))

describe('GameScreen', () => {
  it('renders without crashing', () => {
    const renderer = TestRenderer.create(<GameScreen />)
    expect(renderer.root).toBeTruthy()
  })

  it('renders timer', () => {
    const renderer = TestRenderer.create(<GameScreen />)
    const text = JSON.stringify(renderer.toJSON())
    expect(text).toContain('0.000')
    expect(text).toContain('s')
  })

  it('renders move count', () => {
    const renderer = TestRenderer.create(<GameScreen />)
    const text = JSON.stringify(renderer.toJSON())
    expect(text).toContain('步')
  })

  it('renders action buttons', () => {
    const renderer = TestRenderer.create(<GameScreen />)
    const text = JSON.stringify(renderer.toJSON())
    expect(text).toContain('打乱')
    expect(text).toContain('重置')
    expect(text).toContain('求解')
  })

  it('renders face controls', () => {
    const renderer = TestRenderer.create(<GameScreen />)
    const text = JSON.stringify(renderer.toJSON())
    for (const face of ['R', 'L', 'U', 'D', 'F', 'B']) {
      expect(text).toContain(face)
    }
  })

  it('renders placeholder with size info', () => {
    const renderer = TestRenderer.create(<GameScreen />)
    const text = JSON.stringify(renderer.toJSON())
    // Children are arrays in JSON: ["3D Cube (","3","×","3","×","3",")"]
    expect(text).toContain('3D Cube')
    expect(text).toContain('×')
    expect(text).toContain('practice')
  })

  it('shows 3D unavailable notice', () => {
    const renderer = TestRenderer.create(<GameScreen />)
    const text = JSON.stringify(renderer.toJSON())
    expect(text).toContain('3D 渲染暂不可用')
    expect(text).toContain('Web 版支持完整 3D 体验')
  })
})
