import fs from 'fs';
import path from 'path';
import {
  Student,
  FeeVoucher,
  Payment,
  AttendanceRecord,
  AcademicClass,
  Subject,
  AcademicSession,
  AcademySettings,
  AuditLog,
  UserAccount,
} from '../src/types';
import { calculateAdmissionProration, roundHalfUp } from '../src/utils/feeCalculator';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'academy_db.json');

export interface DatabaseSchema {
  students: Student[];
  vouchers: FeeVoucher[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  classes: AcademicClass[];
  subjects: Subject[];
  sessions: AcademicSession[];
  settings: AcademySettings;
  users: UserAccount[];
  auditLogs: AuditLog[];
  sequenceNumbers: {
    student: number;
    voucher: number;
    receipt: number;
  };
}

const DEFAULT_SETTINGS: AcademySettings = {
  academyName: 'The Falcon Academy of Science & Arts',
  tagline: 'Excellence in Academics & Future Leadership',
  address: 'Plot 42-B, Main Boulevard, Gulberg III, Lahore, Pakistan',
  contactPhone: '+92 42 35789012 / +92 300 1234567',
  contactEmail: 'admissions@falconacademy.edu.pk',
  defaultMonthlyFee: 2500,
  studentIdPrefix: 'AP-2026-',
  voucherPrefix: 'FV-2026-',
  receiptPrefix: 'REC-2026-',
  defaultDueDay: 10,
  voucherFooterText: 'Fee once paid is non-refundable. Please keep this official receipt for your records.',
  paymentInstructions: 'Pay online via 1Link, EasyPaisa, JazzCash, or bank deposit at any Allied Bank branch. Reference Voucher Number on transaction.',
  portalSettings: {
    enabled: true,
    requireAdmissionDate: true,
    permitIdOnlyLookup: false,
    permitPartiallyPaid: true,
    permitFullyPaid: true,
    permitInactiveStudents: false,
    showRemainingBalance: true,
    allowedMonths: [],
    publicNotice: 'Welcome to the Student Fee Voucher Portal. Enter your official Student ID and Admission Date to retrieve your fee voucher.',
  },
};

function getInitialDatabase(): DatabaseSchema {
  const classes: AcademicClass[] = [
    { id: 'c1', name: 'Grade 9 - Science (Matric)', defaultMonthlyFee: 2500, active: true },
    { id: 'c2', name: 'Grade 10 - Matric', defaultMonthlyFee: 2800, active: true },
    { id: 'c3', name: 'O-Level Mathematics & Science', defaultMonthlyFee: 4500, active: true },
    { id: 'c4', name: 'F.Sc Pre-Medical (Part 1)', defaultMonthlyFee: 3500, active: true },
  ];

  const subjects: Subject[] = [
    { id: 's1', name: 'Mathematics', code: 'MATH' },
    { id: 's2', name: 'Physics', code: 'PHY' },
    { id: 's3', name: 'Chemistry', code: 'CHEM' },
    { id: 's4', name: 'Biology', code: 'BIO' },
    { id: 's5', name: 'English Language & Comp', code: 'ENG' },
    { id: 's6', name: 'Urdu', code: 'URD' },
    { id: 's7', name: 'Computer Science', code: 'CS' },
  ];

  const sessions: AcademicSession[] = [
    { id: 'ses1', name: '2025-2026', isCurrent: false },
    { id: 'ses2', name: '2026-2027', isCurrent: true },
  ];

  const users: UserAccount[] = [
    {
      id: 'u1',
      username: 'admin',
      name: 'Dr. Tariq Mahmood (Principal)',
      role: 'Admin',
      active: true,
      permissions: {
        canManageStudents: true,
        canGenerateVouchers: true,
        canRecordPayments: true,
        canMarkAttendance: true,
        canViewReports: true,
        canManageSettings: true,
        canPerformCorrections: true,
      },
    },
    {
      id: 'u2',
      username: 'staff',
      name: 'Samina Akhtar (Admissions Coordinator)',
      role: 'Staff',
      active: true,
      permissions: {
        canManageStudents: true,
        canGenerateVouchers: true,
        canRecordPayments: true,
        canMarkAttendance: true,
        canViewReports: true,
        canManageSettings: false,
        canPerformCorrections: false,
      },
    },
  ];

  // Seed students matching the exact test cases from authoritative spec:
  // 1. Zainab Bibi admitted October 12, 2026 (31 days, 20 chargeable days, 1000 monthly fee -> PKR 645)
  // 2. Muhammad Bilal admitted October 20, 2026 (31 days, 12 chargeable days, 1500 monthly fee -> PKR 581)
  // 3. Hamza Farooq admitted October 1, 2026 (Full month -> PKR 1000)
  // 4. Fatima Noor admitted October 31, 2026 (1 chargeable day -> PKR 32)
  // 5. Ayesha Tariq admitted September 1, 2026 (Admitted last month, regular 2500 fee in Oct)
  // 6. Saad Ali (Withdrawn student)
  const students: Student[] = [
    {
      id: 'st-001',
      studentId: 'AP-2026-0001',
      fullName: 'Zainab Bibi',
      fatherName: 'Muhammad Rashid',
      gender: 'Female',
      dob: '2010-05-14',
      studentPhone: '',
      fatherPhone: '+92 301 5551234',
      guardianPhone: '',
      address: 'House 14, Street 7, Gulberg III, Lahore',
      emergencyContact: '+92 301 5551234 (Father)',
      classId: 'c1',
      className: 'Grade 9 - Science (Matric)',
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
      session: '2026-2027',
      admissionDate: '2026-10-12',
      status: 'Active',
      academicNotes: 'Strong foundation in science. Transferred from City School.',
      regularMonthlyFee: 1000,
      admissionMonthFee: 645, // 1000 * 20 / 31 = 645.16 -> 645
      discountType: 'none',
      discountValue: 0,
      dueDay: 10,
      feeEffectiveDate: '2026-10-12',
      createdAt: '2026-10-12T10:00:00.000Z',
      createdBy: 'admin',
      updatedAt: '2026-10-12T10:00:00.000Z',
      updatedBy: 'admin',
      documents: [
        { id: 'doc-1', name: 'Birth_Certificate_Zainab.pdf', size: '240 KB', type: 'application/pdf', uploadedAt: '2026-10-12T10:00:00.000Z' }
      ]
    },
    {
      id: 'st-002',
      studentId: 'AP-2026-0002',
      fullName: 'Muhammad Bilal',
      fatherName: 'Bilal Ahmed Sheikh',
      gender: 'Male',
      dob: '2009-08-22',
      studentPhone: '+92 321 4447788',
      fatherPhone: '+92 300 9998877',
      address: 'Sector C, Model Town, Lahore',
      emergencyContact: '+92 300 9998877 (Father)',
      classId: 'c2',
      className: 'Grade 10 - Matric',
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Computer Science'],
      session: '2026-2027',
      admissionDate: '2026-10-20',
      status: 'Active',
      regularMonthlyFee: 1500,
      admissionMonthFee: 581, // 1500 * 12 / 31 = 580.64 -> 581
      discountType: 'none',
      discountValue: 0,
      dueDay: 10,
      feeEffectiveDate: '2026-10-20',
      createdAt: '2026-10-20T11:30:00.000Z',
      createdBy: 'admin',
      updatedAt: '2026-10-20T11:30:00.000Z',
      updatedBy: 'admin',
      documents: []
    },
    {
      id: 'st-003',
      studentId: 'AP-2026-0003',
      fullName: 'Hamza Farooq',
      fatherName: 'Farooq Azam',
      gender: 'Male',
      dob: '2008-11-05',
      fatherPhone: '+92 333 4567890',
      address: 'DHA Phase 5, Lahore',
      classId: 'c3',
      className: 'O-Level Mathematics & Science',
      subjects: ['Mathematics', 'Physics', 'Chemistry'],
      session: '2026-2027',
      admissionDate: '2026-10-01',
      status: 'Active',
      regularMonthlyFee: 1000,
      admissionMonthFee: 1000, // 1000 * 31 / 31 = 1000
      discountType: 'none',
      discountValue: 0,
      dueDay: 10,
      feeEffectiveDate: '2026-10-01',
      createdAt: '2026-10-01T09:00:00.000Z',
      createdBy: 'admin',
      updatedAt: '2026-10-01T09:00:00.000Z',
      updatedBy: 'admin',
      documents: []
    },
    {
      id: 'st-004',
      studentId: 'AP-2026-0004',
      fullName: 'Fatima Noor',
      fatherName: 'Noor ul Hassan',
      gender: 'Female',
      dob: '2010-01-30',
      fatherPhone: '+92 302 1112233',
      address: 'Johar Town Phase 2, Lahore',
      classId: 'c1',
      className: 'Grade 9 - Science (Matric)',
      subjects: ['Mathematics', 'Physics', 'Biology'],
      session: '2026-2027',
      admissionDate: '2026-10-31',
      status: 'Active',
      regularMonthlyFee: 1000,
      admissionMonthFee: 32, // 1000 * 1 / 31 = 32.25 -> 32
      discountType: 'none',
      discountValue: 0,
      dueDay: 10,
      feeEffectiveDate: '2026-10-31',
      createdAt: '2026-10-31T15:00:00.000Z',
      createdBy: 'admin',
      updatedAt: '2026-10-31T15:00:00.000Z',
      updatedBy: 'admin',
      documents: []
    },
    {
      id: 'st-005',
      studentId: 'AP-2026-0005',
      fullName: 'Ayesha Tariq',
      fatherName: 'Tariq Mehmood',
      gender: 'Female',
      dob: '2007-03-19',
      fatherPhone: '+92 322 8889900',
      address: 'Wapda Town, Lahore',
      classId: 'c4',
      className: 'F.Sc Pre-Medical (Part 1)',
      subjects: ['Physics', 'Chemistry', 'Biology'],
      session: '2026-2027',
      admissionDate: '2026-09-01',
      status: 'Active',
      regularMonthlyFee: 3500,
      admissionMonthFee: 3500,
      discountType: 'fixed',
      discountValue: 500, // Merit concession
      dueDay: 10,
      feeEffectiveDate: '2026-09-01',
      createdAt: '2026-09-01T09:00:00.000Z',
      createdBy: 'admin',
      updatedAt: '2026-09-01T09:00:00.000Z',
      updatedBy: 'admin',
      documents: []
    },
    {
      id: 'st-006',
      studentId: 'AP-2026-0006',
      fullName: 'Saad Ali',
      fatherName: 'Ali Raza',
      gender: 'Male',
      dob: '2009-04-12',
      fatherPhone: '+92 345 6677889',
      address: 'Faisal Town, Lahore',
      classId: 'c2',
      className: 'Grade 10 - Matric',
      subjects: ['Mathematics', 'Computer Science'],
      session: '2026-2027',
      admissionDate: '2026-08-15',
      status: 'Withdrawn',
      academicNotes: 'Withdrawn on 2026-09-30 due to family relocation to Islamabad.',
      regularMonthlyFee: 2800,
      admissionMonthFee: 1535,
      discountType: 'none',
      discountValue: 0,
      dueDay: 10,
      feeEffectiveDate: '2026-08-15',
      createdAt: '2026-08-15T09:00:00.000Z',
      createdBy: 'admin',
      updatedAt: '2026-09-30T10:00:00.000Z',
      updatedBy: 'admin',
      documents: []
    }
  ];

  // Pre-seed official vouchers
  const vouchers: FeeVoucher[] = [
    {
      id: 'v-001',
      voucherNumber: 'FV-2026-0001',
      studentInternalId: 'st-001',
      studentId: 'AP-2026-0001',
      studentName: 'Zainab Bibi',
      fatherName: 'Muhammad Rashid',
      classId: 'c1',
      className: 'Grade 9 - Science (Matric)',
      admissionDate: '2026-10-12',
      feeMonth: 10,
      feeYear: 2026,
      issueDate: '2026-10-12',
      dueDate: '2026-10-22',
      regularMonthlyFee: 1000,
      isAdmissionMonth: true,
      prorationDetails: {
        month: 10,
        year: 2026,
        monthLength: 31,
        admissionDay: 12,
        chargeableDays: 20,
        rawAmount: 645.16129,
        finalProratedFee: 645,
      },
      discount: 0,
      adjustment: 0,
      previousOutstanding: 0,
      totalPayable: 645,
      paidAmount: 645,
      remainingBalance: 0,
      status: 'Paid',
      paymentInstructions: DEFAULT_SETTINGS.paymentInstructions,
      createdAt: '2026-10-12T10:05:00.000Z',
      createdBy: 'admin',
      updatedAt: '2026-10-15T11:00:00.000Z',
    },
    {
      id: 'v-002',
      voucherNumber: 'FV-2026-0002',
      studentInternalId: 'st-002',
      studentId: 'AP-2026-0002',
      studentName: 'Muhammad Bilal',
      fatherName: 'Bilal Ahmed Sheikh',
      classId: 'c2',
      className: 'Grade 10 - Matric',
      admissionDate: '2026-10-20',
      feeMonth: 10,
      feeYear: 2026,
      issueDate: '2026-10-20',
      dueDate: '2026-10-30',
      regularMonthlyFee: 1500,
      isAdmissionMonth: true,
      prorationDetails: {
        month: 10,
        year: 2026,
        monthLength: 31,
        admissionDay: 20,
        chargeableDays: 12,
        rawAmount: 580.64516,
        finalProratedFee: 581,
      },
      discount: 0,
      adjustment: 0,
      previousOutstanding: 0,
      totalPayable: 581,
      paidAmount: 300,
      remainingBalance: 281,
      status: 'Partially Paid',
      paymentInstructions: DEFAULT_SETTINGS.paymentInstructions,
      createdAt: '2026-10-20T11:35:00.000Z',
      createdBy: 'admin',
      updatedAt: '2026-10-22T14:00:00.000Z',
    },
    {
      id: 'v-003',
      voucherNumber: 'FV-2026-0003',
      studentInternalId: 'st-003',
      studentId: 'AP-2026-0003',
      studentName: 'Hamza Farooq',
      fatherName: 'Farooq Azam',
      classId: 'c3',
      className: 'O-Level Mathematics & Science',
      admissionDate: '2026-10-01',
      feeMonth: 10,
      feeYear: 2026,
      issueDate: '2026-10-01',
      dueDate: '2026-10-10',
      regularMonthlyFee: 1000,
      isAdmissionMonth: true,
      prorationDetails: {
        month: 10,
        year: 2026,
        monthLength: 31,
        admissionDay: 1,
        chargeableDays: 31,
        rawAmount: 1000,
        finalProratedFee: 1000,
      },
      discount: 0,
      adjustment: 0,
      previousOutstanding: 0,
      totalPayable: 1000,
      paidAmount: 0,
      remainingBalance: 1000,
      status: 'Overdue', // due date was 2026-10-10
      paymentInstructions: DEFAULT_SETTINGS.paymentInstructions,
      createdAt: '2026-10-01T09:15:00.000Z',
      createdBy: 'admin',
      updatedAt: '2026-10-11T00:00:00.000Z',
    },
    {
      id: 'v-004',
      voucherNumber: 'FV-2026-0004',
      studentInternalId: 'st-005',
      studentId: 'AP-2026-0005',
      studentName: 'Ayesha Tariq',
      fatherName: 'Tariq Mehmood',
      classId: 'c4',
      className: 'F.Sc Pre-Medical (Part 1)',
      admissionDate: '2026-09-01',
      feeMonth: 10,
      feeYear: 2026,
      issueDate: '2026-10-01',
      dueDate: '2026-10-28',
      regularMonthlyFee: 3500,
      isAdmissionMonth: false, // Admitted in Sept, Oct is regular monthly fee!
      discount: 500, // Merit concession
      adjustment: 0,
      previousOutstanding: 0,
      totalPayable: 3000,
      paidAmount: 0,
      remainingBalance: 3000,
      status: 'Unpaid',
      paymentInstructions: DEFAULT_SETTINGS.paymentInstructions,
      createdAt: '2026-10-01T09:20:00.000Z',
      createdBy: 'admin',
      updatedAt: '2026-10-01T09:20:00.000Z',
    }
  ];

  const payments: Payment[] = [
    {
      id: 'pay-001',
      receiptNumber: 'REC-2026-0001',
      studentInternalId: 'st-001',
      studentId: 'AP-2026-0001',
      studentName: 'Zainab Bibi',
      voucherId: 'v-001',
      voucherNumber: 'FV-2026-0001',
      feeMonth: 10,
      feeYear: 2026,
      amount: 645,
      paymentDate: '2026-10-15T11:00:00.000Z',
      paymentMethod: 'Cash',
      transactionRef: 'CSH-RECEIPT-01',
      receivedBy: 'Samina Akhtar',
      notes: 'Full payment of admission-month fee.',
      status: 'Successful',
      remainingBalanceAfter: 0,
    },
    {
      id: 'pay-002',
      receiptNumber: 'REC-2026-0002',
      studentInternalId: 'st-002',
      studentId: 'AP-2026-0002',
      studentName: 'Muhammad Bilal',
      voucherId: 'v-002',
      voucherNumber: 'FV-2026-0002',
      feeMonth: 10,
      feeYear: 2026,
      amount: 300,
      paymentDate: '2026-10-22T14:00:00.000Z',
      paymentMethod: 'Bank transfer',
      transactionRef: 'ABL-PK-9823412',
      receivedBy: 'Samina Akhtar',
      notes: 'First installment of admission month fee. Remaining balance PKR 281.',
      status: 'Successful',
      remainingBalanceAfter: 281,
    }
  ];

  const attendance: AttendanceRecord[] = [
    {
      id: 'att-001',
      date: '2026-10-24',
      classId: 'c1',
      studentInternalId: 'st-001',
      studentId: 'AP-2026-0001',
      studentName: 'Zainab Bibi',
      status: 'Present',
      recordedBy: 'staff',
      recordedAt: '2026-10-24T08:30:00.000Z',
    },
    {
      id: 'att-002',
      date: '2026-10-24',
      classId: 'c2',
      studentInternalId: 'st-002',
      studentId: 'AP-2026-0002',
      studentName: 'Muhammad Bilal',
      status: 'Present',
      recordedBy: 'staff',
      recordedAt: '2026-10-24T08:30:00.000Z',
    },
    {
      id: 'att-003',
      date: '2026-10-24',
      classId: 'c3',
      studentInternalId: 'st-003',
      studentId: 'AP-2026-0003',
      studentName: 'Hamza Farooq',
      status: 'Absent',
      remarks: 'Sick leave requested by parent',
      recordedBy: 'staff',
      recordedAt: '2026-10-24T08:30:00.000Z',
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log-001',
      timestamp: '2026-10-01T09:00:00.000Z',
      actor: 'admin (Dr. Tariq Mahmood)',
      action: 'ACADEMY_INITIALIZED',
      targetType: 'settings',
      targetId: 'academy',
      summary: 'AcademyPro management system initialized with academic session 2026-2027.',
    },
    {
      id: 'log-002',
      timestamp: '2026-10-12T10:00:00.000Z',
      actor: 'admin',
      action: 'STUDENT_ADMISSION',
      targetType: 'student',
      targetId: 'AP-2026-0001',
      summary: 'Student Zainab Bibi admitted to Grade 9 - Science. Admission month prorated fee calculated as PKR 645.',
    },
    {
      id: 'log-003',
      timestamp: '2026-10-15T11:00:00.000Z',
      actor: 'staff (Samina Akhtar)',
      action: 'PAYMENT_RECORDED',
      targetType: 'payment',
      targetId: 'REC-2026-0001',
      summary: 'Payment of PKR 645 recorded for voucher FV-2026-0001 (Zainab Bibi). Remaining balance PKR 0.',
    },
  ];

  return {
    students,
    vouchers,
    payments,
    attendance,
    classes,
    subjects,
    sessions,
    settings: DEFAULT_SETTINGS,
    users,
    auditLogs,
    sequenceNumbers: {
      student: 7,
      voucher: 5,
      receipt: 3,
    },
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      this.saveData(initial);
      return initial;
    }
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Failed to parse database file, resetting to initial seed:', err);
      const initial = getInitialDatabase();
      this.saveData(initial);
      return initial;
    }
  }

  private saveData(dataToSave: DatabaseSchema) {
    this.ensureDataDir();
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  private persist() {
    this.saveData(this.data);
  }

  public getRawData(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.data));
  }

  public restoreFromData(imported: DatabaseSchema) {
    this.data = imported;
    this.persist();
  }

  // Identifiers
  public getNextStudentId(): string {
    const seq = this.data.sequenceNumbers.student;
    this.data.sequenceNumbers.student += 1;
    this.persist();
    const prefix = this.data.settings.studentIdPrefix || 'AP-2026-';
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  public getNextVoucherNumber(): string {
    const seq = this.data.sequenceNumbers.voucher;
    this.data.sequenceNumbers.voucher += 1;
    this.persist();
    const prefix = this.data.settings.voucherPrefix || 'FV-2026-';
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  public getNextReceiptNumber(): string {
    const seq = this.data.sequenceNumbers.receipt;
    this.data.sequenceNumbers.receipt += 1;
    this.persist();
    const prefix = this.data.settings.receiptPrefix || 'REC-2026-';
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  // Students
  public getStudents(): Student[] {
    return [...this.data.students];
  }

  public getStudentById(id: string): Student | undefined {
    return this.data.students.find(s => s.id === id || s.studentId === id);
  }

  public getStudentByPublicId(publicId: string): Student | undefined {
    return this.data.students.find(s => s.studentId.trim().toUpperCase() === publicId.trim().toUpperCase());
  }

  public addStudent(student: Student, actor: string = 'admin'): Student {
    this.data.students.push(student);
    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'STUDENT_CREATED',
      targetType: 'student',
      targetId: student.studentId,
      summary: `Registered new student ${student.fullName} (ID: ${student.studentId}) in ${student.className}.`,
      details: { admissionDate: student.admissionDate, regularFee: student.regularMonthlyFee }
    });
    this.persist();
    return student;
  }

  public updateStudent(id: string, updates: Partial<Student>, actor: string = 'admin'): Student | null {
    const index = this.data.students.findIndex(s => s.id === id || s.studentId === id);
    if (index === -1) return null;
    
    const existing = this.data.students[index];
    const updated: Student = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
    };
    this.data.students[index] = updated;

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'STUDENT_UPDATED',
      targetType: 'student',
      targetId: updated.studentId,
      summary: `Updated profile details for student ${updated.fullName} (${updated.studentId}).`,
      details: { changedFields: Object.keys(updates) }
    });

    this.persist();
    return updated;
  }

  // Vouchers
  public getVouchers(): FeeVoucher[] {
    // Recalculate dynamic statuses for overdue if unpaid and dueDate has passed
    const today = new Date().toISOString().split('T')[0];
    return this.data.vouchers.map(v => {
      if (v.remainingBalance === 0) {
        v.status = 'Paid';
      } else if (v.paidAmount > 0) {
        v.status = 'Partially Paid';
      } else if (v.dueDate < today && v.remainingBalance > 0) {
        v.status = 'Overdue';
      } else {
        v.status = 'Unpaid';
      }
      return v;
    });
  }

  public getVoucherById(id: string): FeeVoucher | undefined {
    const v = this.getVouchers().find(v => v.id === id || v.voucherNumber === id);
    return v;
  }

  public findExistingVoucher(studentInternalId: string, feeMonth: number, feeYear: number): FeeVoucher | undefined {
    return this.data.vouchers.find(
      v => v.studentInternalId === studentInternalId && v.feeMonth === feeMonth && v.feeYear === feeYear
    );
  }

  public addVoucher(voucher: FeeVoucher, actor: string = 'admin'): FeeVoucher {
    this.data.vouchers.push(voucher);
    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'VOUCHER_GENERATED',
      targetType: 'voucher',
      targetId: voucher.voucherNumber,
      summary: `Generated voucher ${voucher.voucherNumber} for ${voucher.studentName} for Month ${voucher.feeMonth}/${voucher.feeYear}. Amount: PKR ${voucher.totalPayable}.`,
      details: { totalPayable: voucher.totalPayable, isAdmissionMonth: voucher.isAdmissionMonth }
    });
    this.persist();
    return voucher;
  }

  public updateVoucher(id: string, updates: Partial<FeeVoucher>, actor: string = 'admin'): FeeVoucher | null {
    const index = this.data.vouchers.findIndex(v => v.id === id || v.voucherNumber === id);
    if (index === -1) return null;
    const existing = this.data.vouchers[index];
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.vouchers[index] = updated;
    this.persist();
    return updated;
  }

  // Adjust voucher
  public adjustVoucher(id: string, adjustmentAmount: number, reason: string, actor: string = 'admin'): FeeVoucher | null {
    const voucher = this.getVoucherById(id);
    if (!voucher) return null;
    
    const oldPayable = voucher.totalPayable;
    const oldBalance = voucher.remainingBalance;

    const newPayable = Math.max(0, voucher.regularMonthlyFee - voucher.discount + adjustmentAmount);
    const newBalance = Math.max(0, newPayable - voucher.paidAmount);

    const updated = this.updateVoucher(voucher.id, {
      adjustment: adjustmentAmount,
      adjustmentReason: reason,
      totalPayable: newPayable,
      remainingBalance: newBalance,
      status: newBalance === 0 ? 'Paid' : voucher.paidAmount > 0 ? 'Partially Paid' : 'Unpaid',
    }, actor);

    if (updated) {
      this.addAuditLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor,
        action: 'VOUCHER_ADJUSTED',
        targetType: 'voucher',
        targetId: voucher.voucherNumber,
        summary: `Adjusted voucher ${voucher.voucherNumber} for ${voucher.studentName}. Adjustment: PKR ${adjustmentAmount}. Reason: ${reason}. Total changed from PKR ${oldPayable} to PKR ${newPayable}.`,
        details: { oldPayable, newPayable, oldBalance, newBalance, reason }
      });
    }

    return updated;
  }

  // Payments
  public getPayments(): Payment[] {
    return [...this.data.payments];
  }

  public getPaymentById(id: string): Payment | undefined {
    return this.data.payments.find(p => p.id === id || p.receiptNumber === id);
  }

  public recordPayment(params: {
    studentInternalId: string;
    voucherId: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    transactionRef?: string;
    receivedBy: string;
    notes?: string;
  }, actor: string = 'admin'): { payment: Payment; voucher: FeeVoucher } {
    const voucher = this.data.vouchers.find(v => v.id === params.voucherId);
    if (!voucher) {
      throw new Error('Voucher not found');
    }
    const student = this.data.students.find(s => s.id === params.studentInternalId);
    if (!student) {
      throw new Error('Student not found');
    }

    const payAmount = roundHalfUp(params.amount);
    if (payAmount <= 0) {
      throw new Error('Payment amount must be a positive whole PKR integer');
    }
    if (payAmount > voucher.remainingBalance) {
      throw new Error(`Payment amount (PKR ${payAmount}) exceeds remaining voucher balance (PKR ${voucher.remainingBalance})`);
    }

    const receiptNumber = this.getNextReceiptNumber();
    const newPaidAmount = voucher.paidAmount + payAmount;
    const newBalance = Math.max(0, voucher.totalPayable - newPaidAmount);

    voucher.paidAmount = newPaidAmount;
    voucher.remainingBalance = newBalance;
    voucher.status = newBalance === 0 ? 'Paid' : 'Partially Paid';
    voucher.updatedAt = new Date().toISOString();

    const payment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      studentInternalId: student.id,
      studentId: student.studentId,
      studentName: student.fullName,
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      feeMonth: voucher.feeMonth,
      feeYear: voucher.feeYear,
      amount: payAmount,
      paymentDate: new Date().toISOString(),
      paymentMethod: params.paymentMethod,
      transactionRef: params.transactionRef,
      receivedBy: params.receivedBy || actor,
      notes: params.notes,
      status: 'Successful',
      remainingBalanceAfter: newBalance,
    };

    this.data.payments.push(payment);

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'PAYMENT_RECORDED',
      targetType: 'payment',
      targetId: receiptNumber,
      summary: `Recorded payment of PKR ${payAmount} for voucher ${voucher.voucherNumber} (${student.fullName}). Receipt: ${receiptNumber}.`,
      details: { amount: payAmount, method: params.paymentMethod, remainingBalance: newBalance }
    });

    this.persist();
    return { payment, voucher };
  }

  public reversePayment(paymentId: string, reason: string, actor: string = 'admin'): Payment {
    const payment = this.data.payments.find(p => p.id === paymentId || p.receiptNumber === paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }
    if (payment.status === 'Reversed') {
      throw new Error('Payment has already been reversed');
    }

    const voucher = this.data.vouchers.find(v => v.id === payment.voucherId);
    if (voucher) {
      voucher.paidAmount = Math.max(0, voucher.paidAmount - payment.amount);
      voucher.remainingBalance = Math.max(0, voucher.totalPayable - voucher.paidAmount);
      voucher.status = voucher.remainingBalance === 0 ? 'Paid' : voucher.paidAmount > 0 ? 'Partially Paid' : 'Unpaid';
      voucher.updatedAt = new Date().toISOString();
    }

    payment.status = 'Reversed';
    payment.reversedAt = new Date().toISOString();
    payment.reversedBy = actor;
    payment.reversalReason = reason;

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'PAYMENT_REVERSED',
      targetType: 'payment',
      targetId: payment.receiptNumber,
      summary: `Reversed payment ${payment.receiptNumber} of PKR ${payment.amount} for student ${payment.studentName}. Reason: ${reason}.`,
      details: { paymentId: payment.id, amount: payment.amount, reason }
    });

    this.persist();
    return payment;
  }

  // Attendance
  public getAttendance(filter?: { classId?: string; date?: string }): AttendanceRecord[] {
    let list = this.data.attendance;
    if (filter?.classId) {
      list = list.filter(a => a.classId === filter.classId);
    }
    if (filter?.date) {
      list = list.filter(a => a.date === filter.date);
    }
    return list;
  }

  public markAttendanceBatch(records: Omit<AttendanceRecord, 'id' | 'recordedAt'>[], actor: string = 'staff'): AttendanceRecord[] {
    const now = new Date().toISOString();
    const created: AttendanceRecord[] = [];

    for (const r of records) {
      // Find existing
      const existingIdx = this.data.attendance.findIndex(
        a => a.date === r.date && a.classId === r.classId && a.studentInternalId === r.studentInternalId
      );
      if (existingIdx !== -1) {
        this.data.attendance[existingIdx] = {
          ...this.data.attendance[existingIdx],
          status: r.status,
          remarks: r.remarks,
          recordedBy: actor,
          recordedAt: now,
        };
        created.push(this.data.attendance[existingIdx]);
      } else {
        const item: AttendanceRecord = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ...r,
          recordedBy: actor,
          recordedAt: now,
        };
        this.data.attendance.push(item);
        created.push(item);
      }
    }

    this.persist();
    return created;
  }

  // Classes & Subjects & Sessions
  public getClasses(): AcademicClass[] {
    return [...this.data.classes];
  }
  public saveClass(cls: AcademicClass): AcademicClass {
    const idx = this.data.classes.findIndex(c => c.id === cls.id);
    if (idx !== -1) {
      this.data.classes[idx] = cls;
    } else {
      this.data.classes.push(cls);
    }
    this.persist();
    return cls;
  }
  public deleteClass(id: string): boolean {
    const idx = this.data.classes.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.classes.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  public getSubjects(): Subject[] {
    return [...this.data.subjects];
  }
  public saveSubject(sub: Subject): Subject {
    const idx = this.data.subjects.findIndex(s => s.id === sub.id);
    if (idx !== -1) {
      this.data.subjects[idx] = sub;
    } else {
      this.data.subjects.push(sub);
    }
    this.persist();
    return sub;
  }

  public getSessions(): AcademicSession[] {
    return [...this.data.sessions];
  }
  public saveSession(ses: AcademicSession): AcademicSession {
    const idx = this.data.sessions.findIndex(s => s.id === ses.id);
    if (idx !== -1) {
      this.data.sessions[idx] = ses;
    } else {
      this.data.sessions.push(ses);
    }
    this.persist();
    return ses;
  }

  // Settings
  public getSettings(): AcademySettings {
    return { ...this.data.settings };
  }
  public updateSettings(settings: Partial<AcademySettings>, actor: string = 'admin'): AcademySettings {
    this.data.settings = {
      ...this.data.settings,
      ...settings,
      portalSettings: {
        ...this.data.settings.portalSettings,
        ...(settings.portalSettings || {}),
      }
    };
    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'SETTINGS_UPDATED',
      targetType: 'settings',
      targetId: 'academy',
      summary: 'Academy configuration and portal security policies updated.',
      details: settings,
    });
    this.persist();
    return this.data.settings;
  }

  // Users & Staff
  public getUsers(): UserAccount[] {
    return [...this.data.users];
  }
  public getUserByUsername(username: string): UserAccount | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }
  public saveUser(user: UserAccount): UserAccount {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.persist();
    return user;
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  public addAuditLog(log: AuditLog) {
    this.data.auditLogs.push(log);
    // Keep max 2000 logs
    if (this.data.auditLogs.length > 2000) {
      this.data.auditLogs = this.data.auditLogs.slice(-2000);
    }
  }
}

export const db = new Database();
