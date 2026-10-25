import React, { useState, useEffect } from 'react';
import { Settings, Shield, Lock, Save, CheckCircle2, AlertTriangle, Building, Hash } from 'lucide-react';
import { api } from '../services/api';
import { AcademySettings } from '../types';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AcademySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const res = await api.getSettings();
        setSettings(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSuccessMsg(false);
    try {
      await api.updateSettings(settings);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academy & Portal Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure institutional identity, voucher printing details, identifier sequences, and public portal security.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {successMsg && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Saved Successfully</span>
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Academy Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <Building className="h-4 w-4 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-sm">1. Institutional Identity & Voucher Branding</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Academy Name</label>
              <input
                type="text"
                required
                value={settings.academyName}
                onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tagline / Motto</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Official Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone Numbers</label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email Address</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Voucher Footer Policy Text</label>
              <input
                type="text"
                value={settings.voucherFooterText}
                onChange={(e) => setSettings({ ...settings, voucherFooterText: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Official Payment Instructions (Printed on Vouchers)</label>
              <textarea
                rows={2}
                value={settings.paymentInstructions}
                onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Identifier Prefixes & Due Date */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <Hash className="h-4 w-4 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-sm">2. Unique Sequence Prefixes & Due Date Policy</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student ID Prefix</label>
              <input
                type="text"
                value={settings.studentIdPrefix}
                onChange={(e) => setSettings({ ...settings, studentIdPrefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
              <span className="text-[10px] text-slate-400">e.g. AP-2026-0001</span>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Voucher Prefix</label>
              <input
                type="text"
                value={settings.voucherPrefix}
                onChange={(e) => setSettings({ ...settings, voucherPrefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
              <span className="text-[10px] text-slate-400">e.g. FV-2026-0001</span>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receipt Prefix</label>
              <input
                type="text"
                value={settings.receiptPrefix}
                onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
              <span className="text-[10px] text-slate-400">e.g. REC-2026-0001</span>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Due Day of Month</label>
              <input
                type="number"
                min="1"
                max="28"
                value={settings.defaultDueDay}
                onChange={(e) => setSettings({ ...settings, defaultDueDay: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
              <span className="text-[10px] text-slate-400">e.g. 10th of each month</span>
            </div>
          </div>
        </div>

        {/* Card 3: Student Self-Service Portal Security Policy (Section 12.9) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <Lock className="h-4 w-4 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-sm">3. Student Self-Service Portal Security Policy (Section 12.9)</h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Enable Portal Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="font-bold text-slate-800 block">Enable Public Student Fee Voucher Portal</span>
                <span className="text-slate-500 text-[11px]">When disabled, the public portal displays an administrative maintenance message.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.portalSettings.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    portalSettings: { ...settings.portalSettings, enabled: e.target.checked },
                  })
                }
                className="h-5 w-5 text-emerald-600 rounded"
              />
            </div>

            {/* Require Admission Date Verification */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="font-bold text-slate-800 block">Require Admission-Date Verification</span>
                <span className="text-slate-500 text-[11px]">
                  Requires students/parents to enter their registered admission date to verify identity before releasing voucher details.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.portalSettings.requireAdmissionDate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    portalSettings: { ...settings.portalSettings, requireAdmissionDate: e.target.checked },
                  })
                }
                className="h-5 w-5 text-emerald-600 rounded"
              />
            </div>

            {/* Permit ID-Only Lookup (With Warning) */}
            <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
              <div>
                <span className="font-bold text-amber-900 block flex items-center space-x-1">
                  <span>Permit Student-ID-Only Lookup</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                </span>
                <span className="text-amber-700 text-[11px]">
                  Warning: Student IDs are identifiers, not secrets. Enabling ID-only retrieval allows anyone with a Student ID to view their voucher.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.portalSettings.permitIdOnlyLookup}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    portalSettings: { ...settings.portalSettings, permitIdOnlyLookup: e.target.checked },
                  })
                }
                className="h-5 w-5 text-amber-600 rounded"
              />
            </div>

            {/* Partially Paid & Fully Paid Vouchers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 block">Permit Partially Paid Vouchers</span>
                  <span className="text-slate-500 text-[11px]">Allow students to view and print partial balance vouchers.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.portalSettings.permitPartiallyPaid}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      portalSettings: { ...settings.portalSettings, permitPartiallyPaid: e.target.checked },
                    })
                  }
                  className="h-5 w-5 text-emerald-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 block">Permit Fully Paid Vouchers</span>
                  <span className="text-slate-500 text-[11px]">Allow retrieval of settled vouchers with zero balance.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.portalSettings.permitFullyPaid}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      portalSettings: { ...settings.portalSettings, permitFullyPaid: e.target.checked },
                    })
                  }
                  className="h-5 w-5 text-emerald-600 rounded"
                />
              </div>
            </div>

            {/* Inactive students & show remaining balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 block">Permit Inactive / Withdrawn Students</span>
                  <span className="text-slate-500 text-[11px]">Allow withdrawn students to look up past vouchers.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.portalSettings.permitInactiveStudents}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      portalSettings: { ...settings.portalSettings, permitInactiveStudents: e.target.checked },
                    })
                  }
                  className="h-5 w-5 text-emerald-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 block">Show Remaining Balance in Portal</span>
                  <span className="text-slate-500 text-[11px]">Explicitly display unpaid net dues on retrieved vouchers.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.portalSettings.showRemainingBalance}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      portalSettings: { ...settings.portalSettings, showRemainingBalance: e.target.checked },
                    })
                  }
                  className="h-5 w-5 text-emerald-600 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
