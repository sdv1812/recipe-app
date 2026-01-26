// Test script to verify local MongoDB connection
// Run with: node scripts/test-db-connection.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('URI:', process.env.MONGODB_URI?.replace(/\/\/(.+):(.+)@/, '//$1:****@'));
  
  try {
    const mongoUri = process.env.MONGODB_URI.trim();
    const isLocal = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
    
    console.log(`Connecting to ${isLocal ? 'LOCAL' : 'REMOTE'} MongoDB...`);
    
    const connectionOptions = {
      maxPoolSize: 10,
      minPoolSize: 5,
      retryWrites: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    };
    
    if (!isLocal) {
      connectionOptions.tls = true;
      connectionOptions.tlsAllowInvalidCertificates = false;
    }
    
    const client = await MongoClient.connect(mongoUri, connectionOptions);
    
    console.log('✓ Connected successfully!');
    
    const db = client.db('recipeapp');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('\nCollections:', collections.map(c => c.name).join(', '));
    
    // Check indexes
    const usersCollection = db.collection('users');
    const recipesCollection = db.collection('recipes');
    const sharesCollection = db.collection('shares');
    
    const userIndexes = await usersCollection.indexes();
    const recipeIndexes = await recipesCollection.indexes();
    const shareIndexes = await sharesCollection.indexes();
    
    console.log('\nUsers indexes:', userIndexes.map(i => i.name).join(', '));
    console.log('Recipes indexes:', recipeIndexes.map(i => i.name).join(', '));
    console.log('Shares indexes:', shareIndexes.map(i => i.name).join(', '));
    
    // Get counts
    const userCount = await usersCollection.countDocuments();
    const recipeCount = await recipesCollection.countDocuments();
    const shareCount = await sharesCollection.countDocuments();
    
    console.log('\nDocument counts:');
    console.log('- Users:', userCount);
    console.log('- Recipes:', recipeCount);
    console.log('- Shares:', shareCount);
    
    await client.close();
    console.log('\n✓ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
