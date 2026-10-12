import { useState, useEffect } from 'react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, MessageCircle, User, CreditCard } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { mockApi } from '../mockApi'; // Importar simulador local para modo offline/demo

/**
 * Utilidad para concatenar clases condicionales de Tailwind CSS.
 */
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Configuración de endpoints y contacto del negocio (compatible con Hostinger y Localhost)
const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost/backend' : '/api');
const BUSINESS_PHONE = '573196966226'; // Número oficial de WhatsApp del salón de manicure

/**
 * ============================================================================
 * COMPONENTE: PublicCalendar
 * ============================================================================
 * Vista pública orientada a los clientes del salón de manicure.
 * Implementa una experiencia de agendamiento guiada en 2 pasos con diseño "Dollhouse":
 * 
 * - PASO 1: Formulario de datos del cliente (Nombre, Apellido, WhatsApp internacional
 *           con banderas y selector de Método de Pago: Efectivo / Transferencia).
 * - PASO 2: Selección de fecha (próximas 3 semanas) y franja horaria disponible
 *           (de 09:00 a 19:00).
 * - ACCIÓN FINAL: Guarda la cita en la base de datos (o mock local), muestra un popup
 *   durante 1 segundo con feedback visual, y redirige al chat de WhatsApp con un
 *   mensaje pre-armado listo para enviar.
 */
