import { useState, useEffect } from 'react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, MessageCircle, User, CreditCard } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { mockApi } from '../mockApi'; // Importar simulador local

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const API_URL = 'http://localhost/backend';
const BUSINESS_PHONE = '573196966226';

export default function PublicCalendar() {
  const [step, setStep] = useState(1);
  const [clientData, setClientData] = useState({ name: '', lastname: '', phone: '', payment_method: 'Transferencia' });

  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3 semanas (21 días)
  const days = Array.from({ length: 21 }).map((_, i) => addDays(startOfToday(), i));

  useEffect(() => {
    if (step === 2) {
      fetchAvailableTimes(selectedDate);
    }
  }, [selectedDate, step]);

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

  const handleNextStep = (e) => {
    e.preventDefault();
    if (clientData.name.trim() && clientData.phone.length > 8) {
      setStep(2);
    }
  };

  const handleAgendar = async () => {
    if (!selectedTime) return;
    
    setIsSubmitting(true);
    
    // 1. Preparar los datos de la cita
    const newAppointment = {
      name: clientData.name,
      lastname: clientData.lastname,
      phone: clientData.phone,
      payment_method: clientData.payment_method,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime
    };

    // 2. Guardar en la base de datos (Backend o Mock Local)
    try {
      await axios.post(`${API_URL}/api/appointments`, newAppointment);
    } catch (error) {
      console.warn("Backend no disponible, guardando en Mock API Local");
      await mockApi.createAppointment(newAppointment);
    }

    // Asegurar 1 segundo de espera extra para mostrar el popup al usuario
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Generar mensaje de confirmación
    const dateFormatted = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });
    const timeFormatted = selectedTime.substring(0, 5);
    const fullname = `${clientData.name} ${clientData.lastname}`.trim();
    const mensaje = `Hola, mi nombre es ${fullname}. Me gustaría agendar una cita de Manicure para el día ${dateFormatted} a las ${timeFormatted}. Mi método de pago será en ${clientData.payment_method}. ¿Tienen disponibilidad?`;
    
    // 4. Redirigir a WhatsApp
    const waLink = `https://wa.me/${BUSINESS_PHONE}?text=${encodeURIComponent(mensaje)}`;
    window.location.href = waLink;
  };

  return (
    <div className="min-h-screen bg-dollhouse-pink-light flex flex-col justify-between items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden mt-6 mb-10 border border-dollhouse-pink">
        <div className="bg-dollhouse-pink p-6 text-center rounded-b-[40px] shadow-sm">
          <h1 className="text-3xl font-serif text-slate-800">Manicure Studio</h1>
          <p className="text-slate-600 font-sans mt-2 text-sm">Reserva tu espacio de belleza</p>
        </div>

        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-6">
              <h2 className="text-xl font-serif text-slate-700 text-center mb-4">Ingresa tus datos</h2>
              
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

              <button 
                type="submit"
                disabled={!clientData.name || !clientData.lastname || clientData.phone.length < 8}
                className="w-full bg-slate-800 text-white font-serif py-3 rounded-xl mt-4 hover:bg-slate-700 transition-colors shadow-md disabled:opacity-50"
              >
                Continuar
              </button>
            </form>
          )}

          {step === 2 && (
            <>
              <button 
                onClick={() => setStep(1)}
                className="text-sm text-slate-400 underline mb-4 inline-block hover:text-slate-600 transition-colors"
              >
                &larr; Volver atrás
              </button>
              
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

      {/* Popup de Redirección a WhatsApp */}
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
