/**
 * 小程序性能优化工具
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private memoryThreshold: number = 100 * 1024 * 1024 // 100MB
  private lastGC: number = 0

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  /**
   * 监控内存使用
   */
  monitorMemory(): void {
    if (typeof wx !== 'undefined' && wx.getPerformance) {
      const performance = wx.getPerformance()
      const memoryInfo = performance?.memory
      if (memoryInfo && memoryInfo.jsHeapSizeLimit > this.memoryThreshold) {
        this.triggerGC()
      }
    }
  }

  /**
   * 触发垃圾回收
   */
  private triggerGC(): void {
    const now = Date.now()
    if (now - this.lastGC < 30000) return // Don't GC too frequently
    this.lastGC = now

    if (typeof wx !== 'undefined' && wx.triggerGC) {
      wx.triggerGC()
    }
  }

  /**
   * 图片压缩
   */
  compressImage(src: string, quality: number = 0.7): Promise<string> {
    return new Promise((resolve) => {
      if (typeof wx !== 'undefined' && wx.compressImage) {
        wx.compressImage({
          src,
          quality: quality * 100,
          success: (res) => resolve(res.tempFilePath),
          fail: () => resolve(src)
        })
      } else {
        resolve(src)
      }
    })
  }

  /**
   * 分包加载配置
   */
  getSubpackagesConfig(): any {
    return {
      root: 'pages',
      subpackages: [
        {
          root: 'pages/game',
          pages: ['index']
        },
        {
          root: 'pages/settings',
          pages: ['index']
        }
      ]
    }
  }

  /**
   * 预加载关键资源
   */
  preloadResources(urls: string[]): void {
    if (typeof wx !== 'undefined' && wx.preloadAssets) {
      wx.preloadAssets({
        data: urls.map(url => ({ type: 'image', url }))
      })
    }
  }
}

export const perfOptimizer = PerformanceOptimizer.getInstance()
