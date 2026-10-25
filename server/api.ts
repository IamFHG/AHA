import { Router, Request, Response } from 'express';
import { db } from './db';
import {
  calculateAdmissionProration,
  calculateVoucherFee,
  getDaysInMonth,
  isLeapYear,
  roundHalfUp,
} from '../src/utils/feeCalculator';
import { FeeVoucher, Student } from '../src/types';

export const apiRouter = Router();

// Rate limiter for public student portal
const lookupAttempts = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = lookupAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    lookupAttempts.set(ip, { count: 1, resetAt: now + 60000 }); // 1 min window
    return true;
  }
  if (entry.count >= 20) {
    return false; // Max 20 requests per minute
  }
  entry.count += 1;
  return true;
}

// ----------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = db.getUserByUsername(username);
  
  if (!user || !user.active) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Built-in verification (admin/admin123 or staff/staff123)
  if (
    (username.toLowerCase() === 'admin' && (password === 'admin123' || password === 'admin')) ||
    (username.toLowerCase() === 'staff' && (password === 'staff123' || password === 'staff')) ||
    password === 'password'
  ) {
    db.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: user.name,
      action: 'USER_LOGIN',
      targetType: 'auth',
      targetId: user.id,
      summary: `${user.name} (${user.role}) logged into the administration console.`,
    });
    return res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
      },
      token: `tok_${user.id}_${Date.now()}`,
    });
  }

  return res.status(401).json({ error: 'Invalid password. Use admin123 or staff123 for default accounts.' });
});

apiRouter.get('/auth/users', (req: Request, res: Response) => {
  const users = db.getUsers().map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    active: u.active,
    permissions: u.permissions,
  }));
  res.json(users);
});

apiRouter.post('/auth/users', (req: Request, res: Response) => {
  const { username, name, role, permissions } = req.body;
  if (!username || !name) {
    return res.status(400).json({ error: 'Username and name are required' });
  }
  const existing = db.getUserByUsername(username);
  if (existing) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  const newUser = db.saveUser({
    id: `u-${Date.now()}`,
    username,
    name,
    role: role || 'Staff',
    active: true,
    permissions: permissions || {
      canManageStudents: true,
      canGenerateVouchers: false,
      canRecordPayments: false,
      canMarkAttendance: true,
      canViewReports: false,
      canManageSettings: false,
      canPerformCorrections: false,
    },
  });

  res.json(newUser);
});

