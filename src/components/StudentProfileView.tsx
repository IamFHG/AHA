import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  GraduationCap,
  CreditCard,
  Receipt,
  CalendarCheck,
  FileText,
  History,
  PlusCircle,
  Edit,
  UserMinus,
  Upload,
} from 'lucide-react';
import { api } from '../services/api';
import { formatPKR } from '../utils/feeCalculator';
import { Student, FeeVoucher, Payment, AttendanceRecord, AuditLog } from '../types';

interface StudentProfileViewProps {
  studentId: string;
  onBack: () => void;
  onOpenVoucher: (voucherId: string) => void;
  onOpenReceipt: (paymentId: string) => void;
  onOpenGenerateVoucher: (studentInternalId: string) => void;
  onOpenRecordPayment: (voucherId: string) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  studentId,
  onBack,
  onOpenVoucher,
  onOpenReceipt,
  onOpenGenerateVoucher,
  onOpenRecordPayment,
}) => {
  const [data, setData] = useState<{
    student: Student;
    vouchers: FeeVoucher[];
    payments: Payment[];
    attendance: AttendanceRecord[];
    auditLogs: AuditLog[];
    financialOverview: any;
    attendanceStats: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'fees' | 'payments' | 'attendance' | 'academic' | 'documents' | 'activity'
  >('overview');

  // Edit Profile Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editFatherName, setEditFatherName] = useState('');
  const [editFatherPhone, setEditFatherPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMonthlyFee, setEditMonthlyFee] = useState(0);

  // Status Modal
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<'Active' | 'Withdrawn' | 'Inactive' | 'Completed'>('Withdrawn');
  const [statusReason, setStatusReason] = useState('');

  // Upload Document Modal
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docName, setDocName] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getStudent(studentId);
      setData(res);
      setEditFullName(res.student.fullName);
      setEditFatherName(res.student.fatherName);
      setEditFatherPhone(res.student.fatherPhone || '');
      setEditAddress(res.student.address || '');
      setEditMonthlyFee(res.student.regularMonthlyFee);
    } catch (err) {
      console.error('Failed to load student profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [studentId]);

  if (loading || !data) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
        <div className="animate-spin h-6 w-6 border-2 border-slate-900 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-slate-500 text-xs">Loading profile...</p>
      </div>
    );
  }

  const { student, vouchers, payments, attendance, auditLogs, financialOverview, attendanceStats } = data;

  const initials = student.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSaveProfileUpdates = async () => {
    try {
      await api.updateStudent(student.id, {
        fullName: editFullName,
        fatherName: editFatherName,
        fatherPhone: editFatherPhone,
        address: editAddress,
        regularMonthlyFee: editMonthlyFee,
      });
      setIsEditing(false);
      loadProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const handleConfirmStatusChange = async () => {
    try {
      await api.updateStudentStatus(student.id, newStatus, statusReason);
      setIsChangingStatus(false);
      setStatusReason('');
      loadProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to change status');
    }
  };

  const handleUploadDoc = async () => {
    if (!docName.trim()) return;
    try {
      const res = await fetch(`/api/students/${student.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: docName.trim(), size: '180 KB', type: 'application/pdf' }),
      });
      if (res.ok) {
        setIsUploadingDoc(false);
        setDocName('');
        loadProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Directory</span>
        </button>
      </div>

      {/* Profile Header (Clean & Minimal) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-base flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900">{student.fullName}</h1>
              <span className="font-mono text-xs font-medium text-slate-500">
                ({student.studentId})
              </span>
              <span className={`text-[11px] font-semibold ${
                student.status === 'Active' ? 'text-emerald-700' : 'text-slate-500'
              }`}>
                · {student.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
              <span>Father: {student.fatherName}</span>
              <span>·</span>
              <span>{student.className}</span>
              <span>·</span>
              <span>Admitted {student.admissionDate}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 self-stretch md:self-auto justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => onOpenGenerateVoucher(student.id)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Issue Voucher
          </button>
          <button
            onClick={() => setIsChangingStatus(true)}
            className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium transition cursor-pointer"
          >
            Change Status
          </button>
        </div>
      </div>

      {/* 7 Clean Navigation Tabs */}
      <div className="border-b border-slate-200 flex space-x-6 text-xs font-medium overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'fees', label: `Vouchers (${vouchers.length})` },
          { id: 'payments', label: `Payments (${payments.length})` },
          { id: 'attendance', label: `Attendance (${attendanceStats.attendancePercentage}%)` },
          { id: 'academic', label: 'Academic Details' },
          { id: 'documents', label: `Documents (${student.documents?.length || 0})` },
          { id: 'activity', label: 'Activity Trail' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Monthly Tuition Fee</span>
              <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                {formatPKR(student.regularMonthlyFee)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Admission Month Fee</span>
              <div className="text-lg font-bold text-emerald-800 font-mono mt-0.5">
                {formatPKR(student.admissionMonthFee)}
              </div>
              <span className="text-[10px] text-slate-400">Prorated</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Total Payments Received</span>
              <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                {formatPKR(financialOverview.totalPaymentsCollected)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Outstanding Due</span>
              <div className="text-lg font-bold text-amber-800 font-mono mt-0.5">
                {formatPKR(financialOverview.outstandingBalance)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
              <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-100">Personal Information</h3>
              <div className="divide-y divide-slate-100">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Student Name</span>
                  <span className="font-medium text-slate-900">{student.fullName}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Father's Name</span>
                  <span className="font-medium text-slate-900">{student.fatherName}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Primary Phone</span>
                  <span className="font-medium text-slate-900">{student.fatherPhone || 'Not provided'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Residential Address</span>
                  <span className="font-medium text-slate-900 text-right max-w-xs">{student.address || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
              <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-100">Academic & Fee Terms</h3>
              <div className="divide-y divide-slate-100">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Class & Section</span>
                  <span className="font-medium text-slate-900">{student.className}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Session</span>
                  <span className="font-medium text-slate-900">{student.session}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Admission Date</span>
                  <span className="font-medium text-slate-900">{student.admissionDate}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Voucher Due Day</span>
                  <span className="font-medium text-slate-900">{student.dueDay}th of each month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Vouchers */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Voucher #</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3 text-right">Payable</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Remaining</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{v.voucherNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {v.feeMonth}/{v.feeYear} {v.isAdmissionMonth && <span className="text-amber-700 text-[10px]">(Prorated)</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">{formatPKR(v.totalPayable)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatPKR(v.paidAmount)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatPKR(v.remainingBalance)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[11px] font-semibold ${v.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onOpenVoucher(v.id)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer px-2 py-1"
                      >
                        Print
                      </button>
                      {v.remainingBalance > 0 && (
                        <button
                          onClick={() => onOpenRecordPayment(v.id)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer px-2 py-1"
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No vouchers issued yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Voucher Ref</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Amount Received</th>
                  <th className="py-2.5 px-3 text-right">Receipt Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{p.receiptNumber}</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{p.voucherNumber}</td>
                    <td className="py-2.5 px-3 text-slate-700">{p.paymentMethod}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">{formatPKR(p.amount)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onOpenReceipt(p.id)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer underline"
                      >
                        Print Slip
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No payment receipts recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center space-x-6 text-xs text-slate-600 pb-3 border-b border-slate-100">
            <span>Rate: <strong className="text-slate-900 font-mono">{attendanceStats.attendancePercentage}%</strong></span>
            <span>Present: <strong className="text-emerald-700 font-mono">{attendanceStats.presentDays}</strong></span>
            <span>Absent: <strong className="text-rose-600 font-mono">{attendanceStats.absentDays}</strong></span>
            <span>Leave: <strong className="text-amber-700 font-mono">{attendanceStats.leaveDays}</strong></span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {attendance.map((a) => (
              <div key={a.id} className="py-2 flex items-center justify-between">
                <span className="font-medium text-slate-800">{a.date}</span>
                <span className={`text-[11px] font-semibold ${
                  a.status === 'Present' ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {a.status} {a.remarks ? `(${a.remarks})` : ''}
                </span>
              </div>
            ))}
            {attendance.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">No attendance marked yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Academic */}
      {activeTab === 'academic' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <div>
            <div className="font-semibold text-slate-700 mb-1.5">Enrolled Subjects:</div>
            <div className="flex flex-wrap gap-1.5">
              {student.subjects?.map((sub, i) => (
                <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium text-xs">
                  {sub}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold text-slate-700 mb-1">Academic Notes:</div>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              {student.academicNotes || 'No academic notes recorded.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab 6: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-slate-900 text-xs">Verified Documents</span>
            <button
              onClick={() => setIsUploadingDoc(true)}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer underline"
            >
              + Attach Document
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {student.documents?.map((doc) => (
              <div key={doc.id} className="py-2.5 flex items-center justify-between">
                <span className="font-medium text-slate-800">{doc.name}</span>
                <span className="text-slate-400">{doc.size}</span>
              </div>
            ))}
            {(!student.documents || student.documents.length === 0) && (
              <div className="py-6 text-center text-slate-400 text-xs">No documents attached.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Activity Trail */}
      {activeTab === 'activity' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{log.action}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-500 mt-0.5">{log.summary}</p>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">No activity records.</div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900">Edit Profile</h3>
            <div className="space-y-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Father's Name</label>
                <input
                  type="text"
                  value={editFatherName}
                  onChange={(e) => setEditFatherName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Father's Phone</label>
                <input
                  type="text"
                  value={editFatherPhone}
                  onChange={(e) => setEditFatherPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Regular Monthly Fee (PKR)</label>
                <input
                  type="number"
                  value={editMonthlyFee}
                  onChange={(e) => setEditMonthlyFee(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfileUpdates}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {isChangingStatus && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900">Change Status</h3>
            <div className="space-y-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Withdrawn">Withdrawn</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason</label>
                <textarea
                  rows={2}
                  placeholder="Reason for change..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsChangingStatus(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Doc Modal */}
      {isUploadingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900">Attach Document</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Birth_Certificate.pdf"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsUploadingDoc(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDoc}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 cursor-pointer"
              >
                Attach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
