# UI/UX 代码地图（uiux-map）

> 专项导航：按"前端 DOM/CSS 层 · 3D 视觉表现层 · 交互动画逻辑"三大维度组织，
> 每条目含「文件路径 · 职责 · 关键交互/样式/着色器要点 · 依赖关系」，便于快速定位 UI/UX 代码。
> 总导航见 [apps-code-map.md](./apps-code-map.md)。

---

## 一、前端 DOM/CSS 层

### 1. 根布局壳 `src/components/layout/AppLayout.jsx`
- **职责**：承载 Header / 页面 `children` / 3D Scene / Footer，并管理路由高亮与全局主题状态。
- **关键交互/样式要点**
  - `'use client'`；`useRef` 持有滚动容器，`usePathname()` 判断当前路由并给 Footer 的 `next/link` 加 `className="active"`。
  - 滚动容器内联：`position:relative; width/height:100%; overflow:auto; touchAction:auto`。
  - Scene 经 `next/dynamic`（ssr:false）动态导入，固定全屏 `position:fixed; 100vw×100vh; zIndex:1`，传入 `eventSource={ref}`、`eventPrefix="client"`，使 R3F 监听 DOM 滚动容器而非 window。
  - 整体以 `ThemeProvider` 包裹，所有页面共享同一当前主题；`directoryOpen` state 由 Header 的"主题目录"按钮触发，控制 `ThemeDirectory` 开合。
  - Footer 内嵌两个切换链接（塔式 `/`、纸片 `/paper`）。
- **依赖**：import `components/ui/modules`（Header/Footer）、`context/ThemeContext`（`ThemeProvider`）、`components/theme/ThemeDirectory`、`next/dynamic`、`next/link`、`next/navigation`、`three/Canvas`（动态）。被 `app/layout.jsx` 引用。

### 2. 根布局入口 `src/app/layout.jsx`
- **职责**：Next.js 根布局，注入全局样式、字体、metadata，Suspense 包裹 AppLayout。
- **关键交互/样式要点**：`<html lang="zh-CN" className={fontFaces}>`（Geist 字体 CSS 变量）；`export const metadata = meta`。
- **依赖**：import `styles/global.scss`、`data/metadata`、`assets/fonts/font-faces`、`components/layout/AppLayout`。

### 3. 页面路由（占位 View 容器）
- `src/app/page.jsx`（塔式）
  - **要点**：`COUNT=10`、`GAP=3.2`；`const { activeTheme } = useTheme()` 取当前主题，`useCollageTexture(activeTheme.images)` 取拼贴纹理；`isLoading` 时渲染 `<Loader/>`；`<View orbit>` 内含 `PerspectiveCamera(fov=7,position=[0,0,70])` 与 `group(rotation=[-0.15,0,-0.2])`；每根柱体为 `Billboard(radius=5)` + `Banner(radius=5.035)`。
- `src/app/paper/page.jsx`（纸片）
  - **要点**：`const { activeTheme } = useTheme()`，`paperImages = activeTheme.images.slice(0,5)`；`useCollageTexture(paperImages,{gap:0,canvasWidth:1024,axis:'y'})`；相机 `fov=20,position=[0,0,13]`；`<Paper rotation={[0,PI*0.3,0]} position={[0,0.5,0]} texture={texture}/>`。
- **依赖**：均 import `styles/page.module.scss`、`context/ThemeContext`(useTheme)、`three/scenes`、`components/ui/modules`(Loader)、`three/View`、`hooks`(useCollageTexture)、`@react-three/drei`(PerspectiveCamera)。

> 注：原 `spiral` 路由已不存在（目录为空），当前有效页面仅「塔式 `/`」与「纸片 `/paper`」。切换主题即切换传入 `useCollageTexture` 的 `images` 数组，纹理随主题自动重建。

### 4. UI 模块出口 `src/components/ui/modules/index.js`
- **职责**：re-export `Loader` / `Header` / `Footer`，供 AppLayout 与页面统一引用。
- **依赖**：import `./Loader/Loader`、`./Header/Header`、`./Footer/Footer`。

### 5. Loader `src/components/ui/modules/Loader/`
- `Loader.jsx`（`'use client'`）：渲染 `<div className={styles.loader}><div className={styles.loader__text}>加载中…</div></div>`。
- `Loader.module.scss`：**要点** `.loader` 全屏 `position:fixed; place-items:center; background:#fff; color:#000; font-size:1.5rem; bold`；`.loader__text` 含 `fadeInOut 2s ease-in-out infinite`（透明度 0.3↔1）呼吸动画。
- **依赖**：被三个页面 import。