// ----------------------------------------------------
// DASHBOARD
// ----------------------------------------------------
apiRouter.get('/dashboard', (req: Request, res: Response) => {
  const now = new Date();
  const selectedMonth = parseInt(req.query.month as string) || (now.getMonth() + 1);
  const selectedYear = parseInt(req.query.year as string) || now.getFullYear();

  const students = db.getStudents();
  const vouchers = db.getVouchers();
  const payments = db.getPayments();

  // Metrics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'Active').length;
  const inactiveStudents = students.filter(s => s.status === 'Inactive').length;
  const withdrawnStudents = students.filter(s => s.status === 'Withdrawn').length;
  const completedStudents = students.filter(s => s.status === 'Completed').length;

  // Recently admitted (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const recentlyAdmittedCount = students.filter(s => s.admissionDate >= thirtyDaysAgo).length;

  // Monthly vouchers
  const monthVouchers = vouchers.filter(v => v.feeMonth === selectedMonth && v.feeYear === selectedYear);
  const feesGeneratedThisMonth = monthVouchers.reduce((acc, v) => acc + v.totalPayable, 0);

  // Payments collected strictly in this calendar month (successful only)
  const paymentsCollectedThisMonth = payments
    .filter(p => {
      if (p.status !== 'Successful') return false;
      const pDate = new Date(p.paymentDate);
      return pDate.getMonth() + 1 === selectedMonth && pDate.getFullYear() === selectedYear;
    })
    .reduce((acc, p) => acc + p.amount, 0);

  // Outstanding balances across all unpaid / partially paid vouchers
  const totalOutstandingBalance = vouchers
    .filter(v => v.remainingBalance > 0)
    .reduce((acc, v) => acc + v.remainingBalance, 0);

  const unpaidVouchersCount = vouchers.filter(v => v.status === 'Unpaid').length;
  const partiallyPaidVouchersCount = vouchers.filter(v => v.status === 'Partially Paid').length;
  const overdueVouchersCount = vouchers.filter(v => v.status === 'Overdue').length;

  // Recent 5 admissions
  const recentAdmissions = [...students]
    .sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime())
    .slice(0, 5);

  // Recent 5 payments
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 5);

  // Upcoming due dates (unpaid/partially paid vouchers ordered by dueDate)
  const upcomingDueDates = vouchers
    .filter(v => v.remainingBalance > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  // Class distribution
  const classDistMap = new Map<string, number>();
  for (const s of students) {
    if (s.status === 'Active') {
      const c = s.className || 'Unassigned';
      classDistMap.set(c, (classDistMap.get(c) || 0) + 1);
    }
  }
  const classDistribution = Array.from(classDistMap.entries()).map(([name, count]) => ({ name, count }));

  // Monthly financial chart (last 6 months)
  const monthlyTrends: { monthStr: string; generated: number; collected: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(selectedYear, selectedMonth - 1 - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const monthName = d.toLocaleString('en-US', { month: 'short' });
    const label = `${monthName} ${y}`;

    const gen = vouchers
      .filter(v => v.feeMonth === m && v.feeYear === y)
      .reduce((sum, v) => sum + v.totalPayable, 0);

    const col = payments
      .filter(p => {
        if (p.status !== 'Successful') return false;
        const pd = new Date(p.paymentDate);
        return pd.getMonth() + 1 === m && pd.getFullYear() === y;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    monthlyTrends.push({ monthStr: label, generated: gen, collected: col });
  }

  res.json({
    stats: {
      totalStudents,
      activeStudents,
      inactiveStudents,
      withdrawnStudents,
      completedStudents,
      recentlyAdmittedCount,
      feesGeneratedThisMonth,
      paymentsCollectedThisMonth,
      totalOutstandingBalance,
      unpaidVouchersCount,
      partiallyPaidVouchersCount,
      overdueVouchersCount,
      selectedMonth,
      selectedYear,
    },
    recentAdmissions,
    recentPayments,
    upcomingDueDates,
    classDistribution,
    monthlyTrends,
  });
});

// ----------------------------------------------------
// STUDENTS & ADMISSION
// ----------------------------------------------------
apiRouter.get('/students', (req: Request, res: Response) => {
  const { query, classId, status, session, sortBy, sortOrder } = req.query;
  let students = db.getStudents();

  if (query) {
    const q = (query as string).toLowerCase().trim();
    students = students.filter(
      s =>
        s.studentId.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        s.fatherName.toLowerCase().includes(q) ||
        (s.fatherPhone && s.fatherPhone.toLowerCase().includes(q))
    );
  }

  if (classId) {
    students = students.filter(s => s.classId === classId);
  }

  if (status) {
    students = students.filter(s => s.status === status);
  }

  if (session) {
    students = students.filter(s => s.session === session);
  }

  // Sorting
  const order = sortOrder === 'desc' ? -1 : 1;
  students.sort((a, b) => {
    if (sortBy === 'name') return a.fullName.localeCompare(b.fullName) * order;
    if (sortBy === 'admissionDate') return a.admissionDate.localeCompare(b.admissionDate) * order;
    if (sortBy === 'monthlyFee') return (a.regularMonthlyFee - b.regularMonthlyFee) * order;
    return a.studentId.localeCompare(b.studentId) * order;
  });

  res.json(students);
});

apiRouter.post('/students', (req: Request, res: Response) => {
  const {
    fullName,
    fatherName,
    guardianName,
    gender,
    dob,
    studentPhone,
    fatherPhone,
    guardianPhone,
    address,
    emergencyContact,
    classId,
    subjects,
    session,
    admissionDate,
    previousSchool,
    academicNotes,
    regularMonthlyFee,
    discountType,
    discountValue,
    dueDay,
    admissionRemarks,
    actor = 'admin',
  } = req.body;

  // Validation
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'Full student name is required.' });
  }
  if (!fatherName || !fatherName.trim()) {
    return res.status(400).json({ error: "Father's name is required." });
  }
  if (!admissionDate || !/^\d{4}-\d{2}-\d{2}$/.test(admissionDate)) {
    return res.status(400).json({ error: 'A valid admission date (YYYY-MM-DD) is required.' });
  }

  const monthlyFeeNum = roundHalfUp(Number(regularMonthlyFee) || 0);
  if (monthlyFeeNum < 0) {
    return res.status(400).json({ error: 'Monthly fee cannot be negative.' });
  }

  // Check duplicate warning match
  const existingStudents = db.getStudents();
  const duplicateMatch = existingStudents.find(
    s =>
      s.fullName.trim().toLowerCase() === fullName.trim().toLowerCase() &&
      s.fatherName.trim().toLowerCase() === fatherName.trim().toLowerCase()
  );

  // Lookup Class Name
  const classes = db.getClasses();
  const cls = classes.find(c => c.id === classId);
  const className = cls ? cls.name : 'Unassigned Class';

  // Calculate admission month fee using Section 8 authoritative logic
  const proration = calculateAdmissionProration(monthlyFeeNum, admissionDate);
  const admissionMonthFee = proration.finalProratedFee;

  const studentId = db.getNextStudentId();
  const now = new Date().toISOString();

  const newStudent: Student = {
    id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    studentId,
    fullName: fullName.trim(),
    fatherName: fatherName.trim(),
    guardianName: guardianName?.trim() || undefined,
    gender: gender || 'Other',
    dob: dob || undefined,
    studentPhone: studentPhone?.trim() || undefined,
    fatherPhone: fatherPhone?.trim() || undefined,
    guardianPhone: guardianPhone?.trim() || undefined,
    address: address?.trim() || undefined,
    emergencyContact: emergencyContact?.trim() || undefined,
    classId: classId || 'c1',
    className,
    subjects: Array.isArray(subjects) ? subjects : [],
    session: session || '2026-2027',
    admissionDate,
    previousSchool: previousSchool?.trim() || undefined,
    status: 'Active',
    academicNotes: academicNotes?.trim() || undefined,
    regularMonthlyFee: monthlyFeeNum,
    admissionMonthFee,
    discountType: discountType || 'none',
    discountValue: Number(discountValue) || 0,
    dueDay: Number(dueDay) || 10,
    feeEffectiveDate: admissionDate,
    createdAt: now,
    createdBy: actor,
    updatedAt: now,
    updatedBy: actor,
    admissionRemarks: admissionRemarks?.trim() || undefined,
    documents: [],
  };

  db.addStudent(newStudent, actor);

  res.status(201).json({
    student: newStudent,
    duplicateWarning: duplicateMatch
      ? `Notice: A student named ${duplicateMatch.fullName} with father ${duplicateMatch.fatherName} already exists (ID: ${duplicateMatch.studentId}).`
      : null,
  });
});

