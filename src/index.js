// const express = require('express');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const morgan = require('morgan');
// const connectDB = require('./config/db');
// const tournamentRoutes = require('./routes/tournamentRouter');
// const userRoutes = require('./routes/userRoutes');
// const authRoutes = require('./routes/authRoutes');
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import tournamentRoutes from './routes/tournamentRouter.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => { res.send('Hello World!')});
// app.use('/api/users', userRoutes);
app.use('/api/tournaments', tournamentRoutes);
// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)


app.use((req, res) => { res.status(404).send('🔍 404! Page not found')});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
