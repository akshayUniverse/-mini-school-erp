import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { authenticate, errorHandler } from './middleware.js';
import authRoutes from './routes/auth.js';
import teacherRoutes from './routes/teachers.js';
import classRoutes from './routes/classes.js';
import studentRoutes from './routes/students.js';
import attendanceRoutes from './routes/attendance.js';
import dashboardRoutes from './routes/dashboard.js';

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  throw new Error('MONGODB_URI and JWT_SECRET must be configured');
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', authenticate);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use((req, res) => res.status(404).json({ message: 'Endpoint not found' }));
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;
await mongoose.connect(process.env.MONGODB_URI);
app.listen(port, () => console.log(`Mini School ERP API listening on port ${port}`));
