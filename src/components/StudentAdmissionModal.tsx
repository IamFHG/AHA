import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  GraduationCap,
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Calculator,
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
  // Form state
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

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
  const [admissionRemarks, setAdmissionRemarks] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Update default fee when class changes
  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const selectedClass = classes.find(c => c.id === newClassId);
    if (selectedClass) {
      setRegularMonthlyFee(selectedClass.defaultMonthlyFee);
    }
  };

  // Real-time admission proration calculation
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
    setStudentPhone('');
    setFatherPhone('');
    setGuardianPhone('');
    setAddress('');
    setEmergencyContact('');
    setSelectedSubjects([]);
    setPreviousSchool('');
    setAcademicNotes('');
    setDiscountType('none');
    setDiscountValue(0);
    setAdmissionRemarks('');
    setErrorMessage(null);
    setDuplicateWarning(null);
  };

  const handleSubmit = async (addAnother: boolean = false) => {
    setErrorMessage(null);
    setDuplicateWarning(null);

    if (!fullName.trim()) {
      setErrorMessage('Full Student Name is required.');
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
        studentPhone: studentPhone.trim() || undefined,
        fatherPhone: fatherPhone.trim() || undefined,
        guardianPhone: guardianPhone.trim() || undefined,
        address: address.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
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
        admissionRemarks: admissionRemarks.trim() || undefined,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/30">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">New Student Admission</h2>
              <p className="text-xs text-slate-400">Complete student registration and automatic fee proration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Error & Warning Banners */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}
          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center space-x-2 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Section 1: Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
              <User className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">1. Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Ali"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Father's Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Yousuf"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Guardian's Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="If different from father"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Father's Phone Number <span className="text-emerald-600 font-normal">(Primary contact)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0300 1234567"
                  value={fatherPhone}
                  onChange={(e) => setFatherPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="Student mobile (if any)"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  placeholder="e.g. Uncle / 0321 9876543"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="House, Street, Area, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">2. Academic Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Enrolled Class / Grade <span className="text-red-500">*</span>
                </label>
                <select
                  value={classId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Default: PKR {c.defaultMonthlyFee})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Admission Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Session</label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} {s.isCurrent ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Enrolled Subjects</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {subjects.map((sub) => {
                    const isChecked = selectedSubjects.includes(sub.name);
                    return (
                      <button
                        type="button"
                        key={sub.id}
                        onClick={() => toggleSubject(sub.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          isChecked
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Previous School / Institute</label>
                <input
                  type="text"
                  placeholder="e.g. Beaconhouse / Army Public School"
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Scholarship candidate / Science stream"
                  value={academicNotes}
                  onChange={(e) => setAcademicNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Fee Information & Live Proration Engine Preview */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">3. Fee Details & Admission Month Proration</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Regular Monthly Fee (PKR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={regularMonthlyFee}
                  onChange={(e) => setRegularMonthlyFee(roundHalfUp(Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discount Concession</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                >
                  <option value="none">No Discount</option>
                  <option value="fixed">Fixed PKR Concession</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>

              {discountType !== 'none' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (PKR)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monthly Voucher Due Day</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Authoritative Proration Engine Live Calculation Card (Section 8) */}
            {proration && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-emerald-900">
                    <Calculator className="h-4 w-4 text-emerald-700" />
                    <span>Authoritative Section 8 Admission-Month Calculation Preview</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Calendar-Day Prorated
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block text-[10px]">Month Length (D)</span>
                    <span className="font-bold text-slate-800">{proration.monthLength} days</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block text-[10px]">Admission Day (A)</span>
                    <span className="font-bold text-slate-800">Day {proration.admissionDay}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block text-[10px]">Chargeable (C=D-A+1)</span>
                    <span className="font-bold text-emerald-700">{proration.chargeableDays} days</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block text-[10px]">Admission Month Fee</span>
                    <span className="font-black text-emerald-800 text-sm">{formatPKR(proration.finalProratedFee)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-800 italic pt-1">
                  Formula: {regularMonthlyFee} × {proration.chargeableDays} / {proration.monthLength} = {proration.rawAmount.toFixed(4)} → rounded half-up to {formatPKR(proration.finalProratedFee)}. Beginning next calendar month, the full regular fee of {formatPKR(regularMonthlyFee)} will apply.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Unique Student ID will be generated automatically upon saving.
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 text-xs font-semibold transition"
            >
              Save & Add Another
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
            >
              {submitting ? (
                <span>Registering...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Register Student</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
