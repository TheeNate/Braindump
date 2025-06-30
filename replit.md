# Personal Idea Management System

## Overview

This is a full-stack web application designed for personal idea management and organization. It's a sophisticated brain dump tool with AI-powered categorization and cross-category intelligence analysis. The system helps users capture, organize, and iterate on their ideas with the assistance of AI.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database ORM**: Drizzle ORM for type-safe database operations
- **AI Integration**: Anthropic Claude API for categorization and chat features

### Directory Structure
```
├── client/          # Frontend React application
├── server/          # Backend Express API
├── shared/          # Shared TypeScript schemas and types
├── migrations/      # Database migration files
└── attached_assets/ # Project documentation
```

## Key Components

### 1. Idea Capture System
- Large textarea interface for typing ideas
- Voice input using Web Speech API (webkitSpeechRecognition)
- Real-time transcription display
- Visual feedback for recording state

### 2. AI-Powered Categorization
- **Categories**: 5 predefined themes:
  - Progress & Growth (green, TrendingUp icon)
  - Value Creation (blue, Target icon)
  - Energy/Bitcoin (yellow, Zap icon)
  - Human Optimization (purple, Brain icon)
  - Needs Processing (gray, FileText icon)
- Confidence scoring (0-100%)
- Context-aware analysis using similar existing ideas
- Enhanced insights including key patterns and connections

### 3. Manual Override System
- Ideas below 50% confidence flagged with orange borders
- Manual recategorization modal with radio button selection
- User feedback collection for AI learning
- Color-coded confidence levels

### 4. Idea Organization Interface
- Collapsible cards grouped by category
- Two-level expansion system:
  - Level 1: AI analysis, action buttons, insights
  - Level 2: Full original text (if truncated)
- Truncated preview (80 characters) in collapsed state

### 5. Interactive Features
- **AI Iteration Chat**: Focused brainstorming on specific ideas
- **Discussion Interface**: Collaborative chat between Nate/Janae
- **Recategorization**: Manual category adjustment
- **Delete functionality**: Idea removal

### 6. Master Intelligence System
- Separate tab from main capture interface
- Master AI Chat for queries across all ideas
- Analytics dashboard with category distribution and patterns

## Data Flow

### Idea Creation Flow
1. User inputs idea via text or voice
2. System retrieves similar existing ideas for context
3. AI analyzes and categorizes the idea with confidence score
4. If confidence < 50%, system flags for manual review
5. Idea stored in database with AI insights

### AI Processing Flow
1. Anthropic Claude API (claude-sonnet-4-20250514) processes text
2. Context includes similar ideas for better categorization
3. Returns category, confidence, reasoning, and insights
4. System stores both AI analysis and user feedback

### Data Persistence
- PostgreSQL database via Neon serverless
- Drizzle ORM for type-safe operations
- Three main tables: ideas, discussions, ai_iterations
- Foreign key relationships maintain data integrity

## External Dependencies

### AI Services
- **Anthropic Claude API**: Primary AI service for categorization and chat
- Uses latest claude-sonnet-4-20250514 model
- Requires ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- Connection managed via @neondatabase/serverless package
- Requires DATABASE_URL environment variable

### Voice Input
- **Web Speech API**: Browser-native speech recognition
- Specifically uses webkitSpeechRecognition for Chrome compatibility
- No external API dependencies

### UI Components
- **Radix UI**: Headless UI components for accessibility
- **Lucide React**: Icon system
- **Tailwind CSS**: Utility-first styling framework

## Deployment Strategy

### Development
- Vite dev server for frontend hot reloading
- Express server with tsx for TypeScript execution
- Database schema managed via Drizzle migrations

### Production Build
- Frontend: Vite builds optimized React bundle
- Backend: esbuild bundles Express server for Node.js
- Static files served from Express in production

### Environment Variables
```
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-...
NODE_ENV=production|development
```

### Database Management
- Schema defined in shared/schema.ts
- Migrations generated via drizzle-kit
- Push schema changes with `npm run db:push`

## Changelog
```
Changelog:
- June 30, 2025. Initial setup
- June 30, 2025. Vector database integration completed with Pinecone and OpenAI embeddings
- June 30, 2025. Added comprehensive logging and debugging endpoints for troubleshooting
- June 30, 2025. Semantic similarity search now fully operational
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```