require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

const { FRONTEND_URI } = process.env;

app.use(cors({
    origin: FRONTEND_URI,
    credentials: true,
}));

// Middleware de log (optionnel)
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

// Route de santé
app.get('/health', (req, res) => {
    res.send('OK');
});

// Routes Spotify OAuth
app.use('/', authRoutes);

app.listen(3001, () => {
    console.log('✅ Backend Spotify OAuth ready at http://localhost:3001');
});
