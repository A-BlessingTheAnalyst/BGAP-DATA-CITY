'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, Play } from 'lucide-react';

// Fixed white header in BGAP's own style (bgap-academy BGAPHeader.jsx): the BGAP logo lockup on
// the left, text links in the middle, sign in and the primary action on the right.

const LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'The city', href: '#the-city' },
  { label: 'Skills', href: '#skills' },
  { label: 'Play anywhere', href: '#play-anywhere' },
  { label: 'BGAP Academy', href: 'https://bgap.app' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); };
    window.addEventListener('resize', onResize);
    return () => { document.body.style.overflow = ''; window.removeEventListener('resize', onResize); };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#EBE6DF] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-4 px-5 sm:px-8 lg:px-14 py-2.5">
        <Link href="/" aria-label="BGAP Data City home" className="flex items-center gap-2.5 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/bgap-logo-blue.png" alt="BGAP" className="h-[42px] w-auto" />
          <span className="hidden sm:inline-block h-6 w-px bg-[#EBE6DF]" />
          <span className="hidden sm:inline text-[13px] font-extrabold tracking-wide text-[#0f172a]">Data City</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1.5">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="px-3 py-2 rounded-md text-[14px] font-semibold text-[#475569] hover:text-[#1d4ed8] hover:bg-[#1d4ed8]/5 transition">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex px-4 py-2 rounded-md text-[14px] font-bold text-[#0f172a] hover:text-[#1d4ed8] transition">Sign in</Link>
          <Link href="/game" className="bgap-btn-primary text-[14px] px-4 sm:px-5 py-2.5">
            <Play className="w-4 h-4 fill-white" /> Play now
          </Link>
          <button onClick={() => setOpen((v) => !v)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} className="lg:hidden w-10 h-10 rounded-md border border-[#EBE6DF] flex items-center justify-center text-[#0f172a]">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[#EBE6DF] bg-white px-5 pb-6 pt-2 h-[calc(100dvh-62px)] overflow-y-auto">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block py-3.5 border-b border-[#F1EDE7] text-[16px] font-bold text-[#0f172a]">
              {l.label}
            </a>
          ))}
          <div className="grid gap-2.5 mt-6">
            <Link href="/game" className="bgap-btn-primary text-[15px] py-3"><Play className="w-4 h-4 fill-white" /> Play Data City</Link>
            <Link href="/login" className="bgap-btn-secondary text-[15px] py-3">Sign in with your BGAP account</Link>
          </div>
        </div>
      )}
    </header>
  );
}
