# DND4E Crowdsource Tool

A simple web application for crowdsourcing corrections and improvements to D&D 4e compendium data.

## Overview

This tool provides a web interface for browsing and editing D&D 4e database records. It uses:
- **PHP** for the backend API
- **React** for the frontend interface
- **MySQL** for data storage

## Project Structure

```
dnd4e-crowdsource/
├── api.php                    # Main PHP API handler
├── config.php                 # Database configuration
├── .htaccess                  # URL routing rules
├── SIMPLE_PHP_DEPLOYMENT.md   # Deployment guide
├── README.md                  # This file
└── client/                    # React application
    ├── build/                 # Production build (deployed)
    ├── src/                   # React source code
    ├── public/                # Public assets
    ├── package.json           # React dependencies
    ├── tailwind.config.js     # Tailwind CSS config
    └── postcss.config.js      # PostCSS config
```

## Features

- Browse all database tables
- View and edit individual records
- Search and filter data
- JSON data validation
- Responsive design

## Development

### Prerequisites
- Node.js 15+
- PHP 7.4+ with MySQL extension
- MySQL database

### Setup
1. Clone the repository
2. Install React dependencies:
   ```bash
   cd client
   npm install
   ```
3. Configure database in `config.php`
4. Build the React app:
   ```bash
   npm run build
   ```

### Making Changes
1. Edit files in `client/src/`
2. Run `npm run build` to rebuild
3. Upload `client/build/` to your server

## Deployment

See `SIMPLE_PHP_DEPLOYMENT.md` for detailed deployment instructions.

### Quick Deploy
1. Upload `api.php`, `config.php`, `.htaccess` to your web server
2. Upload contents of `client/build/` to the same directory as the PHP files
3. Configure database settings in `config.php`
4. Done!

## API Endpoints

- `GET /api/tables` - List all tables
- `GET /api/tables/{table}/structure` - Get table structure
- `GET /api/tables/{table}/records` - Get records with pagination
- `GET /api/tables/{table}/records/{id}` - Get single record
- `PUT /api/tables/{table}/records/{id}` - Update record
- `GET /api/tables/{table}/stats` - Get table statistics
- `GET /api/health` - Health check

## License

MIT License
