# Daily Spark Application

A web application that provides daily doses of inspiration through jokes, facts, ideas, and quotes. The application features a mix of AI-generated and user-submitted content.

## Features

- **Four Content Types**: Jokes, Facts, Ideas, and Quotes
- **AI Integration**: OpenAI-powered content generation
- **User Contributions**: Users can submit their own content
- **Content Moderation**: AI-powered content filtering
- **Responsive Design**: Works on desktop and mobile devices
- **Social Sharing**: Easy sharing and downloading of content

## Technology Stack

### Frontend
- Angular 16
- Tailwind CSS
- HTML2Canvas for image export
- RxJS for state management

### Backend
- Node.js with Express
- MongoDB with Mongoose
- OpenAI API integration
- Express Validator for input validation

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- OpenAI API key

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

4. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Add your MongoDB connection string
   - Add your OpenAI API key

5. Seed the database (optional):
   ```bash
   cd backend
   npm run seed
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:4200`

## API Endpoints

- `GET /api/content/:type` - Get content by type (joke, fact, idea, quote)
- `POST /api/content` - Submit new content
- `GET /api/content/:type/random` - Get random content
- `POST /api/generate/:type` - Generate AI content
- `GET /api/health` - Health check endpoint

## Project Structure

```
daily-spark-app/
├── frontend/                 # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Angular components
│   │   │   └── services/     # Angular services
│   │   ├── assets/          # Static assets
│   │   └── environments/    # Environment configuration
│   ├── angular.json         # Angular configuration
│   └── tailwind.config.js   # Tailwind CSS configuration
├── backend/                 # Node.js application
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utility functions
│   ├── scripts/             # Database scripts
│   └── server.js            # Main server file
└── docs/                    # Documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
