'use client';

import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

const WAVE_ORDER = ['top', 'middle', 'bottom'];

const DEFAULT_GRADIENT = ['#7dd3fc', '#818cf8', '#c084fc', '#f0abfc'];

const WAVE_CONFIG = {
    top: {
        position: [0, 2.8, -8],
        rotation: [0, 0, -0.08],
        amplitude: 0.18,
        secondaryAmplitude: 0.055,
        frequency: 1.22,
        secondaryFrequency: 2.4,
        alpha: 0.28,
        layerFactor: 0.65,
        phase: 0.2,
    },
    middle: {
        position: [0, 0.4, -9.5],
        rotation: [0, 0, 0.04],
        amplitude: 0.12,
        secondaryAmplitude: 0.04,
        frequency: 1.05,
        secondaryFrequency: 2.1,
        alpha: 0.2,
        layerFactor: 0.35,
        phase: 1.3,
    },
    bottom: {
        position: [0, -2.3, -7],
        rotation: [0, 0, -0.14],
        amplitude: 0.24,
        secondaryAmplitude: 0.075,
        frequency: 1.36,
        secondaryFrequency: 2.8,
        alpha: 0.38,
        layerFactor: 0.9,
        phase: 2.1,
    },
};

const vertexShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uInteractive;
    uniform float uBendRadius;
    uniform float uBendStrength;
    uniform float uAnimationSpeed;
    uniform float uAmplitude;
    uniform float uSecondaryAmplitude;
    uniform float uFrequency;
    uniform float uSecondaryFrequency;
    uniform float uPhase;
    uniform float uLineIndex;
    uniform float uLineCount;
    uniform float uLineWidth;

    attribute float aSide;
    attribute float aProgress;
    attribute float aLineOffset;

    varying float vProgress;
    varying float vLineFade;
    varying float vEdge;

    float wave(float x, float t) {
        float linePhase = uPhase + uLineIndex * 0.37;
        float primary = sin(x * uFrequency + t * uAnimationSpeed + linePhase) * uAmplitude;
        float secondary = sin(x * uSecondaryFrequency - t * uAnimationSpeed * 0.74 + linePhase * 1.7) * uSecondaryAmplitude;
        return primary + secondary;
    }

    void main() {
        vec3 p = position;
        float t = uTime;
        float y = p.y + wave(p.x, t);
        vec2 center = vec2(p.x, y);

        float dx = 0.08;
        float yNext = p.y + wave(p.x + dx, t);
        vec2 tangent = normalize(vec2(dx, yNext - y));
        vec2 normal = normalize(vec2(-tangent.y, tangent.x));

        if (uInteractive > 0.5) {
            float distToMouse = distance(center, uMouse);
            float falloff = smoothstep(uBendRadius, 0.0, distToMouse);
            center += normal * uBendStrength * falloff;
        }

        center += normal * aSide * uLineWidth;

        vec3 transformed = vec3(center.x, center.y, p.z);
        vProgress = aProgress;
        vEdge = aSide;
        vLineFade = 1.0 - abs((uLineIndex / max(uLineCount - 1.0, 1.0)) - 0.5) * 0.42;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
    }
`;

const fragmentShader = `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform vec3 uColorD;
    uniform float uAlpha;

    varying float vProgress;
    varying float vLineFade;
    varying float vEdge;

    vec3 gradient(float t) {
        if (t < 0.33) {
            return mix(uColorA, uColorB, smoothstep(0.0, 0.33, t));
        }
        if (t < 0.66) {
            return mix(uColorB, uColorC, smoothstep(0.33, 0.66, t));
        }
        return mix(uColorC, uColorD, smoothstep(0.66, 1.0, t));
    }

    void main() {
        float endFade = smoothstep(0.0, 0.11, vProgress) * (1.0 - smoothstep(0.89, 1.0, vProgress));
        float edgeFade = 1.0 - smoothstep(0.72, 1.0, abs(vEdge));
        float alpha = uAlpha * vLineFade * endFade * edgeFade;
        vec3 color = gradient(vProgress);

        gl_FragColor = vec4(color, alpha);
    }
