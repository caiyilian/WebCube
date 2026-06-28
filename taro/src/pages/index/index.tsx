import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { MiniProgramSocket } from '../../utils/MiniProgramSocket'
import './index.css'

export default function Index() {
  const [mode, setMode] = useState('practice')
  const [cubeSize, setCubeSize] = useState(3)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<MiniProgramSocket | null>(null)

  useEffect(() => {
    // Initialize WebSocket connection
    initConnection()
  }, [])

  const initConnection = () => {
    const socket = new MiniProgramSocket()
    socketRef.current = socket
    socket.onOpen(() => setIsConnected(true))
    socket.onClose(() => setIsConnected(false))
    socket.onError(() => setIsConnected(false))
    socket.connect('ws://localhost:3000')
  }

  const startGame = (nextMode = mode) => {
    Taro.navigateTo({
      url: `/pages/game/index?mode=${nextMode}&size=${cubeSize}`
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
          <Button className="home-mode-card" onClick={() => { setMode('practice'); startGame('practice'); }}>
            <Text>🧩</Text>
            <Text>练习模式</Text>
            <Text>单人练习，支持 AI 提示</Text>
          </Button>
          
          <Button className="home-mode-card" onClick={() => { setMode('1v1'); startGame('1v1'); }}>
            <Text>⚔️</Text>
            <Text>1v1 对战</Text>
            <Text>实时竞速，谁先还原谁获胜</Text>
          </Button>
          
          <Button className="home-mode-card" onClick={() => { setMode('coop'); startGame('coop'); }}>
            <Text>🤝</Text>
            <Text>协作模式</Text>
            <Text>2-4 人共同解一个魔方</Text>
          </Button>
        </View>
        
        <View className="home-footer">
          <Text>连接状态: {isConnected ? '已连接' : '未连接'}</Text>
          <Text>点击贴纸后使用方向键或 WASD 旋转</Text>
        </View>
      </View>
    </View>
  )
}
