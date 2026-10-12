<?php
// backend/index.php

require_once 'config.php';
require_once 'jwt.php';

$requestUri = isset($_GET['request']) ? $_GET['request'] : '';
$requestUri = trim($requestUri, '/');
$method = $_SERVER['REQUEST_METHOD'];

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);
if (!$input && !empty($_POST)) {
    $input = $_POST;
}

if ($requestUri === 'api/auth/login' && $method === 'POST') {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    $db = getDB();
    $stmt = $db->prepare('SELECT id, password FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $token = generateJWT(['id' => $user['id'], 'username' => $username]);
        jsonResponse(['token' => $token]);
    } else {
        jsonResponse(['error' => 'Credenciales inválidas'], 401);
    }
}
else if ($requestUri === 'api/appointments/available' && $method === 'GET') {
    $date = $_GET['date'] ?? date('Y-m-d');
    
    $db = getDB();

    // Revisar si el día está bloqueado
    $stmt = $db->query("SELECT setting_value FROM settings WHERE setting_key = 'blocked_dates'");
    $row = $stmt->fetch();
    $blocked = $row ? json_decode($row['setting_value'], true) : [];
    if (in_array($date, $blocked)) {
        jsonResponse(['date' => $date, 'available_times' => []]);
    }

    $allBlocks = [];
    for ($i = 9; $i <= 17; $i++) {
        $timeStr = sprintf("%02d:00:00", $i);
        $allBlocks[] = $timeStr;
    }

    $stmt = $db->prepare("SELECT appointment_time FROM appointments WHERE appointment_date = ? AND status != 'cancelada'");
    $stmt->execute([$date]);
    $taken = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $available = array_values(array_diff($allBlocks, $taken));
    jsonResponse(['date' => $date, 'available_times' => $available]);
}
else if ($requestUri === 'api/appointments' && $method === 'POST') {
    requireAuth();
    $name = $input['name'] ?? '';
    $phone = $input['phone'] ?? '';
    $date = $input['date'] ?? '';
    $time = $input['time'] ?? '';

    if (!$name || !$phone || !$date || !$time) {
        jsonResponse(['error' => 'Faltan datos obligatorios'], 400);
    }

    $db = getDB();
    
    $stmt = $db->prepare("SELECT id FROM clients WHERE phone = ?");
    $stmt->execute([$phone]);
    $client = $stmt->fetch();
    
    if (!$client) {
        $stmt = $db->prepare("INSERT INTO clients (name, phone) VALUES (?, ?)");
        $stmt->execute([$name, $phone]);
        $clientId = $db->lastInsertId();
    } else {
        $clientId = $client['id'];
    }

    $stmt = $db->prepare("INSERT INTO appointments (client_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, 'agendada')");
    $stmt->execute([$clientId, $date, $time]);
    
    jsonResponse(['success' => true, 'appointment_id' => $db->lastInsertId()]);
}
else if ($requestUri === 'api/appointments' && $method === 'GET') {
    requireAuth();
    $db = getDB();
    $stmt = $db->query("
        SELECT a.id, a.appointment_date, a.appointment_time, a.status, c.name, c.phone 
        FROM appointments a 
        JOIN clients c ON a.client_id = c.id 
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
    ");
    $appointments = $stmt->fetchAll();
    jsonResponse(['appointments' => $appointments]);
}
else if (preg_match('/^api\/appointments\/(\d+)$/', $requestUri, $matches) && $method === 'PUT') {
    requireAuth();
    $id = $matches[1];
    $status = $input['status'] ?? 'agendada';

    $db = getDB();
    $stmt = $db->prepare("UPDATE appointments SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);
    
    jsonResponse(['success' => true]);
}
else if ($requestUri === 'api/dashboard' && $method === 'GET') {
    requireAuth();
    $db = getDB();
    
    $stats = [
        'total_agendadas' => $db->query("SELECT COUNT(*) FROM appointments WHERE status = 'agendada'")->fetchColumn(),
        'total_canceladas' => $db->query("SELECT COUNT(*) FROM appointments WHERE status = 'cancelada'")->fetchColumn(),
        'total_ausentes' => $db->query("SELECT COUNT(*) FROM appointments WHERE status = 'ausente'")->fetchColumn(),
        'total_clientes' => $db->query("SELECT COUNT(*) FROM clients")->fetchColumn()
    ];
    
    jsonResponse($stats);
}
else if ($requestUri === 'api/settings/blocked-dates' && $method === 'GET') {
    $db = getDB();
    $stmt = $db->query("SELECT setting_value FROM settings WHERE setting_key = 'blocked_dates'");
    $row = $stmt->fetch();
    $blocked = $row ? json_decode($row['setting_value'], true) : [];
    jsonResponse(['blocked_dates' => $blocked]);
}
else if ($requestUri === 'api/settings/blocked-dates' && $method === 'POST') {
    requireAuth();
    $date = $input['date'] ?? '';
    if (!$date) jsonResponse(['error' => 'Falta fecha'], 400);

    $db = getDB();
    $stmt = $db->query("SELECT setting_value FROM settings WHERE setting_key = 'blocked_dates'");
    $row = $stmt->fetch();
    $blocked = $row ? json_decode($row['setting_value'], true) : [];

    if (in_array($date, $blocked)) {
        $blocked = array_filter($blocked, fn($d) => $d !== $date);
    } else {
        $blocked[] = $date;
    }
    $blocked = array_values($blocked);
    
    $json = json_encode($blocked);
    $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('blocked_dates', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->execute([$json, $json]);

    jsonResponse(['success' => true, 'blocked_dates' => $blocked]);
}
else if ($requestUri === 'api/cron/reminders' && $method === 'GET') {
    $secret = $_GET['secret'] ?? '';
    if ($secret !== 'gomitas_cron_secret_2026') {
        jsonResponse(['error' => 'No autorizado'], 401);
    }
    
    $db = getDB();
    $tomorrow = date('Y-m-d', strtotime('+1 day'));
    
    $stmt = $db->prepare("
        SELECT a.appointment_time, c.name, c.phone 
        FROM appointments a 
        JOIN clients c ON a.client_id = c.id 
        WHERE a.appointment_date = ? AND a.status = 'agendada'
    ");
    $stmt->execute([$tomorrow]);
    $reminders = $stmt->fetchAll();
    
    $messagesSent = 0;
    foreach ($reminders as $r) {
        $msg = "Hola {$r['name']}, te recordamos tu cita de manicure mañana a las " . substr($r['appointment_time'], 0, 5) . ". ¡Te esperamos!";
        $messagesSent++;
    }
    
    jsonResponse(['success' => true, 'sent' => $messagesSent, 'date' => $tomorrow]);
}
else {
    jsonResponse(['error' => 'Endpoint no encontrado'], 404);
}
?>
