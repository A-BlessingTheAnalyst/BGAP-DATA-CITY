import Link from 'next/link';
import { ArrowLeft, BarChart3, Users, Zap, CheckSquare } from 'lucide-react';

export default function GameAdminPage() {
  const telemetry = {
    totalPlayers: 1420,
    completionRate: '74.2%',
    avgFpsMobile: '31.4 FPS',
    avgFpsDesktop: '59.8 FPS',
  };

  return (
    <main className="min-h-screen bg-bgap-dark text-bgap-text p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-bgap-border">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-mono text-bgap-muted hover:text-bgap-cyan transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>HOME</span>
        </Link>
        <span className="text-xs font-mono text-bgap-cyan uppercase font-bold">Admin Telemetry Studio</span>
      </div>

      <h1 className="text-3xl font-extrabold mb-2">BGAP Game Telemetry & Authoring</h1>
      <p className="text-sm text-bgap-muted mb-8">
        Real-time metrics on learner completion, WebGL renderer performance, and mission rubric validations.
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-bgap-surface border border-bgap-border">
          <div className="text-xs font-mono text-bgap-muted mb-1 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-bgap-cyan" />
            Active Explorers
          </div>
          <div className="text-2xl font-bold font-mono text-bgap-text">{telemetry.totalPlayers}</div>
        </div>

        <div className="p-5 rounded-2xl bg-bgap-surface border border-bgap-border">
          <div className="text-xs font-mono text-bgap-muted mb-1 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-bgap-emerald" />
            Mission 01 Pass Rate
          </div>
          <div className="text-2xl font-bold font-mono text-bgap-emerald">{telemetry.completionRate}</div>
        </div>

        <div className="p-5 rounded-2xl bg-bgap-surface border border-bgap-border">
          <div className="text-xs font-mono text-bgap-muted mb-1 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-bgap-gold" />
            Mobile 30 FPS Target
          </div>
          <div className="text-2xl font-bold font-mono text-bgap-gold">{telemetry.avgFpsMobile}</div>
        </div>

        <div className="p-5 rounded-2xl bg-bgap-surface border border-bgap-border">
          <div className="text-xs font-mono text-bgap-muted mb-1 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-bgap-neon" />
            Desktop 60 FPS Target
          </div>
          <div className="text-2xl font-bold font-mono text-bgap-neon">{telemetry.avgFpsDesktop}</div>
        </div>
      </div>
    </main>
  );
}
