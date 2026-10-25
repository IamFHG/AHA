import React, { useState } from 'react';
import {
  School,
  Search,
  Receipt,
  Calendar,
  AlertCircle,
  Printer,
  CheckCircle2,
  Lock,
  ArrowLeft,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { formatPKR } from '../utils/feeCalculator';

interface PublicStudentPortalProps {
  onBackToAdmin?: () => void;
}

export const PublicStudentPortal: React.FC<PublicStudentPortalProps> = ({ onBackToAdmin }) => {
  const now = new Date();
  const [studentId, setStudentId] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [feeMonth, setFeeMonth] = useState<number>(now.getMonth() + 1);
  const [feeYear, setFeeYear] = useState<number>(now.getFullYear());

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retrievedData, setRetrievedData] = useState<{ voucher: any; academy: any } | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!studentId.trim()) {
      setErrorMessage('Please enter your Student ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.lookupPortalVoucher({
        studentId: studentId.trim(),
        admissionDate: admissionDate ? admissionDate.trim() : undefined,
        feeMonth,
        feeYear,
      });
      setRetrievedData(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to retrieve voucher. Please contact academy administration.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStudentId('');
    setAdmissionDate('');
    setErrorMessage(null);
    setRetrievedData(null);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between print:bg-white print:p-0">
      {/* Top Banner with Academy Name and Switch to Admin link */}
      <header className="bg-slate-900 border-b border-slate-800 text-white py-4 px-4 sm:px-8 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg">
              <School className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight">The Falcon Academy</div>
              <p className="text-xs text-slate-400">Student Self-Service Fee Voucher Portal</p>
            </div>
          </div>

          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Administration Login</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl w-full mx-auto p-4 sm:p-6 my-6 flex-1 print:max-w-none print:m-0 print:p-0">
        {!retrievedData ? (
          /* Search / Lookup Form */
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 p-6 sm:p-8 text-white text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <Receipt className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Student Fee Voucher Portal</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-lg mx-auto">
                Retrieve and download your official monthly fee voucher directly. Enter your assigned Student ID and registered details below.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLookup} className="p-6 sm:p-8 space-y-5">
              {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm flex items-start space-x-2.5">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <div className="font-bold">Lookup Failed</div>
                    <div className="mt-0.5">{errorMessage}</div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Student ID (Mandatory) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. AP-2026-0001"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Find this on your academy admission card or previous receipts.
                  </span>
                </div>

                {/* Admission Date (Security Policy Controlled) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Admission Date <span className="text-emerald-700 font-semibold">(Verification)</span>
                  </label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Required for identity verification per academy privacy security policy.
                  </span>
                </div>

                {/* Fee Month and Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Fee Month
                    </label>
                    <select
                      value={feeMonth}
                      onChange={(e) => setFeeMonth(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      {monthNames.map((name, i) => (
                        <option key={i + 1} value={i + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Fee Year
                    </label>
                    <select
                      value={feeYear}
                      onChange={(e) => setFeeYear(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-sm"
                >
                  {loading ? (
                    <span>Verifying details...</span>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>Get Your Fee Voucher</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto py-3 px-5 border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition text-xs"
                >
                  Clear
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center space-x-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                <span>Protected with rate limiting and automated enumeration defence.</span>
              </div>
            </form>
          </div>
        ) : (
          /* Retrieved Voucher Display Card */
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
              <button
                onClick={() => setRetrievedData(null)}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition self-start"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Search Another Voucher</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition self-end sm:self-auto"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official Voucher / Save PDF</span>
              </button>
            </div>

            {/* Official Voucher Render for Student */}
            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-300 text-slate-800 text-xs print:border-none print:shadow-none print:p-0">
              <div className="border border-slate-300 p-6 rounded-2xl print:rounded-none bg-white">
                {/* Header */}
                <div className="text-center pb-4 border-b border-slate-200">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {retrievedData.academy.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">{retrievedData.academy.tagline}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {retrievedData.academy.address} • Contact: {retrievedData.academy.contactPhone}
                  </p>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Voucher</span>
                    <span className="font-bold text-base text-slate-900">
                      {monthNames[retrievedData.voucher.feeMonth - 1]} {retrievedData.voucher.feeYear}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-800 font-black text-sm block">
                      {retrievedData.voucher.voucherNumber}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Due Date: <strong className="text-red-700">{retrievedData.voucher.dueDate}</strong>
                    </span>
                  </div>
                </div>

                {/* Student Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Student ID</span>
                    <span className="font-bold font-mono text-slate-900">{retrievedData.voucher.studentId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Student Name</span>
                    <span className="font-bold text-slate-900">{retrievedData.voucher.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Father's Name</span>
                    <span className="font-semibold text-slate-800">{retrievedData.voucher.fatherName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Class / Grade</span>
                    <span className="font-semibold text-slate-800">{retrievedData.voucher.className}</span>
                  </div>
                </div>

                {/* Financial Table */}
                <div className="py-4">
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {retrievedData.voucher.isAdmissionMonth && retrievedData.voucher.prorationDetails ? (
                        <tr className="bg-amber-50/40">
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            Admission Month Fee (Prorated for {retrievedData.voucher.prorationDetails.chargeableDays} days)
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatPKR(retrievedData.voucher.prorationDetails.finalProratedFee)}
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="py-2 px-3 font-semibold text-slate-800">Regular Monthly Fee</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatPKR(retrievedData.voucher.regularMonthlyFee)}
                          </td>
                        </tr>
                      )}

                      {retrievedData.voucher.discount > 0 && (
                        <tr>
                          <td className="py-2 px-3 text-slate-700">Concession / Discount</td>
                          <td className="py-2 px-3 text-right text-emerald-700 font-bold">
                            -{formatPKR(retrievedData.voucher.discount)}
                          </td>
                        </tr>
                      )}

                      <tr className="bg-slate-100 font-bold text-xs">
                        <td className="py-2.5 px-3 text-slate-900">Total Payable Amount</td>
                        <td className="py-2.5 px-3 text-right text-slate-950 font-black text-sm">
                          {formatPKR(retrievedData.voucher.totalPayable)}
                        </td>
                      </tr>

                      {retrievedData.voucher.paidAmount > 0 && (
                        <tr>
                          <td className="py-2 px-3 text-slate-600">Amount Paid So Far</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">
                            {formatPKR(retrievedData.voucher.paidAmount)}
                          </td>
                        </tr>
                      )}

                      <tr className="bg-amber-50 font-bold">
                        <td className="py-2 px-3 text-amber-900">Remaining Balance Due</td>
                        <td className="py-2 px-3 text-right text-amber-900 font-black text-sm">
                          {formatPKR(retrievedData.voucher.remainingBalance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Instructions */}
                <div className="pt-3 border-t border-slate-200 text-[10px] space-y-1 text-slate-600">
                  <div className="font-bold text-slate-800">Payment Instructions:</div>
                  <p>{retrievedData.voucher.paymentInstructions}</p>
                </div>

                {/* Detachable Bank Slip */}
                <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-300">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-3">
                    Bank / Accounts Deposit Slip
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block">Voucher:</span>
                      <span className="font-bold">{retrievedData.voucher.voucherNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Student ID:</span>
                      <span className="font-bold">{retrievedData.voucher.studentId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Student:</span>
                      <span className="font-bold truncate block">{retrievedData.voucher.studentName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Amount:</span>
                      <span className="font-black text-slate-900 text-xs">{formatPKR(retrievedData.voucher.remainingBalance)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 print:hidden">
        The Falcon Academy of Science & Arts • Student Fee Voucher Portal • Lahore, Pakistan
      </footer>
    </div>
  );
};
