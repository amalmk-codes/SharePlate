# SharePlate - Share More, Waste Less

SharePlate connects food donors with NGOs to help reduce
food waste and distribute surplus food to people in need.

## Features

- View available surplus food.
- Add food donations.
- Search food listings.
- Request food from a listing.
- View donation status.
- Responsive interface.
- Express REST API.

## Requirements

- Node.js and npm
- Python 3 for running generator.py

## Run the backend

Open a terminal in the project folder:

    cd server
    npm install
    npm run dev

The backend runs on http://localhost:5000

## Run the frontend

Open a second terminal:

    cd client
    npm install
    npm run dev

Open the local URL printed by Vite, usually
http://localhost:5173

## Important

This is a beginner-friendly starter project.
Food data is stored in memory on the backend and
resets when the server restarts. Login, production
authentication, and permanent database storage are
not implemented yet.

Dashboard impact figures, if added later, should be
clearly labelled as sample figures until real data
is available.

Food donations should be collected and distributed
safely, with suitable storage and pickup arrangements.
