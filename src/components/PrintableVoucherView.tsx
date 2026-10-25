import React, { useState, useEffect } from 'react';
import { Printer, Download, ArrowLeft, School, CheckCircle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { formatPKR } from '../utils/feeCalculator';
import { FeeVoucher, AcademySettings } from '../types';

interface PrintableVoucherViewProps {
  voucherId: string;
  onBack: () => void;
  onRecordPayment?: (voucherId: string) => void;
}

export const PrintableVoucherView: React.FC<PrintableVoucherViewProps> = ({
  voucherId,
  onBack,
  onRecordPayment,
}) => {
  const [voucher, setVoucher] = useState<FeeVoucher | null>(null);
  const [settings, setSettings] = useState<AcademySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVoucher() {
      setLoading(true);
      try {
        const res = await api.getVoucher(voucherId);
        setVoucher(res.voucher);
        setSettings(res.settings);
      } catch (err) {
        console.error('Failed to load voucher for printing:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVoucher();
  }, [voucherId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !voucher || !settings) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 print:hidden">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-slate-500 text-sm">Preparing official voucher layout...</p>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[voucher.feeMonth - 1] || `Month ${voucher.feeMonth}`;

  return (
    <div className="space-y-4">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Voucher Management</span>
        </button>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {voucher.remainingBalance > 0 && onRecordPayment && (
            <button
              onClick={() => onRecordPayment(voucher.id)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              Record Payment
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Official Voucher (A4)</span>
          </button>
        </div>
      </div>

      {/* Official Voucher Container (A4 Scaled) */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-md max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 text-slate-800 text-xs">
        
        {/* ========================================== */}
        {/* SECTION A: STUDENT COPY                    */}
        {/* ========================================== */}
        <div className="border border-slate-300 p-5 rounded-xl print:rounded-none relative bg-white">
          <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Student / Parent Copy
          </div>

          {/* Academy Header */}
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="inline-flex items-center justify-center space-x-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                <School className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                {settings.academyName}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{settings.tagline}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {settings.address} • Phone: {settings.contactPhone} • Email: {settings.contactEmail}
            </p>
          </div>

          {/* Voucher Title & Period */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-200 gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Fee Voucher</span>
              <span className="font-bold text-base text-slate-900">
                {monthName} {voucher.feeYear}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">Voucher No:</span>
                <span className="font-bold text-emerald-800 text-sm">{voucher.voucherNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Issue Date:</span>
                <span className="font-semibold">{voucher.issueDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Due Date:</span>
                <span className="font-bold text-red-700">{voucher.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Student ID</span>
              <span className="font-bold font-mono text-slate-900">{voucher.studentId}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Student Full Name</span>
              <span className="font-bold text-slate-900">{voucher.studentName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Father's Name</span>
              <span className="font-semibold text-slate-800">{voucher.fatherName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Class / Grade</span>
              <span className="font-semibold text-slate-800">{voucher.className}</span>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="py-3">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-1.5 px-3">Description</th>
                  <th className="py-1.5 px-3">Calculation Details</th>
                  <th className="py-1.5 px-3 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {/* Regular or Prorated Fee */}
                {voucher.isAdmissionMonth && voucher.prorationDetails ? (
                  <tr className="bg-amber-50/30">
                    <td className="py-1.5 px-3 font-semibold text-slate-800">
                      Admission Month Fee (Prorated)
                    </td>
                    <td className="py-1.5 px-3 text-slate-500 font-sans text-[10px]">
                      Admitted {voucher.admissionDate}. Month length: {voucher.prorationDetails.monthLength}d, Day: {voucher.prorationDetails.admissionDay}, Chargeable: {voucher.prorationDetails.chargeableDays}d ({formatPKR(voucher.regularMonthlyFee)} × {voucher.prorationDetails.chargeableDays}/{voucher.prorationDetails.monthLength})
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                      {formatPKR(voucher.prorationDetails.finalProratedFee)}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="py-1.5 px-3 font-semibold text-slate-800">Regular Tuition Fee</td>
                    <td className="py-1.5 px-3 text-slate-500 font-sans text-[10px]">
                      Standard monthly tuition fee for {monthName} {voucher.feeYear}
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                      {formatPKR(voucher.regularMonthlyFee)}
                    </td>
                  </tr>
                )}

                {/* Discount Line if any */}
                {voucher.discount > 0 && (
                  <tr>
                    <td className="py-1.5 px-3 text-slate-700">Concession / Discount</td>
                    <td className="py-1.5 px-3 text-slate-500 font-sans text-[10px]">Approved academic/merit concession</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700 font-bold">
                      -{formatPKR(voucher.discount)}
                    </td>
                  </tr>
                )}

                {/* Adjustment Line if any */}
                {voucher.adjustment !== 0 && (
                  <tr>
                    <td className="py-1.5 px-3 text-slate-700">Authorized Adjustment</td>
                    <td className="py-1.5 px-3 text-slate-500 font-sans text-[10px]">{voucher.adjustmentReason || 'Administrative adjustment'}</td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-800">
                      {formatPKR(voucher.adjustment)}
                    </td>
                  </tr>
                )}

                {/* Previous Outstanding */}
                {voucher.previousOutstanding > 0 && (
                  <tr>
                    <td className="py-1.5 px-3 text-amber-800 font-semibold">Previous Outstanding Balance</td>
                    <td className="py-1.5 px-3 text-slate-500 font-sans text-[10px]">Carried forward genuine unpaid dues</td>
                    <td className="py-1.5 px-3 text-right font-bold text-amber-800">
                      {formatPKR(voucher.previousOutstanding)}
                    </td>
                  </tr>
                )}

                {/* Total Payable Summary Row */}
                <tr className="bg-slate-100 font-bold text-xs">
                  <td className="py-2 px-3 text-slate-900" colSpan={2}>
                    Total Payable Amount (Whole PKR)
                  </td>
                  <td className="py-2 px-3 text-right text-slate-950 font-black text-sm">
                    {formatPKR(voucher.totalPayable)}
                  </td>
                </tr>

                {/* Amount Paid & Remaining Balance */}
                <tr>
                  <td className="py-1.5 px-3 text-slate-600" colSpan={2}>
                    Amount Already Paid / Settled
                  </td>
                  <td className="py-1.5 px-3 text-right font-bold text-emerald-700">
                    {formatPKR(voucher.paidAmount)}
                  </td>
                </tr>
                <tr className="bg-amber-50/60 font-bold">
                  <td className="py-2 px-3 text-amber-900" colSpan={2}>
                    Net Remaining Due by Due Date
                  </td>
                  <td className="py-2 px-3 text-right text-amber-900 font-black text-sm">
                    {formatPKR(voucher.remainingBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Instructions & Policy Note */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px]">
            <div>
              <span className="font-bold text-slate-700 block">Payment Methods & Instructions:</span>
              <p className="text-slate-500 mt-0.5 leading-relaxed">
                {voucher.paymentInstructions || settings.paymentInstructions}
              </p>
            </div>
            <div className="text-right flex flex-col justify-end">
              <span className="text-slate-400 block">{settings.voucherFooterText}</span>
              <div className="mt-4 pt-1 border-t border-slate-300 w-36 ml-auto text-center font-semibold text-slate-600 text-[10px]">
                Authorized Signature & Seal
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* DETACHABLE PERFORATION LINE                */}
        {/* ========================================== */}
        <div className="my-6 border-t-2 border-dashed border-slate-300 relative text-center">
          <span className="bg-white px-3 text-[10px] text-slate-400 uppercase tracking-widest font-mono relative -top-2.5">
            ✂ Detach Here for Academy / Bank Accounts Record
          </span>
        </div>

        {/* ========================================== */}
        {/* SECTION B: ACCOUNTS / BANK COPY            */}
        {/* ========================================== */}
        <div className="border border-slate-300 p-5 rounded-xl print:rounded-none bg-slate-50/40">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="font-bold text-sm text-slate-900 uppercase tracking-tight">{settings.academyName}</h2>
              <span className="text-[10px] text-slate-500">ACCOUNTS DESK / BANK DEPOSIT SLIP</span>
            </div>
            <div className="text-right text-[11px] font-mono">
              <span className="font-bold text-emerald-800 text-xs">{voucher.voucherNumber}</span>
              <div className="text-[10px] text-slate-500">Fee Period: {monthName} {voucher.feeYear}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 text-[10px] font-mono">
            <div>
              <span className="text-slate-400 block">Student ID:</span>
              <span className="font-bold text-slate-800">{voucher.studentId}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Student Name:</span>
              <span className="font-bold text-slate-800">{voucher.studentName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Class:</span>
              <span className="font-semibold text-slate-800">{voucher.className}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Payable:</span>
              <span className="font-black text-slate-900 text-xs">{formatPKR(voucher.totalPayable)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-4 text-[10px] text-slate-500">
            <div>
              <span>Amount Deposited: ________________</span>
            </div>
            <div>
              <span>Payment Date: ________________</span>
            </div>
            <div className="text-right">
              <span>Cashier / Officer Stamp: ___________</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
