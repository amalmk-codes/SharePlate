# SharePlate – Share More. Waste Less. 🌱

website:https://shareplate-r3sv.onrender.com

**SharePlate** is a food donation and food rescue platform designed to reduce food waste and help communities access surplus food. It connects food donors, restaurants, volunteers, and community organizations to make food redistribution easier and more organized.

The platform aims to turn surplus food into an opportunity to support people in need while encouraging sustainable and responsible food management.

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Problem Statement](#-problem-statement)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [How to Use SharePlate](#-how-to-use-shareplate)
- [Current Limitations](#-current-limitations)
- [Future Enhancements](#-future-enhancements)
- [Security Notes](#-security-notes)
- [Contributing](#-contributing)
- [License](#-license)

## 🌍 About the Project

Food waste is a major social and environmental challenge. Restaurants, grocery stores, event organizers, and households may have surplus food that is still suitable for consumption, while community organizations may need food resources to support people.

SharePlate provides a digital platform concept for making this process easier. Users can explore food listings, find donation opportunities, discover community organizations, and track the impact of food-sharing activities.

The project is developed as a web application with a React frontend and an Express backend. The current frontend includes a local demonstration mode using browser localStorage.

## ❗ Problem Statement

- Surplus food is often discarded instead of being redistributed.
- Food donors may struggle to find nearby organizations that can use surplus food.
- Manual donation coordination can be difficult to organize and track.
- Users need a simple way to discover available food and manage collection requests.
- Communities need better visibility into the impact of food donation activities.

SharePlate aims to address these challenges through a simple and accessible digital solution.

## 🎯 Objectives

1. Encourage food donation and responsible food management.
2. Make surplus-food listings easier to discover.
3. Help users coordinate donation requests and collection.
4. Provide visibility into donation activity and community impact.
5. Create a user-friendly interface for donors and community organizations.
6. Build a foundation for future food-rescue and sustainability features.

## ✨ Key Features

### 1. Dashboard

- Centralized dashboard for navigating the platform.
- Summary cards for donation activity and availability.
- Quick access to food rescue, donation, organization, and tracking sections.
- Impact snapshot and food listings requiring attention.

### 2. Food Rescue

- Browse available food donations.
- Explore food listings and their details.
- Identify food that may need timely collection.
- Support a future workflow for requesting and confirming pickups.

### 3. Buy & Donate

- Provide an interface for exploring food-related donation opportunities.
- Support the concept of contributing food or resources to community needs.
- Offer a foundation for future donation request and fulfillment workflows.

*Real payments and purchase transactions are not implemented in the current demo.*

### 4. Organizations

- Dedicated section for discovering community organizations.
- Designed to support connections between donors and organizations.
- Can be extended with verified organization profiles and contact details.

### 5. Track Donations

- A dedicated area for monitoring donation activity.
- Designed to make donation progress easier to understand.
- Can be extended with completed collections, donation history, and impact reports.

### 6. Local Demo Persistence

- Uses browser `localStorage` for supported demo data.
- Allows supported changes to remain in the same browser between page reloads.
- Does not require MongoDB for the current frontend demonstration.

**Important:** Local storage is browser-specific. Data is not automatically synchronized between different users or devices.

### 7. Food Waste Awareness

SharePlate promotes responsible food sharing and community participation by encouraging users to consider donation before disposal, whenever food is safe and suitable for redistribution.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Vite | Frontend development server and build tool |
| JavaScript | Application logic |
| HTML5 | Web page structure |
| CSS3 | Styling and responsive interface |
| Node.js | Backend JavaScript runtime |
| Express.js | Backend API framework |
| Browser localStorage | Local demo data persistence |
| Git and GitHub | Version control and source-code hosting |

**Database:** MongoDB is not required for the current localStorage-based demo.

## 📁 Project Structure

```text
SharePlate/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── style.css
│
├── server/
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   └── .env.example
│
├── .gitignore
├── README.md
├── AI_SETUP_NOTES.md
├── client/
└── ...
```

*The structure above illustrates the main project files. Keep the README aligned with the actual files in your repository; remove duplicate or outdated entries if they do not apply.*

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) — preferably a current LTS version.
- npm, included with Node.js.
- [Git](https://git-scm.com/) for source-code management.
- A code editor such as [Visual Studio Code](https://code.visualstudio.com/).

Check whether Node.js and npm are installed:

```bash
node --version
npm --version
```

### Step 1: Clone the repository

```bash
git clone https://github.com/amalmk-codes/SharePlate.git
```

Move into the project folder:

```bash
cd SharePlate
```

### Step 2: Install frontend dependencies

```bash
cd client
npm install
```

### Step 3: Start the frontend

```bash
npm run dev
```

Vite will display a local URL, usually:

```text
http://localhost:5173
```

Open the URL shown in your terminal in a web browser.

### Step 4: Run the backend (optional)

Open a second terminal in the project root and run:

```bash
cd server
npm install
```

Start the backend using the script defined in `server/package.json`. For example, if it defines a `start` script:

```bash
npm start
```

If it defines a `dev` script instead, use:

```bash
npm run dev
```

The backend's actual routes and configuration determine which API endpoints are available. The current frontend demo may operate independently of the backend.

## ⚙️ Environment Configuration

The server directory contains an example environment file:

```text
server/.env.example
```

If the backend requires environment variables, create a local `.env` file inside `server` using the variables documented in `.env.example`.

Example:

```text
PORT=5000
```

Only include variables actually used by the backend. Do not commit real credentials, database connection strings, or API keys.

The `.env` file should remain excluded from Git through `.gitignore`.

## 🧭 How to Use SharePlate

1. **Open the dashboard:** Explore the main dashboard and its activity summaries.
2. **Explore Food Rescue:** Browse food listings and identify donation opportunities.
3. **Visit Buy & Donate:** Explore the donation-related interface.
4. **Find Organizations:** Open the organizations section to explore the intended community-partner workflow.
5. **Track Donations:** View the donation-tracking section.
6. **Explore the demo:** Try the available interface interactions and refresh the page to check whether supported local data persists.

The exact actions available depend on the current implementation.

## 🔒 Food Safety and Responsible Donation

SharePlate is intended to support responsible food redistribution. Food donors and receiving organizations should verify:

- Food is safe and suitable for consumption.
- Storage and transportation conditions are appropriate.
- Allergen and ingredient information is communicated when available.
- Applicable local food-safety and donation requirements are followed.
- Expired or unsafe food is not redistributed for consumption.

A listing's availability or displayed countdown should not be treated as proof that food is safe.

## ⚠️ Current Limitations

SharePlate is currently a development/demo project.

- **Local storage:** Supported demo data is stored in the current browser rather than a shared database.
- **Multi-user access:** Changes are not automatically synchronized between different users.
- **Authentication:** Production-ready user registration, login, and role-based access may require further implementation.
- **Organization verification:** Real-world organization identities and eligibility need verification.
- **Pickup coordination:** Actual collection scheduling and confirmation require a connected workflow.
- **Payments:** No real payment processing is provided by the current demo.
- **AI integration:** Do not assume that an AI assistant is connected unless it has been implemented and configured.
- **Food safety:** Users remain responsible for verifying food quality, storage, and safe handling.

Do not use the demo as a substitute for a verified food-safety or emergency food-distribution service.

## 🔮 Future Enhancements

Potential improvements include:

- First-time user onboarding and guided workflows.
- Role-based dashboards for donors, organizations, and volunteers.
- Natural-language assistance for creating and finding food donations.
- Food expiry countdowns and expired-listing handling.
- Search, filtering, and sorting for food listings.
- Donation requests and pickup confirmation.
- Secure authentication and user profiles.
- Shared database persistence for multiple users.
- Verified organization profiles and location-based discovery.
- Donation history and more detailed community impact statistics.
- Email or notification reminders for collection deadlines.
- Accessibility improvements and mobile-responsive refinements.
- Secure integration with external services where needed.

These are planned enhancements, not claims that every feature is currently implemented.

## 🔐 Security Notes

- Never commit `.env` files or real API keys.
- Keep secrets out of frontend JavaScript because browser code is publicly accessible.
- Validate and sanitize user input on the backend.
- Apply appropriate authentication and authorization before allowing sensitive operations.
- Use HTTPS and secure configuration when deploying.
- Treat browser localStorage as untrusted, user-editable data.
- Review files before pushing changes to a public GitHub repository.

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Make your changes.
4. Test the frontend and any affected backend functionality.
5. Commit your changes:

   ```bash
   git add .
   git commit -m "Add your feature"
   ```

6. Push your branch:

   ```bash
   git push origin feature/your-feature
   ```

7. Open a pull request describing your changes.

## 📄 License

No license has been specified yet. Until a license is added to the repository, reuse, modification, and redistribution permissions are not explicitly granted. Add a suitable license file if you intend to publish the project under an open-source license.

## 👨‍💻 Project Repository

**GitHub:** https://github.com/amalmk-codes/SharePlate

---

**SharePlate — Share More. Waste Less. 🌱**

*Building a more sustainable community, one donation at a time.*
