'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './FloatingLinesDebugger.module.scss';

const WAVE_KEYS = ['top', 'middle', 'bottom'];
const BLEND_MODES = ['screen', 'normal', 'overlay', 'multiply', 'lighten', 'difference'];

function formatNumber(value, digits = 2) {
    return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

function Slider({ label, value, min, max, step = 1, onChange, digits = 2 }) {
    return (
        <label className={styles.control}>
            <span className={styles.controlLabel}>{label}</span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number.parseFloat(event.target.value))}
            />
            <span className={styles.controlValue}>{formatNumber(value, digits)}</span>
        </label>
    );
}

function ColorInput({ label, value, onChange }) {
    return (
        <label className={`${styles.control} ${styles.colorControl}`}>
            <span className={styles.controlLabel}>{label}</span>
            <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
        </label>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <label className={styles.control}>
            <span className={styles.controlLabel}>{label}</span>
            <button
                type="button"
                className={`${styles.toggle} ${checked ? styles.toggleActive : ''}`}
                onClick={() => onChange(!checked)}
                aria-pressed={checked}
            >
                <span />
            </button>
        </label>
    );
}

function WavePosition({ title, position, onChange }) {
    const update = useCallback(
        (key, value) => {
            onChange({ ...position, [key]: value });
        },
        [position, onChange]
    );

    return (
        <div className={styles.waveGroup}>
            <h5>{title}</h5>
            <Slider
                label="x"
                value={position.x}
                min={-20}
                max={20}
                step={0.1}
                digits={1}
                onChange={(value) => update('x', value)}
            />
            <Slider
                label="y"
                value={position.y}
                min={-2}
                max={2}
                step={0.05}
                digits={2}
                onChange={(value) => update('y', value)}
            />
            <Slider
                label="rotate"
                value={position.rotate}
                min={-1}
                max={1}
                step={0.01}
                digits={2}
                onChange={(value) => update('rotate', value)}
            />
        </div>
    );
}

export default function FloatingLinesDebugger({ config, onChange }) {
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const update = useCallback(
        (patch) => {
            onChange({ ...config, ...patch });
        },
        [config, onChange]
    );

    const exportedJson = useMemo(() => JSON.stringify(config, null, 4), [config]);

    const copyToClipboard = useCallback(() => {
        navigator.clipboard?.writeText(exportedJson).catch(() => {});
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    }, [exportedJson]);

    const updateArray = useCallback(
        (key, index, value) => {
            const next = [...config[key]];
            next[index] = value;
            update({ [key]: next });
        },
        [config, update]
    );

    const updateGradient = useCallback(
        (index, value) => {
            const next = [...config.linesGradient];
            next[index] = value;
            update({ linesGradient: next });
        },
        [config.linesGradient, update]
    );

    const toggleWave = useCallback(
        (key, checked) => {
            const set = new Set(config.enabledWaves);
            if (checked) set.add(key);
            else set.delete(key);
            update({ enabledWaves: Array.from(set) });
        },
        [config.enabledWaves, update]
    );

    const panel = (
        <div className={styles.debugger}>
            <div className={styles.header}>
                <h3>FloatingLines 调试面板</h3>
                <button type="button" className={styles.exportBtn} onClick={copyToClipboard}>
                    {copied ? '已复制' : '导出 JSON'}
                </button>
            </div>

            <div className={styles.body}>
                <section>
                    <h4>颜色</h4>
                    <div className={styles.colorRow}>
                        {config.linesGradient.map((color, index) => (
                            <ColorInput
                                key={index}
                                label={`#${index + 1}`}
                                value={color}
                                onChange={(value) => updateGradient(index, value)}
                            />
                        ))}
                    </div>
                </section>

                <section>
                    <h4>波浪层</h4>
                    <div className={styles.checkRow}>
                        {WAVE_KEYS.map((key) => (
                            <label key={key} className={styles.check}>
                                <input
                                    type="checkbox"
                                    checked={config.enabledWaves.includes(key)}
                                    onChange={(event) => toggleWave(key, event.target.checked)}
                                />
                                {key}
                            </label>
                        ))}
                    </div>
                    {WAVE_KEYS.map((key, index) => (
                        <Slider
                            key={`count-${key}`}
                            label={`${key} 线条数`}
                            value={config.lineCount[index]}
                            min={1}
                            max={24}
                            step={1}
                            digits={0}
                            onChange={(value) => updateArray('lineCount', index, value)}
                        />
                    ))}
                    {WAVE_KEYS.map((key, index) => (
                        <Slider
                            key={`dist-${key}`}
                            label={`${key} 间距`}
                            value={config.lineDistance[index]}
                            min={0}
                            max={20}
                            step={0.5}
                            digits={1}
                            onChange={(value) => updateArray('lineDistance', index, value)}
                        />
                    ))}
                </section>

                <section>
                    <h4>位置</h4>
                    <WavePosition
                        title="Top"
                        position={config.topWavePosition}
                        onChange={(value) => update({ topWavePosition: value })}
                    />
                    <WavePosition
                        title="Middle"
                        position={config.middleWavePosition}
                        onChange={(value) => update({ middleWavePosition: value })}
                    />
                    <WavePosition
                        title="Bottom"
                        position={config.bottomWavePosition}
                        onChange={(value) => update({ bottomWavePosition: value })}
                    />
                </section>

                <section>
                    <h4>动画与交互</h4>
                    <Slider
                        label="动画速度"
                        value={config.animationSpeed}
                        min={0}
                        max={3}
                        step={0.05}
                        digits={2}
                        onChange={(value) => update({ animationSpeed: value })}
                    />
                    <Toggle
                        label="鼠标交互"
                        checked={config.interactive}
                        onChange={(value) => update({ interactive: value })}
                    />
                    <Slider
                        label="弯曲半径"
                        value={config.bendRadius}
                        min={0}
                        max={20}
                        step={0.1}
                        digits={1}
                        onChange={(value) => update({ bendRadius: value })}
                    />
                    <Slider
                        label="弯曲强度"
                        value={config.bendStrength}
                        min={-5}
                        max={5}
                        step={0.05}
                        digits={2}
                        onChange={(value) => update({ bendStrength: value })}
                    />
                    <Slider
                        label="鼠标阻尼"
                        value={config.mouseDamping}
                        min={0.01}
                        max={0.3}
                        step={0.001}
                        digits={3}
                        onChange={(value) => update({ mouseDamping: value })}
                    />
                </section>

                <section>
                    <h4>视差与混合</h4>
                    <Toggle
                        label="视差"
                        checked={config.parallax}
                        onChange={(value) => update({ parallax: value })}
                    />
                    <Slider
                        label="视差强度"
                        value={config.parallaxStrength}
                        min={0}
                        max={1}
                        step={0.01}
                        digits={2}
                        onChange={(value) => update({ parallaxStrength: value })}
                    />
                    <label className={styles.control}>
                        <span className={styles.controlLabel}>混合模式</span>
                        <select
                            value={config.mixBlendMode}
                            onChange={(event) => update({ mixBlendMode: event.target.value })}
                        >
                            {BLEND_MODES.map((mode) => (
                                <option key={mode} value={mode}>
                                    {mode}
                                </option>
                            ))}
                        </select>
                    </label>
                </section>

                <section>
                    <h4>导出配置</h4>
                    <textarea className={styles.jsonArea} readOnly value={exportedJson} rows={14} />
                </section>
            </div>
        </div>
    );

    if (!mounted) return null;
    return createPortal(panel, document.body);
}
