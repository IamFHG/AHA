import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { calculateAdmissionProration, formatPKR, roundHalfUp } from '../utils/feeCalculator';
import { AcademicClass, Subject, AcademicSession } from '../types';

interface StudentAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentCreated: (newStudent: any) => void;
  classes: AcademicClass[];
  subjects: Subject[];
  sessions: AcademicSession[];
}

export const StudentAdmissionModal: React.FC<StudentAdmissionModalProps> = ({
  isOpen,
  onClose,
  onStudentCreated,
  classes,
  subjects,
  sessions,
}) => {
  // Personal
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [address, setAddress] = useState('');

  // Academic
  const [classId, setClassId] = useState(classes[0]?.id || 'c1');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [session, setSession] = useState(sessions.find(s => s.isCurrent)?.name || '2026-2027');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [previousSchool, setPreviousSchool] = useState('');
  const [academicNotes, setAcademicNotes] = useState('');

  // Fee Details
  const defaultClassFee = classes.find(c => c.id === classId)?.defaultMonthlyFee || 2500;
  const [regularMonthlyFee, setRegularMonthlyFee] = useState(defaultClassFee);
  const [discountType, setDiscountType] = useState<'none' | 'fixed' | 'percentage'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [dueDay, setDueDay] = useState(10);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const selectedClass = classes.find(c => c.id === newClassId);
    if (selectedClass) {
      setRegularMonthlyFee(selectedClass.defaultMonthlyFee);
    }
  };

  const proration = admissionDate && regularMonthlyFee > 0
    ? calculateAdmissionProration(regularMonthlyFee, admissionDate)
    : null;

  const toggleSubject = (subName: string) => {
    if (selectedSubjects.includes(subName)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subName));
    } else {
      setSelectedSubjects([...selectedSubjects, subName]);
    }
  };

  const resetForm = () => {
    setFullName('');
    setFatherName('');
    setGuardianName('');
    setDob('');
    setFatherPhone('');
    setAddress('');
    setSelectedSubjects([]);
    setPreviousSchool('');
    setAcademicNotes('');
    setDiscountType('none');
    setDiscountValue(0);
    setErrorMessage(null);
    setDuplicateWarning(null);
  };

  const handleSubmit = async (addAnother: boolean = false) => {
    setErrorMessage(null);
    setDuplicateWarning(null);

    if (!fullName.trim()) {
      setErrorMessage('Student Name is required.');
      return;
    }
    if (!fatherName.trim()) {
      setErrorMessage("Father's Name is required.");
      return;
    }
    if (!admissionDate) {
      setErrorMessage('Admission Date is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        fatherName: fatherName.trim(),
        guardianName: guardianName.trim() || undefined,
        gender,
        dob: dob || undefined,
        fatherPhone: fatherPhone.trim() || undefined,
        address: address.trim() || undefined,
        classId,
        subjects: selectedSubjects,
        session,
        admissionDate,
        previousSchool: previousSchool.trim() || undefined,
        academicNotes: academicNotes.trim() || undefined,
        regularMonthlyFee: roundHalfUp(Number(regularMonthlyFee) || 0),
        discountType,
        discountValue: Number(discountValue) || 0,
        dueDay: Number(dueDay) || 10,
      };

      const res = await api.createStudent(payload);
      onStudentCreated(res.student);

      if (res.duplicateWarning) {
        setDuplicateWarning(res.duplicateWarning);
      }

      if (addAnother) {
        resetForm();
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save student admission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">New Student Admission</h2>
            <p className="text-xs text-slate-500">Student enrollment and admission-month fee proration</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              {errorMessage}
            </div>
          )}
          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
              {duplicateWarning}
            </div>
          )}

          {/* Personal */}
          <div className="space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
              1. Personal Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Student Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zainab Bibi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Father's Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Rashid"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Father's Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 0301 5551234"
                  value={fatherPhone}
                  onChange={(e) => setFatherPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Area, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Academic */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
              2. Academic Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Class *</label>
                <select
                  value={classId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Admission Date *</label>
                <input
                  type="date"
                  required
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Session</label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Enrolled Subjects</label>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((sub) => {
                  const isChecked = selectedSubjects.includes(sub.name);
                  return (
                    <button
                      type="button"
                      key={sub.id}
                      onClick={() => toggleSubject(sub.name)}
                      className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                        isChecked
                          ? 'bg-slate-900 text-white font-medium'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fee & Live Proration */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
              3. Monthly Fee Terms & Proration
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Regular Monthly Fee (PKR) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={regularMonthlyFee}
                  onChange={(e) => setRegularMonthlyFee(roundHalfUp(Number(e.target.value)))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Voucher Due Day of Month</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Quiet Proration Box */}
            {proration && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold">Calculated Admission-Month Fee:</span>
                  <span className="font-bold font-mono text-sm text-slate-900">{formatPKR(proration.finalProratedFee)}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {proration.chargeableDays} chargeable days out of {proration.monthLength} in month ({formatPKR(regularMonthlyFee)} × {proration.chargeableDays}/{proration.monthLength}). From next month, full fee of {formatPKR(regularMonthlyFee)} applies.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-200 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition cursor-pointer"
          >
            {submitting ? 'Registering...' : 'Register Student'}
          </button>
        </div>
      </div>
    </div>
  );
};
