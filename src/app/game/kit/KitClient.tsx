'use client';
import dynamic from 'next/dynamic';

const KitShowroom = dynamic(() => import('@/features/game/world/kit/KitShowroom'), {
  ssr: false,
  loading: () => <div className="h-screen w-screen bg-bgap-dark text-bgap-muted flex items-center justify-center text-sm">Loading the Asset Lab…</div>,
});

export default function KitClient() {
  return <KitShowroom />;
}
