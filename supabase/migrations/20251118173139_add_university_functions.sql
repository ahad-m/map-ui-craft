-- Add university proximity search functions
-- Similar to the existing school proximity functions

/**
 * Function: get_nearby_universities
 * Purpose: Returns a list of universities matching criteria and near a property
 *
 * Inputs:
 * p_lat, p_lon: Property coordinates
 * p_distance_meters: Distance in meters
 * p_university_name: University name to filter (optional)
 *
 * Outputs:
 * A table (SETOF) containing (name_ar, name_en, lat, lon) for matching universities
 */
CREATE OR REPLACE FUNCTION get_nearby_universities(
    p_lat float,
    p_lon float,
    p_distance_meters float,
    p_university_name text DEFAULT NULL
)
RETURNS TABLE (
    name_ar text,
    name_en text,
    lat float,
    lon float
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        universities.name_ar,
        universities.name_en,
        universities.lat::float,
        universities.lon::float
    FROM universities
    WHERE
        -- 1. Geographic check
        ST_DWithin(
            ST_MakePoint(universities.lon, universities.lat)::geography,
            ST_MakePoint(p_lon, p_lat)::geography,
            p_distance_meters
        )

        -- 2. Name check (optional) - search in both Arabic and English names
        AND (
            p_university_name IS NULL
            OR universities.name_ar ILIKE '%' || p_university_name || '%'
            OR universities.name_en ILIKE '%' || p_university_name || '%'
        );
END;
$$ LANGUAGE plpgsql;

/**
 * Function: check_university_proximity
 * Purpose: Checks if a property has at least one university nearby matching criteria
 *
 * Inputs:
 * p_lat, p_lon: Property coordinates
 * p_distance_meters: Distance in meters
 * p_university_name: University name to filter (optional)
 *
 * Outputs:
 * boolean: true if at least one matching university is found, false otherwise
 */
CREATE OR REPLACE FUNCTION check_university_proximity(
    p_lat float,
    p_lon float,
    p_distance_meters float,
    p_university_name text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    university_count int;
BEGIN
    SELECT COUNT(*)
    INTO university_count
    FROM universities
    WHERE
        -- 1. Geographic check
        ST_DWithin(
            ST_MakePoint(universities.lon, universities.lat)::geography,
            ST_MakePoint(p_lon, p_lat)::geography,
            p_distance_meters
        )

        -- 2. Name check (optional) - search in both Arabic and English names
        AND (
            p_university_name IS NULL
            OR universities.name_ar ILIKE '%' || p_university_name || '%'
            OR universities.name_en ILIKE '%' || p_university_name || '%'
        );

    RETURN university_count > 0;
END;
$$ LANGUAGE plpgsql;
