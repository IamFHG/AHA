import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, School, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { formatPKR } from '../utils/feeCalculator';
import { Payment, FeeVoucher, AcademySettings } from '../types';

interface PrintableReceiptViewProps {
  paymentId: string;
  onBack: () => void;
}

export const PrintableReceiptView: React.FC<PrintableReceiptViewProps> = ({
  paymentId,
  onBack,
}) => {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [voucher, setVoucher] = useState<FeeVoucher | null>(null);
  const [settings, setSettings] = useState<AcademySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReceipt() {
      setLoading(true);
      try {
        const res = await api.getReceipt(paymentId);
        setPayment(res.payment);
        setVoucher(res.voucher);
        setSettings(res.settings);
      } catch (err) {
        console.error('Failed to load receipt:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReceipt();
  }, [paymentId]);

  if (loading || !payment || !settings) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 print:hidden">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-slate-500 text-sm">Preparing official payment receipt...</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const feePeriodStr = `${monthNames[payment.feeMonth - 1] || payment.feeMonth} ${payment.feeYear}`;

  return (
    <div className="space-y-4">
      {/* Top Controls (Hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Payments</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition self-end sm:self-auto"
        >
          <Printer className="h-4 w-4" />
          <span>Print Official Payment Receipt</span>
        </button>
      </div>

      {/* Official Receipt Card */}
      <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-300 shadow-md max-w-2xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 text-slate-800 text-xs">
        <div className="border-2 border-slate-300 p-6 rounded-xl print:rounded-none relative bg-white">
          {/* Header */}
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="inline-flex items-center justify-center space-x-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold">
                <School className="h-5 w-5" />
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                {settings.academyName}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">OFFICIAL PAYMENT RECEIPT (ACCOUNTS DESK)</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {settings.address} • Phone: {settings.contactPhone}
            </p>
          </div>

          {/* Receipt Meta */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Receipt Number</span>
              <span className="font-black text-blue-800 text-sm">{payment.receiptNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Payment Timestamp</span>
              <span className="font-semibold text-slate-700">
                {new Date(payment.paymentDate).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Student ID & Name:</span>
              <span className="font-bold text-slate-900">{payment.studentName}</span>
              <span className="font-mono text-slate-600 block text-[11px]">{payment.studentId}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Related Fee Period:</span>
              <span className="font-bold text-slate-900">{feePeriodStr}</span>
              <span className="font-mono text-slate-600 block text-[11px]">Voucher Ref: {payment.voucherNumber}</span>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="py-4 space-y-2">
            <div className="flex justify-between items-center py-2 px-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <div>
                <span className="font-bold text-emerald-950 text-xs block">Amount Received in Full:</span>
                <span className="text-[10px] text-emerald-800">
                  Via {payment.paymentMethod} {payment.transactionRef ? `(Ref: ${payment.transactionRef})` : ''}
                </span>
              </div>
              <div className="font-black text-emerald-800 text-lg">
                {formatPKR(payment.amount)}
              </div>
            </div>

            <div className="flex justify-between items-center py-1.5 px-3 text-xs">
              <span className="text-slate-500">Remaining Voucher Balance After Payment:</span>
              <span className="font-bold text-slate-900">
                {formatPKR(payment.remainingBalanceAfter)}
              </span>
            </div>

            {payment.notes && (
              <div className="py-1 px-3 text-[11px] text-slate-500 italic">
                Notes: {payment.notes}
              </div>
            )}
          </div>

          {/* Verification Stamp & Signatures */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px]">
            <div>
              <span className="text-slate-400 block">Received By:</span>
              <span className="font-semibold text-slate-800">{payment.receivedBy}</span>
              <div className="flex items-center space-x-1 text-emerald-600 mt-1 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verified System Transaction</span>
              </div>
            </div>
            <div className="text-right flex flex-col justify-end">
              <div className="border-t border-slate-300 w-36 ml-auto pt-1 text-center font-semibold text-slate-600">
                Cashier / Officer Seal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
