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
│  ├─ page.jsx                  塔式 Tower（2D FloatingLines 背景 + 10 层 Billboard + Banner）
│  ├─ paper/page.jsx            纸片布局
│  └─ directory/page.jsx        主题目录页（mode="page" 的 ThemeDirectory）
├─ components/
│  ├─ background/               2D 背景层（固定全屏光场 / 网格 / 纹理，位于透明 3D Canvas 下方）
│  ├─ layout/AppLayout.jsx      固定 Canvas + Header + Footer 导航壳（包裹 ThemeProvider）
│  ├─ transition/               页面过渡动画层
│  │  └─ PageTransition.jsx     GSAP 全局过渡层 + Context：TUX 式快速垂直轻滑移 + 黑色遮罩 wipe，切页后等待首帧再释放黑幕
│  ├─ ui/modules/               Loader / Header / Footer + 统一出口 index.js
│  └─ theme/                    ThemeDirectory（全屏目录面板切换预设主题）
├─ context/ThemeContext.jsx     主题状态中心（仅预设主题、Provider、hook，localStorage 持久化当前主题）
├─ three/                       3D 核心域
│  ├─ Canvas.jsx                全局单 Canvas（r3f.Out + Preload all）
│  ├─ View.jsx                  drei View + tunnel 接入
│  ├─ materials/                自定义材质（MeshImage / MeshBanner）
│  ├─ scenes/                   FloatingLines / Billboard / Banner / Paper
│  └─ helpers/                  r3f / Tunnel / getCanvasTexture
├─ hooks/useCollageTexture.jsx  拼图纹理 Hook（按图片 URL 与参数缓存 CanvasTexture）
├─ data/                        themes.js（预设主题注册表）/ images.js（默认主题图片）/ metadata.js（SEO）
├─ styles/                      global.scss / _reset.scss / page.module.scss
└─ assets/fonts/font-faces.js   Geist 字体变量注册
```

> 静态资源按主题分目录：`public/photos/<主题id>/`（如 `public/photos/default/img1~33.webp`、`public/photos/fengjing-jianzhi/风景剪纸_1~17.png`）。
> 新增预设主题：放图片到 `public/photos/<新id>/` 并在 `src/data/themes.js` 追加一条记录即可。

## 模块导航

### 页面路由 `src/app/`

| 文件                 | 职责                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout.jsx`         | 根布局：导入 `global.scss`、字体、metadata；`<Suspense>` 包裹 `AppLayout`                                                                                 |
| `page.jsx`           | 塔式布局：10 层 Billboard + Banner 柱体，全景相机 `fov=7`；从 `useTheme()` 取 `activeTheme.images`；背景由 `BackgroundLayer` 承载，页面内不再挂载 3D 背景 |
| `paper/page.jsx`     | 纸片布局：当前主题前 5 张纵向拼贴贴图（`axis:'y', gap:0`），通过 `useMemo` 固定图片数组引用避免纹理重复生成，`fov=20`                                     |
| `directory/page.jsx` | 主题目录页：渲染 `ThemeDirectory` 的 `mode='page'` 版本；点击主题项切换主题并返回 `/`；关闭/返回按钮导航回 `/`                                            |

### 布局与导航 `src/components/layout/`

| 文件            | 职责                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppLayout.jsx` | 持有滚动容器 `ref`；挂载固定全屏 `BackgroundLayer` 作为 2D 背景；`next/dynamic`（ssr:false）挂载透明全屏 Scene，并传入 `eventSource`/`eventPrefix="client"`；以 `ThemeProvider` 包裹全站；页面内容经 `PageTransitionProvider` 包裹实现路由切换动画；Header「主题目录」与 Footer 视图切换均通过 `onNavigate` 回调触发路由；Footer 视图切换仅在 `/` 与 `/paper` 显示，主题目录 `/directory` 隐藏；不再维护目录面板 state |

### 背景系统 `src/components/background/`

| 文件                                                                          | 职责                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BackgroundLayer.jsx` + `BackgroundLayer.module.scss` + `FloatingLines2D.jsx` | 固定全屏 2D 背景层：读取当前主题与路由，输出塔式、纸片、目录页差异化的 CSS 光场、结构线、网格、纹理和首页 React Bits 风格漂浮线条；内部维护主题调色板映射并通过 CSS 变量与 shader 渐变驱动背景层；`pointer-events:none` 且 `aria-hidden`，位于透明 3D Canvas 下方 |

### UI 模块 `src/components/ui/modules/`

