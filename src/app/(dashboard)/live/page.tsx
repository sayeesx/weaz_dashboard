'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLiveMap } from '@/hooks/useLiveMap';
import { Truck, MapPin, Navigation, Radio, Maximize2, Layers, ShieldAlert } from 'lucide-react';

// Use env token or a very obvious warning
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

export default function LiveMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [zoom, setZoom] = useState(12);
  const { partners, orders, loading } = useLiveMap();
  
  // Track markers to clean them up
  const markers = useRef<Record<string, mapboxgl.Marker>>({});

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox Token is missing. Rendering in degraded mode.');
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [77.5946, 12.9716], // Bangalore default
      zoom: zoom,
      pitch: 45,
      antialias: true
    });

    map.current.on('zoom', () => {
      setZoom(map.current?.getZoom() ?? zoom);
    });

    // Add 3D buildings layer
    map.current.on('style.load', () => {
      const layers = map.current?.getStyle()?.layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      map.current?.addLayer(
        {
          id: 'add-3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        },
        labelLayerId
      );
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!map.current) return;

    // 1. Sync Partners
    partners.forEach(p => {
      const id = `partner-${p.id}`;
      if (markers.current[id]) {
        markers.current[id].setLngLat([p.location.lng, p.location.lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'marker-partner';
        el.innerHTML = `
          <div class="relative group">
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              ${p.name} (${p.load}/${p.id.substring(0,4)})
            </div>
            <div class="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white/20 shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><rect width="16" height="13" x="4" y="9" rx="2"/><path d="M14 9V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4"/><path d="M18 9V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>
            </div>
          </div>
        `;
        
        markers.current[id] = new mapboxgl.Marker(el)
          .setLngLat([p.location.lng, p.location.lat])
          .addTo(map.current!);
      }
    });

    // 2. Sync Orders
    orders.forEach(o => {
      const id = `order-${o.id}`;
      if (markers.current[id]) {
        markers.current[id].setLngLat([o.location.lng, o.location.lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'marker-order';
        el.innerHTML = `
          <div class="relative group">
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Order ${o.id.substring(0,8)}
            </div>
            <div class="h-4 w-4 rounded-full bg-emerald-500 border-2 border-white/40 shadow-lg shadow-emerald-500/40 animate-pulse">
            </div>
          </div>
        `;
        
        markers.current[id] = new mapboxgl.Marker(el)
          .setLngLat([o.location.lng, o.location.lat])
          .addTo(map.current!);
      }
    });

    // 3. Cleanup stale markers
    const currentIds = new Set([
      ...partners.map(p => `partner-${p.id}`),
      ...orders.map(o => `order-${o.id}`)
    ]);
    
    Object.keys(markers.current).forEach(id => {
      if (!currentIds.has(id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

  }, [partners, orders]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black font-mono text-[11px] text-[#888]">
      
      {/* Map Control Overlay */}
      <div className="absolute top-20 left-6 z-10 flex flex-col gap-2">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 w-64 shadow-2xl backdrop-blur-xl">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white">
                <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
                <span className="font-bold tracking-tight uppercase">LIVE DISPATCH</span>
              </div>
              <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded text-[9px] font-bold">LIVE</span>
           </div>
           
           <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/40">Active Partners</span>
                <span className="text-white font-bold">{partners.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Orders En Route</span>
                <span className="text-white font-bold">{orders.length}</span>
              </div>
              <div className="h-px bg-[#1a1a1a]" />
              <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-white/20">
                <span>Viewport Zoom</span>
                <span>{zoom.toFixed(1)}</span>
              </div>
           </div>
        </div>

        <div className="flex flex-col gap-1">
          <button onClick={() => map.current?.zoomIn()} className="bg-[#0a0a0a] border border-[#1a1a1a] p-2 hover:bg-[#151515] text-white">
            <Maximize2 className="h-4 w-4" />
          </button>
          <button onClick={() => map.current?.setPitch(map.current?.getPitch() === 0 ? 45 : 0)} className="bg-[#0a0a0a] border border-[#1a1a1a] p-2 hover:bg-[#151515] text-white">
            <Layers className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-10 flex gap-4">
         <div className="flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded border border-white/5">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-white/60">Partner</span>
         </div>
         <div className="flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded border border-white/5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white/60">Active Order</span>
         </div>
      </div>

      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-10 text-center">
          <div className="max-w-md">
            <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-white text-lg font-bold mb-2">MAPBOX TOKEN MISSING</h2>
            <p className="text-white/40 leading-relaxed mb-6">
              To enable the interactive premium command center, provide a valid <code className="text-amber-500">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your environment.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-left">
              <p className="text-[10px] text-white/20 uppercase mb-2">Manual Override</p>
              <div className="flex flex-col gap-2">
                 <div className="flex justify-between border-b border-white/5 pb-2">
                    <span>Partners (Simulated)</span>
                    <span className="text-white">{partners.length}</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Orders (Simulated)</span>
                    <span className="text-white">{orders.length}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Target */}
      <div ref={mapContainer} className="flex-1 w-full" />
      
      {/* Global CSS for markers */}
      <style jsx global>{`
        .mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left { display: none; }
        .marker-partner, .marker-order {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
