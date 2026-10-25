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
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, userRole = 'Admin' }) => {
  const isAdmin = userRole === 'Admin';

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'vouchers', label: 'Fee Vouchers', icon: Receipt },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'classes', label: 'Classes & Subjects', icon: GraduationCap },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const adminNav = isAdmin
    ? [
        { id: 'staff', label: 'Staff & Roles', icon: UserCog },
        { id: 'audit', label: 'Audit Trail', icon: History },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'backup', label: 'Backup & Export', icon: HardDriveDownload },
      ]
    : [];

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] text-slate-600 print:hidden">
      <div className="p-3 flex-1 space-y-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
            Academic Operations
          </div>
          <nav className="space-y-0.5">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {adminNav.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
              Administration
            </div>
            <nav className="space-y-0.5">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
            System
          </div>
          <nav className="space-y-0.5">
            <button
              onClick={() => onNavigate('tests')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                currentView === 'tests'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <CheckCircle className={`h-4 w-4 shrink-0 ${currentView === 'tests' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="truncate">Acceptance Tests</span>
            </button>
          </nav>
        </div>
      </div>
    </aside>
  );
};
