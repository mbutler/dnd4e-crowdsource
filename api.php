<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Include database configuration
require_once 'config.php';

// Database configuration
$host = DB_HOST;
$user = DB_USER;
$password = DB_PASSWORD;
$database = DB_NAME;

// Connect to database
try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Get the request path
$path = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove query string
$path = parse_url($path, PHP_URL_PATH);

// Debug: Log the path
error_log("Request path: " . $path);

// Route the request
if (preg_match('/^\/4e_crowdsource\/api\/tables$/', $path) && $method === 'GET') {
    // Get all tables
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode($tables);
    
} elseif (preg_match('/^\/4e_crowdsource\/api\/tables\/([^\/]+)\/structure$/', $path, $matches) && $method === 'GET') {
    // Get table structure
    $tableName = $matches[1];
    $stmt = $pdo->prepare("DESCRIBE `$tableName`");
    $stmt->execute();
    $structure = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($structure);
    
} elseif (preg_match('/^\/4e_crowdsource\/api\/tables\/([^\/]+)\/records$/', $path, $matches) && $method === 'GET') {
    // Get records with pagination
    $tableName = $matches[1];
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 50;
    $search = $_GET['search'] ?? '';
    $sortBy = $_GET['sortBy'] ?? 'ID';
    $sortOrder = $_GET['sortOrder'] ?? 'ASC';
    
    $offset = ($page - 1) * $limit;
    
    // Build search condition
    $searchCondition = '';
    if (!empty($search)) {
        $searchCondition = "WHERE Name LIKE '%$search%' OR Txt LIKE '%$search%'";
    }
    
    // Get total count
    $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM `$tableName` $searchCondition");
    $countStmt->execute();
    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get records
    $sql = "SELECT * FROM `$tableName` $searchCondition ORDER BY `$sortBy` $sortOrder LIMIT $limit OFFSET $offset";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'records' => $records,
        'pagination' => [
            'current' => (int)$page,
            'total' => ceil($total / $limit),
            'totalRecords' => (int)$total,
            'limit' => (int)$limit
        ]
    ]);
    
} elseif (preg_match('/^\/4e_crowdsource\/api\/tables\/([^\/]+)\/records\/(\d+)$/', $path, $matches) && $method === 'GET') {
    // Get single record
    $tableName = $matches[1];
    $id = $matches[2];
    
    $stmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE ID = ?");
    $stmt->execute([$id]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($record) {
        echo json_encode($record);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Record not found']);
    }
    
} elseif (preg_match('/^\/4e_crowdsource\/api\/tables\/([^\/]+)\/records\/(\d+)$/', $path, $matches) && $method === 'PUT') {
    // Update record
    $tableName = $matches[1];
    $id = $matches[2];
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }
    
    // Build update query
    $fields = array_keys($input);
    $placeholders = implode(' = ?, ', $fields) . ' = ?';
    $values = array_values($input);
    $values[] = $id;
    
    $sql = "UPDATE `$tableName` SET $placeholders WHERE ID = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    if ($stmt->rowCount() > 0) {
        // Get updated record
        $stmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE ID = ?");
        $stmt->execute([$id]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'message' => 'Record updated successfully',
            'record' => $record
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Record not found']);
    }
    
} elseif (preg_match('/^\/4e_crowdsource\/api\/tables\/([^\/]+)\/stats$/', $path, $matches) && $method === 'GET') {
    // Get table stats
    $tableName = $matches[1];
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM `$tableName`");
    $stmt->execute();
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get sample names
    $nameSample = [];
    try {
        $stmt = $pdo->prepare("SELECT DISTINCT Name FROM `$tableName` WHERE Name IS NOT NULL LIMIT 10");
        $stmt->execute();
        $nameSample = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $e) {
        // Try ID column if Name doesn't exist
        try {
            $stmt = $pdo->prepare("SELECT DISTINCT ID FROM `$tableName` WHERE ID IS NOT NULL LIMIT 10");
            $stmt->execute();
            $nameSample = $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (Exception $e2) {
            $nameSample = [];
        }
    }
    
    echo json_encode([
        'totalRecords' => (int)$total,
        'nameSample' => $nameSample
    ]);
    
} elseif (preg_match('/^\/4e_crowdsource\/api\/health$/', $path) && $method === 'GET') {
    // Health check
    echo json_encode([
        'status' => 'OK',
        'timestamp' => date('c')
    ]);
    
} else {
    // Serve static files for React app
    $filePath = __DIR__ . '/client/build' . $path;
    
    if (file_exists($filePath) && is_file($filePath)) {
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);
        $contentTypes = [
            'html' => 'text/html',
            'css' => 'text/css',
            'js' => 'application/javascript',
            'json' => 'application/json',
            'ico' => 'image/x-icon',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml'
        ];
        
        if (isset($contentTypes[$extension])) {
            header('Content-Type: ' . $contentTypes[$extension]);
        }
        
        readfile($filePath);
    } else {
        // Serve index.html for React routing
        header('Content-Type: text/html');
        readfile(__DIR__ . '/client/build/index.html');
    }
}
?>
