const express = require("express");
const cors = require("cors");
const path = require('path'); 
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
  },
});

app.set("io", io);

app.use(cors());
app.use(express.json());

const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json"); 

if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
}


const AdminTrips = require('./admin/CreateTrips'); 
app.use('/api/admin/recurrent-routes', AdminTrips);

const Request = require('./admin/Request');
app.use('/api/admin/requests', Request);

const AccountVerifications = require('./Routes/AccountVerifications');
app.use('/api/admin', AccountVerifications);

const reportsRoute = require('./Routes/ReportsRoute');
app.use('/api/reports', reportsRoute);

const adminDashboardRoutes = require('./admin/AdminDashboard');
app.use('/api/admin', adminDashboardRoutes);

const radarRoutes = require('./admin/Radar');
app.use('/api/admin/radar', radarRoutes);

const usersRoutes = require('./admin/Users');
app.use('/api/admin/users', usersRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



io.on("connection", (socket) => {
  console.log(`👑 Admin/Frontend Connected to Admin Server: ${socket.id}`);

  socket.on("join-admin-room", () => {
    socket.join("admin_dashboard_room");
    console.log(`🛡️ User ${socket.id} joined admin_dashboard_room`);
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Admin/Frontend Disconnected: ${socket.id}`);
  });
});


const PORT = process.env.PORT || 5001; 
server.listen(PORT, () => {
  console.log(`🚀 Admin Server running on port ${PORT}`);
});