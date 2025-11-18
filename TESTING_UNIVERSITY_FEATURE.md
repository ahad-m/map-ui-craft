# Testing the University Proximity Search Feature

This document describes how to test the new university proximity search feature that was added to the real estate AI assistant.

## Prerequisites

1. The database functions must be deployed:
   - `get_nearby_universities`
   - `check_university_proximity`
   
   These are defined in: `supabase/migrations/20251118173139_add_university_functions.sql`

2. The `universities` table must exist and contain data with columns:
   - `name_ar` (text): Arabic name of the university
   - `name_en` (text): English name of the university
   - `lat` (double precision): Latitude
   - `lon` (double precision): Longitude

## Backend Testing

### Test 1: LLM Parser - Extract University Requirements

Test that the LLM can extract university requirements from user queries:

```python
from llm_parser import llm_parser

# Test query in Arabic
query = "ابي شقة للايجار قريبة من جامعة الملك سعود"
result = llm_parser.extract_criteria(query)

# Verify:
# - result.success == True
# - result.criteria.university_requirements is not None
# - result.criteria.university_requirements.required == True
# - result.criteria.university_requirements.university_name contains "الملك سعود" or "King Saud"
```

### Test 2: Search Engine - Filter by University Proximity

Test that the search engine filters properties based on university proximity:

```python
from search_engine import search_engine
from models import PropertyCriteria, PropertyPurpose, PropertyType, UniversityRequirements

# Create criteria with university requirements
criteria = PropertyCriteria(
    purpose=PropertyPurpose.RENT,
    property_type=PropertyType.APARTMENT,
    university_requirements=UniversityRequirements(
        required=True,
        university_name="جامعة الملك سعود",
        max_distance_minutes=15.0
    )
)

# Search for exact matches
from models import SearchMode
properties = search_engine.search(criteria, SearchMode.EXACT)

# Verify:
# - len(properties) > 0
# - All properties should be within 15 minutes driving distance from King Saud University
```

## Frontend Testing

### Test 1: Manual University Search

1. Open the Real Estate Search page
2. In the filters sidebar, select a university from the university dropdown
3. Set the maximum travel time (default: 30 minutes)
4. Click "Search"

**Expected Results:**
- The map should show:
  - Green university pin (graduation cap icon) for the selected university
  - Property markers for all properties within the specified travel time
- The property list should show filtered results

### Test 2: Chatbot University Search

1. Open the Real Estate Search page
2. Open the AI Assistant chatbot
3. Type a query like: "ابي شقة للايجار قريبة من جامعة الملك سعود"
4. Select "exact match" or "similar" when prompted

**Expected Results:**
- The chatbot should:
  - Confirm understanding with a message like: "• قريب من جامعة جامعة الملك سعود (≤15 دقيقة)"
  - Return properties near the specified university
- The map should show:
  - Green university pin for King Saud University
  - Property markers for nearby properties
- The university filter should be automatically set to "جامعة الملك سعود"

### Test 3: Multiple Criteria with University

1. Open the chatbot
2. Type: "ابي فيلا للبيع قريبة من جامعة الملك عبدالعزيز ب 3 غرف"

**Expected Results:**
- The chatbot should extract:
  - Property type: فلل (Villa)
  - Purpose: للبيع (For Sale)
  - Rooms: 3
  - University: جامعة الملك عبدالعزيز
- Results should show only 3-bedroom villas near the specified university

## Database Function Testing

You can test the database functions directly in the Supabase SQL editor:

### Test `get_nearby_universities`

```sql
-- Test with coordinates near King Saud University (example: 24.7261, 46.6189)
SELECT * FROM get_nearby_universities(
    24.7261,    -- property latitude
    46.6189,    -- property longitude
    5000.0,     -- 5km radius
    'الملك سعود' -- university name (optional)
);
```

**Expected:** Should return King Saud University if it exists in the database and is within 5km.

### Test `check_university_proximity`

```sql
-- Test if a property has any university nearby
SELECT check_university_proximity(
    24.7261,    -- property latitude
    46.6189,    -- property longitude
    10000.0,    -- 10km radius
    NULL        -- any university
);
```

**Expected:** Should return `true` if any university exists within 10km, `false` otherwise.

## Common Issues and Troubleshooting

### Issue 1: No universities showing on map
- **Check:** Verify that `allUniversities` array is populated
- **Check:** Verify that `nearbyUniversities` is not empty
- **Check:** Check browser console for any errors
- **Solution:** Make sure the universities table has data with valid lat/lon coordinates

### Issue 2: Chatbot doesn't extract university name
- **Check:** Verify the OpenAI API key is configured
- **Check:** Check the Backend logs for any errors in `llm_parser.py`
- **Solution:** Try rephrasing the query to be more explicit, e.g., "قريب من جامعة الملك سعود"

### Issue 3: No properties found near university
- **Check:** Verify the database has the RPC functions deployed
- **Check:** Check if properties exist in the database with valid coordinates
- **Check:** Increase the `max_distance_minutes` parameter
- **Solution:** Check Backend logs for RPC call errors

## Success Criteria

The feature is working correctly if:

1. ✅ The LLM parser can extract university names from Arabic queries
2. ✅ The search engine filters properties based on university proximity
3. ✅ University pins appear on the map when a university is searched
4. ✅ Properties are filtered to show only those near the selected university
5. ✅ The chatbot and manual search both work correctly
6. ✅ The confirmation message includes university information
