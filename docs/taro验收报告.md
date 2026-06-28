# Taro 功能验收报告

## 验收范围

- 首页可选择 2x2、3x3、4x4，并进入 practice / 1v1 / coop 游戏页。
- 游戏页显示计时、步数、基础操作按钮和 WebGL 占位。
- `MiniProgramSocket` 提供连接、发送、关闭和事件回调封装。
- 云函数 solver 对缺少或非法 `cubeState` 返回明确错误。
- H5 与 weapp 构建通过。

## 构建结果

- `cd taro && npm run build:h5`：通过，存在入口体积和 Autoprefixer browsers 配置警告。
- `cd taro && npm run build:weapp`：通过，存在 Autoprefixer browsers 配置警告。

## 输出目录

- H5 输出：`taro/dist/h5`
- 小程序输出：`taro/dist/weapp`

`taro/dist/weapp` 可作为微信开发者工具打开目录。
