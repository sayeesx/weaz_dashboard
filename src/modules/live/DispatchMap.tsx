'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/lib/supabase/client';
import { AlertTriangle, TrendingUp, Users, Target } from 'lucide-react';

export function DispatchMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [activePartners, setActivePartners] = useState(0);
  const [unassignedOrders, setUnassignedOrders] = useState(0);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // initialize map only once

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark ops theme
      center: [77.5946, 12.9716], // Bangalore center default
      zoom: 12,
      pitch: 45, // 3D ops feel
      bearing: -17.6,
      antialias: true
    });

    map.current.on('style.load', () => {
       // Insert 3D buildings layer for terminal aesthetic
       const layers = map.current?.getStyle()?.layers;
       if (!layers) return;
       const labelLayerId = layers.find((layer) => layer.type === 'symbol' && layer.layout?.['text-field'])?.id;

       map.current?.addLayer(
          {
             id: '3d-buildings',
             source: 'composite',
             'source-layer': 'building',
             filter: ['==', 'extrude', 'true'],
             type: 'fill-extrusion',
             minzoom: 15,
             paint: {
                'fill-extrusion-color': '#1a1a1a',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.6
             }
          },
          labelLayerId
       );
    });

    // Subscribing to postgres partner_location/orders updates
    const channel = supabase.channel('dispatch_ops')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_status' }, (payload) => {
         // Logic to update map markers
         // We would dynamically update geojson sources here using payload.new
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      map.current?.remove();
    };
  }, []);

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-black flex">
      {/* Absolute Overlay Panel */}
      <div className="absolute left-6 top-6 z-10 flex w-72 flex-col gap-4">
         
         <div className="rounded border border-[#1a1a1a] bg-black/80 p-4 backdrop-blur-md">
            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
               <Target className="h-3.5 w-3.5 text-blue-400" /> DISPATCH HUD
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
               <div>
                  <div className="text-[10px] uppercase text-white/30">Active Drivers</div>
                  <div className="mt-1 font-mono text-xl text-white">{activePartners}</div>
               </div>
               <div>
                  <div className="text-[10px] uppercase text-white/30">Queue Spike</div>
                  <div className="mt-1 font-mono text-xl text-amber-500">{unassignedOrders}</div>
               </div>
            </div>
         </div>

         <div className="rounded border border-red-500/20 bg-red-950/20 p-4 backdrop-blur-md">
            <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500">
               <AlertTriangle className="h-3.5 w-3.5" /> SYSTEM ALERTS
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
               <li className="flex items-center justify-between text-[11px] font-mono text-red-400">
                  <span>Zone: BLR_NORTH</span>
                  <span>CAPACITY WARNING</span>
               </li>
            </ul>
         </div>

      </div>

      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
