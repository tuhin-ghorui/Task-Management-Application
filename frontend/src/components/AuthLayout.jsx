import { CheckCircle2 } from "lucide-react";

const AuthLayout = ({ children, heading, subheading }) => {
  return (
    <main className="min-h-dvh bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left Branding Side Panel */}
        <section className="hidden bg-mesh-gradient px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between relative overflow-hidden">
          {/* Subtle light blobs in background */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/20 blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[100px]"></div>
          </div>

          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 animate-pulse-glow">
              <CheckCircle2 size={26} strokeWidth={2.5} />
            </div>
            <h1 className="mt-10 max-w-md text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              AuraTasks
            </h1>
            <p className="mt-2 text-lg text-emerald-400/90 font-medium">Real-Time Task Workspace</p>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300/90">
              A premium, focused environment designed to help teams and individuals streamline planning, track progress, and accomplish goals seamlessly.
            </p>
          </div>

          <div className="relative z-10 grid gap-4 text-sm text-slate-300">
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition hover:bg-white/10">
              <span className="font-semibold text-emerald-400 block mb-1">Secure & Private</span>
              JWT authentication secures your workspace and isolates your personal checklist.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 transition hover:bg-white/10">
              <span className="font-semibold text-indigo-400 block mb-1">Live Synchronization</span>
              Instantly reflects changes across all your open dashboard tabs via WebSocket sync.
            </div>
          </div>
        </section>

        {/* Right Form Side Panel */}
        <section className="flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
          {/* Subtle light blobs in background for light mode */}
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-50 dark:opacity-10">
            <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-emerald-200/40 dark:bg-emerald-800/10 blur-[80px]"></div>
            <div className="absolute bottom-[20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-indigo-200/40 dark:bg-indigo-800/10 blur-[80px]"></div>
          </div>

          <div className="w-full max-w-md relative z-10 animate-slide-up">
            <div className="mb-8 lg:hidden flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 dark:bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                <CheckCircle2 size={26} strokeWidth={2.5} />
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                AuraTasks
              </h1>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Real-Time Task Workspace</p>
            </div>

            <div className="rounded-2xl glass-panel p-6 shadow-soft sm:p-10 border border-slate-200/50 dark:border-white/10 transition-all duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{heading}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{subheading}</p>
              </div>
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthLayout;

