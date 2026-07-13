# UI/UX 代码地图（uiux-map）

> 专项导航：按"前端 DOM/CSS 层 · 3D 视觉表现层 · 交互动画逻辑"三大维度组织，
> 每条目含「文件路径 · 职责 · 关键交互/样式/着色器要点 · 依赖关系」，便于快速定位 UI/UX 代码。
> 总导航见 [apps-code-map.md](./apps-code-map.md)。

---

## 一、前端 DOM/CSS 层

### 1. 根布局壳 `src/components/layout/AppLayout.jsx`

- **职责**：承载 BackgroundLayer / Header / 页面 `children` / 透明 3D Scene / Footer，并管理路由高亮、页面过渡与全局主题状态；Footer 视图切换仅在 3D 视图页显示。
- **关键交互/样式要点**
    - `'use client'`；`useRef` 持有滚动容器；`usePathname()` 判断当前路由并给 Footer 按钮加 `className="active"`，同时以 `pathname === '/' || pathname === '/paper'` 控制 FooterNav 只在塔式与纸片页渲染。
    - 整个应用壳经 `PageTransitionProvider` 托管；导航先播放退出与黑幕覆盖，覆盖完成后才由 `onNavigate` 执行 `router.push`，新路由首帧始终在黑幕下提交。
    - `BackgroundLayer` 位于 Scene 下方，读取 `pathname` 与当前主题输出固定全屏 2D 背景；`Header`、`FooterNav` 与目录页均通过 `usePageTransition()` 提供的 `navigateWithTransition` 发起导航；FooterNav 仅在 `/` 与 `/paper` 渲染，避免主题目录页出现 3D 视图切换入口。
    - 滚动容器内联：`position:relative; width/height:100%; overflow:auto; touchAction:auto`。
    - Scene 经 `next/dynamic`（ssr:false）动态导入，固定全屏 `position:fixed; 100vw×100vh; zIndex:1; background:transparent`，传入 `eventSource={ref}`、`eventPrefix="client"`，使 R3F 监听 DOM 滚动容器而非 window。
    - 整体以 `ThemeProvider` 包裹，所有页面共享同一当前主题；`ThemeDirectory` 已改为独立路由 `/directory`，AppLayout 不再维护目录面板 state。
- **依赖**：import `components/background/BackgroundLayer`、`components/ui/modules`（Header/Footer）、`context/ThemeContext`（`ThemeProvider`）、`components/transition/PageTransition`、`next/dynamic`、`next/navigation`、`three/Canvas`（动态）。被 `app/layout.jsx` 引用。

### 1.1 2D 背景层 `src/components/background/`

- `BackgroundLayer.jsx`：读取 `useTheme()` 的 `activeTheme` 与 `pathname`，用内部主题调色板映射输出 `primary / secondary / tertiary` 三组 RGB 强调色与基础底色 CSS 变量；根据 `/`、`/paper`、`/directory` 选择路由 class；首页额外挂载 `FloatingLines2D` 并把主题强调色转换为 shader 渐变；根节点 `aria-hidden="true"`。
- `FloatingLines2D.jsx`：React Bits 风格 2D shader 背景层，独立创建 Three `WebGLRenderer`、正交相机和全屏平面；通过 uniform 驱动三层波浪线、渐变发光、指针弯曲和轻视差；监听 `window` 指针事件以兼容 `BackgroundLayer` 的 `pointer-events:none`；降低动态偏好下不启动渲染循环。
- `BackgroundLayer.module.scss`：**要点** `.background` 为 `position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden`；使用 `chroma` 光场、`floatingLines` 漂浮线、`architecture` 结构线、`horizon` 地平层、`grid` 网格和 `noise` 轻纹理形成 2D 氛围层；`.tower` 强化纵深和结构线，`.paper` 降低网格强度并偏纸面展墙质感，`.directory` 使用浅色背景以保证 DOM 目录页可读性；移动端降低结构线、网格、漂浮线和纹理强度；`prefers-reduced-motion` 下关闭漂移动画和漂浮线层。
- **依赖**：import `context/ThemeContext`；被 `AppLayout` 引用，位于透明 R3F Canvas 下方。

