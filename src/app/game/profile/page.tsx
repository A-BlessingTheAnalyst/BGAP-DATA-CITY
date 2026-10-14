import Link from 'next/link';
import { ArrowLeft, Award, Shield, Database, Coins, Trophy } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/formatting';

export default function ProfilePage() {
  const profile = {
    username: 'BlessingTheAnalyst',
    careerRank: 'Junior Data Analyst',
    level: 2,
    xp: 350,
    nextXp: 500,
    credits: 1200,
    reputation: 84,
  };

  const skills = [
    { name: 'SQL Querying & Filtering', score: 92, category: 'SQL' },
    { name: 'Aggregation & Grouping', score: 78, category: 'SQL' },
    { name: 'Financial Reconciliation', score: 85, category: 'Business' },
    { name: 'Table Joins & Schema Relations', score: 45, category: 'SQL' },
  ];

  return (
    <main className="min-h-screen bg-bgap-dark text-bgap-text p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-bgap-border">
        <Link
          href="/game"
          className="flex items-center gap-2 text-xs font-mono text-bgap-muted hover:text-bgap-cyan transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO 3D CITY</span>
        </Link>
        <span className="text-xs font-mono text-bgap-cyan uppercase font-bold">Cadet Profile</span>
      </div>

      {/* Profile Overview Card */}
      <div className="p-8 rounded-3xl bg-bgap-surface border border-bgap-border shadow-hud-glass mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-bgap-cyan to-bgap-emerald flex items-center justify-center text-3xl font-extrabold text-bgap-dark shadow-neon-cyan">
            BA
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-bgap-text">{profile.username}</h1>
              <span className="px-2 py-0.5 rounded bg-bgap-emerald/20 text-bgap-emerald font-mono text-xs font-bold">
                LVL {profile.level}
              </span>
            </div>
            <p className="text-sm text-bgap-muted">{profile.careerRank}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-bgap-muted font-mono mb-1">CREDITS</div>
            <div className="text-xl font-bold font-mono text-bgap-gold flex items-center gap-1">
              <Coins className="w-4 h-4" />
              {profile.credits}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-bgap-muted font-mono mb-1">REPUTATION</div>
            <div className="text-xl font-bold font-mono text-bgap-cyan flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              {profile.reputation}%
            </div>
          </div>
        </div>
      </div>

      {/* Skill Mastery Radar Grid */}
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Database className="w-5 h-5 text-bgap-cyan" />
        Verified Skill Mastery
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {skills.map((s) => (
          <div key={s.name} className="p-5 rounded-2xl bg-bgap-surface border border-bgap-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-bgap-text">{s.name}</span>
              <span className="text-xs font-mono font-bold text-bgap-cyan">{s.score}%</span>
            </div>
            <div className="w-full bg-bgap-card h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-bgap-cyan to-bgap-emerald h-full rounded-full transition-all duration-500"
                style={{ width: `${s.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-bgap-gold" />
        Unlocked Certifications & Badges
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-bgap-surface border border-bgap-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-bgap-gold/10 border border-bgap-gold/30 flex items-center justify-center text-xl">
            ☕🔍
          </div>
          <div>
            <h4 className="text-sm font-bold text-bgap-text">Café Data Sleuth</h4>
            <p className="text-xs text-bgap-muted">Chapter 01 Complete</p>
          </div>
        </div>
      </div>
    </main>
  );
}
