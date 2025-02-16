// src/pages/Home.tsx
import React, { useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Link } from 'react-router-dom';

function Starfield() {
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
}

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        camera={{ position: [0, 0, 0], fov: 75 }}
      >
        <Starfield />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '2rem'
        }}>
          NIJA CUSTODIAN WALLET
        </h1>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/register">
            <button style={{
              padding: '0.75rem 2rem',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '9999px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}>
              Register
            </button>
          </Link>
          
          <Link to="/login">
            <button style={{
              padding: '0.75rem 2rem',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '9999px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}>
              Login
            </button>
          </Link>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white'
      }}>
        Powered by Nija
      </div>
    </div>
  );
}