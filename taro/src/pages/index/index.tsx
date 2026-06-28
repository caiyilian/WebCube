import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button, Picker, Canvas } from '@tarojs/components'
import './index.css'

export default function Index() {
  const [mode, setMode] = useState('practice')
  const [cubeSize, setCubeSize] = useState(3)
  const [isConnected, setIsConnected] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    // Initialize WebSocket connection
    initConnection()
  }, [])

  const initConnection = () => {
    try {
      const ws = Taro.connectSocket({
        url: 'ws://localhost:3000'
      })
      ws.onOpen(() => {
        setIsConnected(true)
        console.log('WebSocket connected')
      })
      ws.onClose(() => {
        setIsConnected(false)
      })
    } catch (err) {
      console.log('WebSocket not available (H5 mode)')
    }
  }

  const handleModeChange = (e) => {
    setMode(e.detail.value)
  }

  const handleSizeChange = (e) => {
    setCubeSize(parseInt(e.detail.value))
  }

  const startGame = () => {
    Taro.navigateTo({
      url: `/pages/game/mode=${mode}&size=${cubeSize}`
    })
  }

  return (
    <View className="home-container">
      <View className="home-content">
        <Text className="home-title">WebCube</Text>
        <Text className="home-subtitle">网页版魔方游戏</Text>
        
        <View className="home-sizes">
          <Text>魔方阶数：</Text>
          <View className="home-size-buttons">
            <Button 
              className={`home-size-btn ${cubeSize === 2 ? 'active' : ''}`}
              onClick={() => setCubeSize(2)}
            >2×2</Button>
            <Button 
              className={`home-size-btn ${cubeSize === 3 ? 'active' : ''}`}
              onClick={() => setCubeSize(3)}
            >3×3</Button>
            <Button 
              className={`home-size-btn ${cubeSize === 4 ? 'active' : ''}`}
              onClick={() => setCubeSize(4)}
            >4×4</Button>
          </View>
        </View>
        
        <View className="home-modes">
          <Button className="home-mode-card" onClick={() => { setMode('practice'); startGame(); }}>
            <Text>🧩</Text>
            <Text>练习模式</Text>
            <Text>单人练习，支持 AI 提示</Text>
          </Button>
          
          <Button className="home-mode-card" onClick={() => { setMode('battle'); startGame(); }}>
            <Text>⚔️</Text>
            <Text>1v1 对战</Text>
            <Text>实时竞速，谁先还原谁获胜</Text>
          </Button>
          
          <Button className="home-mode-card" onClick={() => { setMode('coop'); startGame(); }}>
            <Text>🤝</Text>
            <Text>协作模式</Text>
            <Text>2-4 人共同解一个魔方</Text>
          </Button>
        </View>
        
        <View className="home-footer">
          <Text>连接状态: {isConnected ? '已连接' : '未连接'}</Text>
          <Text>使用键盘 R/L/U/D/F/B 旋转，Shift 反转</Text>
        </View>
      </View>
    </View>
  )
}
