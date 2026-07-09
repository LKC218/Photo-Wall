# Floating-Lines-2D背景层说明

> 目标：说明照片墙 2D 背景层中 React Bits 风格漂浮线条的职责、接入位置与约束。本文只作为模块说明，不记录执行历史。

## 模块职责

`src/components/background/FloatingLines2D.jsx` 是 `BackgroundLayer` 的动态增强子层，用独立 Three `WebGLRenderer` 渲染全屏 shader 平面，复刻 React Bits `Floating Lines` 的核心视觉：

- 三层漂浮波浪线；
- 横向渐变发光；
- 指针靠近时的局部弯曲；
- 指针移动时的轻微视差；
- 基于当前主题强调色生成线条渐变。

该组件属于 DOM 2D 背景系统，不属于 R3F 模型场景。`src/three/scenes/FloatingLines.jsx` 继续作为备用 3D 对照层保留。

## 接入位置

```text
AppLayout
  BackgroundLayer
    chroma
    lightField
    FloatingLines2D
    architecture
    horizon
    grid
    noise
  transparent R3F Canvas
```

当前只在 `/` 塔式照片墙页启用，`/paper` 和 `/directory` 不挂载该动态层，避免纸片页过重和目录页文字可读性下降。

## 设计约束

- 不新增依赖，复用项目已有 `three`。
- 不接入全局 R3F Canvas，避免背景与模型透明排序、相机、OrbitControls 互相影响。
- `BackgroundLayer` 保持 `pointer-events:none`，所以指针监听由 `FloatingLines2D` 绑定到 `window`。
- `prefers-reduced-motion: reduce` 下组件不启动渲染循环，SCSS 同时隐藏该层。
- 渲染器卸载时必须释放 `geometry`、`material`、`renderer` 并移除 canvas。

## 参数策略

第一版参数以“衬托照片墙”为目标，不追求压过 3D 主体：

```jsx
<FloatingLines2D
    enabledWaves={['top', 'middle', 'bottom']}
    lineCount={[6, 8, 10]}
    lineDistance={[8, 6, 4]}
    animationSpeed={0.78}
    bendRadius={7}
    bendStrength={-1.15}
    mouseDamping={0.05}
    parallax
    parallaxStrength={0.12}
/>
```

## 验收要点

- 首页背景能看到多层漂浮线条，但照片柱体和 Banner 仍是视觉主体。
- 主题切换后线条色彩随 `THEME_ACCENTS` 变化。
- 鼠标移动时线条有轻微弯曲和视差，不影响 OrbitControls。
- 移动端线条透明度降低，不遮挡模型。
- 降低动态偏好下不启动动态线条。
