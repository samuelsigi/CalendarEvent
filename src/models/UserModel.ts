import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// Define the interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Define the User schema
const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
    },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt
);

// Password hashing
UserSchema.pre('save', async function (next) {
  const user = this as IUser;

  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password comparison method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create the User model from the schema
const User = mongoose.model<IUser>('User', UserSchema);

// Function to find a user by email
export const findUserByEmail = async (email: string): Promise<IUser | null> => {
  try {
    const user = await User.findOne({ email, isDeleted: false });
    return user;
  } catch (err) {
    throw new Error('Error finding user by email');
  }
};

// Function to add a new user
export const addUser = async (userData: { name: string; email: string; password: string }): Promise<IUser> => {
  try {
    const newUser = new User(userData);
    await newUser.save();
    return newUser;
  } catch (err) {
    throw new Error('Error adding new user');
  }
};

// Exporting the functions and the User model
export { User };
