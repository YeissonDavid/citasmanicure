import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useHeatmapData } from '../../hooks/useHeatmapData';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

/**
 * Utilidad para fusionar clases condicionales de Tailwind CSS sin conflictos de especificidad.
 */
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * ============================================================================
 * ESCALA MONOCROMÁTICA DE CALOR (Estética Dollhouse - Tonos Rose)
 * ============================================================================
 * Determina el color de fondo y texto de cada día en función de la cantidad
 * de citas agendadas:
 * - 0 citas: Fondo tenue (bg-rose-50), texto gris suave.
 * - 1 a 3 citas: Rosado pastel suave (bg-rose-200).
 * - 4 a 7 citas: Rosado vibrante medio (bg-rose-400), texto blanco.
 * - 8+ citas: Rosado saturado / fucsia oscuro (bg-rose-600), texto blanco en negrita.
 *
 * @param {number} count - Número de citas del día
 * @returns {string} Clases de Tailwind CSS
 */
const getColorClass = (count) => {
  if (count === 0) return 'bg-rose-50 text-slate-400 border border-rose-100';
  if (count >= 1 && count <= 3) return 'bg-rose-200 text-slate-700 shadow-sm';
  if (count >= 4 && count <= 7) return 'bg-rose-400 text-white shadow-sm font-medium';
  return 'bg-rose-600 text-white shadow-md font-bold'; // Día con alta saturación de citas
};

/**
 * ============================================================================
 * COMPONENTE: HeatmapCalendar
 * ============================================================================
 * Componente puramente presentacional (UI) del Mapa de Calor mensual.
 * Consume el custom hook `useHeatmapData` para desacoplar completamente la lógica
 * de cálculo de fechas respecto a la vista.
 *
 * @param {Object} props
 * @param {Array<Object>} props.appointments - Listado de citas a representar
 * @param {Function} props.onDayClick - Callback que se dispara al hacer clic en un día del mes
 */
export default function HeatmapCalendar({ appointments, onDayClick }) {
  // Consumo del Custom Hook (Separación de responsabilidades)
  const { currentMonth, calendarDays, nextMonth, prevMonth } = useHeatmapData(appointments);

  // Encabezados de días de la semana
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 w-full flex flex-col">
      {/* 1. Header con navegación de mes y año */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif text-slate-800 capitalize flex items-center">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth} 
            className="p-2 rounded-full hover:bg-rose-50 text-slate-600 transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextMonth} 
            className="p-2 rounded-full hover:bg-rose-50 text-slate-600 transition-colors"
            title="Siguiente mes"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Días de la semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* 3. Matriz del Mapa de Calor (Cuadrícula interactiva) */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((dayObj, idx) => (
          <div 
            key={idx} 
            className="relative group h-14 sm:h-16 flex items-center justify-center"
          >
            {/* Botón interactivo de la fecha */}
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

            {/* 4. Tooltip flotante con información detallada al hacer hover */}
            {dayObj.isCurrentMonth && (
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 w-max max-w-xs pointer-events-none animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-800 text-white text-xs rounded-xl py-2 px-3 shadow-xl text-center">
                  <p className="font-bold mb-1 capitalize">{format(dayObj.date, "EEEE d 'de' MMMM", { locale: es })}</p>
                  <p className="flex items-center justify-center opacity-90 font-medium text-rose-200">
                    <Info className="w-3 h-3 mr-1" />
                    {dayObj.count === 0 ? 'Sin citas agendadas' : `${dayObj.count} citas agendadas`}
                  </p>
                </div>
                {/* Flecha inferior del tooltip */}
                <div className="w-3 h-3 bg-slate-800 rotate-45 -mt-1.5 rounded-sm"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 5. Leyenda explicativa de la escala de colores */}
      <div className="mt-8 flex items-center justify-center gap-4 text-xs font-sans text-slate-500">
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-50 mr-1 border border-slate-200"></span> 0 citas</span>
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-200 mr-1 shadow-sm"></span> 1-3 citas</span>
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-400 mr-1 shadow-sm"></span> 4-7 citas</span>
        <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-600 mr-1 shadow-md"></span> 8+ citas</span>
      </div>
    </div>
  );
}
