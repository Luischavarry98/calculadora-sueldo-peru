import React, { useState, useMemo } from 'react';
import { 
  User, 
  Briefcase, 
  Banknote, 
  CalendarOff, 
  PlusCircle, 
  Trash2, 
  Calculator,
  Building,
  ArrowRight,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Card } from './components/Card';
import { TextInput, NumberInput, SelectInput, ResultRow } from './components/Input';
import { INITIAL_STATE, AFP_OPTIONS, JOB_TYPE_OPTIONS } from './constants';
import { calculatePayroll, formatCurrency, formatPercentage } from './utils';
import { PayrollData, AdditionalDiscount } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<PayrollData>(INITIAL_STATE);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Local state for the dynamic discount adder
  const [newDiscountDesc, setNewDiscountDesc] = useState('');
  const [newDiscountAmount, setNewDiscountAmount] = useState<number>(0);

  const results = useMemo(() => calculatePayroll(data), [data]);

  const updateField = <K extends keyof PayrollData>(field: K, value: PayrollData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addDiscount = () => {
    if (newDiscountDesc.trim() && newDiscountAmount > 0) {
      const newDiscount: AdditionalDiscount = {
        id: Date.now().toString(),
        description: newDiscountDesc,
        amount: newDiscountAmount
      };
      setData(prev => ({
        ...prev,
        additionalDiscounts: [...prev.additionalDiscounts, newDiscount]
      }));
      setNewDiscountDesc('');
      setNewDiscountAmount(0);
    }
  };

  const removeDiscount = (id: string) => {
    setData(prev => ({
      ...prev,
      additionalDiscounts: prev.additionalDiscounts.filter(d => d.id !== id)
    }));
  };

  const downloadPDF = () => {
    setIsGeneratingPdf(true);
    
    // Allow UI to update before blocking
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // Helper formatting
        const fmt = (num: number) => `S/ ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        // Layout Constants
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const contentWidth = pageWidth - (margin * 2);
        const rightColX = pageWidth - margin;
        
        let y = 20;
        
        // --- HEADER ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text("BOLETA DE PAGO REFERENCIAL", pageWidth / 2, y, { align: "center" });
        y += 8;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: "center" });
        y += 15;
        
        // --- EMPLOYEE INFO BOX ---
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setFillColor(248, 250, 252); // slate-50
        doc.roundedRect(margin, y, contentWidth, 25, 3, 3, "FD");
        
        y += 8;
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text("COLABORADOR", margin + 5, y);
        
        y += 7;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(data.name || "Sin Nombre Registrado", margin + 5, y);
        
        y += 6;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85); // slate-700
        const jobLabel = data.jobType === "FULL_TIME" ? "Full Time" : "Part Time";
        doc.text(`${jobLabel}  •  AFP: ${data.afpProvider}`, margin + 5, y);
        
        y += 15;
        
        // --- CONTENT HELPERS ---
        const drawSectionHeader = (title: string) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42);
          doc.text(title, margin, y);
          y += 8;
        };

        const drawRow = (label: string, value: string, detail?: string, isNegative: boolean = false) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(51, 65, 85);
          doc.text(label, margin, y);
          
          if (detail) {
             const labelWidth = doc.getTextWidth(label);
             doc.setFontSize(8);
             doc.setTextColor(148, 163, 184); // slate-400
             doc.text(`(${detail})`, margin + labelWidth + 2, y);
          }

          doc.setFontSize(10);
          doc.setTextColor(isNegative ? 220 : 51, isNegative ? 38 : 65, isNegative ? 38 : 85); // Red if negative
          doc.text(value, rightColX, y, { align: "right" });
          y += 6;
        };

        const drawTotalLine = (label: string, value: string, color: string = "#0f172a") => {
          y += 2;
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y - 4, rightColX, y - 4); // Line above
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          doc.text(label, margin, y);
          
          doc.setTextColor(color);
          doc.text(value, rightColX, y, { align: "right" });
          y += 12;
        };
        
        // --- INGRESOS ---
        drawSectionHeader("INGRESOS");
        drawRow("Remuneración Mensual", fmt(data.monthlyRemuneration));
        if (results.overtimeAmount > 0) drawRow("Horas Extras", fmt(results.overtimeAmount), `${data.overtimeHours} hrs`);
        if (results.holidayAmount > 0) drawRow("Feriados Laborados", fmt(results.holidayAmount), `${data.workedHolidays} días`);
        
        const totalGross = data.monthlyRemuneration + results.totalAdditionalIncome;
        drawTotalLine("TOTAL INGRESOS BRUTOS", fmt(totalGross), "#16a34a"); // green-600

        // --- DESCUENTOS ---
        drawSectionHeader("DESCUENTOS Y DEDUCCIONES");
        if (results.unworkedDaysAmount > 0) drawRow("Días No Laborados", `-${fmt(results.unworkedDaysAmount)}`, `${data.unworkedDays} días`, true);
        data.additionalDiscounts.forEach(d => {
          drawRow(d.description, `-${fmt(d.amount)}`, undefined, true);
        });
        
        drawTotalLine("TOTAL DESCUENTOS", `-${fmt(results.totalDiscounts)}`, "#dc2626"); // red-600

        // --- COMPUTABLE ---
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text("REMUNERACIÓN COMPUTABLE", margin, y);
        doc.text(fmt(results.computableRemuneration), rightColX, y, { align: "right" });
        y += 12;

        // --- AFP ---
        drawSectionHeader(`APORTES AFP (${data.afpProvider})`);
        drawRow("Aporte Obligatorio Fondo", `-${fmt(results.afpMandatoryAmount)}`, `${data.afpMandatoryRate}%`, true);
        drawRow("Prima de Seguro", `-${fmt(results.afpInsuranceAmount)}`, `${data.afpInsuranceRate}%`, true);
        
        drawTotalLine("TOTAL APORTES AFP", `-${fmt(results.totalAFPDiscount)}`, "#dc2626");

        y += 5;

        // --- FINAL SUMMARY BOX ---
        doc.setDrawColor(15, 23, 42); // slate-900 border
        doc.setLineWidth(0.5);
        doc.rect(margin, y, contentWidth, 40);
        
        let boxY = y + 10;
        
        // Net Remuneration
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("REMUNERACIÓN NETA", margin + 5, boxY);
        doc.text(fmt(results.netRemuneration), rightColX - 5, boxY, { align: "right" });
        boxY += 8;
        
        // Advances
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("Adelantos", margin + 5, boxY);
        doc.text(`-${fmt(data.advancePayment)}`, rightColX - 5, boxY, { align: "right" });
        
        // Separator inside box
        boxY += 5;
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.2);
        doc.line(margin + 5, boxY, rightColX - 5, boxY);
        boxY += 10;
        
        // Final Pay
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("NETO A PAGAR", margin + 5, boxY);
        doc.text(fmt(results.depositAmount), rightColX - 5, boxY, { align: "right" });

        // --- FOOTER ---
        const footerY = doc.internal.pageSize.getHeight() - 15;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Documento generado con Calculadora de Remuneraciones V2025. Los cálculos son referenciales.", pageWidth / 2, footerY, { align: "center" });

        const fileName = `Boleta_${data.name.replace(/\s+/g, '_') || 'Colaborador'}.pdf`;
        doc.save(fileName);
      } catch (error) {
        console.error("Error generating PDF", error);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-primary text-white pt-8 pb-16 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cálculo de Remuneración</h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full text-sm text-slate-300">
            <Calculator size={16} className="text-accent" />
            <span>Versión 2025</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 -mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* 1. Datos del Colaborador */}
          <Card title="Datos del Colaborador" icon={<User size={20} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <TextInput 
                  label="Nombre Completo" 
                  value={data.name} 
                  onChange={(val) => updateField('name', val)} 
                  placeholder="Ej: Nombre del Colaborador"
                />
              </div>
              <NumberInput 
                label="Remuneración Mensual" 
                value={data.monthlyRemuneration} 
                onChange={(val) => updateField('monthlyRemuneration', val)} 
                prefix="S/" 
              />
              <SelectInput 
                label="Tipo de Jornada" 
                value={data.jobType} 
                onChange={(val: any) => updateField('jobType', val)} 
                options={JOB_TYPE_OPTIONS} 
              />
              <div className="md:col-span-2">
                <SelectInput 
                  label="Fondo de Pensiones (AFP)" 
                  value={data.afpProvider} 
                  onChange={(val: any) => updateField('afpProvider', val)} 
                  options={AFP_OPTIONS} 
                  subLabel="Determina las tasas aplicables"
                />
              </div>
            </div>
          </Card>

          {/* 2. Ingresos Adicionales */}
          <Card title="Ingresos Adicionales" icon={<Briefcase size={20} />}>
            <div className="grid grid-cols-1 gap-6">
              {/* Horas Extra */}
              <div className="flex flex-col md:flex-row items-end gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex-1 w-full">
                  <NumberInput 
                    label="Horas Extra (H.E.)" 
                    subLabel="Factor 1.25"
                    value={data.overtimeHours} 
                    onChange={(val) => updateField('overtimeHours', val)} 
                    suffix="hrs"
                  />
                </div>
                <div className="hidden md:flex items-center justify-center pb-3 text-slate-400">
                  <ArrowRight size={20} />
                </div>
                <div className="flex-1 w-full">
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-right">
                    <span className="text-xs text-slate-500 block">Total H. Extra</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.overtimeAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Feriados */}
              <div className="flex flex-col md:flex-row items-end gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex-1 w-full">
                  <NumberInput 
                    label="Feriados Laborados" 
                    subLabel="Días (Factor 2)"
                    value={data.workedHolidays} 
                    onChange={(val) => updateField('workedHolidays', val)} 
                    suffix="días"
                  />
                </div>
                <div className="hidden md:flex items-center justify-center pb-3 text-slate-400">
                  <ArrowRight size={20} />
                </div>
                <div className="flex-1 w-full">
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-right">
                    <span className="text-xs text-slate-500 block">Total Feriados</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.holidayAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between items-center px-2">
                <span className="font-semibold text-slate-700">Total Ingresos Adicionales</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(results.totalAdditionalIncome)}</span>
              </div>
            </div>
          </Card>

          {/* 3. Descuentos */}
          <Card title="Descuentos y Deducciones" icon={<CalendarOff size={20} />}>
             <div className="grid grid-cols-1 gap-6">
              {/* Dias No Laborados */}
              <div className="flex flex-col md:flex-row items-end gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex-1 w-full">
                   <NumberInput 
                    label="Días No Laborados" 
                    subLabel="Ausencias injustificadas"
                    value={data.unworkedDays} 
                    onChange={(val) => updateField('unworkedDays', val)} 
                    suffix="días"
                  />
                </div>
                <div className="flex-1 w-full">
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-right">
                    <span className="text-xs text-slate-500 block">Deducción Calculada</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(results.unworkedDaysAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Otros Descuentos */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Descuentos Adicionales</label>
                
                {/* List of discounts */}
                {data.additionalDiscounts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg group">
                    <span className="text-slate-600 text-sm">{item.description}</span>
                    <div className="flex items-center gap-4">
                       <span className="font-medium text-red-600">-{formatCurrency(item.amount)}</span>
                       <button 
                        onClick={() => removeDiscount(item.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                ))}

                {/* Adder */}
                <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-lg border border-dashed border-slate-300">
                  <div className="flex-grow">
                     <TextInput 
                      label="Descripción" 
                      value={newDiscountDesc} 
                      onChange={setNewDiscountDesc} 
                      placeholder="Ej: Consumo Productos"
                    />
                  </div>
                  <div className="w-32">
                    <NumberInput 
                      label="Monto" 
                      value={newDiscountAmount} 
                      onChange={setNewDiscountAmount} 
                      prefix="S/"
                    />
                  </div>
                  <button 
                    onClick={addDiscount}
                    className="mb-[1px] p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center justify-center"
                    disabled={!newDiscountDesc || newDiscountAmount <= 0}
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between items-center px-2">
                <span className="font-semibold text-slate-700">Total Descuentos</span>
                <span className="font-bold text-red-600 text-lg">-{formatCurrency(results.totalDiscounts)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Receipt / Summary */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-6 space-y-6">
            
            {/* Boleta Summary Card */}
            <Card 
              title="Resumen de Boleta" 
              icon={<Banknote size={20} />}
              className="border-t-4 border-t-accent"
              footer={
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <NumberInput 
                      label="Adelanto Quincena" 
                      value={data.advancePayment} 
                      onChange={(val) => updateField('advancePayment', val)} 
                      prefix="S/"
                    />
                  </div>
                  <div className="bg-slate-800 text-white p-4 rounded-lg flex justify-between items-center shadow-md">
                    <div>
                      <span className="text-slate-400 text-sm block">Monto a Depositar</span>
                      <span className="text-xs text-slate-500">Neto - Adelantos</span>
                    </div>
                    <span className="text-2xl font-bold tracking-tight">{formatCurrency(results.depositAmount)}</span>
                  </div>
                </div>
              }
            >
              <div className="space-y-4">
                 {/* Header Info */}
                 <div className="text-center pb-4 border-b border-slate-100">
                    <h2 className="text-slate-900 font-bold uppercase tracking-wide">
                      {data.name || 'COLABORADOR'}
                    </h2>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded mt-1 inline-block">
                      {data.jobType === 'FULL_TIME' ? 'Full Time' : 'Part Time'} • {data.afpProvider}
                    </span>
                 </div>

                 {/* Remuneration Section */}
                 <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ingresos</h4>
                   <ResultRow label="Remuneración Mensual" value={formatCurrency(data.monthlyRemuneration)} />
                   {results.overtimeAmount > 0 && (
                     <ResultRow label="Horas Extras" value={formatCurrency(results.overtimeAmount)} detail={`${data.overtimeHours} hrs`} />
                   )}
                   {results.holidayAmount > 0 && (
                     <ResultRow label="Feriados" value={formatCurrency(results.holidayAmount)} detail={`${data.workedHolidays} días`} />
                   )}
                 </div>

                 {/* Deductions Section */}
                 <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Descuentos</h4>
                   {results.unworkedDaysAmount > 0 && (
                     <ResultRow label="Días No Laborados" value={`-${formatCurrency(results.unworkedDaysAmount)}`} detail={`${data.unworkedDays} días`} />
                   )}
                   {data.additionalDiscounts.map(d => (
                     <ResultRow key={d.id} label={d.description} value={`-${formatCurrency(d.amount)}`} />
                   ))}
                   
                   {/* Computed Base Line */}
                   <div className="my-3 border-t border-dashed border-slate-200"></div>
                   <ResultRow 
                     label="Remuneración Computable" 
                     value={formatCurrency(results.computableRemuneration)} 
                     isSubTotal
                     detail="Base Cálculo AFP"
                   />
                 </div>

                 {/* AFP Section */}
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                   <div className="flex items-center gap-2 mb-2">
                     <Building size={14} className="text-slate-400" />
                     <h4 className="text-xs font-bold text-slate-500 uppercase">Aportes AFP ({data.afpProvider})</h4>
                   </div>
                   <ResultRow 
                      label="Aporte Obligatorio" 
                      value={`-${formatCurrency(results.afpMandatoryAmount)}`} 
                      detail={formatPercentage(data.afpMandatoryRate)}
                    />
                   <ResultRow 
                      label="Prima de Seguros" 
                      value={`-${formatCurrency(results.afpInsuranceAmount)}`} 
                      detail={formatPercentage(data.afpInsuranceRate)}
                    />
                    <div className="border-t border-slate-200 mt-2 pt-2">
                       <ResultRow 
                          label="Total Descuento AFP" 
                          value={`-${formatCurrency(results.totalAFPDiscount)}`} 
                          isSubTotal
                          detail="Aporte + Prima"
                        />
                    </div>
                 </div>

                 {/* Final Net */}
                 <ResultRow 
                    label="Remuneración Neta" 
                    value={formatCurrency(results.netRemuneration)} 
                    isTotal 
                  />

              </div>
            </Card>

            <button 
              onClick={downloadPDF}
              disabled={isGeneratingPdf}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download size={20} />
              {isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF Detallado'}
            </button>

            <div className="text-center text-xs text-slate-400 px-4">
              <p>Los cálculos son referenciales basados en las fórmulas provistas.</p>
              <p className="mt-1">Tasa Aporte: {data.afpMandatoryRate}% | Tasa Prima: {data.afpInsuranceRate}%</p>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
