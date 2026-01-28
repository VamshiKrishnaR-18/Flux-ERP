import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://vamshisid18_db_user:nq8ZKGv44Pq9A23q@cluster0.eq7pe6c.mongodb.net/";


const startServer = async () => {
  try {

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
    });

  }catch(error){

    console.error("❌ Error connecting to MongoDB:", error);
    console.error(error);
    process.exit(1);

  }
}

startServer();