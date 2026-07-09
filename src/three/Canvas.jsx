'use client';

import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { r3f } from '@/three/helpers/r3f';
import '@/three/materials';

export default function Scene({ gl, style, onCreated, ...props }) {
    return (
        <Canvas
            {...props}
            gl={{ alpha: true, antialias: true, ...gl }}
            style={{ background: 'transparent', ...style }}
            onCreated={(state) => {
                state.scene.background = null;
                onCreated?.(state);
            }}
        >
            <r3f.Out />
            <Preload all />
        </Canvas>
    );
}