| 文件                                                 | 职责                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| `index.js`                                           | 统一出口，re-export `Loader` / `Header` / `Footer`                                                                                                                                                                                                                                                                                                                                                                                                           |
| `Loader/Loader.jsx` + `Loader.module.scss`           | 加载遮罩（全屏白底"加载中…"，文字呼吸动画）                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `Header/RollingText.jsx` + `RollingText.module.scss` | 文字滚动悬停动效原子组件（复刻 gabrielcojea "Rolling Text Hover"）：挂载时拆字为逐字符 `inline-block` 的 `overflow:hidden` 容器，含 `.top` / `.bottom` 两份相同文字副本（`.bottom` 用 `--rolling-hover-color` 作 hover 强调色、`aria-hidden`）；悬停时 GSAP 逐字（`stagger`）上滚 `yPercent:-100` 露出 `.bottom`，离开反向滚回。`active` 选中态默认停在副本（高亮），hover 反向滚动一次。`as` 可指定标签，透传 `className`/`hoverColor`/`stagger`/`duration` |
| `Header/Header.jsx` + `Header.module.scss`           | 顶部圆角胶囊导航条（`backdrop-blur` 毛玻璃 + 内描边）：左品牌名"照片墙"、右"主题目录"按钮（导航到 `/directory`）均经 `RollingText` 包裹实现滚动悬停动效；`pathname` 由 AppLayout 注入，当前路由为 `/directory` 时按钮默认停在强调色副本（选中态），hover 反向滚动一次                                                                                                                                                                                        | 时反向滚动一次 |
| `Footer/Footer.jsx` + `Footer.module.scss`           | 底部导航栏（children 插槽；承载塔式 `/` 与纸片 `/paper` 视图切换按钮，仅由 AppLayout 在 3D 视图页渲染，主题目录页不显示）                                                                                                                                                                                                                                                                                                                                    |

### 3D 核心 `src/three/`

| 文件                              | 职责                                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Canvas.jsx`                      | 全局单透明 `<Canvas>`，启用 `gl.alpha` 并清空 `scene.background`，只渲染经隧道进入的 3D 模型内容；内部渲染 `<r3f.Out/>` 与 `<Preload all/>`                  |
| `View.jsx`                        | drei `View` + tunnel 接入：占位 `div` 内容搬运进 Canvas；`orbit` 时挂 `OrbitControls`                                                                        |
| `materials/index.js`              | 注册 `MeshImageMaterial` / `MeshBannerMaterial`（`extend`）                                                                                                  |
| `materials/MeshImageMaterial.js`  | 自定义基础材质：背面 `gl_FrontFacing` 压暗 70%                                                                                                               |
| `materials/MeshBannerMaterial.js` | 自定义基础材质：背面 `pal()` 余弦调色板着色，`backfaceRepeatX` 控制横向重复                                                                                  |
| `scenes/FloatingLines.jsx`        | 备用 3D 背景增强层：三层 ribbon mesh 漂浮线，`ShaderMaterial` 双频波动、渐变发光、鼠标弯曲与分层视差；当前塔式页第一阶段已改由 2D `BackgroundLayer` 承载背景 |
| `scenes/Billboard.jsx`            | 圆柱贴图柱体；`setupCylinderTextureMapping` 按周长自适应 repeat/offset                                                                                       |
| `scenes/Banner.jsx`               | 横幅环；硬引用 `/banner.jpg`，背面彩条滚动                                                                                                                   |
| `scenes/Paper.jsx`                | 纸片 GLB（`/paper.glb`）+ 前 5 张拼贴纹理；通过 `scene.traverse()` 查找 Mesh，并使用 `MeshBasicMaterial` 避免无灯光时不可见                                  |
| `helpers/r3f.js`                  | `tunnel-rat` 实例（全局单例）                                                                                                                                |
| `helpers/Tunnel.jsx`              | `<Three>` 组件 = `r3f.In`，将子节点送入隧道                                                                                                                  |
| `helpers/getCanvasTexture.js`     | 多图拼合为单张 `CanvasTexture`（按 `axis`/`gap` 布局）                                                                                                       |

### Hooks `src/hooks/`

| 文件                    | 职责                                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useCollageTexture.jsx` | 封装 `getCanvasTexture`，按图片 URL 与 `{gap,canvasHeight,canvasWidth,axis}` 缓存 `CanvasTexture`，返回 `{ texture, dimensions, isLoading, error }` |

### 页面过渡 `src/components/transition/`