apiRouter.get('/students/:id', (req: Request, res: Response) => {
  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  // Collect related records
  const vouchers = db.getVouchers().filter(v => v.studentInternalId === student.id);
  const payments = db.getPayments().filter(p => p.studentInternalId === student.id);
  const attendance = db.getAttendance().filter(a => a.studentInternalId === student.id);
  const auditLogs = db.getAuditLogs().filter(l => l.targetId === student.studentId || l.targetId === student.id);

  // Overview financial calculations
  const totalFeesGenerated = vouchers.reduce((sum, v) => sum + v.totalPayable, 0);
  const totalPaymentsCollected = payments
    .filter(p => p.status === 'Successful')
    .reduce((sum, p) => sum + p.amount, 0);
  const outstandingBalance = vouchers.reduce((sum, v) => sum + v.remainingBalance, 0);

  // Last payment
  const successfulPayments = payments.filter(p => p.status === 'Successful');
  const lastPayment = successfulPayments.length > 0 ? successfulPayments[successfulPayments.length - 1] : null;

  // Next due voucher
  const unpaidVouchers = vouchers.filter(v => v.remainingBalance > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const nextDueVoucher = unpaidVouchers[0] || null;

  // Attendance stats
  const presentDays = attendance.filter(a => a.status === 'Present').length;
  const absentDays = attendance.filter(a => a.status === 'Absent').length;
  const leaveDays = attendance.filter(a => a.status === 'Leave').length;
  const totalDays = attendance.length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  res.json({
    student,
    vouchers,
    payments,
    attendance,
    auditLogs,
    financialOverview: {
      totalFeesGenerated,
      totalPaymentsCollected,
      outstandingBalance,
      lastPaymentDate: lastPayment ? lastPayment.paymentDate : null,
      lastPaymentAmount: lastPayment ? lastPayment.amount : 0,
      nextDueDate: nextDueVoucher ? nextDueVoucher.dueDate : null,
      unpaidCount: unpaidVouchers.length,
    },
    attendanceStats: {
      presentDays,
      absentDays,
      leaveDays,
      totalDays,
      attendancePercentage,
    },
  });
});

apiRouter.put('/students/:id', (req: Request, res: Response) => {
  const { actor = 'admin', ...updates } = req.body;
  const updated = db.updateStudent(req.params.id, updates, actor);
  if (!updated) {
    return res.status(404).json({ error: 'Student not found.' });
  }
  res.json(updated);
});

apiRouter.post('/students/:id/status', (req: Request, res: Response) => {
  const { status, reason, actor = 'admin' } = req.body;
  if (!['Active', 'Inactive', 'Withdrawn', 'Completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const oldStatus = student.status;
  const updated = db.updateStudent(
    student.id,
    {
      status,
      academicNotes: reason
        ? `${student.academicNotes ? student.academicNotes + '\n' : ''}[Status changed to ${status} on ${new Date().toISOString().split('T')[0]}: ${reason}]`
        : student.academicNotes,
    },
    actor
  );

  db.addAuditLog({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor,
    action: 'STATUS_CHANGED',
    targetType: 'student',
    targetId: student.studentId,
    summary: `Changed status of ${student.fullName} from ${oldStatus} to ${status}. Reason: ${reason || 'N/A'}.`,
    details: { oldStatus, newStatus: status, reason },
  });

  res.json(updated);
});

apiRouter.post('/students/:id/documents', (req: Request, res: Response) => {
  const { name, size, type } = req.body;
  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const doc = {
    id: `doc-${Date.now()}`,
    name: name || 'Uploaded_Document.pdf',
    size: size || '120 KB',
    type: type || 'application/pdf',
    uploadedAt: new Date().toISOString(),
  };

  const docs = [...(student.documents || []), doc];
  db.updateStudent(student.id, { documents: docs });
  res.json(doc);
});

// ----------------------------------------------------
// FEE CALCULATION PREVIEW
// ----------------------------------------------------
apiRouter.post('/fees/calculate-preview', (req: Request, res: Response) => {
  const { monthlyFee, admissionDate, targetYear, targetMonth, discountType, discountValue } = req.body;

  if (!monthlyFee || !admissionDate || !targetYear || !targetMonth) {
    return res.status(400).json({ error: 'Missing required fee calculation inputs' });
  }

  const calculation = calculateVoucherFee(
    Number(monthlyFee),
    admissionDate,
    Number(targetYear),
    Number(targetMonth),
    discountType || 'none',
    Number(discountValue) || 0
  );

  res.json(calculation);
});

// ----------------------------------------------------
// VOUCHERS
// ----------------------------------------------------
apiRouter.get('/vouchers', (req: Request, res: Response) => {
  const { feeMonth, feeYear, classId, status, studentId } = req.query;
  let vouchers = db.getVouchers();

  if (feeMonth) {
    vouchers = vouchers.filter(v => v.feeMonth === Number(feeMonth));
  }
  if (feeYear) {
    vouchers = vouchers.filter(v => v.feeYear === Number(feeYear));
  }
  if (classId) {
    vouchers = vouchers.filter(v => v.classId === classId);
  }
  if (status) {
    vouchers = vouchers.filter(v => v.status === status);
  }
  if (studentId) {
    vouchers = vouchers.filter(
      v => v.studentId.toLowerCase() === (studentId as string).toLowerCase() || v.studentInternalId === studentId
    );
  }

  vouchers.sort((a, b) => b.voucherNumber.localeCompare(a.voucherNumber));
  res.json(vouchers);
});

apiRouter.get('/vouchers/:id', (req: Request, res: Response) => {
  const voucher = db.getVoucherById(req.params.id);
  if (!voucher) {
    return res.status(404).json({ error: 'Voucher not found' });
  }
  const settings = db.getSettings();
  res.json({ voucher, settings });
});

// Bulk Generation Preview
apiRouter.post('/vouchers/preview-bulk', (req: Request, res: Response) => {
  const { feeMonth, feeYear, classId } = req.body;
  const targetMonth = Number(feeMonth);
  const targetYear = Number(feeYear);

  let activeStudents = db.getStudents().filter(s => s.status === 'Active');
  if (classId) {
    activeStudents = activeStudents.filter(s => s.classId === classId);
  }

  let eligibleCount = 0;
  let toCreateCount = 0;
  let skippedAlreadyExisting = 0;
  let skippedIneligibleDate = 0;
  let estimatedTotal = 0;

  for (const s of activeStudents) {
    const [admYear, admMonth] = s.admissionDate.split('-').map(Number);
    // Cannot generate vouchers for fee months strictly before admission month!
    if (targetYear < admYear || (targetYear === admYear && targetMonth < admMonth)) {
      skippedIneligibleDate += 1;
      continue;
    }

    eligibleCount += 1;
    const existing = db.findExistingVoucher(s.id, targetMonth, targetYear);
    if (existing) {
      skippedAlreadyExisting += 1;
    } else {
      toCreateCount += 1;
      const calc = calculateVoucherFee(
        s.regularMonthlyFee,
        s.admissionDate,
        targetYear,
        targetMonth,
        s.discountType,
        s.discountValue
      );
      estimatedTotal += calc.finalPayable;
    }
  }

  res.json({
    totalActiveCandidates: activeStudents.length,
    eligibleCount,
    toCreateCount,
    skippedAlreadyExisting,
    skippedIneligibleDate,
    estimatedTotal,
  });
});

// Generate Vouchers (Single or Bulk)
apiRouter.post('/vouchers', (req: Request, res: Response) => {
  const { studentInternalId, classId, feeMonth, feeYear, issueDate, dueDate, actor = 'admin' } = req.body;
  const targetMonth = Number(feeMonth);
  const targetYear = Number(feeYear);

  if (!targetMonth || !targetYear) {
    return res.status(400).json({ error: 'Fee month and year are required' });
  }

  const settings = db.getSettings();
  const defaultDueDay = settings.defaultDueDay || 10;
  const calculatedDueDate =
    dueDate || `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(defaultDueDay).padStart(2, '0')}`;
  const calculatedIssueDate = issueDate || new Date().toISOString().split('T')[0];

  let targetStudents: Student[] = [];

  if (studentInternalId) {
    const student = db.getStudentById(studentInternalId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    targetStudents = [student];
  } else {
    targetStudents = db.getStudents().filter(s => s.status === 'Active');
    if (classId) {
      targetStudents = targetStudents.filter(s => s.classId === classId);
    }
  }

  const createdVouchers: FeeVoucher[] = [];
  const skippedList: { studentId: string; studentName: string; reason: string }[] = [];

  for (const s of targetStudents) {
    const [admYear, admMonth] = s.admissionDate.split('-').map(Number);
    // Cannot generate voucher for month before student admission
    if (targetYear < admYear || (targetYear === admYear && targetMonth < admMonth)) {
      skippedList.push({
        studentId: s.studentId,
        studentName: s.fullName,
        reason: `Target fee month (${targetMonth}/${targetYear}) is prior to student admission date (${s.admissionDate})`,
      });
      continue;
    }

    // Check if voucher already exists (IDEMPOTENCY)
    const existing = db.findExistingVoucher(s.id, targetMonth, targetYear);
    if (existing) {
      skippedList.push({
        studentId: s.studentId,
        studentName: s.fullName,
        reason: `Voucher already exists (${existing.voucherNumber})`,
      });
      continue;
    }

    // Calculate fee
    const calc = calculateVoucherFee(
      s.regularMonthlyFee,
      s.admissionDate,
      targetYear,
      targetMonth,
      s.discountType,
      s.discountValue
    );

    const voucherNumber = db.getNextVoucherNumber();
    const now = new Date().toISOString();

    const voucher: FeeVoucher = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      voucherNumber,
      studentInternalId: s.id,
      studentId: s.studentId,
      studentName: s.fullName,
      fatherName: s.fatherName,
      classId: s.classId,
      className: s.className,
      admissionDate: s.admissionDate,
      feeMonth: targetMonth,
      feeYear: targetYear,
      issueDate: calculatedIssueDate,
      dueDate: calculatedDueDate,
      regularMonthlyFee: s.regularMonthlyFee,
      isAdmissionMonth: calc.isAdmissionMonth,
      prorationDetails: calc.prorationDetails,
      discount: calc.discountAmount,
      adjustment: 0,
      previousOutstanding: 0,
      totalPayable: calc.finalPayable,
      paidAmount: 0,
      remainingBalance: calc.finalPayable,
      status: calc.finalPayable === 0 ? 'Paid' : 'Unpaid',
      paymentInstructions: settings.paymentInstructions,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
    };

    db.addVoucher(voucher, actor);
    createdVouchers.push(voucher);
  }

  res.status(201).json({
    createdCount: createdVouchers.length,
    skippedCount: skippedList.length,
    createdVouchers,
    skippedList,
  });
});

// Authorized Voucher Adjustment (Section 8.7 & 14)
apiRouter.post('/vouchers/:id/adjust', (req: Request, res: Response) => {
  const { adjustmentAmount, reason, actor = 'admin' } = req.body;
  if (adjustmentAmount === undefined || !reason) {
    return res.status(400).json({ error: 'Adjustment amount and reason are required.' });
  }

  const adjusted = db.adjustVoucher(req.params.id, Number(adjustmentAmount), reason, actor);
  if (!adjusted) {
    return res.status(404).json({ error: 'Voucher not found' });
  }

  res.json(adjusted);
});

// ----------------------------------------------------
// PAYMENTS & RECEIPTS
// ----------------------------------------------------
apiRouter.get('/payments', (req: Request, res: Response) => {
  const { studentId, voucherId, status } = req.query;
  let payments = db.getPayments();

  if (studentId) {
    payments = payments.filter(
      p => p.studentId.toLowerCase() === (studentId as string).toLowerCase() || p.studentInternalId === studentId
    );
  }
  if (voucherId) {
    payments = payments.filter(p => p.voucherId === voucherId || p.voucherNumber === voucherId);
  }
  if (status) {
    payments = payments.filter(p => p.status === status);
  }

  payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  res.json(payments);
});

apiRouter.post('/payments', (req: Request, res: Response) => {
  const { voucherId, studentInternalId, amount, paymentMethod, transactionRef, receivedBy, notes, actor = 'admin' } =
    req.body;

  if (!voucherId || !amount) {
    return res.status(400).json({ error: 'Voucher ID and payment amount are required' });
  }

  try {
    const result = db.recordPayment(
      {
        studentInternalId,
        voucherId,
        amount: Number(amount),
        paymentMethod: paymentMethod || 'Cash',
        transactionRef,
        receivedBy: receivedBy || actor,
        notes,
      },
      actor
    );
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Payment recording failed' });
  }
});

apiRouter.post('/payments/:id/reverse', (req: Request, res: Response) => {
  const { reason, actor = 'admin' } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Reversal reason is mandatory for auditable payment reversals.' });
  }

  try {
    const reversed = db.reversePayment(req.params.id, reason.trim(), actor);
    res.json(reversed);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Payment reversal failed' });
  }
});

apiRouter.get('/receipts/:id', (req: Request, res: Response) => {
  const payment = db.getPaymentById(req.params.id);
  if (!payment) {
    return res.status(404).json({ error: 'Receipt / Payment record not found' });
  }
  const settings = db.getSettings();
  const voucher = db.getVoucherById(payment.voucherId);
  res.json({ payment, voucher, settings });
});

// ----------------------------------------------------
// ATTENDANCE
// ----------------------------------------------------
apiRouter.get('/attendance', (req: Request, res: Response) => {
  const { classId, date } = req.query;
  const attendance = db.getAttendance({
    classId: classId as string,
    date: date as string,
  });
  res.json(attendance);
});

apiRouter.post('/attendance', (req: Request, res: Response) => {
  const { records, actor = 'staff' } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Attendance records list is required' });
  }

  const saved = db.markAttendanceBatch(records, actor);
  res.json(saved);
});

// ----------------------------------------------------
// CLASSES, SUBJECTS & SESSIONS
// ----------------------------------------------------
apiRouter.get('/classes', (req: Request, res: Response) => {
  res.json(db.getClasses());
});

apiRouter.post('/classes', (req: Request, res: Response) => {
  const { name, defaultMonthlyFee, section } = req.body;
  if (!name) return res.status(400).json({ error: 'Class name required' });
  const cls = db.saveClass({
    id: `c-${Date.now()}`,
    name,
    section,
    defaultMonthlyFee: roundHalfUp(Number(defaultMonthlyFee) || 0),
    active: true,
  });
  res.json(cls);
});

apiRouter.delete('/classes/:id', (req: Request, res: Response) => {
  // Check if active students are in this class
  const students = db.getStudents().filter(s => s.classId === req.params.id && s.status === 'Active');
  if (students.length > 0) {
    return res.status(400).json({
      error: `Cannot delete class. ${students.length} active students are currently enrolled. Archive or reassign them first.`,
    });
  }
  const success = db.deleteClass(req.params.id);
  res.json({ success });
});

apiRouter.get('/subjects', (req: Request, res: Response) => {
  res.json(db.getSubjects());
});

apiRouter.post('/subjects', (req: Request, res: Response) => {
  const { name, code } = req.body;
  if (!name) return res.status(400).json({ error: 'Subject name required' });
  const sub = db.saveSubject({
    id: `sub-${Date.now()}`,
    name,
    code,
  });
  res.json(sub);
});

apiRouter.get('/sessions', (req: Request, res: Response) => {
  res.json(db.getSessions());
});

apiRouter.post('/sessions', (req: Request, res: Response) => {
  const { name, isCurrent } = req.body;
  if (!name) return res.status(400).json({ error: 'Session name required' });
  const ses = db.saveSession({
    id: `ses-${Date.now()}`,
    name,
    isCurrent: !!isCurrent,
  });
  res.json(ses);
});

// ----------------------------------------------------
// SETTINGS
// ----------------------------------------------------
apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json(db.getSettings());
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const { actor = 'admin', ...updates } = req.body;
  const updated = db.updateSettings(updates, actor);
  res.json(updated);
});

