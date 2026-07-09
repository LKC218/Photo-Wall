# Floating Lines 背景效果复刻实施计划

> 目标：在当前 Photo-Wall 项目中完整复刻 ReactBits `Floating Lines` 背景效果，并使其与现有塔式照片墙、Banner 彩条、R3F 单 Canvas 架构融合。
> 本文为实施前方案文档，不记录执行结果。

## 1. 需求边界

### 1.1 复刻目标

需要复刻的核心视觉与交互能力：

```text
多层漂浮波浪线
渐变发光线条
横向流动动画
鼠标局部弯曲响应
鼠标视差
可配置线条数量 / 间距 / 速度 / 弯曲半径 / 弯曲强度
与当前照片墙背景融合
```

### 1.2 项目适配目标

当前项目不是普通 DOM 页面背景，而是全局 R3F Canvas 方案：

```text
AppLayout 固定全屏 Canvas
页面内 View 作为 DOM 占位
3D 内容经 tunnel-rat 搬运进 Canvas
```

因此 Floating Lines 不应做成独立 DOM Canvas 覆盖层，而应作为 `src/three/scenes` 下的 Three 场景组件接入。

### 1.3 成本策略

用户要求“完全复刻效果，无视成本”。因此优先级为：

```text
视觉还原度 > 交互完整度 > 与现有背景融合 > 性能成本
```

但实现仍需保持代码结构清晰，避免无必要的复杂抽象。

---

## 2. 当前项目上下文

### 2.1 已有技术栈

项目已具备：

```text
three
@react-three/fiber
@react-three/drei
sass
gsap
```

不需要为了该背景额外引入 Three 或 R3F。

### 2.2 当前首页 3D 结构

首页 `src/app/page.jsx` 当前结构：

```text
.page
└─ View orbit
   ├─ PerspectiveCamera fov=7 position=[0,0,70]
   └─ group rotation=[-0.15,0,-0.2]
      ├─ Billboard × 10
      └─ Banner × 10
```

已有背景感来自：

- 多层圆柱照片墙 `Billboard`
- 环形彩条 `Banner`
- Banner 背面自定义渐变材质
- 纹理缓慢滚动

Floating Lines 应作为增强层，而不是替代层。

### 2.3 相关源码位置

```text
src/app/page.jsx                          塔式首页入口
src/three/Canvas.jsx                      全局 Canvas
src/three/View.jsx                        R3F View 与 tunnel 接入
src/three/scenes/Billboard.jsx            圆柱照片墙
src/three/scenes/Banner.jsx               横幅彩条
src/three/scenes/index.js                 场景组件统一导出
src/styles/page.module.scss               页面 View 容器样式
```

---

## 3. 目标架构

### 3.1 新增文件

```text
src/three/scenes/FloatingLines.jsx
```

职责：

- 生成三层 wave：`top` / `middle` / `bottom`
- 生成多条曲线线段
- 管理 shader uniform
- 处理 pointer damping
- 处理局部弯曲
- 处理视差
- 提供接近 ReactBits 的 props

### 3.2 修改文件

```text
src/three/scenes/index.js
src/app/page.jsx
src/styles/page.module.scss
```

用途：

- `index.js` 导出 `FloatingLines`
- `page.jsx` 将 `FloatingLines` 接入首页 View
- `page.module.scss` 可选增加深色背景和 overflow 控制

### 3.3 文档同步文件

```text
docs/apps-code-map.md
docs/uiux-map.md
docs/背景效果/Floating-Lines-背景效果复刻实施计划.md
```

如实现阶段新增稳定 3D 背景模块，可继续补充：

```text
docs/背景效果/Three-背景效果模块说明.md
```

---

## 4. 组件接口设计

### 4.1 推荐接口

