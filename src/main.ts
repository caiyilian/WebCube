import './styles/globals.css'
import { createApp } from './game/app'

const app = createApp()
document.getElementById('app')!.appendChild(app)
