import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Receipt,
  AlertCircle,
  PlusCircle,
  Calendar,
  RefreshCw,
  ArrowRight,
  TrendingUp,
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
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAdmissions, setRecentAdmissions] = useState<Student[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [upcomingDueDates, setUpcomingDueDates] = useState<FeeVoucher[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<{ monthStr: string; generated: number; collected: number }[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboard(month, year);
      setStats(data.stats);
      setRecentAdmissions(data.recentAdmissions);
      setRecentPayments(data.recentPayments);
      setUpcomingDueDates(data.upcomingDueDates);
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial status, admissions, and collections for {monthNames[month - 1]} {year}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Month/Year Picker */}
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent font-medium text-slate-700 cursor-pointer focus:outline-hidden"
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
              className="bg-transparent font-medium text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
            <button
              onClick={loadData}
              title="Refresh"
              className="text-slate-400 hover:text-slate-600 transition pl-1 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Key Primary Actions */}
          <button
            onClick={onOpenAdmissionModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>New Admission</span>
          </button>
          <button
            onClick={() => onOpenRecordPaymentModal()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <CreditCard className="h-3.5 w-3.5 text-slate-500" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 4 Core High-Level Metric Tiles (Clean & Uncluttered) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fees Generated */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Fees Generated ({monthNames[month - 1]})</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight font-mono">
            {formatPKR(stats?.feesGeneratedThisMonth || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
            <span>{stats?.unpaidVouchersCount || 0} unpaid</span>
            <span>·</span>
            <span>{stats?.partiallyPaidVouchersCount || 0} partial</span>
          </div>
        </div>

        {/* Collections Realized */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Verified Collections</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tracking-tight font-mono">
            {formatPKR(stats?.paymentsCollectedThisMonth || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Deposited & verified payments
          </div>
        </div>

        {/* Outstanding Unpaid Dues */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Total Outstanding Balance</div>
          <div className="text-2xl font-bold text-amber-700 mt-1 tracking-tight font-mono">
            {formatPKR(stats?.totalOutstandingBalance || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats?.overdueVouchersCount || 0} vouchers overdue
          </div>
        </div>

        {/* Total Enrolled Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500">Active Students</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight font-mono">
            {stats?.activeStudents || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
            <span>{stats?.totalStudents || 0} registered</span>
            <span>·</span>
            <span>{stats?.withdrawnStudents || 0} withdrawn</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: 6-Month Collections Trend & Recent Admissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Collections vs. Generated Fees</h2>
                <p className="text-[11px] text-slate-500">Six-month comparison of issued vouchers vs settled cash</p>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-600">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 inline-block"></span>
                  <span className="text-[11px]">Generated</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block"></span>
                  <span className="text-[11px]">Collected</span>
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {monthlyTrends.map((t, i) => {
                const max = Math.max(...monthlyTrends.map(x => Math.max(x.generated, x.collected)), 1000);
                const gPct = Math.min(100, Math.round((t.generated / max) * 100));
                const cPct = Math.min(100, Math.round((t.collected / max) * 100));

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{t.monthStr}</span>
                      <div className="space-x-3 font-mono text-[11px]">
                        <span className="text-slate-600">Gen: {formatPKR(t.generated)}</span>
                        <span className="font-semibold text-emerald-700">Col: {formatPKR(t.collected)}</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="w-full bg-slate-100 rounded-sm h-2 overflow-hidden">
                        <div className="bg-slate-800 h-2 rounded-sm" style={{ width: `${gPct}%` }}></div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-sm h-1.5 overflow-hidden">
                        <div className="bg-emerald-600 h-1.5 rounded-sm" style={{ width: `${cPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Admissions */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Admissions</h2>
                <p className="text-[11px] text-slate-500">Newly enrolled students and prorated admission fees</p>
              </div>
              <button
                onClick={() => onNavigate('students')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
              >
                <span>Directory</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {recentAdmissions.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {s.fullName} <span className="font-mono text-slate-400 font-normal">({s.studentId})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {s.className} · Admitted {s.admissionDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900 font-mono">{formatPKR(s.admissionMonthFee)}</div>
                    <button
                      onClick={() => onNavigate('student-profile', { studentId: s.id })}
                      className="text-[11px] text-emerald-700 hover:underline cursor-pointer font-medium"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              ))}
              {recentAdmissions.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">No recent admissions.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Pending Balances & Recent Collections */}
        <div className="space-y-6">
          {/* Upcoming Due Dates */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Pending Dues</h2>
                <p className="text-[11px] text-slate-500">Vouchers with outstanding balances</p>
              </div>
              <button
                onClick={() => onNavigate('vouchers')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
              >
                <span>All Vouchers</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2">
              {upcomingDueDates.slice(0, 4).map((v) => (
                <div key={v.id} className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 truncate max-w-[140px]">{v.studentName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{v.voucherNumber} · Due {v.dueDate}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900 font-mono">{formatPKR(v.remainingBalance)}</div>
                    <button
                      onClick={() => onOpenVoucher(v.id)}
                      className="text-[11px] text-emerald-700 hover:underline cursor-pointer font-medium"
                    >
                      View Slip
                    </button>
                  </div>
                </div>
              ))}
              {upcomingDueDates.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">No pending dues.</div>
              )}
            </div>
          </div>

          {/* Recent Collections */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Receipts</h2>
                <p className="text-[11px] text-slate-500">Verified payment transactions</p>
              </div>
              <button
                onClick={() => onNavigate('payments')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
              >
                <span>Ledger</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {recentPayments.slice(0, 4).map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 truncate max-w-[140px]">{p.studentName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{p.receiptNumber} · {p.paymentMethod}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-emerald-700 font-mono">{formatPKR(p.amount)}</div>
                    <button
                      onClick={() => onOpenReceipt(p.id)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                    >
                      Receipt
                    </button>
                  </div>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">No payments recorded yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
