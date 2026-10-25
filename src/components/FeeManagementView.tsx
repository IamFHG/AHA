import React, { useState, useEffect } from 'react';
import {
  Receipt,
  PlusCircle,
  Filter,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  CreditCard,
  Edit3,
  Download,
  Eye,
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

  // Handle bulk preview
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

  // Handle generate execution
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

  // Handle adjustment submission
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

  // Summaries
  const totalPayableSum = vouchers.reduce((s, v) => s + v.totalPayable, 0);
  const totalCollectedSum = vouchers.reduce((s, v) => s + v.paidAmount, 0);
  const totalBalanceSum = vouchers.reduce((s, v) => s + v.remainingBalance, 0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Vouchers & Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              {vouchers.length} Vouchers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate monthly fee vouchers, manage proration, adjustments, and review payment status.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              window.location.href = '/api/export/vouchers';
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setPreviewResult(null);
              setGenerationSummary(null);
              setIsGenModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Generate Vouchers</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Payable (Filtered Vouchers)</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{formatPKR(totalPayableSum)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Payments Received</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">{formatPKR(totalCollectedSum)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Remaining Outstanding Balance</span>
          <div className="text-xl font-bold text-amber-700 mt-1">{formatPKR(totalBalanceSum)}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Month selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fee Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="0">All Months</option>
              {monthNames.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Year selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fee Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="0">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Class selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Class / Grade</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Voucher Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Search by Student */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Search Student ID</label>
            <input
              type="text"
              placeholder="e.g. AP-2026-0001"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Student ID & Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Month/Year</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Payable</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vouchers.map((voucher) => (
                <tr key={voucher.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                    {voucher.voucherNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{voucher.studentName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{voucher.studentId}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">{voucher.className}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {voucher.feeMonth}/{voucher.feeYear}
                    {voucher.isAdmissionMonth && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 font-bold">
                        Prorated
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{voucher.dueDate}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatPKR(voucher.totalPayable)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-700">{formatPKR(voucher.paidAmount)}</td>
                  <td className="py-3 px-4 text-right font-black text-amber-800">{formatPKR(voucher.remainingBalance)}</td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        voucher.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : voucher.status === 'Partially Paid'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : voucher.status === 'Overdue'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {voucher.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => onOpenVoucher(voucher.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        title="Print / View Official Voucher"
                      >
                        Print
                      </button>
                      {voucher.remainingBalance > 0 && (
                        <button
                          onClick={() => onOpenRecordPayment(voucher.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                          title="Record Payment"
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
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                        title="Authorize Adjustment"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Receipt className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No vouchers found for selected filters.</p>
                    <p className="text-xs text-slate-400 mt-1">Generate monthly vouchers using the button above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Voucher Generation Modal (Section 10.3) */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <Receipt className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-base">Generate Monthly Fee Vouchers</h3>
              </div>
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs sm:text-sm">
              <div className="space-y-3">
                <label className="block font-semibold text-slate-700">Generation Target</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setGenTarget('all'); setPreviewResult(null); }}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                      genTarget === 'all'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    All Active Students
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGenTarget('class'); setPreviewResult(null); }}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                      genTarget === 'class'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Specific Class
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGenTarget('single'); setPreviewResult(null); }}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                      genTarget === 'single'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Single Student
                  </button>
                </div>
              </div>

              {genTarget === 'class' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Class</label>
                  <select
                    value={genClassId}
                    onChange={(e) => { setGenClassId(e.target.value); setPreviewResult(null); }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
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
                  <label className="block font-semibold text-slate-700 mb-1">Select Student</label>
                  <select
                    value={genStudentId}
                    onChange={(e) => setGenStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="">Choose Student...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.studentId} - {s.fullName} ({s.className})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Fee Month</label>
                  <select
                    value={genMonth}
                    onChange={(e) => { setGenMonth(Number(e.target.value)); setPreviewResult(null); }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {monthNames.map((name, i) => (
                      <option key={i + 1} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Fee Year</label>
                  <select
                    value={genYear}
                    onChange={(e) => { setGenYear(Number(e.target.value)); setPreviewResult(null); }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voucher Due Date</label>
                  <input
                    type="date"
                    value={genDueDate}
                    onChange={(e) => setGenDueDate(e.target.value)}
                    placeholder="Defaults to 10th"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Preview Button & Results (Section 10.3 Pre-execution Preview) */}
              {genTarget !== 'single' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePreviewBulk}
                    disabled={isPreviewing}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition"
                  >
                    {isPreviewing ? 'Analyzing candidates...' : 'Preview Generation Count & Totals'}
                  </button>

                  {previewResult && (
                    <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                      <div className="font-bold text-slate-800">Bulk Generation Analysis:</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">Active Candidates</span>
                          <span className="font-bold text-slate-800">{previewResult.eligibleCount}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-200 text-emerald-800">
                          <span className="text-emerald-600 block text-[10px]">Vouchers to Create</span>
                          <span className="font-bold">{previewResult.toCreateCount}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-600">
                          <span className="text-slate-400 block text-[10px]">Already Issued (Skipped)</span>
                          <span className="font-bold">{previewResult.skippedAlreadyExisting}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-800">
                          <span className="text-slate-400 block text-[10px]">Estimated Total</span>
                          <span className="font-bold">{formatPKR(previewResult.estimatedTotal)}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 italic">
                        Idempotency guarantee: Students who already have an issued voucher for {monthNames[genMonth - 1]} {genYear} will not receive a duplicate.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Generation Summary after execution */}
              {generationSummary && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2 text-emerald-900">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Generation Complete!</span>
                  </div>
                  <p>
                    Successfully generated <strong>{generationSummary.createdCount}</strong> new official vouchers.
                    {generationSummary.skippedCount > 0 && ` (${generationSummary.skippedCount} students skipped).`}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 shrink-0">
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={handleExecuteGeneration}
                disabled={isGenerating}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
              >
                {isGenerating ? 'Generating...' : 'Confirm & Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authorized Fee Adjustment Modal (Section 8.7 & 14) */}
      {adjustingVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 text-xs sm:text-sm">
            <h3 className="font-bold text-base text-slate-900">Authorize Fee Adjustment</h3>
            <p className="text-xs text-slate-500">
              Voucher: <span className="font-mono font-bold text-slate-800">{adjustingVoucher.voucherNumber}</span> ({adjustingVoucher.studentName}). Current Total: {formatPKR(adjustingVoucher.totalPayable)}.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Adjustment Amount in Whole PKR (+ or -)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  placeholder="e.g. -200 for discount, or +150 for charge"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mandatory Audit Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Approved fee waiver by Principal Dr. Tariq Mahmood..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setAdjustingVoucher(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdjustment}
                disabled={isAdjusting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
              >
                {isAdjusting ? 'Saving...' : 'Authorize Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