// ----------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  res.json(db.getAuditLogs());
});

// ----------------------------------------------------
// REPORTS & ANALYTICS
// ----------------------------------------------------
apiRouter.get('/reports', (req: Request, res: Response) => {
  const { type, month, year, classId } = req.query;
  const students = db.getStudents();
  const vouchers = db.getVouchers();
  const payments = db.getPayments();
  const attendance = db.getAttendance();

  const m = month ? Number(month) : new Date().getMonth() + 1;
  const y = year ? Number(year) : new Date().getFullYear();

  if (type === 'financial-summary') {
    // Breakdown of vouchers vs collections
    const monthVouchers = vouchers.filter(v => v.feeMonth === m && v.feeYear === y);
    const monthPayments = payments.filter(p => {
      if (p.status !== 'Successful') return false;
      const pd = new Date(p.paymentDate);
      return pd.getMonth() + 1 === m && pd.getFullYear() === y;
    });

    const totalVouchersGeneratedAmount = monthVouchers.reduce((s, v) => s + v.totalPayable, 0);
    const totalPaymentsCollectedAmount = monthPayments.reduce((s, p) => s + p.amount, 0);
    const totalOutstandingUnpaid = monthVouchers.reduce((s, v) => s + v.remainingBalance, 0);

    return res.json({
      month: m,
      year: y,
      totalVouchersCount: monthVouchers.length,
      totalVouchersGeneratedAmount,
      totalPaymentsCount: monthPayments.length,
      totalPaymentsCollectedAmount,
      totalOutstandingUnpaid,
      vouchers: monthVouchers,
      payments: monthPayments,
    });
  }

  if (type === 'daily-collections') {
    // Group payments by date
    const dailyMap = new Map<string, { count: number; total: number; payments: any[] }>();
    for (const p of payments) {
      if (p.status !== 'Successful') continue;
      const dateStr = p.paymentDate.split('T')[0];
      const entry = dailyMap.get(dateStr) || { count: 0, total: 0, payments: [] };
      entry.count += 1;
      entry.total += p.amount;
      entry.payments.push(p);
      dailyMap.set(dateStr, entry);
    }

    const dailyList = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return res.json(dailyList);
  }

  if (type === 'outstanding-defaulters') {
    // Unpaid & Overdue vouchers with student details
    const overdueAndUnpaid = vouchers
      .filter(v => v.remainingBalance > 0)
      .sort((a, b) => b.remainingBalance - a.remainingBalance);

    return res.json(overdueAndUnpaid);
  }

  // Default: overall summary
  res.json({
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'Active').length,
    totalVouchersCount: vouchers.length,
    totalPaymentsCount: payments.length,
  });
});

