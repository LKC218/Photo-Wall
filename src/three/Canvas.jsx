'use client';

import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { r3f } from '@/three/helpers/r3f';
import '@/three/materials';
import * as THREE from 'three';

export default function Scene(props) {
    return (
        <Canvas {...props}>
            <r3f.Out />
            <Preload all />
        </Canvas>
    );
}
