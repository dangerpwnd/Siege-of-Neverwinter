# Documentation Index

Welcome to the Siege of Neverwinter documentation! This index will help you find the information you need.

## Getting Started

### New Users
1. **[Quick Start Guide](QUICKSTART.md)** - Get the application running in minutes
2. **[Database Guide](DATABASE_GUIDE.md)** - Set up PostgreSQL and initialize the database
3. **[DM Guide](DM_GUIDE.md)** - Learn how to use all features as a Dungeon Master

### Setup Guides
- **[Database Setup](DATABASE_GUIDE.md#initial-setup)** - Complete database installation and configuration
- **[API Key Setup](API_KEY_SETUP.md)** - Configure OpenAI API for the AI Assistant
- **[Environment Configuration](DATABASE_GUIDE.md#step-3-configure-environment-variables)** - Set up your .env file

## User Documentation

### For Dungeon Masters
- **[DM Guide](DM_GUIDE.md)** - Complete guide covering all features
  - Initiative Tracker usage
  - Character and NPC management
  - Monster database
  - Siege mechanics tracking
  - AI Assistant integration
  - City map navigation
  - Module management
  - Tips and best practices

### Feature-Specific Guides

#### Initiative Tracker
- [Adding Combatants](DM_GUIDE.md#adding-combatants)
- [Managing Combat](DM_GUIDE.md#managing-combat)
- [Visual Indicators](DM_GUIDE.md#visual-indicators)

#### Character Management
- [Viewing Character Details](DM_GUIDE.md#viewing-character-details)
- [Updating Hit Points](DM_GUIDE.md#updating-hit-points)
- [Managing Conditions](DM_GUIDE.md#managing-conditions)
- [Creating New Characters](DM_GUIDE.md#creating-new-characters)

#### Monster Database
- [Browsing Monsters](DM_GUIDE.md#browsing-the-monster-database)
- [Adding Monsters to Combat](DM_GUIDE.md#adding-monsters-to-combat)
- [Multiple Instances](DM_GUIDE.md#multiple-instances)
- [Sample Monsters](DM_GUIDE.md#sample-monsters-included)

#### Siege Mechanics
- [Siege Status Overview](DM_GUIDE.md#siege-status-overview)
- [Updating Siege Values](DM_GUIDE.md#updating-siege-values)
- [Adding Siege Notes](DM_GUIDE.md#adding-siege-notes)
- [Custom Metrics](DM_GUIDE.md#custom-metrics)

#### AI Assistant
- [Setting Up](DM_GUIDE.md#setting-up)
- [Asking Questions](DM_GUIDE.md#asking-questions)
- [Context Awareness](DM_GUIDE.md#context-awareness)
- [Best Practices](DM_GUIDE.md#best-practices)

#### City Map
- [Map Overview](DM_GUIDE.md#map-overview)
- [Location Status Colors](DM_GUIDE.md#location-status-colors)
- [Viewing Location Details](DM_GUIDE.md#viewing-location-details)
- [Adding Plot Points](DM_GUIDE.md#adding-plot-points)

## Technical Documentation

### Database
- **[Database Guide](DATABASE_GUIDE.md)** - Complete database documentation
  - PostgreSQL installation
  - Schema overview
  - Migrations
  - Backup and restore
  - Troubleshooting
  - Performance optimization

### API
- **[API Documentation](API_DOCUMENTATION.md)** - Complete REST API reference
  - All endpoints with examples
  - Request/response formats
  - Error handling
  - Testing the API

### Configuration
- **[API Key Setup](API_KEY_SETUP.md)** - OpenAI API configuration
  - Creating an account
  - Generating API keys
  - Security best practices
  - Cost management
  - Troubleshooting

## Sample Data

### Loading Sample Data
```bash
npm run db:seed
```

### What's Included
- **5 Sample PCs**: Pre-made party of adventurers
  - Theron Brightblade (Paladin 10)
  - Lyra Shadowstep (Rogue 10)
  - Grimnar Ironforge (Fighter 10)
  - Elara Moonwhisper (Wizard 10)
  - Brother Aldric (Cleric 10)

- **6 Monster Types**: Tiamat's forces
  - Cult Fanatic (CR 2)
  - Red Dragon Wyrmling (CR 4)
  - Dragonborn Champion (CR 5)
  - Kobold Inventor (CR 1/4)
  - Abishai (Red) (CR 9)
  - Dragonclaw (CR 1)

- **Siege State**: Day 5 of the siege
  - Wall Integrity: 90%
  - Defender Morale: 85%
  - Supplies: 75%
  - 5 historical notes

- **6 Locations**: Key areas in Neverwinter
  - Castle Never (controlled)
  - Hall of Justice (controlled)
  - Protector's Enclave (controlled)
  - Eastern Gate (contested)
  - Harbor District (controlled)
  - Blacklake District (enemy)

- **5 Plot Points**: Active quests and objectives

## Troubleshooting

### Common Issues

#### Database Connection Problems
- [Database Connection Issues](DATABASE_GUIDE.md#connection-issues)
- [Testing Connection](DATABASE_GUIDE.md#step-4-test-database-connection)

#### API Key Issues
- [API Key Troubleshooting](API_KEY_SETUP.md#troubleshooting)
- [Invalid API Key](API_KEY_SETUP.md#error-invalid-api-key)
- [Rate Limiting](API_KEY_SETUP.md#error-rate-limit-exceeded)

#### Application Issues
- [Data Not Saving](DM_GUIDE.md#data-not-saving)
- [AI Assistant Not Responding](DM_GUIDE.md#ai-assistant-not-responding)
- [Module Not Displaying](DM_GUIDE.md#module-not-displaying)
- [Performance Issues](DM_GUIDE.md#performance-issues)

## Quick Reference

### Available Scripts
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

### Environment Variables
```
DATABASE_URL=postgresql://user:password@localhost:5432/siege_of_neverwinter
PORT=3000
OPENAI_API_KEY=sk-your-key-here
```

### Default Ports
- Application: `http://localhost:3000`
- PostgreSQL: `5432`

### File Locations
- Database Schema: `database/schema.sql`
- Seed Script: `database/seed.js`
- Environment Config: `.env`
- Client Files: `client/`
- Server Files: `server/`

## API Quick Reference

### Base URL
```
http://localhost:3000/api
```

### Key Endpoints
- `GET /api/campaigns` - List campaigns
- `GET /api/combatants?campaign_id=1` - List combatants
- `POST /api/combatants` - Create combatant
- `PUT /api/combatants/:id` - Update combatant
- `GET /api/monsters?campaign_id=1` - List monsters
- `POST /api/monsters/:id/instances` - Create monster instance
- `GET /api/siege?campaign_id=1` - Get siege state
- `PUT /api/siege` - Update siege state
- `GET /api/locations?campaign_id=1` - List locations
- `GET /api/plotpoints?campaign_id=1` - List plot points

See [API Documentation](API_DOCUMENTATION.md) for complete reference.

## Project Structure

```
SiegeOfNeverwinter/
├── client/                    # Frontend files
│   ├── index.html            # Main HTML file
│   ├── styles/               # CSS files
│   └── js/                   # JavaScript modules
├── server/                   # Backend files
│   ├── index.js             # Express server
│   ├── routes/              # API route handlers
│   ├── models/              # Data models
│   ├── middleware/          # Express middleware
│   └── utils/               # Utility functions
├── database/                # Database files
│   ├── schema.sql           # Database schema
│   ├── seed.js              # Sample data script
│   ├── db.js                # Database connection
│   └── migrations/          # Migration scripts
├── __tests__/               # Test files
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment template
├── package.json             # Dependencies
├── README.md                # Main readme
├── QUICKSTART.md            # Quick start guide
├── DM_GUIDE.md              # DM user guide
├── DATABASE_GUIDE.md        # Database documentation
├── API_DOCUMENTATION.md     # API reference
├── API_KEY_SETUP.md         # API key setup guide
└── DOCUMENTATION_INDEX.md   # This file
```

## Additional Resources

### D&D 5e Resources
- Player's Handbook - Core rules
- Monster Manual - Additional creatures
- Dungeon Master's Guide - Siege rules and DM guidance

### Technical Resources
- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [OpenAI API Documentation](https://platform.openai.com/docs)

### Community
- Fork and adapt for your own campaigns
- Share improvements and custom monsters
- Report issues and suggest features

## Version Information

- **Application Version**: 1.0.0
- **Node.js**: v14+ required
- **PostgreSQL**: v12+ required
- **API Version**: 1.0.0

## License

MIT License - See LICENSE file for details

---

**Need help?** Start with the [Quick Start Guide](QUICKSTART.md) or [DM Guide](DM_GUIDE.md)!
