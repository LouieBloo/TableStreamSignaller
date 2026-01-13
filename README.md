# Table Stream API

This is the primary Node.js API for **Table Stream**. It handles the core game engine logic, WebSocket connections for real-time game state updates, and standard user authentication (Login/Signup).

---

## 📋 Features
- **Real-time Synchronization:** Manages game states via WebSockets.
- **User Management:** Secure signup, login, and session handling.
- **Extensible Scripts:** Includes a suite of maintenance and utility tools in `./scripts`.
- **Game Persistence:** Optional MongoDB integration for saving game history.

## 🛠 Prerequisites
- **Node.js:** `v19.2.0`
- **Redis:** Required for socket management and state caching.
- **MongoDB:** (Optional) Required only if you intend to persist game data.

> **Note:** The Card Classifier is a separate application and is not included in this repository.

---

## Environment Variables
To run this application, you must configure the following environment variables. You can create a `.env` file in the root directory:

| Variable | Description | Default / Required |
| :--- | :--- | :--- |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | **REQUIRED** |
| `REDIS_HOST` | Host address for your Redis instance | **REQUIRED** |
| `REDIS_PORT` | Port for your Redis instance | `19210` |
| `REDIS_PASSWORD`| Password for your Redis instance | **REQUIRED** |
| `APP_URL` | The URL of your frontend application | `http://localhost:4200` |
| `POKEMON_API_KEY`| Private key for Pokemon API integration | **SECRET** |
| `MONGODB_URI` | Connection string for MongoDB | **OPTIONAL** |

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
npm install -g nodemon
```

### 2. Run the api
```bash
nodemon
```
