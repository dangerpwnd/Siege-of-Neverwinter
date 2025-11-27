# Siege of Neverwinter - Campaign Manager

A web-based D&D 5th edition campaign management tool for running the Siege of Neverwinter scenario.

## Features

- Initiative Tracker with automatic sorting
- Character and NPC management panels
- Monster database with instance tracking
- Siege mechanics tracking
- AI-powered DM Assistant (ChatGPT integration)
- Interactive city map with plot points
- Condition management system
- Persistent data storage with PostgreSQL

## Documentation

- **[DM Guide](DM_GUIDE.md)** - Complete guide for Dungeon Masters using the application
- **[Quick Start](QUICKSTART.md)** - Get up and running quickly
- **[Database Guide](DATABASE_GUIDE.md)** - Database setup, migrations, and troubleshooting
- **[API Documentation](API_DOCUMENTATION.md)** - Complete REST API reference
- **[API Key Setup](API_KEY_SETUP.md)** - How to configure OpenAI API for AI Assistant

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd SiegeOfNeverwinter
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:
```bash
# Create database
createdb siege_of_neverwinter

# Initialize schema
npm run db:setup
```

4. Configure environment variables:
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials and API keys
```

5. Load sample data (optional but recommended):
```bash
npm run db:seed
```

This populates the database with:
- 5 sample PCs (party of adventurers)
- 6 Tiamat forces monster types
- Initial siege state and notes
- 6 locations in Neverwinter
- 5 plot points

6. Start the server:
```bash
npm start
```

7. Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
SiegeOfNeverwinter/
├── client/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── styles/            # CSS files
│   │   └── main.css       # Main stylesheet
│   └── js/                # JavaScript modules
│       ├── main.js        # Application entry point
│       ├── api.js         # REST API client
│       └── state.js       # State management
├── server/                # Backend files
│   ├── index.js          # Express server
│   └── routes/           # API route handlers
├── database/             # Database files
│   ├── schema.sql        # Database schema
│   └── db.js            # Database connection
├── package.json          # Node.js dependencies
└── README.md            # This file
```

## Development

The application uses a modular architecture:

- **Frontend**: Vanilla JavaScript with ES6 modules
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with connection pooling
- **API**: RESTful API design

### Running in Development Mode

```bash
npm run dev
```

## API Endpoints

All API endpoints are prefixed with `/api`:

- `/api/health` - Health check
- `/api/campaigns` - Campaign management
- `/api/combatants` - Combatant CRUD operations
- `/api/characters` - PC management
- `/api/npcs` - NPC management
- `/api/monsters` - Monster database
- `/api/initiative` - Initiative tracker
- `/api/siege` - Siege mechanics
- `/api/locations` - City map locations
- `/api/plotpoints` - Plot point management
- `/api/preferences` - User preferences

## Configuration

Edit `.env` file to configure:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `OPENAI_API_KEY` - OpenAI API key for AI assistant (see [API Key Setup](API_KEY_SETUP.md))

## Available Scripts

```bash
npm start              # Start the server
npm run dev            # Start in development mode
npm run db:setup       # Initialize database schema
npm run db:seed        # Load sample data
npm run db:test        # Test database connection
npm run db:migrate     # Run database migrations
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
```

## Sample Data

After running `npm run db:seed`, you'll have:

**Party of 5 PCs**:
- Theron Brightblade (Paladin 10)
- Lyra Shadowstep (Rogue 10)
- Grimnar Ironforge (Fighter 10)
- Elara Moonwhisper (Wizard 10)
- Brother Aldric (Cleric 10)

**Tiamat Forces** (6 monster types):
- Cult Fanatic (CR 2)
- Red Dragon Wyrmling (CR 4)
- Dragonborn Champion (CR 5)
- Kobold Inventor (CR 1/4)
- Abishai (Red) (CR 9)
- Dragonclaw (CR 1)

**Siege State**: Day 5, Wall 90%, Morale 85%, Supplies 75%

**Locations**: 6 key areas in Neverwinter with various statuses

**Plot Points**: 5 active quests and objectives

## Getting Help

- **Usage Questions**: See [DM Guide](DM_GUIDE.md)
- **Database Issues**: See [Database Guide](DATABASE_GUIDE.md)
- **API Questions**: See [API Documentation](API_DOCUMENTATION.md)
- **Setup Issues**: See [Quick Start](QUICKSTART.md)

## License

MIT

## Contributing

This is a campaign-specific tool. Feel free to fork and adapt for your own campaigns!
