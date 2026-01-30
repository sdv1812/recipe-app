import { MongoClient, Db, Collection } from "mongodb";
import {
  Recipe,
  User,
  ShareToken,
  GroceryItem,
  Thread,
} from "../../shared/types";
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

export async function getGroceriesCollection(): Promise<
  Collection<GroceryItem>
> {
  const { db } = await connectToDatabase();
  return db.collection<GroceryItem>("groceries");
}

export async function getThreadsCollection(): Promise<Collection<Thread>> {
  const { db } = await connectToDatabase();
  return db.collection<Thread>("threads");
}

// Grocery List Functions
export async function getGroceryList(userId: string): Promise<GroceryItem[]> {
  const groceries = await getGroceriesCollection();
  return await groceries.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function addToGroceryList(
  userId: string,
  items: Array<{ name: string; quantity?: string; unit?: string }>,
  recipeId?: string,
): Promise<{ added: number; updated: number }> {
  const groceries = await getGroceriesCollection();
  let added = 0;
  let updated = 0;

  for (const item of items) {
    // Normalize item name for duplicate detection (lowercase, trim)
    const normalizedName = item.name.toLowerCase().trim();

    // Check if item already exists
    const existing = await groceries.findOne({
      userId,
      name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
    });

    if (existing) {
      // Update existing item - add recipe ID if provided
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (recipeId && !existing.recipeIds.includes(recipeId)) {
        updateData.recipeIds = [...existing.recipeIds, recipeId];
      }

      await groceries.updateOne({ _id: existing._id }, { $set: updateData });
      updated++;
    } else {
      // Add new item
      const newItem: GroceryItem = {
        id: `grocery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name: item.name.trim(),
        quantity: item.quantity,
        unit: item.unit,
        completed: false,
        recipeIds: recipeId ? [recipeId] : [],
        createdAt: new Date().toISOString(),
      };

      await groceries.insertOne(newItem as any);
      added++;
    }
  }

  return { added, updated };
}

export async function toggleGroceryItem(
  userId: string,
  itemId: string,
): Promise<GroceryItem> {
  const groceries = await getGroceriesCollection();

  const item = await groceries.findOne({ id: itemId, userId });
  if (!item) {
    throw new Error("Grocery item not found");
  }

  const completed = !item.completed;
  const updateData: any = {
    completed,
    updatedAt: new Date().toISOString(),
  };

  if (completed) {
    updateData.completedAt = new Date().toISOString();
  } else {
    updateData.completedAt = null;
  }

  await groceries.updateOne({ id: itemId, userId }, { $set: updateData });

  return { ...item, ...updateData };
}

export async function deleteGroceryItem(
  userId: string,
  itemId: string,
): Promise<void> {
  const groceries = await getGroceriesCollection();
  await groceries.deleteOne({ id: itemId, userId });
}

export async function clearCompletedGroceries(userId: string): Promise<number> {
  const groceries = await getGroceriesCollection();
  const result = await groceries.deleteMany({ userId, completed: true });
  return result.deletedCount || 0;
}
