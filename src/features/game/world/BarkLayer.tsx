'use client';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { barkRuntime, type ActiveBark } from './barks';

/** Renders currently-active barks as small floating subtitles. Polls the runtime array each frame. */
export function BarkLayer() {
  const [visible, setVisible] = useState<ActiveBark[]>([]);
  const last = useRef(0);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (t - last.current < 0.1) return; // 10 Hz is plenty for text that lives ~2.6 s
    last.current = t;
    const live = barkRuntime.active.filter((b) => b.until > t);
    barkRuntime.active.length = 0;
    barkRuntime.active.push(...live);
    setVisible(live);
  });
  return (
    <>
      {visible.map((b) => (
        <Html key={b.key} position={[b.x, b.y + 1.9, b.z]} center distanceFactor={14} occlude={false}>
          <div className="px-2 py-1 rounded-full bg-black/70 text-white text-[11px] font-medium whitespace-nowrap pointer-events-none border border-white/10 shadow-lg">
            {b.text}
          </div>
        </Html>
      ))}
    </>
  );
}
