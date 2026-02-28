"use client";

import React from "react";
import PlanetViewer from "@/components/PlanetViewer";
import { PlanetActivitySettings } from "@classroom/shared-utils";

export default function PlanetViewerDemoPage() {
  // Mock settings matching the interface
  const mockActivitySettings: PlanetActivitySettings = {
    time_limit: 300,
    model_url: "/models/earth.glb",
    planet_name: "Earth",
    instructions: "Rotate the planet to explore its surface. Can you identify the major continents?",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                3D Planet Exploration
              </h1>
              <p className="text-slate-500 mt-2 text-lg">
                Interactive Learning Activity
              </p>
            </div>
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg text-blue-700 font-medium">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              Activity Live
            </div>
          </div>
        </div>

        {/* 3D Viewer Section */}
        <div className="flex-grow w-full relative group">
          <PlanetViewer modelUrl={mockActivitySettings.model_url} />

          {/* Floating UI Overlay (Bottom) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-auto max-w-2xl bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-white/20 transition-all duration-300 group-hover:bg-white">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex-shrink-0">
                <span className="text-sm font-semibold uppercase tracking-wider text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                  Target Planet
                </span>
                <h2 className="text-2xl font-bold text-slate-800 mt-1">{mockActivitySettings.planet_name}</h2>
              </div>
              
              <div className="w-px h-12 bg-slate-200 hidden md:block"></div>
              
              <div className="text-center md:text-left">
                <p className="text-slate-600 font-medium leading-relaxed">
                  {mockActivitySettings.instructions}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
