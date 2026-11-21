import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight, Play, Users, Database, Wallet, Car, Map, Smartphone, Keyboard, RotateCw, ShieldCheck,
  Target, LineChart, FileSpreadsheet, Code2, CheckCircle2, Building2, Sparkles,
} from 'lucide-react';
import { BGAPFooter } from './components/BGAPFooter';
import { SiteHeader } from './components/SiteHeader';

// Data City landing page, in BGAP's own visual language (bgap-academy LandingPageClient.js):
// Plus Jakarta Sans, a warm #FAF8F5 hero, white and #111827 alternating sections, small blue
// uppercase eyebrows, clamp() headings with tight tracking, 6px radius brand buttons.
// Every image is a real capture of the game (public/landing). Copy uses no en or em dashes.

export const metadata: Metadata = {
  title: 'BGAP Data City | Learn data analytics inside a living 3D city',
  description: 'Walk, drive and work your way through a 3D African city. Meet business owners, query their real data with SQL and Python, and earn XP on your BGAP account.',
  openGraph: { images: ['/landing/city.jpg'] },
};

const eyebrow = 'text-[13px] font-extrabold text-[#1d4ed8] uppercase tracking-[1px] mb-2';
const h2 = 'text-[clamp(26px,3.5vw,42px)] font-extrabold tracking-[-1px] text-[#0f172a] leading-[1.15] m-0 mb-3';
const lead = 'text-[15.5px] text-[#64748b] leading-relaxed';
const pad = 'px-5 sm:px-8 lg:px-14';

