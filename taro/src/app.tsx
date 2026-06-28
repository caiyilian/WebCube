import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import './app.css'

function App({ children }) {
  useEffect(() => {
    // Initialize app
    console.log('WebCube Taro App initialized')
  }, [])

  return children
}

export default App
