const express = require('express');
const router = express.Router();
const admin = require('firebase-admin'); 
const db = require('../db'); 


router.get('/requests/pending-accounts', async (req, res) => {
    try {
        const [captains] = await db.promise().query(`SELECT * FROM create_acc_captain WHERE status = 'Pending'`);
        const [zamils] = await db.promise().query(`SELECT * FROM create_acc_zamil WHERE status = 'Pending'`);

        const captainRequests = captains.map(user => {
            let formattedDob = 'N/A';
            if (user.dob) {
                const d = new Date(user.dob);
                formattedDob = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            }
            return {
                id: `CAP-${user.id}`,
                role: 'Captain',
                fullName: user.full_name,
                phone: user.phone,
                email: user.email,
                dob: formattedDob,
                governorate: user.governorate || 'N/A',
                address: user.address || 'N/A',
                currentCountry: user.current_country || 'Unknown', 
                currentCity: user.current_city || 'Unknown',
                busInfo: {
                    name: user.bus_name,
                    type: user.bus_type,
                    features: user.features ? JSON.parse(user.features) : []
                },
                photo: `https://ui-avatars.com/api/?name=${user.full_name}&background=185FA5&color=fff`,
                documents: {
                    idCard: user.id_image,
                    selfie: user.selfie_image,
                    busPapers: user.bus_papers_image,
                    busInterior: user.bus_interior_image
                }
            };
        });

        const zamilRequests = zamils.map(user => {
            let formattedDob = 'N/A';
            if (user.dob) {
                const d = new Date(user.dob);
                formattedDob = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            }
            return {
                id: `ZAM-${user.id}`,
                role: 'Zamil',
                fullName: user.full_name,
                phone: user.phone,
                email: user.email,
                dob: formattedDob,
                governorate: user.governorate || 'N/A',
                address: user.address || 'N/A',
                currentCountry: user.current_country || 'Unknown',
                currentCity: user.current_city || 'Unknown',
                busInfo: null, 
                photo: `https://ui-avatars.com/api/?name=${user.full_name}&background=1D9E75&color=fff`,
                documents: {
                    idCard: user.id_image,
                    selfie: user.selfie_image
                }
            };
        });

        const accountRequests = [...captainRequests, ...zamilRequests];
        
        console.log("=========================================");
        console.log("🚀 Data leaving the server to React:");
        console.log(JSON.stringify(accountRequests, null, 2));
        console.log("=========================================");

        res.status(200).json({ success: true, accountRequests });
    } catch (error) {
        console.error("❌ Error fetching pending accounts:", error);
        res.status(500).json({ success: false, message: "Server error fetching requests" });
    }
});


