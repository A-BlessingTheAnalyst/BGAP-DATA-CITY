import Link from 'next/link';
import { Target, Play, Award, Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { CAFE_MISSION } from '@/features/game/missions/chapter1-cafe/CafeMissionDefinition';

export default function MissionsPage() {
  const missions = [
    {
      ...CAFE_MISSION,
      status: 'active',
    },
    {
      id: 'ch2_supply_chain_leakage',
      chapter: 2,
      title: 'The Supply Chain Anomaly',
      briefing:
        'Meridian Logistics reports missing shipping containers. Perform table joins across transit logs and depot receipts.',
      primarySkill: 'SQL Joins',
      difficulty: 'Intermediate',
      estimatedMinutes: 20,
      rewards: { xp: 300, credits: 1000 },
      status: 'locked',
    },
    {
      id: 'ch3_executive_forecasting',
      chapter: 3,
      title: 'Executive Boardroom Forecast',
      briefing:
        'Predict fourth-quarter retail branch revenues under promotional discount scenarios for executive leadership.',
      primarySkill: 'Excel & Python',
      difficulty: 'Advanced',
      estimatedMinutes: 30,
      rewards: { xp: 500, credits: 2000 },
      status: 'locked',
    },
  ];

  return (
    <main className="min-h-screen bg-bgap-dark text-bgap-text p-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-bgap-border">
        <Link
          href="/game"
          className="flex items-center gap-2 text-xs font-mono text-bgap-muted hover:text-bgap-cyan transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO 3D CITY</span>
        </Link>
        <span className="text-xs font-mono text-bgap-cyan uppercase font-bold">Missions Central</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Available Operations & Cases</h1>
        <p className="text-sm text-bgap-muted">
          Each mission puts you in the shoes of a real analyst solving high-impact problems across BGAP City.
        </p>
      </div>

      {/* Mission Cards */}
      <div className="space-y-4">
        {missions.map((m) => {
          const isLocked = m.status === 'locked';

          return (
            <div
              key={m.id}
              className={`p-6 rounded-2xl border transition-all ${
                isLocked
                  ? 'bg-bgap-surface/40 border-bgap-border/60 opacity-60'
                  : 'bg-bgap-surface border-bgap-border hover:border-bgap-cyan/60 shadow-hud-glass'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-bgap-card text-bgap-cyan border border-bgap-border font-bold">
                    Chapter 0{m.chapter}
                  </span>
                  <h3 className="text-lg font-bold text-bgap-text">{m.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-bgap-muted">
                    <Clock className="w-3.5 h-3.5" />
                    {m.estimatedMinutes} mins
                  </span>
                  <span className="px-2 py-0.5 rounded bg-bgap-card text-bgap-gold border border-bgap-border font-bold">
                    {m.difficulty}
                  </span>
                </div>
              </div>

              <p className="text-xs text-bgap-muted mb-6 leading-relaxed max-w-2xl">{m.briefing}</p>

              <div className="flex items-center justify-between pt-4 border-t border-bgap-border/60">
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-bgap-cyan font-bold">Skill: {m.primarySkill}</span>
                  <span className="text-bgap-emerald font-bold">+{m.rewards.xp} XP</span>
                  <span className="text-bgap-gold font-bold">+{m.rewards.credits} Credits</span>
                </div>

                {isLocked ? (
                  <span className="text-xs font-mono text-bgap-muted px-4 py-2 rounded-xl bg-bgap-card border border-bgap-border">
                    LOCKED
                  </span>
                ) : (
                  <Link
                    href="/game"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-bgap-cyan to-bgap-neon text-bgap-dark font-extrabold text-xs flex items-center gap-2 hover:opacity-90 shadow-neon-cyan transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>LAUNCH OPERATION</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
