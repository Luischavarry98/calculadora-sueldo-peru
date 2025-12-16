import { JobType, PayrollData, CalculationResult } from './types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPercentage = (rate: number): string => {
  return `${rate.toFixed(2)}%`;
};

export const calculatePayroll = (data: PayrollData): CalculationResult => {
  const {
    monthlyRemuneration,
    jobType,
    overtimeHours,
    workedHolidays,
    unworkedDays,
    additionalDiscounts,
    afpMandatoryRate,
    afpInsuranceRate,
    advancePayment
  } = data;

  // Constants
  const dailyHours = jobType === JobType.FULL_TIME ? 8 : 4;
  const daysInMonth = 30; // Standard commercial month

  // 1. Rates
  const dailyRate = monthlyRemuneration / daysInMonth;
  const hourlyRate = dailyRate / dailyHours;

  // 2. Additional Income
  // Formula: (Monthly / 30 / Hours) * Overtime * 1.25
  const overtimeAmount = hourlyRate * overtimeHours * 1.25;
  
  // Formula: (Monthly / 30) * Holidays * 2
  const holidayAmount = dailyRate * workedHolidays * 2;

  const totalAdditionalIncome = overtimeAmount + holidayAmount;

  // 3. Discounts
  // Formula: (Monthly / 30) * UnworkedDays
  const unworkedDaysAmount = dailyRate * unworkedDays;
  
  const additionalDiscountsTotal = additionalDiscounts.reduce((sum, item) => sum + item.amount, 0);
  
  const totalDiscounts = unworkedDaysAmount + additionalDiscountsTotal;

  // 4. Computable Remuneration
  // Formula: Remuneration + Income - Discounts
  // Note: Depending on strict labor laws, AFP is calculated on "Remuneración Asegurable" 
  // (Salary + Overtime) regardless of non-disciplinary discounts, but we follow the user's specific formula:
  // "SUMA DE LA REMUNERACION MENSUAL + INGRESOS ADICIONALES - DESCUENTOS"
  const computableRemuneration = Math.max(0, monthlyRemuneration + totalAdditionalIncome - totalDiscounts);

  // 5. AFP Calculation
  const afpMandatoryAmount = computableRemuneration * (afpMandatoryRate / 100);
  const afpInsuranceAmount = computableRemuneration * (afpInsuranceRate / 100);
  
  const totalAFPDiscount = afpMandatoryAmount + afpInsuranceAmount;

  // 6. Net
  const netRemuneration = computableRemuneration - totalAFPDiscount;
  const depositAmount = netRemuneration - advancePayment;

  return {
    hourlyRate,
    dailyRate,
    overtimeAmount,
    holidayAmount,
    totalAdditionalIncome,
    unworkedDaysAmount,
    additionalDiscountsTotal,
    totalDiscounts,
    computableRemuneration,
    afpMandatoryAmount,
    afpInsuranceAmount,
    totalAFPDiscount,
    netRemuneration,
    depositAmount: Math.max(0, depositAmount), // Cannot be negative
  };
};