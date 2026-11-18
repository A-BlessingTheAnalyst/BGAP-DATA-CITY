'use client';
import { Suspense, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Bounds, OrbitControls, Sky, ContactShadows, Environment } from '@react-three/drei';
import { PostFX } from '../../engine/PostFX';
import { KIT as KIT_OWN, LIBRARY, CATEGORIES, DISTRICTS, Category, KitAsset } from './catalog';

const KIT = [...KIT_OWN, ...LIBRARY];
import { Person, CHARACTERS } from './characters';
import { MarketBoulevard } from './district';

// Asset Lab: browse and inspect every building, vehicle and character in the kit.

type Mode = 'inspect' | 'street';

/** Opens the street scene with a wide establishing shot over the boulevard. */
function StreetCamera() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.set(-55, 42, -70);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

function Lights() {
  return (
    <>
      <Sky sunPosition={[60, 22, 40]} turbidity={6} rayleigh={1.4} mieCoefficient={0.006} />
      <hemisphereLight args={['#FFF1D6', '#6E5A44', 0.7]} />
      <directionalLight position={[40, 50, 30]} intensity={2.2} color="#FFE2B8" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-60} shadow-camera-right={60} shadow-camera-top={60} shadow-camera-bottom={-60} shadow-bias={-0.0004} />
      <fog attach="fog" args={['#E9D9BF', 120, 420]} />
      <Environment files="/assets/hdri/partly_cloudy_1k.hdr" environmentIntensity={0.55} />
    </>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <circleGeometry args={[400, 64]} />
      <meshStandardMaterial color="#C9B48F" roughness={1} />
    </mesh>
  );
}

/** A reference person next to every asset, so scale is always obvious. */
function ScaleFigure({ asset }: { asset: KitAsset }) {
  if (asset.category === 'Characters') return null;
  const x = asset.footprint[0] / 2 + 1.2;
  return (
    <group position={[x, 0, asset.footprint[1] / 2]}>
      <Person outfit={CHARACTERS[0].outfit} />
    </group>
  );
}

