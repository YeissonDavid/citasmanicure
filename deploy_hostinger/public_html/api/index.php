<?php
/**
 * ============================================================================
 * ENRUTADOR PRINCIPAL API REST - CITAS MANICURE
 * ============================================================================
 * Maneja todas las peticiones hacia la API con validación de rutas, autenticación JWT
 * y sanitización de entradas.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/jwt.php';

// Obtener ruta solicitada
$requestUri = isset($_GET['request']) ? $_GET['request'] : '';
$requestUri = trim($requestUri, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Capturar cuerpo JSON o POST
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);
if (!$input && !empty($_POST)) {
    $input = $_POST;
}
if (!$input) {
    $input = [];
}

// ============================================================================
// 1. AUTENTICACIÓN: LOGIN ADMIN (POST /api/auth/login)
// ============================================================================
if ($requestUri === 'api/auth/login' && $method === 'POST') {
    $username = sanitizeInput($input['username'] ?? '');
    $password = $input['password'] ?? '';

    if (!$username || !$password) {
        jsonResponse(['error' => 'Usuario y contraseña requeridos'], 400);
    }

    $db = getDB();
    $stmt = $db->prepare('SELECT id, username, password FROM users WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $token = generateJWT(['id' => $user['id'], 'username' => $user['username']]);
        jsonResponse(['token' => $token, 'username' => $user['username']]);
    } else {
        jsonResponse(['error' => 'Credenciales inválidas'], 401);
    }
}

// ============================================================================
// 2. DISPONIBILIDAD HORARIA PÚBLICA (GET /api/appointments/available)
// ============================================================================
else if ($requestUri === 'api/appointments/available' && $method === 'GET') {
    $date = sanitizeInput($_GET['date'] ?? date('Y-m-d'));
    
    $db = getDB();

    // Validar si el día entero está bloqueado
    $stmt = $db->query("SELECT setting_value FROM settings WHERE setting_key = 'blocked_dates' LIMIT 1");
    $row = $stmt->fetch();
    $blocked = $row ? json_decode($row['setting_value'], true) : [];
    
    if (is_array($blocked) && in_array($date, $blocked)) {
        jsonResponse(['date' => $date, 'available_times' => []]);
    }

    // Horarios de 09:00 a 19:00 (11 bloques de 1 hora)
    $allBlocks = [];
    for ($i = 9; $i <= 19; $i++) {
        $allBlocks[] = sprintf("%02d:00:00", $i);
    }

    // Horarios ocupados por citas agendadas o confirmadas
    $stmt = $db->prepare("SELECT appointment_time FROM appointments WHERE appointment_date = ? AND status IN ('agendada', 'confirmada')");
    $stmt->execute([$date]);
    $taken = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $available = array_values(array_diff($allBlocks, $taken));
    jsonResponse(['date' => $date, 'available_times' => $available]);
}

// ============================================================================
// 3. CREAR CITA (POST /api/appointments) - ACCESO PÚBLICO O ADMIN
// ============================================================================
else if ($requestUri === 'api/appointments' && $method === 'POST') {
    $name = sanitizeInput($input['name'] ?? '');
    $lastname = sanitizeInput($input['lastname'] ?? '');
    $phone = sanitizeInput($input['phone'] ?? '');
    $paymentMethod = sanitizeInput($input['payment_method'] ?? 'Transferencia');
    $date = sanitizeInput($input['date'] ?? '');
    $time = sanitizeInput($input['time'] ?? '');

    // Formatear hora si viene como 'HH:mm'
    if (strlen($time) === 5) {
        $time .= ':00';
    }

    if (!$name || !$phone || !$date || !$time) {
        jsonResponse(['error' => 'Faltan datos obligatorios (nombre, teléfono, fecha u hora)'], 400);
    }

    $db = getDB();

    // 1. Buscar o registrar cliente
    $stmt = $db->prepare("SELECT id FROM clients WHERE phone = ? LIMIT 1");
    $stmt->execute([$phone]);
    $client = $stmt->fetch();

    if (!$client) {
        $stmt = $db->prepare("INSERT INTO clients (name, lastname, phone) VALUES (?, ?, ?)");
        $stmt->execute([$name, $lastname, $phone]);
        $clientId = $db->lastInsertId();
    } else {
        $clientId = $client['id'];
        // Actualizar nombres si cambiaron
        $stmt = $db->prepare("UPDATE clients SET name = ?, lastname = ? WHERE id = ?");
        $stmt->execute([$name, $lastname, $clientId]);
    }

    // 2. Registrar la cita con estado 'agendada'
    $stmt = $db->prepare("INSERT INTO appointments (client_id, appointment_date, appointment_time, payment_method, status) VALUES (?, ?, ?, ?, 'agendada')");
    $stmt->execute([$clientId, $date, $time, $paymentMethod]);
    $appointmentId = $db->lastInsertId();

    jsonResponse(['success' => true, 'appointment_id' => $appointmentId]);
}

// ============================================================================
// 4. LISTAR TODAS LAS CITAS (GET /api/appointments) - REQUIERE AUTH
// ============================================================================
else if ($requestUri === 'api/appointments' && $method === 'GET') {
    requireAuth();
    $db = getDB();
    $stmt = $db->query("
        SELECT 
            a.id, 
            a.appointment_date, 
            a.appointment_time, 
            a.payment_method, 
            a.status, 
            CONCAT(c.name, ' ', COALESCE(c.lastname, '')) AS name, 
            c.phone 
        FROM appointments a 
        JOIN clients c ON a.client_id = c.id 
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
    ");
    $appointments = $stmt->fetchAll();
    jsonResponse(['appointments' => $appointments]);
}

// ============================================================================
// 5. CAMBIAR ESTADO DE CITA (PUT /api/appointments/{id}) - REQUIERE AUTH
// ============================================================================
else if (preg_match('/^api\/appointments\/(\d+)$/', $requestUri, $matches) && $method === 'PUT') {
    requireAuth();
    $id = (int)$matches[1];
    $status = sanitizeInput($input['status'] ?? 'agendada');
    
    $allowedStatuses = ['agendada', 'confirmada', 'asistida', 'cancelada', 'ausente'];
    if (!in_array($status, $allowedStatuses)) {
        jsonResponse(['error' => 'Estado no válido'], 400);
    }

    $db = getDB();
    $stmt = $db->prepare("UPDATE appointments SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);
    
    jsonResponse(['success' => true]);
}

// ============================================================================
// 6. REAGENDAR FECHA/HORA (PUT /api/appointments/{id}/datetime) - REQUIERE AUTH
// ============================================================================
else if (preg_match('/^api\/appointments\/(\d+)\/datetime$/', $requestUri, $matches) && $method === 'PUT') {
    requireAuth();
    $id = (int)$matches[1];
    $date = sanitizeInput($input['date'] ?? '');
    $time = sanitizeInput($input['time'] ?? '');

    if (strlen($time) === 5) {
        $time .= ':00';
    }

    if (!$date || !$time) {
        jsonResponse(['error' => 'Fecha y hora requeridas'], 400);
    }

    $db = getDB();
    $stmt = $db->prepare("UPDATE appointments SET appointment_date = ?, appointment_time = ? WHERE id = ?");
    $stmt->execute([$date, $time, $id]);

    jsonResponse(['success' => true]);
}

// ============================================================================
// 7. ELIMINAR CITA PERMANENTEMENTE (DELETE /api/appointments/{id}) - REQUIERE AUTH
// ============================================================================
else if (preg_match('/^api\/appointments\/(\d+)$/', $requestUri, $matches) && $method === 'DELETE') {
    requireAuth();
    $id = (int)$matches[1];

    $db = getDB();
    $stmt = $db->prepare("DELETE FROM appointments WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(['success' => true]);
}

// ============================================================================
// 8. MÉTRICAS GENERALES DEL DASHBOARD (GET /api/dashboard) - REQUIERE AUTH
// ============================================================================
else if ($requestUri === 'api/dashboard' && $method === 'GET') {
    requireAuth();
    $db = getDB();
    
    $stats = [
        'total_agendadas'      => (int)$db->query("SELECT COUNT(*) FROM appointments WHERE status = 'agendada'")->fetchColumn(),
        'total_confirmadas'    => (int)$db->query("SELECT COUNT(*) FROM appointments WHERE status = 'confirmada'")->fetchColumn(),
        'total_asistidas'      => (int)$db->query("SELECT COUNT(*) FROM appointments WHERE status = 'asistida'")->fetchColumn(),
        'total_canceladas'     => (int)$db->query("SELECT COUNT(*) FROM appointments WHERE status = 'cancelada'")->fetchColumn(),
        'total_ausentes'       => (int)$db->query("SELECT COUNT(*) FROM appointments WHERE status = 'ausente'")->fetchColumn(),
        'total_clientes'       => (int)$db->query("SELECT COUNT(*) FROM clients")->fetchColumn(),
        'pagos_nequi'          => (int)$db->query("SELECT COUNT(*) FROM appointments WHERE LOWER(payment_method) = 'nequi'")->fetchColumn(),
        'pagos_transferencia'  => (int)$db->query("SELECT COUNT(*) FROM appointments WHERE LOWER(payment_method) = 'transferencia'")->fetchColumn(),
        'pagos_efectivo'       => (int)$db->query("SELECT COUNT(*) FROM appointments WHERE LOWER(payment_method) = 'efectivo'")->fetchColumn(),
    ];
    
    jsonResponse($stats);
}

// ============================================================================
// 9. FECHAS BLOQUEADAS (GET/POST /api/settings/blocked-dates)
// ============================================================================
else if ($requestUri === 'api/settings/blocked-dates' && $method === 'GET') {
    $db = getDB();
    $stmt = $db->query("SELECT setting_value FROM settings WHERE setting_key = 'blocked_dates' LIMIT 1");
    $row = $stmt->fetch();
    $blocked = $row ? json_decode($row['setting_value'], true) : [];
    jsonResponse(['blocked_dates' => is_array($blocked) ? $blocked : []]);
}
else if ($requestUri === 'api/settings/blocked-dates' && $method === 'POST') {
    requireAuth();
    $date = sanitizeInput($input['date'] ?? '');
    if (!$date) jsonResponse(['error' => 'Falta fecha'], 400);

    $db = getDB();
    $stmt = $db->query("SELECT setting_value FROM settings WHERE setting_key = 'blocked_dates' LIMIT 1");
    $row = $stmt->fetch();
    $blocked = $row ? json_decode($row['setting_value'], true) : [];
    if (!is_array($blocked)) $blocked = [];

    if (in_array($date, $blocked)) {
        $blocked = array_values(array_filter($blocked, fn($d) => $d !== $date));
    } else {
        $blocked[] = $date;
    }
    
    $json = json_encode($blocked);
    $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('blocked_dates', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->execute([$json, $json]);

    jsonResponse(['success' => true, 'blocked_dates' => $blocked]);
}

// ============================================================================
// 10. RUTA NO ENCONTRADA (404)
// ============================================================================
else {
    jsonResponse(['error' => 'Endpoint no encontrado: ' . $requestUri], 404);
}
?>
