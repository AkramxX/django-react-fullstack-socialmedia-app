# 📱 Social Media App

A full-stack social media application built with **Django REST Framework** and **React**. Features real-time messaging via WebSockets, user authentication with JWT, and a modern responsive UI.

![Django](https://img.shields.io/badge/Django-6.0-green?logo=django)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)

## Features

### Core Functionality

- **User Authentication** - Secure JWT-based authentication with HTTP-only cookies
- **User Profiles** - Customizable profiles with bio and profile images
- **Posts** - Create, view, and interact with posts
- **Like System** - Like and unlike posts
- **Follow System** - Follow/unfollow other users
- **User Search** - Find and discover other users

### Real-Time Messaging

- **WebSocket Integration** - Real-time chat using Django Channels
- **Private Conversations** - Direct messaging between users
- **Message History** - Persistent message storage
- **Online Presence** - Real-time connection status

## 🛠️ Tech Stack

### Backend

| Technology            | Purpose           |
| --------------------- | ----------------- |
| Django 6.0            | Web framework     |
| Django REST Framework | API development   |
| Django Channels       | WebSocket support |
| PostgreSQL            | Database          |
| Simple JWT            | Authentication    |
| Daphne                | ASGI server       |

### Frontend

| Technology     | Purpose     |
| -------------- | ----------- |
| React 19       | UI library  |
| Vite           | Build tool  |
| Tailwind CSS 4 | Styling     |
| React Router 7 | Navigation  |
| Axios          | HTTP client |

## 📁 Project Structure

```
├── backend/
│   ├── config/          # Django settings & ASGI config
│   ├── base/            # User model, posts, authentication
│   ├── messaging/       # Real-time chat (WebSocket consumers)
│   ├── media/           # User uploads
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/         # API endpoint definitions
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts (Auth, WebSocket)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── routes/      # Page components
│   │   └── services/    # WebSocket service
│   └── package.json
```

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL
-

### Backend Setup

1. **Navigate to the backend directory**

   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**

   Create a `.env` file in the `backend/` directory:

   ```env
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

5. **Run database migrations**

   ```bash
   python manage.py migrate
   ```

6. **Start the development server**
   ```bash
   daphne -b 127.0.0.1 -p 8000 config.asgi:application
   ```

### Frontend Setup

1. **Navigate to the frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open the app**

   Visit `http://localhost:5173` in your browser

## 📡 API Endpoints

### Authentication

| Method | Endpoint              | Description           |
| ------ | --------------------- | --------------------- |
| POST   | `/api/register/`      | Register new user     |
| POST   | `/api/token/`         | Login (obtain tokens) |
| POST   | `/api/token/refresh/` | Refresh access token  |
| POST   | `/api/logout/`        | Logout user           |

### Users

| Method | Endpoint                    | Description      |
| ------ | --------------------------- | ---------------- |
| GET    | `/api/user/`                | Get current user |
| GET    | `/api/users/<username>/`    | Get user profile |
| PUT    | `/api/user/edit/`           | Update profile   |
| POST   | `/api/follow/<username>/`   | Follow user      |
| POST   | `/api/unfollow/<username>/` | Unfollow user    |
| GET    | `/api/search/`              | Search users     |

### Posts

| Method | Endpoint                | Description    |
| ------ | ----------------------- | -------------- |
| GET    | `/api/posts/`           | List all posts |
| POST   | `/api/posts/create/`    | Create post    |
| POST   | `/api/posts/<id>/like/` | Toggle like    |

### Messaging

| Method | Endpoint                             | Description        |
| ------ | ------------------------------------ | ------------------ |
| GET    | `/api/messaging/conversations/`      | List conversations |
| GET    | `/api/messaging/conversations/<id>/` | Get conversation   |
| POST   | `/api/messaging/conversations/`      | Start conversation |

### WebSocket

| Endpoint                                         | Description         |
| ------------------------------------------------ | ------------------- |
| `ws://localhost:8000/ws/chat/<conversation_id>/` | Real-time messaging |

## 🔐 Environment Variables

| Variable      | Description                        |
| ------------- | ---------------------------------- |
| `DB_NAME`     | PostgreSQL database name           |
| `DB_USER`     | Database username                  |
| `DB_PASSWORD` | Database password                  |
| `DB_HOST`     | Database host (default: localhost) |
| `DB_PORT`     | Database port (default: 5432)      |
