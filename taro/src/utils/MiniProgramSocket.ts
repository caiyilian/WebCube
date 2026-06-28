/**
 * 小程序 WebSocket 封装
 * 兼容浏览器 WebSocket 和小程序 wx.connectSocket
 */
export class MiniProgramSocket {
  private socket: any = null
  private url: string = ''
  private onOpenCallback: (() => void) | null = null
  private onMessageCallback: ((data: any) => void) | null = null
  private onCloseCallback: (() => void) | null = null
  private onErrorCallback: ((error: any) => void) | null = null
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 3000

  connect(url: string): void {
    this.url = url
    this.doConnect()
  }

  private doConnect(): void {
    // Check if we're in a mini program environment
    if (typeof wx !== 'undefined' && wx.connectSocket) {
      this.connectMiniProgram()
    } else {
      this.connectBrowser()
    }
  }

  private connectMiniProgram(): void {
    this.socket = wx.connectSocket({
      url: this.url,
      success: () => {
        console.log('Mini program socket connecting...')
      },
      fail: (err: any) => {
        console.error('Mini program socket connect failed:', err)
        this.onErrorCallback?.(err)
      }
    })

    this.socket.onOpen(() => {
      this.isConnected = true
      this.reconnectAttempts = 0
      this.onOpenCallback?.()
    })

    this.socket.onMessage((res: any) => {
      this.onMessageCallback?.(res.data)
    })

    this.socket.onClose(() => {
      this.isConnected = false
      this.onCloseCallback?.()
      this.tryReconnect()
    })

    this.socket.onError((err: any) => {
      this.isConnected = false
      this.onErrorCallback?.(err)
    })
  }

  private connectBrowser(): void {
    try {
      this.socket = new WebSocket(this.url)

      this.socket.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        this.onOpenCallback?.()
      }

      this.socket.onmessage = (event: any) => {
        this.onMessageCallback?.(event.data)
      }

      this.socket.onclose = () => {
        this.isConnected = false
        this.onCloseCallback?.()
        this.tryReconnect()
      }

      this.socket.onerror = (error: any) => {
        this.isConnected = false
        this.onErrorCallback?.(error)
      }
    } catch (err) {
      console.error('Browser WebSocket failed:', err)
      this.onErrorCallback?.(err)
    }
  }

  private tryReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      this.doConnect()
    }, this.reconnectDelay)
  }

  send(data: any): void {
    const message = typeof data === 'string' ? data : JSON.stringify(data)

    if (this.socket && this.isConnected) {
      if (typeof wx !== 'undefined' && this.socket.send) {
        this.socket.send({ data: message })
      } else if (this.socket.send) {
        this.socket.send(message)
      }
    }
  }

  close(): void {
    if (this.socket) {
      if (typeof wx !== 'undefined' && this.socket.close) {
        this.socket.close()
      } else if (this.socket.close) {
        this.socket.close()
      }
    }
    this.isConnected = false
  }

  onOpen(callback: () => void): void {
    this.onOpenCallback = callback
  }

  onMessage(callback: (data: any) => void): void {
    this.onMessageCallback = callback
  }

  onClose(callback: () => void): void {
    this.onCloseCallback = callback
  }

  onError(callback: (error: any) => void): void {
    this.onErrorCallback = callback
  }

  isConnected(): boolean {
    return this.isConnected
  }
}
