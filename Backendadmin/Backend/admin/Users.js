const express = require('express');
const router = express.Router();
const db = require('../db'); 
const admin = require('firebase-admin');


if (!admin.apps.length) {
const serviceAccount = require('../firebase-key.json');
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin Initialized in Users route.");
}


router.get('/', async (req, res) => {
    try {
        const [captains] = await db.promise().query(`
            SELECT id, full_name as name, phone, current_city as region, bus_name as vehicle, status
            FROM create_acc_captain
            WHERE status != 'Pending'
        `);

        const [zamils] = await db.promise().query(`
            SELECT 
                z.id, 
                z.full_name as name, 
                z.phone, 
                z.current_city as region, 
                z.status,
                COUNT(b.id) as total_trips
            FROM create_acc_zamil z
            LEFT JOIN bookings b ON z.id = b.zamil_id AND b.status = 'Completed'
            GROUP BY z.id
        `);

        const formattedCaptains = captains.map(c => ({
            id: c.id,
            name: c.name,
            role: 'Captain',
            phone: c.phone,
            region: c.region || 'Unknown',
            vehicle: c.vehicle || 'N/A',
            status: c.status
        }));

        const formattedZamils = zamils.map(z => ({
            id: z.id,
            name: z.name,
            role: 'Zamil',
            phone: z.phone,
            region: z.region || 'Unknown',
            trips: z.total_trips || 0,
            status: z.status || 'Active'
        }));

        const allUsers = [...formattedCaptains, ...formattedZamils];
        res.status(200).json(allUsers);

    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ success: false, message: "Server error fetching users." });
    }
});


router.patch('/ban', async (req, res) => {
    const { id, role } = req.body;

    if (!id || !role) {
        return res.status(400).json({ success: false, message: "Missing user ID or Role" });
    }

    try {
        const tableName = role === 'Captain' ? 'create_acc_captain' : 'create_acc_zamil';
        
        const [userData] = await db.promise().query(`SELECT fcm_token FROM ${tableName} WHERE id = ?`, [id]);
        const fcmToken = userData[0]?.fcm_token;

        await db.promise().query(`UPDATE ${tableName} SET status = 'Rejected' WHERE id = ?`, [id]);
        
        const title = "Account Suspended 🚫";
        const message = "Your account has been suspended by the administration. If you believe this is a mistake, please contact SAWA support.";
        const type = "System";

        if (role === 'Captain') {
            await db.promise().query(
                `INSERT INTO notifications (captain_id, title, message, type) VALUES (?, ?, ?, ?)`,
                [id, title, message, type]
            );
        } else if (role === 'Zamil') {
            await db.promise().query(
                `INSERT INTO notifications (zamil_id, title, message, type) VALUES (?, ?, ?, ?)`,
                [id, title, message, type]
            );
        }

        if (fcmToken) {
            const payload = {
                notification: {
                    title: title,
                    body: message
                },
                token: fcmToken
            };

            try {
                const response = await admin.messaging().send(payload);
                console.log(`🚀 FCM Sent Successfully to ${role} (ID: ${id}):`, response.messageId);
            } catch (fcmError) {
                console.error(`❌ FCM Sending Error for ${role} (ID: ${id}):`, fcmError.message);
            }
        } else {
            console.log(`⚠️ No FCM Token found for ${role} (ID: ${id}). Push notification skipped.`);
        }


        const io = req.app.get('io');
        if (io) {
            io.emit('user_banned_live', { role: role, id: id });
            io.emit('admin_users_list_updated');
        }

        res.status(200).json({ success: true, message: `${role} banned successfully and notification sent.` });
    } catch (error) {
        console.error(`❌ Error banning ${role}:`, error);
        res.status(500).json({ success: false, message: "Server error banning user." });
    }
});

module.exports = router;