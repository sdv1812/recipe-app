# Local Development Setup with Docker MongoDB

This guide will help you set up a local MongoDB server using Docker for development and testing.

## Prerequisites

- Docker Desktop installed on your machine
- Node.js and npm/yarn installed

## Quick Start

### 1. Start MongoDB Container

```bash
cd backend
docker-compose up -d
```

This will:

- Pull the MongoDB 7.0 image (if not already downloaded)
- Create a MongoDB container named `recipeapp-mongodb`
- Initialize the database with collections and indexes
- Expose MongoDB on port 27017

### 2. Verify MongoDB is Running

```bash
docker-compose ps
```

You should see the `recipeapp-mongodb` container running and healthy.

### 3. Use Local Environment Variables

The `.env.local` file is already configured to connect to your local MongoDB instance:

```bash
# Copy .env.local to .env for local development
cp .env.local .env
```

Or, when running your app, explicitly use the local environment:

```bash
# For Vercel dev
vercel env pull .env.local
# Then copy to .env
cp .env.local .env
```

### 4. Start Your Backend

```bash
npm install
npm run dev
# or
vercel dev
```

## Docker Commands

### View Logs

```bash
docker-compose logs -f mongodb
```

### Stop MongoDB

```bash
docker-compose stop
```

### Start MongoDB (if stopped)

```bash
docker-compose start
```

### Restart MongoDB

```bash
docker-compose restart
```

### Stop and Remove Container (keeps data)

```bash
docker-compose down
```

### Stop and Remove Everything (including data)

```bash
docker-compose down -v
```

## Access MongoDB Directly

### Using MongoDB Compass (GUI)

Connection string: `mongodb://admin:admin123@localhost:27017/recipeapp?authSource=admin`

### Using MongoDB Shell

```bash
docker exec -it recipeapp-mongodb mongosh -u admin -p admin123 --authenticationDatabase admin
```

Then:

```javascript
use recipeapp
db.users.find()
db.recipes.find()
db.shares.find()
```

## Database Details

- **Host**: localhost
- **Port**: 27017
- **Database**: recipeapp
- **Username**: admin
- **Password**: admin123
- **Collections**: users, recipes, shares

## Switching Between Local and Production

### For Local Development

Use `.env.local`:

```env
MONGODB_URI=mongodb://admin:admin123@localhost:27017/recipeapp?authSource=admin
```

### For Production (MongoDB Atlas)

Use `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

## Troubleshooting

### Port 27017 Already in Use

If you have another MongoDB instance running (e.g., via Homebrew):

```bash
# Find process using port 27017
lsof -i :27017

# If you have Homebrew MongoDB running, stop it:
brew services stop mongodb-community

# Or check for any MongoDB processes:
ps aux | grep -i mongo | grep -v grep

# Then restart the Docker container:
docker-compose restart
```

### Container Won't Start

```bash
# Check logs
docker-compose logs mongodb

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

### Connection Refused

Ensure the container is healthy:

```bash
docker-compose ps
# Wait for health status to show "healthy"
```

## Data Persistence

MongoDB data is stored in a Docker volume named `mongodb_data`. This means:

- Data persists between container restarts
- Data is lost only when you run `docker-compose down -v`
- You can back up the volume using Docker commands

## Clean Slate

To start fresh with an empty database:

```bash
docker-compose down -v
docker-compose up -d
```

This will reinitialize the database with the schema defined in `scripts/mongo-init.js`.
