# Photo-Wall 代码地图（apps-code-map）

> 项目总导航枢纽（文件索引）。本文件只作导航与文档落点，不记录修改历史、阶段记录或执行结果。
> UI/UX 专项说明见 [uiux-map.md](./uiux-map.md)。

## 技术栈

Next.js 15（App Router）· React 19 · Three.js · React Three Fiber（R3F）· Drei · tunnel-rat · SCSS Modules。
静态导出：`next.config.js` 中 `output: 'export'`，产物落 `out/`。

## 核心架构一句话

全局唯一、固定全屏的 R3F `<Canvas>`（`src/three/Canvas.jsx`）由 `AppLayout` 持有；各页面只在 DOM 中放置 `<View>` 占位 `div`，其内部 3D 内容通过 `tunnel-rat`（`src/three/helpers/r3f.js` + `Tunnel.jsx`）被"搬运"进全局 Canvas 渲染，实现单 Canvas 多视图。

## 目录结构

```text
src/
├─ app/                         页面路由与根布局
│  ├─ layout.jsx                根布局：注入字体 / 样式 / metadata
│  ├─ page.jsx                  塔式 Tower（10 层 Billboard + Banner）
│  └─ paper/page.jsx            纸片布局
├─ components/
│  ├─ layout/AppLayout.jsx      固定 Canvas + Header + Footer 导航壳（包裹 ThemeProvider）
│  ├─ ui/modules/               Loader / Header / Footer + 统一出口 index.js
│  └─ theme/                    ThemeDirectory（全屏目录面板切换预设主题）
├─ context/ThemeContext.jsx     主题状态中心（仅预设主题、Provider、hook，localStorage 持久化当前主题）
├─ three/                       3D 核心域
│  ├─ Canvas.jsx                全局单 Canvas（r3f.Out + Preload all）
│  ├─ View.jsx                  drei View + tunnel 接入
│  ├─ materials/                自定义材质（MeshImage / MeshBanner）
│  ├─ scenes/                   Billboard / Banner / Paper
│  └─ helpers/                  r3f / Tunnel / getCanvasTexture
├─ hooks/useCollageTexture.jsx  拼图纹理 Hook
├─ data/                        themes.js（预设主题注册表）/ images.js（默认主题图片）/ metadata.js（SEO）
├─ styles/                      global.scss / _reset.scss / page.module.scss
└─ assets/fonts/font-faces.js   Geist 字体变量注册
```
> 静态资源按主题分目录：`public/photos/<主题id>/`（如 `public/photos/default/img1~33.webp`）。
> 新增预设主题：放图片到 `public/photos/<新id>/` 并在 `src/data/themes.js` 追加一条记录即可。

## 模块导航

### 页面路由 `src/app/`

| 文件 | 职责 |
|------|------|
| `layout.jsx` | 根布局：导入 `global.scss`、字体、metadata；`<Suspense>` 包裹 `AppLayout` |
| `page.jsx` | 塔式布局：10 层 Billboard + Banner 柱体，全景相机 `fov=7`；从 `useTheme()` 取 `activeTheme.images` |
| `paper/page.jsx` | 纸片布局：当前主题前 5 张纵向拼贴贴图（`axis:'y', gap:0`），`fov=20` |

### 布局与导航 `src/components/layout/`

| 文件 | 职责 |
|------|------|
| `AppLayout.jsx` | 持有滚动容器 `ref` 与 `usePathname` 路由高亮；`next/dynamic`（ssr:false）挂载固定全屏 Scene，并传入 `eventSource`/`eventPrefix="client"`；以 `ThemeProvider` 包裹全站，管理目录开合 state 并接入 `ThemeDirectory` |

### UI 模块 `src/components/ui/modules/`

| 文件 | 职责 |
|------|------|
| `index.js` | 统一出口，re-export `Loader` / `Header` / `Footer` |
| `Loader/Loader.jsx` + `Loader.module.scss` | 加载遮罩（全屏白底"加载中…"，文字呼吸动画） |
| `Header/RollingText.jsx` + `RollingText.module.scss` | 文字滚动悬停动效原子组件（复刻 gabrielcojea "Rolling Text Hover"）：挂载时拆字为逐字符 `inline-block` 的 `overflow:hidden` 容器，含 `.top` / `.bottom` 两份相同文字副本（`.bottom` 用 `--rolling-hover-color` 作 hover 强调色、`aria-hidden`）；悬停时 GSAP 逐字（`stagger`）上滚 `yPercent:-100` 露出 `.bottom`，离开反向滚回。`active` 选中态默认停在副本（高亮），hover 反向滚动一次。`as` 可指定标签，透传 `className`/`hoverColor`/`stagger`/`duration` |
| `Header/Header.jsx` + `Header.module.scss` | 顶部圆角胶囊导航条（`backdrop-blur` 毛玻璃 + 内描边）：左品牌名"照片墙"、右"主题目录"按钮（触发全屏目录面板）均经 `RollingText` 包裹实现滚动悬停动效；`active` 由 AppLayout 注入 `directoryOpen`，目录打开时按钮默认停在强调色副本（选中态），hover 时反向滚动一次 |
| `Footer/Footer.jsx` + `Footer.module.scss` | 底部导航栏（children 插槽；承载三个 `next/link` 切换） |

