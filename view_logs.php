<?php
// Simple log viewer for DND4E Crowdsource edits
header('Content-Type: text/html; charset=utf-8');

$log_file = __DIR__ . '/edit_log.txt';
$logs = [];

if (file_exists($log_file)) {
    $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $log_entry = json_decode($line, true);
        if ($log_entry) {
            $logs[] = $log_entry;
        }
    }
    // Reverse to show newest first
    $logs = array_reverse($logs);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DND4E Edit Logs</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .log-entry {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .log-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .timestamp {
            color: #666;
            font-size: 0.9em;
        }
        .user {
            background: #3498db;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
        }
        .table-info {
            background: #e8f4fd;
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        .changes {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 10px;
        }
        .change-item {
            margin-bottom: 5px;
        }
        .field-name {
            font-weight: bold;
            color: #495057;
        }
        .field-value {
            color: #6c757d;
            font-family: monospace;
            background: #f1f3f4;
            padding: 2px 4px;
            border-radius: 2px;
        }
        .no-logs {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 40px;
        }
        .stats {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .stat-item {
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 DND4E Edit Logs</h1>
        <p>Track all changes made to the database</p>
    </div>

    <?php if (!empty($logs)): ?>
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number"><?= count($logs) ?></div>
                <div class="stat-label">Total Edits</div>
            </div>
            <div class="stat-item">
                <div class="stat-number"><?= count(array_unique(array_column($logs, 'user'))) ?></div>
                <div class="stat-label">Unique Users</div>
            </div>
            <div class="stat-item">
                <div class="stat-number"><?= count(array_unique(array_column($logs, 'table'))) ?></div>
                <div class="stat-label">Tables Modified</div>
            </div>
            <div class="stat-item">
                <div class="stat-number"><?= count(array_unique(array_column($logs, 'record_id'))) ?></div>
                <div class="stat-label">Records Modified</div>
            </div>
        </div>

        <?php foreach ($logs as $log): ?>
            <div class="log-entry">
                <div class="log-header">
                    <div>
                        <span class="timestamp"><?= htmlspecialchars($log['timestamp']) ?></span>
                        <span class="user"><?= htmlspecialchars($log['user']) ?></span>
                    </div>
                    <div>
                        <strong><?= htmlspecialchars($log['action']) ?></strong>
                    </div>
                </div>
                
                <div class="table-info">
                    <strong>Table:</strong> <?= htmlspecialchars($log['table']) ?> | 
                    <strong>Record ID:</strong> <?= htmlspecialchars($log['record_id']) ?>
                </div>
                
                <div class="changes">
                    <strong>Changes:</strong>
                    <?php foreach ($log['changes'] as $field => $value): ?>
                        <div class="change-item">
                            <span class="field-name"><?= htmlspecialchars($field) ?>:</span>
                            <span class="field-value"><?= htmlspecialchars(is_string($value) ? $value : json_encode($value)) ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endforeach; ?>
    <?php else: ?>
        <div class="no-logs">
            <h3>No edits logged yet</h3>
            <p>Edit logs will appear here once you start making changes to the database.</p>
        </div>
    <?php endif; ?>
</body>
</html>
