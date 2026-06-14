const express = require('express');
const router = express.Router();
const db = require('../db'); 

router.post('/create', async (req, res) => {
    const { 
        from_city, 
        to_city, 
        start_date,
        end_date,
        departure_time, 
        estimated_duration, 
        price_lbp,
        price_usd,
        min_passengers,
        max_passengers,
        operational_days, 
        stops,
        start_lat, 
        start_lng, 
        dest_lat, 
        dest_lng   
    } = req.body;

    if (!from_city || !to_city || !start_date || !departure_time || !price_lbp || !operational_days || !stops) {
        return res.status(400).json({ 
            success: false, 
            message: "Please fill all required fields." 
        });
    }

    try {
        const stopsJson = JSON.stringify(stops);
        const daysJson = JSON.stringify(operational_days);

        const query = `
            INSERT INTO recurrent_routes 
            (from_city, to_city, start_date, end_date, departure_time, estimated_duration, price_lbp, price_usd, min_passengers, max_passengers, operational_days, stops, start_lat, start_lng, dest_lat, dest_lng) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            from_city, 
            to_city, 
            start_date,
            end_date || null, 
            departure_time, 
            estimated_duration, 
            price_lbp, 
            price_usd,
            min_passengers,
            max_passengers,
            daysJson, 
            stopsJson,
            start_lat || null, 
            start_lng || null,
            dest_lat || null,
            dest_lng || null
        ];

        const [result] = await db.promise().query(query, values);

        
        const io = req.app.get('io');
        if (io) {
            io.emit('new_recurrent_route_created', {
                routeId: result.insertId,
                from: from_city,
                to: to_city,
                message: 'A new recurrent route has been added by the admin.'
            });
        }

        res.status(201).json({
            success: true,
            message: "Official recurrent route created successfully!",
            routeId: result.insertId
        });

    } catch (error) {
        console.error("❌ Error creating recurrent route:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
});


router.get('/all', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM recurrent_routes ORDER BY created_at DESC');
        
        const routes = rows.map(route => ({
            ...route,
            stops: typeof route.stops === 'string' ? JSON.parse(route.stops) : route.stops,
            operational_days: typeof route.operational_days === 'string' ? JSON.parse(route.operational_days) : route.operational_days
        }));

        res.status(200).json({ success: true, routes });
    } catch (error) {
        console.error("❌ Error fetching routes:", error);
        res.status(500).json({ success: false, message: "Error fetching routes" });
    }
});

module.exports = router;