'use client';

import styles from '@/styles/page.module.scss';
import images from '@/data/images';
import { useCollageTexture } from '@/hooks';
import { View } from '@/three/View';
import { Loader } from '@/components/ui/modules';
import { Paper } from '@/three/scenes';
import { PerspectiveCamera } from '@react-three/drei';

const paperImages = images.slice(0, 5);

export default function PaperPage() {
    const { texture, isLoading } = useCollageTexture(paperImages, {
        gap: 0,
        canvasWidth: 1024,
        axis: 'y',
    });

    if (isLoading) return <Loader />;

    return (
        <div className={styles.page}>
            <View className={styles.view} orbit>
                <PerspectiveCamera
                    makeDefault
                    fov={20}
                    position={[0, 0, 13]}
                    near={0.01}
                    far={100000}
                />
                <Paper rotation={[0, Math.PI * 0.3, 0]} position={[0, 0.5, 0]} texture={texture} />
            </View>
        </div>
    );
}
