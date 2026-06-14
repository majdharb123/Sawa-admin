const express = require("express");
const router = express.Router();
const db = require("../db");
const admin = require("firebase-admin");


async function sendFirebasePushNotification(fcmToken, title, body, route = "/", reason = "") {
  if (!fcmToken) return;

  const message = {
    notification: { title, body },
    data: {
      route: route,
      reason: reason,
    },
    token: fcmToken,
  };

  try {
    await admin.messaging().send(message);
    console.log(`✅ Push Notification sent successfully to: ${fcmToken} | Route: ${route}`);
  } catch (error) {
    console.error("❌ Error sending Firebase Push Notification:", error);
  }
}


router.get("/pending-trips", async (req, res) => {
  try {
    const query = `
            SELECT 
                req.id as request_id, 
                req.proposed_price, 
                req.status, 
                req.created_at,
                c.full_name as captainName, 
                c.phone as phone, 
                c.email as email,
                c.bus_name, 
                c.bus_type, 
                c.features,
                r.id as route_id, 
                r.from_city, 
                r.to_city, 
                r.departure_time, 
                r.stops
            FROM route_requests req
            JOIN create_acc_captain c ON req.captain_id = c.id
            JOIN recurrent_routes r ON req.route_id = r.id
            WHERE req.status = 'pending'
            ORDER BY req.created_at ASC
        `;

    const [results] = await db.promise().query(query);

    const tripRequests = results.map((row) => {
      let formattedTime = row.departure_time || "00:00";
      if (formattedTime.split(":").length >= 2) {
        formattedTime = `${formattedTime.split(":")[0]}:${formattedTime.split(":")[1]}`;
      }

      let parsedStops = [];
      try {
        parsedStops = typeof row.stops === "string" ? JSON.parse(row.stops) : row.stops;
      } catch (e) {
        parsedStops = [];
      }

      let parsedFeatures = [];
      try {
        parsedFeatures = typeof row.features === "string" ? JSON.parse(row.features) : row.features || [];
      } catch (e) {
        if (typeof row.features === "string" && row.features.length > 0) {
          parsedFeatures = row.features.split(",").map((f) => f.trim());
        } else {
          parsedFeatures = [];
        }
      }

      return {
        id: `REQ-${row.request_id}`,
        type: "TripClaim",
        captainName: row.captainName || "Unknown Captain",
        phone: row.phone || "N/A",
        email: row.email,
        routeId: `RT-${row.route_id}`,
        from: row.from_city,
        to: row.to_city,
        time: formattedTime,
        pricePerSeat: `${row.proposed_price} LBP`,
        status: "Pending",
        photo: `https://ui-avatars.com/api/?name=${row.captainName}&background=185FA5&color=fff`,
        stops: parsedStops,
        busInfo: {
          name: row.bus_name || "Standard Bus",
          type: row.bus_type || "N/A",
          features: parsedFeatures,
        },
      };
    });

    res.status(200).json({ success: true, count: tripRequests.length, tripRequests });
  } catch (error) {
    console.error("❌ Error fetching pending trip requests:", error);
    res.status(500).json({ success: false, message: "Server error while fetching requests." });
  }
});


