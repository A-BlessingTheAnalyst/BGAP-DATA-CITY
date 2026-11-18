'use client';
import { DrivableCar } from './DrivableCar';
import { useGarage } from '../ui/garage/useGarage';

/** Every car the player owns, parked wherever the server last put it. */
export function GarageWorld() {
  const owned = useGarage((s) => s.owned);
  const catalog = useGarage((s) => s.catalog);
  if (!owned.length || !catalog.length) return null;
  return (
    <>
      {owned.map((o) => {
        const def = catalog.find((v) => v.id === o.vehicleId);
        return def ? <DrivableCar key={o.vehicleId} owned={o} def={def} /> : null;
      })}
    </>
  );
}
