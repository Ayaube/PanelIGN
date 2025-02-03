# IGN WindSurf Project Management Tool

## Prerequisites

1. Install Node Version Manager (nvm):
   ```bash
   # For macOS/Linux:
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

   # For Windows:
   # Download and install nvm-windows from: https://github.com/coreybutler/nvm-windows/releases
   ```

2. Restart your terminal after installing nvm

## Setup

1. Clone the repository:
   ```bash
   git clone [your-repository-url]
   cd IGNWindSurf
   ```

2. Install the correct Node.js version:
   ```bash
   nvm install
   nvm use
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the application:
   ```bash
   # For development with auto-reload:
   npm run dev

   # For production:
   npm start
   ```

The application will be available at http://localhost:3000

## Database Configuration

Make sure to configure your database connection in `app/backend/config/database.js`

## Project Structure

- `app/backend/` - Backend Node.js server
- `app/frontend/` - Frontend static files
- `app/backend/config/` - Configuration files
- `app/backend/controllers/` - Request handlers
- `app/backend/models/` - Database models
- `app/backend/services/` - Business logic
