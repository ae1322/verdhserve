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
        const workers = getAll('SELECT id, name, email, phone, vehicle_type, is_available FROM workers');
        res.json({ workers });
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

module.exports = router;
