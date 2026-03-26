const express = require('express');
const router = express.Router();
const { getOne, getAll } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Dashboard stats
router.get('/stats', authMiddleware, (req, res) => {
    try {
        const total = getOne('SELECT COUNT(*) as c FROM bookings').c;
        const pending = getOne("SELECT COUNT(*) as c FROM bookings WHERE status = 'pending'").c;
        const assigned = getOne("SELECT COUNT(*) as c FROM bookings WHERE status IN ('assigned','accepted','on_the_way')").c;
        const completed = getOne("SELECT COUNT(*) as c FROM bookings WHERE status = 'completed'").c;
        const totalWorkers = getOne('SELECT COUNT(*) as c FROM workers').c;
        const totalUsers = getOne("SELECT COUNT(*) as c FROM users WHERE role = 'user'").c;
        const totalPaper = getOne('SELECT COALESCE(SUM(paper_qty),0) as c FROM bookings').c;
        res.json({ total, pending, assigned, completed, totalWorkers, totalUsers, totalPaper });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