router.put('/approve-captain/:id', async (req, res) => {
    const captainId = req.params.id;
    const { adminNote } = req.body;

    try {
        const [captainData] = await db.promise().query(
            `SELECT email, fcm_token FROM create_acc_captain WHERE id = ?`,
            [captainId]
        );

        if (captainData.length === 0) return res.status(404).json({ success: false, message: "Captain not found" });

        const { fcm_token } = captainData[0];
        const title = 'SAWA - Congratulations! 🎉';
        
        let body = 'Your Captain account has been approved. You can now log in.';
        if (adminNote) body += `\nAdmin Note: ${adminNote}`;

        await db.promise().query(`UPDATE create_acc_captain SET status = 'Approved' WHERE id = ?`, [captainId]);
        await db.promise().query(`INSERT INTO notifications (captain_id, title, message) VALUES (?, ?, ?)`, [captainId, title, body]);

        if (fcm_token) {
            const message = {
                notification: { title, body },
                data: { route: '/login' }, 
                token: fcm_token
            };
            admin.messaging().send(message)
                .catch(error => console.error('❌ Error sending notification:', error));
        }

        
        const io = req.app.get('io');
        if (io) {
            io.emit('admin_accounts_updated'); 
            io.emit('account_status_changed', { role: 'Captain', id: captainId, status: 'Approved' }); // للموبايل
        }

        res.status(200).json({ success: true, message: "Captain approved successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});


router.put('/reject-captain/:id', async (req, res) => {
    const captainId = req.params.id;
    const { reason, adminNote } = req.body;

    try {
        const [captainData] = await db.promise().query(
            `SELECT email, fcm_token FROM create_acc_captain WHERE id = ?`,
            [captainId]
        );

        if (captainData.length === 0) return res.status(404).json({ success: false, message: "Captain not found" });

        const { fcm_token } = captainData[0];
        const title = 'SAWA - Account Status Update ❌';
        
        let bodyMsg = reason 
            ? `Sorry, your application was rejected. Reason: ${reason}.` 
            : 'Sorry, your application to join as a Captain has been rejected after review.';
        
        if (adminNote) bodyMsg += `\nAdmin Note: ${adminNote}`;
        bodyMsg += `\nPlease correct the errors and try again.`;

        await db.promise().query(`UPDATE create_acc_captain SET status = 'Rejected' WHERE id = ?`, [captainId]);
        await db.promise().query(`INSERT INTO notifications (captain_id, title, message) VALUES (?, ?, ?)`, [captainId, title, bodyMsg]);

        if (fcm_token) {
            const message = {
                notification: { title, body: bodyMsg },
                data: { route: '/CreateAccCaptain', reason: reason || 'Unknown error' },
                token: fcm_token
            };
            admin.messaging().send(message).catch(error => console.error('❌ Error sending notification:', error));
        }

        
        const io = req.app.get('io');
        if (io) {
            io.emit('admin_accounts_updated');
            io.emit('account_status_changed', { role: 'Captain', id: captainId, status: 'Rejected' });
        }

        res.status(200).json({ success: true, message: "Captain rejected with reason." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});


router.put('/approve-zamil/:id', async (req, res) => {
    const zamilId = req.params.id;
    const { adminNote } = req.body;

    try {
        const [zamilData] = await db.promise().query(
            `SELECT email, fcm_token FROM create_acc_zamil WHERE id = ?`,
            [zamilId]
        );

        if (zamilData.length === 0) return res.status(404).json({ success: false, message: "Zamil not found" });

        const { fcm_token } = zamilData[0];
        const title = 'SAWA - Congratulations! 🎉';
        
        let body = 'Your account has been approved. You can now log in and book trips.';
        if (adminNote) body += `\nAdmin Note: ${adminNote}`;

        await db.promise().query(`UPDATE create_acc_zamil SET status = 'Approved' WHERE id = ?`, [zamilId]);
        await db.promise().query(`INSERT INTO notifications (zamil_id, title, message) VALUES (?, ?, ?)`, [zamilId, title, body]);

        if (fcm_token) {
            const message = {
                notification: { title, body },
                data: { route: '/login' }, 
                token: fcm_token
            };
            admin.messaging().send(message).catch(err => console.error(err));
        }

        
        const io = req.app.get('io');
        if (io) {
            io.emit('admin_accounts_updated');
            io.emit('account_status_changed', { role: 'Zamil', id: zamilId, status: 'Approved' });
        }

        res.status(200).json({ success: true, message: "Zamil approved successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});


router.put('/reject-zamil/:id', async (req, res) => {
    const zamilId = req.params.id;
    const { reason, adminNote } = req.body;

    try {
        const [zamilData] = await db.promise().query(
            `SELECT email, fcm_token FROM create_acc_zamil WHERE id = ?`,
            [zamilId]
        );

        if (zamilData.length === 0) return res.status(404).json({ success: false, message: "Zamil not found" });

        const { fcm_token } = zamilData[0];
        const title = 'SAWA - Account Status Update ❌';
        
        let bodyMsg = reason 
            ? `Sorry, your application was rejected. Reason: ${reason}.` 
            : 'Sorry, your application has been rejected.';
            
        if (adminNote) bodyMsg += `\nAdmin Note: ${adminNote}`;
        bodyMsg += `\nPlease correct the errors and try again.`;

        await db.promise().query(`UPDATE create_acc_zamil SET status = 'Rejected' WHERE id = ?`, [zamilId]);
        await db.promise().query(`INSERT INTO notifications (zamil_id, title, message) VALUES (?, ?, ?)`, [zamilId, title, bodyMsg]);

        if (fcm_token) {
            const message = {
                notification: { title, body: bodyMsg },
                data: { route: '/CreateAccZamil', reason: reason || 'Unknown error' }, 
                token: fcm_token
            };
            admin.messaging().send(message).catch(err => console.error(err));
        }


        const io = req.app.get('io');
        if (io) {
            io.emit('admin_accounts_updated');
            io.emit('account_status_changed', { role: 'Zamil', id: zamilId, status: 'Rejected' });
        }

        res.status(200).json({ success: true, message: "Zamil rejected with reason." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;