`;

function normalizeLayerValue(value, index, fallback) {
    if (Array.isArray(value)) return value[index] ?? value[value.length - 1] ?? fallback;
    return value ?? fallback;
}

function createLineGeometry({ width, segments, y, z }) {
    const positions = [];
    const sides = [];
    const progress = [];
    const lineOffsets = [];
    const indices = [];

    for (let i = 0; i <= segments; i += 1) {
        const t = i / segments;
        const x = THREE.MathUtils.lerp(-width * 0.5, width * 0.5, t);

        positions.push(x, y, z, x, y, z);
        sides.push(-1, 1);
        progress.push(t, t);
        lineOffsets.push(y, y);

        if (i < segments) {
            const a = i * 2;
            const b = a + 1;
            const c = a + 2;
            const d = a + 3;
            indices.push(a, c, b, b, c, d);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aSide', new THREE.Float32BufferAttribute(sides, 1));
    geometry.setAttribute('aProgress', new THREE.Float32BufferAttribute(progress, 1));
    geometry.setAttribute('aLineOffset', new THREE.Float32BufferAttribute(lineOffsets, 1));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();

    return geometry;
}

function LineRibbon({
    config,
    colorSet,
    dampedMouse,
    interactive,
    bendRadius,
    bendStrength,
    animationSpeed,
    lineIndex,
    lineCount,
    lineDistance,
    width,
    segments,
}) {
    const meshRef = useRef(null);
    const lineCenter = (lineIndex - (lineCount - 1) * 0.5) * lineDistance;

    const geometry = useMemo(
        () => createLineGeometry({ width, segments, y: lineCenter, z: 0 }),
        [lineCenter, segments, width]
    );

    const material = useMemo(
        () =>
            new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                transparent: true,
                depthWrite: false,
                depthTest: true,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                toneMapped: false,
                uniforms: {
                    uTime: { value: 0 },
                    uMouse: { value: new THREE.Vector2(999, 999) },
                    uInteractive: { value: interactive ? 1 : 0 },
                    uBendRadius: { value: bendRadius },
                    uBendStrength: { value: bendStrength },
                    uAnimationSpeed: { value: animationSpeed },
                    uAmplitude: { value: config.amplitude },
                    uSecondaryAmplitude: { value: config.secondaryAmplitude },
                    uFrequency: { value: config.frequency },
                    uSecondaryFrequency: { value: config.secondaryFrequency },
                    uPhase: { value: config.phase },
                    uLineIndex: { value: lineIndex },
                    uLineCount: { value: lineCount },
                    uLineWidth: { value: 0.018 },
                    uColorA: { value: colorSet[0] },
                    uColorB: { value: colorSet[1] },
                    uColorC: { value: colorSet[2] },
                    uColorD: { value: colorSet[3] },
                    uAlpha: { value: config.alpha },
                },
            }),
        [
            animationSpeed,
            bendRadius,
            bendStrength,
            colorSet,
            config,
            interactive,
            lineCount,
            lineIndex,
        ]
    );

    useFrame((state) => {
        if (!meshRef.current) return;

        const uniforms = meshRef.current.material.uniforms;
        uniforms.uTime.value = state.clock.elapsedTime;
        uniforms.uMouse.value.copy(dampedMouse.current);
        uniforms.uInteractive.value = interactive ? 1 : 0;
        uniforms.uBendRadius.value = bendRadius;
        uniforms.uBendStrength.value = bendStrength;
        uniforms.uAnimationSpeed.value = animationSpeed;
    });

    return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />;
}

function WaveLayer({
    name,
    layerIndex,
    colorSet,
    dampedMouse,
    lineCount,
    lineDistance,
    animationSpeed,
    interactive,
    bendRadius,
    bendStrength,
    parallax,
    parallaxStrength,
}) {
    const groupRef = useRef(null);
    const config = WAVE_CONFIG[name];
    const width = 18;
    const segments = 256;

    useFrame(() => {
        if (!groupRef.current || !parallax) return;

        const factor = parallaxStrength * config.layerFactor;
        groupRef.current.position.x = config.position[0] + dampedMouse.current.x * factor;
        groupRef.current.position.y = config.position[1] + dampedMouse.current.y * factor;
        groupRef.current.position.z = config.position[2];
    });

    return (
        <group
            ref={groupRef}
            position={config.position}
            rotation={config.rotation}
            renderOrder={-10 + layerIndex}
        >
            {Array.from({ length: lineCount }).map((_, lineIndex) => (
                <LineRibbon
                    key={`${name}-${lineIndex}`}
                    config={config}
                    colorSet={colorSet}
                    dampedMouse={dampedMouse}
                    interactive={interactive}
                    bendRadius={bendRadius}
                    bendStrength={bendStrength}
                    animationSpeed={animationSpeed}
                    lineIndex={lineIndex}
                    lineCount={lineCount}
                    lineDistance={lineDistance}
                    width={width}
                    segments={segments}
                />
            ))}
        </group>
    );
}

function FloatingLines({
    linesGradient = DEFAULT_GRADIENT,
    enabledWaves = WAVE_ORDER,
    lineCount = [4, 5, 7],
    lineDistance = [0.18, 0.16, 0.14],
    animationSpeed = 0.55,
    interactive = true,
    bendRadius = 1.15,
    bendStrength = -0.38,
    mouseDamping = 0.055,
    parallax = true,
    parallaxStrength = 0.16,
    ...props
}) {
    const dampedMouse = useRef(new THREE.Vector2(999, 999));

    const colorSet = useMemo(() => {
        const colors = [...linesGradient];
        while (colors.length < 4) colors.push(colors[colors.length - 1] ?? '#ffffff');
        return colors.slice(0, 4).map((color) => new THREE.Color(color));
    }, [linesGradient]);

    useFrame((state, delta) => {
        const viewport = state.viewport;
        const targetX = state.pointer.x * viewport.width * 0.5;
        const targetY = state.pointer.y * viewport.height * 0.5;
        const dampingFactor = 1 - Math.pow(1 - mouseDamping, delta * 60);

        if (dampedMouse.current.x > 900) {
            dampedMouse.current.set(targetX, targetY);
            return;
        }

        dampedMouse.current.x += (targetX - dampedMouse.current.x) * dampingFactor;
        dampedMouse.current.y += (targetY - dampedMouse.current.y) * dampingFactor;
    });

    return (
        <group {...props}>
            {WAVE_ORDER.filter((name) => enabledWaves.includes(name)).map((name) => {
                const layerIndex = WAVE_ORDER.indexOf(name);
                return (
                    <WaveLayer
                        key={name}
                        name={name}
                        layerIndex={layerIndex}
                        colorSet={colorSet}
                        dampedMouse={dampedMouse}
                        lineCount={normalizeLayerValue(lineCount, layerIndex, 6)}
                        lineDistance={normalizeLayerValue(lineDistance, layerIndex, 0.16)}
                        animationSpeed={animationSpeed}
                        interactive={interactive}
                        bendRadius={bendRadius}
                        bendStrength={bendStrength}
                        parallax={parallax}
                        parallaxStrength={parallaxStrength}
                    />
                );
            })}
        </group>
    );
}

export default FloatingLines;
