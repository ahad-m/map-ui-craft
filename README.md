# 🏠 Smart Real Estate Assistant (Riyal Estate)

A full-stack web application that helps users find properties in Saudi Arabia using natural language queries in both Arabic and English. The system combines traditional SQL filtering with AI-powered semantic search to provide intelligent property recommendations.

## 📋 Project Overview

This application features:
- **Bilingual Support**: Full Arabic and English interface with RTL support
- **Natural Language Search**: Ask for properties in conversational language
- **AI-Powered Matching**: Uses GPT-4 and BGE-M3 embeddings for semantic search
- **Interactive Map**: Google Maps integration with property markers
- **Location-Based Services**: Find properties near schools, universities, and mosques
- **User Authentication**: Secure user accounts with favorites management
- **Hybrid Search**: Combines exact SQL filtering with vector similarity search

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Maps**: Google Maps Platform (@vis.gl/react-google-maps)
- **Internationalization**: i18next with react-i18next
- **Icons**: Lucide React

#### Backend
- **Framework**: FastAPI (Python 3.10+)
- **LLM Integration**: OpenAI GPT-4o-mini
- **Embeddings**: BAAI/bge-m3 via Sentence Transformers
- **Database**: PostgreSQL 13+ with PostGIS and pgvector extensions
- **Hosting**: Supabase (managed PostgreSQL)

## 📁 Folder Structure

```
project-root/
├── Backend/                      # Python FastAPI backend
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Configuration and environment settings
│   ├── models.py                # Pydantic models for API requests/responses
│   ├── database.py              # Database connection and queries
│   ├── llm_parser.py            # LLM integration for query parsing
│   ├── search_engine.py         # Property search logic (SQL + Vector)
│   ├── embedding_generator.py   # BGE-M3 embedding generation
│   ├── arabic_utils.py          # Arabic text normalization utilities
│   ├── requirements.txt         # Python dependencies
│   └── gunicorn_config.py       # Production server configuration
│
├── src/                         # React frontend source code
│   ├── components/              # React components
│   │   ├── MapScreen.tsx        # Main map interface component
│   │   ├── PropertyDetailsDialog.tsx  # Property details modal
│   │   └── ui/                  # shadcn/ui component library
│   │
│   ├── pages/                   # Page components (routes)
│   │   ├── Index.tsx            # Home page (redirects to map)
│   │   ├── Auth.tsx             # Login/signup page
│   │   ├── RealEstateSearch.tsx # Search interface page
│   │   ├── Profile.tsx          # User profile management
│   │   ├── AdminTables.tsx      # Admin data tables view
│   │   └── NotFound.tsx         # 404 error page
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts           # Authentication hook
│   │   ├── useFavorites.ts      # Favorites management hook
│   │   ├── useRealEstateAssistant.ts  # Chat assistant hook
│   │   ├── use-toast.ts         # Toast notifications hook
│   │   └── use-mobile.tsx       # Mobile detection hook
│   │
│   ├── api/                     # API client functions
│   │   └── realEstateAssistant.ts  # Backend API communication
│   │
│   ├── integrations/            # Third-party integrations
│   │   └── supabase/            # Supabase client and types
│   │       ├── client.ts        # Supabase client initialization
│   │       └── types.ts         # Generated database types
│   │
│   ├── i18n/                    # Internationalization
│   │   ├── config.ts            # i18next configuration
│   │   └── locales/             # Translation files
│   │       ├── ar.json          # Arabic translations
│   │       └── en.json          # English translations
│   │
│   ├── utils/                   # Utility functions
│   │   └── arabicUtils.ts       # Arabic text processing utilities
│   │
│   ├── lib/                     # Library utilities
│   │   └── utils.ts             # Common utility functions (cn helper)
│   │
│   ├── App.tsx                  # Root application component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles and design tokens
│
├── public/                      # Static assets
│   └── robots.txt               # SEO robots configuration
│
├── supabase/                    # Supabase configuration
│   ├── config.toml              # Supabase project configuration
│   └── migrations/              # Database migration files
│
├── .env                         # Environment variables (not in git)
├── package.json                 # Node.js dependencies
├── vite.config.ts               # Vite configuration
├── tailwind.config.ts           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or 20.x ([Install with nvm](https://github.com/nvm-sh/nvm))
- **Python** 3.10, 3.11, or 3.12 ([Install](https://www.python.org/downloads/))
- **PostgreSQL** 13+ with PostGIS and pgvector (or use Supabase)
- **Google Maps API Key** ([Get one here](https://developers.google.com/maps/documentation/javascript/get-api-key))
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

### Installation

#### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

#### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example if available)
cp .env.example .env

# Edit .env and add your API keys:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
# VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
# VITE_BACKEND_URL=http://localhost:8000

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:8080`