### 2. 根布局入口 `src/app/layout.jsx`

- **职责**：Next.js 根布局，注入全局样式、字体、metadata，Suspense 包裹 AppLayout。
- **关键交互/样式要点**：`<html lang="zh-CN" className={fontFaces}>`（Geist 字体 CSS 变量）；`export const metadata = meta`。
- **依赖**：import `styles/global.scss`、`data/metadata`、`assets/fonts/font-faces`、`components/layout/AppLayout`。

### 3. 页面路由（占位 View 容器）

- `src/app/page.jsx`（塔式）
    - **要点**：`COUNT=10`、`GAP=3.2`；`const { activeTheme } = useTheme()` 取当前主题，`useCollageTexture(activeTheme.images)` 取拼贴纹理；`isLoading` 时渲染 `<Loader/>`；`<View orbit>` 内含 `PerspectiveCamera(fov=7,position=[0,0,70])` 与 `group(rotation=[-0.15,0,-0.2])`；每根柱体为 `Billboard(radius=5)` + `Banner(radius=5.035)`；背景已改由 2D `BackgroundLayer` 承载，塔式页不再挂载 `FloatingLines`。
- `src/app/paper/page.jsx`（纸片）
    - **要点**：`const { activeTheme } = useTheme()`，通过 `useMemo(() => activeTheme.images.slice(0,5), [activeTheme.images])` 固定 `paperImages` 引用，避免 `useCollageTexture` 因数组引用变化重复生成纹理；`useCollageTexture(paperImages,{gap:0,canvasWidth:1024,axis:'y'})`；相机 `fov=20,position=[0,0,13]`；`<Paper rotation={[0,PI*0.3,0]} position={[0,0.5,0]} texture={texture}/>`。
- **依赖**：均 import `styles/page.module.scss`、`context/ThemeContext`(useTheme)、`three/scenes`、`components/ui/modules`(Loader)、`three/View`、`hooks`(useCollageTexture)、`@react-three/drei`(PerspectiveCamera)。

> 注：原 `spiral` 路由已不存在。当前有效页面为「塔式 `/`」「纸片 `/paper`」「主题目录 `/directory`」。切换主题即切换传入 `useCollageTexture` 的 `images` 数组，纹理随主题自动重建。

### 3.1 主题目录页 `src/app/directory/page.jsx`

- **要点**：`'use client'`；从 `components/transition` 取 `usePageTransition`；渲染 `<ThemeDirectory mode="page" onNavigate={navigateWithTransition} />`；点击主题项或返回按钮先完成黑幕覆盖，再跳转回主页。
- **依赖**：import `components/theme/ThemeDirectory`、`next/navigation`(useRouter)。

### 4. UI 模块出口 `src/components/ui/modules/index.js`

- **职责**：re-export `Loader` / `Header` / `Footer`，供 AppLayout 与页面统一引用。
- **依赖**：import `./Loader/Loader`、`./Header/Header`、`./Footer/Footer`。

### 5. Loader `src/components/ui/modules/Loader/`

- `Loader.jsx`（`'use client'`）：渲染 `<div className={styles.loader}><div className={styles.loader__text}>加载中…</div></div>`。
- `Loader.module.scss`：**要点** `.loader` 全屏 `position:fixed; place-items:center; background:#fff; color:#000; font-size:1.5rem; bold`；`.loader__text` 含 `fadeInOut 2s ease-in-out infinite`（透明度 0.3↔1）呼吸动画。
- **依赖**：被三个页面 import。

### 6. Header `src/components/ui/modules/Header/`

