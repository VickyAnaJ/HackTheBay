"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FloatingOrbs({ count = 60, confidenceScore = 0 }: { count?: number; confidenceScore?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate random positions, speeds, and sizes for each orb
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 10 - 5,
      ] as [number, number, number],
      speed: 0.1 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
      scale: 0.05 + Math.random() * 0.12,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    // Map confidence to color intensity (higher = more vibrant)
    const intensity = 0.3 + (confidenceScore / 100) * 0.7;

    particles.forEach((p, i) => {
      // Gentle floating movement
      const x = p.position[0] + Math.sin(t * p.speed + p.offset) * 0.5;
      const y = p.position[1] + Math.cos(t * p.speed * 0.7 + p.offset) * 0.3;
      const z = p.position[2] + Math.sin(t * p.speed * 0.5 + p.offset * 2) * 0.2;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(p.scale * (0.8 + Math.sin(t * p.speed * 2 + p.offset) * 0.2));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Update material color based on confidence
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = intensity * 0.8;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color="#7c4dff"
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

function GlowRing({ confidenceScore = 0 }: { confidenceScore?: number }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    ringRef.current.rotation.z = t * 0.1;
    ringRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;

    const scale = 1 + (confidenceScore / 100) * 0.3;
    ringRef.current.scale.setScalar(scale);

    const material = ringRef.current.material as THREE.MeshBasicMaterial;
    // Shift hue based on confidence: low = purple, high = green
    const hue = 0.75 + (confidenceScore / 100) * 0.45; // 0.75 = purple, 1.2 ≈ green
    const color = new THREE.Color();
    color.setHSL(hue % 1, 0.8, 0.5);
    material.color = color;
    material.opacity = 0.15 + (confidenceScore / 100) * 0.2;
  });

  return (
    <mesh ref={ringRef} position={[0, 0, -8]}>
      <torusGeometry args={[3, 0.02, 16, 100]} />
      <meshBasicMaterial
        color="#7c4dff"
        transparent
        opacity={0.2}
        depthWrite={false}
      />
    </mesh>
  );
}

function GridFloor() {
  return (
    <gridHelper
      args={[40, 40, "#1a1e2e", "#1a1e2e"]}
      position={[0, -6, -5]}
      rotation={[0, 0, 0]}
    />
  );
}

interface Props {
  confidenceScore?: number;
  isActive?: boolean;
}

export default function Background3D({ confidenceScore = 0, isActive = false }: Props) {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
      >
        <FloatingOrbs
          count={isActive ? 80 : 40}
          confidenceScore={confidenceScore}
        />
        <GlowRing confidenceScore={confidenceScore} />
        {!isActive && <GridFloor />}
      </Canvas>
    </div>
  );
}