export default function KitShowroom() {
  const [mode, setMode] = useState<Mode>('inspect');
  const [cat, setCat] = useState<Category | 'All'>('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(KIT[0].id);
  const [spin, setSpin] = useState(true);

  const list = KIT.filter((a) => (cat === 'All' || a.category === cat) && (a.name + a.description).toLowerCase().includes(query.toLowerCase()));
  const asset = KIT.find((a) => a.id === selectedId) ?? KIT[0];
  const district = DISTRICTS.find((d) => d.id === asset.district);

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-bgap-dark text-bgap-text overflow-hidden">
      {/* Sidebar */}
      <aside className="md:w-80 w-full md:h-full h-[40vh] flex flex-col border-b md:border-b-0 md:border-r border-bgap-border bg-bgap-surface">
        <div className="p-4 border-b border-bgap-border">
          <h1 className="text-lg font-bold">Data City Asset Lab</h1>
          <p className="text-xs text-bgap-muted mt-1">{KIT_OWN.length} Data City assets · {LIBRARY.length} library models (CC0)</p>
          <div className="flex gap-1 mt-3" role="tablist">
            {(['inspect', 'street'] as Mode[]).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                className={`flex-1 text-xs font-bold py-1.5 rounded ${mode === m ? 'bg-bgap-cyan text-bgap-dark' : 'bg-bgap-card text-bgap-muted'}`}>
                {m === 'inspect' ? 'Inspect assets' : 'Street scene'}
              </button>
            ))}
          </div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search, e.g. bank or minibus" aria-label="Search assets"
            className="mt-3 w-full text-sm bg-bgap-card border border-bgap-border rounded px-2.5 py-1.5 outline-none focus:border-bgap-cyan" />
          <div className="flex flex-wrap gap-1 mt-2">
            {(['All', ...CATEGORIES] as const).map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`text-[11px] px-2 py-0.5 rounded-full border ${cat === c ? 'border-bgap-cyan text-bgap-cyan' : 'border-bgap-border text-bgap-muted'}`}>{c}</button>
            ))}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {list.map((a) => (
            <li key={a.id}>
              <button onClick={() => { setSelectedId(a.id); setMode('inspect'); }}
                className={`w-full text-left px-3 py-2 rounded text-sm ${a.id === asset.id && mode === 'inspect' ? 'bg-bgap-card text-bgap-text' : 'text-bgap-muted hover:bg-bgap-card/60'}`}>
                <div className="font-semibold text-bgap-text">{a.name}</div>
                <div className="text-[11px]">{a.category} · {DISTRICTS.find((d) => d.id === a.district)?.name ?? 'Any district'}</div>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="text-xs text-bgap-muted p-3">No assets match “{query}”.</li>}
        </ul>
      </aside>

      {/* Viewport */}
      <main className="relative flex-1 min-h-0">
        <Canvas shadows camera={{ position: [30, 20, 30], fov: 40, near: 0.1, far: 1200 }} gl={{ antialias: true }}>
          <Suspense fallback={null}><Lights /></Suspense>
          <Ground />
          <Suspense fallback={null}>
            {mode === 'inspect' ? (
              <Bounds key={asset.id} fit clip observe margin={1.7}>
                <group>
                  {asset.render()}
                  <ScaleFigure asset={asset} />
                </group>
              </Bounds>
            ) : (
              <><StreetCamera /><MarketBoulevard /></>
            )}
          </Suspense>
          <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={80} blur={2.5} far={20} />
          <PostFX quality="balanced" />
          <OrbitControls makeDefault autoRotate={spin && mode === 'inspect'} autoRotateSpeed={0.6} maxPolarAngle={Math.PI / 2.05} target={mode === 'street' ? [0, 2, 0] : undefined} />
        </Canvas>

        {mode === 'inspect' ? (
          <div className="absolute left-4 right-4 bottom-4 md:right-auto md:max-w-md bg-bgap-surface/90 backdrop-blur border border-bgap-border rounded-xl p-4 text-sm">
            <div className="text-[11px] uppercase tracking-widest text-bgap-cyan font-mono">{asset.category}</div>
            <h2 className="text-lg font-bold mt-0.5">{asset.name}</h2>
            <p className="text-bgap-muted mt-1 leading-relaxed">{asset.description}</p>
            <dl className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div><dt className="text-bgap-muted">Footprint</dt><dd className="font-mono">{asset.footprint[0]} × {asset.footprint[1]} m</dd></div>
              <div><dt className="text-bgap-muted">Height</dt><dd className="font-mono">{asset.height.toFixed(1)} m</dd></div>
              <div><dt className="text-bgap-muted">District</dt><dd>{district?.name ?? 'Any'}</dd></div>
            </dl>
            <p className="mt-2 text-[11px] text-bgap-muted">Source: <span className="text-bgap-text">{asset.source ?? 'Original (Data City)'}</span>{asset.licence ? ` · ${asset.licence}` : ''}</p>
            <div className="flex items-center justify-between mt-3">
              {district && <div className="flex gap-1" aria-label="District palette">{district.palette.map((c) => <span key={c} className="w-4 h-4 rounded-sm border border-bgap-border" style={{ background: c }} title={c} />)}</div>}
              <label className="text-xs text-bgap-muted flex items-center gap-1.5 ml-auto"><input type="checkbox" checked={spin} onChange={(e) => setSpin(e.target.checked)} /> Turntable</label>
            </div>
          </div>
        ) : (
          <div className="absolute left-4 bottom-4 max-w-md bg-bgap-surface/90 backdrop-blur border border-bgap-border rounded-xl p-4 text-sm">
            <div className="text-[11px] uppercase tracking-widest text-bgap-cyan font-mono">Street scene</div>
            <h2 className="text-lg font-bold mt-0.5">Market Boulevard</h2>
            <p className="text-bgap-muted mt-1">A slice of the Chapter 1 district built only from kit pieces: shops, café, market, kiosk, flats, traffic and the cast. Drag to orbit, scroll to zoom.</p>
          </div>
        )}
        <div className="absolute top-4 right-4 text-[11px] text-bgap-muted bg-bgap-surface/80 border border-bgap-border rounded px-2 py-1">Drag to orbit · Scroll to zoom · Right-drag to pan</div>
      </main>
    </div>
  );
}
