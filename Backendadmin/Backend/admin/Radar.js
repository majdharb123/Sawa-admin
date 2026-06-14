const express = require('express');
const router = express.Router();
const db = require('../db'); 

router.get('/live-trips', async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id as trip_id,
                t.departure,
                t.destination,
                t.start_lat as current_lat, 
                t.start_lng as current_lng,
                t.available_seats,
                c.full_name as captain_name,
                c.phone as captain_phone
            FROM trips t
            JOIN create_acc_captain c ON t.captain_id = c.id
            WHERE t.status = 'Active'
        `;

        const [activeTrips] = await db.promise().query(query);

        const formattedTrips = activeTrips.map(trip => ({
            id: `TRP-${trip.trip_id}`,
            captain: trip.captain_name,
            route: `${trip.departure} - ${trip.destination}`,
            passengers: 'N/A', 
            totalSeats: trip.available_seats || 24,
            lat: parseFloat(trip.current_lat) || 33.8938, 
            lng: parseFloat(trip.current_lng) || 35.5018,
            speed: 'Calculating...', 
            status: 'on-time', 
            eta: 'Calculating...',
            alerts: [],
            path: [
                [parseFloat(trip.current_lat), parseFloat(trip.current_lng)],
            ]
        }));

        res.status(200).json({ success: true, trips: formattedTrips });

    } catch (error) {
        console.error("❌ Error fetching live radar data:", error);
        res.status(500).json({ success: false, message: "Server error fetching radar data." });
    }
});

module.exports = router;