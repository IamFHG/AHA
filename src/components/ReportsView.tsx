import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  CreditCard,
  Receipt,
  Users,
  Printer,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { formatPKR } from '../utils/feeCalculator';
import { AcademicClass } from '../types';

interface ReportsViewProps {
  classes: AcademicClass[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ classes }) => {
  const now = new Date();
  const [reportType, setReportType] = useState<'financial-summary' | 'daily-collections' | 'outstanding-defaulters'>(
    'financial-summary'
  );
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.getReports({
        type: reportType,
        month,
        year,
      });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, month, year]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial & Administrative Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative reporting distinguishing generated fee vouchers from actual successful collections.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter / Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setReportType('financial-summary')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
              reportType === 'financial-summary'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Fee Generation vs Collections
          </button>
          <button
            onClick={() => setReportType('daily-collections')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
              reportType === 'daily-collections'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Daily Collection Register
          </button>
          <button
            onClick={() => setReportType('outstanding-defaulters')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
              reportType === 'outstanding-defaulters'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Outstanding Defaulters
          </button>
        </div>

        {reportType === 'financial-summary' && (
          <div className="flex items-center space-x-2 text-xs">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-medium"
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
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-medium"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        )}
      </div>

      {/* Report 1: Financial Summary */}
      {reportType === 'financial-summary' && data && (
        <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Monthly Financial Statement: {monthNames[month - 1]} {year}
            </h2>
            <p className="text-xs text-slate-500">
              Generated Vouchers vs Realized Cash/Bank Collections
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <span className="text-xs font-bold text-emerald-800 uppercase block">Total Fees Generated</span>
              <div className="text-2xl font-black text-emerald-950 mt-1">{formatPKR(data.totalVouchersGeneratedAmount)}</div>
              <span className="text-[11px] text-emerald-700">{data.totalVouchersCount} vouchers issued</span>
            </div>
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
              <span className="text-xs font-bold text-blue-800 uppercase block">Total Collections Realized</span>
              <div className="text-2xl font-black text-blue-950 mt-1">{formatPKR(data.totalPaymentsCollectedAmount)}</div>
              <span className="text-[11px] text-blue-700">{data.totalPaymentsCount} successful receipts</span>
            </div>
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
              <span className="text-xs font-bold text-amber-800 uppercase block">Net Outstanding Dues</span>
              <div className="text-2xl font-black text-amber-950 mt-1">{formatPKR(data.totalOutstandingUnpaid)}</div>
              <span className="text-[11px] text-amber-700">Unsettled voucher balance</span>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="font-bold text-slate-900 text-sm mb-2">Issued Vouchers Register ({monthNames[month - 1]} {year})</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Voucher #</th>
                    <th className="py-2 px-3">Student Name</th>
                    <th className="py-2 px-3">Class</th>
                    <th className="py-2 px-3 text-right">Payable Amount</th>
                    <th className="py-2 px-3 text-right">Paid Amount</th>
                    <th className="py-2 px-3 text-right">Remaining</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {data.vouchers?.map((v: any) => (
                    <tr key={v.id}>
                      <td className="py-2 px-3 font-bold text-emerald-800">{v.voucherNumber}</td>
                      <td className="py-2 px-3 font-sans font-semibold text-slate-900">{v.studentName}</td>
                      <td className="py-2 px-3 font-sans text-slate-600">{v.className}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{formatPKR(v.totalPayable)}</td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-semibold">{formatPKR(v.paidAmount)}</td>
                      <td className="py-2 px-3 text-right text-amber-800 font-bold">{formatPKR(v.remainingBalance)}</td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Daily Collections */}
      {reportType === 'daily-collections' && data && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900">Daily Fee Collections Register</h2>
            <p className="text-xs text-slate-500">Grouped by date of receipt with transaction totals</p>
          </div>

          <div className="space-y-4">
            {Array.isArray(data) && data.map((dayItem: any) => (
              <div key={dayItem.date} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-3 flex justify-between items-center text-xs font-bold border-b border-slate-200">
                  <span className="text-slate-800">Date: {dayItem.date}</span>
                  <span className="text-emerald-800 text-sm">
                    Total: {formatPKR(dayItem.total)} ({dayItem.count} receipts)
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {dayItem.payments.map((p: any) => (
                    <div key={p.id} className="p-3 flex items-center justify-between font-mono text-[11px]">
                      <div>
                        <span className="font-bold text-blue-700">{p.receiptNumber}</span> •{' '}
                        <span className="font-sans font-semibold text-slate-900">{p.studentName}</span> •{' '}
                        <span className="text-slate-500 font-sans">{p.paymentMethod}</span>
                      </div>
                      <div className="font-black text-slate-900 text-xs">{formatPKR(p.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Array.isArray(data) && data.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">No collections recorded yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Report 3: Outstanding Defaulters */}
      {reportType === 'outstanding-defaulters' && data && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900">Outstanding Fee Defaulters Register</h2>
            <p className="text-xs text-slate-500">Students with genuine outstanding unpaid or overdue voucher balances</p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Voucher #</th>
                  <th className="py-2.5 px-3">Month/Year</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Remaining Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {Array.isArray(data) && data.map((v: any) => (
                  <tr key={v.id}>
                    <td className="py-2 px-3 font-bold text-emerald-800">{v.studentId}</td>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">{v.studentName}</td>
                    <td className="py-2 px-3 font-sans text-slate-600">{v.className}</td>
                    <td className="py-2 px-3 font-bold text-slate-700">{v.voucherNumber}</td>
                    <td className="py-2 px-3">{v.feeMonth}/{v.feeYear}</td>
                    <td className="py-2 px-3 font-sans text-red-700 font-bold">{v.dueDate}</td>
                    <td className="py-2 px-3 text-right font-black text-amber-900 text-xs">
                      {formatPKR(v.remainingBalance)}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {Array.isArray(data) && data.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      All issued vouchers are fully settled! No outstanding balances.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
