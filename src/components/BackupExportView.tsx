import React, { useState } from 'react';
import { HardDriveDownload, Download, Upload, AlertTriangle, CheckCircle2, FileText, Database } from 'lucide-react';

export const BackupExportView: React.FC = () => {
  const [restoring, setRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    window.location.href = '/api/export/backup';
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Warning: Restoring from a backup will overwrite current database records with the backup snapshot. Continue?')) {
      return;
    }

    setRestoring(true);
    setRestoreStatus(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch('/api/export/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsed }),
      });

      if (!res.ok) {
        throw new Error('Restore failed');
      }

      setRestoreStatus('Database successfully restored from backup snapshot.');
    } catch (err: any) {
      alert(err.message || 'Failed to restore database');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Export & Database Backup</h1>
        <p className="text-xs text-slate-500 mt-1">
          Export tabular CSV registers for reporting or download complete restorable JSON database snapshots.
        </p>
      </div>

      {restoreStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-2 text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{restoreStatus}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Tabular Exports */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <FileText className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-sm">Tabular Data Exports (CSV)</h2>
          </div>
          <p className="text-xs text-slate-500">
            Download standard spreadsheet registers for accounting or administrative reporting.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Student Directory Register</span>
                <span className="text-slate-500 text-[11px]">All student profiles, admission dates, and fees.</span>
              </div>
              <button
                onClick={() => { window.location.href = '/api/export/students'; }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 flex items-center space-x-1"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Fee Vouchers Register</span>
                <span className="text-slate-500 text-[11px]">Issued vouchers, payable dues, and settlement statuses.</span>
              </div>
              <button
                onClick={() => { window.location.href = '/api/export/vouchers'; }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 flex items-center space-x-1"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Payment Transactions Register</span>
                <span className="text-slate-500 text-[11px]">Verified receipts, methods, references, and amounts.</span>
              </div>
              <button
                onClick={() => { window.location.href = '/api/export/payments'; }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 flex items-center space-x-1"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Complete Database Backup & Restore */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <Database className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-sm">Full Database Backup & Disaster Recovery</h2>
          </div>
          <p className="text-xs text-slate-500">
            Download or restore an atomic snapshot of all students, vouchers, payments, attendance, and audit logs.
          </p>

          <div className="space-y-4 text-xs pt-2">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
              <span className="font-bold text-blue-900 block mb-1">Create Full Database Backup</span>
              <p className="text-blue-700 text-[11px] mb-3">
                Produces an authoritative, self-contained JSON snapshot of the entire academy database.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1.5"
              >
                <HardDriveDownload className="h-4 w-4" />
                <span>Download Backup Snapshot (JSON)</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-800 block">Restore Database from Snapshot</span>
              <p className="text-slate-500 text-[11px]">
                Upload a verified AcademyPro JSON backup file. Validates database structure before restoration.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileRestore}
                disabled={restoring}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
