// Backend-specific types
import { ObjectId } from "mongodb";

export interface UserDocument {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name?: string;
  preferences?: string[]; // User food preferences (e.g., "no spicy food", "vegetarian", "gluten-free")
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}
