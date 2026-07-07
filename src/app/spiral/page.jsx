'use client';

import styles from '@/styles/page.module.scss';
import images from '@/data/images';
import { PerspectiveCamera } from '@react-three/drei';
import { View } from '@/three/View';
import { useCollageTexture } from '@/hooks';
import { Spiral } from '@/three/scenes';
import { Loader } from '@/components/ui/modules';

export default function SpiralPage() {
    const { texture, isLoading } = useCollageTexture(images);

    if (isLoading) return <Loader />;

    return (
        <div className={styles.page}>
            <View className={styles.view} orbit>
                <PerspectiveCamera
                    makeDefault
                    fov={7}
                    position={[0, 0, 100]}
                    near={0.01}
                    far={100000}
                />
                <Spiral texture={texture} />
            </View>
        </div>
    );
}