- `Header.jsx`（`'use client'`）：tux.co 风格圆角胶囊导航条。接收 `onNavigate` 与 `pathname`；品牌名"照片墙"与"主题目录"按钮文字均经 `RollingText` 包裹：默认显示原文字，悬停时逐字向上滚动露出强调色副本（复刻 gabrielcojea "Rolling Text Hover"）。"主题目录"按钮点击后调用 `onNavigate('/directory')`，`active` 选中态由 `pathname === '/directory'` 决定。
- `Header.module.scss`：**要点** `.header` `position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:1000; mix-blend-mode:difference; color:#fff; pointer-events:none`（居中悬浮，胶囊不挡滚动）；`.pill` `display:flex; gap:1.5rem; padding:0.55rem 1.4rem; border-radius:999px; background:rgba(255,255,255,0.12); backdrop-filter:blur(8px); pointer-events:auto`；`.directory` 大写宽字距，悬停下划线 `scaleX` 动画。**关键 UX**：`mix-blend-mode:difference` 让胶囊在任意背景上反色可见。
- **依赖**：被 `AppLayout` import；`onNavigate` 为 `usePageTransition()` 提供的 `navigateWithTransition`，`pathname` 由 AppLayout 注入。

### 7. 主题切换 UI `src/components/theme/`

- `ThemeDirectory.jsx`（`'use client'`）：主题目录组件，支持两种模式：
    - `mode='overlay'`（遗留）：经 `react-dom` 的 `createPortal` 渲染到 `document.body`，由 `open`/`onClose` 控制，选择主题后关闭面板；若当前不在 `/` 且传入 `onNavigate`，则导航回塔式照片墙。
    - `mode='page'`（当前默认）：由 `src/app/directory/page.jsx` 直接渲染，作为独立路由 `/directory`；选择主题或点击返回按钮时通过 `onNavigate('/')` 返回首页并切换主题。
    - 统一行为：读取 `useTheme()` 的 `themes`/`activeId`/`setActiveTheme`，维护 `view` 状态（`list`/`editorial`/`grid`）；底部固定栏提供 List/Editorial/Grid 三种视图切换胶囊按钮（复刻 tux.co Work 页底部导航栏），右侧并排放置 SVG 滚动进度环；List 视图以主题行展示名称、标签和缩略图；切换视图时使用 GSAP Flip 对带 `data-flip-id` 的图片做跨视图位移动画，并带锁防止快速连续切换；列表入场只对行项目做轻量 `y:64→0` 与 `opacity` stagger，避免父子双层大位移造成字体抖动；当前主题以左侧常驻占位圆点或网格边框标识。
- `ThemeDirectory.module.scss`：**要点** `.panel` 为 `position:fixed; inset:0; z-index:2000; background:#fff` 全屏 flex 列（head/内容/foot），`.page` 模式下改为 `position:relative; min-height:100svh; z-index:auto`；`.viewSwitch` 为圆角胶囊按钮组；`.row` 为稳定高度的纵向主题行，使用 `will-change: transform, opacity` 和 `translateZ(0)` 承接 GSAP 轻位移动画；`.part1` 固定最小高度，`.dot` 常驻占位并由 active 控制显隐，避免主题切换时文字横向跳动；hover 效果限制在 `@media (hover:hover) and (pointer:fine)`，通过 `::before` 伪元素实现黑色背景条自底部 `scaleY(0→1)` 展开；`.trait` 顶部 1px 分隔线并仅声明 `will-change: transform`；缩略图固定 64px。
- **依赖**：import `context/ThemeContext`、`gsap`（Flip/stagger）、`react`（useEffect/useRef/useState）、`react-dom`（createPortal）。被 `app/directory/page.jsx` 以 `mode='page'` 挂载；`overlay` 模式下可由父组件控制。

### 8. Footer `src/components/ui/modules/Footer/`

- `Footer.jsx`：结构同 Header，仅作底部容器插槽。
- `Footer.module.scss`：**要点** `.footer` `position:fixed; left:1rem; bottom:1rem; width:100%; z-index:1000`；`.wrapper` `display:flex; gap:1rem; background:#fff; width:fit-content; padding:1rem; border-radius:0.7rem; box-shadow:0 0 10px rgba(0,0,0,0.1)`（白色圆角卡片式导航）；`.wrapper button` 去默认样式，`.wrapper button:disabled` 降低透明度。
- **依赖**：被 `AppLayout` import，承载视图切换按钮（塔式 `/`、纸片 `/paper`）；由 AppLayout 仅在 `/` 与 `/paper` 渲染，主题目录 `/directory` 不显示。

