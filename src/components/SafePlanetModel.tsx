"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, MeshDistortMaterial, Float, GradientTexture, Sphere } from "@react-three/drei";
import * as THREE from "three";

export interface PlanetModelProps {
  url: string;
  rotationSpeed?: number;
  scale?: number;
  distort?: number;
}

export function SafePlanetModel({ url, rotationSpeed = 1, scale = 1, distort = 0.2 }: PlanetModelProps) {
  // We'll rely on ErrorBoundary to catch the 404/loading errors of useGLTF
  // This is more robust than a separate fetch check which might be cached differently
  return (
    <ErrorBoundary fallback={<DefaultPlanet scale={scale} rotationSpeed={rotationSpeed} distort={distort} />}>
      <React.Suspense fallback={null}>
        <ModelWithFallback url={url} scale={scale} rotationSpeed={rotationSpeed} />
      </React.Suspense>
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback: React.ReactNode;
}, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function ModelWithFallback({ url, scale, rotationSpeed = 1 }: { url: string; scale: number; rotationSpeed?: number }) {
  const { scene } = useGLTF(url);
  
  useFrame((state) => {
    if (scene) {
      scene.rotation.y = state.clock.getElapsedTime() * 0.1 * rotationSpeed;
    }
  });

  return <primitive object={scene} scale={scale} />;
}

function DefaultPlanet({ scale = 1, rotationSpeed = 1, distort = 0.2 }: { scale?: number; rotationSpeed?: number; distort?: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const atmosphereRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15 * rotationSpeed;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = -t * 0.1 * rotationSpeed;
      atmosphereRef.current.rotation.z = Math.sin(t * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={1.5 * rotationSpeed} rotationIntensity={0.5} floatIntensity={0.5}>
      <group scale={scale}>
        {/* Core Planet with Earth-like Procedural Colors */}
        <Sphere ref={meshRef} args={[1, 64, 64]}>
          <MeshDistortMaterial
            color="#1d4ed8"
            speed={2 * rotationSpeed}
            distort={distort}
            radius={1}
            emissive="#1e3a8a"
            emissiveIntensity={0.1}
            roughness={0.7}
            metalness={0.2}
          >
            <GradientTexture
              stops={[0, 0.3, 0.45, 0.6, 0.8, 1]}
              colors={[
                '#0f172a', // Deep ocean
                '#1e40af', // Blue water
                '#15803d', // Green land
                '#166534', // Dark green forest
                '#854d0e', // Brown mountains
                '#f8fafc'  // Polar ice
              ]}
            />
          </MeshDistortMaterial>
        </Sphere>

        {/* Atmosphere / Clouds Layer (Realistic) */}
        <Sphere ref={atmosphereRef} args={[1.04, 64, 64]}>
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </Sphere>

        {/* Outer Atmospheric Glow */}
        <Sphere args={[1.15, 64, 64]}>
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </Sphere>

        <pointLight intensity={2} color="#60a5fa" distance={10} />
      </group>
    </Float>
  );
}
