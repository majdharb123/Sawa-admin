const express = require("express");
const router = express.Router();
const db = require("../db");


router.get("/dashboard-stats", async (req, res) => {
  try {
    const queryZamils = `SELECT COUNT(*) as count FROM create_acc_zamil`;
    const queryApprovedCaptains = `SELECT COUNT(*) as count FROM create_acc_captain WHERE status = 'Approved'`;
    const queryPendingCaptains = `SELECT COUNT(*) as count FROM create_acc_captain WHERE status = 'Pending'`;
    const queryLiveTrips = `SELECT COUNT(*) as count FROM trips WHERE status = 'Active'`;
    const queryReports = `SELECT COUNT(*) as count FROM reports WHERE status = 'Pending'`;

    const captainsQuery = `
    SELECT 
        c.id, 
        c.full_name as name, 
        c.selfie_image as avatar,  
        COUNT(t.id) as trips, 
        IFNULL(SUM(t.price), 0) as revenue,
        0 as \`change\`
    FROM create_acc_captain c
    LEFT JOIN trips t ON c.id = t.captain_id
    WHERE c.status = 'Approved'
    GROUP BY c.id
    ORDER BY revenue DESC 
    LIMIT 5
    `;

    const [
      [zamilResult],
      [captainResult],
      [pendingCaptainsResult],
      [liveTripsResult],
      [reportsResult],
      [captainsResult],
    ] = await Promise.all([
      db.promise().query(queryZamils).catch(() => [[{ count: 0 }]]),
      db.promise().query(queryApprovedCaptains).catch(() => [[{ count: 0 }]]),
      db.promise().query(queryPendingCaptains).catch(() => [[{ count: 0 }]]),
      db.promise().query(queryLiveTrips).catch(() => [[{ count: 0 }]]),
      db.promise().query(queryReports).catch(() => [[{ count: 0 }]]),
      db.promise().query(captainsQuery).catch(() => [[]]),
    ]);

    const totalUsersCount = zamilResult[0].count + captainResult[0].count;
    //const queryRevenue = `SELECT trip_type as name, SUM(price) as amount FROM trips GROUP BY trip_type`;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers: totalUsersCount.toLocaleString(),
        liveTrips: liveTripsResult[0].count.toString(),
        totalRevenue: "5420",
        systemHealth: "98%",
        pendingPayouts: "3",
        pendingVerifications: pendingCaptainsResult[0].count.toString(),
        reportedIssues: reportsResult[0].count.toString(),

        userGrowth: [
          { month: "Jan", users: 100 },
          { month: "Feb", users: 150 },
          { month: "Mar", users: 300 },
          { month: "Apr", users: 450 },
        ],
        revenueMix: [
          { name: "Direct", value: 60, amount: 3000 },
          { name: "Private", value: 40, amount: 2000 },
        ],

        captains: captainsResult.map((c) => {
          const imageUrl = c.avatar 
            ? `http://localhost:5001/${c.avatar}` 
            : "https://via.placeholder.com/150";

          return {
            id: c.id,
            name: c.name,
            avatar: imageUrl,
            trips: c.trips || 0,
            revenue: c.revenue || 0,
            change: c["change"] || 0,
          };
        }),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;