### 8. 样式系统 `src/styles/`

- `global.scss`：引入 `_reset`；`:root` 定义 `--color-text:#1a202c`、`--color-background:#fff`；`html` 设字体族（Geist 主，中文回退）、`scrollbar-width:none`；`body` 禁用滚动条、`-webkit-font-smoothing`；`a` 与 `button` 的 `:hover:not(:disabled)` 透明度 0.7（0.3s 过渡），`.active` 透明度 0.7 且 `pointer-events:none`，`:disabled` 透明度 0.4 且 `cursor:not-allowed`。
- `_reset.scss`：样式重置基础。
- `page.module.scss`：页面级样式，主要供各页面 `<View className={styles.view}>` 占位容器使用（尺寸/定位）。
- **注意（冗余点）**：`global.scss` 第 38–50 行存在一份全局非模块化 `.loader` 定义，与 `Loader.module.scss` 中的 `.loader`（作用域隔离、实际被 Loader 组件使用）同名冗余，疑为遗留未使用样式，建议清理。

### 9. 字体 `src/assets/fonts/font-faces.js`

- **职责**：注册 Geist 字体变量（导出 CSS 变量类名 `fontFaces`）。
- **关键要点**：供 `<html className={fontFaces}>` 启用；`global.scss` 的 `--font-primary` 引用该字体变量。

---

## 二、3D 视觉表现层

### 1. 材质注册 `src/three/materials/index.js`

- **职责**：`extend({ MeshImageMaterial, MeshBannerMaterial })`，使两者可作为 JSX 标签 `<meshImageMaterial>` / `<meshBannerMaterial>` 使用。
- **依赖**：import `MeshImageMaterial.js`、`MeshBannerMaterial.js`。被 `three/Canvas.jsx` import（副作用注册）。

### 2. `src/three/materials/MeshImageMaterial.js`

- **职责**：继承 `THREE.MeshBasicMaterial` 的自定义材质，用于照片柱体的"正脸显示、背面压暗"。
- **关键着色器要点**：`onBeforeCompile` 在 `#include <color_fragment>` 后注入——`if(!gl_FrontFacing) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.0), 0.7);`，即背面混入 70% 黑，形成立体暗面。
- **依赖**：被 `scenes/Billboard.jsx` 用作 `meshImageMaterial` / `MeshImageMaterial`。

### 3. `src/three/materials/MeshBannerMaterial.js`

- **职责**：继承 `THREE.MeshBasicMaterial` 的自定义材质，用于横幅环的"背面彩条渐变"。
- **关键着色器要点**
    - 构造时初始化 `backfaceRepeatX=1.0`（可参数覆盖）。
    - `onBeforeCompile`：在 `#include <common>` 注入 `uniform float repeatX;` 与余弦调色板函数 `pal(t,a,b,c,d)`；在 `#include <color_fragment>` 后注入——背面 `diffuseColor.rgb = pal(vMapUv.x*repeatX, vec3(.5),vec3(.5),vec3(1.0),vec3(0.0,0.10,0.20));`，形成彩虹渐变彩条。
- **依赖**：被 `scenes/Banner.jsx` 用作 `<meshBannerMaterial backfaceRepeatX={0.2}>`。

### 4. `src/three/scenes/FloatingLines.jsx`