```jsx
<FloatingLines
    enabledWaves={['top', 'middle', 'bottom']}
    linesGradient={['#7dd3fc', '#818cf8', '#c084fc', '#f0abfc']}
    lineCount={[4, 5, 7]}
    lineDistance={[0.18, 0.16, 0.14]}
    animationSpeed={0.55}
    interactive
    bendRadius={1.15}
    bendStrength={-0.38}
    mouseDamping={0.055}
    parallax
    parallaxStrength={0.16}
/>
```

### 4.2 Props 说明

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `linesGradient` | `string[]` | Photo-Wall 预设色 | 线条渐变色，最多建议 8 个颜色 |
| `enabledWaves` | `Array<'top' \| 'middle' \| 'bottom'>` | `['top','middle','bottom']` | 启用的波浪层 |
| `lineCount` | `number \| number[]` | `[4,5,7]` | 每层线条数量 |
| `lineDistance` | `number \| number[]` | `[0.18,0.16,0.14]` | 每层线条间距，使用 Three 世界坐标 |
| `animationSpeed` | `number` | `0.55` | 动画速度倍率 |
| `interactive` | `boolean` | `true` | 是否响应鼠标弯曲 |
| `bendRadius` | `number` | `1.15` | 鼠标影响半径 |
| `bendStrength` | `number` | `-0.38` | 弯曲强度 |
| `mouseDamping` | `number` | `0.055` | 鼠标平滑阻尼 |
| `parallax` | `boolean` | `true` | 是否启用视差 |
| `parallaxStrength` | `number` | `0.16` | 视差强度 |

### 4.3 与 ReactBits 参数差异

ReactBits 页面参数偏屏幕空间，当前项目是 Three 世界空间，因此：

```text
lineDistance / bendRadius / bendStrength 不能照搬数值
需要按当前相机 fov=7、position z=70、照片墙 radius=5 的视觉尺度换算
```

---

## 5. 渲染方案

### 5.1 推荐实现方式

使用：

```text
BufferGeometry
+ ShaderMaterial
+ THREE.Line 或自定义 Tube/Strip 线段
+ useFrame 更新时间 uniform
```

优先采用 `BufferGeometry` 多点采样曲线，每条线一个 draw call，原因：

- 实现清晰
- 调试方便
- 与当前 R3F 结构兼容
- 可精确控制每条线的位置、透明度与层级
- 线条数量有限，性能成本可接受

### 5.2 几何采样

每条线由固定采样点组成：

```text
segments: 192 ~ 256
x: [-width, width]
y: baseY + waveOffset
z: layerZ
```

单点波形：

```text
y = baseY
  + sin(x * frequency + time * speed + phase) * amplitude
  + sin(x * secondaryFrequency - time * secondarySpeed + phase) * secondaryAmplitude
```

加入双频波动可以避免机械的单一正弦形态。

### 5.3 三层 wave 配置

```text
top:
  position: y=2.8, z=-8
  rotateZ: -0.08
  amplitude: 0.18
  alpha: 0.28
  layerFactor: 0.65

middle:
  position: y=0.4, z=-9.5
  rotateZ: 0.04
  amplitude: 0.12
  alpha: 0.2
  layerFactor: 0.35

bottom:
  position: y=-2.3, z=-7
  rotateZ: -0.14
  amplitude: 0.24
  alpha: 0.38
  layerFactor: 0.9
```

这些值需要在实现阶段按实际画面微调。

### 5.4 材质策略

推荐材质参数：

```js
{
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
}
```

原因：

- `depthWrite:false` 避免透明线条污染深度
- `depthTest:false` 可确保背景线条可见
- `AdditiveBlending` 模拟 ReactBits 的发光叠加
- `toneMapped:false` 与现有 `Billboard` / `Banner` 材质风格一致

如果线条穿帮或遮挡照片墙过强，可把 `depthTest` 改为可配置。

---

## 6. Shader 设计

### 6.1 Uniforms

建议 uniforms：

