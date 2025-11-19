# Testing Guide for University Search Improvements

## تحسينات بحث الجامعات - دليل الاختبار

This document describes the improvements made to fix university search issues and how to test them.

## الملخص (Summary)

تم إصلاح ثلاث مشاكل رئيسية:
1. عدم فهم النموذج للتنويعات العربية (قريب/قريبه/قريبة)
2. عدم مطابقة أسماء الجامعات مع الاختلافات البسيطة (همزات، نقاط، تاء مربوطة)
3. عدم فهم النموذج لمواصفات الوقت بالطرق المختلفة

## Changes Made / التغييرات المنفذة

### 1. Backend Changes

#### A. Enhanced LLM System Prompt (`llm_parser.py`)
**What changed:**
- Added comprehensive Arabic variation handling in the system prompt
- Added specific instructions for understanding "قريب/قريبه/قريبة" variations
- Added examples for time specifications ("15 د بالسياره", "10 دقائق بالسيارة")
- Added guidance for extracting university names with variations

**Testing:**
Test these queries with the chatbot to verify the LLM understands them:
```
1. "ابي شقة للايجار قريبه من جامعة الملك سعود"
2. "ودي فيلا للبيع قريبة من جامعه الاميره نوره"
3. "ابغى شقه للايجار قريبه من جامعة الامام محمد بن سعود ١٥ د بالسياره"
4. "ابي شقه قريب من جامعه الملك سعود 20 دقيقة بالسيارة"
```

Expected result: The LLM should extract university requirements for all these queries.

#### B. Arabic Text Normalization (`arabic_utils.py`)
**What changed:**
- Created a new utility module for normalizing Arabic text
- Handles: hamzas (أإآا → ا), teh marbuta (ة → ه), yeh variations (ى → ي)
- Implements fuzzy matching with similarity scoring

**Testing:**
Run the unit tests:
```bash
cd Backend
python test_university_search.py
```

Expected result: All tests should pass (3/3).

#### C. Fuzzy University Name Matching (`search_engine.py`)
**What changed:**
- Added `_find_matching_university()` function that finds the best matching university from database
- Integrated fuzzy matching into both `_exact_search` and `_flexible_sql_search`
- Uses similarity threshold of 0.5 for flexible matching

**Testing:**
The fuzzy matcher will automatically match variations like:
- "جامعة الاميره نوره" → "جامعة الأميرة نورة بنت عبد الرحمن"
- "جامعة الامام محمد بن سعود" → "جامعة الإمام محمد إبن سعود"
- "جامعه الملك سعود" → "جامعة الملك سعود"

### 2. Frontend Changes

#### A. Arabic Text Normalization Utility (`src/utils/arabicUtils.ts`)
**What changed:**
- Created frontend utility for Arabic text normalization
- Provides `normalizeArabicText()` and `arabicTextMatches()` functions

#### B. University Name Filtering (`RealEstateSearch.tsx`)
**What changed:**
- Updated university filtering to use fuzzy matching instead of simple string comparison
- Now handles Arabic variations when filtering universities on the map

## Test Scenarios / سيناريوهات الاختبار

### Scenario 1: Basic University Search (بحث جامعة بسيط)

**Input:** "ابي شقة للايجار قريبة من جامعة الملك سعود"

**Expected Results:**
1. ✅ LLM extracts: `university_requirements.required = true`
2. ✅ LLM extracts: `university_requirements.university_name = "جامعة الملك سعود"` (or similar)
3. ✅ Backend finds matching properties near the university
4. ✅ Map shows:
   - Property pins (green for rent)
   - University pin (graduation cap icon)
5. ✅ Confirmation message mentions the university

### Scenario 2: University Name Variations (تنويعات اسم الجامعة)

**Input:** "ابي شقة للايجار قريبه من جامعه الاميره نوره"

**Expected Results:**
1. ✅ LLM extracts university name (despite هـ instead of ة)
2. ✅ Backend fuzzy matching finds "جامعة الأميرة نورة بنت عبد الرحمن"
3. ✅ Properties near Princess Nourah University are shown
4. ✅ University pin appears on map

