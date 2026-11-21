'use client';
import { useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { runtimeInput, resetInput } from './InputManager';
import { interact } from './useInput';
import { useGameState } from '../engine/GameState';
import { useIsTouch } from '../ui/hudPrefs';
import { ArrowDown, ArrowUp, Footprints, Hand, LogOut, Zap } from 'lucide-react';

// Touch controls for phones/tablets in any orientation (shown by pointer type, not screen width —
// a phone in landscape is wider than `md`, which used to hide these exactly when playing).
// Thumbs live in the bottom corners; nothing is drawn in the middle of the screen.
//   On foot: move stick (left) · Run (hold) and the context action (right).
//   Driving: steering stick (left, x only) · GAS / BRAKE pedals, handbrake, boost, exit (right).

type Flag = 'forward' | 'backward' | 'sprint' | 'jump';

/** A press-and-hold button that sets one input flag while held (multi-touch safe). */
function HoldButton({ flag, label, className, children }: { flag: Flag; label: string; className: string; children: ReactNode }) {
  const [down, setDown] = useState(false);
  const press = (e: RPointerEvent<HTMLButtonElement>) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); runtimeInput[flag] = true; setDown(true); };
  const release = () => { runtimeInput[flag] = false; setDown(false); };
  return (
    <button
      aria-label={label}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
      className={`touch-none select-none rounded-2xl border font-bold flex flex-col items-center justify-center gap-0.5 transition-transform ${down ? 'scale-95 brightness-110' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

/** Analog stick. `xOnly` makes it a steering wheel (no forward/back component). */
function Stick({ xOnly = false }: { xOnly?: boolean }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState([0, 0]);
  const clear = () => { runtimeInput.axisX = 0; runtimeInput.axisZ = 0; setKnob([0, 0]); };
  const R = 40;
  return (
    <div
      ref={base}
      aria-label={xOnly ? 'Steering' : 'Movement joystick'}
      className={`touch-none rounded-full bg-slate-900/25 border border-white/50 backdrop-blur-sm flex items-center justify-center ${xOnly ? 'w-36 h-20 [@media(max-height:420px)]:w-32 [@media(max-height:420px)]:h-16' : 'w-28 h-28 [@media(max-height:420px)]:w-24 [@media(max-height:420px)]:h-24'}`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId) || !base.current) return;
        const r = base.current.getBoundingClientRect();
        let x = e.clientX - r.left - r.width / 2, y = xOnly ? 0 : e.clientY - r.top - r.height / 2;
        const m = Math.max(1, Math.hypot(x, y) / R);
        x /= m; y /= m;
        runtimeInput.axisX = x / R;
        runtimeInput.axisZ = y / R;
        setKnob([x, y]);
      }}
      onPointerUp={clear}
      onPointerCancel={clear}
      onLostPointerCapture={clear}
    >
      <div className="w-12 h-12 rounded-full bg-white/85 shadow-lg" style={{ transform: `translate(${knob[0]}px, ${knob[1]}px)` }} />
    </div>
  );
}

export function MobileTouchControls() {
  const touch = useIsTouch();
  const active = useGameState((s) => s.activeTarget);
  const driving = useGameState((s) => s.isDriving);
  const vehicle = useGameState((s) => s.drivingVehicleId);
  const blocked = useGameState((s) => s.isDialogueActive || s.isWorkstationActive || s.isPaused || s.isMapOpen || s.isPhoneOpen || s.isCreatorOpen || s.isShopOpen);
  if (!touch || blocked) return null;
  const chopper = !!vehicle?.startsWith('chopper');

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-between items-end"
      style={{ padding: 'max(12px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))' }}
    >
      <div className="pointer-events-auto">
        <Stick key={driving ? 'steer' : 'move'} xOnly={driving && !chopper} />
      </div>

      {driving ? (
        <div className="pointer-events-auto flex items-end gap-2">
          <div className="flex flex-col gap-2">
            <button onClick={() => { resetInput(); interact(); }} aria-label="Exit vehicle" className="touch-none w-14 h-10 rounded-xl bg-bgap-surface/85 border border-bgap-border text-bgap-text text-[10px] font-bold flex items-center justify-center gap-1">
              <LogOut className="w-3.5 h-3.5" />Exit
            </button>
            {chopper ? (
              <HoldButton flag="jump" label="Climb" className="w-14 h-14 bg-bgap-surface/85 border-bgap-border text-bgap-text text-[10px]"><ArrowUp className="w-5 h-5" />Up</HoldButton>
            ) : (
              <HoldButton flag="jump" label="Handbrake" className="w-14 h-14 bg-bgap-surface/85 border-bgap-border text-bgap-text text-[10px]"><Hand className="w-4 h-4" />H-brake</HoldButton>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <HoldButton flag="sprint" label={chopper ? 'Descend' : 'Boost'} className="w-14 h-10 bg-bgap-surface/85 border-bgap-border text-bgap-text text-[10px]">
              {chopper ? <><ArrowDown className="w-4 h-4" />Down</> : <><Zap className="w-4 h-4" />Boost</>}
            </HoldButton>
            <HoldButton flag="backward" label="Brake / reverse" className="w-16 h-16 [@media(max-height:420px)]:h-14 bg-red-500/80 border-red-300 text-white text-xs">BRAKE</HoldButton>
          </div>
          <HoldButton flag="forward" label="Accelerate" className="w-16 h-28 [@media(max-height:420px)]:h-24 bg-emerald-500/85 border-emerald-300 text-white text-xs">GAS</HoldButton>
        </div>
      ) : (
        <div className="pointer-events-auto flex items-end gap-2">
          <HoldButton flag="sprint" label="Run" className="w-16 h-16 bg-bgap-surface/85 border-bgap-border text-bgap-text text-[10px]"><Footprints className="w-5 h-5" />Run</HoldButton>
          {active && (
            <button onClick={() => interact()} className="touch-none max-w-[42vw] min-h-16 rounded-2xl bg-bgap-cyan border border-bgap-cyan px-3 py-2 text-white font-bold text-xs leading-tight text-left">
              {active.actionText.replace(/\s*\[E\]\s*$/, '')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
