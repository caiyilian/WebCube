/**
 * WebGL 渲染器 - 兼容浏览器和小程序环境
 */
export class MiniProgramRenderer {
  private canvas: any
  private gl: any
  private width: number = 0
  private height: number = 0

  constructor(canvas: any) {
    this.canvas = canvas
    this.initGL()
  }

  private initGL(): void {
    // Try to get WebGL context
    const options = {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    }

    // Browser environment
    if (this.canvas.getContext) {
      this.gl = this.canvas.getContext('webgl', options) ||
               this.canvas.getContext('experimental-webgl', options)
    }
    // Mini program environment
    else if (this.canvas.createImage) {
      // Use mini program's WebGL
      this.gl = this.canvas.getContext('webgl', options)
    }

    if (!this.gl) {
      console.error('WebGL not supported')
    }
  }

  setSize(width: number, height: number): void {
    this.width = width
    this.height = height
    if (this.canvas) {
      this.canvas.width = width
      this.canvas.height = height
    }
    if (this.gl) {
      this.gl.viewport(0, 0, width, height)
    }
  }

  clear(r: number = 0, g: number = 0, b: number = 0, a: number = 1): void {
    if (!this.gl) return
    this.gl.clearColor(r, g, b, a)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
  }

  getContext(): any {
    return this.gl
  }

  getCanvas(): any {
    return this.canvas
  }

  dispose(): void {
    this.gl = null
    this.canvas = null
  }
}
