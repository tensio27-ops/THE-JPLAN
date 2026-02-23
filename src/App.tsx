/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Settings, Box, Image as ImageIcon, Ruler, Layers, Download, Plus, Minus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateTruss } from './types';

// --- Components ---

interface TrussModelProps {
  width: number; // mm
  height: number; // mm
  depth: number; // mm
  designImage: string | null;
}

function TrussStructure({ width, height, depth, designImage }: TrussModelProps) {
  const trussWidth = 200; // Mini truss 200mm
  const w = width / 1000;
  const h = height / 1000;
  const d = depth / 1000;
  const tw = trussWidth / 1000;

  // Realistic Materials
  const trussMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e5e7eb',
    metalness: 1.0,
    roughness: 0.1,
    envMapIntensity: 1.2,
  }), []);

  const couplerMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#9ca3af',
    metalness: 1.0,
    roughness: 0.2,
  }), []);

  const boltMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4b5563',
    metalness: 1.0,
    roughness: 0.1,
  }), []);

  const backdropMaterial = useMemo(() => {
    if (designImage) {
      const texture = new THREE.TextureLoader().load(designImage);
      texture.anisotropy = 16;
      return new THREE.MeshStandardMaterial({ 
        map: texture, 
        side: THREE.DoubleSide,
        roughness: 0.4,
      });
    }
    return new THREE.MeshStandardMaterial({ 
      color: '#ffffff', 
      side: THREE.DoubleSide, 
      transparent: true, 
      opacity: 0.2,
      roughness: 0.5 
    });
  }, [designImage]);

  // Realistic Truss Segment with detailed conical couplers and pins
  const TrussSegment = ({ position, rotation, length, showCouplers = true }: { position: [number, number, number], rotation: [number, number, number], length: number, showCouplers?: boolean }) => {
    const mainTubeRadius = 0.016;
    const braceRadius = 0.006;
    const couplerRadius = 0.024;
    const couplerHeight = 0.05;
    
    const segments = Math.max(1, Math.floor(length / 0.2));
    const segmentLength = length / segments;

    return (
      <group position={position} rotation={rotation}>
        {/* Main 4 Chords */}
        <mesh position={[tw/2, 0, tw/2]} material={trussMaterial}>
          <cylinderGeometry args={[mainTubeRadius, mainTubeRadius, length, 12]} />
        </mesh>
        <mesh position={[-tw/2, 0, tw/2]} material={trussMaterial}>
          <cylinderGeometry args={[mainTubeRadius, mainTubeRadius, length, 12]} />
        </mesh>
        <mesh position={[tw/2, 0, -tw/2]} material={trussMaterial}>
          <cylinderGeometry args={[mainTubeRadius, mainTubeRadius, length, 12]} />
        </mesh>
        <mesh position={[-tw/2, 0, -tw/2]} material={trussMaterial}>
          <cylinderGeometry args={[mainTubeRadius, mainTubeRadius, length, 12]} />
        </mesh>

        {/* End Couplers (Conical Connectors) */}
        {showCouplers && [1, -1].map((side) => (
          <group key={side} position={[0, (length/2) * side, 0]}>
            {[
              [tw/2, tw/2], [-tw/2, tw/2], [tw/2, -tw/2], [-tw/2, -tw/2]
            ].map(([x, z], idx) => (
              <group key={idx} position={[x, 0, z]}>
                <mesh material={couplerMaterial}>
                  <cylinderGeometry args={[couplerRadius, mainTubeRadius, couplerHeight, 16]} />
                </mesh>
                {/* Connector Pin/Bolt */}
                <mesh rotation={[0, 0, Math.PI/2]} position={[0, couplerHeight/2, 0]} material={boltMaterial}>
                  <cylinderGeometry args={[0.004, 0.004, 0.06, 8]} />
                </mesh>
              </group>
            ))}
          </group>
        ))}

        {/* Webbing */}
        {Array.from({ length: segments }).map((_, i) => {
          const midY = -length/2 + (i + 0.5) * segmentLength;
          return (
            <group key={i} position={[0, midY, 0]}>
              <mesh position={[0, 0, tw/2]} rotation={[0, 0, Math.atan2(tw, segmentLength)]} material={trussMaterial}>
                <cylinderGeometry args={[braceRadius, braceRadius, Math.sqrt(tw*tw + segmentLength*segmentLength), 8]} />
              </mesh>
              <mesh position={[0, 0, -tw/2]} rotation={[0, 0, -Math.atan2(tw, segmentLength)]} material={trussMaterial}>
                <cylinderGeometry args={[braceRadius, braceRadius, Math.sqrt(tw*tw + segmentLength*segmentLength), 8]} />
              </mesh>
              <mesh position={[-tw/2, 0, 0]} rotation={[Math.atan2(tw, segmentLength), 0, 0]} material={trussMaterial}>
                <cylinderGeometry args={[braceRadius, braceRadius, Math.sqrt(tw*tw + segmentLength*segmentLength), 8]} />
              </mesh>
              <mesh position={[tw/2, 0, 0]} rotation={[-Math.atan2(tw, segmentLength), 0, 0]} material={trussMaterial}>
                <cylinderGeometry args={[braceRadius, braceRadius, Math.sqrt(tw*tw + segmentLength*segmentLength), 8]} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  };

  return (
    <group>
      {/* Full Rectangular Frame */}
      {/* Left Vertical */}
      <TrussSegment position={[-w/2, h/2, 0]} rotation={[0, 0, 0]} length={h} />
      
      {/* Right Vertical */}
      <TrussSegment position={[w/2, h/2, 0]} rotation={[0, 0, 0]} length={h} />
      
      {/* Top Horizontal */}
      <TrussSegment position={[0, h, 0]} rotation={[0, 0, Math.PI/2]} length={w + tw} />

      {/* Bottom Horizontal */}
      <TrussSegment position={[0, tw/2, 0]} rotation={[0, 0, Math.PI/2]} length={w + tw} />

      {/* Corner Connectors (Box Corners) */}
      {[
        [-w/2, h], [w/2, h], [-w/2, tw/2], [w/2, tw/2]
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]} material={couplerMaterial}>
          <boxGeometry args={[tw + 0.02, tw + 0.02, tw + 0.02]} />
        </mesh>
      ))}

      {/* Heavy Base Plates (Square) */}
      {[[-w/2, 0], [w/2, 0]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Main Square Plate */}
          <mesh material={couplerMaterial} receiveShadow castShadow>
            <boxGeometry args={[0.4, 0.015, d]} />
          </mesh>
          {/* Adjustable Feet (Small cylinders at corners) */}
          {[[0.18, d/2 - 0.02], [-0.18, d/2 - 0.02], [0.18, -d/2 + 0.02], [-0.18, -d/2 + 0.02]].map(([fx, fz], j) => (
            <mesh key={j} position={[fx, -0.01, fz]} material={boltMaterial}>
              <cylinderGeometry args={[0.02, 0.02, 0.02, 12]} />
            </mesh>
          ))}
          {/* Vertical Support Tube */}
          <mesh position={[0, 0.05, 0]} material={trussMaterial}>
            <cylinderGeometry args={[0.03, 0.03, 0.1, 16]} />
          </mesh>
        </group>
      ))}

      {/* Backdrop Banner */}
      <mesh position={[0, h/2 + tw/4, 0]} receiveShadow castShadow>
        <boxGeometry args={[w - tw, h - tw, 0.002]} />
        <primitive object={backdropMaterial} attach="material" />
      </mesh>

      {/* Studio Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <gridHelper args={[20, 20, 0xdddddd, 0xeeeeee]} position={[0, -0.01, 0]} />
    </group>
  );
}

export default function App() {
  const [width, setWidth] = useState(3000); // mm
  const [height, setHeight] = useState(2500); // mm
  const [depth, setDepth] = useState(1000); // mm
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'size' | 'parts' | 'design' | 'inventory' | 'blueprint'>('size');
  const [inventory, setInventory] = useState<Record<number, number>>({});
  const [newSize, setNewSize] = useState<string>('');

  const PRESETS = [
    { label: '2x2m', w: 2000, h: 2000 },
    { label: '2.5x2.5m', w: 2500, h: 2500 },
    { label: '3x2.5m', w: 3000, h: 2500 },
    { label: '3.5x2.5m', w: 3500, h: 2500 },
    { label: '4x2.5m', w: 4000, h: 2500 },
    { label: '5x3m', w: 5000, h: 3000 },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const orbitControlsRef = useRef<any>(null);

  const setView = (view: 'front' | 'top' | 'side') => {
    if (!orbitControlsRef.current) return;

    const controls = orbitControlsRef.current;
    const camera = controls.object;

    // Reset target to center of truss
    const targetY = (height / 1000) / 2;
    controls.target.set(0, targetY, 0);

    switch (view) {
      case 'front':
        camera.position.set(0, targetY, 7);
        break;
      case 'top':
        camera.position.set(0, 10, 0);
        break;
      case 'side':
        camera.position.set(8, targetY, 0);
        break;
    }
    controls.update();
  };

  const autoFitToInventory = () => {
    // Simple heuristic: find max width and height that can be built
    // This is a simplified version. A real one would be a knapsack-like problem.
    // We'll try to maximize width first, then height.
    
    let bestW = 1000;
    let bestH = 1000;
    
    // Try common increments
    for (let w = 1000; w <= 6000; w += 250) {
      for (let h = 1000; h <= 4000; h += 250) {
        const hParts = calculateTruss(w);
        const vParts = calculateTruss(h);
        
        const req: Record<number, number> = {};
        hParts.forEach(s => { req[s.length] = (req[s.length] || 0) + s.count * 2; });
        vParts.forEach(s => { req[s.length] = (req[s.length] || 0) + s.count * 2; });
        
        let possible = true;
        for (const [size, count] of Object.entries(req)) {
          if ((inventory[Number(size)] || 0) < count) {
            possible = false;
            break;
          }
        }
        
        if (possible) {
          if (w * h > bestW * bestH) {
            bestW = w;
            bestH = h;
          }
        }
      }
    }
    
    setWidth(bestW);
    setHeight(bestH);
    setActiveTab('size');
  };

  const downloadBlueprint = () => {
    const svg = document.querySelector('#blueprint-svg') as SVGSVGElement;
    if (!svg) return;

    // Create a copy to avoid modifying the UI
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('width', '2000');
    svgClone.setAttribute('height', '1500');
    
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 2000;
    canvas.height = 1500;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const link = document.createElement('a');
      link.download = `truss-blueprint-${width}x${height}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      URL.revokeObjectURL(img.src);
    };

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    img.src = URL.createObjectURL(svgBlob);
  };

  const downloadScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.setAttribute('download', `truss-design-${width}x${height}.png`);
      link.setAttribute('href', canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
      link.click();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDesignImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const trussParts = useMemo(() => {
    const hSegments = calculateTruss(width);
    const vSegments = calculateTruss(height);
    
    // Ordered lists for blueprint
    const getOrdered = (len: number) => {
      let rem = len;
      const res: number[] = [];
      [1000, 500, 250].forEach(s => {
        const c = Math.floor(rem / s);
        for(let i=0; i<c; i++) { res.push(s); rem -= s; }
      });
      if (rem > 0) res.push(rem);
      return res;
    };

    const hList = getOrdered(width);
    const vList = getOrdered(height);

    // Greedy assignment for blueprint visualization
    const tempInv = { ...inventory };
    const assignStatus = (list: number[]) => {
      return list.map(len => {
        if ((tempInv[len] || 0) > 0) {
          tempInv[len]--;
          return { len, status: 'owned' as const };
        }
        return { len, status: 'missing' as const };
      });
    };

    // We need 2 horizontal beams and 2 vertical columns
    const topSegments = assignStatus(hList);
    const botSegments = assignStatus(hList);
    const leftSegments = assignStatus(vList);
    const rightSegments = assignStatus(vList);

    // Total required per size
    const required: Record<number, number> = {};
    hSegments.forEach(s => { required[s.length] = (required[s.length] || 0) + s.count * 2; });
    vSegments.forEach(s => { required[s.length] = (required[s.length] || 0) + s.count * 2; });

    const totalHSegments = hSegments.reduce((acc, s) => acc + s.count, 0);
    const totalVSegments = vSegments.reduce((acc, s) => acc + s.count, 0);

    // Joints calculation:
    // 2 horizontal beams, 2 vertical columns
    // Internal joints: (segments - 1) per line
    const internalJoints = Math.max(0, totalHSegments - 1) * 2 + Math.max(0, totalVSegments - 1) * 2;
    
    // Connection joints:
    // 4 corners * 2 connections each = 8 joints
    // 2 base plates * 1 connection each = 2 joints
    const connectionJoints = 8 + 2;
    
    const totalJoints = internalJoints + connectionJoints;

    return { 
      hSegments, 
      vSegments, 
      hList,
      vList,
      topSegments,
      botSegments,
      leftSegments,
      rightSegments,
      required,
      totalJoints,
      hardware: {
        couplers: totalJoints * 4,
        pins: totalJoints * 8,
        clips: totalJoints * 8
      }
    };
  }, [width, height]);

  const exportBOM = () => {
    const sections = [
      `Photo Zone Truss Bill of Materials`,
      `Dimensions: ${width}mm (W) x ${height}mm (H)`,
      `-------------------------------------------`,
      `[Truss Segments]`,
      ...trussParts.hSegments.map(s => `- Horizontal Beam: ${s.length}mm x ${s.count * 2}pcs`),
      ...trussParts.vSegments.map(s => `- Vertical Column: ${s.length}mm x ${s.count * 2}pcs`),
      `- Corner Connectors (Box): 4pcs`,
      `- Base Plates (Heavy): 2pcs`,
      ``,
      `[Connection Hardware]`,
      `- Conical Couplers: ${trussParts.hardware.couplers}pcs`,
      `- Connector Pins: ${trussParts.hardware.pins}pcs`,
      `- R-Clips (Safety): ${trussParts.hardware.clips}pcs`,
      `-------------------------------------------`,
      `Generated on ${new Date().toLocaleString()}`
    ];

    const blob = new Blob([sections.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `truss-bom-${width}x${height}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isBuildable = useMemo(() => {
    for (const [size, reqCount] of Object.entries(trussParts.required)) {
      if ((inventory[Number(size)] || 0) < reqCount) return false;
    }
    return true;
  }, [trussParts.required, inventory]);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-stone-100 overflow-hidden font-sans">
      {/* Sidebar Controls */}
      <aside className="w-full lg:w-96 glass-panel z-10 flex flex-col shadow-xl">
        <div className="p-6 border-bottom border-stone-200">
          <h1 className="text-2xl font-bold tracking-tight text-stone-800 flex items-center gap-2">
            <Box className="w-6 h-6 text-emerald-600" />
            Mini Truss 3D
          </h1>
          <p className="text-sm text-stone-500 mt-1 italic">Professional Photo Zone Designer</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 overflow-x-auto no-scrollbar">
          {(['size', 'inventory', 'parts', 'blueprint', 'design'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-none px-4 py-3 text-[11px] font-bold transition-colors relative ${
                activeTab === tab ? 'text-emerald-600' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab === 'size' && '사이즈'}
              {tab === 'inventory' && '보유자재'}
              {tab === 'parts' && '필요자재'}
              {tab === 'blueprint' && '조립도'}
              {tab === 'design' && '디자인'}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'size' && (
              <motion.div
                key="size"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Presets */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-stone-700">표준 사이즈 프리셋</label>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isBuildable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isBuildable ? '자재 충분' : '자재 부족'}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => {
                          setWidth(p.w);
                          setHeight(p.h);
                        }}
                        className={`text-[11px] py-2 rounded-lg border transition-all ${
                          width === p.w && height === p.h
                            ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-400'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-stone-700 flex items-center gap-2">
                    <Ruler className="w-4 h-4" /> 가로 너비 (Width)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1000"
                      max="6000"
                      step="250"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="flex-1 accent-emerald-600"
                    />
                    <span className="w-20 text-right font-mono text-sm bg-stone-200 px-2 py-1 rounded">
                      {width}mm
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-stone-700 flex items-center gap-2">
                    <Ruler className="w-4 h-4" /> 세로 높이 (Height)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1000"
                      max="4000"
                      step="250"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="flex-1 accent-emerald-600"
                    />
                    <span className="w-20 text-right font-mono text-sm bg-stone-200 px-2 py-1 rounded">
                      {height}mm
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-stone-700 flex items-center gap-2">
                    <Ruler className="w-4 h-4" /> 지지대 깊이 (Depth)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="500"
                      max="2000"
                      step="250"
                      value={depth}
                      onChange={(e) => setDepth(Number(e.target.value))}
                      className="flex-1 accent-emerald-600"
                    />
                    <span className="w-20 text-right font-mono text-sm bg-stone-200 px-2 py-1 rounded">
                      {depth}mm
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" /> 현재 보유 중인 트러스
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.keys(inventory).length === 0 ? (
                      <div className="text-center py-8 px-4 border-2 border-dashed border-stone-200 rounded-xl">
                        <p className="text-xs text-stone-400 font-medium">등록된 보유 자재가 없습니다.<br/>아래에서 사이즈를 입력해 추가해주세요.</p>
                      </div>
                    ) : (
                      Object.entries(inventory).sort((a, b) => Number(b[0]) - Number(a[0])).map(([size, count]) => (
                        <div key={size} className="flex items-center justify-between bg-white p-3 rounded-lg border border-stone-100 shadow-sm">
                          <span className="text-sm font-mono font-bold text-stone-600">{size}mm</span>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setInventory(prev => ({ ...prev, [size]: Math.max(0, prev[Number(size)] - 1) }))}
                              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
                            >
                              <Minus className="w-4 h-4 text-stone-600" />
                            </button>
                            <input 
                              type="number" 
                              value={count}
                              onChange={(e) => setInventory(prev => ({ ...prev, [size]: Math.max(0, parseInt(e.target.value) || 0) }))}
                              className="w-12 text-center font-bold text-stone-800 focus:outline-none"
                            />
                            <button 
                              onClick={() => setInventory(prev => ({ ...prev, [size]: prev[Number(size)] + 1 }))}
                              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
                            >
                              <Plus className="w-4 h-4 text-stone-600" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-stone-200">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">새 사이즈 추가</p>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="사이즈 (mm)"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <button 
                        onClick={() => {
                          const s = parseInt(newSize);
                          if (s > 0) {
                            setInventory(prev => ({ ...prev, [s]: (prev[s] || 0) + 1 }));
                            setNewSize('');
                          }
                        }}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
                      >
                        추가
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      보유하신 자재 수량을 입력하시면, 설계된 사이즈에 필요한 수량과 비교하여 부족한 자재를 알려드립니다.
                    </p>
                  </div>
                  <button 
                    onClick={autoFitToInventory}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    <Ruler className="w-4 h-4" /> 보유 자재로 최대 사이즈 자동 설정
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'blueprint' && (
              <motion.div
                key="blueprint"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                  <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-emerald-600" /> 트러스 조립 도면
                  </h3>
                  
                  <div className="relative aspect-[4/3] bg-stone-50 rounded-lg border border-stone-100 p-8 flex items-center justify-center">
                    {/* 2D Schematic using SVG */}
                    <svg id="blueprint-svg" viewBox="0 0 400 300" className="w-full h-full">
                      {/* Outer Frame */}
                      <rect x="50" y="50" width="300" height="200" fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 2" />
                      
                      {/* Top Beam */}
                      <g>
                        {trussParts.topSegments.reduce((acc: any[], seg, i) => {
                          const xStart = acc.length > 0 ? acc[acc.length-1].xEnd : 50;
                          const segmentWidth = (seg.len / width) * 300;
                          acc.push({ xStart, xEnd: xStart + segmentWidth, ...seg });
                          return acc;
                        }, []).map((seg, i) => (
                          <g key={`top-${i}`}>
                            <rect 
                              x={seg.xStart} 
                              y="45" 
                              width={seg.xEnd - seg.xStart} 
                              height="10" 
                              fill={seg.status === 'owned' ? '#10b981' : '#ef4444'} 
                              stroke="white" 
                              strokeWidth="0.5" 
                            />
                            {seg.len >= 500 && (
                              <text x={seg.xStart + (seg.xEnd - seg.xStart)/2} y="52" textAnchor="middle" className="text-[6px] fill-white font-bold pointer-events-none">
                                {seg.len}
                              </text>
                            )}
                          </g>
                        ))}
                      </g>

                      {/* Bottom Beam */}
                      <g>
                        {trussParts.botSegments.reduce((acc: any[], seg, i) => {
                          const xStart = acc.length > 0 ? acc[acc.length-1].xEnd : 50;
                          const segmentWidth = (seg.len / width) * 300;
                          acc.push({ xStart, xEnd: xStart + segmentWidth, ...seg });
                          return acc;
                        }, []).map((seg, i) => (
                          <g key={`bot-${i}`}>
                            <rect 
                              x={seg.xStart} 
                              y="245" 
                              width={seg.xEnd - seg.xStart} 
                              height="10" 
                              fill={seg.status === 'owned' ? '#10b981' : '#ef4444'} 
                              stroke="white" 
                              strokeWidth="0.5" 
                            />
                            {seg.len >= 500 && (
                              <text x={seg.xStart + (seg.xEnd - seg.xStart)/2} y="252" textAnchor="middle" className="text-[6px] fill-white font-bold pointer-events-none">
                                {seg.len}
                              </text>
                            )}
                          </g>
                        ))}
                      </g>

                      {/* Left Column */}
                      <g>
                        {trussParts.leftSegments.reduce((acc: any[], seg, i) => {
                          const yStart = acc.length > 0 ? acc[acc.length-1].yEnd : 50;
                          const segmentHeight = (seg.len / height) * 200;
                          acc.push({ yStart, yEnd: yStart + segmentHeight, ...seg });
                          return acc;
                        }, []).map((seg, i) => (
                          <g key={`left-${i}`}>
                            <rect 
                              x="45" 
                              y={seg.yStart} 
                              width="10" 
                              height={seg.yEnd - seg.yStart} 
                              fill={seg.status === 'owned' ? '#10b981' : '#ef4444'} 
                              stroke="white" 
                              strokeWidth="0.5" 
                            />
                            {seg.len >= 500 && (
                              <text x="50" y={seg.yStart + (seg.yEnd - seg.yStart)/2} textAnchor="middle" transform={`rotate(-90 50 ${seg.yStart + (seg.yEnd - seg.yStart)/2})`} className="text-[6px] fill-white font-bold pointer-events-none">
                                {seg.len}
                              </text>
                            )}
                          </g>
                        ))}
                      </g>

                      {/* Right Column */}
                      <g>
                        {trussParts.rightSegments.reduce((acc: any[], seg, i) => {
                          const yStart = acc.length > 0 ? acc[acc.length-1].yEnd : 50;
                          const segmentHeight = (seg.len / height) * 200;
                          acc.push({ yStart, yEnd: yStart + segmentHeight, ...seg });
                          return acc;
                        }, []).map((seg, i) => (
                          <g key={`right-${i}`}>
                            <rect 
                              x="345" 
                              y={seg.yStart} 
                              width="10" 
                              height={seg.yEnd - seg.yStart} 
                              fill={seg.status === 'owned' ? '#10b981' : '#ef4444'} 
                              stroke="white" 
                              strokeWidth="0.5" 
                            />
                            {seg.len >= 500 && (
                              <text x="350" y={seg.yStart + (seg.yEnd - seg.yStart)/2} textAnchor="middle" transform={`rotate(-90 350 ${seg.yStart + (seg.yEnd - seg.yStart)/2})`} className="text-[6px] fill-white font-bold pointer-events-none">
                                {seg.len}
                              </text>
                            )}
                          </g>
                        ))}
                      </g>

                      {/* Corner Boxes */}
                      <rect x="42" y="42" width="16" height="16" fill="#9ca3af" rx="2" />
                      <rect x="342" y="42" width="16" height="16" fill="#9ca3af" rx="2" />
                      <rect x="42" y="242" width="16" height="16" fill="#9ca3af" rx="2" />
                      <rect x="342" y="242" width="16" height="16" fill="#9ca3af" rx="2" />

                      {/* Labels */}
                      <text x="200" y="35" textAnchor="middle" className="text-[10px] fill-stone-400 font-bold">{width}mm</text>
                      <text x="30" y="150" textAnchor="middle" transform="rotate(-90 30 150)" className="text-[10px] fill-stone-400 font-bold">{height}mm</text>
                    </svg>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-stone-500">
                      <div className="w-3 h-3 bg-[#10b981]" />
                      <span>보유 중인 자재</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-stone-500">
                      <div className="w-3 h-3 bg-[#ef4444]" />
                      <span>부족한 자재 (구매 필요)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-stone-500">
                      <div className="w-3 h-3 bg-[#9ca3af]" />
                      <span>코너 커넥터 (Box Corner)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      위 도면은 정면에서 본 조립 예시입니다. 각 변은 계산된 세그먼트들의 조합으로 구성됩니다.
                    </p>
                  </div>
                  <button 
                    onClick={downloadBlueprint}
                    className="w-full py-3 bg-stone-800 text-white rounded-xl font-bold text-sm hover:bg-stone-900 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> 조립도 고화질 JPG 다운로드
                  </button>
                </div>
              </motion.div>
            )}
            {activeTab === 'parts' && (
              <motion.div
                key="parts"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> 소요 자재 및 재고 현황
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="grid grid-cols-4 text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 px-1">
                        <span className="col-span-1">사이즈</span>
                        <span className="text-center">필요</span>
                        <span className="text-center">보유</span>
                        <span className="text-right">부족</span>
                      </div>
                      
                      {Object.entries(trussParts.required).sort((a, b) => Number(b[0]) - Number(a[0])).map(([size, reqCount]) => {
                        const owned = inventory[Number(size)] || 0;
                        const shortage = Math.max(0, reqCount - owned);
                        return (
                          <div key={size} className="grid grid-cols-4 text-sm py-2 border-b border-emerald-100 last:border-0 items-center px-1">
                            <span className="font-mono font-medium">{size}mm</span>
                            <span className="text-center font-bold">{reqCount}</span>
                            <span className="text-center text-stone-500">{owned}</span>
                            <span className={`text-right font-bold ${shortage > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                              {shortage > 0 ? `+${shortage}` : 'OK'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">프레임 부속 (Frame Parts)</p>
                      <div className="flex justify-between text-sm py-1 border-b border-emerald-100">
                        <span>코너 커넥터 (Box Corner)</span>
                        <span className="font-bold">x 4</span>
                      </div>
                      <div className="flex justify-between text-sm py-1 border-b border-emerald-100 last:border-0">
                        <span>베이스 플레이트 (Base Plate)</span>
                        <span className="font-bold">x 2</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-200">
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">연결 하드웨어 (Hardware)</p>
                      <div className="flex justify-between text-sm py-1">
                        <span>원추형 커플러 (Couplers)</span>
                        <span className="font-bold text-emerald-700">{trussParts.hardware.couplers}</span>
                      </div>
                      <div className="flex justify-between text-sm py-1">
                        <span>커넥터 핀 (Pins)</span>
                        <span className="font-bold text-emerald-700">{trussParts.hardware.pins}</span>
                      </div>
                      <div className="flex justify-between text-sm py-1">
                        <span>R-클립 (Safety Clips)</span>
                        <span className="font-bold text-emerald-700">{trussParts.hardware.clips}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={exportBOM}
                  className="w-full py-3 bg-stone-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-stone-900 transition-colors"
                >
                  <Download className="w-4 h-4" /> 자재 리스트(BOM) 내보내기
                </button>
              </motion.div>
            )}

            {activeTab === 'design' && (
              <motion.div
                key="design"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-stone-700 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> 디자인 이미지 삽입
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    {designImage ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-stone-200">
                        <img src={designImage} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <p className="text-white text-xs font-medium">이미지 변경</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Plus className="w-6 h-6 text-stone-400" />
                        </div>
                        <p className="text-sm font-medium text-stone-600">이미지 업로드</p>
                        <p className="text-xs text-stone-400">JPG, PNG (권장: 4:3 비율)</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                </div>

                {designImage && (
                  <button 
                    onClick={() => setDesignImage(null)}
                    className="w-full py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
                  >
                    이미지 제거
                  </button>
                )}

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    업로드한 이미지는 3D 모델의 배경 현수막 영역에 자동으로 매핑됩니다. 실제 제작 시 해상도에 주의하세요.
                  </p>
                </div>

                <button 
                  onClick={downloadScreenshot}
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  <Download className="w-5 h-5" /> 현재 디자인 캡쳐 저장
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-stone-200 bg-stone-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Current Config</span>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Ready to Build</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-stone-200">
              <p className="text-[10px] text-stone-400 font-bold uppercase">Width</p>
              <p className="text-sm font-mono font-bold">{width}mm</p>
            </div>
            <div className="bg-white p-2 rounded-lg border border-stone-200">
              <p className="text-[10px] text-stone-400 font-bold uppercase">Height</p>
              <p className="text-sm font-mono font-bold">{height}mm</p>
            </div>
            <div className="bg-white p-2 rounded-lg border border-stone-200">
              <p className="text-[10px] text-stone-400 font-bold uppercase">Depth</p>
              <p className="text-sm font-mono font-bold">{depth}mm</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 relative bg-stone-200">
        <Canvas 
          shadows={{ type: THREE.PCFShadowMap }} 
          gl={{ 
            antialias: true, 
            toneMapping: THREE.ACESFilmicToneMapping, 
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
          }}
        >
          <PerspectiveCamera makeDefault position={[5, 4, 8]} fov={45} />
          <OrbitControls 
            ref={orbitControlsRef}
            enableDamping 
            dampingFactor={0.05} 
            minDistance={2} 
            maxDistance={20}
            maxPolarAngle={Math.PI / 2.05} 
          />
          
          <ambientLight intensity={0.7} />
          <spotLight 
            position={[15, 20, 15]} 
            angle={0.3} 
            penumbra={1} 
            intensity={2} 
            castShadow 
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />
          <directionalLight position={[-10, 10, 5]} intensity={1} />
          
          <React.Suspense fallback={null}>
            <TrussStructure 
              width={width} 
              height={height} 
              depth={depth} 
              designImage={designImage} 
            />
            <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={20} blur={1.5} far={4} />
            <Environment preset="studio" />
          </React.Suspense>
        </Canvas>

        {/* Viewport HUD */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-3">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">3D Real-time Preview</span>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setView('front')}
              className="glass-panel px-4 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-white transition-all"
            >
              정면 (Front)
            </button>
            <button 
              onClick={() => setView('top')}
              className="glass-panel px-4 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-white transition-all"
            >
              평면 (Top)
            </button>
            <button 
              onClick={() => setView('side')}
              className="glass-panel px-4 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-white transition-all"
            >
              측면 (Side)
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 glass-panel p-4 rounded-2xl max-w-xs">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Controls</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-stone-600">
            <span className="font-medium">Rotate:</span> <span>Left Click + Drag</span>
            <span className="font-medium">Zoom:</span> <span>Scroll Wheel</span>
            <span className="font-medium">Pan:</span> <span>Right Click + Drag</span>
          </div>
        </div>
      </main>
    </div>
  );
}
