import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Copy, PlusCircle, CheckCircle, XCircle, AlertCircle, CalendarOff, Trash2, Edit, CheckCheck } from 'lucide-react';
import { mockApi } from '../../mockApi'; // Importar simulador local
import HeatmapCalendar from '../../components/admin/HeatmapCalendar';
import DailyAgendaModal from '../../components/admin/DailyAgendaModal';

const API_URL = 'http://localhost/backend';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_agendadas: 0, total_canceladas: 0, total_ausentes: 0, total_clientes: 0, total_asistidas: 0, pagos_nequi: 0, pagos_transferencia: 0, pagos_efectivo: 0 });
  const [appointments, setAppointments] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para Modal de Agenda Diaria
  const [selectedAgendaDate, setSelectedAgendaDate] = useState(null);
  
  // Estado para edición en línea de fechas
  const [editMode, setEditMode] = useState({ id: null, date: '', time: '' });
  
  // Estado para el popup de agendamiento manual
  const [isBookingManual, setIsBookingManual] = useState(false);
  
  // Formulario rápido con nuevos campos (Apellido, Método de Pago)
  const [form, setForm] = useState({ name: '', lastname: '', phone: '', payment_method: 'Nequi', date: '', time: '' });

  const templates = [
    { title: 'Confirmación', text: '¡Hola! Confirmamos tu cita de manicure para el [Fecha] a las [Hora]. Te esperamos 💕' },
    { title: 'Recordatorio', text: 'Hola hermosa, te recordamos tu cita de mañana a las [Hora]. Por favor confirmar asistencia. ✨' },
    { title: 'No Show', text: 'Hola, notamos que no pudiste asistir a tu cita. ¿Te gustaría reagendar? 💅' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const resStats = await axios.get(`${API_URL}/api/dashboard`, getHeaders());
      setStats(resStats.data);
      
      const resApps = await axios.get(`${API_URL}/api/appointments`, getHeaders());
      setAppointments(resApps.data.appointments || []);

      const resBlocked = await axios.get(`${API_URL}/api/settings/blocked-dates`, getHeaders());
      setBlockedDates(resBlocked.data.blocked_dates || []);
    } catch (error) {
      console.warn('Usando base de datos local (Mock) porque el backend no responde.');
      try {
        const mStats = await mockApi.getDashboardStats();
        const mApps = await mockApi.getAppointments();
        const mBlocked = await mockApi.getBlockedDates();
        setStats(mStats);
        setAppointments(mApps.appointments);
        setBlockedDates(mBlocked.blocked_dates);
      } catch (mockErr) {
        console.error('Error interno del mock:', mockErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Plantilla copiada');
  };

  const handleToggleBlockDate = async (dateStr) => {
    if (!dateStr) return;
    try {
      await axios.post(`${API_URL}/api/settings/blocked-dates`, { date: dateStr }, getHeaders());
    } catch (error) {
      await mockApi.toggleBlockDate(dateStr);
    }
    setBlockDateForm('');
    fetchData();
  };

  const handleAgendarManual = async (e) => {
    e.preventDefault();
    setIsBookingManual(true);
    try {
      await axios.post(`${API_URL}/api/appointments`, form, getHeaders());
    } catch (error) {
      await mockApi.createAppointment(form);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    setForm({ name: '', lastname: '', phone: '', payment_method: 'Nequi', date: '', time: '' });
    await fetchData();
    setIsBookingManual(false);
  };

  const handleChangeStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/appointments/${id}`, { status: newStatus }, getHeaders());
    } catch (error) {
      await mockApi.updateAppointmentStatus(id, newStatus);
    }
    fetchData();
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente esta cita?')) return;
    try {
      await axios.delete(`${API_URL}/api/appointments/${id}`, getHeaders());
    } catch (error) {
      await mockApi.deleteAppointment(id);
    }
    fetchData();
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API_URL}/api/appointments/${editMode.id}/datetime`, { date: editMode.date, time: editMode.time }, getHeaders());
    } catch (error) {
      await mockApi.updateAppointmentDateTime(editMode.id, editMode.date, editMode.time);
    }
    setEditMode({ id: null, date: '', time: '' });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center relative z-20">
        <h1 className="text-2xl font-serif text-slate-800">Panel Admin</h1>
        <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 flex items-center transition-colors">
          <LogOut className="w-5 h-5 mr-1" /> Salir
        </button>
      </nav>

      {/* Submenú Top */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex gap-6 text-sm font-medium text-slate-500 overflow-x-auto whitespace-nowrap sticky top-0 z-10 shadow-sm">
        <a href="#metricas" className="hover:text-dollhouse-pink-dark transition-colors">Métricas Generales</a>
        <a href="#agendar" className="hover:text-dollhouse-pink-dark transition-colors">Agendar Manualmente</a>
        <a href="#calendario" className="hover:text-dollhouse-pink-dark transition-colors">Calendario</a>
        <a href="#base-clientes" className="hover:text-dollhouse-pink-dark transition-colors">Base de Clientes</a>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1 space-y-6">
          {/* SECCIÓN 1: MÉTRICAS */}
          <div id="metricas" className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 scroll-mt-24">
            <h2 className="text-lg font-serif mb-4 text-slate-700">Métricas Generales</h2>
            
            {/* Estados de Citas */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                <p className="text-[10px] text-green-600 uppercase font-bold">Agendadas</p>
                <p className="text-xl font-serif">{stats.total_agendadas || 0}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <p className="text-[10px] text-emerald-600 uppercase font-bold">Asistidas</p>
                <p className="text-xl font-serif">{stats.total_asistidas || 0}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                <p className="text-[10px] text-red-600 uppercase font-bold">Canceladas</p>
                <p className="text-xl font-serif">{stats.total_canceladas || 0}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                <p className="text-[10px] text-orange-600 uppercase font-bold">Ausentes</p>
                <p className="text-xl font-serif">{stats.total_ausentes || 0}</p>
              </div>
            </div>

            {/* Clientes y Pagos */}
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-xl flex justify-between items-center border border-blue-100">
                <p className="text-[10px] text-blue-600 uppercase font-bold">Total Clientes</p>
                <p className="text-xl font-serif text-blue-700">{stats.total_clientes || 0}</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Métodos de Pago</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 text-xs">Nequi</span>
                    <span className="font-medium bg-white px-2 py-0.5 rounded shadow-sm text-xs">{stats.pagos_nequi || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 text-xs">Transferencia</span>
                    <span className="font-medium bg-white px-2 py-0.5 rounded shadow-sm text-xs">{stats.pagos_transferencia || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 text-xs">Efectivo</span>
                    <span className="font-medium bg-white px-2 py-0.5 rounded shadow-sm text-xs">{stats.pagos_efectivo || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="agendar" className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 scroll-mt-24">
            <h2 className="text-lg font-serif mb-4 flex items-center text-slate-700">
              <PlusCircle className="w-5 h-5 mr-2 text-dollhouse-gold" />
              Bloquear / Agendar Cita
            </h2>
            <form onSubmit={handleAgendarManual} className="space-y-3">
              <div className="flex gap-2">
                <input type="text" placeholder="Nombre" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-1/2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dollhouse-pink" />
                <input type="text" placeholder="Apellido" required value={form.lastname} onChange={e => setForm({...form, lastname: e.target.value})} className="w-1/2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dollhouse-pink" />
              </div>
              <input type="text" placeholder="WhatsApp (Ej: 57300...)" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dollhouse-pink" />
              
              <select required value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dollhouse-pink bg-white">
                <option value="Nequi">Nequi</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
              </select>

              <div className="flex gap-2">
                <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-1/2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dollhouse-pink" />
                <input type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-1/2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-dollhouse-pink" />
              </div>
              <button type="submit" className="w-full bg-slate-800 text-white font-medium py-3 rounded-lg hover:bg-slate-700 transition-colors shadow-sm">Bloquear Horario (Guardar)</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Heatmap Calendar */}
          <div id="calendario" className="scroll-mt-24">
            <HeatmapCalendar appointments={appointments} onDayClick={setSelectedAgendaDate} />
          </div>

          {/* Tabla de Citas -> Base de Clientes */}
          <div id="base-clientes" className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 scroll-mt-24">
            <h2 className="text-xl font-serif mb-6 text-slate-800">Base de Clientes</h2>
            
            {loading ? (
              <p className="text-slate-500">Cargando...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-sm text-slate-500 uppercase tracking-wider">
                      <th className="pb-3 px-2 font-medium">Fecha/Hora</th>
                      <th className="pb-3 px-2 font-medium">Cliente</th>
                      <th className="pb-3 px-2 font-medium">Pago</th>
                      <th className="pb-3 px-2 font-medium">Estado</th>
                      <th className="pb-3 px-2 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((app) => {
                      const isEditing = editMode.id === app.id;

                      return (
                        <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-2 text-sm whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <input type="date" value={editMode.date} onChange={e => setEditMode({...editMode, date: e.target.value})} className="border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-dollhouse-pink" />
                                <input type="time" value={editMode.time} onChange={e => setEditMode({...editMode, time: e.target.value})} className="border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-dollhouse-pink" />
                              </div>
                            ) : (
                              <>
                                <p className="font-semibold text-slate-700">{app.appointment_date}</p>
                                <p className="text-slate-500 text-xs">{app.appointment_time}</p>
                              </>
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <p className="font-medium text-slate-800 text-sm">{app.name}</p>
                            <a href={`https://wa.me/${app.phone}`} target="_blank" rel="noreferrer" className="text-xs text-green-600 hover:underline">{app.phone}</a>
                          </td>
                          <td className="py-4 px-2 text-sm text-slate-600">
                            {app.payment_method || 'Pendiente'}
                          </td>
                          <td className="py-4 px-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              app.status === 'agendada' ? 'bg-green-100 text-green-700' :
                              app.status === 'confirmada' ? 'bg-blue-100 text-blue-700' :
                              app.status === 'asistida' ? 'bg-emerald-100 text-emerald-700' :
                              app.status === 'cancelada' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button onClick={handleSaveEdit} className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors">Guardar</button>
                                <button onClick={() => setEditMode({ id: null, date: '', time: '' })} className="text-xs bg-slate-300 text-slate-700 px-3 py-1 rounded hover:bg-slate-400 transition-colors">Cancelar</button>
                              </div>
                            ) : (
                              <div className="flex justify-end items-center gap-3">
                                {/* Botones de Estado */}
                                <div className="flex gap-1 border-r border-slate-200 pr-3">
                                  <button onClick={() => handleChangeStatus(app.id, 'agendada')} className="text-green-500 hover:scale-110 transition-transform" title="Marcar Agendada"><CheckCircle className="w-4 h-4"/></button>
                                  <button onClick={() => handleChangeStatus(app.id, 'asistida')} className="text-emerald-500 hover:scale-110 transition-transform" title="Marcar Asistida (Completada)"><CheckCheck className="w-4 h-4"/></button>
                                  <button onClick={() => handleChangeStatus(app.id, 'cancelada')} className="text-red-500 hover:scale-110 transition-transform" title="Cancelar Cita"><XCircle className="w-4 h-4"/></button>
                                  <button onClick={() => handleChangeStatus(app.id, 'ausente')} className="text-orange-500 hover:scale-110 transition-transform" title="Marcar Ausente"><AlertCircle className="w-4 h-4"/></button>
                                </div>
                                
                                {/* Botones de Acción Avanzada */}
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => setEditMode({ id: app.id, date: app.appointment_date, time: app.appointment_time.substring(0, 5) })} 
                                    className="text-slate-400 hover:text-blue-500 transition-colors" title="Cambiar Fecha/Hora"
                                  >
                                    <Edit className="w-4 h-4"/>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteAppointment(app.id)} 
                                    className="text-slate-400 hover:text-red-500 transition-colors" title="Eliminar Permanentemente"
                                  >
                                    <Trash2 className="w-4 h-4"/>
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {appointments.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-slate-400">No hay citas registradas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Agenda por Día */}
      {selectedAgendaDate && (
        <DailyAgendaModal 
          dateStr={selectedAgendaDate}
          appointments={appointments}
          blockedDates={blockedDates}
          onClose={() => setSelectedAgendaDate(null)}
          onChangeStatus={handleChangeStatus}
        />
      )}

      {/* Popup de Redirección Manual Admin */}
      {isBookingManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center border border-dollhouse-pink mx-4 text-center">
            <div className="w-12 h-12 border-4 border-dollhouse-pink-light border-t-dollhouse-pink-dark rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-serif text-slate-800">Agendando cita en tu calendario...</p>
          </div>
        </div>
      )}
    </div>
  );
}
