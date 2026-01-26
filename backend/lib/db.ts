import { MongoClient, Db, Collection } from "mongodb";
import { Recipe, User, ShareToken } from "../../shared/types";
import { UserDocument } from "./types";

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

  // Determine if we're connecting to a local MongoDB or Atlas
  const isLocal =
    mongoUri.includes("localhost") || mongoUri.includes("127.0.0.1");

  const client = await MongoClient.connect(mongoUri, {
    maxPoolSize: 10,
    minPoolSize: 5,
    tls: !isLocal, // Disable TLS for local connections
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

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const { db } = await connectToDatabase();
  return db.collection<UserDocument>("users");
}

export async function getSharesCollection(): Promise<Collection<ShareToken>> {
  const { db } = await connectToDatabase();
  return db.collection<ShareToken>("shares");
}
