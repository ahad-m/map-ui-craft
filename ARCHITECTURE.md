# 🏛️ Architecture Documentation

## System Overview

The Smart Real Estate Assistant is a full-stack application with a **React frontend**, **FastAPI backend**, and **PostgreSQL database**. It uses AI to understand natural language queries and match users with relevant properties.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React 18 + TypeScript + Vite                        │   │
│  │  ├── MapScreen (Main Interface)                      │   │
│  │  ├── Chat Interface (Natural Language)               │   │
│  │  ├── Property Cards & Details                        │   │
│  │  └── User Authentication & Favorites                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕                                   │
│            REST API (JSON over HTTPS)                        │
│                          ↕                                   │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FastAPI + Python 3.10+                              │   │
│  │  ├── Query Parser (LLM Integration)                  │   │
│  │  ├── Search Engine (SQL + Vector)                    │   │
│  │  ├── Embedding Generator (BGE-M3)                    │   │
│  │  └── Location Services                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕                                   │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE & SERVICES                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │  PostgreSQL 13+ │  │  OpenAI API     │  │ Google Maps│  │
│  │  + PostGIS      │  │  (GPT-4o-mini)  │  │ Platform   │  │
│  │  + pgvector     │  └─────────────────┘  └────────────┘  │
│  │                 │                                         │
│  │  Tables:        │                                         │
│  │  - properties   │                                         │
│  │  - schools      │                                         │
│  │  - universities │                                         │
│  │  - mosques      │                                         │
│  │  - user profiles│                                         │
│  └─────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Query Flow

```
User Input → React Chat Component → Backend API
  ↓
LLM Parser (OpenAI GPT-4o-mini)
  ↓
Structured Criteria (JSON)
  ↓
Search Engine (Hybrid: SQL + Vector)
  ↓
PostgreSQL Query Execution
  ↓
Results Ranking & Formatting
  ↓
Response to Frontend
  ↓
Display on Map & Cards
```

### 2. Property Search Flow

```
User Criteria
  ↓
┌─────────────────────┬─────────────────────┐
│   Exact SQL Search  │  Vector Similarity  │
│   (Traditional DB)  │  (AI Embeddings)    │
└─────────────────────┴─────────────────────┘
  ↓                         ↓
  └──────── Merge & Rank ────┘
                ↓
         Final Results
```

## Component Details

### Frontend Architecture

#### Core Components

1. **MapScreen** (`src/components/MapScreen.tsx`)
   - Main application interface
   - Integrates Google Maps
   - Handles property markers and clustering
   - Manages chat interface
   - Coordinates all user interactions

2. **PropertyDetailsDialog** (`src/components/PropertyDetailsDialog.tsx`)
   - Modal for detailed property view
   - Shows images, specs, nearby services
   - Handles favorites toggle
   - Links to external property URLs

3. **UI Components** (`src/components/ui/`)
   - shadcn/ui library components
   - Customized with Tailwind
   - Reusable across application

#### Custom Hooks

1. **useRealEstateAssistant** (`src/hooks/useRealEstateAssistant.ts`)
   - Manages chat state
   - Handles message sending/receiving
   - Processes search results
   - Manages loading states

2. **useAuth** (`src/hooks/useAuth.ts`)
   - User authentication logic
   - Session management
   - Protected route handling

3. **useFavorites** (`src/hooks/useFavorites.ts`)
   - Manages user's favorite properties
   - Add/remove favorites
   - Syncs with Supabase

#### State Management

- **TanStack Query**: Server state caching and synchronization
- **React Context**: Global state (auth, language)
- **Local State**: Component-specific state (useState, useReducer)

### Backend Architecture

#### Main Modules

1. **main.py** - FastAPI application
   - Route definitions
   - Request/response handling
   - CORS configuration
   - Error handling

2. **llm_parser.py** - LLM Integration
   - OpenAI API communication
   - Query parsing logic
   - Structured output extraction
   - Error handling and retries

3. **search_engine.py** - Search Logic
   - Hybrid search implementation
   - SQL query construction
   - Vector similarity search
   - Result ranking and merging

4. **embedding_generator.py** - Embeddings
   - BGE-M3 model loading
   - Text embedding generation
   - Batch processing
   - Caching optimization

5. **database.py** - Database Layer
   - Supabase client management
   - Query execution
   - Connection pooling
   - Error handling

6. **models.py** - Data Models
   - Pydantic schemas
   - Request/response validation
   - Type safety
   - Documentation

7. **arabic_utils.py** - Text Processing
   - Arabic normalization
   - Diacritic removal
   - Character standardization

#### API Design

**RESTful Architecture**
- Resource-based URLs
- HTTP methods (GET, POST)
- JSON payloads
- Standard status codes

**Error Handling**
- Consistent error format
- Appropriate HTTP status codes
- Detailed error messages
- Logging for debugging

### Database Schema

#### Properties Table

```sql
CREATE TABLE properties (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  property_type TEXT,
  purpose TEXT,
  price_num NUMERIC,
  price_currency TEXT,
  price_period TEXT,
  area_m2 NUMERIC,
  rooms INTEGER,
  baths INTEGER,
  halls INTEGER,
  district TEXT,
  city TEXT,
  lat NUMERIC,
  lon NUMERIC,
  final_lat NUMERIC,
  final_lon NUMERIC,
  image_url TEXT,
  url TEXT,
  time_to_metro_min INTEGER,
  embedding TEXT,
  search_text TEXT
);
```

#### Supporting Tables

- **schools**: School locations with levels and gender
- **universities**: University locations (Arabic/English names)
- **mosques**: Mosque locations
- **user_favorites**: User-property relationships
- **profiles**: User profile information

#### Spatial Indexes

