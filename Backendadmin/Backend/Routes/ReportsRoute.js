const express = require('express');
const router = express.Router();
const db = require('../db'); 
 
router.get('/all', (req, res) => {
    const sqlSelect = 'SELECT * FROM reports ORDER BY created_at DESC';
    
    db.query(sqlSelect, (err, results) => {
        if (err) {
            console.error("Error fetching reports:", err);
            return res.status(500).json({ error: 'Error while fetching reports' });
        }
        res.status(200).json(results);
    });
});


router.put('/update-status/:id', (req, res) => {
    const reportId = req.params.id;
    const { status, admin_reply } = req.body; 

    const sqlUpdate = 'UPDATE reports SET status = ?, admin_reply = ? WHERE id = ?';
    
    db.query(sqlUpdate, [status, admin_reply, reportId], (err, result) => {
        if (err) {
            console.error("Error updating report:", err);
            return res.status(500).json({ error: 'Error while updating the report' });
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('report_status_updated', { reportId, status, admin_reply });
        }

        res.status(200).json({ message: 'Report status updated successfully' });
    });
});


router.put('/resolve/:id', (req, res) => {
    const reportId = req.params.id;

    const sqlUpdate = "UPDATE reports SET status = 'Resolved' WHERE id = ?";
    
    db.query(sqlUpdate, [reportId], (err, result) => {
        if (err) {
            console.error("Error resolving report:", err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }


        const io = req.app.get('io');
        if (io) {
            io.emit('report_status_updated', { reportId, status: 'Resolved' });
        }

        res.status(200).json({ success: true, message: 'Report marked as resolved' });
    });
});

module.exports = router;