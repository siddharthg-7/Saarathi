import React, { useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Cpu,
  Layers,
  Users,
  MessageSquare,
  Home,
  User,
  Briefcase,
} from 'lucide-react';
import { AuthModalMode, ViewType } from '@saarathi/types';
import { NavBar } from '@/components/ui/tube-light-navbar';

interface LandingPageProps {
  onOpenAuth: (mode: AuthModalMode) => void;
  onEnterWorkspace: () => void;
  onSelectView: (view: ViewType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onEnterWorkspace,
  onSelectView,
}) => {
  const navItems = [
    {
      name: 'Saarathi',
      url: '#',
      icon: Home,
      logoUrl: '/logo.png',
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    {
      name: 'About',
      url: '#about',
      icon: User,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      name: 'Features',
      url: '#services',
      icon: Cpu,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      name: 'Contact',
      url: '#contact',
      icon: MessageSquare,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      name: 'Launch Workspace',
      url: '#',
      icon: ArrowRight,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onEnterWorkspace();
      }
    }
  ];

  // Initialize scroll animation using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            observer.unobserve(entry.target); // Trigger once for performance
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const aboutWords = [
    { text: 'Saarathi', white: true },
    { text: 'is', white: false },
    { text: 'an', white: false },
    { text: 'AI-powered', white: true },
    { text: 'personal', white: true },
    { text: 'productivity', white: true },
    { text: 'operating', white: true },
    { text: 'system', white: true },
    { text: 'designed', white: false },
    { text: 'to', white: false },
    { text: 'move', white: false },
    { text: 'beyond', white: false },
    { text: 'traditional', white: true },
    { text: 'static', white: true },
    { text: 'task', white: true },
    { text: 'managers.', white: true },
    { text: 'Powered', white: false },
    { text: 'by', white: false },
    { text: 'Kairo,', white: true },
    { text: 'it', white: false },
    { text: 'acts', white: false },
    { text: 'as', white: false },
    { text: 'an', white: false },
    { text: 'intelligent', white: true },
    { text: 'companion', white: true },
    { text: 'that', white: false },
    { text: 'unifies', white: false },
    { text: 'scheduling,', white: true },
    { text: 'voice', white: true },
    { text: 'brain-dumping,', white: true },
    { text: 'habit', white: true },
    { text: 'tracking,', white: true },
    { text: 'and', white: false },
    { text: 'proactive', white: true },
    { text: 'procrastination', white: true },
    { text: 'prediction.', white: true },
  ];

  return (
    <div className="bezaleel-theme min-h-screen bg-[#FAFBFC] text-[#111827] font-sans antialiased selection:bg-primary/10 selection:text-primary relative overflow-x-hidden">
      {/* Floating Tube Light NavBar */}
      <NavBar items={navItems} />

      {/* Hero Section */}
      <section className="min-h-[90vh] flex overflow-hidden pt-32 pb-12 relative items-center">
        <div className="absolute inset-0 perspective-grid -z-20 opacity-40"></div>
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 w-full max-w-7xl mx-auto px-6 items-center">
          {/* Left Column: Content */}
          <div className="lg:col-span-6 flex flex-col z-10 justify-center items-start">
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/50 border border-border/50 backdrop-blur-md mb-8 animate-on-scroll shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[11px] font-medium text-textSecondary tracking-widest uppercase">Powered by Kairo AI</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[5.5rem] leading-[1.05] tracking-[-0.03em] font-medium text-text mb-6 animate-on-scroll">
              The AI OS that <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-text via-text to-muted/30">
                adapts to you.
              </span>
            </h1>

            <p className="text-lg md:text-xl font-light text-textSecondary leading-relaxed max-w-md mb-10 animate-on-scroll">
              Transform thoughts into plans and anticipate procrastination. Your intelligent productivity companion.
            </p>

            <div className="flex flex-wrap items-center gap-4 animate-on-scroll">
              <button onClick={onEnterWorkspace} className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-text text-background rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-xl shadow-text/10">
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              
              <a href="#services" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-medium text-textSecondary hover:text-text transition-all border border-transparent hover:border-border hover:bg-surface/50">
                <span>Explore Features</span>
              </a>
            </div>
          </div>

          {/* Right Column: Hero Spline 3D Model (Genkub Greeting Robot) */}
          <div className="lg:col-span-6 relative h-[450px] lg:h-[580px] flex items-center justify-center z-0 animate-on-scroll">
            <div className="absolute inset-0 border border-border rounded-3xl bg-[#FFFFFF]/40 backdrop-blur-sm overflow-hidden group shadow-xl shadow-primary/5">
              <div className="overflow-hidden w-full h-full relative">
                <iframe
                  loading="lazy"
                  src="https://my.spline.design/genkubgreetingrobot-ojzcjWInavuKpZSt2luvgvjl/"
                  frameBorder="0"
                  style={{ width: '100%', height: '100%' }}
                  className="w-full h-full absolute top-0 left-0 pointer-events-auto scale-110 translate-y-2 transition-transform duration-700 group-hover:scale-115"
                ></iframe>
                <div className="pointer-events-none bg-gradient-to-t from-background via-transparent to-transparent absolute inset-0"></div>
                <div className="flex flex-col bg-surface/90 w-full z-20 border-border border-t pt-4 pb-4 absolute bottom-0 left-0 backdrop-blur-md justify-center">
                  <p className="text-[10px] uppercase font-medium text-muted tracking-[0.2em] mb-3 px-6 text-center">
                    Connects with your workflow
                  </p>
                  {/* Technology Logo Marquee */}
                  <div className="relative w-full overflow-hidden mask-fade-x flex">
                    <div className="flex items-center gap-8 animate-loop-scroll shrink-0 pr-8">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                          <iconify-icon icon="simple-icons:googlecalendar" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:notion" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:slack" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:github" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:linear" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:figma" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:discord" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:todoist" height="20" className="text-text shrink-0" />
                        </div>
                      ))}
                    </div>
                    {/* Duplicate Set for Loop */}
                    <div className="flex items-center gap-8 animate-loop-scroll shrink-0 pr-8" aria-hidden="true">
                      {[...Array(6)].map((_, i) => (
                        <div key={`dup-${i}`} className="flex items-center gap-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                          <iconify-icon icon="simple-icons:googlecalendar" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:notion" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:slack" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:github" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:linear" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:figma" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:discord" height="20" className="text-text shrink-0" />
                          <iconify-icon icon="simple-icons:todoist" height="20" className="text-text shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section: Word-by-word reveal */}
      <section className="bg-background border-border border-t py-24 relative" id="about">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center w-full mb-16 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-semibold text-text tracking-tight shrink-0">
              About <span className="text-primary">Saarathi</span>
            </h2>
            <div className="h-[1px] bg-gradient-to-r from-border to-divider flex-grow mx-6"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Nexbot 3D Character Model Frame */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center animate-on-scroll">
              <div className="relative w-full h-[380px] sm:h-[440px] rounded-3xl border border-border bg-gradient-to-b from-white/60 to-surface/80 shadow-xl overflow-hidden group">
                <iframe
                  loading="lazy"
                  src="https://my.spline.design/nexbotrobotcharacterconcept-f9fb70f64f78f621dac9e33520a8dd0c/"
                  frameBorder="0"
                  style={{ width: '100%', height: '100%' }}
                  className="w-full h-full absolute top-0 left-0 pointer-events-auto scale-125 translate-x-4 translate-y-6 contrast-110"
                ></iframe>
                <div className="pointer-events-none bg-gradient-to-t from-background/90 via-transparent to-transparent absolute inset-0"></div>
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-border shadow-sm z-10">
                  <p className="text-xs text-textSecondary font-sans italic text-center leading-relaxed">
                    "Productivity is not about working harder, it's about building a better system."
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: About Statement Text */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <h3 className="md:text-4xl lg:text-5xl leading-[1.3] text-3xl font-normal tracking-wide font-[Space_Grotesk] group animate-on-scroll flex flex-wrap gap-x-2 gap-y-1">
                {aboutWords.map((w, idx) => (
                  <span
                    key={idx}
                    className={`inline-block group-[.animate]:opacity-100 group-[.animate]:translate-y-0 transition-all duration-700 ease-out opacity-0 translate-y-4 ${
                      w.white ? 'text-text' : 'text-muted'
                    }`}
                    style={{ transitionDelay: `${idx * 75}ms` }}
                  >
                    {w.text}
                  </span>
                ))}
              </h3>

              <div className="mt-12 flex flex-wrap items-center gap-6 animate-on-scroll">
                <button onClick={onEnterWorkspace} className="shiny-cta">
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button onClick={() => onOpenAuth('register')} className="btn-secondary group">
                  <span>Get Started Free</span>
                  <Users className="w-4 h-4 text-muted group-hover:text-text transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>





      {/* Services Section: How Kairo Schedules */}
      <section id="services" className="py-24 bg-surfaceSecondary/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="z-10 sm:p-8 animate-on-scroll bg-white w-full border-border border rounded-3xl mx-auto p-6 relative shadow-2xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-6 sm:px-0 items-start md:items-center">
              <h2 className="text-[36px] sm:text-5xl lg:text-6xl xl:text-7xl leading-[0.9] text-[#111827] font-semibold font-[Space_Grotesk] tracking-tighter">
                How Kairo Schedules.
              </h2>
              <span aria-hidden="true" className="hidden md:block w-px bg-border h-10"></span>
              <p className="sm:text-base text-sm text-textSecondary mt-1 tracking-tight">
                From mental clutter to a focused day in four deliberate steps.
              </p>
            </div>
            <div className="h-px bg-border mt-6 mb-8"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 z-10 relative items-stretch">
              
              {/* STEP 1: Capture */}
              <div className="lg:col-span-6 p-6 sm:p-8 bg-white border-border border rounded-[28px] relative flex flex-col group hover:-translate-y-1 transition-all duration-300">
                <span className="absolute -top-4 left-6 inline-flex items-center px-4 py-1.5 rounded-full border border-border bg-white text-xs sm:text-sm text-[#111827] font-semibold tracking-tight">STEP 1</span>
                {/* Visual */}
                <div className="relative h-48 sm:h-56 rounded-2xl bg-neutral-100/50 border border-border overflow-hidden p-4 sm:p-6 flex items-center justify-center">
                  <div className="bg-white border border-border rounded-xl p-4 w-full max-w-sm shadow-xl transform group-hover:scale-105 transition-transform duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="h-2.5 w-full bg-neutral-200 rounded"></div>
                        <div className="h-2.5 w-4/5 bg-neutral-200 rounded"></div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 items-center justify-center h-6">
                      <div className="w-1.5 h-3 bg-primary/40 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-5 bg-primary/60 rounded-full animate-pulse delay-75"></div>
                      <div className="w-1.5 h-2 bg-primary/40 rounded-full animate-pulse delay-150"></div>
                      <div className="w-1.5 h-6 bg-primary/80 rounded-full animate-pulse delay-200"></div>
                      <div className="w-1.5 h-4 bg-primary/60 rounded-full animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
                <h3 className="mt-6 text-3xl sm:text-4xl text-[#111827] font-[Space_Grotesk] font-semibold tracking-tighter">01 — Capture</h3>
                <p className="mt-3 text-sm sm:text-base text-textSecondary max-w-[52ch]">Brain-dump your tasks, ideas, and commitments by typing or talking naturally to Kairo.</p>
              </div>

              {/* STEP 2: Understand */}
              <div className="lg:col-span-6 p-6 sm:p-8 bg-white border-border border rounded-[28px] relative flex flex-col group hover:-translate-y-1 transition-all duration-300">
                <span className="absolute -top-4 left-6 inline-flex items-center px-4 py-1.5 rounded-full border border-border bg-white text-xs sm:text-sm text-[#111827] font-semibold tracking-tight">STEP 2</span>
                {/* Visual */}
                <div className="relative h-48 sm:h-56 rounded-2xl border border-border overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 sm:p-6 flex flex-col gap-3 justify-center">
                  <div className="bg-white border border-border rounded-lg p-3 shadow-sm transform group-hover:translate-x-2 transition-transform duration-300 w-4/5">
                    <div className="h-2 w-1/2 bg-neutral-200 rounded mb-3"></div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-red-100 text-red-600 border border-red-200">High Urgency</span>
                      <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-amber-100 text-amber-600 border border-amber-200">Procrastination Risk</span>
                    </div>
                  </div>
                  <div className="bg-white border border-border rounded-lg p-3 shadow-sm transform group-hover:translate-x-4 transition-transform duration-300 delay-75 w-5/6 self-end">
                    <div className="h-2 w-3/4 bg-neutral-200 rounded mb-3"></div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-blue-100 text-blue-600 border border-blue-200">Deep Work</span>
                      <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-emerald-100 text-emerald-600 border border-emerald-200">Morning Peak Energy</span>
                    </div>
                  </div>
                </div>
                <h3 className="mt-6 text-3xl sm:text-4xl text-[#111827] font-[Space_Grotesk] font-semibold tracking-tighter">02 — Understand</h3>
                <p className="mt-3 text-sm sm:text-base text-textSecondary max-w-[52ch]">Kairo identifies urgency, procrastination risk, task complexity, and when you're most likely to do your best work.</p>
              </div>

              {/* STEP 3: Schedule */}
              <div className="lg:col-span-6 p-6 sm:p-8 bg-white border-border border rounded-[28px] relative flex flex-col group hover:-translate-y-1 transition-all duration-300">
                <span className="absolute -top-4 left-6 inline-flex items-center px-4 py-1.5 rounded-full border border-border bg-white text-xs sm:text-sm text-[#111827] font-semibold tracking-tight">STEP 3</span>
                {/* Visual */}
                <div className="relative h-48 sm:h-56 rounded-2xl bg-neutral-100/50 border border-border overflow-hidden p-4 sm:p-6 flex items-center justify-center">
                  <div className="w-full max-w-sm h-full bg-white border border-border rounded-xl p-3 flex flex-col gap-2 shadow-xl group-hover:scale-105 transition-transform duration-500">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-neutral-100">
                      <div className="h-2.5 w-20 bg-neutral-200 rounded"></div>
                      <div className="flex gap-1.5">
                        <div className="w-4 h-4 bg-neutral-100 rounded"></div>
                        <div className="w-4 h-4 bg-neutral-100 rounded"></div>
                      </div>
                    </div>
                    {/* Timeline */}
                    <div className="flex-1 flex gap-3 relative">
                      <div className="w-8 flex flex-col justify-between py-2 border-r border-neutral-100">
                        <div className="h-1.5 w-5 bg-neutral-200 rounded"></div>
                        <div className="h-1.5 w-5 bg-neutral-200 rounded"></div>
                        <div className="h-1.5 w-5 bg-neutral-200 rounded"></div>
                      </div>
                      <div className="flex-1 relative">
                        <div className="absolute top-2 left-0 right-2 h-12 bg-primary/10 border border-primary/20 rounded-lg p-2 shadow-sm">
                          <div className="h-1.5 w-1/2 bg-primary/40 rounded mb-1.5"></div>
                          <div className="h-1.5 w-1/3 bg-primary/30 rounded"></div>
                        </div>
                        <div className="absolute top-16 left-0 right-8 h-10 bg-emerald-100 border border-emerald-200 rounded-lg p-2 shadow-sm">
                          <div className="h-1.5 w-2/3 bg-emerald-400 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="mt-6 text-3xl sm:text-4xl text-[#111827] font-[Space_Grotesk] font-semibold tracking-tighter">03 — Schedule</h3>
                <p className="mt-3 text-sm sm:text-base text-textSecondary max-w-[52ch]">Your tasks are placed into realistic time blocks based on deadlines, calendar constraints, and your energy patterns.</p>
              </div>

              {/* STEP 4: Execute */}
              <div className="lg:col-span-6 p-6 sm:p-8 bg-white border-border border rounded-[28px] relative flex flex-col group hover:-translate-y-1 transition-all duration-300">
                <span className="absolute -top-4 left-6 inline-flex items-center px-4 py-1.5 rounded-full border border-border bg-white text-xs sm:text-sm text-[#111827] font-semibold tracking-tight">STEP 4</span>
                {/* Visual */}
                <div className="relative h-48 sm:h-56 rounded-2xl bg-neutral-100/50 border border-border overflow-hidden p-4 sm:p-6 flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full border-[6px] border-neutral-100 relative flex flex-col items-center justify-center shadow-inner bg-white">
                    {/* Progress ring */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90 group-hover:rotate-0 transition-transform duration-1000 ease-in-out" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary" strokeDasharray="289" strokeDashoffset="40" strokeLinecap="round" />
                    </svg>
                    <span className="text-3xl font-bold text-[#111827] font-[Space_Grotesk] tracking-tighter">24:59</span>
                    <span className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1 bg-primary/10 px-2 py-0.5 rounded-full">Focus Mode</span>
                  </div>
                  {/* Streak pill */}
                  <div className="absolute bottom-4 right-4 bg-white border border-border shadow-md rounded-full px-3 py-1.5 flex items-center gap-1.5 transform group-hover:-translate-y-1 transition-transform duration-300">
                    <span className="text-orange-500 text-sm">🔥</span>
                    <span className="text-xs font-semibold text-[#111827]">12 Day Streak</span>
                  </div>
                </div>
                <h3 className="mt-6 text-3xl sm:text-4xl text-[#111827] font-[Space_Grotesk] font-semibold tracking-tighter">04 — Execute</h3>
                <p className="mt-3 text-sm sm:text-base text-textSecondary max-w-[52ch]">Enter Focus Mode, work through the plan, and let Kairo adapt tomorrow's schedule based on what actually happened.</p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section: Core Intelligence */}
      <section id="features" className="py-24 bg-surfaceSecondary/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center w-full mb-16 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-semibold text-text tracking-tight shrink-0">
              Core <span className="text-primary">Intelligence</span>
            </h2>
            <div className="h-[1px] bg-gradient-to-r from-border to-divider flex-grow mx-6"></div>
            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-textSecondary">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="text-center md:text-left mb-12 animate-on-scroll">
            <p className="sm:text-base text-sm text-textSecondary max-w-none">
              Explore the powerful AI-driven capabilities that make Saarathi your ultimate productivity companion.
            </p>
          </div>

          {/* Expanding Cards */}
          <div className="flex flex-col md:flex-row gap-4 gap-x-4 gap-y-4" id="expanding-cards">
            {/* ===== Card 1 (Voice Brain Dump) ===== */}
            <article className="card group w-full md:flex-1 md:hover:flex-[3] min-w-0 overflow-hidden transition-all duration-500 ease-out bg-surface border-border border rounded-2xl relative animate-on-scroll">
              {/* Image */}
              <img src="https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=1600" alt="Voice Brain Dump" className="md:h-[420px] transition duration-500 group-hover:scale-[1.02] w-full h-72 object-cover" />

              {/* Subtle gradient so the title stays readable */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>

              {/* Title only (default visible) */}
              <div className="absolute top-4 left-4 right-4">
                <span className="inline-flex rounded-lg px-3 py-2 text-white text-lg sm:text-xl font-semibold shadow-sm backdrop-blur-md bg-black/20">
                  Voice Brain Dump
                </span>
              </div>

              {/* Reveal area (shown only on hover/expand) */}
              <div className="sm:p-6 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-500 opacity-0 pt-4 pr-4 pb-4 pl-4 absolute right-0 bottom-0 left-0 translate-y-4">
                <div className="rounded-xl bg-black/60 border border-white/10 backdrop-blur-md p-4 sm:p-5">
                  <h3 className="text-white text-xl sm:text-2xl font-semibold mb-2">
                    Turn speech into tasks
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base mb-4">
                    Record unformatted audio thoughts on the go. Deepgram and Groq models instantly parse them into clean, structured tasks in your workspace.
                  </p>
                  <a href="#demo" className="inline-flex items-center gap-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium border border-white/20 px-4 py-2 transition">
                    Try Voice Capture →
                  </a>
                </div>
              </div>
            </article>

            {/* ===== Card 2 (Procrastination ML) ===== */}
            <article className="card group w-full md:flex-1 md:hover:flex-[3] min-w-0 overflow-hidden transition-all duration-500 ease-out bg-surface border-border border rounded-2xl relative animate-on-scroll" style={{ transitionDelay: '100ms' }}>
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600" alt="Procrastination ML" className="md:h-[420px] transition duration-500 group-hover:scale-[1.02] w-full h-72 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>
              <div className="absolute top-4 left-4 right-4">
                <span className="inline-flex rounded-lg px-3 py-2 text-white text-lg sm:text-xl font-semibold shadow-sm backdrop-blur-md bg-black/20">
                  Procrastination ML
                </span>
              </div>
              <div className="sm:p-6 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-500 opacity-0 pt-4 pr-4 pb-4 pl-4 absolute right-0 bottom-0 left-0 translate-y-4">
                <div className="rounded-xl bg-black/60 border border-white/10 backdrop-blur-md p-4 sm:p-5">
                  <h3 className="text-white text-xl sm:text-2xl font-semibold mb-2">
                    Predict skip risk
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base mb-4">
                    Our machine learning models analyze your behavioral habits to warn you before a high-leverage task gets skipped, keeping you accountable.
                  </p>
                  <a href="#stats" className="inline-flex items-center gap-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium border border-white/20 px-4 py-2 transition">
                    View Insights →
                  </a>
                </div>
              </div>
            </article>

            {/* ===== Card 3 (Focus Engine) ===== */}
            <article className="card group w-full md:flex-1 md:hover:flex-[3] min-w-0 overflow-hidden transition-all duration-500 ease-out bg-surface border-border border rounded-2xl relative animate-on-scroll" style={{ transitionDelay: '200ms' }}>
              <img src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1600" alt="Habit & Focus Engine" className="md:h-[420px] transition duration-500 group-hover:scale-[1.02] w-full h-72 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>
              <div className="absolute top-4 left-4 right-4">
                <span className="inline-flex rounded-lg px-3 py-2 text-white text-lg sm:text-xl font-semibold shadow-sm backdrop-blur-md bg-black/20">
                  Focus Engine
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-500">
                <div className="rounded-xl bg-black/60 border border-white/10 backdrop-blur-md p-4 sm:p-5">
                  <h3 className="text-white text-xl sm:text-2xl font-semibold mb-2">
                    Immersive flow states
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base mb-4">
                    Enter Focus Mode with built-in Pomodoro timers, smart ambient soundscapes, consistency scoring, and daily streak tracking.
                  </p>
                  <a href="#focus" className="inline-flex items-center gap-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium border border-white/20 px-4 py-2 transition">
                    Start Session →
                  </a>
                </div>
              </div>
            </article>

            {/* ===== Card 4 (Vector Vault) ===== */}
            <article className="card group w-full md:flex-1 md:hover:flex-[3] min-w-0 overflow-hidden transition-all duration-500 ease-out bg-surface border-border border rounded-2xl relative animate-on-scroll" style={{ transitionDelay: '300ms' }}>
              <img src="https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?q=80&w=1600" alt="Vector Knowledge Vault" className="md:h-[420px] transition duration-500 group-hover:scale-[1.02] w-full h-72 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>
              <div className="absolute top-4 left-4 right-4">
                <span className="inline-flex rounded-lg px-3 py-2 text-white text-lg sm:text-xl font-semibold shadow-sm backdrop-blur-md bg-black/20">
                  Vector Vault
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-500">
                <div className="rounded-xl bg-black/60 border border-white/10 backdrop-blur-md p-4 sm:p-5">
                  <h3 className="text-white text-xl sm:text-2xl font-semibold mb-2">
                    Semantic memory
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base mb-4">
                    Your notes are embedded as vectors via Supabase PGVector, allowing Kairo to retrieve relevant context through semantic search automatically.
                  </p>
                  <a href="#memory" className="inline-flex items-center gap-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium border border-white/20 px-4 py-2 transition">
                    Query Data →
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Testimonials Marquee */}
      <section className="overflow-hidden bg-background border-border border-t py-24" id="testimonials">
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <div className="flex animate-on-scroll w-full items-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-text tracking-tight shrink-0">
              Saarthi <span className="text-primary">Feedback</span>
            </h2>
            <div className="h-[1px] bg-gradient-to-r from-border to-divider flex-grow mx-6"></div>
            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-textSecondary">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Row 1: Left to Right */}
        <div className="relative w-full mask-fade-x animate-on-scroll mb-8">
          <div className="flex overflow-hidden gap-6 pb-4">
            <div className="flex shrink-0 items-center gap-6 animate-loop-scroll">
              {/* Item 1 */}
              <div className="hover:border-primary/20 transition-colors bg-surface border-border border w-[350px] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed mb-6">
                  "Kairo predicted my 82% gym skip risk on Monday nights and nudged me to reschedule to Tuesday mornings. It completely fixed my habit dropoff."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceSecondary flex items-center justify-center text-xs font-bold text-text">
                    AR
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Abdul Razzaq</div>
                    <div className="text-xs text-muted">CS Student</div>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="hover:border-primary/20 transition-colors bg-surface border border-border w-[350px] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed mb-6">
                  "Brain Dump mode is magic. I record a 1-minute audio voice note while walking home, and get a structured, prioritized subtask list."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceSecondary flex items-center justify-center text-xs font-bold text-text">
                    BV
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Banda Vidhathri</div>
                    <div className="text-xs text-muted">UX Designer</div>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="hover:border-primary/20 transition-colors bg-surface border border-border w-[350px] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed mb-6">
                  "Focus mode's rain soundscapes and minimalist UI helped me master deep work and finish my thesis."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceSecondary flex items-center justify-center text-xs font-bold text-text">
                    GP
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Gadipally Praneeth Reddy</div>
                    <div className="text-xs text-muted">Backend Developer</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Duplicate Set for Loop */}
            <div className="flex shrink-0 items-center gap-6 animate-loop-scroll" aria-hidden="true">
              {/* Item 1 */}
              <div className="hover:border-primary/20 transition-colors bg-surface border-border border w-[350px] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed mb-6">
                  "Kairo predicted my 82% gym skip risk on Monday nights and nudged me to reschedule to Tuesday mornings. It completely fixed my habit dropoff."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceSecondary flex items-center justify-center text-xs font-bold text-text">
                    AR
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Abdul Razzaq</div>
                    <div className="text-xs text-muted">CS Student</div>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="hover:border-primary/20 transition-colors bg-surface border border-border w-[350px] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed mb-6">
                  "Brain Dump mode is magic. I record a 1-minute audio voice note while walking home, and get a prioritized list of subtasks in my dashboard."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceSecondary flex items-center justify-center text-xs font-bold text-text">
                    BV
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Banda Vidhathri</div>
                    <div className="text-xs text-muted">UX Designer</div>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="hover:border-primary/20 transition-colors bg-surface border border-border w-[350px] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed mb-6">
                  "Focus mode's rain soundscapes and minimalist UI helped me master deep work and finish my thesis."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceSecondary flex items-center justify-center text-xs font-bold text-text">
                    GP
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Gadipally Praneeth Reddy</div>
                    <div className="text-xs text-muted">Backend Developer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Right to Left (Reverse) */}
        <div className="relative w-full mask-fade-x animate-on-scroll">
          <div className="flex overflow-hidden gap-6 pb-4">
            <div className="flex shrink-0 items-center gap-6 animate-loop-scroll-reverse">
              {/* Item 1 */}
              <div className="hover:border-primary/20 transition-colors bg-surface border border-border w-[350px] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed mb-6">
                  "pgvector memory search is amazing. I can ask Kairo: 'What was that app idea from three months ago?' and get it instantly."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceSecondary flex items-center justify-center text-xs font-bold text-text">
                    KS
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Kamineni Sahasra</div>
                    <div className="text-xs text-muted">Director, FutureV</div>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="hover:border-primary/20 transition-colors bg-surface border border-border w-[350px] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed mb-6">
                  "The energy clustering scheduler actually aligns coding tasks with my peak focus times."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceSecondary flex items-center justify-center text-xs font-bold text-text">
                    SA
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Shaik Almas Sania</div>
                    <div className="text-xs text-muted">Tech Founder</div>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="hover:border-primary/20 transition-colors bg-surface border border-border w-[350px] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed mb-6">
                  "Saarathi's proactive nudge is a lifesaver. No more simple alarm rings, it feels like a real coach."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceSecondary flex items-center justify-center text-xs font-bold text-text">
                    US
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Utpala Stephen</div>
                    <div className="text-xs text-muted">VP, Innovate Corp</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Duplicate Set for Loop */}
            <div className="flex shrink-0 items-center gap-6 animate-loop-scroll-reverse" aria-hidden="true">
              {/* Item 1 */}
              <div className="hover:border-primary/20 transition-colors bg-surface border border-border w-[350px] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed mb-6">
                  "pgvector memory search is amazing. I can ask Kairo: 'What was that app idea from three months ago?' and get it instantly."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceSecondary flex items-center justify-center text-xs font-bold text-text">
                    KS
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Kamineni Sahasra</div>
                    <div className="text-xs text-muted">Director, FutureV</div>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="hover:border-primary/20 transition-colors bg-surface border border-border w-[350px] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed mb-6">
                  "The energy clustering scheduler actually aligns coding tasks with my peak focus times."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceSecondary flex items-center justify-center text-xs font-bold text-text">
                    SA
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Shaik Almas Sania</div>
                    <div className="text-xs text-muted">Tech Founder</div>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="hover:border-primary/20 transition-colors bg-surface border border-border w-[350px] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 text-[#FACC15] mb-4">
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                  <iconify-icon icon="solar:star-bold" width="16" />
                </div>
                <p className="text-textSecondary text-sm leading-relaxed mb-6">
                  "Saarathi's proactive nudge is a lifesaver. No more simple alarm rings, it feels like a real coach."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceSecondary flex items-center justify-center text-xs font-bold text-text">
                    US
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Utpala Stephen</div>
                    <div className="text-xs text-muted">VP, Innovate Corp</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Contact Section */}
      <section id="contact" className="w-full relative z-10 bg-[#0A1128] py-24">
        <div className="max-w-7xl sm:px-6 lg:px-8 mx-auto px-4 animate-on-scroll">
          <div className="relative overflow-hidden bg-white/5 ring-white/10 ring-1 rounded-3xl backdrop-blur">
            <div className="relative z-10 md:p-12 lg:p-16 p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Form card */}
                <div className="lg:col-span-5">
                  <div className="rounded-2xl bg-white/95 backdrop-blur ring-1 ring-white/20 shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-neutral-500 font-sans uppercase tracking-wider">Saarathi Support</p>
                        <h3 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 font-sans">
                          Need workflow help?
                        </h3>
                      </div>
                      <div className="h-9 w-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square h-4 w-4"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path></svg>
                      </div>
                    </div>

                    <form action="#" method="POST" className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onEnterWorkspace(); }}>
                      <div className="relative">
                        <input id="ct-name" name="name" type="text" required placeholder=" " className="peer block w-full px-3 pt-6 pb-2 text-sm rounded-xl ring-1 ring-black/10 focus:ring-2 focus:ring-primary outline-none bg-white font-sans transition-all" />
                        <label htmlFor="ct-name" className="absolute text-neutral-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary pointer-events-none">Your name *</label>
                      </div>
                      <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 z-10"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
                        <input id="ct-email" name="email" type="email" required placeholder=" " className="peer block w-full pl-9 pr-3 pt-6 pb-2 text-sm rounded-xl ring-1 ring-black/10 focus:ring-2 focus:ring-primary outline-none bg-white font-sans transition-all" />
                        <label htmlFor="ct-email" className="absolute text-neutral-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-9 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary pointer-events-none">Email *</label>
                      </div>
                      <div className="relative">
                        <textarea id="ct-msg" name="message" rows={4} placeholder=" " className="peer block w-full resize-y px-3 pt-6 pb-2 text-sm rounded-xl ring-1 ring-black/10 focus:ring-2 focus:ring-primary outline-none bg-white font-sans transition-all"></textarea>
                        <label htmlFor="ct-msg" className="absolute text-neutral-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary pointer-events-none">Message</label>
                      </div>
                      <button type="submit" className="w-full inline-flex items-center justify-center rounded-xl bg-primary text-white px-4 py-3 text-sm font-semibold hover:bg-primaryHover transition-colors font-sans">
                        Send message
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right h-4 w-4 ml-2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                      </button>
                      <p className="text-[11px] text-neutral-500 font-sans">By submitting, you agree to our Terms and Privacy Policy.</p>
                    </form>
                  </div>
                </div>

                {/* Copy + highlights */}
                <div className="lg:col-span-7">
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl leading-[1.05] font-semibold text-white tracking-tight font-sans">Let's build your workflow.</h2>
                  <p className="text-base sm:text-lg max-w-2xl text-white/80 mt-4 font-sans">
                    Enterprise deployments, API access, or custom AI models—tell us what you need. We reply within one business day.
                  </p>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur ring-1 ring-white/15 flex items-center justify-center text-white/90">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock-3 h-4 w-4"><path d="M12 6v6h4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm font-sans">Quick response</p>
                        <p className="text-white/70 text-xs font-sans">Most messages receive a reply in under 24h.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur ring-1 ring-white/15 flex items-center justify-center text-white/90">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-bag h-4 w-4"><path d="M16 10a4 4 0 0 1-8 0"></path><path d="M3.103 6.034h17.794"></path><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"></path></svg>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm font-sans">Clear next steps</p>
                        <p className="text-white/70 text-xs font-sans">We'll follow up with a concise plan and timeline.</p>
                      </div>
                    </div>
                  </div>

                  {/* Direct contact card */}
                  <div className="mt-8 animate-on-scroll">
                    <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20 shadow-lg p-3">
                      <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200" alt="Product Lead" className="h-12 w-12 rounded-xl object-cover" />
                      <div className="min-w-0 pr-4">
                        <p className="text-[11px] text-white/50 leading-none font-sans uppercase tracking-wider">Product Lead</p>
                        <p className="text-white font-semibold tracking-tight truncate font-sans">Siddharth</p>
                      </div>
                      <a href="mailto:hello@saarathi.ai" className="ml-1 inline-flex items-center gap-2 rounded-xl bg-white/20 text-white px-3 py-2 text-xs font-semibold hover:bg-white/30 transition-colors font-sans ring-1 ring-white/10">
                        Ask directly
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle h-3.5 w-3.5"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path></svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>  
      </section>

      {/* Footer Bar - New Dark Theme */}
      <footer className="overflow-hidden text-white bg-[#0A1128] border-neutral-800 border-t pt-24 z-20 relative">
        {/* Giant Brand Text */}
        <div className="text-center w-full mb-20 pr-4 pl-4"
          style={{
            maskImage: 'linear-gradient(180deg, transparent, black 0%, black 55%, transparent)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent, black 0%, black 55%, transparent)'
          }}>
          <h1
            className="text-[18vw] leading-[0.7] select-none font-bold text-[#0B1736] tracking-tighter mix-blend-screen scale-y-110 animate-on-scroll">
            SAARTHI
          </h1>
        </div>

        {/* Links Grid */}
        <div className="border-t border-neutral-900 grid grid-cols-1 lg:grid-cols-2 animate-on-scroll" style={{ transitionDelay: '100ms' }}>
          {/* Left Side: Navigation Links */}
          <div className="p-8 md:p-16 grid grid-cols-2 gap-12 border-r border-neutral-900">
            <div className="flex flex-col gap-6">
              <a href="#about" className="flex items-center gap-3 text-xs font-medium text-neutral-500 uppercase tracking-widest hover:text-white transition-colors">
                <iconify-icon icon="solar:info-square-linear" width="18" /> About Us
              </a>
              <a href="#services" className="flex items-center gap-3 text-xs font-medium text-neutral-500 uppercase tracking-widest hover:text-white transition-colors">
                <iconify-icon icon="solar:widget-linear" width="18" /> Features
              </a>
              <a href="#services" className="flex items-center gap-3 text-xs font-medium text-neutral-500 uppercase tracking-widest hover:text-white transition-colors">
                <iconify-icon icon="solar:cpu-linear" width="18" /> Technology
              </a>
            </div>
            <div className="flex flex-col gap-6">
              <a href="#contact" className="flex items-center gap-3 text-xs font-medium text-neutral-500 uppercase tracking-widest hover:text-white transition-colors">
                <iconify-icon icon="solar:letter-linear" width="18" /> Contact Us
              </a>
              <a href="#" className="flex items-center gap-3 text-xs font-medium text-neutral-500 uppercase tracking-widest hover:text-white transition-colors">
                <iconify-icon icon="mdi:instagram" width="18" /> Instagram
              </a>
              <a href="#" className="flex items-center gap-3 text-xs font-medium text-neutral-500 uppercase tracking-widest hover:text-white transition-colors">
                <iconify-icon icon="ri:twitter-x-fill" width="18" /> Twitter/X
              </a>
              <a href="#" className="flex items-center gap-3 text-xs font-medium text-neutral-500 uppercase tracking-widest hover:text-white transition-colors">
                <iconify-icon icon="mdi:facebook" width="18" /> Facebook
              </a>
            </div>
          </div>

          {/* Right Side: Wireframe Illustration */}
          <div className="lg:h-auto lg:border-t-0 flex overflow-hidden aether-bottles w-full h-48 border-neutral-900 border-t relative items-center justify-center">
            <svg viewBox="0 0 400 120" className="opacity-20 max-h-[160px] w-[756px] h-[160px]"
              preserveAspectRatio="xMidYMid meet" strokeWidth="2"
              style={{ width: '756px', height: '160px', color: 'rgb(255, 255, 255)' }}>
              {/* Tube 1 (Outline) */}
              <path d="M40 100 L50 30 L90 30 L100 100" stroke="white" strokeWidth="1" fill="none"></path>
              <rect x="50" y="20" width="40" height="10" stroke="white" strokeWidth="1" fill="none"></rect>

              {/* Tube 2 (Outline) */}
              <path d="M120 100 L130 10 L170 10 L180 100" stroke="white" strokeWidth="1" fill="none"></path>
              <rect x="130" y="5" width="40" height="5" stroke="white" strokeWidth="1" fill="none"></rect>

              {/* Dropper Bottle (wave liquid) */}
              <g transform="translate(200, 10)" className="dropper-bottle">
                {/* ClipPath in the SAME coordinates as the bottle */}
                <defs>
                  <clipPath id="dropper-clip">
                    {/* inside shape of the bottle */}
                    <path d="M15 25 Q15 20 20 20 L40 20 Q45 20 45 25 L45 80 Q45 90 30 90 Q15 90 15 80 Z" />
                  </clipPath>
                </defs>

                {/* Cap */}
                <path d="M25 0 L25 10 L20 10 L20 20 L40 20 L40 10 L35 10 L35 0 Z" stroke="white" strokeWidth="1" fill="none"></path>

                {/* Body Outline */}
                <path d="M15 25 Q15 20 20 20 L40 20 Q45 20 45 25 L45 80 Q45 90 30 90 Q15 90 15 80 Z" stroke="white" strokeWidth="1" fill="none"></path>

                {/* Liquid (clipped perfectly inside bottle) */}
                <g clipPath="url(#dropper-clip)">
                  {/* Base fill */}
                  <rect className="liquid-fill" x="15" y="60" width="30" height="30" fill="#0891B2" opacity="0.6"></rect>
                  {/* Wave on top */}
                  <path className="liquid-wave" d="M15 60 Q22 55 30 57 Q38 59 45 56 L45 90 L15 90 Z" fill="#0891B2" opacity="0.9"></path>
                </g>
              </g>

              {/* Tube 3 (Outline) */}
              <path d="M270 100 L280 20 L320 20 L330 100" stroke="white" strokeWidth="1" fill="none"></path>
              <rect x="280" y="10" width="40" height="10" stroke="white" strokeWidth="1" fill="none"></rect>

              {/* Dropper 2 (Outline) */}
              <g transform="translate(350, 20)">
                <rect x="25" y="0" width="10" height="20" stroke="white" strokeWidth="1" fill="none"></rect>
                <path d="M15 25 Q15 20 20 20 L40 20 Q45 20 45 25 L45 70 Q45 80 30 80 Q15 80 15 70 Z" stroke="white" strokeWidth="1" fill="none"></path>
              </g>
            </svg>
          </div>

          {/* Copyright Row */}
          <div className="border-t border-neutral-900 px-8 md:px-16 py-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-neutral-600 font-medium tracking-wide lg:col-span-2">
            <div>
              2026 All rights reserved
            </div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of use</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Floating Action Button (FAB) */}
      <button 
        onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-[0_8px_30px_rgb(30,58,138,0.3)] hover:bg-primaryHover hover:scale-110 active:scale-95 transition-all duration-300 group"
        aria-label="Contact Support"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus h-6 w-6 group-hover:rotate-90 transition-transform duration-300"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
      </button>
    </div>
  );
};
