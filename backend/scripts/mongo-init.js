// MongoDB initialization script for local development
// This script runs when the MongoDB container is first created

db = db.getSiblingDB('recipeapp');

// Create collections with validation schemas
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'passwordHash', 'createdAt'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        passwordHash: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        name: {
          bsonType: 'string',
          description: 'must be a string if the field exists'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date and is required'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'must be a date if the field exists'
        },
        preferences: {
          bsonType: 'array',
          description: 'must be an array if the field exists'
        }
      }
    }
  }
});

db.createCollection('recipes');
db.createCollection('shares');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.recipes.createIndex({ userId: 1 });
db.recipes.createIndex({ createdAt: -1 });
db.shares.createIndex({ token: 1 }, { unique: true });
db.shares.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

print('Database initialized successfully!');
