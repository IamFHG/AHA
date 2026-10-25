import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StudentDirectoryView } from './components/StudentDirectoryView';
import { StudentAdmissionModal } from './components/StudentAdmissionModal';
import { StudentProfileView } from './components/StudentProfileView';
import { FeeManagementView } from './components/FeeManagementView';
import { PrintableVoucherView } from './components/PrintableVoucherView';
import { PaymentManagementView } from './components/PaymentManagementView';
import { PrintableReceiptView } from './components/PrintableReceiptView';
import { AttendanceView } from './components/AttendanceView';
import { ClassesSubjectsView } from './components/ClassesSubjectsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { StaffManagementView } from './components/StaffManagementView';
import { AuditLogView } from './components/AuditLogView';
import { BackupExportView } from './components/BackupExportView';
import { AcceptanceTestsView } from './components/AcceptanceTestsView';
import { PublicStudentPortal } from './components/PublicStudentPortal';
import { api } from './services/api';
import { UserAccount, AcademySettings, AcademicClass, Subject, AcademicSession } from './types';
import { LogIn, School, ShieldCheck } from 'lucide-react';

export default function App() {
  // Current user & settings
  const [currentUser, setCurrentUser] = useState<UserAccount | null>({
    id: 'u1',
    username: 'admin',
    name: 'Dr. Tariq Mahmood (Principal)',
    role: 'Admin',
    active: true,
    permissions: {
      canManageStudents: true,
      canGenerateVouchers: true,
      canRecordPayments: true,
      canMarkAttendance: true,
      canViewReports: true,
      canManageSettings: true,
      canPerformCorrections: true,
    },
  });

  const [settings, setSettings] = useState<AcademySettings | null>(null);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);

  // Navigation state
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [viewParams, setViewParams] = useState<Record<string, any>>({});

  // Modals state
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [targetVoucherForPayment, setTargetVoucherForPayment] = useState<string | undefined>(undefined);
  const [targetStudentForVoucher, setTargetStudentForVoucher] = useState<string | undefined>(undefined);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loadInitialData = async () => {
    try {
      const [sets, cls, subs, sess] = await Promise.all([
        api.getSettings(),
        api.getClasses(),
        api.getSubjects(),
        api.getSessions(),
      ]);
      setSettings(sets);
      setClasses(cls);
      setSubjects(subs);
      setSessions(sess);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleNavigate = (view: string, extra?: Record<string, any>) => {
    setCurrentView(view);
    setViewParams(extra || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await api.login(loginUsername, loginPassword);
      setCurrentUser(res.user);
      setCurrentView('dashboard');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('portal'); // Redirect to public student portal
  };

  // If in public portal view, render the dedicated Student Fee Voucher Portal
  if (currentView === 'portal') {
    return <PublicStudentPortal onBackToAdmin={() => setCurrentView('dashboard')} />;
  }

  // If unauthenticated and not in portal view, show clean login form
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-750">
          <div className="bg-gradient-to-tr from-slate-900 to-emerald-950 p-8 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
              <School className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">AcademyPro</h1>
            <p className="text-xs text-slate-300 mt-1">Authorized Administration & Staff Login</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="p-8 space-y-4 text-xs sm:text-sm">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                {loginError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition text-xs sm:text-sm"
            >
              {isLoggingIn ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setCurrentView('portal')}
                className="text-emerald-600 hover:underline font-semibold"
              >
                Go to Student Portal →
              </button>
              <span>Default: admin / admin123</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        settings={settings}
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenPortal={() => setCurrentView('portal')}
        onLogout={handleLogout}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          userRole={currentUser.role}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Dashboard */}
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onOpenAdmissionModal={() => setIsAdmissionModalOpen(true)}
              onOpenRecordPaymentModal={(voucherId) => {
                setTargetVoucherForPayment(voucherId);
                handleNavigate('payments');
              }}
              onOpenVoucher={(voucherId) => handleNavigate('printable-voucher', { voucherId })}
              onOpenReceipt={(paymentId) => handleNavigate('printable-receipt', { paymentId })}
            />
          )}

          {/* Student Directory */}
          {currentView === 'students' && (
            <StudentDirectoryView
              classes={classes}
              sessions={sessions}
              onOpenAdmissionModal={() => setIsAdmissionModalOpen(true)}
              onOpenProfile={(id) => handleNavigate('student-profile', { studentId: id })}
              onOpenNewVoucher={(id) => {
                setTargetStudentForVoucher(id);
                handleNavigate('vouchers', { preselectedStudentId: id });
              }}
              onOpenRecordPayment={(id) => {
                handleNavigate('payments', { preselectedStudentId: id });
              }}
            />
          )}

          {/* Student Dedicated Profile */}
          {currentView === 'student-profile' && viewParams.studentId && (
            <StudentProfileView
              studentId={viewParams.studentId}
              onBack={() => handleNavigate('students')}
              onOpenVoucher={(voucherId) => handleNavigate('printable-voucher', { voucherId })}
              onOpenReceipt={(paymentId) => handleNavigate('printable-receipt', { paymentId })}
              onOpenGenerateVoucher={(id) => handleNavigate('vouchers', { preselectedStudentId: id })}
              onOpenRecordPayment={(voucherId) => handleNavigate('payments', { preselectedVoucherId: voucherId })}
            />
          )}

          {/* Fee Management & Vouchers */}
          {currentView === 'vouchers' && (
            <FeeManagementView
              classes={classes}
              preselectedStudentInternalId={viewParams.preselectedStudentId}
              onOpenVoucher={(voucherId) => handleNavigate('printable-voucher', { voucherId })}
              onOpenRecordPayment={(voucherId) => handleNavigate('payments', { preselectedVoucherId: voucherId })}
            />
          )}

          {/* Printable Official Voucher View */}
          {currentView === 'printable-voucher' && viewParams.voucherId && (
            <PrintableVoucherView
              voucherId={viewParams.voucherId}
              onBack={() => handleNavigate('vouchers')}
              onRecordPayment={(vId) => handleNavigate('payments', { preselectedVoucherId: vId })}
            />
          )}

          {/* Payments & Receipts */}
          {currentView === 'payments' && (
            <PaymentManagementView
              preselectedVoucherId={viewParams.preselectedVoucherId}
              preselectedStudentInternalId={viewParams.preselectedStudentId}
              onOpenReceipt={(paymentId) => handleNavigate('printable-receipt', { paymentId })}
            />
          )}

          {/* Printable Official Receipt View */}
          {currentView === 'printable-receipt' && viewParams.paymentId && (
            <PrintableReceiptView
              paymentId={viewParams.paymentId}
              onBack={() => handleNavigate('payments')}
            />
          )}

          {/* Attendance */}
          {currentView === 'attendance' && (
            <AttendanceView classes={classes} />
          )}

          {/* Classes, Subjects & Sessions */}
          {currentView === 'classes' && (
            <ClassesSubjectsView
              classes={classes}
              subjects={subjects}
              sessions={sessions}
              onRefresh={loadInitialData}
            />
          )}

          {/* Reports & Analytics */}
          {currentView === 'reports' && (
            <ReportsView classes={classes} />
          )}

          {/* Staff & Roles */}
          {currentView === 'staff' && (
            <StaffManagementView />
          )}

          {/* Audit Logs */}
          {currentView === 'audit' && (
            <AuditLogView />
          )}

          {/* Academy Settings */}
          {currentView === 'settings' && (
            <SettingsView />
          )}

          {/* Backup & Export */}
          {currentView === 'backup' && (
            <BackupExportView />
          )}

          {/* Acceptance Tests Runner */}
          {currentView === 'tests' && (
            <AcceptanceTestsView />
          )}
        </main>
      </div>

      {/* Student Admission Modal */}
      <StudentAdmissionModal
        isOpen={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
        classes={classes}
        subjects={subjects}
        sessions={sessions}
        onStudentCreated={(newStudent) => {
          handleNavigate('student-profile', { studentId: newStudent.id });
        }}
      />
    </div>
  );
}
