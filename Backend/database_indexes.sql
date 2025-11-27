-- Performance Optimization: Database Indexes
-- Run these to improve query performance

-- Index on purpose (rent/sale) - most common filter
CREATE INDEX IF NOT EXISTS idx_properties_purpose ON properties(purpose);

-- Index on property_type - frequently filtered
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);

-- Index on city - geographic filtering
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);

-- Index on district/neighborhood - common filter
CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district);

-- Index on price_num for price range queries
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_num);

-- Index on area_m2 for area range queries
CREATE INDEX IF NOT EXISTS idx_properties_area ON properties(area_m2);

-- Index on rooms, baths, halls for count filters
CREATE INDEX IF NOT EXISTS idx_properties_rooms ON properties(rooms);
CREATE INDEX IF NOT EXISTS idx_properties_baths ON properties(baths);
CREATE INDEX IF NOT EXISTS idx_properties_halls ON properties(halls);

-- Index on time_to_metro_min for metro proximity
CREATE INDEX IF NOT EXISTS idx_properties_metro ON properties(time_to_metro_min);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_properties_purpose_type 
ON properties(purpose, property_type);

CREATE INDEX IF NOT EXISTS idx_properties_city_district 
ON properties(city, district);

-- Spatial index for geographic queries (PostGIS)
CREATE INDEX IF NOT EXISTS idx_properties_geom 
ON properties USING GIST (ST_MakePoint(final_lon, final_lat)::geography);

-- Index on schools for proximity queries
CREATE INDEX IF NOT EXISTS idx_schools_geom 
ON schools USING GIST (ST_MakePoint(lon, lat)::geography);

CREATE INDEX IF NOT EXISTS idx_schools_gender ON schools(gender);
CREATE INDEX IF NOT EXISTS idx_schools_level ON schools(primary_level);

-- Index on universities for proximity queries
CREATE INDEX IF NOT EXISTS idx_universities_geom 
ON universities USING GIST (ST_MakePoint(lon, lat)::geography);

-- Index on mosques for proximity queries
CREATE INDEX IF NOT EXISTS idx_mosques_geom 
ON mosques USING GIST (ST_MakePoint(lon, lat)::geography);

-- Index on metro stations for proximity queries
CREATE INDEX IF NOT EXISTS idx_metro_stations_geom 
ON metro_stations USING GIST (ST_MakePoint(lon, lat)::geography);

-- Analyze tables for query planner optimization
ANALYZE properties;
ANALYZE schools;
ANALYZE universities;
ANALYZE mosques;
