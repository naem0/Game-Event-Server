import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import tournamentRoutes from './routes/tournamentRouter.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import referralRoutes from "./routes/referralRoutes.js";
import topUpRoutes from "./routes/topUpRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import withdrawRoutes from "./routes/withdrawRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";
import prizeRoutes from "./routes/prizeRoutes.js";

dotenv.config();
connectDB();

const app = express();

// 1. সম্পূর্ণ CORS অ্যাক্সেস দেওয়ার জন্য
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  next();
});

// 2. অথবা cors প্যাকেজ ব্যবহার করে সম্পূর্ণ অ্যাক্সেস
import cors from 'cors';
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*']
}));

app.options('*', cors()); // সমস্ত OPTIONS রিকুয়েস্ট হ্যান্ডেল করার জন্য

app.use(express.json());
app.use(morgan('dev'));

// রাউটস
app.get('/', (req, res) => res.send('API Running'));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/referrals", referralRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use("/api/topup", topUpRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/prizes", prizeRoutes);
app.use("/uploads", express.static("uploads"));
app.use((req, res) => { res.status(404).send('🔍 404! Page not found') });
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`⚠️ WARNING: CORS is completely open - Not recommended for production`);
});