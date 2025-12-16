import { AFPProvider, JobType, PayrollData } from './types';

export const INITIAL_STATE: PayrollData = {
  name: '',
  monthlyRemuneration: 0, // Set to 0 so the input field appears blank
  jobType: JobType.FULL_TIME,
  afpProvider: AFPProvider.INTEGRA,
  overtimeHours: 0,
  workedHolidays: 0,
  unworkedDays: 0,
  additionalDiscounts: [],
  advancePayment: 0,
  afpMandatoryRate: 10.00,
  afpInsuranceRate: 1.37,
};

export const AFP_OPTIONS = [
  { value: AFPProvider.INTEGRA, label: 'Integra' },
  { value: AFPProvider.HABITAT, label: 'Habitat' },
  { value: AFPProvider.PRIMA, label: 'Prima' },
  { value: AFPProvider.PROFUTURO, label: 'Profuturo' },
];

export const JOB_TYPE_OPTIONS = [
  { value: JobType.FULL_TIME, label: 'Full Time (8hrs)' },
  { value: JobType.PART_TIME, label: 'Part Time (4hrs)' },
];