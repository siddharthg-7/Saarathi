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

          {/* Right Column: Spline 3D Model with cropping offset quirk */}
          <div className="lg:col-span-6 relative h-[400px] lg:h-[550px] flex items-center justify-center z-0 animate-on-scroll">
            <div className="absolute inset-0 border border-border rounded-3xl bg-[#FFFFFF]/30 backdrop-blur-sm overflow-hidden group">
              <div className="overflow-hidden w-full h-full relative">
                <iframe
                  loading="lazy"
                  src="https://my.spline.design/nexbotrobotcharacterconcept-f9fb70f64f78f621dac9e33520a8dd0c/"
                  frameBorder="0"
                  style={{ width: '100%', height: '100%' }}
                  className="grayscale-[20%] contrast-125 opacity-90 absolute top-0 left-0 pointer-events-auto scale-125 translate-x-12 translate-y-12"
                ></iframe>
                <div className="pointer-events-none bg-gradient-to-t from-background via-transparent to-transparent absolute inset-0"></div>
                <div className="flex flex-col bg-surface/90 w-full z-20 border-border border-t pt-5 pb-5 absolute bottom-0 left-0 backdrop-blur-md justify-center">
                  <p className="text-[10px] uppercase font-medium text-muted tracking-[0.2em] mb-4 px-6">
                    Trusted by AI innovators
                  </p>
                  {/* Technology Logo Marquee */}
                  <div className="relative w-full overflow-hidden mask-fade-x flex gap-8">
                    <div className="flex items-center gap-8 animate-loop-scroll shrink-0 min-w-full justify-around">
                      <div className="flex items-center gap-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                        <iconify-icon icon="logos:google" height="20" className="shrink-0" />
                        <iconify-icon icon="simple-icons:openai" height="20" className="text-text shrink-0" />
                        <iconify-icon icon="logos:microsoft" height="20" className="shrink-0" />
                        <iconify-icon icon="logos:stripe" height="20" className="shrink-0" />
                        <iconify-icon icon="simple-icons:anthropic" height="20" className="text-text shrink-0" />
                        <iconify-icon icon="simple-icons:nvidia" height="18" className="text-text shrink-0" />
                        <iconify-icon icon="logos:vercel" height="18" className="brightness-0 shrink-0" />
                        <iconify-icon icon="logos:aws" height="18" className="brightness-0 shrink-0" />
                      </div>
                    </div>
                    {/* Duplicate Set for Loop */}
                    <div className="flex items-center gap-8 animate-loop-scroll shrink-0 min-w-full justify-around" aria-hidden="true">
                      <div className="flex items-center gap-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                        <iconify-icon icon="logos:google" height="20" className="shrink-0" />
                        <iconify-icon icon="simple-icons:openai" height="20" className="text-text shrink-0" />
                        <iconify-icon icon="logos:microsoft" height="20" className="shrink-0" />
                        <iconify-icon icon="logos:stripe" height="20" className="shrink-0" />
                        <iconify-icon icon="simple-icons:anthropic" height="20" className="text-text shrink-0" />
                        <iconify-icon icon="simple-icons:nvidia" height="18" className="text-text shrink-0" />
                        <iconify-icon icon="logos:vercel" height="18" className="brightness-0 shrink-0" />
                        <iconify-icon icon="logos:aws" height="18" className="brightness-0 shrink-0" />
                      </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
            <div className="lg:col-span-4 flex flex-col justify-start animate-on-scroll">
              <p className="leading-relaxed text-sm text-textSecondary font-sans">
                "Productivity is not about working harder, it's about building a better system."
              </p>
            </div>

            <div className="lg:col-span-8 flex flex-col justify-center">
              <h3 className="md:text-4xl lg:text-5xl leading-[1.3] text-3xl font-normal tracking-wide font-[Space_Grotesk] group animate-on-scroll flex flex-wrap gap-x-2 gap-y-1">
                {aboutWords.map((w, idx) => (
                  <span
                    key={idx}
                    className={`inline-block blur-[4px] group-[.animate]:opacity-100 group-[.animate]:blur-0 group-[.animate]:translate-y-0 transition-all duration-700 ease-out opacity-0 translate-y-4 ${
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

      {/* Work Section: Web & Mobile clients */}
      <section className="bg-background border-border border-t py-24 relative" id="work">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center w-full mb-16 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-semibold text-text tracking-tight shrink-0">
              Our <span className="text-primary">Ecosystem</span>
            </h2>
            <div className="h-[1px] bg-gradient-to-r from-border to-divider flex-grow mx-6"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project 1: Web Dashboard */}
            <div onClick={onEnterWorkspace} className="group block cursor-pointer animate-on-scroll">
              <div className="aspect-[16/10] overflow-hidden card-grid-bg bg-surfaceSecondary w-full border-border border rounded-xl mb-6 relative">
                <div className="absolute inset-8 shadow-medium-premium rounded-lg overflow-hidden transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-[1.02] border border-border">
                  <img
                    loading="lazy"
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2370"
                    alt="Saarathi Web Dashboard"
                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-2xl font-semibold text-text group-hover:text-primary transition-colors">
                  Web Dashboard
                </h3>
                <span className="px-2 py-1 text-[10px] uppercase tracking-wider font-medium border border-border rounded text-textSecondary bg-surface">
                  SaaS
                </span>
              </div>
              <p className="leading-relaxed text-sm text-textSecondary max-w-sm">
                All-in-one desktop analytics, habits engine, and time-blocked calendar scheduling workspace.
              </p>
            </div>

            {/* Project 2: Mobile App (Offset translation quirk) */}
            <div onClick={onEnterWorkspace} className="group block lg:translate-y-16 cursor-pointer animate-on-scroll">
              <div className="aspect-[16/10] overflow-hidden card-grid-bg bg-surfaceSecondary w-full border-border border rounded-xl mb-6 relative">
                <div className="absolute inset-8 shadow-medium-premium rounded-lg overflow-hidden transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-[1.02] border border-border">
                  <img
                    loading="lazy"
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426"
                    alt="Saarathi Mobile App"
                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-2xl font-semibold text-text group-hover:text-primary transition-colors">
                  Mobile Application
                </h3>
                <span className="px-2 py-1 text-[10px] uppercase tracking-wider font-medium border border-border rounded text-textSecondary bg-surface">
                  App
                </span>
              </div>
              <p className="leading-relaxed text-sm text-textSecondary max-w-sm">
                Seamless on-the-go voice capture, real-time Kairo briefings, and local behavioral notifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section: How Kairo schedules */}
      <section id="process" className="py-24 bg-background border-t border-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center w-full mb-12 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-semibold text-text tracking-tight shrink-0">
              How Kairo <span className="text-primary">Schedules</span>
            </h2>
            <div className="h-[1px] bg-gradient-to-r from-border to-divider flex-grow mx-6"></div>
            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center shrink-0 text-textSecondary">
              <Cpu className="w-5 h-5" />
            </div>
          </div>

          <div className="mb-16 animate-on-scroll max-w-2xl">
            <p className="text-textSecondary text-sm leading-relaxed">
              A systematic approach to daily scheduling. We process chaos into high-leverage outcomes
              using Kairo's custom machine learning pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="group flex flex-col items-start gap-4 p-6 rounded-2xl border border-transparent hover:border-border hover:bg-surfaceSecondary/50 transition-all duration-300 animate-on-scroll">
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-sm text-textSecondary font-medium group-hover:border-primary group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                01
              </div>
              <h3 className="text-lg font-semibold text-text group-hover:translate-x-1 transition-transform duration-300">
                Capture
              </h3>
              <p className="text-sm text-muted leading-relaxed group-hover:text-textSecondary transition-colors duration-300">
                Record a 2-minute brain dump or talk naturally with Kairo. Raw text/audio streams into the engine.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group flex flex-col items-start gap-4 p-6 rounded-2xl border border-transparent hover:border-border hover:bg-surfaceSecondary/50 transition-all duration-300 animate-on-scroll">
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-sm text-textSecondary font-medium group-hover:border-primary group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                02
              </div>
              <h3 className="text-lg font-semibold text-text group-hover:translate-x-1 transition-transform duration-300">
                Analyze
              </h3>
              <p className="text-sm text-muted leading-relaxed group-hover:text-textSecondary transition-colors duration-300">
                Procrastination ML calculates delay risk while KMeans clustering maps your energy blocks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group flex flex-col items-start gap-4 p-6 rounded-2xl border border-transparent hover:border-border hover:bg-surfaceSecondary/50 transition-all duration-300 animate-on-scroll">
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-sm text-textSecondary font-medium group-hover:border-primary group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                03
              </div>
              <h3 className="text-lg font-semibold text-text group-hover:translate-x-1 transition-transform duration-300">
                Schedule
              </h3>
              <p className="text-sm text-muted leading-relaxed group-hover:text-textSecondary transition-colors duration-300">
                Smart scheduler maps tasks dynamically against deadlines, calendar, and energy blocks.
              </p>
            </div>

            {/* Step 4 */}
            <div className="group flex flex-col items-start gap-4 p-6 rounded-2xl border border-transparent hover:border-border hover:bg-surfaceSecondary/50 transition-all duration-300 animate-on-scroll">
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-sm text-textSecondary font-medium group-hover:border-primary group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                04
              </div>
              <h3 className="text-lg font-semibold text-text group-hover:translate-x-1 transition-transform duration-300">
                Execute
              </h3>
              <p className="text-sm text-muted leading-relaxed group-hover:text-textSecondary transition-colors duration-300">
                Immerse in Focus Mode with Pomodoro & ambient sounds, tracking daily consistency streaks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section: Core Intelligence */}
      <section id="services" className="py-24 bg-surfaceSecondary/30 border-t border-border">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service 1: Voice Brain Dump */}
            <div className="group relative h-[300px] service-card rounded-2xl border border-border bg-surface p-8 hover:bg-surfaceSecondary/50 hover:border-primary/30 animate-on-scroll">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(30,58,138,0.03)_0%,_transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
              <div className="flex flex-col h-full z-10 relative">
                <div className="icon-wrapper mb-6 w-12 h-12 rounded-lg bg-surfaceSecondary border border-border flex items-center justify-center text-textSecondary group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors duration-300">
                  <iconify-icon icon="solar:smartphone-linear" width="24" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-3">Voice Brain Dump</h3>
                <p className="text-sm text-textSecondary leading-relaxed">
                  Record unformatted audio thoughts. Deepgram & Groq parse them into clean, structured tasks.
                </p>
              </div>
            </div>

            {/* Service 2: Procrastination Predictor */}
            <div className="group relative h-[300px] service-card rounded-2xl border border-border bg-surface p-8 hover:bg-surfaceSecondary/50 hover:border-primary/30 animate-on-scroll">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(30,58,138,0.03)_0%,_transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
              <div className="flex flex-col h-full z-10 relative">
                <div className="icon-wrapper mb-6 w-12 h-12 rounded-lg bg-surfaceSecondary border border-border flex items-center justify-center text-textSecondary group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors duration-300">
                  <iconify-icon icon="solar:cpu-linear" width="24" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-3">Procrastination ML</h3>
                <p className="text-sm text-textSecondary leading-relaxed">
                  Random Forest & XGBoost models analyze habits to warn you before a task gets skipped.
                </p>
              </div>
            </div>

            {/* Service 3: Kairo assistant */}
            <div className="group relative h-[300px] service-card rounded-2xl border border-border bg-surface p-8 hover:bg-surfaceSecondary/50 hover:border-primary/30 animate-on-scroll">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(30,58,138,0.03)_0%,_transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
              <div className="flex flex-col h-full z-10 relative">
                <div className="icon-wrapper mb-6 w-12 h-12 rounded-lg bg-surfaceSecondary border border-border flex items-center justify-center text-textSecondary group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors duration-300">
                  <iconify-icon icon="solar:widget-linear" width="24" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-3">Conversational Coach</h3>
                <p className="text-sm text-textSecondary leading-relaxed">
                  Dialogue with Kairo to decompose massive goals into actionable daily time-blocks.
                </p>
              </div>
            </div>

            {/* Service 4: Vector Memory */}
            <div className="group relative h-[300px] service-card rounded-2xl border border-border bg-surface p-8 hover:bg-surfaceSecondary/50 hover:border-primary/30 animate-on-scroll">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(30,58,138,0.03)_0%,_transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
              <div className="flex flex-col h-full z-10 relative">
                <div className="icon-wrapper mb-6 w-12 h-12 rounded-lg bg-surfaceSecondary border border-border flex items-center justify-center text-textSecondary group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors duration-300">
                  <iconify-icon icon="solar:chart-square-linear" width="24" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-3">Vector Knowledge Vault</h3>
                <p className="text-sm text-textSecondary leading-relaxed">
                  Supabase PGVector embeddings allow you to query past notes and conversations semantically.
                </p>
              </div>
            </div>

            {/* Service 5: Focus & Habits */}
            <div className="group relative h-[300px] service-card rounded-2xl border border-border bg-surface p-8 hover:bg-surfaceSecondary/50 hover:border-primary/30 animate-on-scroll">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(30,58,138,0.03)_0%,_transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
              <div className="flex flex-col h-full z-10 relative">
                <div className="icon-wrapper mb-6 w-12 h-12 rounded-lg bg-surfaceSecondary border border-border flex items-center justify-center text-textSecondary group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors duration-300">
                  <iconify-icon icon="solar:shield-warning-linear" width="24" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-3">Habit & Focus Engine</h3>
                <p className="text-sm text-textSecondary leading-relaxed">
                  Pomodoro interface, smart ambient soundscapes, consistency scoring, and streak calendars.
                </p>
              </div>
            </div>

            {/* Service 6: Daily briefs */}
            <div className="group relative h-[300px] service-card rounded-2xl border border-border bg-surface p-8 hover:bg-surfaceSecondary/50 hover:border-primary/30 animate-on-scroll">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(30,58,138,0.03)_0%,_transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
              <div className="flex flex-col h-full z-10 relative">
                <div className="icon-wrapper mb-6 w-12 h-12 rounded-lg bg-surfaceSecondary border border-border flex items-center justify-center text-textSecondary group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors duration-300">
                  <iconify-icon icon="solar:star-bold" width="24" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-3">The Daily Briefing</h3>
                <p className="text-sm text-textSecondary leading-relaxed">
                  Morning summaries analyzing yesterday's stats, sleep correlations, and today's scheduling spots.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Marquee */}
      <section className="overflow-hidden bg-background border-border border-t py-24" id="testimonials">
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <div className="flex animate-on-scroll w-full items-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-text tracking-tight shrink-0">
              OS <span className="text-primary">Feedback</span>
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
                    JV
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">James Sullivan</div>
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
                    AL
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Anita Lee</div>
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
                    MR
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Mark Roberts</div>
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
                    JV
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">James Sullivan</div>
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
                    AL
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Anita Lee</div>
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
                    MR
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Mark Roberts</div>
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
                    ES
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Elena Sanchez</div>
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
                    DP
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">David Park</div>
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
                    SK
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Sarah Klein</div>
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
                    ES
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Elena Sanchez</div>
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
                    DP
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">David Park</div>
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
                    SK
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text">Sarah Klein</div>
                    <div className="text-xs text-muted">VP, Innovate Corp</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Contact Section */}
      <section id="contact" className="bg-[#FAFBFC] border-t border-border overflow-hidden relative z-10">
        {/* Grid contact layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 border-t border-border">
          <div className="lg:col-span-2 p-10 md:p-16 border-r border-border border-b lg:border-b-0 animate-on-scroll">
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-medium text-[#111827] mb-12 font-[Space_Grotesk] tracking-tight">
              Get in touch
              <br />
              <span className="border-b border-border pb-1 text-primary border-primary/30">
                with the team?
              </span>
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onEnterWorkspace();
              }}
              className="space-y-8 max-w-md"
            >
              <div className="group relative">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full bg-transparent border-b border-border py-4 text-text placeholder-muted focus:outline-none focus:border-primary transition-colors text-lg"
                  required
                />
              </div>
              <div className="group relative">
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full bg-transparent border-b border-border py-4 text-text placeholder-muted focus:outline-none focus:border-primary transition-colors text-lg"
                  required
                />
              </div>
              <div className="group relative">
                <textarea
                  rows={1}
                  placeholder="Feedback or Feature Requests"
                  className="w-full bg-transparent border-b border-border py-4 text-text placeholder-muted focus:outline-none focus:border-primary transition-colors text-lg resize-none"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="group flex items-center gap-4 text-[#111827] mt-8 hover:text-primary transition-colors pt-4"
              >
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <span className="uppercase tracking-widest text-xs font-semibold">Submit Feedback</span>
              </button>
            </form>
          </div>

          {/* Preserving middle address header casing details */}
          <div className="p-10 md:p-16 border-r border-border border-b lg:border-b-0 flex flex-col justify-end min-h-[400px] animate-on-scroll">
            <h4 className="text-lg font-semibold text-text font-[Space_Grotesk] mb-6">
              Saarathi Community
            </h4>
            <p className="leading-relaxed text-sm font-light text-textSecondary">
              Join our active community and help shape the future of AI-powered personal productivity systems.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Bar */}
      <footer className="bg-[#FAFBFC] border-t border-border px-6 py-10 z-20 relative">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <nav className="flex flex-wrap justify-center gap-8 text-[11px] font-bold uppercase tracking-widest text-textSecondary">
            <a href="#" className="hover:text-text transition-colors">
              Home
            </a>
            <a href="#about" className="hover:text-text transition-colors">
              About
            </a>
            <a href="#services" className="hover:text-text transition-colors">
              Features
            </a>
            <a href="#work" className="hover:text-text transition-colors">
              Ecosystem
            </a>
            <a href="#contact" className="hover:text-text transition-colors">
              Contact
            </a>
          </nav>
          <div className="text-[11px] text-muted tracking-wide font-medium">
            © 2026 Saarathi OS is Proudly Powered by{' '}
            <span className="text-textSecondary underline decoration-border hover:text-primary transition-colors cursor-pointer">
              Intelligence
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