```text
uTime                  当前帧时间
uMouse                 平滑后的鼠标位置
uInteractive           是否启用交互
uBendRadius            弯曲半径
uBendStrength          弯曲强度
uColorA                渐变起始色
uColorB                渐变中间色
uColorC                渐变结束色
uAlpha                 当前线条透明度
uLineIndex             当前线条索引
uLineCount             当前层线条总数
```

### 6.2 顶点阶段

顶点阶段负责：

- 基础波动
- 鼠标局部弯曲
- 线条轻微错相

逻辑：

```text
animatedY = baseY + wave(time, x, phase)
mouseDistance = distance(worldPoint.xy, uMouse.xy)
falloff = smoothstep(uBendRadius, 0.0, mouseDistance)
bend = uBendStrength * falloff
position.xy += normal.xy * bend
```

### 6.3 片元阶段

片元阶段负责：

- 按 x 方向混合渐变色
- 按线条索引调节透明度
- 可选加入边缘衰减

```text
t = normalizedX
color = gradient(t)
alpha = uAlpha * lineFade
```

### 6.4 线条宽度问题

Three 原生 `LineBasicMaterial` 在大多数 WebGL 环境中线宽不可控。若需要接近 ReactBits 的稳定线宽，应优先考虑：

```text
方案 A：使用 drei Line / MeshLine 思路
方案 B：每条线构造成细长 ribbon mesh
方案 C：使用 shader 在平面中绘制距离场线条
```

为了“完全复刻”，推荐方案 B：**线条 ribbon mesh**。

每条线由上下两个顶点带组成：

```text
center point + normal * halfWidth
center point - normal * halfWidth
```

这样可以稳定控制线宽、抗锯齿与透明边缘。

---

## 7. 交互方案

### 7.1 鼠标坐标来源

在 R3F 中可从 `useFrame((state) => {})` 读取：

```text
state.pointer.x
state.pointer.y
```

范围为标准化坐标：

```text
x: -1 到 1
y: -1 到 1
```

需要换算为 FloatingLines 所处平面的世界坐标。

### 7.2 鼠标平滑

必须使用基于 delta 的平滑，不使用固定 sleep。

推荐：

```text
dampingFactor = 1 - pow(1 - mouseDamping, delta * 60)
mouse += (targetMouse - mouse) * dampingFactor
```

这样在不同帧率下表现更一致。

### 7.3 局部弯曲

采用距离场衰减：

```text
falloff = smoothstep(bendRadius, 0, distance)
bendAmount = bendStrength * falloff
```

弯曲方向不直接固定为 y 轴，而沿曲线法线方向偏移，保证线条像被鼠标“推开”或“吸附”。

### 7.4 视差

不改变相机，不影响 `OrbitControls`。

只移动 FloatingLines 组：

```text
group.position.x = dampedMouse.x * parallaxStrength * layerFactor
group.position.y = dampedMouse.y * parallaxStrength * layerFactor
```

三层 wave 使用不同 `layerFactor`，形成深度感。

---

## 8. 与当前背景融合策略

### 8.1 层级位置

第一阶段只做背景层：

```text
FloatingLines 放在照片墙 group 之前渲染
z 范围：-7 到 -12
```

避免线条遮挡照片主体。

如果需要更强沉浸感，第二阶段再加前景少量线：

```text
ForegroundFloatingLines
lineCount: 2 ~ 3
alpha: 0.08 ~ 0.16
z: -1 到 1
```

### 8.2 颜色适配

当前照片墙图片色彩丰富，线条应偏冷色和低透明度：

```text
冷蓝 #7dd3fc
靛蓝 #818cf8
紫色 #c084fc
品红 #f0abfc
```

不建议用过高亮度纯白线条，否则会压过图片墙。

### 8.3 背景底色

可选调整 `src/styles/page.module.scss`：

```scss
.page {
    width: 100%;
    height: 100svh;
    overflow: hidden;
    background:
        radial-gradient(circle at 50% 48%, rgba(59, 130, 246, 0.12), transparent 46%),
        #020617;
}
```

是否启用取决于实际画面。如果现有照片墙需要保持白底或透明背景，则不改。

