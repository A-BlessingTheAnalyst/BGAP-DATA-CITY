import Link from 'next/link';
import { headers } from 'next/headers';
import { ArrowLeft, Briefcase, CheckCircle2, Laptop, MapPin, Play } from 'lucide-react';
import { listMissions } from '@/server/content/missions';
import { getWallet } from '@/server/economy/wallet';
import { SessionValidator } from '@/server/game/SessionValidator';

export const dynamic = 'force-dynamic';

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;
const DISTRICT: Record<string, string> = { market: 'Market Boulevard', finance: 'Finance Row', tech: 'Tech Park', gardens: 'Ilé Gardens', academy: 'Academy Quarter', gateway: 'City Gateway' };

/** The job board outside the 3D city: story cases and today's gigs, from the same mission files and ledger the game uses. */
export default async function MissionsPage() {
  let completed = new Set<string>();
  let balance: number | null = null;
  try {
    const session = await SessionValidator.validateSession(headers().get('authorization'));
    const wallet = await getWallet(session.userId);
    completed = new Set(wallet.completedMissions);
    balance = wallet.balance;
  } catch {
    // Signed out: show the board without progress.
  }
  const missions = listMissions().map((p) => p.def);
  const groups = [
    { title: 'Clients in the city', items: missions.filter((m) => m.kind === 'story') },
    { title: "Today's side gigs · remote", items: missions.filter((m) => m.kind === 'gig') },
  ];

  return (
    <main className="min-h-screen bg-bgap-dark text-bgap-text p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-bgap-border">
        <Link href="/game" className="flex items-center gap-2 text-xs font-mono text-bgap-muted hover:text-bgap-cyan transition">
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO THE CITY</span>
        </Link>
        <span className="text-xs font-mono text-bgap-gold">{balance === null ? '' : naira(balance)}</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Job board</h1>
        <p className="text-sm text-bgap-muted">
          Clients pay for answers they can trust. Every job is graded on hidden data; each client pays once. {completed.size} done so far.
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.title} className="mb-10">
          <h2 className="text-xs font-mono uppercase tracking-wider text-bgap-muted mb-3">{g.title}</h2>
          <div className="space-y-3">
            {g.items.map((m) => {
              const done = completed.has(m.id);
              return (
                <div key={m.id} className={`p-5 rounded-2xl border ${done ? 'bg-bgap-surface/50 border-bgap-border/60' : 'bg-bgap-surface border-bgap-border'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-bgap-card text-bgap-cyan border border-bgap-border font-bold">T{m.tier}</span>
                      <h3 className="text-base font-bold">{m.title}</h3>
                    </div>
                    <span className="text-xs font-mono text-bgap-gold font-bold">{naira(m.pay)} · {m.skill}</span>
                  </div>
                  <p className="text-xs text-bgap-muted mb-1">{m.client.name} · {m.client.business}</p>
                  <p className="text-sm text-bgap-text/90 mb-4 leading-relaxed max-w-3xl">{m.summary}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-bgap-border/60 text-xs">
                    <span className="flex items-center gap-1.5 text-bgap-muted">
                      {m.location.remote ? <Laptop className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                      {m.location.remote ? 'Remote: open it from the DataPhone' : `In person: ${DISTRICT[m.location.district] ?? m.location.district}`}
                    </span>
                    {done ? (
                      <span className="flex items-center gap-1.5 text-bgap-emerald font-semibold"><CheckCircle2 className="w-4 h-4" />Paid</span>
                    ) : (
                      <Link href="/game" className="px-4 py-2 rounded-xl bg-bgap-cyan text-bgap-dark font-bold flex items-center gap-1.5 hover:opacity-90">
                        <Play className="w-3.5 h-3.5 fill-current" />Go to the city
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
            {!g.items.length && <p className="text-sm text-bgap-muted flex items-center gap-2"><Briefcase className="w-4 h-4" />Nothing posted right now.</p>}
          </div>
        </section>
      ))}
    </main>
  );
}
