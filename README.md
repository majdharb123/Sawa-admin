# 🛡️ SAWA Administrative Dashboard

A full-stack web application built to manage and oversee the SAWA real-time transportation platform. This repository contains both the web-based React frontend and the robust Node.js backend API, providing system administrators with the necessary tools to ensure transit safety, verify drivers, and coordinate live routes.

## ✨ Key Features
*   **Comprehensive Dashboard:** A responsive web interface for full operational oversight.
*   **User Verification:** Secure system to review and approve Captain (driver) accounts and official vehicle documentation.
*   **Live Radar:** Real-time monitoring of active bus trips and fleet distribution using WebSockets.
*   **Route Management:** Automated and manual oversight for approving or rejecting newly proposed recurrent routes.
*   **Report Handling:** Centralized system to resolve passenger reports and enforce community guidelines.

## 🛠️ Tech Stack
*   **Frontend:** React.js, TailwindCss
*   **Backend:** Node.js
*   **Database:** MySQL
*   **Real-time & Services:** Socket.io, Firebase Admin SDK
*   **Security:** JWT (JSON Web Tokens), Bcrypt for admin authentication

## 🚀 Getting Started

### Prerequisites
*   Node.js & npm
*   MySQL Server
*   Firebase Admin SDK Key (`firebase-key.json`)

### Backend Setup
1.  **Navigate to the backend directory:**
    ```bash
    cd Backendadmin/Backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables & Security:** 
    *   Configure your `.env` file with your database credentials, port numbers, and JWT secret.
    *   Place your `firebase-key.json` file in the root of the backend directory *(Ensure this file is listed in your `.gitignore` and never committed)*.
4.  **Start the server:**
    ```bash
    node server.js
    ```

### Frontend Setup
1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend  # (Replace with your actual frontend folder name)
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the web application:**
    ```bash
    npm start
    ```

## 👤 Authors

**Majd Harb**
* **LinkedIn:** [https://www.linkedin.com/in/majd-harb-cs/]
* **GitHub:** [https://github.com/majdharb123]
* **Email:** [majdhaeb37@gmail.com]

**Nour Bathiche**
* **Co-Author & Project Partner**

---
*This project was developed as a senior year software engineering capstone project under the supervision of Dr. Mahmoud Samad.*
