import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useHeatmapData } from '../../hooks/useHeatmapData';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Lógica pura de presentación (Colores basados en paleta Rose)
const getColorClass = (count) => {
  if (count === 0) return 'bg-rose-50 text-slate-400 border border-rose-100';
  if (count >= 1 && count <= 3) return 'bg-rose-200 text-slate-700 shadow-sm';
  if (count >= 4 && count <= 7) return 'bg-rose-400 text-white shadow-sm font-medium';
  return 'bg-rose-600 text-white shadow-md font-bold'; // 8+ citas
};

export default function HeatmapCalendar({ appointments, onDayClick }) {
  // Consumo del Custom Hook (Data Logic separada) usando datos reales
  const { currentMonth, calendarDays, nextMonth, prevMonth } = useHeatmapData(appointments);

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 w-full flex flex-col">
      {/* Header del Calendario */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif text-slate-800 capitalize flex items-center">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth} 
            className="p-2 rounded-full hover:bg-rose-50 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextMonth} 
            className="p-2 rounded-full hover:bg-rose-50 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Matriz del Mapa de Calor */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((dayObj, idx) => (
          <div 
            key={idx} 
            className="relative group h-14 sm:h-16 flex items-center justify-center"
          >
            <button
              onClick={() => dayObj.isCurrentMonth && onDayClick && onDayClick(dayObj.dateStr)}
              className={cn(
                "w-full h-full rounded-xl flex items-center justify-center text-sm transition-all duration-300",
                dayObj.isCurrentMonth ? getColorClass(dayObj.count) : "bg-slate-50 text-slate-300 opacity-50",
                dayObj.isCurrentMonth && "hover:scale-105 hover:ring-2 hover:ring-rose-300 ring-offset-2"
              )}
            >
              {format(dayObj.date, 'd')}
            </button>

            {/* Tooltip Hover flotante */}
            {dayObj.isCurrentMonth && (
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 w-max max-w-xs pointer-events-none animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-800 text-white text-xs rounded-xl py-2 px-3 shadow-xl text-center">
                  <p className="font-bold mb-1 capitalize">{format(dayObj.date, "EEEE d 'de' MMMM", { locale: es })}</p>
                  <p className="flex items-center justify-center opacity-90 font-medium text-rose-200">
                    <Info className="w-3 h-3 mr-1" />
                    {dayObj.count === 0 ? 'Sin citas agendadas' : `${dayObj.count} citas agendadas`}
                  </p>
                </div>
                <div className="w-3 h-3 bg-slate-800 rotate-45 -mt-1.5 rounded-sm"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Leyenda Visual */}
      <div className="mt-8 flex items-center justify-center gap-4 text-xs font-sans text-slate-500">
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-50 mr-1 border border-slate-200"></span> 0</span>
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-200 mr-1 shadow-sm"></span> 1-3</span>
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-400 mr-1 shadow-sm"></span> 4-7</span>
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-600 mr-1 shadow-md"></span> 8+</span>
      </div>
    </div>
  );
}
