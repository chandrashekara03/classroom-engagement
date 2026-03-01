"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, Html, Stars, Center } from "@react-three/drei";
import { SafePlanetModel } from "./SafePlanetModel";
import { useControls, Leva } from "leva";

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white font-semibold text-lg whitespace-nowrap bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10 shadow-2xl">
          Loading High-Res Textures...
        </p>
      </div>
    </Html>
  );
}

export interface PlanetViewerProps {
  modelUrl: string;
}

export default function PlanetViewer({ modelUrl }: PlanetViewerProps) {
  // Interactive Controls for "Controlling the Planet"
  const { scale, rotationSpeed, distort, autoRotate, sunIntensity, ambientIntensity, adjustCamera } = useControls("Planet Controls", {
    scale: { value: 1.0, min: 0.1, max: 10, step: 0.1, label: "Model Scale" },
    rotationSpeed: { value: 1.0, min: 0, max: 5, step: 0.1, label: "Rotation Speed" },
    distort: { value: 0.05, min: 0, max: 1, step: 0.05, label: "Surface Distortion" },
    autoRotate: { value: true, label: "Auto Rotate" },
    sunIntensity: { value: 1.5, min: 0, max: 5, step: 0.1, label: "Sun Intensity" },
    ambientIntensity: { value: 0.5, min: 0, max: 2, step: 0.1, label: "Ambient Light" },
    adjustCamera: { value: true, label: "Auto Frame Camera" }
  });

  return (
    <div className="w-full h-[65vh] md:h-[85vh] lg:h-[800px] relative bg-[#000000] rounded-3xl overflow-hidden shadow-2xl border border-white/5 group">
      {/* Scope Leva to this container */}
      <div className="absolute top-6 right-6 z-20 pointer-events-auto">
        <Leva 
          fill={false} 
          flat={false} 
          collapsed={true}
          theme={{
            sizes: { controlWidth: '150px' },
            colors: { accent1: '#3b82f6', elevation1: '#050505', elevation2: '#111827', elevation3: '#374151' }
          }}
        />
      </div>

      <Canvas shadows dpr={[1, 2]} camera={{ fov: 45, position: [0, 0, 10] }}>
        <color attach="background" args={['#000000']} />
        
        <Suspense fallback={<Loader />}>
          {/* Cinematic Space Environment */}
          <Stars radius={250} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <ambientLight intensity={ambientIntensity} />
          <pointLight position={[10, 10, 10]} intensity={sunIntensity} color="#ffffff" castShadow />
          
          <Stage 
            intensity={sunIntensity} 
            environment="night" 
            adjustCamera={adjustCamera} 
            shadows="contact" 
            center={{ top: true }}
            key={modelUrl} // Force reset when URL changes
          >
            <Center>
              <SafePlanetModel 
                url={modelUrl} 
                scale={scale} 
                rotationSpeed={rotationSpeed} 
                distort={distort} 
              />
            </Center>
          </Stage>

          <OrbitControls 
            makeDefault 
            autoRotate={autoRotate} 
            autoRotateSpeed={rotationSpeed * 0.8} 
            enablePan={false}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