---

## 9. 实施步骤

### 阶段一：准备与接入

1. 阅读 `src/three/View.jsx`，确认 pointer 与 View track 行为。
2. 阅读 `src/three/scenes/index.js`，确认导出写法。
3. 新增 `src/three/scenes/FloatingLines.jsx`。
4. 在 `src/three/scenes/index.js` 导出 `FloatingLines`。
5. 在 `src/app/page.jsx` 引入并临时接入 `<FloatingLines />`。

验收点：

```text
页面可正常启动
现有 Billboard / Banner 不受影响
FloatingLines 组件能被渲染
```

### 阶段二：基础波浪线

1. 实现 wave 配置表。
2. 实现 `enabledWaves`。
3. 实现 `lineCount` 与 `lineDistance` 数组归一化。
4. 生成每条线的 ribbon geometry。
5. 加入基础 shader 材质。
6. 使用 `useFrame` 更新时间。

验收点：

```text
可见三层波浪线
线条有连续波动
线条位置与照片墙不冲突
```

### 阶段三：渐变与发光

1. 实现 `linesGradient` 颜色转换。
2. 在 shader 中按 x 方向混合渐变。
3. 加入线条索引透明度衰减。
4. 设置 `AdditiveBlending`。
5. 微调 alpha，避免压过照片墙。

验收点：

```text
线条具有 ReactBits 式渐变光感
整体仍以照片墙为视觉主体
```

### 阶段四：鼠标弯曲

1. 读取 R3F `state.pointer`。
2. 将 pointer 换算到 FloatingLines 层的世界坐标。
3. 实现 delta-based mouse damping。
4. 在 shader 或 CPU 几何更新中加入距离场弯曲。
5. 调整 `bendRadius` 与 `bendStrength`。

验收点：

```text
鼠标靠近线条时出现局部弯曲
弯曲过渡平滑
鼠标离开后自然恢复
```

### 阶段五：视差

1. 为每层 wave group 增加 `layerFactor`。
2. 根据平滑鼠标坐标移动 group。
3. 确认不影响 OrbitControls。
4. 限制视差强度，防止背景晃动。

验收点：

```text
移动鼠标时三层线条有轻微空间错动
OrbitControls 仍可正常使用
```

### 阶段六：视觉精修

1. 根据实际画面微调三层 y/z/rotate。
2. 微调 lineCount、lineDistance、alpha。
3. 微调 animationSpeed。
4. 判断是否需要调整 `.page` 背景底色。
5. 检查移动端横竖屏表现。

验收点：

```text
效果接近 ReactBits Floating Lines
与当前照片墙背景统一
不喧宾夺主
```

### 阶段七：工程收尾

1. 更新 `docs/apps-code-map.md`。
2. 更新 `docs/uiux-map.md`。
3. 如新增稳定模块说明，更新 `docs/背景效果/Three-背景效果模块说明.md`。
4. 运行构建或至少运行开发环境检查。
5. 检查控制台无 WebGL / shader 报错。

---

## 10. 验收标准

### 10.1 视觉验收

- [ ] 页面中存在三层漂浮波浪线。
- [ ] 线条有明显但克制的渐变发光。
- [ ] 线条持续横向流动或波动。
- [ ] 波浪线与照片墙空间融合，不像独立贴图覆盖。
- [ ] 照片墙和 Banner 仍是页面主体。

### 10.2 交互验收

- [ ] 鼠标移动时线条有局部弯曲。
- [ ] 弯曲范围受 `bendRadius` 控制。
- [ ] 弯曲强度受 `bendStrength` 控制。
- [ ] 鼠标跟随具有平滑阻尼。
- [ ] 视差存在但不影响 OrbitControls。

### 10.3 工程验收

- [ ] `FloatingLines` 作为独立场景组件实现。
- [ ] 首页只通过组件接入，不堆叠复杂逻辑。
- [ ] 不破坏现有 `Billboard`、`Banner`、`Paper` 页面。
- [ ] 构建通过。
- [ ] 文档同步完成。

