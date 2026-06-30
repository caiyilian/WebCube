import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import HomeScreen from './src/screens/HomeScreen'
import GameScreen from './src/screens/GameScreen'

const Stack = createNativeStackNavigator()

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'WebCube' }} />
          <Stack.Screen name="Game" component={GameScreen} options={{ title: 'Game' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

export default App
