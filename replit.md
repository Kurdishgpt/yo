# Kurdish Dubbing Application

## Overview

This is a Kurdish dubbing and translation application that allows users to upload video or audio files, extract audio, transcribe speech using OpenAI Whisper, and generate synchronized Kurdish subtitles. The application provides a professional interface for media processing with a focus on Kurdish language support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type safety and modern component development
- Vite as the build tool for fast development and optimized production builds
- Wouter for lightweight client-side routing
- TanStack Query for server state management and API communication

**UI Framework:**
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design system
- Support for both light and dark modes with theme toggle functionality
- Kurdish cultural design elements (green primary color representing Kurdish flag)

**Component Architecture:**
- Modular component structure with separation of concerns
- Custom components: FileUpload (drag-and-drop), ProcessingStatus (multi-step progress), ResultCard (display outputs), AudioPlayer (playback controls)
- Centralized styling through CSS variables for consistent theming
- Path aliases (@/, @shared/, @assets/) for clean imports

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Node.js runtime environment
- ESM module system throughout the application

**API Design:**
- RESTful API endpoints under `/api` prefix
- Multer middleware for handling file uploads (100MB limit)
- File storage in `uploads/` directory
- JSON response format for consistency

**Media Processing Pipeline:**
1. File upload handling via multipart/form-data
2. Audio extraction using fluent-ffmpeg (converts to MP3)
3. Speech-to-text transcription via Python Whisper integration
4. SRT subtitle generation from transcription segments
5. Return structured JSON with transcription text and segments

**Python Integration:**
- External Python script (`whisper_transcribe.py`) called via child_process
- OpenAI Whisper model (base) for speech recognition
- JSON-based communication between Node.js and Python processes

### Data Storage Solutions

**Current Implementation:**
- In-memory storage using Map data structure (MemStorage class)
- User management with basic CRUD operations
- Temporary file storage in `uploads/` directory

**Database Schema (Drizzle ORM):**
- PostgreSQL dialect configured via Drizzle Kit
- Users table with id, username, password fields
- UUID generation for primary keys
- Zod schemas for validation

**Future Database Integration:**
- Drizzle ORM ready for PostgreSQL connection
- Migration files stored in `migrations/` directory
- Environment-based DATABASE_URL configuration
- Connection via Neon serverless driver

### Authentication and Authorization

**Current State:**
- User schema defined with username/password fields
- No active authentication middleware implemented
- Session infrastructure not yet configured

**Planned Implementation:**
- User registration and login endpoints
- Session management with connect-pg-simple for PostgreSQL-backed sessions
- Password hashing (schema defined but implementation pending)

### External Dependencies

**Media Processing:**
- **FFmpeg** (via fluent-ffmpeg): Audio/video format conversion and extraction
- **OpenAI Whisper**: Speech recognition and transcription (Python library)

**Frontend Libraries:**
- **Radix UI**: Accessible component primitives (dialogs, popovers, accordions, etc.)
- **React Hook Form**: Form state management with @hookform/resolvers for validation
- **Axios**: HTTP client for file upload progress tracking
- **date-fns**: Date formatting and manipulation

**Development Tools:**
- **Replit Plugins**: Development banner, cartographer, runtime error overlay
- **TypeScript**: Type checking and enhanced developer experience
- **PostCSS**: CSS processing with Autoprefixer

**Design System:**
- **Inter Font** (Google Fonts): Primary typography
- **JetBrains Mono**: Monospace font for code/SRT display
- Custom CSS variables for theme customization
- Material Design principles adapted for media workflow

**Planned Integrations:**
- Translation API for Kurdish language translation
- Text-to-speech service for dubbing generation
- Cloud storage for processed media files

## Deployment Options

### Vercel Deployment

**Configuration Files:**
- `vercel.json` - Vercel deployment configuration with serverless function settings
- `api/index.ts` - Serverless function wrapper for Express application
- `.vercelignore` - Excludes unnecessary files from deployment

**Vercel-Specific Adaptations:**
- File uploads use `/tmp` directory when `process.env.VERCEL` is set
- Serverless function configured with 3GB memory and 300s timeout
- All routes properly configured to handle Express static file serving

**Important Limitations:**
- Whisper and Demucs models may exceed Vercel's 50MB deployment limit (250MB on Pro)
- Execution time limits: 10s (Hobby), 60s (Pro), 900s (Enterprise)
- `/tmp` storage is ephemeral - files don't persist between invocations
- Recommended to use external model APIs or cloud processing for production

**Documentation:**
- See `VERCEL_DEPLOYMENT.md` for complete deployment guide
- Includes environment variable setup, build configuration, and troubleshooting