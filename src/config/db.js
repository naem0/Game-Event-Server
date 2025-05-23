import mongoose from 'mongoose';

console.log(process.env.MONGO_URI,"Connecting to MongoDB...");
console.log(process.env);
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error);
        process.exit(1);
    }
};

export default connectDB;
