import images from './images';

const fengjingJianzhiImages = Array.from({ length: 17 }, (_, i) => ({
    url: `/photos/fengjing-jianzhi/风景剪纸_${i + 1}.webp`,
}));

const shuicaiBizhiFengjingImages = Array.from({ length: 14 }, (_, i) => ({
    url: `/photos/水彩_壁纸风景/水彩壁纸风景_${i + 1}.webp`,
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
export const presetThemes = [
    {
        id: 'default',
        name: '默认',
        cover: '/photos/default/img1.webp',
        tags: ['PHOTOGRAPHY', '3D SCENE', 'INTERACTIVE', 'WEBGL'],
        importedAt: '2026-07-08',
        images,
    },
    {
        id: 'fengjing-jianzhi',
        name: '风景剪纸',
        cover: '/photos/fengjing-jianzhi/风景剪纸_1.webp',
        tags: ['PAPER-CUT', 'SCENERY', 'ILLUSTRATION'],
        importedAt: '2026-07-09',
        images: fengjingJianzhiImages,
    },
    {
        id: 'shuicai-bizhi-fengjing',
        name: '水彩壁纸风景',
        cover: '/photos/水彩_壁纸风景/水彩壁纸风景_1.webp',
        tags: ['WATERCOLOR', 'WALLPAPER', 'SCENERY'],
        importedAt: '2026-07-14',
        images: shuicaiBizhiFengjingImages,
    },
];

export default presetThemes;
