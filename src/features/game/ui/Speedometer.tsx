'use client';
import { useEffect, useRef } from 'react';
import { useGameState } from '../engine/GameState';
import { driveRuntime } from '../characters/PlayerCharacter';
import { useIsTouch } from './hudPrefs';
import { pushToast } from './Toasts';

/** Small km/h readout while driving (bottom-centre on desktop; top-centre on touch, clear of the thumbs). */
export function Speedometer() {
  const driving = useGameState((s) => s.isDriving);
  const vehicle = useGameState((s) => s.drivingVehicleId);
  const touch = useIsTouch();
  const num = useRef<HTMLSpanElement>(null);
  const gear = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!driving) return;
    const chopper = vehicle?.startsWith('chopper');
    pushToast(
      chopper
        ? (touch ? 'Stick: turn · Pedals: forward/back · ▲▼ climb/descend · Exit to land' : 'W/S thrust · A/D turn · Space climb · Shift descend · E exit')
        : (touch ? 'Stick: steer · GAS / BRAKE pedals · ⟂ handbrake · Exit to get out' : 'W gas · S brake/reverse · A/D steer · Space handbrake · Shift boost · E exit'),
      { id: chopper ? 'tip:fly' : 'tip:drive', once: true, ttl: 7000 },
    );
    let raf = 0;
    const tick = () => {
      const v = driveRuntime.speed;
      if (num.current) num.current.textContent = String(Math.round(Math.abs(v) * 3.6));
      if (gear.current) gear.current.textContent = v < -0.3 ? 'R' : Math.abs(v) < 0.3 ? 'N' : 'D';
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [driving, vehicle, touch]);

  if (!driving) return null;
  return (
    <div className={`absolute left-1/2 -translate-x-1/2 pointer-events-none select-none flex items-baseline gap-1.5 rounded-xl bg-slate-900/60 backdrop-blur px-3 py-1 text-white ${touch ? 'top-2' : 'bottom-5'}`}>
      <span ref={num} className="font-mono text-2xl font-extrabold tabular-nums leading-none">0</span>
      <span className="text-[10px] font-semibold opacity-80">km/h</span>
      <span ref={gear} className="ml-1 font-mono text-xs font-bold text-bgap-gold">N</span>
    </div>
  );
}
