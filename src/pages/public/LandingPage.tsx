/**
 * @file src/pages/public/LandingPage.tsx
 * @description Public marketing homepage rendered for unauthenticated visitors on the root route.
 *
 * Sections:
 * 1. Responsive navigation bar (Home, Features, How It Works, About, Login, Get Started).
 * 2. Hero with headline, supporting copy, CTAs and a static dashboard preview.
 * 3. Feature grid describing capabilities that exist in the current codebase.
 * 4. Step-by-step student workflow.
 * 5. Student / administrator role information.
 * 6. Final call to action and footer.
 *
 * Routing: this page only renders when the visitor is unauthenticated. Authenticated
 * students and administrators are redirected to their dashboards by App.tsx before
 * this component is reached.
 */

import React from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  FileText,
  GraduationCap,
  LucideIcon,
  MessageSquare,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RouteId } from '@/types';
import { LandingNavbar } from './landing/LandingNavbar';
import { LandingFooter } from './landing/LandingFooter';
import { DashboardPreview } from './landing/DashboardPreview';

interface LandingPageProps {
  onNavigate: (route: RouteId) => void;
}

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface WorkflowStep {
  title: string;
  description: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: BookOpen,
    title: 'Digital Daily Logbook',
    description:
      'Record every working day of your placement with a focus area, a detailed work description, and the equipment and tools you handled.',
  },
  {
    icon: FileText,
    title: 'Weekly Reports and Submission',
    description:
      'Compile Monday to Friday into one weekly report, review your entries, confirm your declaration, and submit the week for supervisor review.',
  },
  {
    icon: User,
    title: 'Student SIWES Profile',
    description:
      'Keep your personal and academic details, matriculation number, placement organisation, and SIWES commencement and completion dates together.',
  },
  {
    icon: MessageSquare,
    title: 'Supervisor Review and Feedback',
    description:
      'Authorised administrators inspect each submitted week, approve it, or return it with remarks and clear correction requests.',
  },
  {
    icon: Bell,
    title: 'Notifications and Status Updates',
    description:
      'Stay informed with in-app notifications, unread badges, and status banners whenever a report is submitted, returned, or endorsed.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Student and Admin Access',
    description:
      'Supabase authentication and role-based route guards keep students on their own records and administrators on review tools.',
  },
];

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    title: 'Sign in to your account',
    description:
      'Your account is created by your SIWES administrator. Sign in with the institutional email address issued to you.',
  },
  {
    title: 'Complete your student and placement details',
    description:
      'Fill in your personal and academic information, then record your organisation and SIWES commencement and completion dates.',
  },
  {
    title: 'Record your daily industrial training activities',
    description:
      'Each working day, log what you worked on, the procedures you followed, and the equipment you used.',
  },
  {
    title: 'Organise and submit your weekly report',
    description:
      'Review the five compiled days, confirm your declaration, and submit the week for supervisor review.',
  },
  {
    title: 'Check your report status and feedback',
    description:
      'Follow each week through draft, submitted, approved, or returned, and read the remarks left by your supervisor.',
  },
];

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div
      id="landing-page"
      className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased"
    >
      <LandingNavbar onNavigate={onNavigate} />

      <main id="landing-main-content" className="flex-1">
        {/* HERO */}
        <section id="home" className="relative overflow-hidden scroll-mt-16 bg-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-28 -right-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl"
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="animate-fade-up">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                Digital SIWES Logbook
              </p>

              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-slate-900">
                Your SIWES Journey,{' '}
                <span className="text-emerald-700">Organised Digitally.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-slate-600">
                Record your industrial training activities, organise your weekly logbook, submit
                reports, and receive supervisor feedback through one convenient digital platform.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button variant="primary" size="lg" onClick={() => onNavigate('login')}>
                  Get Started
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => scrollToSection('features')}>
                  Explore Features
                </Button>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Student accounts are provisioned by your SIWES administrator. Select Get Started to
                sign in.
              </p>
            </div>

            <div className="animate-fade-up-delay">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="scroll-mt-16 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                Features
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Everything your logbook needs, in one place.
              </h2>
              <p className="mt-3 text-base text-slate-600">
                The platform covers the full weekly cycle of a SIWES placement, from the first daily
                entry to the supervisor&apos;s final remark.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-150 hover:border-slate-300 hover:shadow-sm"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-emerald-400 transition-colors duration-150 group-hover:bg-emerald-700 group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-base font-semibold text-slate-900">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="scroll-mt-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  How It Works
                </p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  Five simple steps, every week.
                </h2>
                <p className="mt-3 text-base text-slate-600">
                  The student workflow follows the same weekly rhythm as the physical logbook, with
                  submission and feedback handled entirely online.
                </p>
                <div className="mt-6">
                  <Button variant="outline" size="md" onClick={() => onNavigate('login')}>
                    Sign In
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <ol className="lg:col-span-8 space-y-4">
                {WORKFLOW_STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-colors duration-150 hover:border-slate-300"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">
                        {step.title}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                        {step.description}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ABOUT / ROLES */}
        <section id="about" className="scroll-mt-16 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                About
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Two roles, one shared logbook.
              </h2>
              <p className="mt-3 text-base text-slate-600">
                The SIWES Digital Logbook replaces the paper logbook with a structured online record
                of an industrial training placement. Students maintain their own entries, while
                authorised administrators review what has been submitted.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-emerald-400">
                  <GraduationCap className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">For Students</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  You manage your own profile, daily logbook, and weekly submissions. Each week
                  moves through a clear status, and any remarks or correction requests from your
                  supervisor stay attached to the report they refer to.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  For Administrators and Supervisors
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Authorised administrators receive submitted weekly reports, review the recorded
                  activities, and respond with approval, remarks, or a request for correction. Only
                  signed-in administrators can access these review tools.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section id="get-started" className="scroll-mt-16 bg-slate-950">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Ready to Organise Your SIWES Experience?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Sign in to open your logbook, record this week&apos;s activities, and keep your
              submissions and feedback in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button variant="secondary" size="lg" onClick={() => onNavigate('login')}>
                Get Started
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
              <a
                href="#features"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-white/30 bg-transparent px-5 py-2.5 text-base font-semibold text-white transition-colors duration-150 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Explore Features
              </a>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
};