### 3D 核心 `src/three/`

| 文件 | 职责 |
|------|------|
| `Canvas.jsx` | 全局单 `<Canvas>`，渲染 `<r3f.Out/>` 与 `<Preload all/>` |
| `View.jsx` | drei `View` + tunnel 接入：占位 `div` 内容搬运进 Canvas；`orbit` 时挂 `OrbitControls` |
| `materials/index.js` | 注册 `MeshImageMaterial` / `MeshBannerMaterial`（`extend`） |
| `materials/MeshImageMaterial.js` | 自定义基础材质：背面 `gl_FrontFacing` 压暗 70% |
| `materials/MeshBannerMaterial.js` | 自定义基础材质：背面 `pal()` 余弦调色板着色，`backfaceRepeatX` 控制横向重复 |
| `scenes/Billboard.jsx` | 圆柱贴图柱体；`setupCylinderTextureMapping` 按周长自适应 repeat/offset |
| `scenes/Banner.jsx` | 横幅环；硬引用 `/banner.jpg`，背面彩条滚动 |
| `scenes/Paper.jsx` | 纸片 GLB（`/paper.glb`）+ 前 5 张拼贴纹理 |
| `helpers/r3f.js` | `tunnel-rat` 实例（全局单例） |
| `helpers/Tunnel.jsx` | `<Three>` 组件 = `r3f.In`，将子节点送入隧道 |
| `helpers/getCanvasTexture.js` | 多图拼合为单张 `CanvasTexture`（按 `axis`/`gap` 布局） |

### Hooks `src/hooks/`

| 文件 | 职责 |
|------|------|
| `useCollageTexture.jsx` | 封装 `getCanvasTexture`，返回 `{ texture, dimensions, isLoading, error }` |

### 主题系统 `src/context/` + `src/components/theme/`

| 文件 | 职责 |
|------|------|
| `context/ThemeContext.jsx` | 主题状态中心：仅 `presetThemes`（静态注册）；导出 `ThemeProvider` 与 `useTheme()`；`setActiveTheme(id)` 切换并持久化 `activeId` 到 `localStorage`；`activeTheme` 为派生当前主题 |
| `components/theme/ThemeDirectory.jsx` | 全屏目录面板（经 `createPortal` 渲染到 `body`，规避 Header 的 `mix-blend-mode` 影响）：列出全部预设主题（名称 + 图片数 · 预设 + 前 5 张缩略图），整行点击 `setActiveTheme` 并关闭；当前主题高亮；支持关闭按钮 / 点击遮罩 / Esc 关闭 |

### 数据 `src/data/`

| 文件 | 职责 |
|------|------|
| `themes.js` | 预设主题注册表 `presetThemes`：每项 `{ id, name, cover?, images:[{url}] }`；`default` 主题复用 `images.js` |
| `images.js` | 默认主题图片清单（33 项 `{ url:'/photos/default/imgN.webp' }`） |
| `metadata.js` | SEO metadata 导出 |

### 样式 `src/styles/`

| 文件 | 职责 |
|------|------|
| `global.scss` | 全局样式：引入 `_reset`、根 CSS 变量（`--color-text/--color-background`）、全局 `.loader`、链接态 |
| `_reset.scss` | 样式重置 |
| `page.module.scss` | 页面级样式（`.view` 占位容器尺寸等） |

### 资源 `src/assets/`

| 文件 | 职责 |
|------|------|
| `fonts/font-faces.js` | Geist 字体变量（CSS 变量类名）注册，供 `<html className={fontFaces}>` 使用 |

## 文档索引

- UI/UX 专项地图：[uiux-map.md](./uiux-map.md)（DOM/CSS 层 · 3D 视觉表现层 · 交互动画逻辑）
