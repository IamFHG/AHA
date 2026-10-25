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
  DashboardStats,
} from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ user: UserAccount; token: string }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res);
  },

  async getUsers(): Promise<UserAccount[]> {
    const res = await fetch(`${BASE_URL}/auth/users`);
    return handleResponse(res);
  },

  async createUser(data: Partial<UserAccount>): Promise<UserAccount> {
    const res = await fetch(`${BASE_URL}/auth/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Dashboard
  async getDashboard(month?: number, year?: number): Promise<{
    stats: DashboardStats;
    recentAdmissions: Student[];
    recentPayments: Payment[];
    upcomingDueDates: FeeVoucher[];
    classDistribution: { name: string; count: number }[];
    monthlyTrends: { monthStr: string; generated: number; collected: number }[];
  }> {
    const query = new URLSearchParams();
    if (month) query.append('month', month.toString());
    if (year) query.append('year', year.toString());
    const res = await fetch(`${BASE_URL}/dashboard?${query.toString()}`);
    return handleResponse(res);
  },

  // Students
  async getStudents(params?: {
    query?: string;
    classId?: string;
    status?: string;
    session?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Student[]> {
    const q = new URLSearchParams();
    if (params?.query) q.append('query', params.query);
    if (params?.classId) q.append('classId', params.classId);
    if (params?.status) q.append('status', params.status);
    if (params?.session) q.append('session', params.session);
    if (params?.sortBy) q.append('sortBy', params.sortBy);
    if (params?.sortOrder) q.append('sortOrder', params.sortOrder);

    const res = await fetch(`${BASE_URL}/students?${q.toString()}`);
    return handleResponse(res);
  },

  async getStudent(id: string): Promise<{
    student: Student;
    vouchers: FeeVoucher[];
    payments: Payment[];
    attendance: AttendanceRecord[];
    auditLogs: AuditLog[];
    financialOverview: {
      totalFeesGenerated: number;
      totalPaymentsCollected: number;
      outstandingBalance: number;
      lastPaymentDate: string | null;
      lastPaymentAmount: number;
      nextDueDate: string | null;
      unpaidCount: number;
    };
    attendanceStats: {
      presentDays: number;
      absentDays: number;
      leaveDays: number;
      totalDays: number;
      attendancePercentage: number;
    };
  }> {
    const res = await fetch(`${BASE_URL}/students/${id}`);
    return handleResponse(res);
  },

  async createStudent(data: Partial<Student>): Promise<{ student: Student; duplicateWarning: string | null }> {
    const res = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const res = await fetch(`${BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateStudentStatus(id: string, status: string, reason: string): Promise<Student> {
    const res = await fetch(`${BASE_URL}/students/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    return handleResponse(res);
  },

  // Fee calculation preview
  async calculateFeePreview(params: {
    monthlyFee: number;
    admissionDate: string;
    targetYear: number;
    targetMonth: number;
    discountType?: string;
    discountValue?: number;
  }): Promise<{
    baseFee: number;
    isAdmissionMonth: boolean;
    prorationDetails?: any;
    discountAmount: number;
    finalPayable: number;
  }> {
    const res = await fetch(`${BASE_URL}/fees/calculate-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  // Vouchers
  async getVouchers(params?: {
    feeMonth?: number;
    feeYear?: number;
    classId?: string;
    status?: string;
    studentId?: string;
  }): Promise<FeeVoucher[]> {
    const q = new URLSearchParams();
    if (params?.feeMonth) q.append('feeMonth', params.feeMonth.toString());
    if (params?.feeYear) q.append('feeYear', params.feeYear.toString());
    if (params?.classId) q.append('classId', params.classId);
    if (params?.status) q.append('status', params.status);
    if (params?.studentId) q.append('studentId', params.studentId);

    const res = await fetch(`${BASE_URL}/vouchers?${q.toString()}`);
    return handleResponse(res);
  },

  async getVoucher(id: string): Promise<{ voucher: FeeVoucher; settings: AcademySettings }> {
    const res = await fetch(`${BASE_URL}/vouchers/${id}`);
    return handleResponse(res);
  },

  async previewBulkVouchers(params: {
    feeMonth: number;
    feeYear: number;
    classId?: string;
  }): Promise<{
    totalActiveCandidates: number;
    eligibleCount: number;
    toCreateCount: number;
    skippedAlreadyExisting: number;
    skippedIneligibleDate: number;
    estimatedTotal: number;
  }> {
    const res = await fetch(`${BASE_URL}/vouchers/preview-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async generateVouchers(params: {
    studentInternalId?: string;
    classId?: string;
    feeMonth: number;
    feeYear: number;
    issueDate?: string;
    dueDate?: string;
  }): Promise<{
    createdCount: number;
    skippedCount: number;
    createdVouchers: FeeVoucher[];
    skippedList: { studentId: string; studentName: string; reason: string }[];
  }> {
    const res = await fetch(`${BASE_URL}/vouchers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async adjustVoucher(id: string, adjustmentAmount: number, reason: string): Promise<FeeVoucher> {
    const res = await fetch(`${BASE_URL}/vouchers/${id}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjustmentAmount, reason }),
    });
    return handleResponse(res);
  },

  // Payments
  async getPayments(params?: {
    studentId?: string;
    voucherId?: string;
    status?: string;
  }): Promise<Payment[]> {
    const q = new URLSearchParams();
    if (params?.studentId) q.append('studentId', params.studentId);
    if (params?.voucherId) q.append('voucherId', params.voucherId);
    if (params?.status) q.append('status', params.status);

    const res = await fetch(`${BASE_URL}/payments?${q.toString()}`);
    return handleResponse(res);
  },

  async recordPayment(data: {
    voucherId: string;
    studentInternalId: string;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    transactionRef?: string;
    receivedBy?: string;
    notes?: string;
  }): Promise<{ payment: Payment; voucher: FeeVoucher }> {
    const res = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async reversePayment(id: string, reason: string): Promise<Payment> {
    const res = await fetch(`${BASE_URL}/payments/${id}/reverse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  async getReceipt(id: string): Promise<{ payment: Payment; voucher: FeeVoucher; settings: AcademySettings }> {
    const res = await fetch(`${BASE_URL}/receipts/${id}`);
    return handleResponse(res);
  },

  // Attendance
  async getAttendance(params?: { classId?: string; date?: string }): Promise<AttendanceRecord[]> {
    const q = new URLSearchParams();
    if (params?.classId) q.append('classId', params.classId);
    if (params?.date) q.append('date', params.date);

    const res = await fetch(`${BASE_URL}/attendance?${q.toString()}`);
    return handleResponse(res);
  },

  async markAttendance(records: Omit<AttendanceRecord, 'id' | 'recordedAt'>[]): Promise<AttendanceRecord[]> {
    const res = await fetch(`${BASE_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });
    return handleResponse(res);
  },

  // Classes & Subjects & Sessions
  async getClasses(): Promise<AcademicClass[]> {
    const res = await fetch(`${BASE_URL}/classes`);
    return handleResponse(res);
  },
  async createClass(data: Partial<AcademicClass>): Promise<AcademicClass> {
    const res = await fetch(`${BASE_URL}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async deleteClass(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/classes/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  async getSubjects(): Promise<Subject[]> {
    const res = await fetch(`${BASE_URL}/subjects`);
    return handleResponse(res);
  },
  async createSubject(data: Partial<Subject>): Promise<Subject> {
    const res = await fetch(`${BASE_URL}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getSessions(): Promise<AcademicSession[]> {
    const res = await fetch(`${BASE_URL}/sessions`);
    return handleResponse(res);
  },
  async createSession(data: Partial<AcademicSession>): Promise<AcademicSession> {
    const res = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Settings
  async getSettings(): Promise<AcademySettings> {
    const res = await fetch(`${BASE_URL}/settings`);
    return handleResponse(res);
  },
  async updateSettings(data: Partial<AcademySettings>): Promise<AcademySettings> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${BASE_URL}/audit-logs`);
    return handleResponse(res);
  },

  // Reports
  async getReports(params: { type: string; month?: number; year?: number; classId?: string }): Promise<any> {
    const q = new URLSearchParams();
    q.append('type', params.type);
    if (params.month) q.append('month', params.month.toString());
    if (params.year) q.append('year', params.year.toString());
    if (params.classId) q.append('classId', params.classId);

    const res = await fetch(`${BASE_URL}/reports?${q.toString()}`);
    return handleResponse(res);
  },

  // Public Student Portal Lookup
  async lookupPortalVoucher(params: {
    studentId: string;
    admissionDate?: string;
    feeMonth: number;
    feeYear: number;
  }): Promise<{ voucher: any; academy: any }> {
    const res = await fetch(`${BASE_URL}/portal/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  // Acceptance Test Runner
  async runAcceptanceTests(): Promise<{
    timestamp: string;
    totalTests: number;
    passedCount: number;
    failedCount: number;
    allPassed: boolean;
    results: { name: string; category: string; passed: boolean; expected: any; actual: any; message?: string }[];
  }> {
    const res = await fetch(`${BASE_URL}/tests/run`);
    return handleResponse(res);
  },
};
