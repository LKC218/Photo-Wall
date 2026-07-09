'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
    Clock,
    Mesh,
    OrthographicCamera,
    PlaneGeometry,
    Scene,
    ShaderMaterial,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three';

const MAX_GRADIENT_STOPS = 8;
const MAX_LINES_PER_LAYER = 24;
const DEFAULT_GRADIENT = ['#7dd3fc', '#818cf8', '#c084fc', '#f0abfc'];
const DEFAULT_LINE_COUNT = [6, 8, 10];
const DEFAULT_LINE_DISTANCE = [8, 6, 4];
const DEFAULT_ENABLED_WAVES = ['top', 'middle', 'bottom'];
const DEFAULT_TOP_WAVE_POSITION = { x: 10, y: 0.5, rotate: -0.4 };
const DEFAULT_MIDDLE_WAVE_POSITION = { x: 5, y: 0, rotate: 0.2 };
const DEFAULT_BOTTOM_WAVE_POSITION = { x: 2, y: -0.7, rotate: 0.4 };

const vertexShader = `
precision highp float;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uAnimationSpeed;

uniform int uTopLineCount;
uniform int uMiddleLineCount;
uniform int uBottomLineCount;
uniform float uTopLineDistance;
uniform float uMiddleLineDistance;
uniform float uBottomLineDistance;
uniform vec3 uTopWavePosition;
uniform vec3 uMiddleWavePosition;
uniform vec3 uBottomWavePosition;

uniform vec2 uMouse;
uniform float uInteractive;
uniform float uBendRadius;
uniform float uBendStrength;
uniform float uBendInfluence;

uniform float uParallax;
uniform vec2 uParallaxOffset;
uniform vec3 uGradient[8];
uniform int uGradientCount;

const int MAX_LINES = 24;

mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, s, -s, c);
}

vec3 gradientColor(float t) {
    if (uGradientCount <= 0) {
        return vec3(0.38, 0.58, 1.0);
    }

    if (uGradientCount == 1) {
        return uGradient[0];
    }

    float scaled = clamp(t, 0.0, 0.9999) * float(uGradientCount - 1);
    int index = int(floor(scaled));
    int nextIndex = min(index + 1, uGradientCount - 1);
    float blendValue = fract(scaled);

    return mix(uGradient[index], uGradient[nextIndex], blendValue);
}

float waveField(vec2 uv, float offset, vec2 baseUv, vec2 mouseUv) {
    float time = uTime * uAnimationSpeed;
    float amp = 0.2 + sin(offset + time * 0.2) * 0.16;
    float y = sin(uv.x + offset + time * 0.12) * amp;
    y += sin(uv.x * 1.7 - time * 0.09 + offset * 0.55) * 0.08;

    if (uInteractive > 0.5) {
        vec2 delta = baseUv - mouseUv;
        float influence = exp(-dot(delta, delta) * uBendRadius);
        y += (mouseUv.y - baseUv.y) * influence * uBendStrength * uBendInfluence;
    }

    float distanceToWave = abs(uv.y - y);
    float core = 0.014 / max(distanceToWave + 0.012, 0.001);
    float glow = 0.008 / max(distanceToWave + 0.08, 0.001);
    return core + glow;
}

vec3 layerLines(
    vec2 baseUv,
    vec2 mouseUv,
    int lineCount,
    float lineDistance,
    vec3 wavePosition,
    float startOffset,
    float strength,
    float reverseX
) {
    vec3 color = vec3(0.0);
    float angle = wavePosition.z * log(length(baseUv) + 1.0);
    vec2 rotatedUv = baseUv * rotate2d(angle);
    rotatedUv.x *= reverseX;

    for (int i = 0; i < MAX_LINES; i++) {
        if (i >= lineCount) {
            break;
        }

        float fi = float(i);
        float t = fi / max(float(lineCount - 1), 1.0);
        vec2 lineUv = rotatedUv + vec2(lineDistance * fi + wavePosition.x, wavePosition.y);
        color += gradientColor(t) * waveField(lineUv, startOffset + 0.2 * fi, baseUv, mouseUv) * strength;
    }

    return color;
}

void main() {
    vec2 baseUv = (2.0 * gl_FragCoord.xy - uResolution.xy) / uResolution.y;
    baseUv.y *= -1.0;
    baseUv += uParallaxOffset * uParallax;

    vec2 mouseUv = (2.0 * uMouse - uResolution.xy) / uResolution.y;
    mouseUv.y *= -1.0;

    vec3 color = vec3(0.0);
    color += layerLines(baseUv, mouseUv, uBottomLineCount, uBottomLineDistance, uBottomWavePosition, 1.5, 0.18, 1.0);
    color += layerLines(baseUv, mouseUv, uMiddleLineCount, uMiddleLineDistance, uMiddleWavePosition, 2.0, 0.54, 1.0);
    color += layerLines(baseUv, mouseUv, uTopLineCount, uTopLineDistance, uTopWavePosition, 1.0, 0.12, -1.0);

    float vignette = smoothstep(1.55, 0.25, length(baseUv * vec2(0.72, 1.0)));
    gl_FragColor = vec4(color * vignette, 1.0);
}
`;

