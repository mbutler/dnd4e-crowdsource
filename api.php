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

// Route the request
if (preg_match('/^\/4e_crowdsource\/api\/tables$/', $path) && $method === 'GET') {
    // Get all tables
    $stmt = $pdo->query("SHOW TABLES");
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
    // Get records with pagination, search, and sort
    $tableName = $matches[1];
    
    // Get query parameters
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 50;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $sortBy = isset($_GET['sortBy']) ? $_GET['sortBy'] : 'ID';
    $sortOrder = isset($_GET['sortOrder']) ? strtoupper($_GET['sortOrder']) : 'ASC';
    
    // Validate sort order
    if (!in_array($sortOrder, ['ASC', 'DESC'])) {
        $sortOrder = 'ASC';
    }
    
    // Build WHERE clause for search
    $whereClause = '';
    $searchParams = [];
    
    if (!empty($search)) {
        // Get table structure to find searchable columns
        $stmt = $pdo->prepare("DESCRIBE `$tableName`");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $searchableColumns = [];
        foreach ($columns as $column) {
            if (in_array(strtolower($column), ['name', 'txt', 'title', 'description'])) {
                $searchableColumns[] = "`$column` LIKE ?";
                $searchParams[] = "%$search%";
            }
        }
        
        if (!empty($searchableColumns)) {
            $whereClause = 'WHERE ' . implode(' OR ', $searchableColumns);
        }
    }
    
    // Get total count
    $countSql = "SELECT COUNT(*) FROM `$tableName` $whereClause";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($searchParams);
    $totalRecords = $stmt->fetchColumn();
    
    // Calculate pagination
    $offset = ($page - 1) * $limit;
    $totalPages = ceil($totalRecords / $limit);
    
    // Get records
    $sql = "SELECT * FROM `$tableName` $whereClause ORDER BY `$sortBy` $sortOrder LIMIT $limit OFFSET $offset";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($searchParams);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'records' => $records,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'totalRecords' => $totalRecords,
            'totalPages' => $totalPages
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

    // Get table structure to identify non-updatable columns
    $stmt = $pdo->prepare("DESCRIBE `$tableName`");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Filter out non-updatable columns (primary keys, auto-increment, generated columns)
    $updatableColumns = [];
    foreach ($columns as $column) {
        $fieldName = $column['Field'];
        $isPrimaryKey = $column['Key'] === 'PRI';
        $isAutoIncrement = strpos($column['Extra'], 'auto_increment') !== false;
        $isGenerated = strpos($column['Extra'], 'GENERATED') !== false;
        
        if (!$isPrimaryKey && !$isAutoIncrement && !$isGenerated) {
            $updatableColumns[] = $fieldName;
        }
    }
    
    // Filter input to only include updatable columns
    $filteredInput = array_intersect_key($input, array_flip($updatableColumns));
    
    if (empty($filteredInput)) {
        http_response_code(400);
        echo json_encode(['error' => 'No updatable fields provided']);
        exit;
    }

    // Build update query
    $fields = array_keys($filteredInput);
    $placeholders = implode(' = ?, ', $fields) . ' = ?';
    $values = array_values($filteredInput);
    $values[] = $id;

    $sql = "UPDATE `$tableName` SET $placeholders WHERE ID = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    if ($stmt->rowCount() > 0) {
        // Get updated record
        $stmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE ID = ?");
        $stmt->execute([$id]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Log the change
        $log_entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'user' => $_SERVER['PHP_AUTH_USER'] ?? 'unknown',
            'action' => 'UPDATE',
            'table' => $tableName,
            'record_id' => $id,
            'changes' => $filteredInput
        ];
        
        $log_file = __DIR__ . '/edit_log.txt';
        $log_line = json_encode($log_entry) . "\n";
        
        // Ensure log file exists and is writable
        if (!file_exists($log_file)) {
            file_put_contents($log_file, '');
            chmod($log_file, 0666);
        }
        
        $log_result = file_put_contents($log_file, $log_line, FILE_APPEND | LOCK_EX);
        
        // Debug logging if it fails
        if ($log_result === false) {
            error_log("Failed to write to log file: $log_file");
            error_log("Directory writable: " . (is_writable(__DIR__) ? 'Yes' : 'No'));
            error_log("File writable: " . (is_writable($log_file) ? 'Yes' : 'No'));
            error_log("PHP error: " . (error_get_last()['message'] ?? 'Unknown error'));
        }
        
        echo json_encode([
            'message' => 'Record updated successfully',
            'record' => $record
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Record not found']);
    }
    
} elseif (preg_match('/^\/4e_crowdsource\/api\/tables\/([^\/]+)\/stats$/', $path, $matches) && $method === 'GET') {
    // Get table statistics
    $tableName = $matches[1];
    
    // Get total count
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `$tableName`");
    $stmt->execute();
    $totalRecords = $stmt->fetchColumn();
    
    // Get sample data (first few records)
    $stmt = $pdo->prepare("SELECT * FROM `$tableName` LIMIT 3");
    $stmt->execute();
    $sampleData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'totalRecords' => $totalRecords,
        'sampleData' => $sampleData
    ]);
    
} elseif (preg_match('/^\/4e_crowdsource\/api\/health$/', $path) && $method === 'GET') {
    // Health check
    echo json_encode([
        'status' => 'OK',
        'timestamp' => date('c')
    ]);
    
} else {
    // Serve static files for React app
    // Check if this is a static asset (has a file extension)
    $extension = pathinfo($path, PATHINFO_EXTENSION);
    $staticExtensions = ['css', 'js', 'json', 'ico', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'woff', 'woff2', 'ttf', 'eot'];
    
    if ($extension && in_array($extension, $staticExtensions)) {
        // Try to serve the static file from the root directory
        $staticPath = __DIR__ . $path;
        if (file_exists($staticPath) && is_file($staticPath)) {
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
                'svg' => 'image/svg+xml',
                'woff' => 'font/woff',
                'woff2' => 'font/woff2',
                'ttf' => 'font/ttf',
                'eot' => 'application/vnd.ms-fontobject'
            ];
            
            if (isset($contentTypes[$extension])) {
                header('Content-Type: ' . $contentTypes[$extension]);
            }
            
            readfile($staticPath);
            exit;
        }
    }
    
    // For all other routes, serve index.html (React will handle routing)
    $indexPath = __DIR__ . '/index.html';
    
    if (file_exists($indexPath)) {
        header('Content-Type: text/html');
        readfile($indexPath);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'React app not found. Please build the application first.']);
    }
}
?>