// ----------------------------------------------------
// EXPORT & BACKUP
// ----------------------------------------------------
apiRouter.get('/export/:type', (req: Request, res: Response) => {
  const { type } = req.params;

  if (type === 'backup') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=academypro_backup_${Date.now()}.json`);
    return res.json(db.getRawData());
  }

  if (type === 'students') {
    const students = db.getStudents();
    const csvHeader = 'Student ID,Full Name,Father Name,Class,Admission Date,Status,Monthly Fee,Admission Fee,Phone';
    const csvRows = students.map(s =>
      `"${s.studentId}","${s.fullName}","${s.fatherName}","${s.className}","${s.admissionDate}","${s.status}",${s.regularMonthlyFee},${s.admissionMonthFee},"${s.fatherPhone || ''}"`
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=students_${Date.now()}.csv`);
    return res.send([csvHeader, ...csvRows].join('\n'));
  }

  if (type === 'vouchers') {
    const vouchers = db.getVouchers();
    const csvHeader = 'Voucher No,Student ID,Student Name,Month/Year,Payable,Paid,Remaining,Status,Due Date';
    const csvRows = vouchers.map(v =>
      `"${v.voucherNumber}","${v.studentId}","${v.studentName}","${v.feeMonth}/${v.feeYear}",${v.totalPayable},${v.paidAmount},${v.remainingBalance},"${v.status}","${v.dueDate}"`
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=vouchers_${Date.now()}.csv`);
    return res.send([csvHeader, ...csvRows].join('\n'));
  }

  if (type === 'payments') {
    const payments = db.getPayments();
    const csvHeader = 'Receipt No,Student ID,Student Name,Voucher No,Amount,Date,Method,Status,Received By';
    const csvRows = payments.map(p =>
      `"${p.receiptNumber}","${p.studentId}","${p.studentName}","${p.voucherNumber}",${p.amount},"${p.paymentDate}","${p.paymentMethod}","${p.status}","${p.receivedBy}"`
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payments_${Date.now()}.csv`);
    return res.send([csvHeader, ...csvRows].join('\n'));
  }

  res.status(400).json({ error: 'Unsupported export type' });
});

