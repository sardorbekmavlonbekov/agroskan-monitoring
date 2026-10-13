require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// Vercel proxy ortida ishlaydi (rate-limit uchun to'g'ri IP)
app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || '*').split(',').map((s) => s.trim());
app.use(
  cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(mongoSanitize()); // NoSQL injection'dan himoya
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Health check (DB'siz)
app.get('/', (req, res) => res.json({ success: true, message: 'AgroScan Monitoring API ishlayapti' }));
app.get('/api/health', (req, res) => res.json({ success: true, time: new Date().toISOString() }));

// Umumiy rate limit
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "So'rovlar soni oshib ketdi, keyinroq urinib ko'ring" },
  })
);

// Serverless uchun keshlangan DB ulanish
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/calendar', require('./routes/calendarRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/archive', require('./routes/archiveRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
