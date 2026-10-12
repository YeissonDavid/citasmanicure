import { format } from 'date-fns';

// Simulación de Base de Datos en LocalStorage
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getStoredAppointments = () => {
  try {
    const data = localStorage.getItem('gomitas_appointments');
    if (data) return JSON.parse(data);
    
    // Seed de prueba si está vacío
    const seed = [
      { id: 1, name: 'María Gómez', phone: '573001112233', payment_method: 'Nequi', appointment_date: format(new Date(), 'yyyy-MM-dd'), appointment_time: '14:00:00', status: 'agendada' },
      { id: 2, name: 'Laura Pérez', phone: '573009998877', payment_method: 'Efectivo', appointment_date: format(new Date(), 'yyyy-MM-dd'), appointment_time: '15:30:00', status: 'cancelada' },
      { id: 3, name: 'Diana Rojas', phone: '573100000000', payment_method: 'Transferencia', appointment_date: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'), appointment_time: '10:00:00', status: 'agendada' }
    ];
    localStorage.setItem('gomitas_appointments', JSON.stringify(seed));
    return seed;
  } catch (e) {
    return [];
  }
};

const saveAppointments = (apps) => {
  localStorage.setItem('gomitas_appointments', JSON.stringify(apps));
};

const getBlockedDates = () => {
  const data = localStorage.getItem('gomitas_blocked_dates');
  return data ? JSON.parse(data) : [];
};

const saveBlockedDates = (dates) => {
  localStorage.setItem('gomitas_blocked_dates', JSON.stringify(dates));
};

export const mockApi = {
  getAvailableTimes: async (dateStr) => {
    await delay(300);
    
    // Validar si el día entero está bloqueado
    const blockedDates = getBlockedDates();
    if (blockedDates.includes(dateStr)) {
      return { available_times: [] };
    }

    const allBlocks = [];
    for (let i = 9; i <= 19; i++) {
      allBlocks.push(`${i.toString().padStart(2, '0')}:00:00`);
    }

    const appointments = getStoredAppointments();
    const takenTimes = appointments
      .filter(app => app.appointment_date === dateStr && app.status === 'agendada')
      .map(app => app.appointment_time);

    const availableTimes = allBlocks.filter(time => !takenTimes.includes(time));
    
    return { available_times: availableTimes };
  },

  getAppointments: async () => {
    await delay(300);
    return { appointments: getStoredAppointments() };
  },

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
      status: 'agendada'
    };
    appointments.push(newApp);
    appointments.sort((a, b) => new Date(`${b.appointment_date}T${b.appointment_time}`) - new Date(`${a.appointment_date}T${a.appointment_time}`));
    
    saveAppointments(appointments);
    return { success: true, appointment_id: newApp.id };
  },

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

  deleteAppointment: async (id) => {
    await delay(300);
    let appointments = getStoredAppointments();
    appointments = appointments.filter(a => a.id !== id);
    saveAppointments(appointments);
    return { success: true };
  },

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

  getBlockedDates: async () => {
    await delay(300);
    return { blocked_dates: getBlockedDates() };
  },

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
