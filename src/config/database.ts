import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const uri: string = process.env.MONGO_URI || 'mongodb+srv://samueljacob8880:faith123@faith.4r2ir.mongodb.net/CalendarDB?retryWrites=true&w=majority&appName=faith';
    if (!uri) {
      throw new Error('MongoDB connection URI is not defined.');
    }
    await mongoose.connect(uri);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process with a failure code
  }
};

export default connectDB;
