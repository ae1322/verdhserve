const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, getAll, runQuery } = require('../db');
const { SECRET } = require('../middleware/auth');

// User Signup
router.post('/signup', (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
        const exists = getOne('SELECT id FROM users WHERE email = ?', [email]);
        if (exists) return res.status(409).json({ error: 'Email already registered' });
        const hash = bcrypt.hashSync(password, 10);
        const result = runQuery('INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)', [name, email, hash, phone || '']);
        const token = jwt.sign({ id: result.lastInsertRowid, role: 'user', name }, SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: result.lastInsertRowid, name, email, role: 'user' } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// User Login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const user = getOne('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'user']);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, role: 'user', name: user.name }, SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: 'user', phone: user.phone, address: user.address } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Worker Login
router.post('/worker-login', (req, res) => {
    try {
        const { email, password } = req.body;
        const worker = getOne('SELECT * FROM workers WHERE email = ?', [email]);
        if (!worker) return res.status(401).json({ error: 'Invalid credentials' });
        if (!bcrypt.compareSync(password, worker.password)) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: worker.id, role: 'worker', name: worker.name }, SECRET, { expiresIn: '7d' });
        res.json({ token, worker: { id: worker.id, name: worker.name, email: worker.email, role: 'worker', vehicle_type: worker.vehicle_type } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin Login
router.post('/admin-login', (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = getOne('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'admin']);
        if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
        if (!bcrypt.compareSync(password, admin.password)) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: admin.id, role: 'admin', name: admin.name }, SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update user profile/address
router.put('/profile', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token' });
        const decoded = jwt.verify(token, SECRET);
        const { name, phone, address, lat, lng } = req.body;
        runQuery('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), address = COALESCE(?, address), lat = COALESCE(?, lat), lng = COALESCE(?, lng) WHERE id = ?',
            [
                name !== undefined ? name : null,
                phone !== undefined ? phone : null,
                address !== undefined ? address : null,
                lat !== undefined ? lat : null,
                lng !== undefined ? lng : null,
                decoded.id
            ]);
        const user = getOne('SELECT id, name, email, phone, address, lat, lng, role FROM users WHERE id = ?', [decoded.id]);
        res.json({ user });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
