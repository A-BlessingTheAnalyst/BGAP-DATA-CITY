'use client';
import { useRef, useState } from 'react';
import { runtimeInput, resetInput } from './InputManager';
import { interact } from './useInput';
import { useGameState } from '../engine/GameState';
export function MobileTouchControls() {
 const active = useGameState(s => s.activeTarget), blocked = useGameState(s => s.isDialogueActive || s.isWorkstationActive || s.isPaused);
 const base = useRef<HTMLDivElement>(null), [knob, setKnob] = useState([0,0]);
 const clear = () => { resetInput(); setKnob([0,0]); };
 if (blocked) return null;
 return <div className="md:hidden pointer-events-auto absolute inset-x-0 bottom-6 px-6 flex justify-between items-end z-30">
 <div ref={base} aria-label="Movement joystick" className="w-28 h-28 rounded-full bg-bgap-card/60 border border-bgap-border flex items-center justify-center touch-none"
 onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); }}
 onPointerMove={e => { if (!e.currentTarget.hasPointerCapture(e.pointerId) || !base.current) return; const r=base.current.getBoundingClientRect(); let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2; const m=Math.max(1,Math.hypot(x,y)/38); x/=m;y/=m; runtimeInput.axisX=x/38;runtimeInput.axisZ=y/38;setKnob([x,y]); }}
 onPointerUp={clear} onPointerCancel={clear} onLostPointerCapture={clear}>
 <div className="w-12 h-12 rounded-full bg-bgap-cyan/80" style={{transform:'translate('+knob[0]+'px,'+knob[1]+'px)'}} /></div>
 <div className="flex gap-2"><button aria-label="Run" onPointerDown={()=>{runtimeInput.sprint=true;}} onPointerUp={()=>{runtimeInput.sprint=false;}} onPointerCancel={clear} className="rounded-xl bg-bgap-card p-4 text-white">Run</button>
 {active && <button onClick={interact} className="rounded-xl bg-bgap-cyan p-4 text-bgap-dark font-bold">Interact</button>}</div></div>;
}