function hexToVector3(hex) {
    let value = hex.trim();
    if (value.startsWith('#')) value = value.slice(1);

    if (value.length === 3) {
        value = value
            .split('')
            .map((part) => part + part)
            .join('');
    }

    const numeric = Number.parseInt(value, 16);
    if (!Number.isFinite(numeric)) return new Vector3(1, 1, 1);

    return new Vector3(
        ((numeric >> 16) & 255) / 255,
        ((numeric >> 8) & 255) / 255,
        (numeric & 255) / 255
    );
}

function normalizeLayerNumber(value, waveIndex, fallback) {
    if (typeof value === 'number') return value;
    return value?.[waveIndex] ?? fallback;
}

function useReducedMotion() {
    return useMemo(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    }, []);
}

export default function FloatingLines2D({
    className,
    linesGradient = DEFAULT_GRADIENT,
    enabledWaves = DEFAULT_ENABLED_WAVES,
    lineCount = DEFAULT_LINE_COUNT,
    lineDistance = DEFAULT_LINE_DISTANCE,
    topWavePosition = DEFAULT_TOP_WAVE_POSITION,
    middleWavePosition = DEFAULT_MIDDLE_WAVE_POSITION,
    bottomWavePosition = DEFAULT_BOTTOM_WAVE_POSITION,
    animationSpeed = 0.8,
    interactive = true,
    bendRadius = 7,
    bendStrength = -1.2,
    mouseDamping = 0.05,
    parallax = true,
    parallaxStrength = 0.12,
    mixBlendMode = 'screen',
}) {
    const containerRef = useRef(null);
    const targetMouse = useRef(new Vector2(-1000, -1000));
    const currentMouse = useRef(new Vector2(-1000, -1000));
    const targetInfluence = useRef(0);
    const currentInfluence = useRef(0);
    const targetParallax = useRef(new Vector2(0, 0));
    const currentParallax = useRef(new Vector2(0, 0));
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        const container = containerRef.current;
        if (!container || reducedMotion) return undefined;

        let active = true;
        const scene = new Scene();
        const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        camera.position.z = 1;

        const renderer = new WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        container.appendChild(renderer.domElement);

        const gradientStops = linesGradient.slice(0, MAX_GRADIENT_STOPS);
        const gradientVectors = Array.from({ length: MAX_GRADIENT_STOPS }, (_, index) =>
            gradientStops[index] ? hexToVector3(gradientStops[index]) : new Vector3(1, 1, 1)
        );

        const uniforms = {
            uTime: { value: 0 },
            uResolution: { value: new Vector3(1, 1, 1) },
            uAnimationSpeed: { value: animationSpeed },
            uTopLineCount: {
                value: enabledWaves.includes('top')
                    ? Math.min(normalizeLayerNumber(lineCount, 0, 6), MAX_LINES_PER_LAYER)
                    : 0,
            },
            uMiddleLineCount: {
                value: enabledWaves.includes('middle')
                    ? Math.min(normalizeLayerNumber(lineCount, 1, 8), MAX_LINES_PER_LAYER)
                    : 0,
            },
            uBottomLineCount: {
                value: enabledWaves.includes('bottom')
                    ? Math.min(normalizeLayerNumber(lineCount, 2, 10), MAX_LINES_PER_LAYER)
                    : 0,
            },
            uTopLineDistance: { value: normalizeLayerNumber(lineDistance, 0, 8) * 0.01 },
            uMiddleLineDistance: { value: normalizeLayerNumber(lineDistance, 1, 6) * 0.01 },
            uBottomLineDistance: { value: normalizeLayerNumber(lineDistance, 2, 4) * 0.01 },
            uTopWavePosition: {
                value: new Vector3(topWavePosition.x, topWavePosition.y, topWavePosition.rotate),
            },
            uMiddleWavePosition: {
                value: new Vector3(
                    middleWavePosition.x,
                    middleWavePosition.y,
                    middleWavePosition.rotate
                ),
            },
            uBottomWavePosition: {
                value: new Vector3(
                    bottomWavePosition.x,
                    bottomWavePosition.y,
                    bottomWavePosition.rotate
                ),
            },
            uMouse: { value: new Vector2(-1000, -1000) },
            uInteractive: { value: interactive ? 1 : 0 },
            uBendRadius: { value: bendRadius },
            uBendStrength: { value: bendStrength },
            uBendInfluence: { value: 0 },
            uParallax: { value: parallax ? 1 : 0 },
            uParallaxOffset: { value: new Vector2(0, 0) },
            uGradient: { value: gradientVectors },
            uGradientCount: { value: gradientStops.length },
        };

        const material = new ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
        });
        const geometry = new PlaneGeometry(2, 2);
        const mesh = new Mesh(geometry, material);
        scene.add(mesh);

        const clock = new Clock();

        const setSize = () => {
            if (!active) return;

            const width = container.clientWidth || 1;
            const height = container.clientHeight || 1;
            renderer.setSize(width, height, false);
            uniforms.uResolution.value.set(
                renderer.domElement.width,
                renderer.domElement.height,
                1
            );
        };

        const updatePointer = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const dpr = renderer.getPixelRatio();

            targetMouse.current.set(x * dpr, (rect.height - y) * dpr);
            targetInfluence.current = 1;

            if (parallax) {
                targetParallax.current.set(
                    ((x - rect.width * 0.5) / rect.width) * parallaxStrength,
                    (-(y - rect.height * 0.5) / rect.height) * parallaxStrength
                );
            }
        };

        const clearPointer = () => {
            targetInfluence.current = 0;
            targetParallax.current.set(0, 0);
        };

        setSize();

        const resizeObserver =
            typeof ResizeObserver !== 'undefined' ? new ResizeObserver(setSize) : null;
        resizeObserver?.observe(container);

        if (interactive) {
            window.addEventListener('pointermove', updatePointer, { passive: true });
            window.addEventListener('pointerleave', clearPointer);
            window.addEventListener('blur', clearPointer);
        }

        let frameId = 0;
        const render = () => {
            if (!active) return;

            uniforms.uTime.value = clock.getElapsedTime();

            if (interactive) {
                currentMouse.current.lerp(targetMouse.current, mouseDamping);
                currentInfluence.current +=
                    (targetInfluence.current - currentInfluence.current) * mouseDamping;
                uniforms.uMouse.value.copy(currentMouse.current);
                uniforms.uBendInfluence.value = currentInfluence.current;
            }

            if (parallax) {
                currentParallax.current.lerp(targetParallax.current, mouseDamping);
                uniforms.uParallaxOffset.value.copy(currentParallax.current);
            }

            renderer.render(scene, camera);
            frameId = window.requestAnimationFrame(render);
        };

        render();

        return () => {
            active = false;
            window.cancelAnimationFrame(frameId);
            resizeObserver?.disconnect();

            if (interactive) {
                window.removeEventListener('pointermove', updatePointer);
                window.removeEventListener('pointerleave', clearPointer);
                window.removeEventListener('blur', clearPointer);
            }

            geometry.dispose();
            material.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
        };
    }, [
        animationSpeed,
        bendRadius,
        bendStrength,
        bottomWavePosition,
        enabledWaves,
        interactive,
        lineCount,
        lineDistance,
        linesGradient,
        middleWavePosition,
        mouseDamping,
        parallax,
        parallaxStrength,
        reducedMotion,
        topWavePosition,
    ]);

    return <div ref={containerRef} className={className} style={{ mixBlendMode }} />;
}
