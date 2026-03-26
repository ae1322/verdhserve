const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Start server after DB initialization
async function start() {
    await initDB();
    console.log('✅ Database initialized');

    // API Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/bookings', require('./routes/bookings'));
    app.use('/api/workers', require('./routes/workers'));
    app.use('/api/admin', require('./routes/admin'));

    // SPA fallback
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.listen(PORT, () => {
        console.log(`🌱 VERDASERVE server running on http://localhost:${PORT}`);
    });
}

start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
