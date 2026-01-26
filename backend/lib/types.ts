// Backend-specific types
import { ObjectId } from "mongodb";

export interface UserDocument {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name?: string;
  preferences?: string[]; // User food preferences (e.g., "no spicy food", "vegetarian", "gluten-free")
  createdAt: Date;
  updatedAt: Date;
}
