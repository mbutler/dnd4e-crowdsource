# Logging System

This document explains the simple logging system that tracks all database changes.

## Overview

The logging system automatically records all edit operations to a text file, providing:
- **Complete audit trail** - Track who changed what and when
- **Change details** - See exactly what fields were modified
- **User accountability** - Know which user made each change
- **Simple format** - JSON lines for easy parsing

## How It Works

### Automatic Logging
Every time a record is updated, the system logs:
- **Timestamp** - When the change was made
- **User** - Who made the change (from authentication)
- **Action** - Type of operation (UPDATE)
- **Table** - Which table was modified
- **Record ID** - Which specific record was changed
- **Changes** - Exactly what fields were modified

### Log File Format
The `edit_log.txt` file contains one JSON object per line:

```json
{"timestamp":"2024-01-15 14:30:25","user":"admin","action":"UPDATE","table":"Background","record_id":"123","changes":{"Name":"Updated Name","Description":"New description"}}
{"timestamp":"2024-01-15 14:35:10","user":"editor","action":"UPDATE","table":"Deity","record_id":"456","changes":{"Title":"Updated Title"}}
```

## Files

### `edit_log.txt`
- **Location**: Same directory as `api.php`
- **Format**: One JSON object per line
- **Permissions**: Should be writable by web server
- **Rotation**: Manual (you can archive/clear as needed)

### `view_logs.php`
- **Purpose**: Web interface to view logs
- **Features**: 
  - Beautiful, responsive design
  - Statistics dashboard
  - Chronological view (newest first)
  - Formatted display of changes

## Accessing Logs

### Web Interface
Visit: `https://your-domain.com/4e_crowdsource/view_logs.php`

Features:
- 📊 **Statistics** - Total edits, unique users, tables modified
- 📝 **Detailed view** - Each change with timestamp and user
- 🔍 **Change details** - Exactly what fields were modified
- 📱 **Responsive** - Works on mobile and desktop

### Direct File Access
You can also view the raw log file directly:
- **File**: `edit_log.txt`
- **Format**: JSON lines
- **Tools**: Any text editor or command line tools

## Log Analysis

### Command Line Examples
```bash
# Count total edits
wc -l edit_log.txt

# Find edits by specific user
grep '"user":"admin"' edit_log.txt

# Find edits to specific table
grep '"table":"Background"' edit_log.txt

# Find recent edits (last 24 hours)
grep "$(date +%Y-%m-%d)" edit_log.txt
```

### JSON Processing
```bash
# Convert to readable format
cat edit_log.txt | jq '.'

# Filter by user
cat edit_log.txt | jq 'select(.user == "admin")'

# Get unique users
cat edit_log.txt | jq -r '.user' | sort | uniq
```

## Log Management

### File Size
The log file will grow over time. Consider:
- **Regular backups** - Archive logs monthly
- **Size monitoring** - Check file size periodically
- **Rotation** - Move old logs to archive files

### Archiving Example
```bash
# Archive logs monthly
mv edit_log.txt edit_log_$(date +%Y-%m).txt

# Compress old logs
gzip edit_log_2024-01.txt
```

### Clearing Logs
```bash
# Clear all logs (be careful!)
> edit_log.txt

# Or backup and clear
cp edit_log.txt edit_log_backup_$(date +%Y%m%d).txt
> edit_log.txt
```

## Security Considerations

### File Permissions
```bash
# Secure the log file
chmod 644 edit_log.txt
chown www-data:www-data edit_log.txt
```

### Access Control
- **Log file** - Should be readable by web server only
- **View interface** - Consider adding authentication to `view_logs.php`
- **Backup location** - Store archives securely

### Privacy
- **User tracking** - Logs contain usernames
- **Data exposure** - Logs contain field values
- **Retention** - Consider how long to keep logs

## Troubleshooting

### "Permission denied" errors
```bash
# Fix file permissions
chmod 666 edit_log.txt
chown www-data:www-data edit_log.txt
```

### Log file not created
- Check that `api.php` has write permissions to the directory
- Verify the directory path is correct
- Check PHP error logs for issues

### Empty logs
- Ensure you're using the updated `api.php` with logging
- Verify that edits are actually being made
- Check that authentication is working properly

## Integration with Main App

### Adding Log Link
You can add a link to the logs in your main application:

```javascript
// Add to your React navbar or dashboard
<a href="/4e_crowdsource/view_logs.php" target="_blank">
  View Edit Logs
</a>
```

### API Integration
The logging is completely automatic - no changes needed to your main application. All edit operations are automatically logged.

## Future Enhancements

Potential improvements:
- **Log filtering** - By date, user, table
- **Export functionality** - CSV, Excel export
- **Email notifications** - Alert on specific changes
- **Database storage** - Move logs to database for better querying
- **Real-time updates** - WebSocket notifications for live monitoring
