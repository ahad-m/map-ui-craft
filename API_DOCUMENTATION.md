# API Documentation

Complete API reference for the Smart Real Estate Assistant backend.

**Base URL**: `http://localhost:8000` (Development)

**Production URL**: `https://your-domain.com/api` (Update with actual URL)

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health & Info](#health--info)
  - [Chat & Query Processing](#chat--query-processing)
  - [Property Search](#property-search)
  - [Property Details](#property-details)
  - [Feedback](#feedback)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

Currently, the API does not require authentication for most endpoints. User-specific features (favorites, profiles) use Supabase Authentication with JWT tokens.

**Future**: Bearer token authentication will be implemented.

---

## Endpoints

### Health & Info

#### Get API Information

**Endpoint**: `GET /`

**Description**: Returns basic information about the API

**Response**:
```json
{
  "app": "المساعد العقاري الذكي",
  "version": "1.0.0",
  "status": "running",
  "message": "مرحباً بك في المساعد العقاري الذكي! 🏡"
}
```

**Status Codes**:
- `200 OK`: Success

---

#### Health Check

**Endpoint**: `GET /health`

**Description**: Check if the API is healthy and running

**Response**:
```json
{
  "status": "healthy",
  "model": "gpt-4o-mini"
}
```

**Status Codes**:
- `200 OK`: Service is healthy
- `503 Service Unavailable`: Service is down

---

### Chat & Query Processing

#### Get Welcome Message

**Endpoint**: `POST /api/chat/welcome`

**Description**: Get the initial welcome message for new users

**Request Body**: `{}` (Empty)

**Response**:
```json
{
  "message": "مرحباً فيك! أنا مساعدك العقاري الذكي 🏡\nاطلب اللي تبي وأنا بجيبه لك",
  "type": "welcome"
}
```

**Status Codes**:
- `200 OK`: Success

---

#### Process User Query

**Endpoint**: `POST /api/chat/query`

**Description**: Process natural language query and extract search criteria

**Request Body**:
```json
{
  "message": "أبي شقة في حي النرجس بسعر أقل من 500 ألف قريبة من مدرسة بنات"
}
```

**Response**:
```json
{
  "success": true,
  "message": "فهمت طلبك! تبي شقة في حي النرجس...",
  "criteria": {
    "purpose": "للبيع",
    "property_type": "شقق",
    "district": "النرجس",
    "city": "الرياض",
    "price": {
      "min": null,
      "max": 500000,
      "currency": "SAR",
      "period": null
    },
    "school_requirements": {
      "required": true,
      "gender": "بنات",
      "max_distance_minutes": 10
    }
  },
  "needs_clarification": false,
  "clarification_questions": [],
  "original_query": "أبي شقة في حي النرجس..."
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | User's natural language query in Arabic or English |

**Status Codes**:
- `200 OK`: Query processed successfully
- `400 Bad Request`: Invalid query format
- `500 Internal Server Error`: Processing error

---

### Property Search

#### Search Properties

**Endpoint**: `POST /api/search`

**Description**: Search for properties based on extracted criteria

**Request Body**:
```json
{
  "mode": "exact",
  "criteria": {
    "purpose": "للبيع",
    "property_type": "فلل",
    "district": "النرجس",
    "city": "الرياض",
    "price": {
      "min": null,
      "max": 1000000,
      "currency": "SAR",
      "period": null
    },
    "rooms": {
      "min": 4,
      "max": null,
      "exact": null
    },
    "area_m2": {
      "min": 300,
      "max": null
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "لقيت لك 15 عقار مطابق! 🎉",
  "criteria": { /* criteria object */ },
  "properties": [
    {
      "id": "prop_123",
      "title": "فيلا فاخرة في النرجس",
      "description": "فيلا حديثة مع حديقة واسعة",
      "property_type": "فلل",
      "purpose": "للبيع",
      "price_num": 850000,
      "price_currency": "SAR",
      "price_period": null,
      "area_m2": 450,
      "rooms": 5,
      "baths": 4,
      "halls": 2,
      "district": "النرجس",
      "city": "الرياض",
      "lat": 24.7136,
      "lon": 46.6753,
      "image_url": "https://example.com/image.jpg",
      "url": "https://example.com/property/123",
      "nearby_schools": [
        {
          "name": "مدرسة النور",
          "distance_meters": 500,
          "gender": "بنات"
        }
      ],
      "nearby_universities": [],
      "nearby_mosques": []
    }
  ],
  "total_count": 15,
  "search_mode": "exact"
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| mode | string | Yes | Search mode: "exact" or "similar" |
| criteria | object | Yes | PropertyCriteria object |

**Search Modes**:

- **exact**: Strict matching - only properties that meet all criteria
- **similar**: Hybrid search - combines exact matches with semantically similar properties

**Status Codes**:
- `200 OK`: Search completed (even if 0 results)
- `400 Bad Request`: Invalid criteria
- `500 Internal Server Error`: Search error

---

### Property Details

#### Get Property by ID

**Endpoint**: `GET /api/properties/{property_id}`

**Description**: Get detailed information for a specific property

**URL Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| property_id | string | Yes | Unique property identifier |

**Example Request**:
```
GET /api/properties/prop_123
```

**Response**:
```json
{
  "id": "prop_123",
  "title": "فيلا فاخرة في النرجس",
  "description": "فيلا حديثة مع حديقة واسعة ومسبح خاص...",
  "property_type": "فلل",
  "purpose": "للبيع",
  "price_num": 850000,
  "price_currency": "SAR",
  "price_period": null,
  "area_m2": 450,
  "rooms": 5,
  "baths": 4,
  "halls": 2,
  "district": "النرجس",
  "city": "الرياض",
  "lat": 24.7136,
  "lon": 46.6753,
  "final_lat": 24.7136,
  "final_lon": 46.6753,
  "image_url": "https://example.com/image.jpg",
  "url": "https://example.com/property/123",
  "time_to_metro_min": 15,
  "nearby_schools": [],
  "nearby_universities": [],
  "nearby_mosques": []
}
```

**Status Codes**:
- `200 OK`: Property found
- `404 Not Found`: Property does not exist
- `500 Internal Server Error`: Database error

---

### Feedback

#### Submit Feedback

**Endpoint**: `POST /api/feedback`

**Description**: Submit user feedback about the application

**Request Body**:
```json
{
  "rating": 5,
  "comment": "تطبيق ممتاز وسهل الاستخدام!",
  "user_email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "شكراً لك! تم استلام ملاحظاتك بنجاح 🙏"
}
```

**Status Codes**:
- `200 OK`: Feedback received
- `500 Internal Server Error`: Failed to save feedback

---

## Data Models

### PropertyCriteria

Search criteria for finding properties.

```typescript
{
  purpose: "للبيع" | "للايجار",  // Required
  property_type: "فلل" | "بيت" | "شقق" | "استوديو" | "دور" | "تاون هاوس" | "دوبلكس" | "عمائر",  // Required
  district?: string,
  city?: string,
  
  rooms?: {
    min?: number,
    max?: number,
    exact?: number
  },
  
  baths?: {
    min?: number,
    max?: number,
    exact?: number
  },
  
  halls?: {
    min?: number,
    max?: number,
    exact?: number
  },
  
  area_m2?: {
    min?: number,
    max?: number
  },
  
  price?: {
    min?: number,
    max?: number,
    currency: string,  // Default: "SAR"
    period?: "سنوي" | "شهري" | "يومي"
  },
  
  metro_time_max?: number,
  
  school_requirements?: {
    required: boolean,
    levels?: string[],  // ["elementary", "middle", "high"]
    gender?: "بنين" | "بنات" | "مختلط",
    max_distance_minutes?: number
  },
  
  university_requirements?: {
    required: boolean,
    university_name?: string,
    max_distance_minutes?: number
  },
  
  mosque_requirements?: {
    required: boolean,
    mosque_name?: string,
    max_distance_minutes?: number,
    walking?: boolean
  },
  
  original_query?: string
}
```

### Property

Property listing object.

```typescript
{
  id: string,
  title: string,
  description: string,
  property_type: string,
  purpose: string,
  
  price_num: number,
  price_currency: string,
  price_period: string | null,
  
  area_m2: number,
  rooms: number,
  baths: number,
  halls: number,
  
  district: string,
  city: string,
  
  lat: number,
  lon: number,
  final_lat: number,
  final_lon: number,
  
  image_url: string,
  url: string,
  
  time_to_metro_min: number | null,
  
  nearby_schools: School[],
  nearby_universities: University[],
  nearby_mosques: Mosque[]
}
```

### School

School information.

```typescript
{
  id: string,
  name: string,
  lat: number,
  lon: number,
  distance_meters: number,
  gender: string,
  levels: string[]
}
```

### University

University information.

```typescript
{
  name_ar: string,
  name_en: string,
  lat: number,
  lon: number,
  distance_meters: number
}
```

### Mosque

Mosque information.

```typescript
{
  name: string,
  lat: number,
  lon: number,
  distance_meters: number
}
```

---

## Error Handling

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 400 | Bad Request | Invalid input, missing required fields |
| 404 | Not Found | Property ID doesn't exist |
| 422 | Unprocessable Entity | Validation error in request body |
| 500 | Internal Server Error | Database error, LLM API error, unexpected error |
| 503 | Service Unavailable | Service is down or under maintenance |

---

## Rate Limiting

**Current Status**: Not implemented

**Future Implementation**:
- 100 requests per minute per IP
- 1000 requests per hour per IP
- Response headers:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## Interactive Documentation

Visit these URLs when the backend is running:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These provide:
- Interactive API testing
- Detailed schema documentation
- Example requests/responses
- Try-it-out functionality

---

## Examples

### Complete Search Flow

```bash
# 1. Get welcome message
curl -X POST http://localhost:8000/api/chat/welcome

# 2. Send user query
curl -X POST http://localhost:8000/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"message": "ابي فيلا في النرجس بسعر مليون ريال"}'

# 3. Search with extracted criteria
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "exact",
    "criteria": {
      "purpose": "للبيع",
      "property_type": "فلل",
      "district": "النرجس",
      "price": {"max": 1000000, "currency": "SAR"}
    }
  }'

# 4. Get property details
curl http://localhost:8000/api/properties/prop_123
```

---

## Changelog

### Version 1.0.0 (Current)

- Initial API release
- Natural language query processing
- Hybrid search (exact + semantic)
- Location-based services (schools, universities, mosques)
- Property details endpoint

### Future Versions

- User authentication
- Saved searches
- Property alerts
- Advanced filtering
- Analytics endpoints

---

## Support

For questions or issues:
- Check the [README](README.md)
- Review [CONTRIBUTING](CONTRIBUTING.md)
- Open an issue on GitHub
- Contact the development team

---

**Last Updated**: 2025
