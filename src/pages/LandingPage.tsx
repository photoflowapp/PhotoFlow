import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Lock, Check, Leaf } from 'lucide-react';
import { PhotoFlowLogo } from '../components/PhotoFlowLogo';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';

type WorkflowTab = 'glance' | 'pipeline' | 'vault';

const WORKFLOW_PREVIEWS: Record<
  WorkflowTab,
  {
    headline: string;
    description: string;
    detailLeftTitle: string;
    detailLeftBody: string;
    detailRightTitle: string;
    detailRightBody: string;
  }
> = {
  glance: {
    headline: 'Every financial figure and urgent deliverable in one calm view.',
    description:
      'Open PhotoFlow between location scouts and immediately see cleared studio revenue, outstanding client balances, overdue gallery deliveries, and upcoming shoot dates without digging through folders.',
    detailLeftTitle: 'Live financial clarity',
    detailLeftBody:
      'Track retainers, partial deposits, and final gallery invoices across every client project with automatic balance calculation in your studio currency.',
    detailRightTitle: 'Direct action routing',
    detailRightBody:
      'Jump straight from Needs Attention items to your studio task list, or from Upcoming Shoots directly into your production calendar.',
  },
  pipeline: {
    headline: 'Move commissions smoothly from first inquiry to archived delivery.',
    description:
      'Every photography project progresses through a structured studio workflow—Inquiry, Quoted, Booked, Shooting, In Editing, and Delivered—keeping client contacts, package pricing, and shoot notes unified.',
    detailLeftTitle: 'Unified client context',
    detailLeftBody:
      'Client contact details are created automatically inside each project with one-click copy for emails and phone numbers on desktop and mobile.',
    detailRightTitle: 'Automated studio checklists',
    detailRightBody:
      'Optionally generate preparation, gear check, culling, editing, and gallery delivery tasks the moment a new project is created.',
  },
  vault: {
    headline: 'Client-side AES-256 encryption before a single byte leaves your device.',
    description:
      'Your client roster, contract pricing, private location notes, and financial records are encrypted locally in your browser using Web Crypto AES-GCM keys derived from your personal passphrase.',
    detailLeftTitle: 'Zero-knowledge cloud sync',
    detailLeftBody:
      'Encrypted datasets sync automatically to your isolated private cloud bucket, unreadable to third parties or storage servers.',
    detailRightTitle: 'Instant workspace lock',
    detailRightBody:
      'Lock your studio workspace with a single click when handing a tablet to a client or stepping away from your tethering station.',
  },
};

