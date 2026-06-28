# WebCube

> WebCube - 网页版魔方游戏，支持多人联机、协作解魔方、AI 智能提示

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

### 部署方式
- **局域网模式** - 零部署，自己的电脑就是服务器
- **内网穿透** - ngrok / frp / cloudflared 支持
- **公网部署** - Vercel + Railway 一键部署

## 技术栈

| 层级 | 技术 |
|------|------|
| 构建 | Vite |
| 语言 | TypeScript |
| 3D 渲染 | Three.js |
| 状态管理 | Zustand |
| 网络 | Socket.IO + WebRTC (P2P) |
| 后端 | Node.js + Express |
| 求解器 | cubejs (Kociemba) |

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

## 项目结构

```
WebCube/
├── src/
│   ├── components/          # UI 组件
│   │   ├── Canvas.tsx       # Three.js 画布
│   │   ├── HUD.tsx          # 计时器、操作计数
│   │   ├── Lobby.tsx    # 大厅/房间列表
│   │   ├── HintPanel.tsx    # 提示面板
│   │   └── RoomChat.tsx     # 房间聊天
│   ├── game/
│   │   ├── CubeState.ts     # 魔方逻辑状态
│   │   ├── CubeRenderer.ts  # Three.js 渲染
│   │   ├── Interaction.ts   # 鼠标/键盘交互
│   │   ├── Solver.ts        # 求解器封装
│   │   ├── Scramble.ts      # 打乱生成
│   │   └── HintEngine.ts    # 提示引擎
│   ├── net/
│   │   ├── RoomClient.ts    # Socket.IO 房间管理
│   │   ├── P2PManager.ts    # WebRTC P2P 连接
│   │   └── Sync.ts          # 状态同步逻辑
│   ├── stores/              # Zustand 状态管理
│   ├── pages/
│   │   ├── index.tsx        # 首页/单机
│   │   ├── battle/[id].tsx  # 对战房间
│   │   ├── coop/[id].tsx    # 协作房间
│   │   └── learn.tsx        # 教学模式
│   └── styles/
├── server/
│   ├── index.ts             # Express + Socket.IO
│   └── rooms/               # 房间管理
└── shared/
    └── types.ts             # 共享类型定义
```

## 游戏模式

| 模式 | 说明 | 人数 |
|------|------|------|
| **练习模式** | 单机解魔方，支持 AI 提示 | 1 人 |
| **1v1 对战** | 实时竞速，谁先还原谁获胜 | 2 人 |
| **协作模式** | 共同解一个魔方 | 2-4 人 |

## 路线图

- [x] 项目初始化与方案文档
- [x] **Phase 1：单机核心** (16 个子阶段)
- [x] **Phase 2：多人联机基础** (14 个子阶段)
- [ ] **Phase 3：协作模式** (7 个子阶段)
- [ ] **Phase 4：扩展功能** (9 个子阶段)
- [ ] **Phase 5：跨平台迁移** (8 个子阶段)

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
- 所有开源魔方社区的贡献者
