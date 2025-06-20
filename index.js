const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const meRoutes = require('./routes/me');
const logoutRoute = require('./routes/logout');

require('dotenv').config();

const app = express();
const { FRONTEND_URI, COOKIE_SECRET } = process.env;

app.use(cors({
    origin: FRONTEND_URI,
    credentials: true,
}));

app.use(cookieParser(COOKIE_SECRET));

// Middleware de log
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

app.get('/health', (_, res) => res.send('OK'));
app.use('/', authRoutes);
app.use('/', meRoutes);
app.use('/', logoutRoute);

app.listen(3001, () => {
    console.log('✅ Backend Spotify OAuth ready at http://localhost:3001');
});
