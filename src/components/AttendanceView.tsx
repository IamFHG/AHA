import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Filter,
  Users,
} from 'lucide-react';
import { api } from '../services/api';
import { AttendanceRecord, AcademicClass, Student } from '../types';

interface AttendanceViewProps {
  classes: AcademicClass[];
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ classes }) => {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: 'Present' | 'Absent' | 'Leave'; remarks: string }>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadAttendance = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    setSavedSuccess(false);
    try {
      const [allStudents, records] = await Promise.all([
        api.getStudents({ classId: selectedClassId, status: 'Active' }),
        api.getAttendance({ classId: selectedClassId, date: selectedDate }),
      ]);

      setStudents(allStudents);

      const map: Record<string, { status: 'Present' | 'Absent' | 'Leave'; remarks: string }> = {};
      // Default everyone to Present
      for (const s of allStudents) {
        map[s.id] = { status: 'Present', remarks: '' };
      }
      // Overlay stored records
      for (const r of records) {
        map[r.studentInternalId] = { status: r.status, remarks: r.remarks || '' };
      }

      setAttendanceMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedClassId, selectedDate]);

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Leave') => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const markAllPresent = () => {
    const updated = { ...attendanceMap };
    for (const key of Object.keys(updated)) {
      updated[key].status = 'Present';
    }
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const recordsToSave = students.map(s => {
        const item = attendanceMap[s.id] || { status: 'Present', remarks: '' };
        return {
          date: selectedDate,
          classId: selectedClassId,
          studentInternalId: s.id,
          studentId: s.studentId,
          studentName: s.fullName,
          status: item.status,
          remarks: item.remarks || undefined,
        };
      });

      await api.markAttendance(recordsToSave as any);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(v => v.status === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter(v => v.status === 'Absent').length;
  const leaveCount = Object.values(attendanceMap).filter(v => v.status === 'Leave').length;
  const total = students.length;
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Attendance Register</h1>
          <p className="text-xs text-slate-500 mt-1">
            Mark daily attendance by class and track student presence and absence records.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>Saved Successfully</span>
            </span>
          )}
          <button
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Metric Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Class / Grade</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={markAllPresent}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Mark All as Present (✓)
            </button>
          </div>
        </div>

        {/* Counts summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-2.5 rounded-xl text-center">
            <span className="text-[11px] text-slate-500">Total Enrolled</span>
            <div className="text-base font-bold text-slate-800">{total}</div>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-xl text-center">
            <span className="text-[11px] text-emerald-700">Present Today</span>
            <div className="text-base font-bold text-emerald-800">{presentCount} ({attendanceRate}%)</div>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-xl text-center">
            <span className="text-[11px] text-rose-700">Absent</span>
            <div className="text-base font-bold text-rose-800">{absentCount}</div>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-xl text-center">
            <span className="text-[11px] text-amber-700">Leave</span>
            <div className="text-base font-bold text-amber-800">{leaveCount}</div>
          </div>
        </div>
      </div>

      {/* Attendance Student Marking Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Father's Name</th>
                <th className="py-3 px-4 text-center">Attendance Status</th>
                <th className="py-3 px-4">Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => {
                const current = attendanceMap[student.id] || { status: 'Present', remarks: '' };
                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{student.studentId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{student.fullName}</td>
                    <td className="py-3 px-4 text-slate-600">{student.fatherName}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'Present')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            current.status === 'Present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'Absent')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            current.status === 'Absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'Leave')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            current.status === 'Leave'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Leave
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="e.g. Medical leave / Parent called"
                        value={current.remarks}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        className="w-full max-w-xs px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No active students enrolled in this class.
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
