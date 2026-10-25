import { FeeProrationDetail } from '../types';

/**
 * Checks if a given year is a leap year in Gregorian calendar.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns exact number of calendar days in a month.
 * month is 1-12 (1 = Jan, 12 = Dec).
 */
export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

/**
 * Mathematical Round Half Up implementation for financial safety.
 * Handles cases where floating point precision might otherwise truncate.
 */
export function roundHalfUp(value: number): number {
  if (value < 0) {
    return -Math.round(-value);
  }
  return Math.floor(value + 0.5);
}

/**
 * Calculates admission-month fee proration per authoritative Section 8 specifications.
 * 
 * Formula:
 * D = calendar days in admission month
 * A = admission date day number in that month
 * C = D - A + 1  (admission date is a chargeable day)
 * RawAdmissionFee = M * C / D
 * Final = roundHalfUp(RawAdmissionFee)
 */
export function calculateAdmissionProration(
  regularMonthlyFee: number,
  admissionDateStr: string
): FeeProrationDetail {
  const parts = admissionDateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  const monthLength = getDaysInMonth(year, month);
  const admissionDay = day;
  const chargeableDays = monthLength - admissionDay + 1;

  const rawAmount = (regularMonthlyFee * chargeableDays) / monthLength;
  const finalProratedFee = roundHalfUp(rawAmount);

  return {
    month,
    year,
    monthLength,
    admissionDay,
    chargeableDays,
    rawAmount,
    finalProratedFee: Math.max(0, finalProratedFee),
  };
}

/**
 * Formats monetary amounts as whole PKR integers with commas.
 * e.g. 12500 -> "PKR 12,500"
 * Strictly complies with Rule: "Never display PKR 645.16 or PKR 1,000.00".
 */
export function formatPKR(amount: number): string {
  const whole = roundHalfUp(amount || 0);
  return `PKR ${whole.toLocaleString('en-US')}`;
}

/**
 * Calculates the payable fee for any given target fee month/year
 * considering student's admission date and monthly fee.
 */
export function calculateVoucherFee(
  regularMonthlyFee: number,
  admissionDateStr: string,
  targetYear: number,
  targetMonth: number,
  discountType: 'none' | 'fixed' | 'percentage' = 'none',
  discountValue: number = 0
): {
  baseFee: number;
  isAdmissionMonth: boolean;
  prorationDetails?: FeeProrationDetail;
  discountAmount: number;
  finalPayable: number;
} {
  const [admYear, admMonth] = admissionDateStr.split('-').map(Number);

  const isAdmissionMonth = admYear === targetYear && admMonth === targetMonth;

  let baseFee = regularMonthlyFee;
  let prorationDetails: FeeProrationDetail | undefined;

  if (isAdmissionMonth) {
    prorationDetails = calculateAdmissionProration(regularMonthlyFee, admissionDateStr);
    baseFee = prorationDetails.finalProratedFee;
  }

  // Calculate discount
  let discountAmount = 0;
  if (discountType === 'fixed') {
    discountAmount = Math.min(baseFee, Math.max(0, roundHalfUp(discountValue)));
  } else if (discountType === 'percentage') {
    const rawDiscount = (baseFee * Math.min(100, Math.max(0, discountValue))) / 100;
    discountAmount = roundHalfUp(rawDiscount);
  }

  const finalPayable = Math.max(0, baseFee - discountAmount);

  return {
    baseFee,
    isAdmissionMonth,
    prorationDetails,
    discountAmount,
    finalPayable,
  };
}
