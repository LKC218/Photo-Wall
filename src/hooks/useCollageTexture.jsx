import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCanvasTexture } from '@/three/helpers/getCanvasTexture';

const textureCache = new Map();

function createTextureKey(images, options) {
    const imageKey = images.map((img) => img.url).join('|');
    return `${imageKey}::${options.gap}:${options.canvasHeight}:${options.canvasWidth}:${options.axis}`;
}

export default function useCollageTexture(images, options = {}) {
    const { gap = 0, canvasHeight = 512, canvasWidth = 512, axis = 'x' } = options;
    const textureKey = useMemo(
        () => createTextureKey(images, { gap, canvasHeight, canvasWidth, axis }),
        [images, gap, canvasHeight, canvasWidth, axis]
    );
    const cachedResult = textureCache.get(textureKey) || null;

    const [textureResults, setTextureResults] = useState(cachedResult);
    const [isLoading, setIsLoading] = useState(!cachedResult);
    const [error, setError] = useState(null);

    const createTexture = useCallback(async () => {
        const cached = textureCache.get(textureKey);
        if (cached) {
            setTextureResults(cached);
            setIsLoading(false);
            setError(null);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const result = await getCanvasTexture({
                images,
                gap,
                canvasHeight,
                canvasWidth,
                axis,
            });
            textureCache.set(textureKey, result);
            setTextureResults(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to create texture'));
        } finally {
            setIsLoading(false);
        }
    }, [images, gap, canvasHeight, canvasWidth, axis, textureKey]);

    useEffect(() => {
        if (images.length > 0) createTexture();
    }, [images.length, createTexture]);

    return {
        texture: textureResults?.texture || null,
        dimensions: textureResults?.dimensions || null,
        isLoading,
        error,
    };
}
