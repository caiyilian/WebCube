import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'

export default function HomeScreen() {
  const navigation = useNavigation<any>()
  const [cubeSize, setCubeSize] = useState(3)

  const startGame = (mode: string) => {
    navigation.navigate('Game', { mode, cubeSize })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WebCube</Text>
      <Text style={styles.subtitle}>网页版魔方游戏</Text>

      <View style={styles.sizeSelector}>
        <Text style={styles.sizeLabel}>魔方阶数:</Text>
        <View style={styles.sizeButtons}>
          {[2, 3, 4].map(size => (
            <TouchableOpacity
              key={size}
              style={[styles.sizeBtn, cubeSize === size && styles.sizeBtnActive]}
              onPress={() => setCubeSize(size)}
            >
              <Text style={styles.sizeBtnText}>{size}×{size}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.modes}>
        <TouchableOpacity style={styles.modeCard} onPress={() => startGame('practice')}>
          <Text style={styles.modeIcon}>🧩</Text>
          <Text style={styles.modeTitle}>练习模式</Text>
          <Text style={styles.modeDesc}>单人练习，支持 AI 提示</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.modeCard} onPress={() => startGame('battle')}>
          <Text style={styles.modeIcon}>⚔️</Text>
          <Text style={styles.modeTitle}>1v1 对战</Text>
          <Text style={styles.modeDesc}>实时竞速，谁先还原谁获胜</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.modeCard} onPress={() => startGame('coop')}>
          <Text style={styles.modeIcon}>🤝</Text>
          <Text style={styles.modeTitle}>协作模式</Text>
          <Text style={styles.modeDesc}>2-4 人共同解一个魔方</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4da6ff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
  },
  sizeSelector: {
    marginBottom: 30,
  },
  sizeLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  sizeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sizeBtnActive: {
    backgroundColor: 'rgba(77, 166, 255, 0.3)',
    borderColor: '#4da6ff',
  },
  sizeBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  modes: {
    gap: 12,
    width: '100%',
  },
  modeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  modeDesc: {
    fontSize: 12,
    color: '#888',
  },
})
