import { CheckCircle2 } from "lucide-react";

const AuthLayout = ({ children, heading, subheading }) => {
  return (
    <main className="min-h-dvh bg-slate-50">
      <div className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-400 text-slate-950">
              <CheckCircle2 size={24} strokeWidth={2.4} />
            </div>
            <h1 className="mt-8 max-w-md text-4xl font-semibold leading-tight">
              Task Management Application
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
              A focused workspace for planning, tracking, and completing team or personal tasks.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-300">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              JWT authentication keeps each workspace private.
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              Tasks are filtered by status, priority, due date, and search.
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-emerald-300">
                <CheckCircle2 size={24} strokeWidth={2.4} />
              </div>
              <h1 className="mt-5 text-3xl font-semibold text-slate-950">
                Task Management Application
              </h1>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
              <div className="mb-7">
                <h2 className="text-2xl font-semibold text-slate-950">{heading}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{subheading}</p>
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
