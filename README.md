# NewTab v3.0

一个极简、高级的现代化个人导航首页，采用 React + Node.js 前后端分离架构。

**灵感源自 Apple 与 OpenAI 的克制美学设计，基于 [SUI](https://github.com/jeroenpardon/sui) 演进重构**

## 核心特性

- **极简高级设计系统** - 源自 Apple / OpenAI 的自适应毛玻璃材质、细腻微距边框与高阻尼弹簧微动画
- **全局命令面板 (`⌘K` / `Ctrl+K`)** - Spotlight 风格快速启动器，支持全局检索应用、书签、快捷动作与网页直达
- **站内即时混排搜索** - 主搜索框输入时实时展示匹配的站内应用与书签，回车直达，同时支持多搜索引擎建议与历史记录
- **双模式工作台布局** - 支持「双屏沉浸视图」与「单屏工作台视图」一键切换，以及「舒适网格」与「紧凑胶囊」卡片密度切换
- **分类筛选与分组折叠** - 顶部悬浮分类导航栏（带平滑共享布局动画），支持应用分组与书签分类独立折叠/展开
- **精选主题与系统自适应** - 内置 OpenAI Ivory / OpenAI Carbon / Apple Daylight / Apple Midnight 等 15 款主题预设，完整支持浅色、深色与跟随系统 (`auto`) 自动切换及自定义取色
- **智能实时天气与倒数日** - 集成 Open-Meteo + wttr.in 双源容灾天气（支持体感温度、最高/最低温、风速展开详情）与倒数日提醒胶囊
- **完善的安全认证与数据持久化** - 全链路 Bearer Token 编辑鉴权保护、乐观更新失败自动回滚、动态胶囊通知反馈（Toast）

## 快速开始

### Docker Compose 一键部署（推荐）

```bash
# 克隆项目
git clone https://github.com/gaojunbin/NewTab.git
cd NewTab

# 启动服务
docker compose up -d --build

# 访问
open http://localhost:8015
```

### 修改端口

编辑 `docker-compose.yml`:

```yaml
ports:
  - "你的端口:80"
```

## 快捷操作与搜索前缀

### 全局快捷键
- `⌘K` / `Ctrl+K` - 呼出全局 Spotlight 命令面板
- `/` - 聚焦主搜索框
- `Esc` - 关闭弹窗 / 清空过滤条件

### 搜索引擎前缀命令
- `/g` - Google
- `/bi` - Bing
- `/bd` - 百度
- `/gh` - GitHub
- `/y` - YouTube
- `/ai` - ChatGPT
- `/p` - Perplexity
- `/ns` - NodeSeek
- `/ld` - Linux.do
- `/f` - JunbinUniverse（站内应用与书签过滤）

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

## License

MIT