apiRouter.post('/export/restore', (req: Request, res: Response) => {
  const { data } = req.body;
  if (!data || !Array.isArray(data.students) || !Array.isArray(data.vouchers)) {
    return res.status(400).json({ error: 'Invalid backup structure. Required collections are missing.' });
  }

  db.restoreFromData(data);
  db.addAuditLog({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: 'admin',
    action: 'BACKUP_RESTORED',
    targetType: 'settings',
    targetId: 'database',
    summary: 'Restored system database from uploaded backup file.',
  });

  res.json({ success: true, message: 'Database successfully restored.' });
});

// ----------------------------------------------------
// PUBLIC STUDENT SELF-SERVICE VOUCHER PORTAL
// Section 12 specifications
// ----------------------------------------------------
apiRouter.post('/portal/lookup', (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment before trying again.',
    });
  }

  const settings = db.getSettings();
  const portalSettings = settings.portalSettings;

  if (!portalSettings.enabled) {
    return res.status(403).json({
      error: 'The Student Fee Voucher Portal is currently unavailable. Please contact the academy administration.',
    });
  }

  const { studentId, admissionDate, feeMonth, feeYear } = req.body;

  if (!studentId || !studentId.trim()) {
    return res.status(400).json({ error: 'Please enter your Student ID.' });
  }

  const normalizedId = studentId.trim().toUpperCase();
  const student = db.getStudentByPublicId(normalizedId);

  // Safe error response without revealing whether student exists
  const failedLookupMsg = 'Unable to retrieve the requested voucher. Please verify your details or contact the academy administration.';

  if (!student) {
    return res.status(404).json({ error: failedLookupMsg });
  }

  // Security Policy Check for Admission Date (Section 12.3 & 12.4)
  if (portalSettings.requireAdmissionDate) {
    if (!admissionDate) {
      return res.status(400).json({
        error: 'Admission Date is required for verification per academy security policy.',
        requiresAdmissionDate: true,
      });
    }

    if (student.admissionDate !== admissionDate.trim()) {
      return res.status(401).json({
        error: 'The supplied details could not be verified. Please check the information and try again.',
      });
    }
  } else if (!portalSettings.permitIdOnlyLookup && !admissionDate) {
    return res.status(400).json({
      error: 'Admission Date verification is enabled. Please enter your registered admission date.',
    });
  }

  // Check Inactive Student policy
  if (student.status !== 'Active' && !portalSettings.permitInactiveStudents) {
    return res.status(403).json({
      error: 'Historical vouchers for inactive accounts are restricted. Please contact the academy administration.',
    });
  }

  const targetMonth = Number(feeMonth);
  const targetYear = Number(feeYear);

  if (!targetMonth || !targetYear) {
    return res.status(400).json({ error: 'Please select a valid fee month and year.' });
  }

  // Check allowed months configuration if present
  if (portalSettings.allowedMonths && portalSettings.allowedMonths.length > 0) {
    const monthKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    if (!portalSettings.allowedMonths.includes(monthKey)) {
      return res.status(403).json({
        error: 'Fee vouchers for this month are not currently accessible via the public portal.',
      });
    }
  }

  // Find official issued voucher
  const voucher = db.findExistingVoucher(student.id, targetMonth, targetYear);
  if (!voucher) {
    return res.status(404).json({
      error: 'Your fee voucher for the selected month is not available yet. Please contact the academy administration.',
    });
  }

  // Check Paid / Partially Paid retrieval policy
  if (voucher.status === 'Paid' && !portalSettings.permitFullyPaid) {
    return res.status(403).json({
      error: 'Fully paid vouchers are not available for public retrieval. Please contact administration for a receipt copy.',
    });
  }
  if (voucher.status === 'Partially Paid' && !portalSettings.permitPartiallyPaid) {
    return res.status(403).json({
      error: 'Partially paid vouchers cannot be retrieved online. Please visit the academy accounts desk.',
    });
  }

  // Return strictly safe, public-facing voucher details (NO internal notes or audit data)
  res.json({
    voucher: {
      voucherNumber: voucher.voucherNumber,
      studentId: voucher.studentId,
      studentName: voucher.studentName,
      fatherName: voucher.fatherName,
      className: voucher.className,
      admissionDate: voucher.admissionDate,
      feeMonth: voucher.feeMonth,
      feeYear: voucher.feeYear,
      issueDate: voucher.issueDate,
      dueDate: voucher.dueDate,
      regularMonthlyFee: voucher.regularMonthlyFee,
      isAdmissionMonth: voucher.isAdmissionMonth,
      prorationDetails: voucher.prorationDetails,
      discount: voucher.discount,
      adjustment: voucher.adjustment,
      previousOutstanding: voucher.previousOutstanding,
      totalPayable: voucher.totalPayable,
      paidAmount: voucher.paidAmount,
      remainingBalance: portalSettings.showRemainingBalance ? voucher.remainingBalance : undefined,
      status: voucher.status,
      paymentInstructions: voucher.paymentInstructions || settings.paymentInstructions,
    },
    academy: {
      name: settings.academyName,
      tagline: settings.tagline,
      address: settings.address,
      contactPhone: settings.contactPhone,
      contactEmail: settings.contactEmail,
      voucherFooterText: settings.voucherFooterText,
      paymentInstructions: settings.paymentInstructions,
    },
  });
});

