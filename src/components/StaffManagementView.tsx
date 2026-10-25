import React, { useState, useEffect } from 'react';
import { UserCog, PlusCircle, CheckCircle2, Shield, UserCheck, UserX } from 'lucide-react';
import { api } from '../services/api';
import { UserAccount } from '../types';

export const StaffManagementView: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // New Staff Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Staff'>('Staff');
  const [permissions, setPermissions] = useState({
    canManageStudents: true,
    canGenerateVouchers: true,
    canRecordPayments: true,
    canMarkAttendance: true,
    canViewReports: false,
    canManageSettings: false,
    canPerformCorrections: false,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim()) return;
    try {
      await api.createUser({
        username: username.trim(),
        name: name.trim(),
        role,
        permissions,
      });
      setIsModalOpen(false);
      setUsername('');
      setName('');
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff & Permissions Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrative credentials and enforce role-based access control (RBAC).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm ${
                    user.role === 'Admin'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {user.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{user.name}</h3>
                  <span className="text-slate-400 text-xs font-mono">@{user.username}</span>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  user.role === 'Admin'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {user.role}
              </span>
            </div>

            {/* Permissions Badges */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <span className="font-semibold text-slate-600 block text-[11px]">Assigned Permissions:</span>
              <div className="flex flex-wrap gap-1.5">
                {user.permissions.canManageStudents && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">Students</span>
                )}
                {user.permissions.canGenerateVouchers && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">Vouchers</span>
                )}
                {user.permissions.canRecordPayments && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">Payments</span>
                )}
                {user.permissions.canMarkAttendance && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">Attendance</span>
                )}
                {user.permissions.canViewReports && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">Reports</span>
                )}
                {user.permissions.canManageSettings && (
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-semibold">
                    Settings
                  </span>
                )}
                {user.permissions.canPerformCorrections && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                    Corrections
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 text-xs sm:text-sm">
            <h3 className="font-bold text-base text-slate-900">Add Staff Account</h3>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asad Mehmood"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. asad.accounts"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="Staff">Staff</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="block font-semibold text-slate-700">Permissions</span>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={permissions.canManageStudents}
                    onChange={(e) => setPermissions({ ...permissions, canManageStudents: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Can Register / Update Students</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={permissions.canGenerateVouchers}
                    onChange={(e) => setPermissions({ ...permissions, canGenerateVouchers: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Can Generate Monthly Vouchers</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={permissions.canRecordPayments}
                    onChange={(e) => setPermissions({ ...permissions, canRecordPayments: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Can Record Payments & Issue Receipts</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={permissions.canMarkAttendance}
                    onChange={(e) => setPermissions({ ...permissions, canMarkAttendance: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Can Mark Daily Attendance</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={permissions.canViewReports}
                    onChange={(e) => setPermissions({ ...permissions, canViewReports: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Can View Financial Reports</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