router.get("/pending-accounts", async (req, res) => {
  try {
    const [captains] = await db.promise().query(`SELECT * FROM create_acc_captain WHERE status = 'Pending'`);
    const [zamils] = await db.promise().query(`SELECT * FROM create_acc_zamil WHERE status = 'Pending'`);

    const captainRequests = captains.map((user) => {
      let formattedDob = "N/A";
      if (user.dob) {
        const d = new Date(user.dob);
        formattedDob = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      }

      let parsedFeatures = [];
      try {
        parsedFeatures = typeof user.features === "string" ? JSON.parse(user.features) : user.features || [];
      } catch (e) {
        if (typeof user.features === "string" && user.features.length > 0) {
          parsedFeatures = user.features.split(",").map((f) => f.trim());
        }
      }

      return {
        id: `CAP-${user.id}`,
        dbId: user.id,
        type: "Account",
        role: "Captain",
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        dob: formattedDob,
        governorate: user.governorate || "N/A",
        address: user.address || "N/A",
        currentCountry: user.current_country || "Unknown",
        currentCity: user.current_city || "Unknown",
        photo: `https://ui-avatars.com/api/?name=${user.full_name}&background=185FA5&color=fff`,
        busInfo: {
          name: user.bus_name || "Standard Bus",
          type: user.bus_type || "N/A",
          features: parsedFeatures,
        },
        documents: {
          idCard: user.id_image || "",
          selfie: user.selfie_image || "",
          busPapers: user.bus_papers_image || "",
          busInterior: user.bus_interior_image || "",
        },
      };
    });

    const zamilRequests = zamils.map((user) => {
      let formattedDob = "N/A";
      if (user.dob) {
        const d = new Date(user.dob);
        formattedDob = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      }

      return {
        id: `ZAM-${user.id}`,
        dbId: user.id,
        type: "Account",
        role: "Zamil",
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        dob: formattedDob,
        governorate: user.governorate || "N/A",
        address: user.address || "N/A",
        currentCountry: user.current_country || "Unknown",
        currentCity: user.current_city || "Unknown",
        photo: `https://ui-avatars.com/api/?name=${user.full_name}&background=1D9E75&color=fff`,
        busInfo: null,
        documents: {
          idCard: user.id_image || "",
          selfie: user.selfie_image || "",
          busPapers: null,
          busInterior: null,
        },
      };
    });

    res.status(200).json({ success: true, count: captainRequests.length + zamilRequests.length, accountRequests: [...captainRequests, ...zamilRequests] });
  } catch (error) {
    console.error("❌ Error fetching pending accounts:", error);
    res.status(500).json({ success: false, message: "Server error while fetching accounts." });
  }
});


