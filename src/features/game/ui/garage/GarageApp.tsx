'use client';
import React, { useState } from 'react';
import { Car, GraduationCap, MapPin, Navigation } from 'lucide-react';
import { useGameState } from '../../engine/GameState';
import { AudioManager } from '../../audio/AudioManager';
import { naira } from '../phone/useCareer';
import { buyFromDealership, hailRide, useGarage } from './useGarage';
import { callAllNear, nearPlayer } from '../../world/DrivableCar';
import { requestTeleport } from '../../characters/PlayerCharacter';
import { useNavTarget } from '../../world/navigation';

/** DataPhone app: pass your driving test, buy a car from the dealership, call your cars to you, or hail a ride. */
export function GarageApp() {
  const { owned, hasLicence, catalog, licencePrice, loaded } = useGarage();
  const balance = useGameState((s) => s.walletBalance);
  const target = useNavTarget();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!loaded) return <p className="text-xs text-bgap-muted">Loading…</p>;

  const act = async (id: string, fn: () => Promise<string>) => {
    setBusy(id);
    setMessage(null);
    try {
      const text = await fn();
      AudioManager.playUi('confirm');
      setMessage({ ok: true, text });
    } catch (e) {
      AudioManager.playUi('error');
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong.' });
    } finally {
      setBusy(null);
    }
  };

  const buy = (itemId: string, label: string) => act(itemId, async () => {
    const { created, name } = await buyFromDealership(itemId);
    return created ? `Bought ${name}.` : `You already own ${label}.`;
  });

  const call = () => act('call', async () => {
    await callAllNear(owned.map((o) => o.vehicleId), nearPlayer());
    return 'Your cars are on the way — look around you.';
  });

  const hail = () => act('hail', async () => {
    if (!target) throw new Error('Track a job or drop a map pin first, then hail a ride there.');
    const p = nearPlayer();
    const { fare, metres } = await hailRide([p[0], p[2]], [target.pos[0], target.pos[2]]);
    requestTeleport(target.pos[0], target.pos[2]);
    useGameState.getState().setCustomWaypoint(null);
    return `A danfo took you ${metres} m to ${target.label} for ${naira(fare)}.`;
  });

  return (
    <div className="space-y-4">
      {message && <p className={`text-[11px] rounded-lg px-2.5 py-1.5 border ${message.ok ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-red-300 bg-red-500/10 border-red-500/30'}`}>{message.text}</p>}

      <section>
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-bgap-muted mb-1.5">Get around</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={hail} disabled={busy === 'hail' || !target} title={target ? undefined : 'Track a job or drop a map pin first'} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-bgap-cyan text-bgap-dark font-bold inline-flex items-center gap-1 disabled:opacity-40">
            <Navigation className="w-3.5 h-3.5" />Hail a danfo{target ? ` to ${target.label}` : ''}
          </button>
          {owned.length > 0 && (
            <button onClick={call} disabled={busy === 'call'} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-bgap-border text-bgap-muted hover:text-bgap-text inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />Call my car to me
            </button>
          )}
        </div>
      </section>

      {!hasLicence && (
        <section className="rounded-xl border border-bgap-gold/30 bg-bgap-gold/5 p-3">
          <div className="flex items-center gap-2 mb-1 text-bgap-gold text-xs font-bold"><GraduationCap className="w-4 h-4" />Driving licence required to drive</div>
          <p className="text-[11px] text-bgap-muted mb-2">Pass a quick lesson at the Academy to drive any car you own. One-time fee.</p>
          <button onClick={() => buy('driving_licence', 'the driving licence')} disabled={busy === 'driving_licence'} className="text-[11px] px-2.5 py-1 rounded-lg bg-bgap-gold text-[#2B1A05] font-bold">
            Take the test — {naira(licencePrice)}
          </button>
        </section>
      )}

      <section>
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-bgap-muted mb-1.5">Your garage ({owned.length})</h3>
        {owned.length === 0 ? (
          <p className="text-[11px] text-bgap-muted">No cars yet — buy one below.</p>
        ) : (
          <ul className="space-y-1.5">
            {owned.map((o) => {
              const def = catalog.find((v) => v.id === o.vehicleId);
              if (!def) return null;
              return (
                <li key={o.vehicleId} className="flex items-center gap-2 text-xs text-bgap-text bg-bgap-card rounded-lg p-2 border border-bgap-border">
                  <span className="w-5 h-5 rounded shrink-0" style={{ background: def.color }} />
                  <Car className="w-3.5 h-3.5 text-bgap-muted shrink-0" />
                  {def.name}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-bgap-muted mb-1.5">Dealership</h3>
        <ul className="space-y-1.5">
          {catalog.map((v) => {
            const already = owned.some((o) => o.vehicleId === v.id);
            const affordable = balance !== null && balance >= v.price;
            return (
              <li key={v.id} className="rounded-xl border border-bgap-border bg-bgap-card p-2.5 flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-lg shrink-0" style={{ background: v.color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-bgap-text">{v.name}</div>
                  <p className="text-[10.5px] text-bgap-muted leading-snug">{v.description}</p>
                </div>
                {already ? (
                  <span className="text-[10px] text-emerald-300 shrink-0">Owned</span>
                ) : (
                  <button onClick={() => buy(v.id, v.name)} disabled={busy === v.id || !affordable} title={affordable ? undefined : "You can't afford this yet"} className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-bgap-cyan text-bgap-dark font-bold disabled:opacity-40">
                    {naira(v.price)}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-bgap-muted mt-2">Approach your car in the world and press E to drive — WASD to steer, Shift for speed, E to get out.</p>
      </section>
    </div>
  );
}
