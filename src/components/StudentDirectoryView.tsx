import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  Download,
  ArrowRight,
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

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {students.length} registered students with persistent profiles and fee schedules
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAdmissionModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>New Admission</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, father's name, ID, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
          />
        </div>

        {/* Class Filter */}
        <div className="w-full sm:w-48">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-36">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Withdrawn">Withdrawn</option>
            <option value="Inactive">Inactive</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Clean Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">Student & Guardian</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Admission Date</th>
                <th className="py-3 px-4 text-right">Monthly Fee</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/70 transition">
                  {/* Student & Guardian */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onOpenProfile(student.id)}
                      className="font-bold text-slate-900 hover:text-emerald-700 transition cursor-pointer text-left block"
                    >
                      {student.fullName}
                    </button>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                      <span className="font-mono text-slate-400">{student.studentId}</span>
                      <span>·</span>
                      <span>Father: {student.fatherName}</span>
                    </div>
                  </td>

                  {/* Class */}
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {student.className}
                  </td>

                  {/* Admission Date */}
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {student.admissionDate}
                  </td>

                  {/* Monthly Fee */}
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {formatPKR(student.regularMonthlyFee)}
                  </td>

                  {/* Status (Unboxed subtle text, no gaudy pills) */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className={`text-[11px] font-semibold ${
                      student.status === 'Active'
                        ? 'text-emerald-700'
                        : student.status === 'Withdrawn'
                        ? 'text-rose-600'
                        : 'text-slate-500'
                    }`}>
                      {student.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onOpenProfile(student.id)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer inline-flex items-center space-x-1"
                    >
                      <span>Profile</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}

              {students.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No students match the selected criteria.
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
