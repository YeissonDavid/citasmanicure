# Citas Manicure - Sistema de Agendamiento y Dashboard Administrativo

Sistema integral para gestión y reserva de citas de manicure y estética, con estética visual "Casa de Muñecas" (Dollhouse pastel pinks & gold), mapa de calor interactivo y panel administrativo.

## ✨ Características Principales

### 💅 Calendario Público de Clientes
- **Flujo de reserva en 2 pasos:**
  - Paso 1: Ingreso de datos del cliente (Nombre, Apellido, WhatsApp internacional con banderas y selector de Método de Pago: Efectivo / Transferencia).
  - Paso 2: Selección de fecha (próximas 3 semanas) y bloque de horario disponible (9:00 AM a 7:00 PM).
- **Confirmación instantánea:** Al confirmar, se almacena en la base de datos y se redirige con un popup elegante a WhatsApp (+57 319 696 6226) con mensaje preconfigurado.
- **Footer de autoría:** Enlace a [crearpaginaweb.co](https://crearpaginaweb.co).

### 🛠️ Panel de Administración (Dashboard)
- **Submenú superior de navegación rápida (Sticky):**
  - Métricas Generales
  - Agendar Manualmente
  - Calendario (Heatmap)
  - Base de Clientes
- **Métricas detalladas:**
  - Citas Agendadas, Confirmadas, Asistidas, Canceladas y Ausentes.
  - Conteo total de clientes únicos.
  - Desglose histórico por métodos de pago (Nequi, Transferencia, Efectivo).
- **Mapa de Calor (Heatmap) Mensual:**
  - Vista mensual completa con navegación entre meses.
  - Escala de color monocromática rosada según la densidad de citas.
  - Tooltips interactivos con cantidad de citas por día.
  - Acceso directo a la **Agenda del Día por horas** con capacidad de modificar estados en tiempo real (Agendada, Confirmada, Asistida, Ausente, Cancelada).
- **Base de Clientes / Gestión de Citas:**
  - Cambio rápido de estados con un clic.
  - Edición en línea de fecha y hora de la cita.
  - Eliminación permanente de registros.
  - Enlaces directos a chats de WhatsApp con clientes.

---

## 🚀 Tecnologías

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React, Date-fns, React International Phone, Axios.
- **Modo Demo / Offline:** `mockApi.js` basado en `localStorage` para funcionamiento continuo sin requerir servidor externo activo.
- **Backend:** PHP 8+ REST API con autenticación JWT y MySQL (`backend/index.php`, `backend/schema.sql`).

---

## 💻 Instalación y Uso

### 1. Clonar el repositorio
```bash
git clone https://github.com/YeissonDavid/citasmanicure.git
cd citasmanicure
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Acceder en el navegador a: `http://localhost:5173/`

### 3. Credenciales de Administrador por defecto
- **URL Admin:** `http://localhost:5173/admin/login`
- **Usuario:** `admin`
- **Contraseña:** `admin123`

---
Desarrollado con ❤️ para [CrearPaginaWeb.Co](https://crearpaginaweb.co).
