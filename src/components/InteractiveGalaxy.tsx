import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three';

function DynamicStars(props: any) {
    const ref = useRef<any>();
    const sphere = useMemo(() => {
        const positions = random.inSphere(new Float32Array(8000), { radius: 1.8 });
        // Validate positions to ensure no NaNs
        for (let i = 0; i < positions.length; i++) {
            if (isNaN(positions[i])) positions[i] = 0;
        }
        return positions;
    }, []);

    // Mouse parallax state
    const { mouse } = useThree();

    useFrame((state, delta) => {
        if (ref.current) {
            // Automatic Rotation
            ref.current.rotation.x -= delta / 15;
            ref.current.rotation.y -= delta / 20;

            // Mouse Parallax Interaction
            // Lerp current rotation towards mouse position for smooth tracking
            const xTarget = mouse.y * 0.2;
            const yTarget = mouse.x * 0.2;

            ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, xTarget, 0.02);
            ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, yTarget, 0.02);

            // Color Shifting Cycle
            // Cycle colors: Pink (#ff00ff) -> Cyan (#00ffff) -> Blue (#0000ff)
            const time = state.clock.getElapsedTime();
            const hue = (time * 0.1) % 1; // slow cycle
            const color = new THREE.Color().setHSL(hue, 0.8, 0.6);

            if (ref.current.material) {
                ref.current.material.color = color;
            }
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#f272c8"
                    size={0.0025}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
}

function PulsingCore() {
    const ref = useRef<any>();
    const sphere = useMemo(() => random.inSphere(new Float32Array(3000), { radius: 0.8 }), []);

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.z += 0.002;
            // Pulse size
            const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
            ref.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <group>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#ffffff"
                    size={0.0015}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.4}
                />
            </Points>
        </group>
    )
}

const InteractiveGalaxy = () => {
    return (
        <div className="absolute inset-0 z-0 bg-black">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <fog attach="fog" args={['#000000', 0.5, 2.5]} />
                <DynamicStars />
                <PulsingCore />
            </Canvas>
        </div>
    );
};

export default InteractiveGalaxy;
