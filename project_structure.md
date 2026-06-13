# SQLBOT Project Structure

This document outlines the directory structure for the SQLBOT project.

## Project Root
- `backend/`: Node.js/Express server logic.
- `frontend/`: React/Vite frontend application.

## Backend Structure (`/backend`)
- `config/`: Configuration files (database, env setup).
- `controllers/`: Request handlers for API endpoints.
- `middleware/`: Custom middleware (auth, logging, error handling).
- `models/`: Database schemas and models.
- `routes/`: API route definitions.
- `services/`: Business logic and external service integrations.
- `utils/`: Utility functions and helpers.
- `server.js`: Entry point for the backend server.

## Frontend Structure (`/frontend/src`)
- `assets/`: Static assets like images and fonts.
- `components/`: Reusable UI components.
- `contexts/`: React Context providers for state management.
- `hooks/`: Custom React hooks.
- `pages/`: View-level components (e.g., Home, Dashboard).
- `services/`: API client services.
- `utils/`: Helper functions and constants.
- `firebase/`: Firebase configuration and helpers.
- `App.jsx`: Main application component.
- `main.jsx`: Application entry point.
