import { format } from 'date-fns';

/**
 * ============================================================================
 * MOCK API - SIMULADOR DE BASE DE DATOS Y SERVICIOS REST
 * ============================================================================
 * Provee persistencia local mediante localStorage para permitir que la
 * aplicación funcione al 100% en modo demo/offline sin depender de un backend PHP
 * o base de datos MySQL activa.
 */

// Utilidad para simular latencia de red asíncrona (300 ms)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Recupera el listado de citas almacenadas en LocalStorage.
 * Si no existen registros previos, genera datos semilla iniciales de prueba.
 * @returns {Array<Object>} Lista de citas
 */
const getStoredAppointments = () => {
  try {
    const data = localStorage.getItem('gomitas_appointments');
    if (data) return JSON.parse(data);
    
    // Semilla inicial con citas de ejemplo
    const seed = [
      { id: 1, name: 'María Gómez', phone: '573001112233', payment_method: 'Nequi', appointment_date: format(new Date(), 'yyyy-MM-dd'), appointment_time: '14:00:00', status: 'agendada' },
      { id: 2, name: 'Laura Pérez', phone: '573009998877', payment_method: 'Efectivo', appointment_date: format(new Date(), 'yyyy-MM-dd'), appointment_time: '15:30:00', status: 'cancelada' },
      { id: 3, name: 'Diana Rojas', phone: '573100000000', payment_method: 'Transferencia', appointment_date: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'), appointment_time: '10:00:00', status: 'agendada' }
    ];
    localStorage.setItem('gomitas_appointments', JSON.stringify(seed));
    return seed;
  } catch (e) {
    console.error('Error al acceder a localStorage:', e);
    return [];
  }
};

/**
 * Persiste las citas en el almacenamiento local del navegador.
 * @param {Array<Object>} apps - Lista actualizada de citas
 */
const saveAppointments = (apps) => {
  localStorage.setItem('gomitas_appointments', JSON.stringify(apps));
};

/**
 * Recupera el listado de fechas completamente bloqueadas por el administrador.
 * @returns {Array<string>} Fechas en formato YYYY-MM-DD
 */
const getBlockedDates = () => {
  const data = localStorage.getItem('gomitas_blocked_dates');
  return data ? JSON.parse(data) : [];
};

/**
 * Persiste la lista de fechas bloqueadas en LocalStorage.
 * @param {Array<string>} dates
 */
const saveBlockedDates = (dates) => {
  localStorage.setItem('gomitas_blocked_dates', JSON.stringify(dates));
};

/**
 * Objeto central mockApi con métodos que emulan los endpoints de la API REST.
 */
export const mockApi = {
  /**
   * Obtiene los horarios disponibles (09:00 a 19:00) para una fecha específica.
   * Filtra horarios ya ocupados por citas con estado 'agendada'.
   * Si la fecha completa está bloqueada, devuelve un arreglo vacío.
   * @param {string} dateStr - Fecha en formato 'YYYY-MM-DD'
   */
  getAvailableTimes: async (dateStr) => {
    await delay(300);
    
    // 1. Validar si el día entero fue bloqueado manualmente en el admin
    const blockedDates = getBlockedDates();
    if (blockedDates.includes(dateStr)) {
      return { available_times: [] };
    }

    // 2. Generar todos los bloques horarios de 1 hora entre 09:00 y 19:00
    const allBlocks = [];
    for (let i = 9; i <= 19; i++) {
      allBlocks.push(`${i.toString().padStart(2, '0')}:00:00`);
    }

    // 3. Filtrar los bloques ya agendados en esa fecha
    const appointments = getStoredAppointments();
    const takenTimes = appointments
      .filter(app => app.appointment_date === dateStr && (app.status === 'agendada' || app.status === 'confirmada'))
      .map(app => app.appointment_time);

    // 4. Retornar solo las horas libres
    const availableTimes = allBlocks.filter(time => !takenTimes.includes(time));
    return { available_times: availableTimes };
  },

  /**
   * Retorna todas las citas registradas en el sistema.
   */
  getAppointments: async () => {
    await delay(300);
    return { appointments: getStoredAppointments() };
  },

  /**
   * Registra una nueva cita en la base de datos local.
   * Se crea con estado predeterminado 'agendada' y se ordena cronológicamente.
   * @param {Object} data - Datos de la cita { name, lastname, phone, payment_method, date, time }
   */
  createAppointment: async (data) => {
    await delay(300);
    const appointments = getStoredAppointments();
    const newApp = {
      id: Date.now(),
      name: `${data.name} ${data.lastname || ''}`.trim(),
      phone: data.phone,
      payment_method: data.payment_method || 'Pendiente',
      appointment_date: data.date,
      appointment_time: data.time.length === 5 ? `${data.time}:00` : data.time,
      status: 'agendada' // Estado inicial por defecto
    };
    appointments.push(newApp);
    
    // Ordenar de más reciente a más antigua
    appointments.sort((a, b) => new Date(`${b.appointment_date}T${b.appointment_time}`) - new Date(`${a.appointment_date}T${a.appointment_time}`));
    
    saveAppointments(appointments);
    return { success: true, appointment_id: newApp.id };
  },

  /**
   * Actualiza el estado de una cita existente (agendada, confirmada, asistida, ausente, cancelada).
   * @param {number|string} id - ID de la cita
   * @param {string} status - Nuevo estado
   */
  updateAppointmentStatus: async (id, status) => {
    await delay(300);
    const appointments = getStoredAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index].status = status;
      saveAppointments(appointments);
    }
    return { success: true };
  },

  /**
   * Modifica la fecha y hora de una cita (Reagendar).
   * @param {number|string} id - ID de la cita
   * @param {string} newDate - Nueva fecha 'YYYY-MM-DD'
   * @param {string} newTime - Nueva hora 'HH:mm' o 'HH:mm:ss'
   */
  updateAppointmentDateTime: async (id, newDate, newTime) => {
    await delay(300);
    const appointments = getStoredAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index].appointment_date = newDate;
      appointments[index].appointment_time = newTime.length === 5 ? `${newTime}:00` : newTime;
      saveAppointments(appointments);
    }
    return { success: true };
  },

  /**
   * Elimina permanentemente una cita de la base de datos.
   * @param {number|string} id - ID de la cita a eliminar
   */
  deleteAppointment: async (id) => {
    await delay(300);
    let appointments = getStoredAppointments();
    appointments = appointments.filter(a => a.id !== id);
    saveAppointments(appointments);
    return { success: true };
  },

  /**
   * Calcula los totales para las tarjetas de métricas del Dashboard de administración.
   */
  getDashboardStats: async () => {
    await delay(300);
    const appointments = getStoredAppointments();
    return {
      total_agendadas: appointments.filter(a => a.status === 'agendada').length,
      total_canceladas: appointments.filter(a => a.status === 'cancelada').length,
      total_ausentes: appointments.filter(a => a.status === 'ausente').length,
      total_asistidas: appointments.filter(a => a.status === 'asistida').length,
      total_clientes: new Set(appointments.map(a => a.phone)).size,
      pagos_nequi: appointments.filter(a => a.payment_method?.toLowerCase() === 'nequi').length,
      pagos_transferencia: appointments.filter(a => a.payment_method?.toLowerCase() === 'transferencia').length,
      pagos_efectivo: appointments.filter(a => a.payment_method?.toLowerCase() === 'efectivo').length,
    };
  },

  /**
   * Retorna la lista de fechas bloqueadas globalmente.
   */
  getBlockedDates: async () => {
    await delay(300);
    return { blocked_dates: getBlockedDates() };
  },

  /**
   * Alterna el bloqueo/desbloqueo de una fecha específica.
   * @param {string} dateStr - Fecha en formato 'YYYY-MM-DD'
   */
  toggleBlockDate: async (dateStr) => {
    await delay(300);
    let blockedDates = getBlockedDates();
    if (blockedDates.includes(dateStr)) {
      blockedDates = blockedDates.filter(d => d !== dateStr);
    } else {
      blockedDates.push(dateStr);
    }
    saveBlockedDates(blockedDates);
    return { success: true, blocked_dates: blockedDates };
  }
};
