# WebCube

> WebCube - 网页版魔方游戏，支持多人联机、协作解魔方、AI 智能提示、桌面端应用

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/language-TypeScript-3178c6.svg)
![Three.js](https://img.shields.io/badge/3D-Three.js-000000.svg)

## 功能特性

### 核心玩法
- **3D 魔方交互** - Three.js 渲染，鼠标拖拽 + 键盘操作
- **打乱 / 重置** - 一键打乱，一键还原
- **自动求解** - Kociemba 两阶段算法，≤20 步最优解
- **计时器** - 精确计时 + 操作计数
- **操作历史** - Undo/Redo 无限撤销

### 多人模式
- **1v1 对战** - 实时竞速，谁先还原谁获胜
- **协作解魔方** - 2-4 人共同解一个魔方
- **房间系统** - 创建/加入/观战
- **匹配系统** - 随机匹配对手
- **排行榜** - ELO 段位制

### AI 提示系统
- **智能提示** - 根据当前状态给出最优下一步
- **视觉暗示** - 高亮旋转层 + 方向箭头
- **级别可选** - Level 1/2/3 不同提示详细度
- **防作弊** - 仅练习模式可用，多人模式禁用

### 桌面端
- **跨平台应用** - Windows / macOS / Linux 原生桌面应用
- **内嵌服务器** - 单进程运行，无需额外搭建 Node 环境
- **系统托盘** - 最小化到托盘，后台运行
- **全局快捷键** - Ctrl+Shift+W 切换窗口，Ctrl+Shift+R 强制刷新
- **原生菜单** - 编辑/视图/窗口/帮助菜单

### 部署方式
- **局域网模式** - 零部署，自己的电脑就是服务器
- **内网穿透** - ngrok / frp / cloudflared 支持

## 技术栈

| 层级 | 技术 |
|------|------|
| 构建 | Vite |
| 语言 | TypeScript |
| 3D 渲染 | Three.js |
| 状态管理 | 原生 Store 类 |
| 网络 | Socket.IO + WebRTC (P2P) |
| 后端 | Node.js + Express |
| 求解器 | cubejs Worker (Kociemba) |
| 测试 | Vitest + Jest |
| 桌面端 | Electron + electron-builder |

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/caiyilian/WebCube.git
cd WebCube

# 安装依赖
npm install

# 启动前端 (开发模式)
npm run dev

# 启动后端 (另一个终端)
npm run server

# 访问
# http://localhost:5173 (前端)
# http://localhost:3000 (后端)

# 启动 Electron 桌面端 (开发模式，自动启动前后端)
npm run electron:dev

# 打包桌面安装程序
npm run electron:build
```

### 局域网部署

```bash
# 1. 启动后端（你的电脑作为服务器）
npm run server
# → 运行在 http://localhost:3000

# 2. 启动前端
npm run dev
# → 本机访问 http://localhost:5173

# 3. 同一局域网内的其他设备访问
# 查看你的局域网 IP: ipconfig (Windows) 或 ifconfig (Mac/Linux)
# 其他设备访问: http://<你的IP>:5173
# 例如: http://192.168.1.100:5173
```

### 内网穿透（让外网朋友也能玩）

```bash
# 方法1: ngrok（最简单）
npx ngrok http 5173
# → 生成公网 URL，如 https://xxxx.ngrok-free.app

# 方法2: frp（自部署，延迟更低）
# 在 frps.ini 中添加:
# [web]
# type = tcp
# local_ip = 127.0.0.1
# local_port = 5173
# remote_port = 6000
# 外网访问: http://<服务器IP>:6000

# 方法3: cloudflared（免费隧道）
npx cloudflared tunnel --url http://localhost:5173
# → 生成公网 URL
```

### 常见问题

- **连接失败**: 检查防火墙是否放行 5173 和 3000 端口
- **延迟高**: 确保设备在同一局域网，或使用有线连接
- **画面卡顿**: 降低浏览器画质设置

## Electron 桌面端

WebCube 支持打包为 Windows / macOS / Linux 原生桌面应用，无需额外搭建 Node 环境。

### 前提条件

```bash
npm install
```

### 开发模式启动

Electron 开发模式会自动启动 Vite 前端 + 内嵌后端服务器（端口 3001），单窗口运行：

```bash
npm run electron:dev
```

### 构建安装包

```bash
# 构建生产版本（Vite + Electron）
npm run electron:build
```

构建产物在 `release/` 目录：

| 平台 | 产物 | 说明 |
|------|------|------|
| Windows | `release/WebCube-{version}-portable.exe` | 便携版，双击即用，无需安装 |
| Windows | `release/win-unpacked/WebCube.exe` | 解压版，直接运行 |
| macOS | `release/mac/WebCube.app` | 需在 macOS 上构建 |
| Linux | `release/linux-unpacked/webcube` | 需在 Linux 上构建 |

> **注意**：Windows NSIS 安装包和 macOS DMG 镜像需要外网下载打包工具，如果网络受限，推荐使用便携版（portable）。

### 设置说明

- **后端模式**：在设置面板（⚙️）的「桌面设置」中可选择「内嵌服务器」或「外部服务器」
- **内嵌模式**：启动时自动启动后端，无需手动执行 `npm run server`
- **外部模式**：可连接已有局域网/公网后端服务器
- **快捷键**：`Ctrl+Shift+W` 切换窗口显示/隐藏，`Ctrl+Shift+R` 强制刷新
- **托盘**：关闭窗口默认最小化到系统托盘，右键托盘图标可退出

## Taro 小程序

WebCube 使用 Taro 框架支持微信小程序和 H5 多端构建。

### 子项目结构

```
taro/
├── src/
│   ├── pages/
│   │   ├── index/          # 首页（阶数选择、模式选择）
│   │   └── game/           # 游戏页（WebGL 渲染 + 计时器）
│   ├── utils/
│   │   ├── MiniProgramSocket.ts   # 小程序 WebSocket 封装
│   │   ├── MiniProgramRenderer.ts # 小程序 3D 渲染封装
│   │   └── PerformanceOptimizer.ts# 小程序性能优化
│   └── app.config.ts       # 小程序全局配置
```

### 构建 H5 版本

```bash
cd taro
npm install
npm run build:h5
# 产物在 taro/dist/，可直接部署到任何 Web 服务器
```

### 构建微信小程序版本

```bash
cd taro
npm install
npm run build:weapp
# 产物在 taro/dist/（app.js, app.json, app.wxss, pages/ 等）
```

### 在微信开发者工具中运行

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具 → 选择「导入项目」
3. 项目目录选择 `taro/dist/`
4. 填入你的 AppID（或使用测试号）
5. 点击「导入」即可预览

### 注意事项

- 小程序 WebGL 渲染使用 `MiniProgramRenderer.ts` 进行占位适配
- 小程序 WebSocket 使用 `MiniProgramSocket.ts` 自动适配 `wx.connectSocket`
- 如果使用测试号，部分功能（如云函数）可能受限
- H5 版本功能完整，推荐优先使用 H5 预览

## 运行测试

```bash
# 运行所有测试
npm run test:run

# 运行测试并生成覆盖率报告
npm run test:coverage

# 仅运行前端测试
npm run test:client

# 仅运行服务端测试
npm run test:server

# React Native 子项目测试
cd rn && npm test
```

## 项目结构

```
WebCube/
├── src/
│   ├── components/          # UI 组件（HUD、Canvas、HomePage 等）
│   ├── game/                # 游戏逻辑（CubeRenderer、Interaction 等）
│   ├── net/                 # 网络层（RoomClient 等）
│   ├── stores/              # 状态管理（useGameStore、useRoomStore）
│   └── __tests__/           # 前端测试
├── server/
│   ├── index.ts             # Express + Socket.IO
│   ├── rooms/               # 房间/匹配/锦标赛管理
│   └── __tests__/           # 服务端测试
├── shared/
│   └── types.ts             # 前后端共享类型
├── rn/                      # React Native 子项目
├── taro/                    # Taro 小程序子项目
├── electron/                # Electron 桌面端（主进程、预加载、内嵌服务器）
└── workers/                 # Web Worker（求解器）
```

## 游戏模式

| 模式 | 说明 | 人数 |
|------|------|------|
| **练习模式** | 单机解魔方，支持 AI 提示 | 1 人 |
| **1v1 对战** | 实时竞速，谁先还原谁获胜 | 2 人 |
| **协作模式** | 共同解一个魔方 | 2-4 人 |

## 功能完成度

| 模块 | 功能 | 状态 |
|------|------|------|
| **单机核心** | 3D 魔方渲染、交互、打乱、重置 | ✅ 完成 |
| | 自动求解（Kociemba Worker） | ✅ 完成 |
| | 计时器、操作计数、Undo/Redo | ✅ 完成 |
| | 提示系统（Level 1/2/3） | ✅ 完成 |
| | 移动端触摸适配 | ✅ 完成 |
| **多人联机** | Express + Socket.IO 服务端 | ✅ 完成 |
| | 房间创建/加入/离开/观战 | ✅ 完成 |
| | 1v1 实时对战 | ✅ 完成 |
| | 匹配系统（随机匹配） | ✅ 完成 |
| | 排行榜（ELO）+ 个人统计 | ✅ 完成 |
| | 房间聊天 | ✅ 完成 |
| **协作模式** | 协作房间（2-4 人） | ✅ 完成 |
| | 共享魔方状态同步 | ✅ 完成 |
| | 轮流/自由模式 | ✅ 完成 |
| | 团队计时 + 操作统计 | ✅ 完成 |
| **扩展功能** | 2×2 / 3×3 / 4×4 魔方 | ✅ 完成 |
| | CFOP 训练模式 | ✅ 完成 |
| | 回放系统 | ✅ 完成 |
| | AI 对手（easy/medium/hard） | ✅ 完成 |
| | 锦标赛模式 | ✅ 完成 |
| | 自定义主题（classic/neon/soft） | ✅ 完成 |
| | 音效系统 | ✅ 完成 |
| **跨平台** | Taro H5/小程序构建 | ✅ 完成 |
| | React Native 基础版本 | ✅ 完成 |
| **桌面端** | Electron 主进程 + IPC 桥 | ✅ 完成 |
| | 跨平台打包（Windows/macOS/Linux） | ✅ 完成 |
| | 内嵌服务器模式 | ✅ 完成 |
| | 系统托盘 + 全局快捷键 | ✅ 完成 |
| **质量** | 测试框架（150+ 用例） | ✅ 完成 |

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 许可证

[MIT](LICENSE) © 2026 WebCube

## 致谢

- [Three.js](https://threejs.org/) - 3D 渲染引擎
- [cubejs](https://github.com/ldez/cubejs) - Kociemba 求解器
- [cubing.js](https://github.com/cubing/cubing.js) - 专业魔方库
- [Electron](https://www.electronjs.org/) - 桌面应用框架
- 所有开源魔方社区的贡献者
