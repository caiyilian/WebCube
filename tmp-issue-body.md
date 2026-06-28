## 目标
实现房间创建、加入、离开的 Socket.IO 事件处理。

## 验收目标
- 客户端可创建房间（6位码）
- 其他客户端可通过房间号加入
- 客户端可离开房间
- 房间内玩家列表实时更新

## 关联章节
- 方案.md 第五节：多人联机方案

## 技术要点
1. Socket.IO 事件：create-room、join-room、leave-room
2. 房间状态广播：player-joined、player-left
3. 房间满员检查
4. 断线自动离开
