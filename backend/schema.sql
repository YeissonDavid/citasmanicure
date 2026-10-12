-- ============================================================================
-- BASE DE DATOS: SISTEMA DE CITAS MANICURE
-- ============================================================================
-- Instrucciones para Hostinger:
-- 1. Ve a tu hPanel -> Bases de datos MySQL y crea una nueva base de datos.
-- 2. Entra a phpMyAdmin para esa base de datos.
-- 3. Ve a la pestaña 'Importar' (o 'SQL') y ejecuta este archivo completo.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABLA DE USUARIOS ADMINISTRADORES
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NULL,
    phone VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABLA DE CITAS
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Transferencia',
    status ENUM('agendada', 'confirmada', 'asistida', 'cancelada', 'ausente') DEFAULT 'agendada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (appointment_date),
    INDEX idx_status (status),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABLA DE CONFIGURACIÓN Y BLOQUEO DE FECHAS
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. USUARIO ADMINISTRADOR POR DEFECTO
-- Credenciales: Usuario: admin | Contraseña: admin123
-- Hash generado con BCRYPT estándar de PHP
INSERT INTO users (username, password) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE username=username;

-- 6. CONFIGURACIÓN INICIAL (Fechas bloqueadas vacías)
INSERT INTO settings (setting_key, setting_value) 
VALUES ('blocked_dates', '[]')
ON DUPLICATE KEY UPDATE setting_key=setting_key;

SET FOREIGN_KEY_CHECKS = 1;
