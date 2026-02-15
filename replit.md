# Heartfelt - AI Greeting Card Generator

## Overview

Heartfelt is an AI-powered greeting card generator web application. Users select an occasion (birthday, valentine's, anniversary, etc.), choose a tone (romantic, funny, heartfelt, poetic), enter recipient/sender names, and optionally add a custom note. The app uses OpenAI (via Replit AI Integrations) to generate personalized greeting card messages, which are displayed on themed card backgrounds. Generated cards are saved to a PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (warm pink/rose color palette)
- **Animations**: Framer Motion for page transitions and confetti effects
- **Build Tool**: Vite with HMR in development
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Runtime**: Node.js with TypeScript (via tsx)
- **Framework**: Express 5
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Key Endpoints**:
  - `POST /api/cards/generate` - Generate a greeting card message using AI and save to database
  - Additional CRUD endpoints for cards (get, list, delete)
- **AI Integration**: MiniMax API authenticated with `MINIMAX_API_KEY` secret:
  - Text generation: `MiniMax-M2.5` model via `https://api.minimax.io/v1/text/chatcompletion_v2`
  - Image generation: `image-01` model via `https://api.minimax.io/v1/image_generation` (3:4 aspect ratio)
  - Video generation: `MiniMax-Hailuo-02` model via `https://api.minimax.io/v1/video_generation` (async: submit task → poll status → retrieve file). Uses first-frame (AI art) + last-frame (text card as base64) mode. Polling via `/api/cards/video-status/:taskId` every 10s. Takes ~4-5 minutes.
- **Build**: esbuild bundles server code for production into `dist/index.cjs`

### Shared Code
- **Location**: `shared/` directory contains database schema and types used by both client and server
- **Schema Definition**: Drizzle ORM with Zod validation schemas via `drizzle-zod`
- **Key Tables**:
  - `users` - Basic user table (id as UUID, username, password)
  - `greeting_cards` - Stores generated cards (occasion, recipientName, senderName, tone, message, backgroundTheme, customNote, createdAt)
  - `conversations` and `messages` - Chat/conversation tables (defined in `shared/models/chat.ts`, used by Replit integrations)

### Database
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with `node-postgres` (pg) driver
- **Connection**: Via `DATABASE_URL` environment variable
- **Schema Management**: `drizzle-kit push` for schema migrations (`npm run db:push`)
- **Storage Layer**: `DatabaseStorage` class in `server/storage.ts` implements `IStorage` interface for greeting cards

### Replit Integrations
The `server/replit_integrations/` and `client/replit_integrations/` directories contain pre-built integration modules:
- **Chat**: Conversation/message CRUD with OpenAI streaming
- **Audio**: Voice recording, playback, and speech-to-text/text-to-speech
- **Image**: Image generation via `gpt-image-1` model
- **Batch**: Batch processing utilities with rate limiting and retries

These are utility modules that can be registered as needed. The main app currently uses the OpenAI integration directly for card message generation.

### Development vs Production
- **Development**: Vite dev server with HMR, served through Express middleware (`server/vite.ts`)
- **Production**: Client built to `dist/public/`, server bundled to `dist/index.cjs`, static files served by Express

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `MINIMAX_API_KEY` - MiniMax API key for AI card message generation (required)

### Key NPM Packages
- **Server**: express, drizzle-orm, pg, openai, connect-pg-simple, express-session
- **Client**: react, react-dom, wouter, @tanstack/react-query, framer-motion, lucide-react
- **UI Library**: Full shadcn/ui component set (40+ Radix UI primitives)
- **Validation**: zod, drizzle-zod, @hookform/resolvers
- **Fonts**: Google Fonts (DM Sans, Architects Daughter, Fira Code, Geist Mono, Playfair Display, Lora)

### Services
- **PostgreSQL**: Primary data store for greeting cards, users, and conversations
- **MiniMax API**: Text generation for card messages using MiniMax-M2.5 model