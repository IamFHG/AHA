import React, { useState, useEffect } from 'react';
import {
  Receipt,
  PlusCircle,
  Search,
  Download,
  Calendar,
  Edit3,
  Printer,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { formatPKR } from '../utils/feeCalculator';
import { FeeVoucher, AcademicClass, Student } from '../types';

interface FeeManagementViewProps {
  onOpenVoucher: (voucherId: string) => void;
  onOpenRecordPayment: (voucherId: string) => void;
  classes: AcademicClass[];
  preselectedStudentInternalId?: string;
}

export const FeeManagementView: React.FC<FeeManagementViewProps> = ({
  onOpenVoucher,
  onOpenRecordPayment,
  classes,
  preselectedStudentInternalId,
}) => {
  const [vouchers, setVouchers] = useState<FeeVoucher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState<number>(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(now.getFullYear());
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Generation Modal
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genTarget, setGenTarget] = useState<'all' | 'class' | 'single'>('all');
  const [genClassId, setGenClassId] = useState(classes[0]?.id || '');
  const [genStudentId, setGenStudentId] = useState(preselectedStudentInternalId || '');
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());
  const [genDueDate, setGenDueDate] = useState('');
  const [previewResult, setPreviewResult] = useState<any | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState<any | null>(null);

  // Adjustment Modal
  const [adjustingVoucher, setAdjustingVoucher] = useState<FeeVoucher | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vList, sList] = await Promise.all([
        api.getVouchers({
          feeMonth: filterMonth || undefined,
          feeYear: filterYear || undefined,
          classId: filterClass || undefined,
          status: filterStatus || undefined,
          studentId: searchStudent || undefined,
        }),
        api.getStudents(),
      ]);
      setVouchers(vList);
      setStudents(sList);
    } catch (err) {
      console.error('Failed to load fee vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterMonth, filterYear, filterClass, filterStatus, searchStudent]);

  // Bulk preview
  const handlePreviewBulk = async () => {
    setIsPreviewing(true);
    try {
      const prev = await api.previewBulkVouchers({
        feeMonth: genMonth,
        feeYear: genYear,
        classId: genTarget === 'class' ? genClassId : undefined,
      });
      setPreviewResult(prev);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPreviewing(false);
    }
  };

  // Generate execution
  const handleExecuteGeneration = async () => {
    setIsGenerating(true);
    try {
      const payload: any = {
        feeMonth: genMonth,
        feeYear: genYear,
        dueDate: genDueDate || undefined,
      };
      if (genTarget === 'single') {
        payload.studentInternalId = genStudentId;
      } else if (genTarget === 'class') {
        payload.classId = genClassId;
      }

      const res = await api.generateVouchers(payload);
      setGenerationSummary(res);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate vouchers');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save adjustment
  const handleSaveAdjustment = async () => {
    if (!adjustingVoucher) return;
    if (!adjustReason.trim()) {
      alert('Adjustment reason is mandatory.');
      return;
    }
    setIsAdjusting(true);
    try {
      await api.adjustVoucher(adjustingVoucher.id, adjustAmount, adjustReason.trim());
      setAdjustingVoucher(null);
      setAdjustAmount(0);
      setAdjustReason('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust voucher');
    } finally {
      setIsAdjusting(false);
    }
  };

  const totalPayableSum = vouchers.reduce((s, v) => s + v.totalPayable, 0);
  const totalCollectedSum = vouchers.reduce((s, v) => s + v.paidAmount, 0);
  const totalBalanceSum = vouchers.reduce((s, v) => s + v.remainingBalance, 0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fee Vouchers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {vouchers.length} vouchers · Payable: {formatPKR(totalPayableSum)} · Collected: {formatPKR(totalCollectedSum)}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              window.location.href = '/api/export/vouchers';
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setPreviewResult(null);
              setGenerationSummary(null);
              setIsGenModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Generate Vouchers</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(Number(e.target.value))}
          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer focus:outline-hidden"
        >
          <option value="0">All Months</option>
          {monthNames.map((name, i) => (
            <option key={i + 1} value={i + 1}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={filterYear}
          onChange={(e) => setFilterYear(Number(e.target.value))}
          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer focus:outline-hidden"
        >
          <option value="0">All Years</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>

        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer focus:outline-hidden"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer focus:outline-hidden"
        >
          <option value="">All Statuses</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>

        <input
          type="text"
          placeholder="Filter by Student ID..."
          value={searchStudent}
          onChange={(e) => setSearchStudent(e.target.value)}
          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs flex-1 min-w-[140px] focus:outline-hidden"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Payable</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vouchers.map((voucher) => (
                <tr key={voucher.id} className="hover:bg-slate-50/70 transition">
                  {/* Voucher No */}
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {voucher.voucherNumber}
                  </td>

                  {/* Student */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{voucher.studentName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {voucher.studentId} · {voucher.className}
                    </div>
                  </td>

                  {/* Period */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                    {voucher.feeMonth}/{voucher.feeYear}
                    {voucher.isAdmissionMonth && (
                      <span className="text-[10px] text-amber-700 ml-1">(Prorated)</span>
                    )}
                  </td>

                  {/* Payable */}
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {formatPKR(voucher.totalPayable)}
                  </td>

                  {/* Paid */}
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 whitespace-nowrap">
                    {formatPKR(voucher.paidAmount)}
                  </td>

                  {/* Balance */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatPKR(voucher.remainingBalance)}
                  </td>

                  {/* Status (Clean unboxed text) */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span
                      className={`text-[11px] font-semibold ${
                        voucher.status === 'Paid'
                          ? 'text-emerald-700'
                          : voucher.status === 'Partially Paid'
                          ? 'text-blue-700'
                          : voucher.status === 'Overdue'
                          ? 'text-rose-600'
                          : 'text-amber-700'
                      }`}
                    >
                      {voucher.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onOpenVoucher(voucher.id)}
                        className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition cursor-pointer"
                      >
                        Print
                      </button>
                      {voucher.remainingBalance > 0 && (
                        <button
                          onClick={() => onOpenRecordPayment(voucher.id)}
                          className="px-2 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 rounded hover:bg-emerald-100 transition cursor-pointer"
                        >
                          Pay
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setAdjustingVoucher(voucher);
                          setAdjustAmount(voucher.adjustment || 0);
                          setAdjustReason(voucher.adjustmentReason || '');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                        title="Adjust Voucher"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {vouchers.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No fee vouchers found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generation Modal */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Generate Fee Vouchers</h3>
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Scope</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'class', 'single'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setGenTarget(t); setPreviewResult(null); }}
                      className={`py-2 px-3 rounded-lg border text-center font-medium cursor-pointer transition ${
                        genTarget === t
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'all' ? 'All Active' : t === 'class' ? 'By Class' : 'Single Student'}
                    </button>
                  ))}
                </div>
              </div>

              {genTarget === 'class' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    value={genClassId}
                    onChange={(e) => { setGenClassId(e.target.value); setPreviewResult(null); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {genTarget === 'single' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student</label>
                  <select
                    value={genStudentId}
                    onChange={(e) => setGenStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    <option value="">Select Student...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.studentId} - {s.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Month</label>
                  <select
                    value={genMonth}
                    onChange={(e) => { setGenMonth(Number(e.target.value)); setPreviewResult(null); }}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    {monthNames.map((name, i) => (
                      <option key={i + 1} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Year</label>
                  <select
                    value={genYear}
                    onChange={(e) => { setGenYear(Number(e.target.value)); setPreviewResult(null); }}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={genDueDate}
                    onChange={(e) => setGenDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {genTarget !== 'single' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePreviewBulk}
                    disabled={isPreviewing}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer underline"
                  >
                    {isPreviewing ? 'Calculating...' : 'Preview bulk eligibility'}
                  </button>

                  {previewResult && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Vouchers to create:</span>
                        <strong className="text-slate-900">{previewResult.toCreateCount}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Already issued (skipped):</span>
                        <span>{previewResult.skippedAlreadyExisting}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-bold pt-1 border-t border-slate-200">
                        <span>Estimated total:</span>
                        <span className="font-mono">{formatPKR(previewResult.estimatedTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {generationSummary && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
                  Created {generationSummary.createdCount} vouchers ({generationSummary.skippedCount} skipped).
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleExecuteGeneration}
                disabled={isGenerating}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                {isGenerating ? 'Generating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {adjustingVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900">Authorize Fee Adjustment</h3>
            <p className="text-slate-500">
              Voucher {adjustingVoucher.voucherNumber} ({adjustingVoucher.studentName}). Current Total: {formatPKR(adjustingVoucher.totalPayable)}.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment (PKR, + or -)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Reason for adjustment..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setAdjustingVoucher(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdjustment}
                disabled={isAdjusting}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 cursor-pointer"
              >
                {isAdjusting ? 'Saving...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
