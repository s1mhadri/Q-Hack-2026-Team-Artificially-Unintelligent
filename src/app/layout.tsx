import type { Metadata } from "next";
import "./globals.css";
import SideNav from "./side-nav";

export const metadata: Metadata = {
  title: "Agnes | Procurement Intelligence",
  description: "AI-powered supplier consolidation engine for procurement teams.",
};

const STEPS = [
  { label: "Selection", num: 1 },
  { label: "Requirements", num: 2 },
  { label: "Verification", num: 3 },
  { label: "Decision", num: 4 },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="light">
      <body className="bg-background text-on-background antialiased flex min-h-screen">
        <SideNav />

        {/* Main content */}
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          {/* Topbar */}
          <header className="flex justify-between items-center w-full px-8 py-4 h-16 sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
            <div className="flex items-center gap-8">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">search</span>
                <input
                  className="bg-surface-container-high border-none rounded-lg pl-9 pr-4 py-1.5 w-64 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
                  placeholder="Search procurement data..."
                  type="text"
                />
              </div>
              <nav className="hidden md:flex items-center gap-6">
                {["Dashboard", "Inventory", "Suppliers", "Reports"].map((item, i) => (
                  <a
                    key={item}
                    href="#"
                    className={`text-sm font-medium transition-colors ${
                      i === 0
                        ? "text-slate-900 border-b-2 border-slate-600 pb-0.5"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">
                notifications
              </span>
              <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">
                history
              </span>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant/20 flex items-center justify-center text-xs font-bold text-on-surface-variant">
                AP
              </div>
            </div>
          </header>

          <main className="flex-1 p-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-surface-container bg-white px-8 py-4 sticky bottom-0 z-20">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <span className="text-xs font-bold text-on-surface-variant flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary inline-block" />
                Agnes Engine · Active
              </span>
              <div className="flex items-center gap-3">
                <button className="px-5 py-2 rounded-lg text-sm font-bold text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container transition-all">
                  Save Progress
                </button>
                <button className="primary-gradient text-on-primary px-7 py-2 rounded-lg text-sm font-bold shadow-lg hover:opacity-90 transition-all">
                  Execute Decision
                </button>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