### 6. Header `src/components/ui/modules/Header/`
  - `Header.jsx`（`'use client'`）：tux.co 风格圆角胶囊导航条。品牌名"照片墙"与"主题目录"按钮文字均经 `RollingText` 包裹：默认显示原文字，悬停时逐字向上滚动露出强调色副本（复刻 gabrielcojea "Rolling Text Hover"）；`active` 选中态默认停在副本（目录打开时），hover 反向滚回原文字。
- `Header.module.scss`：**要点** `.header` `position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:1000; mix-blend-mode:difference; color:#fff; pointer-events:none`（居中悬浮，胶囊不挡滚动）；`.pill` `display:flex; gap:1.5rem; padding:0.55rem 1.4rem; border-radius:999px; background:rgba(255,255,255,0.12); backdrop-filter:blur(8px); pointer-events:auto`；`.directory` 大写宽字距，悬停下划线 `scaleX` 动画。**关键 UX**：`mix-blend-mode:difference` 让胶囊在任意背景上反色可见。
- **依赖**：被 `AppLayout` import；`onOpenDirectory` 由 AppLayout 注入控制 `ThemeDirectory` 开合。

### 7. 主题切换 UI `src/components/theme/`
- `ThemeDirectory.jsx`（`'use client'`）：全屏目录面板，读取 `useTheme()` 的 `themes`/`activeId`/`setActiveTheme`。经 `react-dom` 的 `createPortal` 渲染到 `document.body`（规避 Header 的 `mix-blend-mode:difference` 对面板反色影响）。每行主题含名称 + `图片数 · 预设` 元信息 + 前 5 张缩略图（`theme.images.slice(0,5).url`），整行点击 `setActiveTheme(id)` 并 `onClose()`；当前主题以左侧圆点 + 浅灰高亮标识；关闭支持 × 按钮 / 点击遮罩 / Esc 键。
- `ThemeDirectory.module.scss`：**要点** `.overlay` `position:fixed; inset:0; z-index:2000; background:rgba(0,0,0,0.55); backdrop-filter:blur(6px)`；`.panel` `width:min(560px,92vw); height:100%; background:#fff` 左对齐全高面板，淡入 + 左滑入场动画；`.row` 整行按钮，hover 浅灰。
- **依赖**：import `context/ThemeContext`、`react`（useEffect）、`react-dom`（createPortal）。被 `AppLayout` 以 `<ThemeDirectory open onClose>` 挂载。

### 8. Footer `src/components/ui/modules/Footer/`
- `Footer.jsx`：结构同 Header，仅作底部容器插槽。
- `Footer.module.scss`：**要点** `.footer` `position:fixed; left:1rem; bottom:1rem; width:100%; z-index:1000`；`.wrapper` `display:flex; gap:1rem; background:#fff; width:fit-content; padding:1rem; border-radius:0.7rem; box-shadow:0 0 10px rgba(0,0,0,0.1)`（白色圆角卡片式导航）。
- **依赖**：被 `AppLayout` import，承载三个 `next/link`。

### 8. 样式系统 `src/styles/`
- `global.scss`：引入 `_reset`；`:root` 定义 `--color-text:#1a202c`、`--color-background:#fff`；`html` 设字体族（Geist 主，中文回退）、`scrollbar-width:none`；`body` 禁用滚动条、`-webkit-font-smoothing`；`a:hover` 透明度 0.7（0.3s 过渡），`a.active` 透明度 0.7 且 `pointer-events:none`。
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

### 4. `src/three/scenes/Billboard.jsx`
- **职责**：圆柱贴图柱体（塔式每层主体）。
- **关键视觉要点**
  - `cylinderGeometry(radius,radius,2,100,1,true)`；`<meshImageMaterial map side=DoubleSide toneMapped=false>`。
  - `setupCylinderTextureMapping(texture,dimensions,radius,2)`：按圆柱周长 `2πr` 与实际高算 `aspectRatio`，对比画布比例自适应 `texture.repeat`/`offset`，使图片不变形并居中。
  - 默认 `radius=5`。
- **依赖**：import `THREE`、`useFrame`、`materials/MeshImageMaterial`（注册）。被 `app/page.jsx` 引用。

### 5. `src/three/scenes/Banner.jsx`
- **职责**：横幅环（塔式每层底部彩条）。
- **关键视觉要点**
  - `useTexture('/banner.jpg')`，`wrapS=wrapT=RepeatWrapping`。
  - `cylinderGeometry(radius,radius,radius*0.07,radius*80,radius*10,true)`；`<meshBannerMaterial map map-anisotropy=16 map-repeat=[15,1] side=DoubleSide toneMapped=false backfaceRepeatX=0.2>`。
  - 默认 `radius=1.6`（页面调用传入 5.035）。
