import Link from 'next/link';
import { Play, Compass, Award, Database, Terminal, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bgap-dark text-bgap-text flex flex-col justify-between p-8 relative overflow-hidden">
      {/* Background Cyber Glow Gradients */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-bgap-cyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-bgap-emerald/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bgap-cyan to-bgap-emerald flex items-center justify-center font-bold text-bgap-dark text-lg shadow-neon-cyan">
            B
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-wider text-bgap-text">BGAP DATA CITY</div>
            <div className="text-xs text-bgap-muted font-mono">Real-time 3D Analytics Career Simulator</div>
          </div>
        </div>

        <nav className="flex items-center gap-4 text-xs font-semibold">
          <Link href="/dashboard" className="px-4 py-2 rounded-xl text-bgap-muted hover:text-bgap-text hover:bg-bgap-card transition">
            Platform Dashboard
          </Link>
          <Link href="/learn" className="px-4 py-2 rounded-xl text-bgap-muted hover:text-bgap-text hover:bg-bgap-card transition">
            Curriculum
          </Link>
          <Link href="/admin/game" className="px-4 py-2 rounded-xl text-bgap-muted hover:text-bgap-text hover:bg-bgap-card transition">
            Mission Studio
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto my-auto text-center z-10 py-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bgap-surface border border-bgap-border text-bgap-cyan text-xs font-mono font-semibold mb-6 shadow-hud-glass">
          <span className="w-2 h-2 rounded-full bg-bgap-cyan animate-ping" />
          <span>CHAPTER 01 AVAILABLE NOW • THE CAFÉ REVENUE MYSTERY</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Master Data Analytics <br />
          <span className="bg-gradient-to-r from-bgap-cyan via-bgap-neon to-bgap-emerald bg-clip-text text-transparent">
            Inside an Open 3D Metropolis
          </span>
        </h1>

        <p className="text-lg text-bgap-muted max-w-2xl mx-auto leading-relaxed mb-8">
          Step into BGAP City as a trainee data analyst. Meet business owners, uncover real transaction discrepancies in DuckDB workstations, and earn authoritative industry credentials.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/game"
            className="h-14 px-8 rounded-2xl bg-gradient-to-r from-bgap-cyan to-bgap-neon text-bgap-dark font-extrabold text-base flex items-center gap-3 shadow-neon-cyan hover:scale-105 active:scale-95 transition"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>ENTER 3D WORLD</span>
          </Link>
          <Link
            href="/game/missions"
            className="h-14 px-8 rounded-2xl bg-bgap-surface border border-bgap-border text-bgap-text font-bold text-base flex items-center gap-3 hover:bg-bgap-card transition"
          >
            <Compass className="w-5 h-5 text-bgap-gold" />
            <span>Missions Catalog</span>
          </Link>
          <Link
            href="/game/profile"
            className="h-14 px-8 rounded-2xl bg-bgap-surface border border-bgap-border text-bgap-text font-bold text-base flex items-center gap-3 hover:bg-bgap-card transition"
          >
            <Award className="w-5 h-5 text-bgap-emerald" />
            <span>Career Profile</span>
          </Link>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 z-10">
        <div className="p-6 rounded-2xl bg-bgap-surface/80 border border-bgap-border backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-bgap-cyan/10 border border-bgap-cyan/30 flex items-center justify-center mb-4">
            <Terminal className="w-5 h-5 text-bgap-cyan" />
          </div>
          <h3 className="font-bold text-base text-bgap-text mb-2">Real Browser SQL Engine</h3>
          <p className="text-xs text-bgap-muted leading-relaxed">
            Execute SQL with Monaco and DuckDB-Wasm off the main thread with zero latency on client devices.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-bgap-surface/80 border border-bgap-border backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-bgap-emerald/10 border border-bgap-emerald/30 flex items-center justify-center mb-4">
            <Shield className="w-5 h-5 text-bgap-emerald" />
          </div>
          <h3 className="font-bold text-base text-bgap-text mb-2">Authoritative Backend Grading</h3>
          <p className="text-xs text-bgap-muted leading-relaxed">
            Anti-tamper grading compares player outputs with hidden fixtures and analytical rubrics for genuine mastery.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-bgap-surface/80 border border-bgap-border backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-bgap-gold/10 border border-bgap-gold/30 flex items-center justify-center mb-4">
            <Database className="w-5 h-5 text-bgap-gold" />
          </div>
          <h3 className="font-bold text-base text-bgap-text mb-2">Shared BGAP Credentials</h3>
          <p className="text-xs text-bgap-muted leading-relaxed">
            One single account for standard courses and the 3D game. XP and skill mastery sync seamlessly.
          </p>
        </div>
      </div>
    </main>
  );
}
