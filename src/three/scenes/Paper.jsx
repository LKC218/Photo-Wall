'use client';

import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';

function getFirstMesh(scene) {
    let mesh = null;
    scene.traverse((child) => {
        if (!mesh && child.isMesh) mesh = child;
    });
    return mesh;
}

function createPaperMaterial(texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    return new THREE.MeshBasicMaterial({
        map: texture,
        toneMapped: false,
        side: THREE.DoubleSide,
    });
}

function Paper({ texture, ...props }) {
    const { scene } = useGLTF('/paper.glb');
    const mesh = useMemo(() => getFirstMesh(scene), [scene]);

    useEffect(() => {
        if (!texture || !mesh) return;

        const previousMaterial = mesh.material;
        const material = createPaperMaterial(texture);
        mesh.material = material;

        return () => {
            mesh.material = previousMaterial;
            material.dispose();
        };
    }, [texture, mesh]);

    useFrame((state, delta) => {
        if (!texture) return;
        texture.offset.y += delta / 30;
    });

    if (!mesh) return null;

    return <primitive {...props} object={scene} />;
}

export default Paper;