---

## 11. 风险与处理

### 11.1 Three 原生线宽不可控

风险：`LineBasicMaterial.linewidth` 在多数浏览器中无效。

处理：使用 ribbon mesh 替代原生 Line。

### 11.2 透明排序问题

风险：线条与照片墙透明材质可能出现遮挡顺序异常。

处理：

```text
depthWrite=false
必要时 depthTest=false
通过 renderOrder 固定渲染顺序
```

### 11.3 与 OrbitControls 交互冲突

风险：鼠标既控制 Orbit，又控制背景视差。

处理：

```text
不阻止 pointer 事件
不改 camera
只读取 pointer 并移动 FloatingLines group
```

### 11.4 视觉过亮

风险：加法混合导致线条压过照片墙。

处理：

```text
降低 alpha
减少 lineCount
提高 z 深度
增加背景层级区分
```

### 11.5 移动端性能压力

风险：大量 ribbon 顶点 + shader 动画在低端机有压力。

处理：

```text
移动端降低 segments
减少 lineCount
关闭 interactive 或 parallax
```

在用户要求“无视成本”的前提下，移动端降级作为后续优化，不阻塞第一版复刻。

---

## 12. 推荐默认预设

### 12.1 Photo-Wall 默认预设

```js
const PHOTO_WALL_FLOATING_LINES_PRESET = {
    enabledWaves: ['top', 'middle', 'bottom'],
    linesGradient: ['#7dd3fc', '#818cf8', '#c084fc', '#f0abfc'],
    lineCount: [4, 5, 7],
    lineDistance: [0.18, 0.16, 0.14],
    animationSpeed: 0.55,
    interactive: true,
    bendRadius: 1.15,
    bendStrength: -0.38,
    mouseDamping: 0.055,
    parallax: true,
    parallaxStrength: 0.16,
};
```

### 12.2 更强复刻预设

```js
const REACTBITS_LIKE_PRESET = {
    enabledWaves: ['top', 'middle', 'bottom'],
    linesGradient: ['#38bdf8', '#6366f1', '#a855f7', '#ec4899'],
    lineCount: [6, 8, 8],
    lineDistance: [0.14, 0.13, 0.12],
    animationSpeed: 0.9,
    interactive: true,
    bendRadius: 1.45,
    bendStrength: -0.55,
    mouseDamping: 0.05,
    parallax: true,
    parallaxStrength: 0.22,
};
```

实施时先使用 Photo-Wall 默认预设，确保符合当前背景效果；如视觉不够接近 ReactBits，再切到更强复刻预设微调。

---

## 13. 最终集成形态

首页最终结构建议：

```jsx
<View className={styles.view} orbit>
    <PerspectiveCamera
        makeDefault
        fov={7}
        position={[0, 0, 70]}
        near={0.01}
        far={100000}
    />

    <FloatingLines />

    <group rotation={[-0.15, 0, -0.2]}>
        {/* Billboard + Banner */}
    </group>
</View>
```

如果后续需要前景穿插线条，可扩展为：

```jsx
<FloatingLines variant="background" />
<PhotoWallGroup />
<FloatingLines variant="foreground" />
```

但第一版不建议拆两层，避免过度复杂。

---

## 14. 实施确认清单

进入编码前需要确认：

- [ ] 是否允许新增 `src/three/scenes/FloatingLines.jsx`？
- [ ] 是否允许修改首页 `src/app/page.jsx`？
- [ ] 是否允许根据实际效果微调 `src/styles/page.module.scss` 背景色？
- [ ] 是否以 Photo-Wall 默认预设为第一版视觉目标？
- [ ] 是否在第一版就加入移动端降级？

建议默认选择：

```text
允许新增 FloatingLines
允许修改首页
背景色先不改，除非实际画面需要
先按 Photo-Wall 默认预设
移动端降级放后续
```