- **职责**：备用 3D 背景增强层；当前塔式页背景已迁移到 2D `BackgroundLayer`，该文件保留用于回滚或后续对比。
- **关键视觉要点**
    - 使用三层 wave（top/middle/bottom）组织漂浮线条，每层具备独立 position、rotation、amplitude、alpha 与 parallax factor。
    - 每条线使用 ribbon mesh，而不是 Three 原生 Line，避免浏览器线宽不可控问题；几何索引保持面朝向相机，并用 `DoubleSide` 兜底 OrbitControls 旋转后的可见性。
    - `ShaderMaterial` 实现双频波动、横向四段渐变、边缘/端点透明衰减，材质使用 `transparent:true`、`depthWrite:false`、`depthTest:true`、`side:DoubleSide`、`AdditiveBlending`、`toneMapped:false`，形成深色背景上的发光叠加，同时让照片墙正确遮挡背景线条。
    - `useFrame` 更新时间 uniform，并读取 `state.pointer` 转换为视口坐标；使用 `1 - pow(1 - mouseDamping, delta * 60)` 做帧率无关阻尼。
    - 鼠标交互通过距离场 `smoothstep(bendRadius,0,distance)` 沿曲线法线方向局部弯曲；视差只移动 FloatingLines 分层 group，不改相机，避免干扰 OrbitControls。
- **依赖**：import `three`、`@react-three/fiber`、`react`。被 `src/app/page.jsx` 引用。

### 5. `src/three/scenes/Billboard.jsx`

- **职责**：圆柱贴图柱体（塔式每层主体）。
- **关键视觉要点**
    - `cylinderGeometry(radius,radius,2,100,1,true)`；`<meshImageMaterial map side=DoubleSide toneMapped=false>`。
    - `setupCylinderTextureMapping(texture,dimensions,radius,2)`：按圆柱周长 `2πr` 与实际高算 `aspectRatio`，对比画布比例自适应 `texture.repeat`/`offset`，使图片不变形并居中。
    - 默认 `radius=5`。
- **依赖**：import `THREE`、`useFrame`、`materials/MeshImageMaterial`（注册）。被 `app/page.jsx` 引用。

### 6. `src/three/scenes/Banner.jsx`

- **职责**：横幅环（塔式每层底部彩条）。
- **关键视觉要点**
    - `useTexture('/banner.jpg')`，`wrapS=wrapT=RepeatWrapping`。
    - `cylinderGeometry(radius,radius,radius*0.07,radius*80,radius*10,true)`；`<meshBannerMaterial map map-anisotropy=16 map-repeat=[15,1] side=DoubleSide toneMapped=false backfaceRepeatX=0.2>`。
    - 默认 `radius=1.6`（页面调用传入 5.035）。
- **依赖**：import `drei/useTexture`、`materials/MeshBannerMaterial`。被 `app/page.jsx` 引用。
- **注意（解耦点）**：`Banner.jsx` 硬引用静态资源 `/banner.jpg`，与 `data/images.js` 图片清单无关联，属紧耦合，不利于配置化。

### 7. `src/three/scenes/Paper.jsx`

- **职责**：纸片布局的 GLB 模型 + 前 5 张拼贴纹理。
- **关键视觉要点**：`useGLTF('/paper.glb')` 加载模型；通过 `scene.traverse()` 查找第一个 `isMesh`，避免依赖 `scene.children[0]` 固定层级；`createPaperMaterial(texture)` 将拼贴纹理设为 `SRGBColorSpace` 与 `RepeatWrapping`，并创建 `MeshBasicMaterial({ map:texture, toneMapped:false, side:DoubleSide })`，避免无灯光场景下标准材质不可见；卸载时恢复旧材质并释放新材质；`useFrame` 驱动 `texture.offset.y += delta/30`。
- **依赖**：import `THREE`、`drei/useGLTF`、`useFrame`、`react/useEffect/useMemo`。被 `app/paper/page.jsx` 引用。

### 8. 全局画布 `src/three/Canvas.jsx`

- **职责**：全局唯一透明 `<Canvas>`，所有页面的 3D 模型内容经隧道汇聚于此渲染，背景由 DOM 2D 层负责。
- **关键要点**：`gl` 默认启用 `{ alpha:true, antialias:true }`；`style` 默认 `background:'transparent'`；`onCreated` 中清空 `state.scene.background`；内部含 `<r3f.Out/>`（隧道出口）与 `<Preload all/>`（预加载 GLB/纹理资源）。
- **依赖**：import `r3f`、`three/materials`（副作用注册）、`drei/Preload`。被 `AppLayout` 经 `next/dynamic` 引用。

