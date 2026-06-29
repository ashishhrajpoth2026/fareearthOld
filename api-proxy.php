<?php
/**
 * Fareearth API Proxy
 * 
 * Proxies requests from the frontend to Google Apps Script backend.
 * Since this file runs on the same domain (fareearth.in), no CORS is needed.
 * 
 * Usage: All frontend API calls should point to this file instead of the GAS URL.
 * Update CONFIG.API_URL in js/config.js to: "api-proxy.php"
 * 
 * @author Fareearth Dev Team
 * @version 1.0.0
 */

// =============================================================================
// Configuration
// =============================================================================

/** Google Apps Script Web App URL */
define('GAS_URL', 'https://script.google.com/macros/s/AKfycbwOSmHvFdSa6DQQb31uuowEG-f6ERA1fUgSReb9oE3TYIBfx9k_EVD3zhP6KEUsAmA/exec');

/** Request timeout in seconds */
define('TIMEOUT_SEC', 30);

// =============================================================================
// Handle the request
// =============================================================================

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get the raw POST body
$requestBody = file_get_contents('php://input');

if (empty($requestBody)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Empty request body']);
    exit;
}

// =============================================================================
// Forward to Google Apps Script
// =============================================================================

$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => GAS_URL,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $requestBody,
    CURLOPT_HTTPHEADER => [
        'Content-Type: text/plain',
        'Content-Length: ' . strlen($requestBody),
    ],
    CURLOPT_TIMEOUT => TIMEOUT_SEC,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_FOLLOWLOCATION => true,  // Follow GAS 302 redirects
    CURLOPT_MAXREDIRS => 3,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
$curlErrno = curl_errno($ch);

curl_close($ch);

// =============================================================================
// Return the response
// =============================================================================

header('Content-Type: application/json; charset=UTF-8');

if ($curlErrno) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'message' => 'Backend proxy error: ' . $curlError,
    ]);
    exit;
}

http_response_code($httpCode);
echo $response;