| 文件                                                | 职责                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PageTransition.jsx` + `PageTransition.module.scss` | 全局页面过渡动画层：监听 `usePathname()` 变化，通过 GSAP Timeline 实现 TUX 式「旧页面轻上滑 → 黑色遮罩平稳接管 → 新页面跟随遮罩滑入」wipe 过渡；切换 `displayChildren` 后通过双 `requestAnimationFrame` 等待新页面首帧提交，再释放黑幕，降低 3D/纹理首帧卡顿；提供 `usePageTransition()` Context；`onNavigate` prop 将实际路由跳转委托给调用方；支持 `prefers-reduced-motion`；动画期间缓存新导航请求，完成后自动执行 |

### 主题系统 `src/context/` + `src/components/theme/`

| 文件                                                                 | 职责                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context/ThemeContext.jsx`                                           | 主题状态中心：仅 `presetThemes`（静态注册）；导出 `ThemeProvider` 与 `useTheme()`；`setActiveTheme(id)` 切换并持久化 `activeId` 到 `localStorage`；`activeTheme` 为派生当前主题                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `components/theme/ThemeDirectory.jsx` + `ThemeDirectory.module.scss` | 主题目录组件，支持 `mode='overlay'`（遗留全屏覆盖层，经 `createPortal` 渲染到 `body`）与 `mode='page'`（独立页面 `/directory`）两种模式；标题栏 + 内容区 + 底部三段式 flex 布局；标题「主题目录」为可点击返回入口；支持 List/Editorial/Grid 三种视图切换，切换时使用 GSAP Flip 对同一图片做跨视图位移动画；List View 入场改为行元素单层 `y:64→0` + `opacity` stagger，避免列表容器与行元素双层大位移导致字体抖动；`.dot` 常驻占位，active 仅控制显隐，避免主题切换时名称横向位移；首屏列表缩略图 eager 加载并 async 解码；全动画链路支持 `prefers-reduced-motion` 直接显示最终态；page 模式下点击主题项或标题通过 `onNavigate` 回调返回 `/`，并经由 `PageTransition` 播放路由过渡 |

### 数据 `src/data/`

| 文件          | 职责                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `themes.js`   | 预设主题注册表 `presetThemes`：每项 `{ id, name, cover?, tags?, images:[{url}] }`；`default` 主题复用 `images.js`；`fengjing-jianzhi`（风景剪纸）主题包含 17 张 PNG |
| `images.js`   | 默认主题图片清单（33 项 `{ url:'/photos/default/imgN.webp' }`）                                                                                                     |
| `metadata.js` | SEO metadata 导出                                                                                                                                                   |

### 样式 `src/styles/`

| 文件               | 职责                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `global.scss`      | 全局样式：引入 `_reset`、根 CSS 变量（`--color-text/--color-background`）、全局 `.loader`、链接态 |
| `_reset.scss`      | 样式重置                                                                                          |
| `page.module.scss` | 页面级样式（`.view` 占位容器尺寸等）                                                              |

### 资源 `src/assets/`

| 文件                  | 职责                                                                       |
| --------------------- | -------------------------------------------------------------------------- |
| `fonts/font-faces.js` | Geist 字体变量（CSS 变量类名）注册，供 `<html className={fontFaces}>` 使用 |

## 文档索引

- UI/UX 专项地图：[uiux-map.md](./uiux-map.md)（DOM/CSS 层 · 3D 视觉表现层 · 交互动画逻辑）
- 主题系统：[图片注册进主题目录.md](./主题系统/图片注册进主题目录.md)（图片资源放置、主题注册表配置、主题目录展示与切换链路）
- 背景效果：[Floating-Lines-背景效果复刻实施计划.md](./背景效果/Floating-Lines-背景效果复刻实施计划.md)（ReactBits Floating Lines 背景复刻方案、R3F 接入计划、交互与验收标准）
- 背景系统：[2D背景与3D模型分层实施计划.md](./背景系统/2D背景与3D模型分层实施计划.md)（2D 背景层与透明 3D 模型层的分层方案、约束与验收标准）
- 背景系统：[Floating-Lines-2D背景层说明.md](./背景系统/Floating-Lines-2D背景层说明.md)（首页 2D shader 漂浮线条背景的职责、接入位置、参数与验收要点）
- 导航菜单：[顶部导航菜单复刻实施计划.md](./导航菜单/顶部导航菜单复刻实施计划.md)（Awwwards 风格顶部 mega menu 与移动端汉堡菜单复刻方案、交互规则、实施步骤与验收标准）
