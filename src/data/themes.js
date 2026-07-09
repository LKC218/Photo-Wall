import images from './images';

const fengjingJianzhiImages = Array.from({ length: 17 }, (_, i) => ({
    url: `/photos/fengjing-jianzhi/风景剪纸_${i + 1}.webp`,
}));

/**
 * 预设主题注册表（构建期主题 / 方案 A）
 *
 * 每个主题对应 public/photos/<id>/ 目录下的图片。
 * 新增预设主题：把图片放入 public/photos/<新id>/，并在此数组追加一条记录即可，
 * 无需改动其它代码（三页面统一从 ThemeContext 读取 activeTheme.images）。
 *
 * 字段说明：
 *  - id:    唯一标识，预设主题以纯字母命名（用户主题以 "user-" 前缀区分）
 *  - name:  展示名称
 *  - cover: 可选，主题封面（用于切换器预览），缺省取首图
 *  - tags:  可选，主题标签列表（用于主题目录中间栏展示）
 *  - images: 图片清单 [{ url }]
 */
// TODO: 动画测试用临时主题，测试完成后删除
const TEMP_THEMES = [
    { id: 'temp-01', name: '城市剪影', tags: ['PHOTOGRAPHY', 'URBAN'], images: images.slice(0, 5) },
    { id: 'temp-02', name: '自然微距', tags: ['NATURE', 'MACRO'], images: images.slice(5, 10) },
    {
        id: 'temp-03',
        name: '人像纪实',
        tags: ['PORTRAIT', 'DOCUMENTARY'],
        images: images.slice(10, 15),
    },
    {
        id: 'temp-04',
        name: '建筑几何',
        tags: ['ARCHITECTURE', 'GEOMETRY'],
        images: images.slice(15, 20),
    },
    { id: 'temp-05', name: '街头色彩', tags: ['STREET', 'COLOR'], images: images.slice(20, 25) },
    {
        id: 'temp-06',
        name: '山川湖海',
        tags: ['LANDSCAPE', 'TRAVEL'],
        images: images.slice(25, 30),
    },
    {
        id: 'temp-07',
        name: '静物光影',
        tags: ['STILL LIFE', 'LIGHT'],
        images: [...images.slice(30), ...images.slice(0, 2)],
    },
    { id: 'temp-08', name: '抽象纹理', tags: ['ABSTRACT', 'TEXTURE'], images: images.slice(3, 8) },
];

export const presetThemes = [
    {
        id: 'default',
        name: '默认',
        cover: '/photos/default/img1.webp',
        tags: ['PHOTOGRAPHY', '3D SCENE', 'INTERACTIVE', 'WEBGL'],
        images,
    },
    {
        id: 'fengjing-jianzhi',
        name: '风景剪纸',
        cover: '/photos/fengjing-jianzhi/风景剪纸_1.webp',
        tags: ['PAPER-CUT', 'SCENERY', 'ILLUSTRATION'],
        images: fengjingJianzhiImages,
    },
    ...TEMP_THEMES,
];

export default presetThemes;