export default function PublicCalendar() {
  // Paso actual del flujo (1: Datos del cliente, 2: Selección de fecha y hora)
  const [step, setStep] = useState(1);

  // Estado del formulario del cliente
  const [clientData, setClientData] = useState({ 
    name: '', 
    lastname: '', 
    phone: '', 
    payment_method: 'Transferencia' 
  });

  // Fecha seleccionada en el carrusel (por defecto el día de hoy)
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  
  // Franjas horarias disponibles para la fecha seleccionada
  const [availableTimes, setAvailableTimes] = useState([]);
  
  // Hora seleccionada por el cliente
  const [selectedTime, setSelectedTime] = useState(null);
  
  // Indicador de carga de horas disponibles
  const [loading, setLoading] = useState(false);
  
  // Indicador de guardado y activación del popup hacia WhatsApp
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Proyección de las próximas 3 semanas (21 días continuos)
  const days = Array.from({ length: 21 }).map((_, i) => addDays(startOfToday(), i));

  /**
   * Efecto: cuando el cliente pasa al Paso 2 o cambia de fecha, se consulta la disponibilidad.
   */
  useEffect(() => {
    if (step === 2) {
      fetchAvailableTimes(selectedDate);
    }
  }, [selectedDate, step]);

  /**
   * Consulta los bloques horarios disponibles para la fecha dada.
   * Si la API PHP no responde, conmuta automáticamente a mockApi (localStorage).
   * @param {Date} date - Fecha a consultar
   */
  const fetchAvailableTimes = async (date) => {
    setLoading(true);
    setSelectedTime(null);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await axios.get(`${API_URL}/api/appointments/available?date=${dateStr}`);
      setAvailableTimes(res.data.available_times || []);
    } catch (error) {
      console.warn('Usando Mock API para consultar disponibilidad local.');
      const mData = await mockApi.getAvailableTimes(format(date, 'yyyy-MM-dd'));
      setAvailableTimes(mData.available_times || []);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Valida los datos del cliente y avanza al Paso 2.
   */
  const handleNextStep = (e) => {
    e.preventDefault();
    if (clientData.name.trim() && clientData.phone.length > 8) {
      setStep(2);
    }
  };

  /**
   * Flujo de agendamiento y confirmación:
   * 1. Activa el popup de transición.
   * 2. Registra la cita en la base de datos (o mock) como 'agendada'.
   * 3. Espera 1 segundo para feedback visual.
   * 4. Redirige a WhatsApp con el mensaje personalizado.
   */
  const handleAgendar = async () => {
    if (!selectedTime) return;
    
    setIsSubmitting(true);
    
    // 1. Estructurar el objeto de la cita
    const newAppointment = {
      name: clientData.name,
      lastname: clientData.lastname,
      phone: clientData.phone,
      payment_method: clientData.payment_method,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime
    };

    // 2. Persistir en Backend o Mock Local
    try {
      await axios.post(`${API_URL}/api/appointments`, newAppointment);
    } catch (error) {
      console.warn("Backend no disponible, guardando en Mock API Local");
      await mockApi.createAppointment(newAppointment);
    }

    // 3. Espera controlada de 1 segundo para visualización del popup
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Armar el mensaje para WhatsApp
    const dateFormatted = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });
    const timeFormatted = selectedTime.substring(0, 5);
    const fullname = `${clientData.name} ${clientData.lastname}`.trim();
    const mensaje = `Hola, mi nombre es ${fullname}. Me gustaría agendar una cita de Manicure para el día ${dateFormatted} a las ${timeFormatted}. Mi método de pago será en ${clientData.payment_method}. ¿Tienen disponibilidad?`;
    
    // 5. Redireccionar hacia WhatsApp
    const waLink = `https://wa.me/${BUSINESS_PHONE}?text=${encodeURIComponent(mensaje)}`;
    window.location.href = waLink;
  };

  return (
    <div className="min-h-screen bg-dollhouse-pink-light flex flex-col justify-between items-center p-4">
      {/* Contenedor tipo Tarjeta Móvil Centrada */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden mt-6 mb-10 border border-dollhouse-pink">
        
        {/* Cabecera decorativa */}
        <div className="bg-dollhouse-pink p-6 text-center rounded-b-[40px] shadow-sm">
          <h1 className="text-3xl font-serif text-slate-800">Manicure Studio</h1>
          <p className="text-slate-600 font-sans mt-2 text-sm">Reserva tu espacio de belleza</p>
        </div>

        <div className="p-6">
          {/* =========================================================================
              PASO 1: Formulario de Información Personal del Cliente
              ========================================================================= */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-6">
              <h2 className="text-xl font-serif text-slate-700 text-center mb-4">Ingresa tus datos</h2>
              
              {/* Nombre y Apellido */}
              <div className="flex gap-3">
                <div className="w-1/2">
                  <label className="flex items-center text-sm font-medium text-slate-600 mb-1">
                    <User className="w-4 h-4 mr-1" /> Nombre
                  </label>
                  <input 
                    type="text" 
                    required
                    value={clientData.name}
                    onChange={e => setClientData({...clientData, name: e.target.value})}
                    className="w-full border border-dollhouse-pink rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-dollhouse-gold transition-all text-sm"
                    placeholder="Ej. Camila"
                  />
                </div>
                <div className="w-1/2">
                  <label className="flex items-center text-sm font-medium text-slate-600 mb-1">
                    Apellido
                  </label>
                  <input 
                    type="text" 
                    required
                    value={clientData.lastname}
                    onChange={e => setClientData({...clientData, lastname: e.target.value})}
                    className="w-full border border-dollhouse-pink rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-dollhouse-gold transition-all text-sm"
                    placeholder="Ej. Rodríguez"
                  />
                </div>
              </div>

              {/* Teléfono con selector internacional y selector de Pago */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-slate-600 mb-1">
                    WhatsApp
                  </label>
                  <div className="react-tel-input-custom-wrapper">
                    <PhoneInput
                      defaultCountry="co"
                      value={clientData.phone}
                      onChange={(phone) => setClientData({...clientData, phone})}
                      inputStyle={{ width: '100%', height: '48px', borderRadius: '0.75rem', borderColor: '#FFB6C1', fontSize: '1rem' }}
                      buttonStyle={{ borderRadius: '0.75rem 0 0 0.75rem', borderColor: '#FFB6C1', backgroundColor: '#FFF0F5' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-slate-600 mb-1">
                    <CreditCard className="w-4 h-4 mr-1" /> Método de Pago
                  </label>
                  <select 
                    required
                    value={clientData.payment_method}
                    onChange={e => setClientData({...clientData, payment_method: e.target.value})}
                    className="w-full border border-dollhouse-pink rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-dollhouse-gold transition-all text-sm bg-white"
                  >
                    <option value="Transferencia">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>
              </div>

              {/* Botón para pasar al Paso 2 */}
              <button 
                type="submit"
                disabled={!clientData.name || !clientData.lastname || clientData.phone.length < 8}
                className="w-full bg-slate-800 text-white font-serif py-3 rounded-xl mt-4 hover:bg-slate-700 transition-colors shadow-md disabled:opacity-50"
              >
                Continuar
              </button>
            </form>
          )}

          {/* =========================================================================
              PASO 2: Selección de Fecha y Franja Horaria
              ========================================================================= */}
          {step === 2 && (
            <>
              {/* Botón para regresar al Paso 1 */}
              <button 
                onClick={() => setStep(1)}
                className="text-sm text-slate-400 underline mb-4 inline-block hover:text-slate-600 transition-colors"
              >
                &larr; Volver atrás
              </button>
              
              {/* Carrusel de días horizontal (3 semanas) */}
              <h2 className="flex items-center text-lg font-serif mb-4 text-slate-700">
                <CalendarIcon className="w-5 h-5 mr-2 text-dollhouse-gold" />
                1. Selecciona el día
              </h2>
              
              <div className="flex overflow-x-auto pt-2 pb-4 px-1 gap-3 no-scrollbar scroll-smooth">
                {days.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[70px] h-20 rounded-2xl border-2 transition-all shrink-0",
                      isSameDay(selectedDate, day)
                        ? "border-dollhouse-gold bg-dollhouse-gold-light text-slate-800 shadow-md scale-105"
                        : "border-dollhouse-pink bg-white text-slate-500 hover:border-dollhouse-gold-light"
                    )}
                  >
                    <span className="text-xs uppercase font-bold">{format(day, 'EEE', { locale: es })}</span>
                    <span className="text-2xl font-serif">{format(day, 'd')}</span>
                  </button>
                ))}
              </div>

              {/* Grilla de selección de horas */}
              <h2 className="flex items-center text-lg font-serif mt-6 mb-4 text-slate-700">
                <Clock className="w-5 h-5 mr-2 text-dollhouse-gold" />
                2. Selecciona la hora
              </h2>

              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dollhouse-pink-dark"></div>
                </div>
              ) : availableTimes.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {availableTimes.map((time, i) => {
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "py-2 rounded-xl border text-sm font-medium transition-all",
                          isSelected
                            ? "bg-dollhouse-pink-dark border-dollhouse-pink-dark text-white shadow-md scale-105"
                            : "bg-white border-dollhouse-pink text-slate-600 hover:bg-dollhouse-pink hover:text-slate-800"
                        )}
                      >
                        {time.substring(0, 5)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-slate-500 text-sm">Todas las citas están reservadas para este día.</p>
                  <p className="text-slate-400 text-xs mt-1">Por favor selecciona otro día.</p>
                </div>
              )}

              {/* Botón de Confirmación y Agendamiento */}
              {selectedTime && (
                <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <button
                    onClick={handleAgendar}
                    className="w-full flex items-center justify-center py-4 rounded-2xl bg-[#25D366] text-white font-serif text-lg hover:bg-green-600 transition-colors shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Agendar Cita
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-2 font-sans px-4">
                    Al confirmar, te redirigiremos a WhatsApp para asegurar tu cita.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer con crédito y enlace externo */}
      <footer className="w-full text-center py-4 mt-auto">
        <a 
          href="https://crearpaginaweb.co" 
          target="_blank" 
          rel="noreferrer" 
          className="text-xs text-slate-400 hover:text-dollhouse-pink-dark transition-colors font-sans underline underline-offset-2"
        >
          Desarrollado por crearpaginaweb.co
        </a>
      </footer>

      {/* Popup de Transición hacia WhatsApp (Feedback visual de 1 segundo) */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center border border-dollhouse-pink mx-4 text-center">
            <div className="w-12 h-12 border-4 border-dollhouse-pink-light border-t-dollhouse-pink-dark rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-serif text-slate-800">Agendando cita...</p>
            <p className="text-sm text-slate-500 font-sans mt-2">Pasando a WhatsApp para confirmar</p>
          </div>
        </div>
      )}
    </div>
  );
}
