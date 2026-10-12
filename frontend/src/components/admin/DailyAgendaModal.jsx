import { X, Clock, User, Phone, CreditCard } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * ============================================================================
 * COMPONENTE: DailyAgendaModal
 * ============================================================================
 * Modal interactivo que se despliega al presionar cualquier día en el Mapa de Calor.
 * Permite auditar y gestionar el desglose horario de citas entre las 09:00 y las 19:00.
 *
 * Características:
 * - Detección de día bloqueado completamente (por feriado/descanso).
 * - Visualización de espacios libres vs. ocupados.
 * - Información del cliente: Nombre, teléfono y método de pago.
 * - Selector rápido en línea para cambiar el estado de la cita en tiempo real
 *   (Agendada, Confirmada, Asistida, Ausente, Cancelada).
 *
 * @param {Object} props
 * @param {string} props.dateStr - Fecha seleccionada en formato 'YYYY-MM-DD'
 * @param {Array<Object>} props.appointments - Colección de todas las citas del sistema
 * @param {Array<string>} props.blockedDates - Colección de fechas bloqueadas
 * @param {Function} props.onClose - Cierra el modal
 * @param {Function} props.onChangeStatus - Función para actualizar el estado de una cita
 */
export default function DailyAgendaModal({ dateStr, appointments, blockedDates, onClose, onChangeStatus }) {
  if (!dateStr) return null;

  // 1. Validar si la fecha completa está bloqueada
  const isBlocked = blockedDates.includes(dateStr);
  
  // 2. Filtrar citas correspondientes exclusivamente a este día
  const dayAppointments = appointments.filter(a => a.appointment_date === dateStr);
  
  // 3. Generar la secuencia de bloques horarios fijos (09:00 a 19:00)
  const hours = [];
  for (let i = 9; i <= 19; i++) {
    hours.push(`${i.toString().padStart(2, '0')}:00:00`);
  }

  // 4. Formatear la fecha para encabezado legible en español
  const dateFormatted = format(parseISO(dateStr), "EEEE d 'de' MMMM, yyyy", { locale: es });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Encabezado del Modal */}
        <div className="bg-dollhouse-pink p-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif text-slate-800 capitalize">Agenda del Día</h2>
            <p className="text-slate-600 font-sans text-sm capitalize">{dateFormatted}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/50 rounded-full hover:bg-white text-slate-700 transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal con scroll vertical */}
        <div className="p-6 overflow-y-auto flex-grow bg-slate-50">
          {isBlocked ? (
            // Mensaje si el día completo fue bloqueado por la administración
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
              <p className="text-red-500 font-bold mb-2">Día Bloqueado Completamente</p>
              <p className="text-slate-500 text-sm">No se pueden agendar citas este día (Feriado o Descanso).</p>
            </div>
          ) : (
            // Listado de bloques horarios
            <div className="space-y-3">
              {hours.map(hour => {
                // Buscar si existe una cita activa para este bloque horario
                const app = dayAppointments.find(a => a.appointment_time === hour && a.status !== 'cancelada');
                
                return (
                  <div 
                    key={hour} 
                    className={`flex flex-col sm:flex-row border rounded-xl overflow-hidden transition-all ${
                      app ? 'border-dollhouse-pink bg-white shadow-sm' : 'border-slate-200 bg-slate-100/50'
                    }`}
                  >
                    {/* Indicador de la hora */}
                    <div className={`sm:w-28 p-4 flex items-center justify-center font-bold font-sans ${
                      app ? 'bg-dollhouse-pink-light text-rose-600' : 'text-slate-400'
                    }`}>
                      <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                      {hour.substring(0, 5)}
                    </div>
                    
                    {/* Información y controles del bloque */}
                    <div className="p-4 flex-grow">
                      {app ? (
                        // Bloque Ocupado: Datos del cliente y selector de estado
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-slate-800 flex items-center">
                              <User className="w-4 h-4 mr-1.5 text-slate-400" />
                              {app.name}
                            </p>
                            <p className="text-sm text-slate-500 flex items-center mt-1">
                              <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                              {app.phone}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Método de pago */}
                            <span className="text-xs bg-slate-100 px-2 py-1.5 rounded-md text-slate-600 flex items-center border border-slate-200">
                              <CreditCard className="w-3 h-3 mr-1" />
                              {app.payment_method || 'Nequi'}
                            </span>
                            
                            {/* Selector dinámico de estado de la cita */}
                            <select 
                              value={app.status}
                              onChange={(e) => onChangeStatus && onChangeStatus(app.id, e.target.value)}
                              className={`text-xs px-2 py-1.5 rounded-md font-bold uppercase cursor-pointer border outline-none shadow-sm transition-colors ${
                                app.status === 'agendada' ? 'bg-green-50 text-green-700 border-green-200' : 
                                app.status === 'confirmada' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                app.status === 'asistida' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                'bg-orange-50 text-orange-700 border-orange-200'
                              }`}
                            >
                              <option value="agendada">Agendada</option>
                              <option value="confirmada">Confirmada</option>
                              <option value="asistida">Asistida</option>
                              <option value="ausente">Ausente</option>
                              <option value="cancelada">Cancelada</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        // Bloque Libre: Espacio disponible
                        <div className="h-full flex items-center text-slate-400 text-sm font-medium">
                          <span className="bg-slate-200 px-2 py-0.5 rounded-full text-xs mr-2">Libre</span>
                          Espacio disponible
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