- **依赖**：import `drei/useTexture`、`materials/MeshBannerMaterial`。被 `app/page.jsx` 引用。
- **注意（解耦点）**：`Banner.jsx` 硬引用静态资源 `/banner.jpg`，与 `data/images.js` 图片清单无关联，属紧耦合，不利于配置化。

### 6. `src/three/scenes/Paper.jsx`
- **职责**：纸片布局的 GLB 模型 + 前 5 张拼贴纹理。
- **关键视觉要点**：`useGLTF('/paper.glb')`，取 `scene.children[0]`；`useEffect` 中将 `texture`（设 `SRGBColorSpace`）赋给 `mesh.material.map`、`toneMapped=false`。
- **依赖**：import `drei/useGLTF`、`useFrame`。被 `app/paper/page.jsx` 引用。

### 7. 全局画布 `src/three/Canvas.jsx`
- **职责**：全局唯一 `<Canvas>`，所有页面的 3D 内容经隧道汇聚于此渲染。
- **关键要点**：`<Canvas {...props}>` 内含 `<r3f.Out/>`（隧道出口）与 `<Preload all/>`（预加载 GLB/纹理资源）。
- **依赖**：import `r3f`、`three/materials`（副作用注册）、`drei/Preload`。被 `AppLayout` 经 `next/dynamic` 引用。

### 8. 视图隧道接入 `src/three/View.jsx`
- **职责**：drei `View` 与 tunnel 的桥梁——DOM 占位 `div` 与其在 Canvas 中的 3D 视图一一对应。
- **关键要点**：`forwardRef` + `useImperativeHandle` 暴露 `localRef`（占位 div）；渲染 `<div ref={localRef}>` 与 `<Three><ViewImpl track={localRef}>{children}{orbit&&<OrbitControls/>}</ViewImpl></Three>`。`track` 绑定占位 div 位置，实现滚动跟随。
- **依赖**：import `drei`(OrbitControls,ViewImpl)、`helpers/Tunnel`(Three)。被各页面引用。

---

## 三、交互动画逻辑

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
- **关键要点**：`useCallback` 依赖 `[images,gap,canvasHeight,canvasWidth,axis]`；`useEffect` 在 `images.length>0` 时创建纹理，失败时 `setError`。
- **依赖**：import `helpers/getCanvasTexture`。被三个页面引用。

### 5. `useFrame` 动效汇总（基于帧时间差 delta，符合绝对时间同步）
| 场景 | 文件 | 动效 |
|------|------|------|
| Billboard | `scenes/Billboard.jsx` | `texture.offset.x += delta*0.001`（柱体纹理横移） |
| Banner | `scenes/Banner.jsx` | `material.map.offset.x += delta/30`（横幅滚动） |
| Paper | `scenes/Paper.jsx` | `texture.offset.y += delta/30`，`wrapS=wrapT=RepeatWrapping`（纵向滚动） |

---

## 依赖关系链路（UI/UX 视角）

```text
app/layout.jsx
  └─ AppLayout.jsx ──┬─ ThemeProvider（context/ThemeContext.jsx，仅预设主题、持久化当前主题）
                     ├─ Header / Footer（modules；Header "主题目录"按钮控制 ThemeDirectory 开合）
                     ├─ ThemeDirectory（components/theme，Portal 到 body 的全屏目录面板）
                     └─ Scene（next/dynamic → three/Canvas.jsx）
                          ├─ r3f.Out（helpers/r3f.js 单例出口）
                          └─ Preload all

页面 page / paper ──┬─ <View>（three/View.jsx）
                             │     └─ <Three> = r3f.In（helpers/Tunnel.jsx）
                             │            └─ 3D 内容 → 隧道 → Canvas.Out 渲染
                             ├─ useCollageTexture（hooks）
                             │     └─ getCanvasTexture（helpers）→ CanvasTexture
                             └─ scenes（Billboard/Banner/Paper）
                                   ├─ materials（MeshImage/MeshBanner，extend 注册于 materials/index.js）
                                   └─ useFrame 动效（驱动 texture.offset）

styles/global.scss + assets/fonts/font-faces.js → 全局视觉与字体
```

## 已知 UI/UX 待优化点（供后续定位）

- **样式冗余**：`global.scss` 全局 `.loader` 与 `Loader.module.scss` 局部 `.loader` 同名，前者疑似遗留未使用。
- **资源耦合**：`scenes/Banner.jsx` 硬引用 `/banner.jpg`，未纳入 `data/images.js` 配置体系。
- **配置化程度低**：各页面的 `COUNT`/`GAP`/`radius`/相机参数硬编码，未抽象为可配置照片墙组件。
- **移动端降级缺失**：无 WebGL/低性能设备回退静态图方案（`reactStrictMode:true` + 全屏重绘在低端机有风险）。
