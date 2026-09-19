# SAWA Admin Frontend

The React frontend for the SAWA Administrative Dashboard. It provides interfaces for platform statistics, account verification, user administration, live fleet monitoring, recurrent route management, trip requests, and report handling.

## Tech Stack

* React.js
* Tailwind CSS
* Axios
* Socket.IO Client
* React Leaflet
* Recharts
* Firebase-connected backend notifications

## Environment Configuration

Create a `.env` file from `.env.example`:

`REACT_APP_ADMIN_API_URL=http://localhost:5001`

`REACT_APP_MAIN_BACKEND_URL=http://localhost:5000`

`REACT_APP_GOOGLE_MAPS_API_KEY=your_restricted_google_maps_api_key`

The Google Maps API key is used by browser code and must be restricted by website, API, and usage limits in Google Cloud Console.

## Installation

Install the dependencies:

`npm install`

## Development

Start the development server:

`npm start`

The application will be available at:

`http://localhost:3000`

## Production Build

Create an optimized production build:

`npm run build`

The generated production files will be placed in the `build` directory.

## Security

* Never commit the local `.env` file.
* Do not place database credentials or Firebase service-account credentials in frontend environment variables.
* Only placeholder values should be committed through `.env.example`.
* Frontend environment variables are included in the browser bundle and must not be treated as private secrets.

For complete backend configuration and project documentation, see the main README at the repository root.
