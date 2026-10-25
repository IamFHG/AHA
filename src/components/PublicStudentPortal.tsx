import React, { useState } from 'react';
import {
  School,
  Search,
  Receipt,
  Printer,
  ArrowLeft,
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between print:bg-white print:p-0 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8 print:hidden shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
              <School className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 tracking-tight">The Falcon Academy</div>
              <p className="text-[11px] text-slate-500">Student Fee Voucher Portal</p>
            </div>
          </div>

          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition cursor-pointer flex items-center space-x-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Staff Login</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto p-4 sm:p-6 my-auto print:max-w-none print:m-0 print:p-0">
        {!retrievedData ? (
          /* Search / Lookup Form */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
            <div className="p-6 text-center border-b border-slate-100">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Get Your Fee Voucher</h1>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Enter your official Student ID and admission date to download your monthly fee voucher.
              </p>
            </div>

            <form onSubmit={handleLookup} className="p-6 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Student ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AP-2026-0001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Admission Date
                </label>
                <input
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Required for verification per academy security policy.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fee Month</label>
                  <select
                    value={feeMonth}
                    onChange={(e) => setFeeMonth(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg cursor-pointer"
                  >
                    {monthNames.map((name, i) => (
                      <option key={i + 1} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fee Year</label>
                  <select
                    value={feeYear}
                    onChange={(e) => setFeeYear(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg cursor-pointer"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-2xs transition text-xs cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Retrieve Voucher'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Retrieved Voucher Card */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 print:hidden">
              <button
                onClick={() => setRetrievedData(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center space-x-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Search Another</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition cursor-pointer flex items-center space-x-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Voucher / Save PDF</span>
              </button>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-sm text-xs print:border-none print:shadow-none print:p-0">
              <div className="text-center pb-3 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900 uppercase">
                  {retrievedData.academy.name}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Fee Voucher · {monthNames[retrievedData.voucher.feeMonth - 1]} {retrievedData.voucher.feeYear}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Student ID & Name:</span>
                  <span className="font-bold text-slate-900">{retrievedData.voucher.studentName}</span>
                  <span className="font-mono text-slate-500 block">{retrievedData.voucher.studentId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Voucher Details:</span>
                  <span className="font-mono font-bold text-slate-900">{retrievedData.voucher.voucherNumber}</span>
                  <span className="text-slate-500 block">Due: {retrievedData.voucher.dueDate}</span>
                </div>
              </div>

              <div className="py-3 space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Total Payable Amount:</span>
                  <span className="font-mono font-bold text-slate-900">{formatPKR(retrievedData.voucher.totalPayable)}</span>
                </div>
                {retrievedData.voucher.paidAmount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Paid So Far:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatPKR(retrievedData.voucher.paidAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 font-bold text-sm bg-slate-50 px-2 rounded-lg">
                  <span className="text-slate-900">Remaining Balance:</span>
                  <span className="font-mono text-slate-950">{formatPKR(retrievedData.voucher.remainingBalance)}</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-700 block">Payment Instructions:</span>
                <p>{retrievedData.voucher.paymentInstructions}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 print:hidden">
        The Falcon Academy of Science & Arts • Student Fee Voucher Portal
      </footer>
    </div>
  );
};
