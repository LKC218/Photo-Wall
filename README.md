# Photo Wall

Photo Wall 是一个基于 Next.js、Three.js 和 React Three Fiber 的动态照片墙项目，提供多种 WebGL 视觉动效，并围绕组件化、性能优化和交互拓展持续演进。

## 技术栈

- Next.js 15
- React 19
- Three.js
- React Three Fiber
- Drei
- Sass

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

浏览器打开：

```text
http://localhost:3000
```

## 构建

```bash
npm run build
```

构建产物会输出到 `out/` 目录（静态导出）。

## 可用页面

- `/`：Tower 动态图片塔
- `/paper`：Paper 效果
- `/spiral`：Spiral 效果

## 后续优化方向

- 将当前 Demo 整理为可配置的照片墙组件
- 增加移动端和低性能设备降级方案
- 优化图片加载、纹理生成和资源释放流程
- 增加鼠标、滚动和图片组切换交互
- 补充更完整的项目文档与部署说明
