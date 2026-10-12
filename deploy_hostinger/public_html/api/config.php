<?php
/**
 * ============================================================================
 * CONFIGURACIÓN DE BASE DE DATOS Y PROTOCOLOS DE SEGURIDAD (HOSTINGER / LOCAL)
 * ============================================================================
 */

// Evitar que se muestren errores PHP al usuario final en producción (Seguridad)
ini_set('display_errors', '0');
error_reporting(E_ALL);

// ==========================================
// 1. CREDENCIALES DE BASE DE DATOS (HOSTINGER)
// ==========================================
// Modifica estos valores con los datos creados en tu hPanel de Hostinger:
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'citas_manicure');

// ==========================================
// 2. HEADERS DE SEGURIDAD HTTP Y CORS
// ==========================================
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Permitir peticiones (CORS)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Responder a preflight OPTIONS inmediatamente
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Establece y retorna la conexión PDO a MySQL de manera segura.
 * @return PDO
 */
function getDB() {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false, // Desactivar emulación para máxima protección SQL Injection
    ];

    try {
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (\PDOException $e) {
        error_log('Database Connection Error: ' . $e->getMessage());
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => 'Error de conexión a la base de datos. Verifica tus credenciales en config.php.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

/**
 * Retorna una respuesta JSON estandarizada con código HTTP.
 * @param mixed $data
 * @param int $statusCode
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Sanitiza entradas de texto para evitar ataques XSS.
 * @param string|null $data
 * @return string
 */
function sanitizeInput($data) {
    if ($data === null) return '';
    return htmlspecialchars(trim((string)$data), ENT_QUOTES, 'UTF-8');
}