### 8. 视图隧道接入 `src/three/View.jsx`

- **职责**：drei `View` 与 tunnel 的桥梁——DOM 占位 `div` 与其在 Canvas 中的 3D 视图一一对应。
- **关键要点**：`forwardRef` + `useImperativeHandle` 暴露 `localRef`（占位 div）；渲染 `<div ref={localRef}>` 与 `<Three><ViewImpl track={localRef}>{children}{orbit&&<OrbitControls/>}</ViewImpl></Three>`。`track` 绑定占位 div 位置，实现滚动跟随。
- **依赖**：import `drei`(OrbitControls,ViewImpl)、`helpers/Tunnel`(Three)。被各页面引用。

---

## 三、交互动画逻辑

### 0. 页面过渡 `src/components/transition/PageTransition.jsx`

- **职责**：全局统一页面切换动画，复刻 tux.co 的垂直滑移 + 黑色遮罩 wipe 效果。
- **关键交互/动画要点**
    - 监听 `usePathname()` 变化；路径变化时先播放退出动画，再切换 `displayChildren`，随后通过双 `requestAnimationFrame` 等待新页面首帧提交，最后播放进入动画，避免黑幕释放撞上新页面挂载。
    - **退出段**：`containerRef` 轻微上移 `-8vh` 且仅淡至 `opacity:0.72`（0.48s，`power3.inOut`）；`wipeRef` 黑色遮罩从 `translateY(100%)` 升起至 `0`（0.68s，延迟 0.04s），保留 TUX 式接管但放慢黑幕速度。
    - **进入段**：新内容初始设为 `translateY(8vh)`、`opacity:0.72`；遮罩先短暂停留，再从 `translateY(0)` 上滑至 `translateY(-100%)`（0.72s，延迟 0.16s）；新内容在遮罩释放时跟随上滑至 `0` 并淡入（0.64s，延迟 0.28s）。
    - 导航调用先进入退出阶段，黑幕完全覆盖后才由 `onNavigate` 执行 `router.push`；新页面首帧在黑幕下提交后进入离场阶段。
    - 提供 `usePageTransition()` Context，返回 `{ navigateWithTransition, isTransitioning }`，供 Header、Footer 与目录页触发过渡。
    - 动画期间缓存新导航请求（`pendingHrefRef`），进入动画完成后自动执行；快速点击不会崩溃。
    - 支持 `prefers-reduced-motion: reduce`，该模式下直接切换无动画。
- **依赖**：import `gsap`、`next/navigation`（`usePathname`）；被 `AppLayout` 引用。

### 1. 隧道实例 `src/three/helpers/r3f.js`

- **职责**：`tunnel-rat` 全局单例 `export const r3f = tunnel()`，连接 DOM 占位（`In`）与 Canvas（`Out`）。
- **依赖**：被 `Canvas.jsx`（`r3f.Out`）、`Tunnel.jsx`（`r3f.In`）、`View.jsx` 引用。

### 2. 隧道入口组件 `src/three/helpers/Tunnel.jsx`

- **职责**：`<Three>` = `<r3f.In>`，将 View 内的 3D 子节点送入隧道，最终由 Canvas 的 `<r3f.Out/>` 渲染。
- **依赖**：import `helpers/r3f`。被 `View.jsx` 引用。

### 3. 拼图纹理 `src/three/helpers/getCanvasTexture.js`

- **职责**：将多张图片拼合为单张 `CanvasTexture`，减少 draw call。
- **关键交互/样式要点**
    - `preloadImage`：并行预加载并算 `aspectRatio`；`axis==='x'` 按 `canvasHeight` 缩放宽、`'y'` 按 `canvasWidth` 缩放高。
    - `calculateCanvasDimensions`：按 `axis`/`gap` 累加总尺寸。
    - `setupCanvas`：`devicePixelRatio = Math.min(window.devicePixelRatio||1, 2)`（上限 2，控性能）；白底铺底。
    - `createTextureResult`：返回 `{ texture, dimensions:{width,height,aspectRatio} }`；`texture.wrapS=RepeatWrapping, wrapT=ClampToEdgeWrapping, generateMipmaps=false, min/magFilter=LinearFilter`。
    - 入参：`{ images, gap=10, canvasHeight=512, canvasWidth=512, axis='x' }`。
