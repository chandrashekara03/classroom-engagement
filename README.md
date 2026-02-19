# Classroom Engagement Platform

A unified web platform for interactive classroom activities, supporting quizzes, polls, group formation, and real-time engagement without participant limits.

## Features

- **Real-time Synchronization**: Activities update instantly across all devices
- **Scalable**: No hard limits on class size
- **Mobile-first**: Responsive design for all devices
- **Teacher Dashboard**: Control sessions, timers, and moderation
- **Student Interface**: Easy joining and participation
- **Activity Types**: Quizzes, polls, feedback, group formation, and more

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Real-time**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **Deployment**: Vercel

## Setup Instructions

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication and Realtime Database
   - Get your Firebase config from Project Settings

3. **Configure Environment Variables**
   - Copy `.env.local` and fill in your Firebase config:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Project Structure

- `src/app/` - Next.js app router pages
- `src/components/` - Reusable React components
- `src/lib/` - Firebase configuration and utilities

## Usage

- **Teachers**: Visit `/teacher` to create and manage sessions
- **Students**: Visit `/student` to join sessions with a code

## Future Enhancements

- AI-assisted content framing
- Event management for hackathons
- Custom activity marketplace
- Advanced analytics and reporting
