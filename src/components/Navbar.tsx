import React from 'react';
import { School, ExternalLink, LogOut } from 'lucide-react';
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
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Overview';
      case 'students':
        return 'Student Directory';
      case 'student-profile':
        return 'Student Profile';
      case 'vouchers':
        return 'Fee Vouchers';
      case 'printable-voucher':
        return 'Voucher Preview';
      case 'payments':
        return 'Payments & Receipts';
      case 'printable-receipt':
        return 'Receipt Preview';
      case 'attendance':
        return 'Attendance Register';
      case 'classes':
        return 'Classes & Subjects';
      case 'reports':
        return 'Financial Reports';
      case 'staff':
        return 'Staff & Permissions';
      case 'audit':
        return 'Audit Logs';
      case 'settings':
        return 'Academy Settings';
      case 'backup':
        return 'Backup & Export';
      case 'tests':
        return 'Acceptance Tests';
      default:
        return 'Administration';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 print:hidden shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <School className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm tracking-tight">AcademyPro</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold text-slate-600">{getViewTitle()}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-md">
                {settings?.academyName || 'The Falcon Academy'}
              </p>
            </div>
          </div>

          {/* Right Actions: Public Student Portal Link & User Info */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenPortal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
              title="Open public Student Self-Service Voucher Portal"
            >
              <span>Public Student Portal</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {currentUser && (
              <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-slate-900 truncate max-w-[150px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {currentUser.role}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ml-1"
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
