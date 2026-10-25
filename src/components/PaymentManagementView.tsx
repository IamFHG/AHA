import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  PlusCircle,
  Search,
  Download,
  AlertCircle,
  RotateCcw,
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

  const activeModalVoucher = vouchers.find(v => v.id === selectedVoucherId);

  useEffect(() => {
    if (activeModalVoucher) {
      setPayAmount(activeModalVoucher.remainingBalance);
    }
  }, [selectedVoucherId]);

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
      setErrorMessage('Please select a voucher with outstanding balance.');
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
      alert('Reversal reason is mandatory.');
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
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payments & Receipts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {payments.length} transactions · Total Verified Collections: {formatPKR(totalSuccessfulCollections)}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              window.location.href = '/api/export/payments';
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setErrorMessage(null);
              setIsRecordModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search payments by student name or ID..."
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden"
          />
        </div>
        <div className="w-full sm:w-44">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="">All Transactions</option>
            <option value="Successful">Successful</option>
            <option value="Reversed">Reversed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Voucher</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {p.receiptNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{p.studentName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{p.studentId}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {p.voucherNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                    {p.paymentMethod} {p.transactionRef && <span className="text-[10px] text-slate-400">({p.transactionRef})</span>}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatPKR(p.amount)}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className={`text-[11px] font-semibold ${
                      p.status === 'Successful' ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onOpenReceipt(p.id)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer"
                      >
                        Receipt Slip
                      </button>
                      {p.status === 'Successful' && (
                        <button
                          onClick={() => {
                            setReversingPayment(p);
                            setReversalReason('');
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Reverse Transaction"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No payment transactions recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Record Fee Payment</h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3.5 overflow-y-auto text-xs">
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setSelectedVoucherId('');
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
                >
                  <option value="">Choose Student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentId} - {s.fullName} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Unpaid Voucher</label>
                <select
                  value={selectedVoucherId}
                  onChange={(e) => setSelectedVoucherId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer font-medium"
                >
                  <option value="">Choose Voucher...</option>
                  {availableVouchersForStudent.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.voucherNumber} · {v.studentName} · Month {v.feeMonth}/{v.feeYear} (Due: {formatPKR(v.remainingBalance)})
                    </option>
                  ))}
                </select>
              </div>

              {activeModalVoucher && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Payable:</span>
                    <span>{formatPKR(activeModalVoucher.totalPayable)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Paid So Far:</span>
                    <span className="text-emerald-700">{formatPKR(activeModalVoucher.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-slate-900">
                    <span>Remaining Due:</span>
                    <span className="font-mono">{formatPKR(activeModalVoucher.remainingBalance)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount Received in PKR</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(roundHalfUp(Number(e.target.value)))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank transfer">Bank Transfer</option>
                    <option value="Mobile wallet">Mobile Wallet</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference #</label>
                  <input
                    type="text"
                    placeholder="e.g. CSH-01"
                    value={transRef}
                    onChange={(e) => setTransRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Received By</label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPaymentSubmit}
                disabled={isSubmittingPay || !selectedVoucherId}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                {isSubmittingPay ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reversal Modal */}
      {reversingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900">Reverse Payment</h3>
            <p className="text-slate-500">
              Receipt {reversingPayment.receiptNumber} ({formatPKR(reversingPayment.amount)}). Voucher balance will be restored.
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason *</label>
              <textarea
                rows={2}
                placeholder="Mandatory reversal reason..."
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setReversingPayment(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReversal}
                disabled={isReversing}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 cursor-pointer"
              >
                {isReversing ? 'Reversing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
