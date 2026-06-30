import React from 'react'
import TestRenderer from 'react-test-renderer'
import HomeScreen from '../HomeScreen'

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}))

describe('HomeScreen', () => {
  it('renders without crashing', () => {
    const renderer = TestRenderer.create(<HomeScreen />)
    expect(renderer.root).toBeTruthy()
  })

  it('renders title WebCube', () => {
    const renderer = TestRenderer.create(<HomeScreen />)
    const text = JSON.stringify(renderer.toJSON())
    expect(text).toContain('WebCube')
  })

  it('renders mode selection', () => {
    const renderer = TestRenderer.create(<HomeScreen />)
    const text = JSON.stringify(renderer.toJSON())
    expect(text).toContain('练习模式')
    expect(text).toContain('1v1 对战')
    expect(text).toContain('协作模式')
  })

  it('renders size buttons', () => {
    const renderer = TestRenderer.create(<HomeScreen />)
    const text = JSON.stringify(renderer.toJSON())
    // Each size button renders as array ["2","×","2"] in JSON output
    expect(text).toContain('2')
    expect(text).toContain('3')
    expect(text).toContain('4')
    expect(text).toContain('×')
  })
})
