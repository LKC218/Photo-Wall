// Central registration of custom R3F elements.
// Importing this module once (from Canvas) calls extend() for every custom
// material so the JSX elements <meshImageMaterial> / <meshBannerMaterial>
// are available globally. This removes the need for side-effect imports
// scattered across individual scene components.
import './MeshImageMaterial';
import './MeshBannerMaterial';
