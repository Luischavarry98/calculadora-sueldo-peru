export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
}

export enum AFPProvider {
  INTEGRA = 'INTEGRA',
  HABITAT = 'HABITAT',
  PRIMA = 'PRIMA',
  PROFUTURO = 'PROFUTURO',
  ONP = 'ONP', // Added as a fallback option usually required, but will focus on private as requested
}

export interface AdditionalDiscount {
  id: string;
  description: string;
  amount: number;
}

export interface PayrollData {
  name: string;
  monthlyRemuneration: number;
  jobType: JobType;
  afpProvider: AFPProvider;
  overtimeHours: number;
  workedHolidays: number;
  unworkedDays: number;
  additionalDiscounts: AdditionalDiscount[];
  advancePayment: number;
  // Rates (Editable if needed, but defaulted)
  afpMandatoryRate: number; // 10%
  afpInsuranceRate: number; // 1.37%
}

export interface CalculationResult {
  hourlyRate: number;
  dailyRate: number;
  overtimeAmount: number;
  holidayAmount: number;
  totalAdditionalIncome: number;
  unworkedDaysAmount: number;
  additionalDiscountsTotal: number;
  totalDiscounts: number;
  computableRemuneration: number;
  afpMandatoryAmount: number;
  afpInsuranceAmount: number;
  totalAFPDiscount: number;
  netRemuneration: number;
  depositAmount: number;
}