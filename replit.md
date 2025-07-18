# Sperm Analysis CASA System

## Overview

This is a comprehensive Computer-Aided Sperm Analysis (CASA) system built with a modern web stack. The application provides automated sperm motility analysis using AI/ML models, delivering detailed reports for medical diagnostics. It features a React-based frontend with a robust Express backend, utilizing PostgreSQL for data persistence and TensorFlow.js for AI-powered image analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent medical-grade UI
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Chart.js for data visualization and analysis results

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **API Pattern**: RESTful API with file upload capabilities using multer
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Hot reloading with Vite middleware integration

### Database Architecture
- **Database**: PostgreSQL with Drizzle ORM
- **Provider**: Neon Database (serverless PostgreSQL)
- **Schema**: Comprehensive analysis tracking with CASA metrics, cell counts, and statistical data
- **Storage**: File uploads stored locally with database metadata

## Key Components

### AI/ML Analysis Engine
- **TensorFlow.js**: Client-side machine learning for real-time sperm detection and classification
- **Advanced Tracker**: DeepSORT-equivalent tracking algorithm with motion prediction and feature matching
- **Image Processing**: Custom preprocessing pipeline for image enhancement and noise reduction
- **CASA Calculator**: Specialized algorithms for computing motility metrics (VAP, VCL, VSL, ALH, BCF)
- **Batch Processor**: Multi-file processing system with queue management and progress tracking

### Analysis Pipeline
1. **Image Preprocessing**: Contrast enhancement, noise reduction, and intensity normalization
2. **Cell Detection**: AI-powered sperm cell identification and classification
3. **Motility Tracking**: Movement pattern analysis for progressive/non-progressive classification
4. **CASA Metrics Calculation**: Standard fertility metrics computation
5. **Quality Assessment**: Morphology and vitality scoring

### Core Features
- **File Upload**: Drag-and-drop interface supporting JPEG, PNG, and TIFF formats (10MB limit)
- **Batch Processing**: Multi-file analysis with concurrent processing and queue management
- **Advanced Tracking**: DeepSORT-style cell tracking with motion prediction and feature similarity
- **Real-time Progress**: Step-by-step analysis tracking with live updates
- **Results Dashboard**: Interactive charts showing motility distribution and key metrics
- **Detailed Reports**: Comprehensive PDF-ready reports with all CASA parameters
- **Data Persistence**: Full analysis history with searchable records
- **Arabic Interface**: Complete Arabic language support for MENA region users

## Data Flow

1. **Image Upload**: User uploads sperm sample image through web interface
2. **Preprocessing**: Image enhancement using custom algorithms
3. **AI Analysis**: TensorFlow.js models detect and classify sperm cells
4. **Metrics Calculation**: CASA parameters computed from detected cells
5. **Results Storage**: Analysis data persisted to PostgreSQL database
6. **Report Generation**: Interactive dashboard and downloadable reports created

## External Dependencies

### Core Technologies
- **@tensorflow/tfjs**: Machine learning inference engine
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **multer**: File upload handling middleware
- **chart.js**: Data visualization library

### UI/UX Libraries
- **@radix-ui/***: Accessible component primitives
- **@tanstack/react-query**: Server state management
- **class-variance-authority**: Component variant management
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production builds
- **vite**: Development server with HMR

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express API integration
- **Hot Reloading**: Full-stack hot module replacement
- **Database**: Connection to Neon PostgreSQL instance
- **File Storage**: Local filesystem with uploads/ directory

### Production Build
- **Frontend**: Vite production build with optimized bundles
- **Backend**: esbuild compilation to ESM format
- **Database Migrations**: Drizzle Kit for schema management
- **Static Assets**: Served through Express with proper caching headers

### Key Configuration
- **TypeScript**: Strict mode with path mapping for clean imports
- **Database**: Environment-based connection with migration support
- **File Handling**: Configurable upload limits and type validation
- **Replit Integration**: Special handling for Replit development environment