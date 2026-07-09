'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import FloatingLines2D from './FloatingLines2D';
import FloatingLinesDebugger from '../debug/FloatingLinesDebugger';
import styles from './BackgroundLayer.module.scss';

const FLOATING_LINES_PRESET = {
    enabledWaves: ['bottom', 'top', 'middle'],
    lineCount: [11, 4, 9],
    lineDistance: [7, 9, 5.5],
    topWavePosition: { x: 9.3, y: 0.5, rotate: -0.42 },
    middleWavePosition: { x: 11.4, y: 0.05, rotate: 0.58 },
    bottomWavePosition: { x: 1.2, y: -0.95, rotate: 0.52 },
    animationSpeed: 0.6,
    interactive: false,
    bendRadius: 7,
    bendStrength: -1.15,
    mouseDamping: 0.05,
    parallax: true,
    parallaxStrength: 1,
    mixBlendMode: 'screen',
    linesGradient: ['#7ee0ff', '#ffd479', '#ff9f7f', '#f6f7ff'],
};

const THEME_ACCENTS = {
    default: {
        primary: '255, 212, 121',
        secondary: '126, 224, 255',
        tertiary: '255, 159, 127',
        baseStart: '#05070a',
        baseMid: '#111114',
        baseEnd: '#060708',
    },
    'fengjing-jianzhi': {
        primary: '142, 190, 122',
        secondary: '242, 214, 166',
        tertiary: '108, 151, 132',
        baseStart: '#070b08',
        baseMid: '#15150f',
        baseEnd: '#060706',
    },
    'temp-01': {
        primary: '105, 164, 255',
        secondary: '255, 132, 96',
        tertiary: '225, 230, 235',
        baseStart: '#05070c',
        baseMid: '#10131a',
        baseEnd: '#050609',
    },
    'temp-02': {
        primary: '146, 205, 157',
        secondary: '223, 198, 136',
        tertiary: '94, 132, 107',
        baseStart: '#060907',
        baseMid: '#11170f',
        baseEnd: '#060706',
    },
    'temp-03': {
        primary: '223, 150, 130',
        secondary: '191, 172, 220',
        tertiary: '244, 213, 178',
        baseStart: '#0b0607',
        baseMid: '#151012',
        baseEnd: '#070506',
    },
    'temp-04': {
        primary: '176, 194, 210',
        secondary: '110, 145, 172',
        tertiary: '236, 232, 218',
        baseStart: '#050708',
        baseMid: '#111417',
        baseEnd: '#050606',
    },
    'temp-05': {
        primary: '255, 126, 82',
        secondary: '93, 172, 196',
        tertiary: '245, 206, 105',
        baseStart: '#080606',
        baseMid: '#17100c',
        baseEnd: '#060606',
    },
    'temp-06': {
        primary: '107, 158, 190',
        secondary: '196, 215, 198',
        tertiary: '223, 183, 116',
        baseStart: '#05080a',
        baseMid: '#0e1518',
        baseEnd: '#050607',
    },
    'temp-07': {
        primary: '236, 213, 168',
        secondary: '172, 190, 206',
        tertiary: '214, 138, 102',
        baseStart: '#080706',
        baseMid: '#15120e',
        baseEnd: '#050505',
    },
    'temp-08': {
        primary: '172, 143, 213',
        secondary: '115, 197, 174',
        tertiary: '232, 188, 104',
        baseStart: '#070609',
        baseMid: '#121018',
        baseEnd: '#050506',
    },
};

function getRouteClass(pathname) {
    if (pathname === '/paper') return styles.paper;
    if (pathname === '/directory') return styles.directory;
    return styles.tower;
}

function rgbStringToHex(value) {
    const parts = value
        .split(',')
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter((part) => Number.isFinite(part));

    if (parts.length !== 3) return '#ffffff';

    return `#${parts
        .map((part) => Math.max(0, Math.min(part, 255)).toString(16).padStart(2, '0'))
        .join('')}`;
}

export default function BackgroundLayer({ pathname }) {
    const { activeTheme } = useTheme();
    const searchParams = useSearchParams();
    const accent = THEME_ACCENTS[activeTheme?.id] ?? THEME_ACCENTS.default;
    const showFloatingLines = pathname === '/';
    const isDebugMode = searchParams.get('debug') === 'floating-lines';

    const [debugConfig, setDebugConfig] = useState(() => ({
        ...FLOATING_LINES_PRESET,
        linesGradient: [
            rgbStringToHex(accent.secondary),
            rgbStringToHex(accent.primary),
            rgbStringToHex(accent.tertiary),
            '#f6f7ff',
        ],
    }));
    const activePreset = isDebugMode ? debugConfig : FLOATING_LINES_PRESET;

    const style = useMemo(
        () => ({
            '--background-primary-rgb': accent.primary,
            '--background-secondary-rgb': accent.secondary,
            '--background-tertiary-rgb': accent.tertiary,
            '--background-base-start': accent.baseStart,
            '--background-base-mid': accent.baseMid,
            '--background-base-end': accent.baseEnd,
        }),
        [
            accent.primary,
            accent.secondary,
            accent.tertiary,
            accent.baseStart,
            accent.baseMid,
            accent.baseEnd,
        ]
    );

    return (
        <div
            className={`${styles.background} ${getRouteClass(pathname)}`}
            style={style}
            aria-hidden="true"
        >
            <div className={styles.chroma} />
            <div className={styles.lightField} />
            {showFloatingLines && (
                <FloatingLines2D
                    className={styles.floatingLines}
                    linesGradient={[
                        rgbStringToHex(accent.secondary),
                        rgbStringToHex(accent.primary),
                        rgbStringToHex(accent.tertiary),
                        '#f6f7ff',
                    ]}
                    {...activePreset}
                />
            )}
            {isDebugMode && (
                <FloatingLinesDebugger config={debugConfig} onChange={setDebugConfig} />
            )}
            <div className={styles.architecture} />
            <div className={styles.horizon} />
            <div className={styles.grid} />
            <div className={styles.noise} />
        </div>
    );
}