### Scenario 3: "قريب" Variations (تنويعات كلمة قريب)

Test all these variations:
- "ابي شقة قريب من جامعة الملك سعود"
- "ابي شقة قريبه من جامعة الملك سعود"
- "ابي شقة قريبة من جامعة الملك سعود"

**Expected Results:**
All three should work identically and extract university requirements.

### Scenario 4: Time Specifications (مواصفات الوقت)

Test these variations:
- "ابي شقة قريبة من جامعة الملك سعود 15 دقيقة بالسيارة"
- "ابي شقة قريبه من جامعة الملك سعود ١٥ د بالسياره"
- "ابي شقة قريب من جامعة الملك سعود 10 دقائق بالسيارة"

**Expected Results:**
1. ✅ LLM extracts the time correctly
2. ✅ `university_requirements.max_distance_minutes` is set correctly
3. ✅ Only properties within that time range are shown

### Scenario 5: Complex Query (استعلام معقد)

**Input:** "ابي فيلا للبيع ب 3 غرف قريبه من جامعة الامام محمد بن سعود ١٥ دقيقه بالسياره"

**Expected Results:**
1. ✅ Property type: فلل
2. ✅ Purpose: للبيع
3. ✅ Rooms: 3
4. ✅ University: matched to "جامعة الإمام محمد إبن سعود" (with fuzzy matching)
5. ✅ Max time: 15 minutes
6. ✅ Results show 3-bedroom villas near the university

## Common Issues & Troubleshooting / المشاكل الشائعة والحلول

### Issue 1: No properties found

**Possible causes:**
1. No properties exist in the database near the specified university
2. The time constraint is too strict (e.g., 5 minutes might be too short)
3. Database functions are not deployed

**Solutions:**
- Try increasing the time (e.g., 20-30 minutes)
- Check that properties exist in the database with valid coordinates
- Verify database migrations are applied

### Issue 2: University pin not showing

**Possible causes:**
1. `allUniversities` is empty (universities table has no data)
2. The university is too far from properties (outside map bounds)
3. Frontend filtering is removing the university

**Solutions:**
- Check browser console for errors
- Verify universities table has data
- Check that `nearbyUniversities` array is not empty in React DevTools

### Issue 3: Wrong university matched

**Possible causes:**
1. Multiple universities have similar names
2. Similarity threshold is too low

**Solutions:**
- Be more specific in the query (e.g., include location or full name)
- Check backend logs for fuzzy matching scores

## Database Verification / التحقق من قاعدة البيانات

Run these SQL queries in Supabase SQL Editor to verify:

### 1. Check if universities exist:
```sql
SELECT name_ar, lat, lon FROM universities LIMIT 10;
```

### 2. Test fuzzy matching function:
```sql
-- Test with King Saud University coordinates
SELECT * FROM get_nearby_universities(
    24.7261,    -- property latitude
    46.6189,    -- property longitude
    10000.0,    -- 10km radius
    'الملك سعود' -- university name
);
```

### 3. Check property proximity:
```sql
SELECT check_university_proximity(
    24.7261,    -- property latitude
    46.6189,    -- property longitude
    10000.0,    -- 10km radius
    'جامعة الملك سعود'
);
```

## Performance Notes / ملاحظات الأداء

- Fuzzy matching adds minimal overhead (~0.1-0.5ms per comparison)
- Database ILIKE queries with wildcards are efficient for small university datasets
- Frontend normalization is very fast (runs in microseconds)

## Success Criteria / معايير النجاح

The feature is working correctly if:

1. ✅ LLM understands all variations of "قريب" (قريب/قريبه/قريبة)
2. ✅ University name matching works with spelling variations
3. ✅ Time specifications in different formats are extracted correctly
4. ✅ University pins appear on map when searching
5. ✅ Properties are correctly filtered by university proximity
6. ✅ All unit tests pass

## Next Steps / الخطوات التالية

1. Deploy backend changes to production
2. Deploy frontend changes to production
3. Test with real users
4. Monitor logs for any matching failures
5. Adjust similarity threshold if needed (currently 0.5)

---

**Created:** 2024-11-19
**Version:** 1.0