const IPhoneFrameMockup: React.FC<{
  className?: string;
  variant?: 'hero' | 'showcase';
}> = ({ className = '', variant = 'showcase' }) => {
  const isHero = variant === 'hero';

  return (
    <div className={`relative select-none ${className}`}>
      {/* Left Side Hardware Buttons (Action + Volume Up/Down) */}
      <div
        className={`absolute top-[14%] h-[5%] bg-[#262626] rounded-l-sm ${
          isHero
            ? '-left-[1px] sm:-left-[2px] lg:-left-[3px] w-[1px] sm:w-[2px] lg:w-[3px]'
            : '-left-[2px] sm:-left-[3px] w-[2px] sm:w-[3px]'
        }`}
      />
      <div
        className={`absolute top-[22%] h-[8%] bg-[#262626] rounded-l-sm ${
          isHero
            ? '-left-[1px] sm:-left-[2px] lg:-left-[3px] w-[1px] sm:w-[2px] lg:w-[3px]'
            : '-left-[2px] sm:-left-[3px] w-[2px] sm:w-[3px]'
        }`}
      />
      <div
        className={`absolute top-[32%] h-[8%] bg-[#262626] rounded-l-sm ${
          isHero
            ? '-left-[1px] sm:-left-[2px] lg:-left-[3px] w-[1px] sm:w-[2px] lg:w-[3px]'
            : '-left-[2px] sm:-left-[3px] w-[2px] sm:w-[3px]'
        }`}
      />
      {/* Right Side Hardware Power Button */}
      <div
        className={`absolute top-[25%] h-[11%] bg-[#262626] rounded-r-sm ${
          isHero
            ? '-right-[1px] sm:-right-[2px] lg:-right-[3px] w-[1px] sm:w-[2px] lg:w-[3px]'
            : '-right-[2px] sm:-right-[3px] w-[2px] sm:w-[3px]'
        }`}
      />

      {/* Outer Titanium / Midnight Bezel */}
      <div
        className={`bg-[#141414] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.28)] ring-1 ring-black/15 ${
          isHero
            ? 'rounded-[10px] sm:rounded-[20px] md:rounded-[30px] lg:rounded-[40px] p-[2.5px] sm:p-[5px] md:p-[7px] lg:p-[9px]'
            : 'rounded-[32px] sm:rounded-[42px] lg:rounded-[48px] p-[6px] sm:p-[8px] lg:p-[10px]'
        }`}
      >
        {/* Inner OLED Screen Container */}
        <div
          className={`relative overflow-hidden bg-white ${
            isHero
              ? 'rounded-[8px] sm:rounded-[16px] md:rounded-[24px] lg:rounded-[32px]'
              : 'rounded-[26px] sm:rounded-[34px] lg:rounded-[39px]'
          }`}
        >
          {/* iPhone Top Dynamic Island Header Area */}
          <div
            className={`bg-white flex items-center justify-center relative ${
              isHero
                ? 'pt-[2.5px] pb-[1.5px] sm:pt-1 sm:pb-0.5 md:pt-1.5 md:pb-1 lg:pt-2 lg:pb-1'
                : 'pt-1.5 pb-1 sm:pt-2 sm:pb-1'
            }`}
          >
            <div
              className={`w-[30%] bg-[#0A0A0A] rounded-full flex items-center justify-end ${
                isHero
                  ? 'h-[4px] sm:h-[8px] md:h-[12px] lg:h-[16px] pr-[2px] sm:pr-1 md:pr-1.5'
                  : 'h-[13px] sm:h-[16px] lg:h-[20px] pr-1.5 sm:pr-2'
              }`}
            >
              <span
                className={`rounded-full bg-[#1f2937] ring-1 ring-white/10 ${
                  isHero
                    ? 'w-[2px] h-[2px] sm:w-1 sm:h-1 md:w-1.5 md:h-1.5'
                    : 'w-1.5 h-1.5 sm:w-2 sm:h-2'
                }`}
              />
            </div>
          </div>

          {/* Mobile Dashboard Screen Image */}
          <img
            src="./dashboard-mobile.svg"
            alt="PhotoFlow mobile studio view showing cleared revenue, outstanding balance, upcoming shoots, and attention tasks"
            referrerPolicy="no-referrer"
            className="w-full h-auto block"
          />

          {/* Bottom iOS Home Indicator Bar */}
          <div
            className={`bg-white flex justify-center ${
              isHero
                ? 'pt-[1.5px] pb-[2px] sm:pt-0.5 sm:pb-1 md:pt-1 md:pb-1.5'
                : 'pt-1 pb-1.5 sm:pb-2'
            }`}
          >
            <div
              className={`w-[36%] rounded-full bg-black/85 ${
                isHero
                  ? 'h-[1.5px] sm:h-[2.5px] md:h-[3px] lg:h-1'
                  : 'h-[3px] sm:h-1'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const setShowAuthPage = usePhotoFlowStore((s) => s.setShowAuthPage);
  const [activeTab, setActiveTab] = useState<WorkflowTab>('glance');
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroVisualRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rafId = 0;

    const updateTilt = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      // Smoothly transition from 0 (tilted at top) to 1 (completely straight) over 420px of scroll
      const progress = Math.min(1, Math.max(0, scrollY / 420));
      setScrollProgress(progress);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateTilt);
    };

    updateTilt();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Ease curve so the tilt straightens fluidly and reverses accurately on scroll up
  const eased = 1 - Math.pow(1 - scrollProgress, 2.2);
  // Tilts from the top outwards (rotateX from 24deg -> 0deg as you scroll down)
  const rotateXDeg = (1 - eased) * 24;
  const scaleVal = 0.93 + eased * 0.07;
  const translateYVal = (1 - eased) * 18;

  const handleOpenAuth = () => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setShowAuthPage(true);
  };

  const handleRefreshPage = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.reload();
  };

  const currentPreview = WORKFLOW_PREVIEWS[activeTab];

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
      {/* Top Bar — Strict 3-Zone Contract */}
      <header className="sticky top-0 z-40 h-16 bg-white/90 backdrop-blur-md border-b border-neutral-200/70 px-5 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* Zone 1: Brand Logo + Wordmark (Refreshes the page on click) */}
        <button
          type="button"
          onClick={handleRefreshPage}
          className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight text-black whitespace-nowrap cursor-pointer focus:outline-none"
          title="Refresh PhotoFlow"
        >
          <PhotoFlowLogo className="w-6 h-6 text-black shrink-0" />
          <span>PhotoFlow</span>
        </button>

        {/* Zone 2: Clean Typography Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-600">
          <a
            href="#overview"
            className="hover:text-black transition-colors whitespace-nowrap"
          >
            Overview
          </a>
          <a
            href="#workflow"
            className="hover:text-black transition-colors whitespace-nowrap"
          >
            Workflow
          </a>
          <a
            href="#mobile"
            className="hover:text-black transition-colors whitespace-nowrap"
          >
            Mobile App
          </a>
          <a
            href="#security"
            className="hover:text-black transition-colors whitespace-nowrap"
          >
            Encryption
          </a>
          <a
            href="#membership"
            className="hover:text-black transition-colors whitespace-nowrap"
          >
            Membership
          </a>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleOpenAuth}
            className="text-sm font-medium text-neutral-700 hover:text-black transition-colors whitespace-nowrap cursor-pointer"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={handleOpenAuth}
            className="h-9 px-4 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>Get started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-20 sm:pb-28 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="text-4xl sm:text-5xl lg:text-[60px] font-semibold tracking-[-0.03em] text-black leading-[1.06]"
            style={{ textWrap: 'balance' }}
          >
            The private operating system for photography studios.
          </h1>

          <p
            className="mt-6 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto font-normal"
            style={{ textWrap: 'balance' }}
          >
            Manage client shoots, production pipelines, editing deadlines, and studio billing in one
            quiet workspace—protected end-to-end by client-side AES-256 encryption.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleOpenAuth}
              className="h-11 px-6 rounded-lg bg-black hover:bg-neutral-800 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>Start your workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleOpenAuth}
              className="h-11 px-6 rounded-lg text-sm font-medium text-neutral-700 hover:text-black hover:bg-neutral-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              Sign in to account
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-400">
            <span>Client-side AES-256 encryption</span>
            <span aria-hidden="true">·</span>
            <span>Cross-device cloud sync</span>
            <span aria-hidden="true">·</span>
            <span>8.99€ / month</span>
          </div>
        </div>

        {/* 3D Scroll-Tilted Dashboard + iPhone Showcase with Long Bottom-to-Top White Gradient Fade */}
        <div
          ref={heroVisualRef}
          className="relative mt-12 sm:mt-16 mx-auto max-w-6xl"
          style={{
            perspective: '1500px',
            perspectiveOrigin: 'center top',
          }}
        >
          <div
            className="relative will-change-transform"
            style={{
              transformOrigin: 'center bottom',
              transform: `translateY(${translateYVal.toFixed(2)}px) rotateX(${rotateXDeg.toFixed(
                2
              )}deg) scale(${scaleVal.toFixed(4)})`,
            }}
          >
            {/* Desktop Dashboard Frame */}
            <div
              className="relative z-10 rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden border border-neutral-200/90 bg-white"
              style={{
                boxShadow: `0 ${Math.round(30 - eased * 14)}px ${Math.round(
                  60 - eased * 25
                )}px -15px rgba(0, 0, 0, ${(0.14 - eased * 0.05).toFixed(3)})`,
              }}
            >
              {/* Subtle Browser / Window Top Chrome — Responsive to mobile & desktop */}
              <div className="h-4 sm:h-6 md:h-8 bg-[#f7f7f7] border-b border-neutral-200/80 px-2 sm:px-3 md:px-4 flex items-center justify-between select-none">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-neutral-300" />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-neutral-300" />
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-neutral-300" />
                </div>
                <span className="text-[7px] sm:text-[9px] md:text-[11px] leading-none text-neutral-400 font-mono">
                  PhotoFlow Workspace
                </span>
                <div className="w-5 sm:w-8 md:w-10" />
              </div>

              <img
                src="./dashboard-hero.svg"
                alt="PhotoFlow studio dashboard showing cleared revenue, outstanding balances, tasks needing attention, and upcoming shoots"
                referrerPolicy="no-referrer"
                className="w-full h-auto block select-none"
              />
            </div>

            {/* iPhone View in the Right Corner — Tilted the Exact Same Way as the Computer Image (No Vertical Axis Tilt) */}
            <div className="absolute right-1.5 sm:right-5 lg:right-8 bottom-0 z-20 w-[21%] sm:w-[23%] max-w-[255px]">
              <IPhoneFrameMockup variant="hero" className="w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Editorial Narrative — Studio Intelligence Without Clutter (No Cards, No Numbers) */}
      <section
        id="overview"
        className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-neutral-200/80"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-black leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Designed to be read in a single glance between shoots.
            </h2>
          </div>

          <div className="lg:col-span-7 space-y-10">
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
              Most studio management software buries your day under nested menus, bloated client
              portals, and rigid templates. PhotoFlow strips away visual noise so the four signals
              that actually run your studio—cleared revenue, outstanding invoices, urgent tasks, and
              upcoming shoots—greet you the second you sign in.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 pt-6 border-t border-neutral-200/70">
              <div>
                <h3 className="text-base font-semibold text-black">
                  Immediate financial visibility
                </h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  See exactly what has cleared and what remains outstanding across retainers and
                  final gallery balances, formatted cleanly in your chosen currency.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-black">
                  Actionable attention queue
                </h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Overdue contracts, gear checks, and approaching gallery deliveries surface
                  automatically in your attention stream and route directly to your task view.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-black">
                  Project-first client records
                </h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Never maintain a separate address book again. Client names, emails, and phone
                  numbers live natively inside each shoot with instant one-click copy.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-black">
                  Built for desktop and mobile
                </h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Install PhotoFlow as a standalone app on your workstation, tether laptop, or
                  iPhone for rapid schedule checks on location.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Workflow Architecture (Segmented Text Tabs, No Scrollbar) */}
      <section
        id="workflow"
        className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-neutral-200/80"
      >
        <div className="max-w-3xl">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-black leading-[1.15]"
            style={{ textWrap: 'balance' }}
          >
            Every stage of production, connected seamlessly.
          </h2>
          <p className="mt-4 text-base text-neutral-600 leading-relaxed">
            Explore how PhotoFlow keeps inquiries, shoot days, editing queues, and client billing
            synchronized without manual double-entry.
          </p>
        </div>

        {/* Clean Text-and-Line Tabs — Wrapping with Zero Scrollbar (Monday-first calendar removed) */}
        <div className="mt-10 border-b border-neutral-200 flex flex-wrap items-center gap-x-6 sm:gap-x-8 gap-y-2 no-scrollbar">
          {(
            [
              { id: 'glance', label: 'Studio at a glance' },
              { id: 'pipeline', label: 'Production pipeline' },
              { id: 'vault', label: 'Encrypted vault' },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3.5 -mb-px text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-400 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Open Editorial Tab Content */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-6">
            <h3
              className="text-xl sm:text-2xl font-semibold tracking-tight text-black leading-snug"
              style={{ textWrap: 'balance' }}
            >
              {currentPreview.headline}
            </h3>
            <p className="mt-4 text-sm sm:text-base text-neutral-600 leading-relaxed">
              {currentPreview.description}
            </p>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-8 lg:pt-1">
            <div className="border-l border-neutral-200 pl-5">
              <h4 className="text-sm font-semibold text-black">
                {currentPreview.detailLeftTitle}
              </h4>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                {currentPreview.detailLeftBody}
              </p>
            </div>

            <div className="border-l border-neutral-200 pl-5">
              <h4 className="text-sm font-semibold text-black">
                {currentPreview.detailRightTitle}
              </h4>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                {currentPreview.detailRightBody}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Mobile Studio View in iPhone Frame + Simple Numbered iPhone Safari Setup Steps */}
      <section
        id="mobile"
        className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-neutral-200/80"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: iPhone Hardware Frame with Mobile Studio View */}
          <div className="lg:col-span-5 flex justify-center">
            <IPhoneFrameMockup variant="showcase" className="mx-auto w-[236px] sm:w-[300px] lg:w-[336px]" />
          </div>

          {/* Right Column: Editorial Narrative + Numbered Single-Instruction Steps (No Visuals, No Heading + Detailed Split) */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h2
                className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-black leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Your entire studio in your pocket. Install PhotoFlow as an iPhone app.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed">
                PhotoFlow is engineered as a full-screen mobile web app with bottom-bar navigation,
                instant offline caching, and live encrypted sync. Follow the steps below in Safari
                to add it directly to your iPhone Home Screen—no App Store download required.
              </p>
            </div>

            <ol className="space-y-4 pt-6 border-t border-neutral-200/80 text-sm sm:text-base text-neutral-800">
              <li className="flex items-baseline gap-3">
                <span className="font-semibold text-black tabular-nums">1.</span>
                <span>
                  Open PhotoFlow in Safari on your iPhone, tap the three-dot menu (•••) and tap
                  Share.
                </span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-semibold text-black tabular-nums">2.</span>
                <span>From the bottom of the share menu, tap View More.</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-semibold text-black tabular-nums">3.</span>
                <span>Scroll down until you see Add to Home Screen and tap it.</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-semibold text-black tabular-nums">4.</span>
                <span>Tap Add without adjusting anything.</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Section 4: Zero-Knowledge Security Architecture */}
      <section
        id="security"
        className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-neutral-200/80"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 text-xs text-neutral-500 mb-3">
              <Lock className="w-3.5 h-3.5 text-black" />
              <span>Zero-knowledge architecture</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-black leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Your studio records belong exclusively to you.
            </h2>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
              Unlike conventional cloud CRMs that store your client contracts, shoot addresses, and
              revenue in plaintext databases, PhotoFlow generates a dedicated 256-bit Data
              Encryption Key inside your browser and wraps it with your passphrase via PBKDF2-SHA256.
            </p>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              Every project, task, payment, and studio setting is sealed with AES-GCM authenticated
              encryption before upload. Even in the cloud, your business records exist only as
              encrypted ciphertext envelopes that only your passphrase can unlock.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Membership & Climate Commitment (Open Split Layout, 8.99€ Price) */}
      <section
        id="membership"
        className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-neutral-200/80"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-black leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              One straightforward membership.
            </h2>
            <p className="mt-4 text-base text-neutral-600 leading-relaxed">
              Full access to the entire PhotoFlow studio workspace with no tiered feature gates,
              project caps, or hidden add-ons.
            </p>

            <div className="mt-8 pt-6 border-t border-neutral-200/80 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-black tabular-nums">
                8.99€
              </span>
              <span className="text-sm text-neutral-500">/ month</span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-neutral-800">
                <Check className="w-4 h-4 text-black shrink-0" />
                <span>End-to-end AES-256 encrypted studio vault across all your devices</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-800">
                <Check className="w-4 h-4 text-black shrink-0" />
                <span>Unlimited photography projects, shoots, tasks &amp; pipeline stages</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-800">
                <Check className="w-4 h-4 text-black shrink-0" />
                <span>Seamless subscription billing and instant cancellation via Stripe</span>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-200/70 flex items-start gap-2.5 text-xs sm:text-sm text-neutral-600">
              <Leaf className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                PhotoFlow will contribute 1.5% of your purchase to remove CO₂ from the atmosphere.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenAuth}
                className="h-11 px-6 rounded-lg bg-black hover:bg-neutral-800 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Sign in &amp; subscribe — 8.99€ / month</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="py-12 px-5 sm:px-8 lg:px-12 border-t border-neutral-200/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <button
            type="button"
            onClick={handleRefreshPage}
            className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-left cursor-pointer focus:outline-none"
            title="Refresh PhotoFlow"
          >
            <PhotoFlowLogo className="w-5 h-5 text-black shrink-0" />
            <span className="text-sm font-semibold tracking-tight text-black">PhotoFlow</span>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-xs text-neutral-500">
              Encrypted photography studio workspace
            </span>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-xs text-neutral-500">
            <a href="#overview" className="hover:text-black transition-colors">
              Overview
            </a>
            <a href="#workflow" className="hover:text-black transition-colors">
              Workflow
            </a>
            <a href="#mobile" className="hover:text-black transition-colors">
              Mobile App
            </a>
            <a href="#security" className="hover:text-black transition-colors">
              Encryption
            </a>
            <button
              type="button"
              onClick={handleOpenAuth}
              className="text-black font-medium hover:underline cursor-pointer text-left"
            >
              Sign in
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
