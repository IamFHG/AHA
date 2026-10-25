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
  AlertCircle,
  PlusCircle,
  Printer,
  Edit,
  UserMinus,
  UserCheck,
  Download,
  CheckCircle2,
  Clock,
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
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-slate-500 text-sm">Loading dedicated student profile...</p>
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
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Student Directory</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md">
            {initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{student.fullName}</h1>
              <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {student.studentId}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  student.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : student.status === 'Withdrawn'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {student.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Father: <span className="font-semibold text-slate-700">{student.fatherName}</span> • Enrolled in:{' '}
              <span className="font-semibold text-slate-700">{student.className}</span> • Admission Date:{' '}
              <span className="font-semibold text-slate-700">{student.admissionDate}</span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-1 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => onOpenGenerateVoucher(student.id)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Generate Voucher</span>
          </button>
          <button
            onClick={() => setIsChangingStatus(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <UserMinus className="h-3.5 w-3.5 text-slate-500" />
            <span>Change Status</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (7 Required Core Tabs) */}
      <div className="bg-white border-b border-slate-200 rounded-xl px-4 flex space-x-1 overflow-x-auto shadow-xs text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview & Balance', icon: User },
          { id: 'fees', label: `Fee History (${vouchers.length})`, icon: Receipt },
          { id: 'payments', label: `Payment History (${payments.length})`, icon: CreditCard },
          { id: 'attendance', label: `Attendance (${attendanceStats.attendancePercentage}%)`, icon: CalendarCheck },
          { id: 'academic', label: 'Academic & Subjects', icon: GraduationCap },
          { id: 'documents', label: `Documents (${student.documents?.length || 0})`, icon: FileText },
          { id: 'activity', label: 'Notes & Activity', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Financial Overview Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Applicable Monthly Fee</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{formatPKR(student.regularMonthlyFee)}</div>
              <span className="text-[11px] text-slate-500">Regular fee for subsequent months</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Admission Month Fee</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">{formatPKR(student.admissionMonthFee)}</div>
              <span className="text-[11px] text-slate-500">Prorated whole PKR integer</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Payments Collected</span>
              <div className="text-xl font-bold text-blue-700 mt-1">{formatPKR(financialOverview.totalPaymentsCollected)}</div>
              <span className="text-[11px] text-slate-500">Total verified receipts</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
              <div className="text-xl font-bold text-amber-700 mt-1">{formatPKR(financialOverview.outstandingBalance)}</div>
              <span className="text-[11px] text-slate-500">
                {financialOverview.unpaidCount} unpaid/partial voucher(s)
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <User className="h-4 w-4 text-emerald-600" />
                <span>Personal Information</span>
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-semibold text-slate-900">{student.fullName}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Father's Name</span>
                  <span className="font-semibold text-slate-900">{student.fatherName}</span>
                </div>
                {student.guardianName && (
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Guardian Name</span>
                    <span className="font-semibold text-slate-900">{student.guardianName}</span>
                  </div>
                )}
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Gender / DOB</span>
                  <span className="font-semibold text-slate-900">{student.gender || 'N/A'} • {student.dob || 'N/A'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Primary Contact (Father)</span>
                  <span className="font-semibold text-slate-900">{student.fatherPhone || 'Not provided'}</span>
                </div>
                {student.studentPhone && (
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Student Phone</span>
                    <span className="font-semibold text-slate-900">{student.studentPhone}</span>
                  </div>
                )}
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Emergency Contact</span>
                  <span className="font-semibold text-slate-900">{student.emergencyContact || 'N/A'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Residential Address</span>
                  <span className="font-semibold text-slate-900 text-right max-w-xs">{student.address || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Academic & Fee Policy */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                <span>Academic & Fee Policy</span>
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Enrolled Class</span>
                  <span className="font-semibold text-slate-900">{student.className}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Academic Session</span>
                  <span className="font-semibold text-slate-900">{student.session}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Official Admission Date</span>
                  <span className="font-semibold text-slate-900">{student.admissionDate}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Discount Concession</span>
                  <span className="font-semibold text-slate-900">
                    {student.discountType === 'none'
                      ? 'No Concession'
                      : student.discountType === 'fixed'
                      ? `PKR ${student.discountValue} Concession`
                      : `${student.discountValue}% Concession`}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Voucher Due Day</span>
                  <span className="font-semibold text-slate-900">{student.dueDay}th of each month</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Previous School</span>
                  <span className="font-semibold text-slate-900">{student.previousSchool || 'N/A'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-500">Admission Remarks</span>
                  <span className="font-semibold text-slate-900">{student.admissionRemarks || 'None'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fee History (Vouchers) */}
      {activeTab === 'fees' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Issued Fee Vouchers</h3>
              <p className="text-xs text-slate-500">Chronological history of all monthly fee vouchers issued to this student.</p>
            </div>
            <button
              onClick={() => onOpenGenerateVoucher(student.id)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Issue New Voucher</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Voucher #</th>
                  <th className="py-2.5 px-3">Fee Period</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Base / Prorated</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Adjustment</th>
                  <th className="py-2.5 px-3 text-right">Total Payable</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Remaining</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-semibold text-emerald-700">{v.voucherNumber}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{v.feeMonth}/{v.feeYear}</td>
                    <td className="py-2.5 px-3">
                      {v.isAdmissionMonth ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Admission Prorated
                        </span>
                      ) : (
                        <span className="text-slate-500">Regular</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">{formatPKR(v.regularMonthlyFee)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{v.discount > 0 ? `-${formatPKR(v.discount)}` : '0'}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{v.adjustment !== 0 ? formatPKR(v.adjustment) : '0'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatPKR(v.totalPayable)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">{formatPKR(v.paidAmount)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-800">{formatPKR(v.remainingBalance)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : v.status === 'Partially Paid'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : v.status === 'Overdue'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onOpenVoucher(v.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                        >
                          Print Voucher
                        </button>
                        {v.remainingBalance > 0 && (
                          <button
                            onClick={() => onOpenRecordPayment(v.id)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold transition"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      No vouchers issued for this student yet. Click "Issue New Voucher" to generate one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payment History */}
      {activeTab === 'payments' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Payment Receipts & History</h3>
              <p className="text-xs text-slate-500">Every verified payment receipt and transaction recorded for this student.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Related Voucher</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Ref / Notes</th>
                  <th className="py-2.5 px-3 text-right">Amount Received</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Receipt Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{p.receiptNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{p.voucherNumber}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{p.paymentMethod}</td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{p.transactionRef || p.notes || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatPKR(p.amount)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Successful'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onOpenReceipt(p.id)}
                        className="text-blue-600 hover:text-blue-800 font-bold underline text-[11px]"
                      >
                        Print Receipt
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No payments recorded yet for this student.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500">Attendance Percentage</span>
              <div className="text-xl font-black text-emerald-700 mt-1">{attendanceStats.attendancePercentage}%</div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
              <span className="text-xs text-emerald-700">Days Present</span>
              <div className="text-xl font-bold text-emerald-800 mt-1">{attendanceStats.presentDays}</div>
            </div>
            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-center">
              <span className="text-xs text-rose-700">Days Absent</span>
              <div className="text-xl font-bold text-rose-800 mt-1">{attendanceStats.absentDays}</div>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
              <span className="text-xs text-amber-700">Approved Leaves</span>
              <div className="text-xl font-bold text-amber-800 mt-1">{attendanceStats.leaveDays}</div>
            </div>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Remarks</th>
                  <th className="py-2 px-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 px-3 font-semibold text-slate-800">{a.date}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.status === 'Absent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">{a.remarks || '-'}</td>
                    <td className="py-2 px-3 text-slate-400">{a.recordedBy}</td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No attendance marked yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Academic */}
      {activeTab === 'academic' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Enrolled Subjects & Academic Info</h3>
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-2">Enrolled Subjects:</div>
            <div className="flex flex-wrap gap-2">
              {student.subjects?.map((sub, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200"
                >
                  📖 {sub}
                </span>
              ))}
              {(!student.subjects || student.subjects.length === 0) && (
                <span className="text-xs text-slate-400">No specific subjects configured.</span>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600 block mb-1">Academic Notes:</span>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line">
              {student.academicNotes || 'No special academic notes recorded.'}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Student Admission Documents</h3>
              <p className="text-xs text-slate-500">Secure documents stored for verification (Birth certificates, transcripts).</p>
            </div>
            <button
              onClick={() => setIsUploadingDoc(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Attach Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {student.documents?.map((doc) => (
              <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5 truncate">
                  <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-slate-800 text-xs truncate">{doc.name}</div>
                    <div className="text-[10px] text-slate-400">{doc.size} • {new Date(doc.uploadedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold shrink-0">
                  Verified
                </span>
              </div>
            ))}
            {(!student.documents || student.documents.length === 0) && (
              <div className="col-span-3 py-8 text-center text-slate-400 text-xs">
                No documents uploaded yet for this student.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Activity & Audit Trail */}
      {activeTab === 'activity' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Chronological Event & Audit History</h3>
          <p className="text-xs text-slate-500">Every consequential admission, voucher, and payment event recorded for this student.</p>

          <div className="divide-y divide-slate-100 pt-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start space-x-3 text-xs">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                  <History className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{log.summary}</p>
                  <span className="text-[10px] text-slate-400">Actor: {log.actor}</span>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">No activity logged yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 text-xs sm:text-sm">
            <h3 className="font-bold text-base text-slate-900">Edit Student Profile</h3>
            <p className="text-xs text-slate-500">
              Note: Updating fee settings affects only future vouchers. Historical vouchers remain immutable.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Father's Name</label>
                <input
                  type="text"
                  value={editFatherName}
                  onChange={(e) => setEditFatherName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Father's Phone</label>
                <input
                  type="text"
                  value={editFatherPhone}
                  onChange={(e) => setEditFatherPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Regular Monthly Fee (PKR)</label>
                <input
                  type="number"
                  value={editMonthlyFee}
                  onChange={(e) => setEditMonthlyFee(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfileUpdates}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {isChangingStatus && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 text-xs sm:text-sm">
            <h3 className="font-bold text-base text-slate-900">Change Student Status</h3>
            <p className="text-xs text-slate-500">
              Status changes are recorded in the audit log. Unpaid historical balances are preserved.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="Active">Active</option>
                  <option value="Withdrawn">Withdrawn</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Status Change</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Relocated to another city / Course completed..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsChangingStatus(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Doc Modal */}
      {isUploadingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 text-xs sm:text-sm">
            <h3 className="font-bold text-base text-slate-900">Attach Admission Document</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Document Title / File Name</label>
              <input
                type="text"
                placeholder="e.g. Previous_Report_Card.pdf"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsUploadingDoc(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDoc}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
              >
                Upload & Attach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
