# SAWA Administrative Dashboard

A full-stack administrative dashboard for managing the SAWA real-time transportation platform. It provides centralized tools for account verification, route management, live fleet monitoring, user administration, and report handling.

## Key Features

* **Operational Dashboard:** Displays platform statistics and operational information.
* **Account Verification:** Reviews and approves Captain and Zamil registrations and submitted documents.
* **Live Fleet Monitoring:** Tracks active trips and receives real-time location updates using Socket.IO.
* **Route Management:** Creates recurrent routes and processes route requests.
* **User Administration:** Views users and applies administrative actions.
* **Report Management:** Reviews and resolves reports submitted through the SAWA platform.
* **Push Notifications:** Sends Firebase Cloud Messaging notifications for account and request updates.

## Tech Stack

* **Frontend:** React.js, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database:** MySQL
* **Real-Time Communication:** Socket.IO
* **Maps:** React Leaflet, Google Maps services
* **Notifications:** Firebase Admin SDK
* **Security:** bcrypt, JSON Web Tokens, environment-based configuration

## Project Structure

Backendadmin/Backend/ — Node.js and Express administrative API

SAWAadmin/admin/ — React administrative dashboard

## Prerequisites

* Node.js 22 or a compatible LTS version
* npm
* MySQL Server
* Firebase service account credentials
* A restricted Google Maps API key for map-related frontend features
* The main SAWA backend when using features that depend on the mobile platform API

## Backend Setup

1. Navigate to the backend directory:

`cd Backendadmin/Backend`

2. Install dependencies:

`npm install`

3. Create `.env` from `.env.example` and configure:

`DB_HOST=localhost`

`DB_USER=your_mysql_username`

`DB_PASS=your_mysql_password`

`DB_NAME=your_database_name`

`PORT=5001`

4. Download your Firebase service account JSON file, rename it to `firebase-key.json`, and place it inside `Backendadmin/Backend`.

The file is excluded by `.gitignore` and must never be committed.

5. Start the backend:

`node server.js`

## Frontend Setup

1. Navigate to the frontend directory:

`cd SAWAadmin/admin`

2. Install dependencies:

`npm install`

3. Create `.env` from `.env.example` and configure:

`REACT_APP_ADMIN_API_URL=http://localhost:5001`

`REACT_APP_MAIN_BACKEND_URL=http://localhost:5000`

`REACT_APP_GOOGLE_MAPS_API_KEY=your_restricted_google_maps_api_key`

4. Start the development server:

`npm start`

5. Create a production build:

`npm run build`

## Security Notes

* `.env` files and `firebase-key.json` are excluded from version control.
* Only placeholder values are included in `.env.example` files.
* Frontend environment variables are included in the browser bundle. Restrict the Google Maps API key by website, API, and usage limits in Google Cloud Console.
* Never commit database passwords, service-account credentials, or private keys.

## Author

**Majd Harb**

* [LinkedIn](https://www.linkedin.com/in/majd-harb-cs/)
* [GitHub](https://github.com/majdharb123)
* [Email](mailto:majdharb37@gmail.com)

---

Developed as a senior-year software engineering capstone project under the supervision of Dr. Mahmoud Samad.
