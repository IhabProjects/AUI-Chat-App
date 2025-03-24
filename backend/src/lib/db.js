import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MANGODB_URI);
    console.log(`MangoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`MangoDB connection error: ${error}`);
  }
};
