'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@classroom/ui-components';
import { Box, Info, ExternalLink } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import PlanetViewer to avoid SSR issues with WebGL
const PlanetViewer = dynamic(() => import('@/components/PlanetViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[65vh] md:h-[85vh] lg:h-[800px] bg-slate-900 rounded-3xl flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg font-semibold">Loading 3D Viewer...</p>
      </div>
    </div>
  )
});

export default function ModelsPage() {
  const availableModels = [
    {
      name: 'Earth',
      url: '/models/earth.glb',
      description: 'A high-resolution 3D model of Earth from NASA.',
      source: 'https://eyes.nasa.gov/apps/solar-system/#/earth'
    },
    {
      name: 'Mars',
      url: '/models/mars.glb',
      description: 'The Red Planet, ideal for geology and space exploration activities.',
      source: 'https://eyes.nasa.gov/apps/solar-system/#/mars'
    },
    {
      name: 'Jupiter',
      url: '/models/jupiter.glb',
      description: 'The largest planet in our solar system, great for atmospheric studies.',
      source: 'https://eyes.nasa.gov/apps/solar-system/#/jupiter'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Box className="h-6 w-6 text-blue-600" />
          3D Model Asset Library
        </h1>
        <p className="text-slate-500 mt-1">Explore and preview 3D models available for activities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[700px] overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg">Model Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-60px)] relative bg-slate-900 font-mono">
                 <PlanetViewer modelUrl="/models/earth.glb" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableModels.map((model) => (
                <div key={model.name} className="flex items-start gap-4 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Box className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">{model.name}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">GLB</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 italic">{model.description}</p>
                    <div className="mt-2 flex items-center gap-3">
                       <a href={model.source} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                        NASA Source <ExternalLink className="h-2 w-2" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-blue-600 text-white border-none shadow-blue-200 shadow-xl">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Info className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold">Managing Assets</h3>
              <p className="text-blue-100 text-sm mt-2 font-medium">
                To add new 3D models, place your <code className="bg-blue-700/50 px-1 rounded">.glb</code> files in the <code className="bg-blue-700/50 px-1 rounded">public/models</code> directory.
              </p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-blue-200 uppercase tracking-widest font-bold">Recommended Source</p>
                <p className="text-sm font-medium mt-1">NASA Graphics Repository</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
