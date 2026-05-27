/**
 * SplitDay – Home Screen (Phase 1 placeholder)
 *
 * Phase 4 will replace this with the full interactive home form.
 * For now it renders a branded loading state to confirm the app boots.
 */
export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full mx-auto animate-fade-in-up">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
               style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"
                 className="w-8 h-8">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H9l3-3 3 3h-2v4z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">SplitDay</h1>
          <p className="text-gray-400 text-sm">
            Group expenses, simplified.
          </p>
        </div>

        {/* Phase 1 status card */}
        <div className="glass-card p-6 text-center">
          <div className="text-emerald-400 font-semibold text-sm mb-1 uppercase tracking-widest">
            Phase 1 Complete
          </div>
          <p className="text-gray-300 text-sm">
            Database models &amp; backend infrastructure ready.
            <br />
            Awaiting Phase 2 approval to build API routes.
          </p>
        </div>
      </div>
    </main>
  );
}
