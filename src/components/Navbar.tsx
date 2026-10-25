import React from 'react';
import { School, User, ExternalLink, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';
import { UserAccount, AcademySettings } from '../types';

interface NavbarProps {
  currentUser: UserAccount | null;
  settings: AcademySettings | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenPortal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  currentView,
  onNavigate,
  onOpenPortal,
  onLogout,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Academy Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <School className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">AcademyPro</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  v2.0 • Pakistan
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[240px] sm:max-w-sm">
                {settings?.academyName || 'The Falcon Academy of Science & Arts'}
              </p>
            </div>
          </div>

          {/* Center Navigation Shortcuts / Mode indicator */}
          <div className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentView === 'dashboard'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('students')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentView === 'students'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => onNavigate('vouchers')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentView === 'vouchers'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Fee Vouchers
            </button>
            <button
              onClick={() => onNavigate('payments')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentView === 'payments'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                currentView === 'reports'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Reports
            </button>
          </div>

          {/* Right Actions: Public Portal Link & User Info */}
          <div className="flex items-center space-x-3">
            {/* Public Student Portal Link */}
            <button
              onClick={onOpenPortal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
              title="Open the public Student Self-Service Voucher Portal"
            >
              <span>Student Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>

            {/* User Account / Role Badge */}
            {currentUser && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-750">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-medium text-white truncate max-w-[140px]">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center justify-end space-x-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
