import React from 'react';

interface BaseInputProps {
  label: string;
  subLabel?: string;
}

interface NumberInputProps extends BaseInputProps {
  value: number;
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  placeholder?: string;
}

interface TextInputProps extends BaseInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

interface SelectInputProps extends BaseInputProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}

export const NumberInput: React.FC<NumberInputProps> = ({ 
  label, subLabel, value, onChange, prefix, suffix, min = 0, placeholder 
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {subLabel && <span className="ml-1 text-xs text-slate-400 font-normal">({subLabel})</span>}
      </label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-slate-500 text-sm font-medium">{prefix}</span>}
        <input
          type="number"
          min={min}
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          onWheel={(e) => (e.target as HTMLInputElement).blur()} // Prevent scrolling from changing value
          placeholder={placeholder || "0.00"}
          className={`w-full rounded-lg border border-slate-300 bg-white py-2.5 text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all ${prefix ? 'pl-9' : 'pl-3'} ${suffix ? 'pr-8' : 'pr-3'}`}
        />
        {suffix && <span className="absolute right-3 text-slate-500 text-sm">{suffix}</span>}
      </div>
    </div>
  );
};

export const TextInput: React.FC<TextInputProps> = ({ label, subLabel, value, onChange, placeholder }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {subLabel && <span className="ml-1 text-xs text-slate-400 font-normal">({subLabel})</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
      />
    </div>
  );
};

export const SelectInput: React.FC<SelectInputProps> = ({ label, subLabel, value, onChange, options }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {subLabel && <span className="ml-1 text-xs text-slate-400 font-normal">({subLabel})</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const ResultRow: React.FC<{ label: string; value: string; isTotal?: boolean; isSubTotal?: boolean; detail?: string }> = ({ 
  label, value, isTotal, isSubTotal, detail 
}) => {
  return (
    <div className={`flex justify-between items-center py-2 ${isTotal ? 'border-t border-slate-300 mt-2 pt-3' : isSubTotal ? 'border-t border-slate-100 mt-1' : ''}`}>
      <div className="flex flex-col">
        <span className={`${isTotal ? 'font-bold text-slate-900 text-lg' : isSubTotal ? 'font-semibold text-slate-700' : 'text-slate-600'}`}>
          {label}
        </span>
        {detail && <span className="text-xs text-slate-400 italic">{detail}</span>}
      </div>
      <span className={`${isTotal ? 'font-bold text-accent text-lg' : isSubTotal ? 'font-semibold text-slate-800' : 'text-slate-700 font-medium'}`}>
        {value}
      </span>
    </div>
  );
};