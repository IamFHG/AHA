import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Receipt,
  CreditCard,
  CalendarCheck,
  BarChart3,
  UserCog,
  History,
  Settings,
  HardDriveDownload,
  CheckCircle,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, userRole = 'Admin' }) => {
  const isAdmin = userRole === 'Admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Directory', icon: Users },
    { id: 'classes', label: 'Classes & Subjects', icon: GraduationCap },
    { id: 'vouchers', label: 'Fee Vouchers', icon: Receipt },
    { id: 'payments', label: 'Payments & Receipts', icon: CreditCard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    ...(isAdmin
      ? [
          { id: 'staff', label: 'Staff & Roles', icon: UserCog },
          { id: 'audit', label: 'Audit Logs', icon: History },
          { id: 'settings', label: 'Academy Settings', icon: Settings },
          { id: 'backup', label: 'Backup & Export', icon: HardDriveDownload },
        ]
      : []),
    { id: 'tests', label: 'Acceptance Tests', icon: CheckCircle },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] text-slate-300 print:hidden">
      <div className="p-4 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
          Management
        </div>
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 m-3 rounded-xl border">
        <div className="text-xs font-semibold text-slate-200">AcademyPro Engine</div>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          Prorated admission calculations, whole PKR currency, and official voucher engine.
        </p>
      </div>
    </aside>
  );
};
