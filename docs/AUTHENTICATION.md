# Authentication Setup

This document explains how to set up and manage authentication for the DND4E Crowdsource tool.

## Overview

The application supports **two authentication modes**:

### Mode 1: Full Protection (Default)
- **All routes protected** - Users must login to view or edit data
- **Use**: `.htaccess` file (current setup)

### Mode 2: Edit-Only Protection (Recommended)
- **View data freely** - Anyone can browse and view data
- **Edit requires login** - Only authenticated users can edit records
- **Use**: `.htaccess_edit_only` file + updated `api.php`

## Quick Setup

### Option A: Edit-Only Protection (Recommended)

1. **Create Users Locally**
```bash
./setup_auth.sh init admin
./setup_auth.sh add user1
./setup_auth.sh add user2
```

2. **Upload Files**
Upload these files via FileZilla:
- `.htpasswd` (user credentials)
- `.htaccess_edit_only` → rename to `.htaccess`
- `api.php` (updated with edit protection)

3. **Test**
- Visit your site → should load without login
- Try to edit a record → should prompt for login

### Option B: Full Protection

1. **Create Users Locally**
```bash
./setup_auth.sh init admin
./setup_auth.sh add user1
```

2. **Upload Files**
Upload these files via FileZilla:
- `.htpasswd` (user credentials)
- `.htaccess` (full protection)

3. **Test**
- Visit your site → should prompt for login immediately

## How Edit-Only Protection Works

### User Experience:
1. **Browse freely** - Users can view all data without login
2. **Edit prompts login** - When clicking "Edit" or "Save", browser shows login dialog
3. **Session persists** - Once logged in, user can edit multiple records

### Technical Implementation:
- **GET requests** (viewing data) → No authentication required
- **PUT requests** (editing data) → Authentication required
- **Static files** → No authentication required
- **React app** → No authentication required

### Security Benefits:
- ✅ **Public data access** - Anyone can view your D&D data
- ✅ **Protected editing** - Only authorized users can modify data
- ✅ **Simple setup** - No complex user management
- ✅ **Standard auth** - Uses browser's built-in authentication

## User Management

### List All Users
```bash
./setup_auth.sh list
```

### Remove a User
```bash
./setup_auth.sh remove username
```

### Change a User's Password
```bash
# This will prompt for a new password
htpasswd .htpasswd username
```

## File Structure

### Edit-Only Protection:
```
4e_crowdsource/
├── .htpasswd              # User credentials
├── .htaccess              # No auth (renamed from .htaccess_edit_only)
├── api.php                # PHP with edit-only auth checks
└── ...                    # Other files
```

### Full Protection:
```
4e_crowdsource/
├── .htpasswd              # User credentials
├── .htaccess              # Full auth protection
├── api.php                # Standard PHP (no auth checks)
└── ...                    # Other files
```

## Switching Between Modes

### To Switch to Edit-Only:
1. Upload `.htaccess_edit_only` as `.htaccess`
2. Upload updated `api.php`
3. Test that viewing works without login
4. Test that editing prompts for login

### To Switch to Full Protection:
1. Upload original `.htaccess` (with full auth)
2. Upload original `api.php` (without auth checks)
3. Test that all pages require login

## Security Notes

### Edit-Only Mode:
- **Use HTTPS** - Basic auth sends passwords in base64
- **Strong passwords** - Use complex passwords for editors
- **Limited editors** - Only give edit access to trusted users
- **Public viewing** - Anyone can view your data

### Full Protection Mode:
- **Use HTTPS** - Basic auth sends passwords in base64
- **Strong passwords** - Use complex passwords for all users
- **Controlled access** - Only give credentials to necessary users

## Troubleshooting

### "htpasswd: command not found"
Install Apache utilities:
```bash
# Ubuntu/Debian
sudo apt-get install apache2-utils

# CentOS/RHEL
sudo yum install httpd-tools

# macOS
brew install httpd
```

### "Authentication failed"
- Check that `.htpasswd` file exists on server
- Verify file permissions (should be readable by web server)
- Ensure `.htaccess` file is uploaded

### "Can view but can't edit"
- Verify you're using the updated `api.php` with edit protection
- Check that `.htpasswd` file exists and has valid users
- Ensure you're logged in when trying to edit

### "Server path not found"
Update the `SERVER_PATH` variable in `setup_auth.sh` to match your server path.

**Note**: If using manual upload via FileZilla, you can ignore this error.

## File Permissions

Ensure proper permissions on the server:
```bash
chmod 644 .htpasswd
chmod 644 .htaccess
chown www-data:www-data .htpasswd .htaccess
```

## Security Best Practices

1. **Use HTTPS** - Always access via HTTPS to encrypt credentials
2. **Strong passwords** - Use complex passwords with special characters
3. **Regular rotation** - Change passwords every 3-6 months
4. **Limited access** - Only share credentials with necessary users
5. **Monitor access** - Check server logs for authentication attempts
