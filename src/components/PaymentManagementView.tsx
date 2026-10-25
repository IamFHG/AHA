import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  Receipt,
  Download,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  User,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { formatPKR, roundHalfUp } from '../utils/feeCalculator';
import { Payment, FeeVoucher, Student } from '../types';

interface PaymentManagementViewProps {
  onOpenReceipt: (paymentId: string) => void;
  preselectedVoucherId?: string;
  preselectedStudentInternalId?: string;
}

export const PaymentManagementView: React.FC<PaymentManagementViewProps> = ({
  onOpenReceipt,
  preselectedVoucherId,
  preselectedStudentInternalId,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vouchers, setVouchers] = useState<FeeVoucher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchStudent, setSearchStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Record Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(!!preselectedVoucherId);
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentInternalId || '');
  const [selectedVoucherId, setSelectedVoucherId] = useState(preselectedVoucherId || '');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<Payment['paymentMethod']>('Cash');
  const [transRef, setTransRef] = useState('');
  const [receivedBy, setReceivedBy] = useState('Samina Akhtar');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reversal Modal
  const [reversingPayment, setReversingPayment] = useState<Payment | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pList, vList, sList] = await Promise.all([
        api.getPayments({
          studentId: searchStudent || undefined,
          status: filterStatus || undefined,
        }),
        api.getVouchers(),
        api.getStudents(),
      ]);
      setPayments(pList);
      setVouchers(vList);
      setStudents(sList);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchStudent, filterStatus]);

  // When selected voucher changes in modal, auto-fill remaining balance
  const activeModalVoucher = vouchers.find(v => v.id === selectedVoucherId);

  useEffect(() => {
    if (activeModalVoucher) {
      setPayAmount(activeModalVoucher.remainingBalance);
    }
  }, [selectedVoucherId]);

  // When student selected, filter available unpaid vouchers
  const availableVouchersForStudent = vouchers.filter(v => {
    if (v.remainingBalance <= 0) return false;
    if (selectedStudentId) {
      return v.studentInternalId === selectedStudentId;
    }
    return true;
  });

  const handleRecordPaymentSubmit = async () => {
    setErrorMessage(null);
    if (!selectedVoucherId) {
      setErrorMessage('Please select an unpaid voucher.');
      return;
    }
    const cleanAmount = roundHalfUp(Number(payAmount) || 0);
    if (cleanAmount <= 0) {
      setErrorMessage('Payment amount must be a positive whole PKR integer.');
      return;
    }
    if (activeModalVoucher && cleanAmount > activeModalVoucher.remainingBalance) {
      setErrorMessage(`Payment cannot exceed remaining voucher balance (${formatPKR(activeModalVoucher.remainingBalance)}).`);
      return;
    }

    setIsSubmittingPay(true);
    try {
      const voucher = vouchers.find(v => v.id === selectedVoucherId);
      const res = await api.recordPayment({
        voucherId: selectedVoucherId,
        studentInternalId: voucher ? voucher.studentInternalId : selectedStudentId,
        amount: cleanAmount,
        paymentMethod: payMethod,
        transactionRef: transRef.trim() || undefined,
        receivedBy: receivedBy.trim(),
        notes: payNotes.trim() || undefined,
      });

      setIsRecordModalOpen(false);
      setSelectedVoucherId('');
      setPayNotes('');
      setTransRef('');
      loadData();
      // Automatically open receipt
      onOpenReceipt(res.payment.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment recording failed.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleConfirmReversal = async () => {
    if (!reversingPayment) return;
    if (!reversalReason.trim()) {
      alert('Reversal reason is mandatory for auditable payment corrections.');
      return;
    }

    setIsReversing(true);
    try {
      await api.reversePayment(reversingPayment.id, reversalReason.trim());
      setReversingPayment(null);
      setReversalReason('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Payment reversal failed');
    } finally {
      setIsReversing(false);
    }
  };

  const totalSuccessfulCollections = payments
    .filter(p => p.status === 'Successful')
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Receipts</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              {payments.length} Transactions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Record fee collections, issue unique receipts, and manage auditable transaction reversals.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              window.location.href = '/api/export/payments';
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setErrorMessage(null);
              setIsRecordModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Verified Collections</span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{formatPKR(totalSuccessfulCollections)}</div>
          <span className="text-[10px] text-slate-400">Strictly successful non-reversed receipts</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Successful Receipts Issued</span>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {payments.filter(p => p.status === 'Successful').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Reversed Transactions</span>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            {payments.filter(p => p.status === 'Reversed').length}
          </div>
          <span className="text-[10px] text-slate-400">Excluded from revenue totals</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Student ID or Student Name..."
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="">All Transactions</option>
            <option value="Successful">Successful</option>
            <option value="Reversed">Reversed</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Voucher Reference</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                    {p.receiptNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{p.studentName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{p.studentId}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                    {p.voucherNumber} ({p.feeMonth}/{p.feeYear})
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {new Date(p.paymentDate).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{p.paymentMethod}</span>
                    {p.transactionRef && (
                      <span className="block text-[11px] text-slate-400 font-mono">{p.transactionRef}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                    {formatPKR(p.amount)}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Successful'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => onOpenReceipt(p.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      >
                        Print Slip
                      </button>
                      {p.status === 'Successful' && (
                        <button
                          onClick={() => {
                            setReversingPayment(p);
                            setReversalReason('');
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Reverse Payment (Auditable)"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CreditCard className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No payment transactions recorded.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal (Section 13.1) */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-base">Record Fee Payment</h3>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs sm:text-sm">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Select Student (if not preselected) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setSelectedVoucherId('');
                  }}
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

              {/* Step 2: Select Unpaid Voucher */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Unpaid Voucher <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedVoucherId}
                  onChange={(e) => setSelectedVoucherId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="">Choose Voucher...</option>
                  {availableVouchersForStudent.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.voucherNumber} • {v.studentName} • Month {v.feeMonth}/{v.feeYear} (Due: {formatPKR(v.remainingBalance)})
                    </option>
                  ))}
                </select>
                {availableVouchersForStudent.length === 0 && selectedStudentId && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    This student has no outstanding unpaid vouchers.
                  </p>
                )}
              </div>

              {/* Voucher Balance Card */}
              {activeModalVoucher && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student:</span>
                    <span className="font-bold text-slate-900">{activeModalVoucher.studentName} ({activeModalVoucher.studentId})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Voucher Payable:</span>
                    <span className="font-semibold text-slate-800">{formatPKR(activeModalVoucher.totalPayable)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Already Paid:</span>
                    <span className="font-semibold text-emerald-700">{formatPKR(activeModalVoucher.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                    <span className="text-slate-700">Net Balance Remaining:</span>
                    <span className="text-amber-800 text-sm">{formatPKR(activeModalVoucher.remainingBalance)}</span>
                  </div>
                </div>
              )}

              {/* Step 3: Amount Field */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount Received in Whole PKR <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  max={activeModalVoucher?.remainingBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(roundHalfUp(Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-base text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Partial payments permitted. Overpayment prohibited per standard policy.
                </span>
              </div>

              {/* Step 4: Method & Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="Cash">Cash at Counter</option>
                    <option value="Bank transfer">Bank Transfer / 1Link</option>
                    <option value="Mobile wallet">Mobile Wallet (EasyPaisa/JazzCash)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / Slip #</label>
                  <input
                    type="text"
                    placeholder="e.g. CSH-01 or TXN-998811"
                    value={transRef}
                    onChange={(e) => setTransRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Step 5: Received By & Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Received By (Staff Name)</label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes for receipt..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 shrink-0">
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPaymentSubmit}
                disabled={isSubmittingPay || !selectedVoucherId}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
              >
                {isSubmittingPay ? 'Recording...' : 'Record & Issue Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reversal Confirmation Modal (Section 13.2) */}
      {reversingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-2 text-rose-600">
              <RotateCcw className="h-5 w-5" />
              <h3 className="font-bold text-base">Reverse Payment Transaction</h3>
            </div>
            <p className="text-xs text-slate-500">
              Reversing receipt <span className="font-mono font-bold text-slate-800">{reversingPayment.receiptNumber}</span> of {formatPKR(reversingPayment.amount)} for {reversingPayment.studentName}. The voucher remaining balance will be restored automatically.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mandatory Reversal Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Bank transfer bounced / Depositor entered incorrect student ID..."
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setReversingPayment(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReversal}
                disabled={isReversing}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700"
              >
                {isReversing ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
