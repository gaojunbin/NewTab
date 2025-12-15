# NewTab v2.0

一个现代化的个人导航首页，采用 React + Node.js 前后端分离架构。

**基于 [SUI](https://github.com/jeroenpardon/sui) 重构**

## 特性

- **现代化UI** - Glassmorphism 设计风格，流畅动画效果
- **可视化编辑** - 在线添加/编辑/删除应用和书签
- **多搜索引擎** - Google、百度、Bing、GitHub、YouTube 等快捷搜索
- **实时天气** - 自动获取天气信息
- **多主题** - 10+ 预设主题，支持自定义颜色
- **响应式布局** - 适配桌面、平板、手机
- **数据持久化** - 后端 JSON 存储，支持导入导出
- **Docker 部署** - 一键启动

## 快速开始

### Docker Compose 一键部署（推荐）

```bash
# 克隆项目
git clone https://github.com/gaojunbin/NewTab.git
cd NewTab

# 启动服务
docker-compose up -d

# 访问
open http://localhost:8015
```

### 简化单容器部署

```bash
docker-compose -f docker-compose.simple.yml up -d
```

### 修改端口

编辑 `docker-compose.yml`:

```yaml
ports:
  - "你的端口:80"
```

## 功能说明

### 编辑模式

点击右下角的铅笔图标进入编辑模式，可以：
- 添加/编辑/删除应用
- 添加/编辑/删除书签分组
- 添加/编辑/删除分组

### 搜索功能

- 支持前缀命令快捷搜索：
  - `/g` - Google
  - `/bd` - 百度
  - `/bi` - Bing
  - `/gh` - GitHub
  - `/y` - YouTube
- 搜索建议自动补全
- 搜索历史记录

### 设置面板

点击右下角齿轮图标打开设置：
- **外观** - 主题模式、预设主题、自定义颜色、背景设置
- **布局** - 网格/列表/紧凑模式、字体大小
- **功能** - 时钟、天气、搜索框、问候语开关
- **备份** - 导出/导入配置、重置设置

## 项目结构

```
NewTab/
├── frontend/           # React 前端
│   ├── src/
│   │   ├── components/ # UI 组件
│   │   ├── stores/     # Zustand 状态
│   │   ├── services/   # API 服务
│   │   └── types/      # TypeScript 类型
│   └── package.json
├── backend/            # Node.js 后端
│   ├── src/
│   │   ├── routes/     # API 路由
│   │   └── index.js
│   └── data/           # JSON 数据文件
├── docker/             # Docker 配置
└── docker-compose.yml
```

## 本地开发

```bash
# 前端
cd frontend
npm install
npm run dev

# 后端
cd backend
npm install
npm run dev
```

## 技术栈

**前端**
- React 18 + TypeScript
- Vite 5
- TailwindCSS
- Framer Motion
- Zustand

**后端**
- Node.js 20
- Express

**部署**
- Docker + Nginx

## 数据配置

应用和书签数据存储在 `backend/data/` 目录：
- `apps.json` - 应用配置
- `links.json` - 书签配置
- `providers.json` - 搜索引擎配置

可直接编辑 JSON 文件或通过界面的编辑模式修改。

## License

MIT