- **依赖**：import `THREE`。被 `hooks/useCollageTexture.jsx` 引用。

### 4. 拼图纹理 Hook `src/hooks/useCollageTexture.jsx`

- **职责**：封装 `getCanvasTexture`，向页面暴露 `{ texture, dimensions, isLoading, error }`。
- **关键要点**：基于图片 URL 与 `{gap,canvasHeight,canvasWidth,axis}` 生成缓存键；命中模块级 `textureCache` 时直接复用 `CanvasTexture` 与尺寸，避免路由返回主页时重复拼图和纹理上传；未命中时调用 `getCanvasTexture`，失败时 `setError`。
- **依赖**：import `helpers/getCanvasTexture`。被三个页面引用。

### 5. `useFrame` 动效汇总（基于帧时间差 delta，符合绝对时间同步）

| 场景          | 文件                       | 动效                                                                                                        |
| ------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| FloatingLines | `scenes/FloatingLines.jsx` | `ShaderMaterial` uniform `uTime` 驱动双频波浪；`state.pointer` + delta-based damping 驱动鼠标弯曲与分层视差 |
| Billboard     | `scenes/Billboard.jsx`     | `texture.offset.x += delta*0.001`（柱体纹理横移）                                                           |
| Banner        | `scenes/Banner.jsx`        | `material.map.offset.x += delta/30`（横幅滚动）                                                             |
| Paper         | `scenes/Paper.jsx`         | `texture.offset.y += delta/30`，`wrapS=wrapT=RepeatWrapping`（纵向滚动）                                    |

---

## 依赖关系链路（UI/UX 视角）

```text
app/layout.jsx
  └─ AppLayout.jsx ──┬─ ThemeProvider（context/ThemeContext.jsx，仅预设主题、持久化当前主题）
                     ├─ Header / Footer（modules；Header "主题目录"按钮导航到 `/directory`）
                     ├─ PageTransitionProvider（components/transition，监听 pathname 播放 wipe 过渡）
                     │     └─ 页面 children：page.jsx / paper/page.jsx / directory/page.jsx
                     └─ Scene（next/dynamic → three/Canvas.jsx）
                           ├─ r3f.Out（helpers/r3f.js 单例出口）
                           └─ Preload all

页面 page / paper / directory ──┬─ <View>（three/View.jsx，仅 page/paper 使用）
                                         │     └─ <Three> = r3f.In（helpers/Tunnel.jsx）
                                         │            └─ 3D 内容 → 隧道 → Canvas.Out 渲染
                                         ├─ useCollageTexture（hooks，仅 page/paper 使用）
                                         │     └─ getCanvasTexture（helpers）→ CanvasTexture
                                         ├─ scenes（Billboard/Banner/Paper，仅 page/paper 使用）
                                         │     ├─ materials（MeshImage/MeshBanner，extend 注册于 materials/index.js）
                                         │     └─ useFrame 动效（驱动 texture.offset）
                                         └─ ThemeDirectory（mode='page'，仅 directory 使用）

styles/global.scss + assets/fonts/font-faces.js → 全局视觉与字体
```

## 已知 UI/UX 待优化点（供后续定位）

- **样式冗余**：`global.scss` 全局 `.loader` 与 `Loader.module.scss` 局部 `.loader` 同名，前者疑似遗留未使用。
- **资源耦合**：`scenes/Banner.jsx` 硬引用 `/banner.jpg`，未纳入 `data/images.js` 配置体系。
- **配置化程度低**：各页面的 `COUNT`/`GAP`/`radius`/相机参数硬编码，未抽象为可配置照片墙组件。
- **移动端降级缺失**：无 WebGL/低性能设备回退静态图方案（`reactStrictMode:true` + 全屏重绘在低端机有风险）。