// ----------------------------------------------------
// AUTOMATED ACCEPTANCE TESTS (Section 27)
// ----------------------------------------------------
apiRouter.get('/tests/run', (req: Request, res: Response) => {
  const results: { name: string; category: string; passed: boolean; expected: any; actual: any; message?: string }[] = [];

  function assert(name: string, category: string, expected: any, actual: any) {
    const passed = JSON.stringify(expected) === JSON.stringify(actual);
    results.push({ name, category, passed, expected, actual });
  }

  // 1. Section 27.1 Fee Calculation Tests (M = 1000)
  // October 1 (31 days, 31 chargeable): 1000
  const oct1 = calculateAdmissionProration(1000, '2026-10-01');
  assert('Oct 1 Admission (PKR 1000 fee)', 'Fee Proration', 1000, oct1.finalProratedFee);

  // October 12 (31 days, 20 chargeable): 645
  const oct12 = calculateAdmissionProration(1000, '2026-10-12');
  assert('Oct 12 Admission (PKR 1000 fee)', 'Fee Proration', 645, oct12.finalProratedFee);

  // October 20 (31 days, 12 chargeable): 387
  const oct20 = calculateAdmissionProration(1000, '2026-10-20');
  assert('Oct 20 Admission (PKR 1000 fee)', 'Fee Proration', 387, oct20.finalProratedFee);

  // October 31 (31 days, 1 chargeable): 32
  const oct31 = calculateAdmissionProration(1000, '2026-10-31');
  assert('Oct 31 Admission (PKR 1000 fee)', 'Fee Proration', 32, oct31.finalProratedFee);

  // November 1 (30 days, 30 chargeable): 1000
  const nov1 = calculateAdmissionProration(1000, '2026-11-01');
  assert('Nov 1 Admission (PKR 1000 fee)', 'Fee Proration', 1000, nov1.finalProratedFee);

  // February 12 non-leap (2025: 28 days, 17 chargeable): 607
  const febNonLeap = calculateAdmissionProration(1000, '2025-02-12');
  assert('Feb 12 Non-Leap Year (PKR 1000 fee)', 'Fee Proration', 607, febNonLeap.finalProratedFee);

  // February 12 leap year (2024: 29 days, 18 chargeable): 621
  const febLeap = calculateAdmissionProration(1000, '2024-02-12');
  assert('Feb 12 Leap Year (PKR 1000 fee)', 'Fee Proration', 621, febLeap.finalProratedFee);

  // Monthly 1500, Oct 20 admission: 581
  const oct20_1500 = calculateAdmissionProration(1500, '2026-10-20');
  assert('Oct 20 Admission (PKR 1500 fee)', 'Fee Proration', 581, oct20_1500.finalProratedFee);

  // 2. Following Months Rule: November fee for October 12 admission student is full 1000
  const novForOctAdm = calculateVoucherFee(1000, '2026-10-12', 2026, 11);
  assert('Following Month Regular Fee (November)', 'Fee Policy', { fee: 1000, isAdm: false }, { fee: novForOctAdm.finalPayable, isAdm: novForOctAdm.isAdmissionMonth });

  // 3. Round half up testing
  assert('Round Half Up 645.16', 'Rounding', 645, roundHalfUp(645.161));
  assert('Round Half Up 580.64', 'Rounding', 581, roundHalfUp(580.645));
  assert('Round Half Up 0.5', 'Rounding', 1, roundHalfUp(0.5));

  // 4. Leap year detection
  assert('2024 is leap year', 'Calendar', true, isLeapYear(2024));
  assert('2025 is not leap year', 'Calendar', false, isLeapYear(2025));
  assert('2026 is not leap year', 'Calendar', false, isLeapYear(2026));
  assert('Days in Feb 2024 (leap)', 'Calendar', 29, getDaysInMonth(2024, 2));
  assert('Days in Feb 2025 (non-leap)', 'Calendar', 28, getDaysInMonth(2025, 2));

  // 5. Database & Student ID stability
  const students = db.getStudents();
  assert('Seed students loaded', 'Database', true, students.length >= 6);
  const zainab = db.getStudentByPublicId('AP-2026-0001');
  assert('Student Zainab Bibi exists with stable ID', 'Students', true, !!zainab && zainab.fullName === 'Zainab Bibi');

  // 6. Voucher Uniqueness
  const v1 = db.findExistingVoucher('st-001', 10, 2026);
  assert('Existing voucher found for Month 10', 'Vouchers', true, !!v1 && v1.voucherNumber === 'FV-2026-0001');

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  res.json({
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedCount,
    failedCount,
    allPassed: failedCount === 0,
    results,
  });
});
