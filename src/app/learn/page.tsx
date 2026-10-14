import Link from 'next/link';
import { ArrowLeft, BookOpen, Play } from 'lucide-react';

export default function LearnBridgePage() {
  return (
    <main className="min-h-screen bg-bgap-dark text-bgap-text flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-bgap-surface border border-bgap-border rounded-2xl p-8 text-center shadow-hud-glass">
        <div className="w-12 h-12 rounded-xl bg-bgap-emerald/10 border border-bgap-emerald/30 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6 text-bgap-emerald" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Traditional Learning Hub</h1>
        <p className="text-xs text-bgap-muted mb-6 leading-relaxed">
          Standard sequential courses and exercises. You can earn credits here or directly within the 3D City simulation!
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/game"
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-bgap-cyan to-bgap-emerald text-bgap-dark font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-neon-cyan"
          >
            <Play className="w-4 h-4 fill-current" />
            Enter 3D Open World
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
