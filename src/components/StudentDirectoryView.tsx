import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  Download,
  Eye,
  Receipt,
  CreditCard,
  ArrowUpDown,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { formatPKR } from '../utils/feeCalculator';
import { Student, AcademicClass, AcademicSession } from '../types';

interface StudentDirectoryViewProps {
  onOpenAdmissionModal: () => void;
  onOpenProfile: (studentId: string) => void;
  onOpenNewVoucher: (studentInternalId: string) => void;
  onOpenRecordPayment: (studentInternalId: string) => void;
  classes: AcademicClass[];
  sessions: AcademicSession[];
}

export const StudentDirectoryView: React.FC<StudentDirectoryViewProps> = ({
  onOpenAdmissionModal,
  onOpenProfile,
  onOpenNewVoucher,
  onOpenRecordPayment,
  classes,
  sessions,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [sortBy, setSortBy] = useState('studentId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents({
        query: searchQuery,
        classId: selectedClass || undefined,
        status: selectedStatus || undefined,
        session: selectedSession || undefined,
        sortBy,
        sortOrder,
      });
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [searchQuery, selectedClass, selectedStatus, selectedSession, sortBy, sortOrder]);

  const handleExportCSV = () => {
    window.location.href = '/api/export/students';
  };

  const getStatusBadge = (status: Student['status']) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Active
          </span>
        );
      case 'Withdrawn':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
            Withdrawn
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              {students.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, manage student admissions and jump directly to dedicated profiles.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAdmissionModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Admission</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Student ID, Name, Father, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="">All Classes / Grades</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Withdrawn">Withdrawn</option>
              <option value="Inactive">Inactive</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Session Filter */}
          <div>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="">All Sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Father's Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Admission Date</th>
                <th className="py-3 px-4 text-right">Regular Fee</th>
                <th className="py-3 px-4 text-right">Adm. Month Fee</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => {
                const initials = student.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition">
                    {/* Student ID */}
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {student.studentId}
                    </td>

                    {/* Name with Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 border border-emerald-200">
                          {initials}
                        </div>
                        <div>
                          <button
                            onClick={() => onOpenProfile(student.id)}
                            className="font-bold text-slate-900 hover:text-emerald-700 transition hover:underline text-left"
                          >
                            {student.fullName}
                          </button>
                          {student.fatherPhone && (
                            <div className="text-[11px] text-slate-400">{student.fatherPhone}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Father Name */}
                    <td className="py-3 px-4 text-slate-700 font-medium">{student.fatherName}</td>

                    {/* Class */}
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">{student.className}</td>

                    {/* Admission Date */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{student.admissionDate}</td>

                    {/* Regular Monthly Fee */}
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {formatPKR(student.regularMonthlyFee)}
                    </td>

                    {/* Prorated Admission Month Fee */}
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                      {formatPKR(student.admissionMonthFee)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(student.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onOpenProfile(student.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                          title="Open dedicated student profile"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => onOpenNewVoucher(student.id)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                          title="Issue voucher for student"
                        >
                          Voucher
                        </button>
                        <button
                          onClick={() => onOpenRecordPayment(student.id)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition"
                          title="Record payment"
                        >
                          Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {students.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No students found matching current filters.</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or register a new student.</p>
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
