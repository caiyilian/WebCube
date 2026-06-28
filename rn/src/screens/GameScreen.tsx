import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRoute } from '@react-navigation/native'

export default function GameScreen() {
  const route = useRoute<any>()
  const { mode, cubeSize } = route.params || { mode: 'practice', cubeSize: 3 }

  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerElapsed, setTimerElapsed] = useState(0)
  const [moveCount, setMoveCount] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
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

  const handleMove = () => {
    if (!isTimerRunning) startTimer()
    setMoveCount(prev => prev + 1)
  }

  const formatTime = (ms: number) => {
    const seconds = (ms / 1000).toFixed(3)
    return `${seconds}s`
  }

  return (
    <View style={styles.container}>
      <View style={styles.hud}>
        <Text style={styles.timer}>{formatTime(timerElapsed)}</Text>
        <Text style={styles.moves}>{moveCount} 步</Text>
      </View>

      <View style={styles.canvasContainer}>
        <View style={styles.cubePlaceholder}>
          <Text style={styles.placeholderText}>3D Cube ({cubeSize}×{cubeSize}×{cubeSize})</Text>
          <Text style={styles.placeholderText}>Mode: {mode}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>旋转面:</Text>
          {['R', 'L', 'U', 'D', 'F', 'B'].map(face => (
            <TouchableOpacity key={face} style={styles.controlBtn} onPress={handleMove}>
              <Text style={styles.controlBtnText}>{face}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionBtnText}>打乱</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={resetTimer}>
          <Text style={styles.actionBtnText}>重置</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionBtnText}>求解</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  moves: {
    fontSize: 14,
    color: '#888',
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cubePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
  },
  controls: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  controlLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  controlBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
  },
})
