import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter(l => {
    if (targetTypeFilter && l.targetType !== targetTypeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        l.targetId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable audit record of admissions, fee proration, voucher issuances, payments, reversals, and setting changes.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit logs by actor, action, summary, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="">All Entities</option>
            <option value="student">Student Admissions</option>
            <option value="voucher">Fee Vouchers</option>
            <option value="payment">Payments & Receipts</option>
            <option value="settings">Settings Changes</option>
            <option value="auth">Logins / Auth</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">{log.actor}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">{log.targetId}</td>
                  <td className="py-3 px-4 text-slate-700 max-w-md">{log.summary}</td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit records found matching criteria.
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
