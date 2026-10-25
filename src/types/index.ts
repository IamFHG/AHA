export type StudentStatus = 'Active' | 'Inactive' | 'Withdrawn' | 'Completed';

export type VoucherStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';

export type PaymentMethod = 'Cash' | 'Bank transfer' | 'Mobile wallet' | 'Other';

export interface StudentDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

export interface Student {
  id: string; // internal UUID
  studentId: string; // Public identifier e.g. AP-2026-0001
  fullName: string;
  fatherName: string;
  guardianName?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  studentPhone?: string;
  fatherPhone?: string;
  guardianPhone?: string;
  address?: string;
  emergencyContact?: string;
  photoUrl?: string;
  
  // Academic
  classId: string;
  className: string;
  subjects: string[];
  session: string;
  admissionDate: string; // YYYY-MM-DD
  previousSchool?: string;
  status: StudentStatus;
  academicNotes?: string;

  // Fee Details
  regularMonthlyFee: number; // Whole PKR integer
  admissionMonthFee: number; // Prorated whole PKR integer
  discountType: 'none' | 'fixed' | 'percentage';
  discountValue: number;
  dueDay: number; // Day of month e.g. 10
  feeEffectiveDate: string;

  // Admin Meta
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  admissionRemarks?: string;
  documents: StudentDocument[];
}

export interface FeeProrationDetail {
  month: number;
  year: number;
  monthLength: number; // D
  admissionDay: number; // A
  chargeableDays: number; // C = D - A + 1
  rawAmount: number;
  finalProratedFee: number; // Whole PKR integer (round half up)
}

export interface FeeVoucher {
  id: string;
  voucherNumber: string; // e.g. FV-2026-0001
  studentInternalId: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  classId: string;
  className: string;
  admissionDate: string;
  feeMonth: number; // 1-12
  feeYear: number;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  
  regularMonthlyFee: number;
  isAdmissionMonth: boolean;
  prorationDetails?: FeeProrationDetail;
  discount: number; // Whole PKR
  adjustment: number; // Whole PKR
  adjustmentReason?: string;
  previousOutstanding: number; // Whole PKR
  
  totalPayable: number; // Whole PKR
  paidAmount: number; // Whole PKR
  remainingBalance: number; // Whole PKR
  status: VoucherStatus;
  
  paymentInstructions?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  receiptNumber: string; // e.g. REC-2026-0001
  studentInternalId: string;
  studentId: string;
  studentName: string;
  voucherId: string;
  voucherNumber: string;
  feeMonth: number;
  feeYear: number;
  amount: number; // Whole PKR
  paymentDate: string; // ISO / YYYY-MM-DD HH:mm
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  receivedBy: string;
  notes?: string;
  status: 'Successful' | 'Reversed';
  reversedAt?: string;
  reversedBy?: string;
  reversalReason?: string;
  remainingBalanceAfter: number;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  studentInternalId: string;
  studentId: string;
  studentName: string;
  status: 'Present' | 'Absent' | 'Leave';
  remarks?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface AcademicClass {
  id: string;
  name: string;
  section?: string;
  defaultMonthlyFee: number;
  active: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
}

export interface AcademicSession {
  id: string;
  name: string;
  isCurrent: boolean;
}

export interface PortalSecuritySettings {
  enabled: boolean;
  requireAdmissionDate: boolean;
  permitIdOnlyLookup: boolean;
  permitPartiallyPaid: boolean;
  permitFullyPaid: boolean;
  permitInactiveStudents: boolean;
  showRemainingBalance: boolean;
  allowedMonths: string[]; // ['2026-09', '2026-10'] or empty = any
  publicNotice: string;
}

export interface AcademySettings {
  academyName: string;
  tagline: string;
  logoUrl?: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  defaultMonthlyFee: number;
  studentIdPrefix: string;
  voucherPrefix: string;
  receiptPrefix: string;
  defaultDueDay: number;
  voucherFooterText: string;
  paymentInstructions: string;
  portalSettings: PortalSecuritySettings;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetType: 'student' | 'voucher' | 'payment' | 'attendance' | 'settings' | 'auth';
  targetId: string;
  summary: string;
  details?: Record<string, any>;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: 'Admin' | 'Staff';
  passwordHash?: string;
  active: boolean;
  permissions: {
    canManageStudents: boolean;
    canGenerateVouchers: boolean;
    canRecordPayments: boolean;
    canMarkAttendance: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
    canPerformCorrections: boolean;
  };
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  withdrawnStudents: number;
  completedStudents: number;
  recentlyAdmittedCount: number;
  feesGeneratedThisMonth: number;
  paymentsCollectedThisMonth: number;
  totalOutstandingBalance: number;
  unpaidVouchersCount: number;
  partiallyPaidVouchersCount: number;
  overdueVouchersCount: number;
  selectedMonth: number;
  selectedYear: number;
}
