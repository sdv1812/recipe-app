import { MongoClient, Db, Collection } from "mongodb";
import { Recipe, User, ShareToken } from "../../shared/types";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("Please define MONGODB_URI environment variable");
  }

  // Trim whitespace/newlines from MongoDB URI
  const mongoUri = process.env.MONGODB_URI.trim();

  const client = await MongoClient.connect(mongoUri, {
    maxPoolSize: 10,
    minPoolSize: 5,
    tls: true,
    tlsAllowInvalidCertificates: false,
    retryWrites: true,
    serverSelectionTimeoutMS: 5000,
  });

  const db = client.db("recipeapp");

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getRecipesCollection(): Promise<Collection<Recipe>> {
  const { db } = await connectToDatabase();
  return db.collection<Recipe>("recipes");
}

export async function getUsersCollection(): Promise<Collection<User>> {
  const { db } = await connectToDatabase();
  return db.collection<User>("users");
}

export async function getSharesCollection(): Promise<Collection<ShareToken>> {
  const { db } = await connectToDatabase();
  return db.collection<ShareToken>("shares");
}
