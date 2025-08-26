# D&D 4e Compendium Data Crowdsourcing Tool

A modern web application for browsing, reviewing, and correcting data in the D&D 4e compendium database. Built with Node.js, Express, React, and MySQL.

## Features

- **Dashboard Overview**: View all database tables with statistics and sample data
- **Table Browser**: Browse records with search, sorting, and pagination
- **Record Editor**: Edit individual records with field-specific input types
- **Real-time Updates**: Changes are immediately reflected in the database
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Data Validation**: Proper handling of different data types (text, numbers, booleans, JSON)

## Database Structure

The tool connects to the `4e_compendium` database which contains 21 tables:

- **Power**: Character powers and abilities
- **Monster**: Monster statistics and descriptions
- **Item**: Equipment and magical items
- **Class**: Character classes
- **Race**: Character races
- **Feat**: Character feats
- **Ritual**: Magical rituals
- **Skill**: Character skills
- **Background**: Character backgrounds
- **Theme**: Character themes
- **ParagonPath**: Paragon paths
- **EpicDestiny**: Epic destinies
- **Deity**: Deities and divine beings
- **Companion**: Animal companions
- **Associate**: NPCs and allies
- **Disease**: Diseases and afflictions
- **Poison**: Poisons and toxins
- **Trap**: Traps and hazards
- **Terrain**: Terrain types
- **Glossary**: Game terms and definitions
- **GetFilterSelect**: Filter options

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- D&D 4e compendium database (`4e_compendium`)

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd dnd4e-crowdource
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure database connection**:
   - Copy `config.env` and update with your MySQL credentials:
   ```bash
   cp config.env.example config.env
   ```
   - Edit `config.env`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   DB_NAME=4e_compendium
   PORT=5000
   NODE_ENV=development
   ```

## Usage

### Development Mode

1. **Start the backend server**:
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000`

2. **Start the frontend development server**:
   ```bash
   npm run client
   ```
   The React app will start on `http://localhost:3000`

### Production Mode

1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## API Endpoints

### Tables
- `GET /api/tables` - Get all table names
- `GET /api/tables/:tableName/structure` - Get table structure
- `GET /api/tables/:tableName/stats` - Get table statistics

### Records
- `GET /api/tables/:tableName/records` - Get records with pagination, search, and sorting
- `GET /api/tables/:tableName/records/:id` - Get a specific record
- `PUT /api/tables/:tableName/records/:id` - Update a record

### Health
- `GET /api/health` - Health check endpoint

## Usage Guide

### 1. Dashboard
- View all available tables with record counts
- See sample entries from each table
- Click on any table to browse its records

### 2. Table View
- Browse records with pagination (50 records per page)
- Search by name or text content
- Sort by any column (click column headers)
- Click "Edit" on any record to modify it

### 3. Record Editing
- View all fields for a specific record
- Click "Edit Record" to enable editing mode
- Modify fields as needed:
  - Text fields: Regular text inputs
  - Long text: Multi-line textareas
  - Numbers: Number inputs
  - Booleans: Yes/No dropdowns
  - JSON: Expandable JSON editor
- Click "Save Changes" to update the database
- Navigate between records with Previous/Next buttons

## Data Types Handled

- **Primary Keys**: Read-only, cannot be modified
- **Text/Longtext**: Multi-line text areas for large content
- **Integers**: Number inputs with validation
- **Booleans**: Yes/No dropdowns
- **JSON**: Expandable JSON editor with syntax highlighting
- **Varchar**: Standard text inputs

## Security Features

- Rate limiting (100 requests per 15 minutes per IP)
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- SQL injection prevention through parameterized queries

## Development

### Project Structure
```
dnd4e-crowdource/
├── server.js              # Express server
├── package.json           # Backend dependencies
├── config.env             # Environment variables
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # Main app component
│   └── package.json       # Frontend dependencies
└── README.md
```

### Adding New Features

1. **New API endpoints**: Add to `server.js`
2. **New components**: Create in `client/src/components/`
3. **New pages**: Create in `client/src/pages/` and add to routing
4. **Styling**: Use Tailwind CSS classes or add custom CSS

## Troubleshooting

### Common Issues

1. **Database connection failed**:
   - Check MySQL is running
   - Verify credentials in `config.env`
   - Ensure `4e_compendium` database exists

2. **Frontend not loading**:
   - Check if backend is running on port 5000
   - Verify proxy setting in `client/package.json`

3. **CORS errors**:
   - Ensure backend CORS is properly configured
   - Check if frontend is making requests to correct URL

### Logs

- Backend logs appear in the terminal where you run `npm run dev`
- Frontend errors appear in browser console
- Database errors are logged to backend console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue on GitHub

---

**Note**: This tool is designed for data correction and should be used carefully. Always backup your database before making bulk changes.
