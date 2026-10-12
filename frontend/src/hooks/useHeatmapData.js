import { useState, useEffect, useMemo } from 'react';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, addMonths, subMonths, format, isSameMonth, isSameDay
} from 'date-fns';

/**
 * ============================================================================
 * CUSTOM HOOK: useHeatmapData
 * ============================================================================
 * Aplica el principio de Separación de Responsabilidades (Separation of Concerns).
 * 
 * Centraliza toda la lógica de cálculo temporal, navegación de meses y
 * agregación de densidad de citas diarias. El componente visual consumidor
 * (HeatmapCalendar) permanece puramente presentacional.
 *
 * @param {Array<Object>} appointments - Lista de citas proveniente de la API o Mock.
 * @param {Date} [initialDate=new Date()] - Fecha inicial para enfocar el mes (por defecto mes actual).
 * @returns {Object} {
 *   currentMonth: Date,       // Mes actualmente enfocado en la vista
 *   calendarDays: Array,      // Matriz de días con metadatos y conteo de citas
 *   nextMonth: Function,      // Función para avanzar un mes
 *   prevMonth: Function       // Función para retroceder un mes
 * }
 */
export function useHeatmapData(appointments = [], initialDate = new Date()) {
  // Estado que mantiene el mes seleccionado en pantalla
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  
  // Estado que contiene la grilla completa de celdas a renderizar (días del mes + relleno de semana)
  const [calendarDays, setCalendarDays] = useState([]);

  /**
   * Conteo memoizado de citas por fecha ('YYYY-MM-DD').
   * Solo contabiliza citas con estado 'agendada' o 'confirmada' para reflejar carga real.
   * Se recalcula exclusivamente cuando la colección `appointments` cambia.
   */
  const heatmapData = useMemo(() => {
    const data = {};
    appointments.forEach(app => {
      if (app.status === 'agendada' || app.status === 'confirmada') {
        const dateStr = app.appointment_date;
        if (!data[dateStr]) data[dateStr] = 0;
        data[dateStr] += 1;
      }
    });
    return data;
  }, [appointments]);

  /**
   * Efecto que genera la matriz visual de 7 columnas (Lunes a Domingo) para el mes actual.
   * Calcula el primer y último día del mes, e incluye los días de relleno de semanas anteriores
   * y posteriores para mantener una cuadrícula perfecta y continua.
   */
  useEffect(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Iniciar la semana en Lunes (weekStartsOn: 1) según estándar latinoamericano/europeo
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); 
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    // Genera el rango continuo de fechas
    const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Asocia cada celda con su fecha formateada, pertenencia al mes actual y volumen de citas
    const daysWithData = daysInterval.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const count = heatmapData[dateStr] || 0;
      
      return {
        date: day,
        dateStr,
        isCurrentMonth: isSameMonth(day, currentMonth), // Si pertenece al mes activo o es relleno
        isToday: isSameDay(day, new Date()),           // Si es el día de hoy
        count: count                                   // Cantidad de citas agendadas para el mapa de calor
      };
    });

    setCalendarDays(daysWithData);
  }, [currentMonth, heatmapData]);

  // Manejadores de navegación de mes
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return {
    currentMonth,
    calendarDays,
    nextMonth,
    prevMonth
  };
}