router.put("/reject-trip", async (req, res) => {
  const { requestId, reason } = req.body;

  if (!requestId || !reason) {
    return res.status(400).json({ success: false, message: "Missing requestId or reason" });
  }

  try {
    const [requestInfo] = await db.promise().query(`SELECT captain_id, route_id FROM route_requests WHERE id = ?`, [requestId]);

    if (requestInfo.length === 0) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const captainId = requestInfo[0].captain_id;
    const routeId = requestInfo[0].route_id;

    await db.promise().query(`UPDATE route_requests SET status = 'rejected', rejection_reason = ? WHERE id = ?`, [reason, requestId]);
    await db.promise().query(`UPDATE recurrent_routes SET status = 'Rejected' WHERE id = ?`, [routeId]);

    const notifTitle = "Trip Request Declined ❌";
    const notifMessage = `Your request for route #${routeId} was declined. Reason: ${reason}. Please update your trip details and submit again.`;

    await db.promise().query(
      `INSERT INTO notifications (captain_id, title, message, type, reference_id) VALUES (?, ?, ?, 'System', ?)`,
      [captainId, notifTitle, notifMessage, routeId]
    );

    const [capInfo] = await db.promise().query(`SELECT fcm_token FROM create_acc_captain WHERE id = ?`, [captainId]);
    if (capInfo.length > 0 && capInfo[0].fcm_token) {
      await sendFirebasePushNotification(capInfo[0].fcm_token, notifTitle, notifMessage, "/recurrentTrips");
    }

    
    const io = req.app.get('io');
    if (io) {
        io.emit('trip_request_rejected', { captainId, routeId, reason });
    }

    res.status(200).json({ success: true, message: "Trip rejected and notification sent." });
  } catch (error) {
    console.error("❌ Error rejecting trip:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});


router.put("/approve-trip", async (req, res) => {
  const { requestId } = req.body;

  if (!requestId) {
    return res.status(400).json({ success: false, message: "Missing requestId in request body" });
  }

  try {
    const [requestInfo] = await db.promise().query(
      `SELECT req.captain_id, req.route_id, r.* FROM route_requests req
       JOIN recurrent_routes r ON req.route_id = r.id
       WHERE req.id = ?`, [requestId]
    );

    if (requestInfo.length === 0) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const route = requestInfo[0];
    const captainId = route.captain_id;
    const routeId = route.route_id;
    const groupName = `${route.from_city} - ${route.to_city}`;

    await db.promise().query(`UPDATE route_requests SET status = 'approved' WHERE id = ?`, [requestId]);
    await db.promise().query(`UPDATE recurrent_routes SET status = 'Active' WHERE id = ?`, [routeId]);

    const now = new Date();
    const beirutTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Beirut" }));
    const todayStr = `${beirutTime.getFullYear()}-${String(beirutTime.getMonth() + 1).padStart(2, "0")}-${String(beirutTime.getDate()).padStart(2, "0")}`;
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][beirutTime.getDay()];

    const sDate = new Date(route.start_date);
    const startDateStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, "0")}-${String(sDate.getDate()).padStart(2, "0")}`;

    let isOperatingToday = (startDateStr <= todayStr) && (route.operational_days.includes(dayName));

    if (isOperatingToday) {
      const [existingTrip] = await db.promise().query(
        `SELECT id FROM trips WHERE recurrent_route_id = ? AND trip_date = ? AND captain_id = ?`,
        [routeId, todayStr, captainId]
      );

      if (existingTrip.length === 0) {
        const insertQuery = `
          INSERT INTO trips 
          (captain_id, recurrent_route_id, departure, destination, meeting_point, dropoff_point, trip_date, trip_time, duration, available_seats, price, status, start_lat, start_lng, dest_lat, dest_lng)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?)
        `;
        await db.promise().query(insertQuery, [
          captainId, routeId, route.from_city, route.to_city, 
          route.from_city + " Station", route.to_city + " Station", 
          todayStr, route.departure_time, route.estimated_duration, 
          route.max_passengers || 15, route.price_lbp || 250000,
          route.start_lat, route.start_lng, route.dest_lat, route.dest_lng
        ]);
      }
    }

    const [existingGroup] = await db.promise().query(
        'SELECT id FROM chat_groups WHERE trip_id = ? AND captain_id = ? AND trip_type = "Recurrent"', 
        [routeId, captainId]
    );

    if (existingGroup.length === 0) {
        const [groupResult] = await db.promise().query(
            'INSERT INTO chat_groups (trip_id, captain_id, trip_type, group_name) VALUES (?, ?, "Recurrent", ?)',
            [routeId, captainId, groupName]
        );

        const newGroupId = groupResult.insertId;
        console.log(`✅ Chat group ${newGroupId} created seamlessly for Route ${routeId} and Captain ${captainId}`);
    }

    const notifTitle = "Trip Approved! 🚌✅";
    const notifMessage = `Great news! Your route to ${route.to_city} is approved. A broadcast chat "${groupName}" is ready for you.`;

    await db.promise().query(
      `INSERT INTO notifications (captain_id, title, message, type, reference_id) VALUES (?, ?, ?, 'System', ?)`,
      [captainId, notifTitle, notifMessage, routeId]
    );

    const [capInfo] = await db.promise().query(`SELECT fcm_token FROM create_acc_captain WHERE id = ?`, [captainId]);
    if (capInfo.length > 0 && capInfo[0].fcm_token) {
      await sendFirebasePushNotification(capInfo[0].fcm_token, notifTitle, notifMessage, "/availableTripCaptain");
    }

    
    const io = req.app.get('io');
    if (io) {
        io.emit('trip_request_approved', { captainId, routeId });
        
        if (isOperatingToday) {
            io.emit('new_trip_available', { message: "A new recurrent route is active today." });
        }
    }

    res.status(200).json({ success: true, message: "Trip approved and initialized successfully." });

  } catch (error) {
    console.error("❌ Error approving trip:", error.message);
    res.status(500).json({ success: false, message: "Server error during approval structure." });
  }
});

module.exports = router;