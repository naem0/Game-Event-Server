import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
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

app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
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