#### 3. Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file in Backend directory
# Add the following variables:
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_service_role_key
# OPENAI_API_KEY=your_openai_api_key
# DEBUG=True

# Start development server
python main.py
```

The backend will be available at `http://localhost:8000`

#### 4. Database Setup

If using Supabase:
1. Create a new project at [supabase.com](https://supabase.com)
2. Run migrations from `supabase/migrations/` folder
3. Ensure PostGIS and pgvector extensions are enabled
4. Load sample data (properties, schools, universities, mosques)

### Running in Production

#### Frontend
```bash
npm run build
# Deploy the 'dist' folder to your hosting provider
```

#### Backend
```bash
# Using Gunicorn (recommended)
gunicorn main:app -c gunicorn_config.py

# Or using Uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🔑 Environment Variables

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_BACKEND_URL=http://localhost:8000
```

### Backend (Backend/.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
OPENAI_API_KEY=sk-...
HUGGINGFACE_API_KEY=optional_hf_token
DEBUG=False
LLM_MODEL=gpt-4o-mini
```

## 📖 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/health` | GET | Health check |
| `/api/chat/welcome` | POST | Get welcome message |
| `/api/chat/query` | POST | Process natural language query |
| `/api/search` | POST | Search properties by criteria |
| `/api/properties/{id}` | GET | Get property details |
| `/api/feedback` | POST | Submit user feedback |

## 🎨 Design System

The application uses a comprehensive design system defined in:
- `src/index.css` - CSS variables and design tokens
- `tailwind.config.ts` - Tailwind configuration

### Color Tokens (HSL)
- Primary, secondary, accent colors
- Background and foreground variants
- Muted and border colors
- Destructive (error) colors

All components use semantic tokens (e.g., `bg-background`, `text-foreground`) rather than hardcoded colors.

## 🧪 Testing

### Backend Tests
```bash
cd Backend
pytest test_university_search.py
```

### Frontend Tests
```bash
npm test
```

## 🌍 Internationalization

The app supports Arabic and English:
- Translation files: `src/i18n/locales/`
- RTL support automatically enabled for Arabic
- Language switcher in UI

To add a new language:
1. Create `src/i18n/locales/{lang}.json`
2. Add translations following the existing structure
3. Update `src/i18n/config.ts` if needed

## 🔒 Security Notes

- Never commit `.env` files
- Use service role key only in backend, never in frontend
- Implement Row Level Security (RLS) policies in Supabase
- Validate all user inputs
- Use HTTPS in production
- Rotate API keys regularly

## 📚 Key Features Explained

### Natural Language Processing
The system uses OpenAI's GPT-4o-mini to parse user queries like:
- "أريد شقة في الرياض بسعر أقل من 500 ألف" (Arabic)
- "I need an apartment in Riyadh under 500k" (English)

The LLM extracts:
- Property type, purpose, location
- Price range, area, rooms
- Proximity requirements (schools, universities, mosques)

### Hybrid Search
Combines two approaches:
1. **Exact SQL Search**: Filters properties by precise criteria
2. **Vector Similarity Search**: Finds semantically similar properties using BGE-M3 embeddings

Results are scored and merged for optimal relevance.

### Location Services
- Find properties near specific schools (filtered by gender, level)
- Find properties near universities
- Find properties near mosques
- Calculate driving distances and times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary. All rights reserved.

## 👥 Team

Developed by [Your Team Name]

## 📞 Support

For issues or questions:
- Create an issue in this repository
- Contact: [your-email@example.com]

## 🗺️ Roadmap

- [ ] Add more property filters (furnished, parking, etc.)
- [ ] Implement property comparison feature
- [ ] Add price prediction using ML
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Property alerts and notifications

---

**Note**: This project uses Lovable for development. Visit [lovable.dev](https://lovable.dev) for more information.
