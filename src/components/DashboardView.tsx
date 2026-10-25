import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  CreditCard,
  Receipt,
  AlertCircle,
  Clock,
  ArrowUpRight,
  PlusCircle,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { formatPKR } from '../utils/feeCalculator';
import { DashboardStats, Student, Payment, FeeVoucher } from '../types';

interface DashboardViewProps {
  onNavigate: (view: string, extra?: any) => void;
  onOpenAdmissionModal: () => void;
  onOpenRecordPaymentModal: (voucherId?: string) => void;
  onOpenVoucher: (voucherId: string) => void;
  onOpenReceipt: (paymentId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAdmissionModal,
  onOpenRecordPaymentModal,
  onOpenVoucher,
  onOpenReceipt,
}) => {
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAdmissions, setRecentAdmissions] = useState<Student[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [upcomingDueDates, setUpcomingDueDates] = useState<FeeVoucher[]>([]);
  const [classDistribution, setClassDistribution] = useState<{ name: string; count: number }[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<{ monthStr: string; generated: number; collected: number }[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboard(month, year);
      setStats(data.stats);
      setRecentAdmissions(data.recentAdmissions);
      setRecentPayments(data.recentPayments);
      setUpcomingDueDates(data.upcomingDueDates);
      setClassDistribution(data.classDistribution);
      setMonthlyTrends(data.monthlyTrends);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month, year]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time financial, admission, and fee collection overview calculated from database records.
          </p>
        </div>

        {/* Month & Year Filter */}
        <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <Calendar className="h-4 w-4 text-slate-500 ml-2" />
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-transparent text-sm font-semibold text-slate-800 border-none focus:ring-0 cursor-pointer"
          >
            {monthNames.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent text-sm font-semibold text-slate-800 border-none focus:ring-0 cursor-pointer"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
          <button
            onClick={loadData}
            title="Refresh statistics"
            className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-600 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          onClick={onOpenAdmissionModal}
          className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Admission</span>
        </button>
        <button
          onClick={() => onNavigate('students')}
          className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Users className="h-4 w-4 text-slate-500" />
          <span>Student Directory</span>
        </button>
        <button
          onClick={() => onNavigate('vouchers')}
          className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Receipt className="h-4 w-4 text-emerald-600" />
          <span>Generate Vouchers</span>
        </button>
        <button
          onClick={() => onOpenRecordPaymentModal()}
          className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <CreditCard className="h-4 w-4 text-blue-600" />
          <span>Record Payment</span>
        </button>
        <button
          onClick={() => onNavigate('reports')}
          className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <FileSpreadsheet className="h-4 w-4 text-purple-600" />
          <span>View Reports</span>
        </button>
        <button
          onClick={() => onNavigate('tests')}
          className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Acceptance Tests</span>
        </button>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fees Generated This Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fees Generated</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatPKR(stats?.feesGeneratedThisMonth || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
              <span>For {monthNames[(month || 1) - 1]} {year}</span>
            </p>
          </div>
        </div>

        {/* Payments Collected This Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Collections (Cash/Bank)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-900">
              {formatPKR(stats?.paymentsCollectedThisMonth || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Successful payments received in this month
            </p>
          </div>
        </div>

        {/* Total Outstanding Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Outstanding</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-900">
              {formatPKR(stats?.totalOutstandingBalance || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real unpaid voucher balances remaining
            </p>
          </div>
        </div>

        {/* Active Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Students</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">{stats?.activeStudents || 0}</span>
              <span className="text-xs text-slate-500">active of {stats?.totalStudents || 0} total</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.recentlyAdmittedCount || 0} admitted in last 30 days
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metric Badges: Student Status & Voucher Status Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <div className="text-xs text-slate-500">Active Students</div>
          <div className="text-lg font-bold text-emerald-600 mt-0.5">{stats?.activeStudents || 0}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <div className="text-xs text-slate-500">Withdrawn</div>
          <div className="text-lg font-bold text-rose-600 mt-0.5">{stats?.withdrawnStudents || 0}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <div className="text-xs text-slate-500">Inactive/Completed</div>
          <div className="text-lg font-bold text-slate-600 mt-0.5">
            {(stats?.inactiveStudents || 0) + (stats?.completedStudents || 0)}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <div className="text-xs text-slate-500">Unpaid Vouchers</div>
          <div className="text-lg font-bold text-amber-600 mt-0.5">{stats?.unpaidVouchersCount || 0}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <div className="text-xs text-slate-500">Partially Paid</div>
          <div className="text-lg font-bold text-blue-600 mt-0.5">{stats?.partiallyPaidVouchersCount || 0}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <div className="text-xs text-slate-500">Overdue Vouchers</div>
          <div className="text-lg font-bold text-red-600 mt-0.5">{stats?.overdueVouchersCount || 0}</div>
        </div>
      </div>

      {/* Charts & Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Bars */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Financial Trends (Last 6 Months)</h2>
              <p className="text-xs text-slate-500">Comparing total voucher fees generated vs actual collected payments</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                <span className="text-slate-600">Generated</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>
                <span className="text-slate-600">Collected</span>
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {monthlyTrends.map((trend, i) => {
              const maxVal = Math.max(...monthlyTrends.map(t => Math.max(t.generated, t.collected)), 1000);
              const genPercent = Math.min(100, Math.round((trend.generated / maxVal) * 100));
              const colPercent = Math.min(100, Math.round((trend.collected / maxVal) * 100));

              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{trend.monthStr}</span>
                    <div className="space-x-3 font-mono text-[11px]">
                      <span className="text-emerald-700">Gen: {formatPKR(trend.generated)}</span>
                      <span className="text-blue-700">Col: {formatPKR(trend.collected)}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${genPercent}%` }}
                      ></div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${colPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Class Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Class Enrolment</h2>
            <p className="text-xs text-slate-500 mb-4">Active students by enrolled class/grade</p>

            <div className="space-y-3">
              {classDistribution.map((item, idx) => {
                const total = stats?.activeStudents || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate pr-2">{item.name}</span>
                      <span className="font-semibold text-slate-900 shrink-0">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {classDistribution.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">No active students enrolled.</div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('classes')}
            className="w-full mt-4 py-2 text-center text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
          >
            Manage Classes & Subjects →
          </button>
        </div>
      </div>

      {/* Tables Row: Recent Admissions & Recent Payments & Upcoming Due Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Student Admissions</h2>
              <p className="text-xs text-slate-500">Newly registered students and their admission fee</p>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View All ({stats?.totalStudents}) →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Student ID</th>
                  <th className="py-2.5 px-3 font-semibold">Name</th>
                  <th className="py-2.5 px-3 font-semibold">Class</th>
                  <th className="py-2.5 px-3 font-semibold">Admission Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Adm. Fee</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAdmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-semibold text-emerald-700">{s.studentId}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{s.fullName}</td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-[120px]">{s.className}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.admissionDate}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 text-right">
                      {formatPKR(s.admissionMonthFee)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onNavigate('student-profile', { studentId: s.id })}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-800"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
                {recentAdmissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">No admissions recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Payment Transactions</h2>
              <p className="text-xs text-slate-500">Collected fees with verified receipt numbers</p>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              All Payments →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Receipt #</th>
                  <th className="py-2.5 px-3 font-semibold">Student</th>
                  <th className="py-2.5 px-3 font-semibold">Method</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">{p.receiptNumber}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 truncate max-w-[120px]">{p.studentName}</td>
                    <td className="py-2.5 px-3 text-slate-500">{p.paymentMethod}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700 text-right">
                      {formatPKR(p.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onOpenReceipt(p.id)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                      >
                        Print Slip
                      </button>
                    </td>
                  </tr>
                ))}
                {recentPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">No payment transactions recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upcoming Due Dates Banner */}
      {upcomingDueDates.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900">Upcoming Voucher Due Dates & Pending Balances</h3>
            </div>
            <button
              onClick={() => onNavigate('vouchers')}
              className="text-xs font-semibold text-amber-800 hover:underline"
            >
              Open Voucher Register →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {upcomingDueDates.slice(0, 3).map((v) => (
              <div key={v.id} className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-xs">{v.studentName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{v.voucherNumber} • Due: {v.dueDate}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-700">{formatPKR(v.remainingBalance)}</div>
                  <button
                    onClick={() => onOpenVoucher(v.id)}
                    className="text-[10px] text-emerald-600 font-semibold hover:underline"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
