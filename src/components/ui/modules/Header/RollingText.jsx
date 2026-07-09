'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from './RollingText.module.scss';

/**
 * 文字滚动悬停动效原子组件（复刻 gabrielcojea "Rolling Text Hover Animation"）。
 * - 挂载时把文字拆成逐字符 inline-block 容器，每个字符内含 .top / .bottom 两份相同文字副本；
 * - .char 使用 overflow:hidden + grid 重叠，默认只露 .top，.bottom 被裁在下方；
 * - 悬停：GSAP 逐字（stagger）将 .top 上滚 yPercent:-100、.bottom 滚入 yPercent:0，露出强调色副本；
 * - 离开：反向滚回原位；
 * - active：选中态默认停在副本（高亮），hover 时反向滚动一次（露出原文字）。
 */
export default function RollingText({
    children,
    as: Tag = 'span',
    className = '',
    active = false,
    hoverColor,
    stagger = 0.03,
    duration = 0.4,
}) {
    const elRef = useRef(null);
    const topsRef = useRef([]);
    const bottomsRef = useRef([]);
    const hoveringRef = useRef(false);

    useEffect(() => {
        const el = elRef.current;
        if (!el) return;

        const text = typeof children === 'string' ? children : String(children ?? '');
        el.innerHTML = '';
        const frag = document.createDocumentFragment();
        const tops = [];
        const bottoms = [];
        [...text].forEach((ch) => {
            const char = document.createElement('span');
            char.className = styles.char;
            const inner = document.createElement('span');
            inner.className = styles.inner;
            const top = document.createElement('span');
            top.className = styles.top;
            top.textContent = ch === ' ' ? ' ' : ch;
            const bottom = document.createElement('span');
            bottom.className = styles.bottom;
            bottom.setAttribute('aria-hidden', 'true');
            bottom.textContent = ch === ' ' ? ' ' : ch;
            inner.appendChild(top);
            inner.appendChild(bottom);
            char.appendChild(inner);
            frag.appendChild(char);
            tops.push(top);
            bottoms.push(bottom);
        });
        el.appendChild(frag);
        topsRef.current = tops;
        bottomsRef.current = bottoms;

        const roll = (yTop, yBottom) => {
            gsap.to(topsRef.current, { yPercent: yTop, duration, ease: 'power3.inOut', stagger });
            gsap.to(bottomsRef.current, {
                yPercent: yBottom,
                duration,
                ease: 'power3.inOut',
                stagger,
            });
        };

        // 初始位置：active 默认停在副本（高亮），否则停在原文字
        gsap.set(topsRef.current, { yPercent: active ? -100 : 0 });
        gsap.set(bottomsRef.current, { yPercent: active ? 0 : 100 });

        const onEnter = () => {
            hoveringRef.current = true;
            if (active) roll(0, 100);
            else roll(-100, 0);
        };
        const onLeave = () => {
            hoveringRef.current = false;
            if (active) roll(-100, 0);
            else roll(0, 100);
        };

        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);

        return () => {
            el.removeEventListener('mouseenter', onEnter);
            el.removeEventListener('mouseleave', onLeave);
            gsap.killTweensOf(topsRef.current);
            gsap.killTweensOf(bottomsRef.current);
        };
    }, [children, active, stagger, duration]);

    // active 变化且当前未 hover 时，平滑过渡到目标位置
    useEffect(() => {
        if (!hoveringRef.current) {
            gsap.to(topsRef.current, {
                yPercent: active ? -100 : 0,
                duration,
                ease: 'power3.inOut',
                stagger,
            });
            gsap.to(bottomsRef.current, {
                yPercent: active ? 0 : 100,
                duration,
                ease: 'power3.inOut',
                stagger,
            });
        }
    }, [active, duration, stagger]);

    const style = hoverColor ? { '--rolling-hover-color': hoverColor } : undefined;

    return (
        <Tag ref={elRef} className={`${styles.rolling} ${className}`} style={style}>
            {children}
        </Tag>
    );
}
