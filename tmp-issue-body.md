## 目标
搭建 Express + Socket.IO 服务端，支持 WebSocket 连接。

## 验收目标
- 服务端启动后可接收 WebSocket 连接
- 基本事件收发正常（connection、disconnect、自定义事件）
- 支持 CORS（前端开发服务器跨域访问）

## 关联章节
- 方案.md 第五节：多人联机方案

## 技术要点
1. Express HTTP 服务 + Socket.IO 集成
2. 基本事件：connection、disconnect、create-room、join-room
3. CORS 配置允许前端 dev server 访问
4. 端口 3000
