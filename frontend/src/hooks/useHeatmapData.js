import { useState, useEffect, useMemo } from 'react';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, addMonths, subMonths, format, isSameMonth, isSameDay
} from 'date-fns';

/**
 * Custom Hook: Lógica del Mapa de Calor
 * Recibe los appointments (citas reales) y calcula el volumen por día.
 */
export function useHeatmapData(appointments = [], initialDate = new Date()) {
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [calendarDays, setCalendarDays] = useState([]);

  // Memorizamos el conteo real de citas para no recalcular innecesariamente
  const heatmapData = useMemo(() => {
    const data = {};
    // Contamos cuántas citas hay por día (solo las activas/agendadas)
    appointments.forEach(app => {
      if (app.status === 'agendada') {
        const dateStr = app.appointment_date;
        if (!data[dateStr]) data[dateStr] = 0;
        data[dateStr] += 1;
      }
    });
    return data;
  }, [appointments]);

  useEffect(() => {
    // Calcular los días del calendario (matriz visual)
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Iniciar la semana en Lunes (weekStartsOn: 1)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); 
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Mapear los días calculados con el volumen de citas reales
    const daysWithData = daysInterval.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const count = heatmapData[dateStr] || 0;
      
      return {
        date: day,
        dateStr,
        isCurrentMonth: isSameMonth(day, currentMonth),
        isToday: isSameDay(day, new Date()),
        count: count
      };
    });

    setCalendarDays(daysWithData);
  }, [currentMonth, heatmapData]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return {
    currentMonth,
    calendarDays,
    nextMonth,
    prevMonth
  };
}
