import Link from 'next/link';

// Shared with the main BGAP platform (owner feedback 19 Nov 2026, masterprompt.md §15.6):
// matches bgap-academy/frontend/app/components/BGAPFooter.jsx's layout and copy, rebuilt as a
// plain Tailwind component against this repo's own bgap-* tokens (no framer-motion dependency
// here, and the brand mark is copied locally at public/brand/ rather than imported across repos).
// Links that don't exist in this app (pricing, login, about, …) point at the real bgap.app site
// rather than this app's own routes — a straight copy of the original component would have sent
// them to this app's own non-existent pages instead.
const BGAP_URL = 'https://bgap.app';

const LINK_CLASS = 'text-[13.5px] text-bgap-muted hover:text-bgap-text transition';

export function BGAPFooter() {
  return (
    <footer className="w-full border-t border-bgap-border bg-bgap-dark">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-7">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-9">
          <div className="col-span-2">
            <Link href={BGAP_URL} aria-label="BGAP Home" className="inline-flex items-center mb-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/bgap-logo-blue.png" alt="BGAP" className="h-10 w-auto" />
            </Link>
            <p className="text-[13.5px] text-bgap-muted leading-relaxed max-w-sm mb-3.5">
              Where data skills become business instincts. Data City is BGAP's 3D career simulator — the same account, the same XP, a different way in.
            </p>
            <div className="text-xs text-bgap-muted/70">BGAP · A product of Aidlearn Analytics Limited · Built for Africa</div>
          </div>

          <div>
            <div className="text-[13.5px] font-extrabold text-bgap-text mb-3.5">Platform</div>
            <ul className="space-y-2.5 list-none p-0 m-0">
              <li><Link href={`${BGAP_URL}/#features`} className={LINK_CLASS}>Features</Link></li>
              <li><Link href={`${BGAP_URL}/pricing`} className={LINK_CLASS}>Pricing</Link></li>
              <li><Link href={`${BGAP_URL}/for-teams`} className={LINK_CLASS}>For Teams</Link></li>
              <li><Link href={`${BGAP_URL}/blog`} className={LINK_CLASS}>Blog</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-[13.5px] font-extrabold text-bgap-text mb-3.5">Join</div>
            <ul className="space-y-2.5 list-none p-0 m-0">
              <li><Link href={`${BGAP_URL}/login`} className={LINK_CLASS}>Start learning</Link></li>
              <li><Link href="/game" className={LINK_CLASS}>Play Data City</Link></li>
              <li><Link href={`${BGAP_URL}/become-instructor`} className={LINK_CLASS}>Teach on BGAP</Link></li>
              <li><a href="mailto:hello@bgap.app" className={LINK_CLASS}>Contact</a></li>
            </ul>
          </div>

          <div>
            <div className="text-[13.5px] font-extrabold text-bgap-text mb-3.5">Company</div>
            <ul className="space-y-2.5 list-none p-0 m-0">
              <li><Link href={`${BGAP_URL}/about`} className={LINK_CLASS}>About</Link></li>
              <li><Link href={`${BGAP_URL}/privacy`} className={LINK_CLASS}>Privacy Policy</Link></li>
              <li><Link href={`${BGAP_URL}/privacy`} className={LINK_CLASS}>Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-5 border-t border-bgap-border flex flex-wrap items-center justify-between gap-3.5 text-xs text-bgap-muted">
          <div>© {new Date().getFullYear()} BGAP · Aidlearn Analytics Limited. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href={`${BGAP_URL}/privacy`} className="hover:text-bgap-text transition">Privacy</Link>
            <Link href={`${BGAP_URL}/pricing`} className="hover:text-bgap-text transition">Pricing</Link>
            <Link href={`${BGAP_URL}/login`} className="hover:text-bgap-text transition">Sign In</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
