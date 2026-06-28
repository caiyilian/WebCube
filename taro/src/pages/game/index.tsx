import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button, Canvas } from '@tarojs/components'
import './game.css'

export default function Game() {
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerElapsed, setTimerElapsed] = useState(0)
  const [moveCount, setMoveCount] = useState(0)
  const [selectedFace, setSelectedFace] = useState(null)
  const [currentHint, setCurrentHint] = useState(null)
  const [mode, setMode] = useState('practice')
  const [cubeSize, setCubeSize] = useState(3)
  const timerRef = useRef(null)

  useEffect(() => {
    // Parse URL params
    const params = Taro.getCurrentInstance().router?.params
    if (params) {
      setMode(params.mode || 'practice')
      setCubeSize(parseInt(params.size) || 3)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startTimer = () => {
    if (isTimerRunning) return
    setIsTimerRunning(true)
    const startTime = Date.now() - timerElapsed
    timerRef.current = setInterval(() => {
      setTimerElapsed(Date.now() - startTime)
    }, 100)
  }

  const stopTimer = () => {
    setIsTimerRunning(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const resetTimer = () => {
    stopTimer()
    setTimerElapsed(0)
    setMoveCount(0)
  }

  const handleMove = (face, direction) => {
    if (!isTimerRunning) startTimer()
    setMoveCount(prev => prev + 1)
    // In a real implementation, this would update the cube state
  }

  const formatTime = (ms) => {
    const seconds = (ms / 1000).toFixed(3)
    return `${seconds}s`
  }

  return (
    <View className="game-container">
      <View className="hud-container">
        <View className="hud-row">
          <Text className="hud-timer">{formatTime(timerElapsed)}</Text>
          <Text className="hud-moves">{moveCount} 步</Text>
        </View>
        <View className="hud-row hud-buttons">
          <Button className="hud-btn" onClick={() => {}}>打乱</Button>
          <Button className="hud-btn" onClick={resetTimer}>重置</Button>
          <Button className="hud-btn" onClick={() => {}}>求解</Button>
          {mode === 'practice' && (
            <Button className="hud-btn" onClick={() => {}}>提示</Button>
          )}
          <Button className="hud-btn" onClick={() => {}}>撤销</Button>
          <Button className="hud-btn" onClick={() => {}}>重做</Button>
        </View>
      </View>

      <View className="canvas-container">
        <Canvas
          type="webgl"
          className="game-canvas"
          style="width: 100%; height: 400px;"
        />
        <View className="cube-placeholder">
          <Text>3D Cube ({cubeSize}×{cubeSize}×{cubeSize})</Text>
          <Text>Mode: {mode}</Text>
          <Text>当前小程序版本使用 WebGL 占位，后续接入 MiniProgramRenderer。</Text>
        </View>
      </View>

      <View className="controls-container">
        <View className="control-row">
          <Text>旋转面：</Text>
          {['R', 'L', 'U', 'D', 'F', 'B'].map(face => (
            <Button
              key={face}
              className={`control-btn ${selectedFace === face ? 'active' : ''}`}
              onClick={() => setSelectedFace(face)}
            >
              {face}
            </Button>
          ))}
        </View>
        {selectedFace && (
          <View className="control-row">
            <Text>旋转方向：</Text>
            <Button className="control-btn" onClick={() => handleMove(selectedFace, 1)}>顺时针</Button>
            <Button className="control-btn" onClick={() => handleMove(selectedFace, -1)}>逆时针</Button>
          </View>
        )}
      </View>

      <View className="settings-container">
        <Button className="settings-toggle" onClick={() => {}}>⚙️</Button>
      </View>
    </View>
  )
}
