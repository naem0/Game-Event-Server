import mongoose from 'mongoose';

console.log(process.env.MONGO_URI,"Connecting to MongoDB...");
console.log(process.env);
const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://mmnayeem408:znunvul2ojlcIF4S@cluster0.sqqija3.mongodb.net/");
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error);
        process.exit(1);
    }
};

export default connectDB;
