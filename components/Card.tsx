import React, { ReactNode } from 'react';

interface CardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  id?: string;
}

export const Card: React.FC<CardProps> = ({ title, icon, children, className = '', footer, id }) => {
  return (
    <div id={id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
        {icon && <span className="text-accent">{icon}</span>}
        <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
};