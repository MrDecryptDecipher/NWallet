// components/Starfield.tsx
import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

export const Starfield = () => {
  const starCount = 3000;
  const positions = useMemo(() => {
    const arr = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 500;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 500;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 500;
    }
    return arr;
  }, [starCount]);

  useFrame((state) => {
    state.scene.rotation.y += 0.0005;
    state.scene.rotation.x += 0.0002;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={2.5} color="#ffffff" opacity={0.9} transparent sizeAttenuation />
    </points>
  );
};
