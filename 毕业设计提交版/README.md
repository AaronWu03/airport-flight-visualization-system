# 基于Cesium和ECharts的机场航班可视化查询软件

## 项目简介

本项目是一个基于WebGL的三维机场航班可视化查询系统。系统以Cesium三维地球引擎为核心，结合ECharts数据可视化库，实现了航班数据的空间可视化展示与交互式查询功能。

### 主要功能

- 航班实时查询（航班号/出发地/目的地）
- 三维地图展示（Cesium地球渲染、航线动画）
- 航班统计数据可视化（ECharts图表）
- 机场数据分析（起降架次、运力分布、航线排行）
- 航司信息展示（200+国内外航空公司识别）
- 历史行程记录

### 技术栈

- 前端：Vue 3.5 + Vite 8.0
- 三维渲染：Cesium ~1.99.0
- 数据可视化：ECharts 6.0
- HTTP通信：Axios 1.14
- 后端代理：Express + MCP协议

## 首次运行前：必须配置的API密钥

### 1. Cesium Ion Token（必需）

不配置此项，三维地图的地形和影像将无法加载。

**获取步骤：**
1. 访问 https://cesium.com/ion/
2. 注册账号并登录
3. 点击左侧 "Access tokens" 菜单
4. 复制 "default token" 值

**需要修改的文件（共2处）：**

| 文件路径 | 搜索内容 | 替换为 |
|---------|---------|--------|
| `src/views/AirportMap.vue` | `YOUR_CESIUM_ION_TOKEN_HERE` | 你的真实Token |
| `src/views/FlightDetail.vue` | `YOUR_CESIUM_ION_TOKEN_HERE` | 你的真实Token |

打开文件后搜索 `YOUR_CESIUM_ION_TOKEN_HERE`，将占位符替换为从Cesium Ion获取的Token字符串。

### 2. 飞常准API Key（可选，用于实时航班查询）

不配置此项，实时航班数据查询功能将无法使用，本地机场数据可视化不受影响。

**获取步骤：**
1. 访问 https://www.variflight.com/
2. 注册开发者账号
3. 在控制台获取API Key

**需要修改的文件：**

| 文件路径 | 修改内容 |
|---------|---------|
| `server/.env` | 将 `YOUR_KEY_HERE` 替换为真实API Key |

## 快速开始

### 1. 安装依赖

```bash
cd 源码
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 3. 启动后端代理（可选，用于实时航班查询）

```bash
cd server
npm install
node mcp-proxy.js
```

后端服务默认端口：3001

## 项目目录

```
源码/
├── src/                    # 前端源码
│   ├── api/                # API接口封装
│   ├── assets/             # 静态资源
│   ├── components/         # 公共组件
│   ├── data/               # 数据配置（航司映射等）
│   ├── router/             # 路由配置
│   ├── utils/              # 工具函数
│   └── views/              # 页面视图
├── public/                 # 公共资源（机场数据、航司Logo等）
├── server/                 # 后端代理服务
├── plugins/                # 自定义Vite插件
├── package.json            # 依赖配置
└── vite.config.js          # Vite构建配置
```

## 构建

```bash
npm run build        # 构建生产版本
npm run preview      # 预览构建产物
```

## 注意事项

- 需要Node.js >= 18.0.0
- 浏览器需支持WebGL（Chrome/Edge/Firefox）
- Cesium需要网络连接加载在线地形和影像
- 请勿将包含真实密钥的 `.env` 文件提交到公共仓库
