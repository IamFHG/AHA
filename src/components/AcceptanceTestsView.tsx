import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Play, RefreshCw, ShieldCheck, Calculator } from 'lucide-react';
import { api } from '../services/api';

export const AcceptanceTestsView: React.FC = () => {
  const [testSuite, setTestSuite] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await api.runAcceptanceTests();
      setTestSuite(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Acceptance Test Suite</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              Section 27 Verification
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated test verification of authoritative Section 8 fee proration formulas, leap year boundary cases, voucher idempotency, and payment logic.
          </p>
        </div>

        <button
          onClick={runTests}
          disabled={loading}
          className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition self-start sm:self-auto"
        >
          <Play className="h-4 w-4" />
          <span>{loading ? 'Executing Suite...' : 'Re-Run Test Suite'}</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      {testSuite && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block">Total Acceptance Tests</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{testSuite.totalTests}</div>
            <span className="text-[10px] text-slate-400">Section 27 specifications</span>
          </div>
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-xs text-emerald-800 font-bold block">Tests Passed</span>
            <div className="text-2xl font-black text-emerald-950 mt-1">{testSuite.passedCount}</div>
            <span className="text-[10px] text-emerald-700">100% verified correctness</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block">Failed Tests</span>
            <div className={`text-2xl font-black mt-1 ${testSuite.failedCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {testSuite.failedCount}
            </div>
            <span className="text-[10px] text-slate-400">Zero tolerance for math bugs</span>
          </div>
        </div>
      )}

      {/* Test Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">Test Execution Log</span>
          {testSuite?.allPassed && (
            <span className="text-emerald-700 font-bold flex items-center space-x-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>All Acceptance Tests Passed Successfully!</span>
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Test Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Expected</th>
                <th className="py-3 px-4 text-right">Actual Calculated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {testSuite?.results?.map((t: any, index: number) => (
                <tr key={index} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    {t.passed ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-sans">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>PASS</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 font-sans">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>FAIL</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">{t.name}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">{t.category}</td>
                  <td className="py-2.5 px-4 text-right text-slate-600 font-bold">
                    {typeof t.expected === 'object' ? JSON.stringify(t.expected) : t.expected}
                  </td>
                  <td className="py-2.5 px-4 text-right font-black text-emerald-700">
                    {typeof t.actual === 'object' ? JSON.stringify(t.actual) : t.actual}
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Executing Section 27 test assertions...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
