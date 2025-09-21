Transportation App API

This is the backend API for the Transportation App, built with Node.js, Express, and Prisma.

---

## Installation

# Clone the repository
git clone https://github.com/yourusername/tranportationAppAPI.git
cd tranportationAppAPI

# Install dependencies
npm install

# Set up environment variables
# Create a .env file in the project root with the following content:
# DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Run Prisma migrations
npx prisma migrate dev --name init

# Start the development server
npm run server

