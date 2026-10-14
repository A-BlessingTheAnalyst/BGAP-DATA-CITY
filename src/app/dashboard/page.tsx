import Link from 'next/link';
import { ArrowLeft, Play } from 'lucide-react';

export default function DashboardBridgePage() {
  return (
    <main className="min-h-screen bg-bgap-dark text-bgap-text flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-bgap-surface border border-bgap-border rounded-2xl p-8 text-center shadow-hud-glass">
        <h1 className="text-2xl font-bold mb-2">BGAP Academy Dashboard</h1>
        <p className="text-xs text-bgap-muted mb-6 leading-relaxed">
          This route integrates directly into your existing traditional BGAP student dashboard.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/game"
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-bgap-cyan to-bgap-neon text-bgap-dark font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-neon-cyan"
          >
            <Play className="w-4 h-4 fill-current" />
            Switch to 3D Data City
          </Link>
          <Link
            href="/"
            className="py-3 px-6 rounded-xl bg-bgap-card border border-bgap-border text-bgap-text text-sm font-semibold flex items-center justify-center gap-2 hover:bg-bgap-border/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
