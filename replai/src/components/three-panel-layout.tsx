type PanelProps = {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

function Panel({ eyebrow, title, children }: PanelProps) {
  return (
    <section className="flex min-h-[260px] flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/75">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
          Live
        </span>
      </div>
      {children}
    </section>
  );
}

export function ThreePanelLayout() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.18),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#062e22_50%,_#02110b_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-4 rounded-[32px] border border-white/10 bg-black/20 p-4 shadow-2xl shadow-emerald-950/30 lg:p-5">
        <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-emerald-200/70">
              Replai Control Room
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Interview Copilot Dashboard
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-white/45">Latency</p>
              <p className="mt-1 font-semibold text-emerald-200">128 ms</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-white/45">Mic</p>
              <p className="mt-1 font-semibold text-emerald-100">Active</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-white/45">Confidence</p>
              <p className="mt-1 font-semibold text-emerald-100">92%</p>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-4 xl:grid-cols-[1.15fr_1fr_0.8fr]">
          <Panel eyebrow="Camera" title="Candidate View">
            <div className="relative flex flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,_rgba(17,24,39,0.95),_rgba(6,78,59,0.8))]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.18),_transparent_40%)]" />
              <div className="relative flex flex-1 items-center justify-center p-6">
                <div className="aspect-[4/5] w-full max-w-sm rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(15,23,42,0.65),_rgba(20,83,45,0.24))] p-4 shadow-inner shadow-black/30">
                  <div className="flex h-full items-end rounded-[22px] border border-emerald-300/20 bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.18),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.55),_rgba(2,6,23,0.88))] p-4">
                    <div className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/60">
                        Framing
                      </p>
                      <p className="mt-1 text-sm text-white/80">
                        Face centered, lighting stable, eye contact locked.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Conversation" title="Live Transcript">
            <div className="flex flex-1 flex-col gap-3">
              <article className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/70">
                  Interviewer
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-100">
                  Walk me through a time you had to recover a feature that was
                  failing under pressure.
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
                  Candidate
                </p>
                <p className="mt-2 text-sm leading-7 text-white/78">
                  I start by isolating the failure path, shrinking the blast
                  radius, and communicating tradeoffs before touching the fix.
                </p>
              </article>
              <article className="flex-1 rounded-2xl border border-dashed border-white/10 bg-black/15 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/70">
                  Suggested Reply
                </p>
                <p className="mt-2 text-sm leading-7 text-white/72">
                  Anchor the story around ownership, diagnosis speed, and the
                  measurable outcome after the rollback or patch shipped.
                </p>
              </article>
            </div>
          </Panel>

          <Panel eyebrow="Metrics" title="Performance Signals">
            <div className="flex flex-1 flex-col gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Speech Pace</span>
                  <span className="text-sm font-semibold text-emerald-200">
                    Ideal
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/8">
                  <div className="h-2 w-[68%] rounded-full bg-emerald-300" />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Keyword Match</span>
                  <span className="text-sm font-semibold text-emerald-100">
                    14 / 18
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/8">
                  <div className="h-2 w-[78%] rounded-full bg-emerald-300" />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-white/60">Focus Notes</p>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  <li>Quantify the impact in dollars or time saved.</li>
                  <li>Close with what changed in the process afterward.</li>
                  <li>Keep pauses under two seconds between examples.</li>
                </ul>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
