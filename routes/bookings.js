const express = require('express');
const router = express.Router();
const { getOne, getAll, runQuery } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Create booking
router.post('/', authMiddleware, (req, res) => {
    try {
        const { paper_qty, paper_type, preferred_date, preferred_time, address, lat, lng } = req.body;
        if (!paper_qty || !paper_type || !preferred_date || !preferred_time || !address) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const result = runQuery(
            'INSERT INTO bookings (user_id, paper_qty, paper_type, preferred_date, preferred_time, address, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, paper_qty, paper_type, preferred_date, preferred_time, address, lat || 0, lng || 0]
        );
        const booking = getOne('SELECT * FROM bookings WHERE id = ?', [result.lastInsertRowid]);
        res.json({ booking });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get user's bookings
router.get('/my', authMiddleware, (req, res) => {
    try {
        const bookings = getAll(`
      SELECT b.*, w.name as worker_name, w.phone as worker_phone, w.vehicle_type as worker_vehicle, w.lat as worker_lat, w.lng as worker_lng
      FROM bookings b
      LEFT JOIN workers w ON b.worker_id = w.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.id]);
        res.json({ bookings });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get single booking
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const booking = getOne(`
      SELECT b.*, w.name as worker_name, w.phone as worker_phone, w.vehicle_type as worker_vehicle, w.lat as worker_lat, w.lng as worker_lng,
             u.name as user_name, u.phone as user_phone, u.address as user_address
      FROM bookings b
      LEFT JOIN workers w ON b.worker_id = w.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `, [parseInt(req.params.id)]);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        res.json({ booking });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get all bookings (admin)
router.get('/', authMiddleware, (req, res) => {
    try {
        const bookings = getAll(`
      SELECT b.*, w.name as worker_name, w.phone as worker_phone, w.vehicle_type as worker_vehicle, w.lat as worker_lat, w.lng as worker_lng,
             u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM bookings b
      LEFT JOIN workers w ON b.worker_id = w.id
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
    `);
        res.json({ bookings });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update booking status
router.patch('/:id/status', authMiddleware, (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'assigned', 'accepted', 'on_the_way', 'completed'];
        if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
        runQuery('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, parseInt(req.params.id)]);
        const booking = getOne(`
      SELECT b.*, w.name as worker_name, w.phone as worker_phone, w.vehicle_type as worker_vehicle, w.lat as worker_lat, w.lng as worker_lng
      FROM bookings b LEFT JOIN workers w ON b.worker_id = w.id WHERE b.id = ?
    `, [parseInt(req.params.id)]);
        res.json({ booking });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Assign worker to booking
router.patch('/:id/assign', authMiddleware, (req, res) => {
    try {
        const { worker_id } = req.body;
        runQuery('UPDATE bookings SET worker_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [worker_id, 'assigned', parseInt(req.params.id)]);
        const booking = getOne(`
      SELECT b.*, w.name as worker_name, w.phone as worker_phone, w.vehicle_type as worker_vehicle, w.lat as worker_lat, w.lng as worker_lng,
             u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM bookings b LEFT JOIN workers w ON b.worker_id = w.id LEFT JOIN users u ON b.user_id = u.id WHERE b.id = ?
    `, [parseInt(req.params.id)]);
        res.json({ booking });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
