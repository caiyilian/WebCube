declare module '@tarojs/taro' {
  export function connectSocket(options: any): any
  export function navigateTo(options: any): void
  export function getCurrentInstance(): any
}

declare module '@tarojs/components' {
  export const View: any
  export const Text: any
  export const Button: any
  export const Canvas: any
  export const Picker: any
}
