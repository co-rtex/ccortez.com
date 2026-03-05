import { Bloom, EffectComposer, Noise, SMAA, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export function WorldPostProcessing() {
  return (
    <EffectComposer multisampling={4}>
      <SMAA />
      <Bloom
        intensity={0.2}
        luminanceThreshold={0.68}
        luminanceSmoothing={0.18}
        radius={0.55}
        mipmapBlur
      />
      <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.015} premultiply />
      <Vignette eskil={false} offset={0.12} darkness={0.24} />
    </EffectComposer>
  );
}