function Shot({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-[#EBE6DF] bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="block w-full h-full object-cover" />
    </div>
  );
}

const STEPS = [
  { icon: Users, title: 'Meet a client', text: 'Walk up to a café owner, a fintech founder or a school head. Each one has a real business problem and a hunch that might be wrong.', img: '/landing/street.jpg', alt: 'A cadet walking along Market Boulevard past a POS kiosk' },
  { icon: Database, title: 'Work the data', text: 'Open the analyst terminal and query their tables with SQL or Python. Find the field evidence around the city that backs your findings.', img: '/landing/hud.jpg', alt: 'The in-game view with minimap and the tracked case' },
  { icon: Wallet, title: 'Get paid and rank up', text: 'Answers are graded against hidden data, not your typing. Correct work pays naira, earns XP and raises your reputation in that district.', img: '/landing/market.jpg', alt: 'A market street corner with a kiosk and traffic lights' },
];

const DISTRICTS = [
  { name: 'Market Boulevard', text: 'Cafés, POS kiosks and market stalls. Where most first cases start.' },
  { name: 'Finance Row', text: 'Banks and towers with money questions that need careful denominators.' },
  { name: 'Tech Park', text: 'Startups measuring growth, churn and the metrics that hide them.' },
  { name: 'Academy Quarter', text: 'Schools and training centres judging results the honest way.' },
  { name: 'Ilé Gardens', text: 'Quiet homes and small businesses. A good place for a drive.' },
  { name: 'City Gateway', text: 'Logistics, transport and the routes that keep the city moving.' },
];

const SKILLS = [
  { icon: Database, title: 'SQL', text: 'A real database runs in your browser. Joins, grouping, rates and windows on the client’s own tables.' },
  { icon: Code2, title: 'Python', text: 'Clean and analyse with pandas. Your code and the reference both run on hidden test data.' },
  { icon: FileSpreadsheet, title: 'Spreadsheets', text: 'Spreadsheet cases open in the BGAP Workspace with the data loaded and tasks checked automatically.' },
  { icon: LineChart, title: 'Analyst judgement', text: 'Every case hides a tempting wrong metric. You learn to spot it before you report it.' },
];

export default function HomePage() {
  return (
    <div className="bg-[#FAF8F5] text-[#0f172a] font-sans">
      <SiteHeader />

      <main className="pt-[62px]">
        {/* ─── Hero ─── */}
        <section className="w-full bg-[#FAF8F5] border-b border-[#EBE6DF]">
          <div className={`${pad} pt-[clamp(40px,5vw,64px)] text-center`}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#EBE6DF] text-[12.5px] font-bold text-[#1d4ed8] mb-5">
              <Sparkles className="w-3.5 h-3.5" /> New from BGAP: Data City
            </div>
            <h1 className="text-[clamp(30px,5.2vw,64px)] font-extrabold tracking-[-1.5px] leading-[1.12] max-w-[980px] mx-auto mb-4">
              Learn data analytics by working in a city that <span className="text-[#1d4ed8] font-black">runs on data</span>
            </h1>
            <p className="text-[clamp(15px,1.8vw,18px)] text-[#64748b] font-medium max-w-[680px] mx-auto mb-7 leading-relaxed">
              Walk the streets, drive across districts and take on real cases from local businesses. Solve them with SQL, Python and spreadsheets, and every win counts on your BGAP account.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <Link href="/game" className="bgap-btn-primary text-[15px] px-8 py-3.5"><Play className="w-4 h-4 fill-white" /> Play Data City free</Link>
              <a href="#how-it-works" className="bgap-btn-secondary text-[15px] px-6 py-3.5">See how it works <ArrowRight className="w-4 h-4" /></a>
            </div>

            {/* Hero visual: the city from above, with the in-game view and the phone layout overlapping. */}
            <div className="relative max-w-[1140px] mx-auto pb-[clamp(36px,6vw,72px)]">
              <Shot src="/landing/city.jpg" alt="Aerial view of Data City with its districts, towers and homes" className="aspect-[16/9]" />
              <div className="hidden md:block absolute -left-6 lg:-left-10 bottom-6 w-[34%] rotate-[-2deg]">
                <Shot src="/landing/hud.jpg" alt="Playing on desktop with the minimap and case tracker" className="aspect-[16/9]" />
              </div>
              <div className="hidden md:block absolute -right-4 lg:-right-8 bottom-10 w-[36%] rotate-[2deg]">
                <Shot src="/landing/mobile.jpg" alt="Driving on a phone in landscape with the steering stick and pedals" className="aspect-[2/1]" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Facts strip ─── */}
        <section className="w-full bg-white border-b border-[#EBE6DF]">
          <div className={`${pad} py-7 grid grid-cols-2 md:grid-cols-4 gap-6 text-center`}>
            {[
              ['6', 'districts to explore'],
              ['3', 'skills: SQL, Python, spreadsheets'],
              ['1', 'BGAP account for everything'],
              ['Free', 'to start playing'],
            ].map(([n, t]) => (
              <div key={t}>
                <div className="text-[clamp(26px,3vw,36px)] font-black text-[#1d4ed8] tracking-[-1px]">{n}</div>
                <div className="text-[13.5px] font-semibold text-[#64748b]">{t}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section id="how-it-works" className="w-full bg-[#FAF8F5] border-b border-[#EBE6DF] scroll-mt-20">
          <div className={`${pad} py-[clamp(48px,6vw,80px)]`}>
            <div className="text-center mb-10">
              <div className={eyebrow}>How it works</div>
              <h2 className={h2}>Real cases. Real data. Real pay.</h2>
              <p className={`${lead} max-w-[620px] mx-auto`}>Data City is a career, not a quiz. You build a reputation one client at a time, the way analysts do.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3 max-w-[1200px] mx-auto">
              {STEPS.map((s, i) => (
                <div key={s.title} className="bg-white border border-[#EBE6DF] rounded-xl overflow-hidden flex flex-col">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.img} alt={s.alt} loading="lazy" className="w-full aspect-[16/10] object-cover" />
                  <div className="p-6">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <span className="w-8 h-8 rounded-md bg-[#1d4ed8]/10 text-[#1d4ed8] flex items-center justify-center"><s.icon className="w-4 h-4" /></span>
                      <span className="text-[12px] font-extrabold text-[#94a3b8]">STEP {i + 1}</span>
                    </div>
                    <h3 className="text-[18px] font-extrabold mb-1.5">{s.title}</h3>
                    <p className="text-[14px] text-[#64748b] leading-relaxed m-0">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── The city ─── */}
        <section id="the-city" className="w-full bg-white border-b border-[#EBE6DF] scroll-mt-20">
          <div className={`${pad} py-[clamp(48px,6vw,80px)]`}>
            <div className="grid gap-10 lg:grid-cols-2 items-center max-w-[1200px] mx-auto">
              <div>
                <div className={eyebrow}>The city</div>
                <h2 className={h2}>Six districts, each with its own kind of problem</h2>
                <p className={`${lead} mb-6`}>A living city with traffic lights, danfos, okadas and people going about their day. Walk it, or take the wheel and drive it.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {DISTRICTS.map((d) => (
                    <div key={d.name} className="p-4 rounded-lg border border-[#EBE6DF] bg-[#FAF8F5]">
                      <div className="flex items-center gap-2 font-extrabold text-[14.5px] mb-1"><Building2 className="w-4 h-4 text-[#1d4ed8]" />{d.name}</div>
                      <p className="text-[13px] text-[#64748b] leading-snug m-0">{d.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Shot src="/landing/driving.jpg" alt="Driving down a palm lined road at speed" className="col-span-2 aspect-[16/9]" />
                <Shot src="/landing/towers.jpg" alt="Office towers in Tech Park" className="aspect-[4/3]" />
                <Shot src="/landing/street.jpg" alt="People walking along Market Boulevard" className="aspect-[4/3]" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Graded like real work (dark) ─── */}
        <section className="w-full bg-[#111827] border-b border-[#1f2937]">
          <div className={`${pad} py-[clamp(52px,7vw,84px)] text-white`}>
            <div className="grid gap-10 lg:grid-cols-2 items-center max-w-[1200px] mx-auto">
              <div>
                <div className="text-[13px] font-extrabold text-[#38bdf8] uppercase tracking-[1px] mb-3">Graded like real work</div>
                <h2 className="text-[clamp(26px,3.5vw,44px)] font-extrabold tracking-[-1px] leading-[1.2] mb-4">The client does not care how your query looks. Only whether it is right.</h2>
                <p className="text-[14.5px] text-[#94a3b8] leading-[1.7] mb-6">Your answer runs against hidden test data the client never shows you. Copy a pattern without understanding it and the hidden cases catch it. Get it right and you earn the pay, the XP and the trust of that district.</p>
                <Link href="/game" className="bgap-btn-sky text-[14px] px-6 py-3">Take your first case <ArrowRight className="w-4 h-4" /></Link>
              </div>
              <div className="grid gap-3">
                {[
                  { icon: ShieldCheck, t: 'Hidden test data', d: 'Results are compared, not code. No shortcut survives a second dataset.' },
                  { icon: Target, t: 'The tempting wrong metric', d: 'Totals that should be rates. Volume that should be margin. Each case has one.' },
                  { icon: Map, t: 'Evidence in the world', d: 'Some findings need proof you can only pick up by visiting the client.' },
                  { icon: CheckCircle2, t: 'Counts on BGAP', d: 'Passed cases add XP and completed challenges to your BGAP profile.' },
                ].map((x) => (
                  <div key={x.t} className="flex gap-3.5 p-4 rounded-lg bg-white/[0.04] border border-white/10">
                    <x.icon className="w-5 h-5 text-[#38bdf8] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-[15px] mb-0.5">{x.t}</div>
                      <p className="text-[13.5px] text-[#94a3b8] m-0 leading-snug">{x.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Skills ─── */}
        <section id="skills" className="w-full bg-[#FAF8F5] border-b border-[#EBE6DF] scroll-mt-20">
          <div className={`${pad} py-[clamp(48px,6vw,80px)]`}>
            <div className="text-center mb-10">
              <div className={eyebrow}>Skills you practise</div>
              <h2 className={h2}>The tools analysts get hired for</h2>
              <p className={`${lead} max-w-[600px] mx-auto`}>Every case is solved with a real tool, the same ones you will use at work.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-[1200px] mx-auto">
              {SKILLS.map((s) => (
                <div key={s.title} className="p-6 rounded-xl bg-white border border-[#EBE6DF] hover:border-[#1d4ed8]/40 hover:shadow-[0_12px_30px_-16px_rgba(29,78,216,0.35)] transition">
                  <span className="w-10 h-10 rounded-md bg-[#1d4ed8]/10 text-[#1d4ed8] flex items-center justify-center mb-4"><s.icon className="w-5 h-5" /></span>
                  <h3 className="text-[17px] font-extrabold mb-1.5">{s.title}</h3>
                  <p className="text-[13.5px] text-[#64748b] leading-relaxed m-0">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Play anywhere ─── */}
        <section id="play-anywhere" className="w-full bg-white border-b border-[#EBE6DF] scroll-mt-20">
          <div className={`${pad} py-[clamp(48px,6vw,80px)]`}>
            <div className="grid gap-10 lg:grid-cols-2 items-center max-w-[1200px] mx-auto">
              <Shot src="/landing/mobile.jpg" alt="Data City on a phone in landscape, driving with on screen pedals" className="aspect-[2/1] order-2 lg:order-1" />
              <div className="order-1 lg:order-2">
                <div className={eyebrow}>Play anywhere</div>
                <h2 className={h2}>Built for your laptop and your phone</h2>
                <p className={`${lead} mb-6`}>On a computer you use your keyboard and mouse. On a phone the game turns sideways and gives you controls made for thumbs.</p>
                <ul className="grid gap-3 list-none p-0 m-0">
                  {[
                    { icon: RotateCw, t: 'Landscape play', d: 'Fullscreen in landscape with one tap, so the city gets the whole screen.' },
                    { icon: Car, t: 'Touch driving', d: 'A steering stick, gas and brake pedals, handbrake and boost.' },
                    { icon: Keyboard, t: 'Its own keyboard', d: 'Type SQL with keyword keys and your case’s table names, no phone keyboard in the way.' },
                    { icon: Smartphone, t: 'A clean screen', d: 'Just the map and short tips. Hide everything else with one button.' },
                  ].map((x) => (
                    <li key={x.t} className="flex gap-3">
                      <span className="w-9 h-9 rounded-md bg-[#1d4ed8]/10 text-[#1d4ed8] flex items-center justify-center shrink-0"><x.icon className="w-4 h-4" /></span>
                      <div>
                        <div className="font-extrabold text-[15px]">{x.t}</div>
                        <p className="text-[13.5px] text-[#64748b] m-0 leading-snug">{x.d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Call to action ─── */}
        <section className="w-full bg-[#1d4ed8]">
          <div className={`${pad} py-[clamp(48px,6vw,72px)] text-center text-white`}>
            <h2 className="text-[clamp(26px,3.5vw,40px)] font-extrabold tracking-[-1px] mb-3">Your first client is waiting on Market Boulevard</h2>
            <p className="text-[15.5px] text-white/80 max-w-[560px] mx-auto mb-7">Sign in with Google or your BGAP account and step into the city. It is free to start.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/game" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-white text-[#1d4ed8] font-extrabold text-[15px] hover:-translate-y-0.5 transition"><Play className="w-4 h-4 fill-[#1d4ed8]" /> Play Data City</Link>
              <Link href="https://bgap.app" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md border border-white/40 text-white font-bold text-[15px] hover:bg-white/10 transition">Explore BGAP Academy <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>
        </section>
      </main>

      <BGAPFooter />
    </div>
  );
}
