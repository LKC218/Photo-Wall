import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const srcDir = path.join('public', 'images', '动物头像');
const outDir = path.join('public', 'images');

if (!fs.existsSync(srcDir)) {
    console.error(`源目录不存在: ${srcDir}`);
    process.exit(1);
}

// 读取目录，按文件名中的数字序号数值升序排序（避免 10 排到 2 之前）
const files = fs
    .readdirSync(srcDir)
    .filter((f) => fs.statSync(path.join(srcDir, f)).isFile())
    .sort((a, b) => {
        const na = parseInt((a.match(/(\d+)/) || [])[1] ?? '0', 10);
        const nb = parseInt((b.match(/(\d+)/) || [])[1] ?? '0', 10);
        return na - nb;
    });

console.log(`共发现 ${files.length} 张动物图片，开始转换...`);

for (let i = 0; i < files.length; i++) {
    const srcFile = path.join(srcDir, files[i]);
    const n = i + 1;
    const outFile = path.join(outDir, `img${n}.webp`);
    await sharp(srcFile).webp({ quality: 80 }).toFile(outFile);
    console.log(`${files[i]} -> img${n}.webp`);
}

// 全部转换成功后再删除源目录
fs.rmSync(srcDir, { recursive: true, force: true });
console.log(`已删除源目录: ${srcDir}`);
console.log('转换完成，共生成', files.length, '张 webp 图片。');
