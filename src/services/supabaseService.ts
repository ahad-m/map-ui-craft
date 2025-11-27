/**
 * Supabase Service Layer
 * 
 * Centralizes all Supabase database queries for properties, schools, universities, and mosques.
 * This service layer separates data fetching logic from React components.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches properties based on transaction type and filters
 */
export const fetchProperties = async (
  transactionType: "rent" | "sale",
  filters: {
    propertyType?: string;
    neighborhood?: string;
    bedrooms?: string;
    bathrooms?: string;
    livingRooms?: string;
    city?: string;
  },
  searchQuery: string
) => {
  let query = supabase
    .from("properties")
    .select("id, lat, lon, final_lat, final_lon, title, price_num, property_type, district, image_url, rooms, baths, area_m2, purpose, city")
    .eq("purpose", transactionType === "sale" ? "للبيع" : "للايجار")
    .not("final_lat", "is", null)
    .not("final_lon", "is", null);

  // Apply city filter (Riyadh only)
  if (filters.city) {
    query = query.eq("city", filters.city);
  }

  if (filters.propertyType) query = query.eq("property_type", filters.propertyType);
  if (filters.neighborhood) query = query.eq("district", filters.neighborhood);
  if (searchQuery) {
    query = query.or(`city.ilike.%${searchQuery}%,district.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
  }
  if (filters.bedrooms && filters.bedrooms !== "other") {
    const count = parseInt(filters.bedrooms);
    if (!isNaN(count)) query = query.eq("rooms", count);
  }
  if (filters.bathrooms && filters.bathrooms !== "other") {
    const count = parseInt(filters.bathrooms);
    if (!isNaN(count)) query = query.eq("baths", count);
  }
  if (filters.livingRooms && filters.livingRooms !== "other") {
    const count = parseInt(filters.livingRooms);
    if (!isNaN(count)) query = query.eq("halls", count);
  }

  // No limit - return ALL matching records
  const { data, error } = await query;
  if (error) throw error;

  return data || [];
};

/**
 * Fetches unique property types matching the search term
 */
export const fetchPropertyTypes = async (searchTerm: string) => {
  if (!searchTerm) return [];
  
  const { data, error } = await supabase
    .from("properties")
    .select("property_type")
    .not("property_type", "is", null)
    .not("property_type", "eq", "")
    .ilike("property_type", `%${searchTerm}%`);

  if (error) throw error;
  return data || [];
};

/**
 * Fetches unique neighborhoods/districts matching the search term
 */
export const fetchNeighborhoods = async (searchTerm?: string) => {
  let query = supabase
    .from("properties")
    .select("district")
    .not("district", "is", null)
    .not("district", "eq", "");

  if (searchTerm) {
    query = query.ilike("district", `%${searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Fetches schools based on gender, level, and search criteria
 */
export const fetchSchools = async (
  gender?: string,
  level?: string,
  searchTerm?: string
) => {
  let query = supabase
    .from("schools")
    .select("*")
    .not("lat", "is", null)
    .not("lon", "is", null)
    .not("name", "is", null);

  if (gender && gender !== "All") {
    const genderValue = gender === "Boys" ? "boys" : gender === "Girls" ? "girls" : "both";
    query = query.eq("gender", genderValue);
  }
  if (level && level !== "combined") {
    query = query.eq("primary_level", level);
  }
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,district.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw error;
  return data || [];
};

/**
 * Fetches unique school genders matching the search term
 */
export const fetchSchoolGenders = async (searchTerm: string) => {
  if (!searchTerm) return [];

  const { data, error } = await supabase
    .from("schools")
    .select("gender")
    .not("gender", "is", null)
    .not("gender", "eq", "")
    .ilike("gender", `%${searchTerm}%`);

  if (error) throw error;
  return data || [];
};

/**
 * Fetches unique school levels matching the search term
 */
export const fetchSchoolLevels = async (searchTerm: string) => {
  if (!searchTerm) return [];

  const { data, error } = await supabase
    .from("schools")
    .select("primary_level")
    .not("primary_level", "is", null)
    .not("primary_level", "eq", "")
    .ilike("primary_level", `%${searchTerm}%`);

  if (error) throw error;
  return data || [];
};

/**
 * Fetches universities matching the search term
 */
export const fetchUniversities = async (searchTerm?: string) => {
  let query = supabase
    .from("universities")
    .select("*")
    .not("lat", "is", null)
    .not("lon", "is", null)
    .not("name_ar", "is", null)
    .not("name_en", "is", null);

  if (searchTerm) {
    query = query.or(`name_ar.ilike.%${searchTerm}%,name_en.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query.order("name_ar", { ascending: true });
  if (error) throw error;
  return data || [];
};

/**
 * Fetches all mosques
 */
export const fetchMosques = async () => {
  const { data, error } = await supabase
    .from("mosques")
    .select("*")
    .not("lat", "is", null)
    .not("lon", "is", null)
    .not("name", "is", null);

  if (error) {
    console.error("Error fetching mosques:", error);
    throw error;
  }
  return data || [];
};
