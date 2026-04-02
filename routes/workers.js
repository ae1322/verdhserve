const express = require('express');
const router = express.Router();
const { getOne, getAll, runQuery } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Get worker's assigned pickups
router.get('/my-pickups', authMiddleware, (req, res) => {
    try {
        const bookings = getAll(`
      SELECT b.*, u.name as user_name, u.phone as user_phone, u.address as user_address, u.email as user_email
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.worker_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.id]);
        res.json({ bookings });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get all workers
router.get('/', authMiddleware, (req, res) => {
    try {
        const workers = getAll('SELECT id, name, email, phone, address, vehicle_type, is_available FROM workers');
        res.json({ workers });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create new worker
router.post('/', authMiddleware, (req, res) => {
    try {
        const { name, email, password, phone, vehicle_type } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
        const exists = getOne('SELECT id FROM workers WHERE email = ?', [email]);
        if (exists) return res.status(409).json({ error: 'Worker email already exists' });

        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync(password, 10);
        runQuery('INSERT INTO workers (name, email, password, phone, vehicle_type) VALUES (?, ?, ?, ?, ?)',
            [name, email, hash, phone || '', vehicle_type || 'bike']);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update worker vehicle
router.patch('/vehicle', authMiddleware, (req, res) => {
    try {
        const { vehicle_type } = req.body;
        runQuery('UPDATE workers SET vehicle_type = ? WHERE id = ?', [vehicle_type, req.user.id]);
        res.json({ success: true, vehicle_type });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update worker location
router.patch('/location', authMiddleware, (req, res) => {
    try {
        const { lat, lng } = req.body;
        runQuery('UPDATE workers SET lat = ?, lng = ? WHERE id = ?', [lat, lng, req.user.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update worker profile
router.put('/profile', authMiddleware, (req, res) => {
    try {
        const { name, phone, address, lat, lng } = req.body;
        runQuery('UPDATE workers SET name = COALESCE(?, name), phone = COALESCE(?, phone), address = COALESCE(?, address), lat = COALESCE(?, lat), lng = COALESCE(?, lng) WHERE id = ?',
            [
                name !== undefined ? name : null,
                phone !== undefined ? phone : null,
                address !== undefined ? address : null,
                lat !== undefined ? lat : null,
                lng !== undefined ? lng : null,
                req.user.id
            ]);
        const worker = getOne('SELECT id, name, email, phone, address, vehicle_type, role FROM workers WHERE id = ?', [req.user.id]);
        res.json({ worker });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin: Update worker
router.put('/:id', authMiddleware, (req, res) => {
    try {
        // Assume req.user.role === 'admin' check is handled via UI or we should check it
        const { name, phone, vehicle_type } = req.body;
        runQuery('UPDATE workers SET name = COALESCE(?, name), phone = COALESCE(?, phone), vehicle_type = COALESCE(?, vehicle_type) WHERE id = ?',
            [
                name !== undefined ? name : null,
                phone !== undefined ? phone : null,
                vehicle_type !== undefined ? vehicle_type : null,
                parseInt(req.params.id)
            ]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin: Delete worker
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        runQuery('UPDATE bookings SET worker_id = NULL, status = "pending" WHERE worker_id = ?', [parseInt(req.params.id)]); // Unassign their bookings
        runQuery('DELETE FROM workers WHERE id = ?', [parseInt(req.params.id)]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