```sql
-- PostGIS spatial index for distance queries
CREATE INDEX idx_properties_location ON properties 
USING GIST (ST_MakePoint(lon, lat));

-- pgvector HNSW index for similarity search
CREATE INDEX idx_property_vectors_embedding ON property_vectors 
USING hnsw (embedding vector_cosine_ops);
```

## AI/ML Components

### Large Language Model (LLM)

**Model**: OpenAI GPT-4o-mini

**Purpose**:
- Parse natural language queries
- Extract structured search criteria
- Generate user-friendly responses
- Handle Arabic and English

**Input Example**:
```
"أبحث عن شقة في حي النرجس بالرياض بسعر أقل من 500 ألف قريبة من مدرسة بنات"
```

**Output Example**:
```json
{
  "property_type": "apartment",
  "district": "النرجس",
  "city": "الرياض",
  "max_price": 500000,
  "currency": "SAR",
  "school_requirements": {
    "max_distance_meters": 2000,
    "gender": "female"
  }
}
```

### Embedding Model

**Model**: BAAI/bge-m3 (via Sentence Transformers)

**Purpose**:
- Generate semantic embeddings for properties
- Enable similarity-based search
- Support multilingual queries

**Specifications**:
- Dimension: 1024
- Languages: 100+ including Arabic
- Context length: 8192 tokens

**Usage**:
```python
embeddings = model.encode([text], normalize_embeddings=True)
```

### Hybrid Search Algorithm

**Scoring Function**:
```
final_score = (sql_weight × sql_score) + (vector_weight × vector_score)
```

**Default Weights**:
- SQL Weight: 0.7 (exact matches)
- Vector Weight: 0.3 (semantic similarity)

**Process**:
1. Execute SQL query with filters
2. Generate query embedding
3. Perform vector similarity search
4. Merge results by property ID
5. Calculate combined scores
6. Sort and return top matches

## Security Architecture

### Authentication

- **Provider**: Supabase Auth
- **Methods**: Email/password, Google OAuth
- **Tokens**: JWT with refresh tokens
- **Session**: Stored in localStorage

### Authorization

- **Row Level Security (RLS)**: Enabled on user-specific tables
- **API Keys**: Stored in environment variables
- **CORS**: Configured for allowed origins

### Data Protection

- **Encryption**: HTTPS in production
- **SQL Injection**: Prevented by parameterized queries
- **XSS**: React auto-escaping
- **CSRF**: Token-based protection

## Performance Optimization

### Frontend

1. **Code Splitting**: Route-based lazy loading
2. **Image Optimization**: Lazy loading, WebP format
3. **Bundle Size**: Tree shaking, minification
4. **Caching**: TanStack Query cache, browser cache

### Backend

1. **Connection Pooling**: PostgreSQL connection pool
2. **Query Optimization**: Indexed columns, efficient joins
3. **Caching**: Embedding cache, query result cache
4. **Async Processing**: FastAPI async endpoints

### Database

1. **Indexes**: 
   - B-tree on frequently filtered columns
   - GiST for spatial queries
   - HNSW for vector search
2. **Query Planning**: ANALYZE and EXPLAIN
3. **Partitioning**: (Future) Date-based partitioning

## Scalability Considerations

### Horizontal Scaling

- **Frontend**: Static files on CDN
- **Backend**: Multiple FastAPI instances behind load balancer
- **Database**: Read replicas for query load

### Vertical Scaling

- **Database**: Increase RAM for larger cache
- **Backend**: More CPU cores for embedding generation

### Caching Strategy

1. **Browser Cache**: Static assets (images, CSS, JS)
2. **Application Cache**: Query results, embeddings
3. **Database Cache**: PostgreSQL shared buffers

## Monitoring & Logging

### Application Logs

- **Frontend**: Console errors, user actions
- **Backend**: Request/response logs, errors
- **Database**: Slow query logs

### Metrics

- **Response Times**: API endpoint latency
- **Error Rates**: Failed requests per endpoint
- **Resource Usage**: CPU, memory, disk

### Tools

- **Supabase Dashboard**: Database metrics
- **FastAPI Logs**: Application-level logging
- **Browser DevTools**: Frontend debugging

## Deployment Architecture

### Development

```
Local Machine
├── Frontend (Vite dev server, :8080)
├── Backend (Uvicorn, :8000)
└── Database (Local PostgreSQL or Supabase cloud)
```

### Production

```
Cloud Infrastructure
├── Frontend (Static hosting: Vercel/Netlify/Lovable)
├── Backend (Container: Docker + Gunicorn)
├── Database (Supabase managed PostgreSQL)
└── CDN (Cloudflare/AWS CloudFront)
```

## Technology Decisions

### Why React?
- Component reusability
- Large ecosystem
- TypeScript support
- Excellent developer experience

### Why FastAPI?
- Async support (high concurrency)
- Automatic API documentation
- Pydantic validation
- Python ML ecosystem

### Why PostgreSQL?
- ACID compliance
- PostGIS for spatial queries
- pgvector for embeddings
- Proven reliability

### Why Hybrid Search?
- Exact matches for specific criteria
- Semantic understanding for fuzzy queries
- Best of both worlds
- Flexible weighting

## Future Improvements

1. **GraphQL API**: More efficient data fetching
2. **Real-time Updates**: WebSocket for live property updates
3. **Advanced ML**: Property price prediction
4. **Mobile App**: React Native version
5. **Microservices**: Separate services for search, chat, etc.
6. **Kubernetes**: Container orchestration for scaling
7. **Redis Cache**: Distributed caching layer
8. **Message Queue**: RabbitMQ/Kafka for async tasks

---

This architecture is designed for:
- **Performance**: Fast response times
- **Scalability**: Handle growing user base
- **Maintainability**: Clean, organized code
- **Extensibility**: Easy to add new features
