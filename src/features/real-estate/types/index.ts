/**
 * Real Estate Search Types
 * 
 * SOLID Principle: Interface Segregation
 * - Each interface is focused on a specific domain
 * - Consumers only depend on what they need
 */

// ============================================
// Property Types
// ============================================

export interface Property {
  id: string;
  title: string;
  description?: string;
  price_num: number;
  price_currency: string;
  property_type: string;
  purpose: string; // "للبيع" | "للايجار"
  city: string;
  district: string;
  rooms?: number;
  baths?: number;
  halls?: number;
  area_m2?: number;
  lat: number;
  lon: number;
  final_lat?: number;
  final_lon?: number;
  image_url?: string;
  time_to_metro_min?: number;
  // Backend enriched fields
  nearby_universities?: NearbyUniversity[];
  nearby_mosques?: NearbyMosque[];
  nearby_schools?: NearbySchool[];
}

export interface PropertyWithDistance extends Property {
  distance?: number;
  travelTime?: number;
}

// ============================================
// Location Types
// ============================================

export interface GeoLocation {
  lat: number;
  lon: number;
}

export interface MapCenter {
  lat: number;
  lng: number;
}

// ============================================
// School Types
// ============================================

export interface School {
  id: string;
  name: string;
  lat: number;
  lon: number;
  district?: string;
  gender: 'boys' | 'girls' | 'both';
  primary_level: SchoolLevel;
}

export interface SchoolWithTravelTime extends School {
  travelTime: number;
}

export type SchoolLevel = 
  | 'nursery' 
  | 'kindergarten' 
  | 'elementary' 
  | 'middle' 
  | 'high' 
  | 'combined';

export type SchoolGender = 'Boys' | 'Girls' | 'All' | '';

// ============================================
// University Types
// ============================================

export interface University {
  id?: string;
  name_ar: string;
  name_en: string;
  lat: number;
  lon: number;
}

export interface UniversityWithTravelTime extends University {
  travelTime: number;
}

export interface NearbyUniversity {
  name_ar: string;
  name_en: string;
  lat: number;
  lon: number;
  drive_minutes?: number;
}

// ============================================
// Mosque Types
// ============================================

export interface Mosque {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface MosqueWithTravelTime extends Mosque {
  travelTime: number;
}

export interface NearbyMosque {
  name: string;
  lat: number;
  lon: number;
  walk_minutes?: number;
  drive_minutes?: number;
}

// ============================================
// Nearby School Type (from Backend)
// ============================================

export interface NearbySchool {
  name: string;
  lat: number;
  lon: number;
  gender?: string;
  level?: string;
  walk_minutes?: number;
  drive_minutes?: number;
  distance_meters?: number;
}

// ============================================
// Filter Types
// ============================================

export interface PropertyFilters {
  propertyType: string;
  city: string;
  neighborhood: string;
  minPrice: number;
  maxPrice: number;
  areaMin: number;
  areaMax: number;
  bedrooms: string;
  livingRooms: string;
  bathrooms: string;
  // School filters
  schoolGender: SchoolGender;
  schoolLevel: string;
  maxSchoolTime: number;
  // University filters
  selectedUniversity: string;
  maxUniversityTime: number;
  // Proximity filters
  nearMetro: boolean;
  minMetroTime: number;
  nearHospitals: boolean;
  nearMosques: boolean;
  maxMosqueTime: number;
}

export interface CustomSearchTerms {
  propertyType: string;
  neighborhood: string;
  school: string;
  university: string;
  schoolGender: string;
  schoolLevel: string;
}

export type TransactionType = 'rent' | 'sale';

// ============================================
// Action Types (for Multi-Turn Conversations)
// ============================================

export type ActionType = 'NEW_SEARCH' | 'UPDATE_CRITERIA' | 'CLARIFICATION' | 'GREETING';

// ============================================
// Filter Section Props (for sub-components)
// ============================================

export interface FilterSectionProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
}

export interface PropertyDetailsFilterProps extends FilterSectionProps {
  customSearchTerms: CustomSearchTerms;
  onCustomSearchTermsChange: (terms: CustomSearchTerms) => void;
  propertyTypes: string[];
  neighborhoods: string[];
}

export interface EducationFilterProps extends FilterSectionProps {
  customSearchTerms: CustomSearchTerms;
  onCustomSearchTermsChange: (terms: CustomSearchTerms) => void;
  schools: School[];
  universities: University[];
  nearbySchoolsCount: number;
  nearbyUniversitiesCount: number;
}

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  criteria?: SearchCriteria;
}

export interface SearchCriteria {
  school_requirements?: {
    required: boolean;
    gender?: string;
    levels?: string[];
    max_distance_minutes?: number;
  };
  university_requirements?: {
    required: boolean;
    university_name?: string;
    max_distance_minutes?: number;
  };
  mosque_requirements?: {
    required: boolean;
    max_distance_minutes?: number;
  };
}

// ============================================
// Map Types
// ============================================

export interface MarkerProps {
  position: { lat: number; lng: number };
  onClick?: () => void;
  children?: React.ReactNode;
}

export interface PropertyMarkerProps {
  property: Property;
  isVisited: boolean;
  isFavorite: boolean;
  transactionType: TransactionType;
  onClick: () => void;
}

// ✅ محدث: إضافة backendSchools
export interface PropertyMapProps {
  properties: Property[];
  schools: SchoolWithTravelTime[];
  universities: UniversityWithTravelTime[];
  mosques: MosqueWithTravelTime[];
  backendUniversities: NearbyUniversity[];
  backendMosques: NearbyMosque[];
  backendSchools: NearbySchool[];  // ✅ جديد
  visitedProperties: Set<string>;
  favoriteIds: string[];
  transactionType: TransactionType;
  hasSearched: boolean;
  onPropertyClick: (property: Property) => void;
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  mapCenter?: MapCenter;
  mapZoom?: number;
}

// ============================================
// Component Props
// ============================================

export interface SearchHeaderProps {
  transactionType: TransactionType;
  onTransactionTypeChange: (type: TransactionType) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  onToggleFilters: () => void;
  onToggleFavorites: () => void;
  favoritesCount: number;
}

export interface FiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  customSearchTerms: CustomSearchTerms;
  onCustomSearchTermsChange: (terms: CustomSearchTerms) => void;
  onApply: () => void;
  onReset: () => void;
  // Data for dropdowns
  propertyTypes: string[];
  neighborhoods: string[];
  schools: School[];
  universities: University[];
  nearbySchoolsCount: number;
  nearbyUniversitiesCount: number;
}

export interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onResultsReceived: (properties: Property[]) => void;
  onFiltersSync: (filters: Partial<PropertyFilters>) => void;
}

export interface FavoritesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onPropertySelect: (property: Property) => void;
  onToggleFavorite: (propertyId: string) => void;
}

export interface ResultsCounterProps {
  count: number;
  isLoading: boolean;
  isVisible: boolean;
}

// ============================================
// Default Values
// ============================================

export const DEFAULT_FILTERS: PropertyFilters = {
  propertyType: '',
  city: 'الرياض',
  neighborhood: '',
  minPrice: 0,
  maxPrice: 0,
  areaMin: 0,
  areaMax: 0,
  bedrooms: '',
  livingRooms: '',
  bathrooms: '',
  schoolGender: '',
  schoolLevel: '',
  maxSchoolTime: 15,
  selectedUniversity: '',
  maxUniversityTime: 30,
  nearMetro: false,
  minMetroTime: 1,
  nearHospitals: false,
  nearMosques: false,
  maxMosqueTime: 30,
};

export const DEFAULT_CUSTOM_SEARCH_TERMS: CustomSearchTerms = {
  propertyType: '',
  neighborhood: '',
  school: '',
  university: '',
  schoolGender: '',
  schoolLevel: '',
};

export const RIYADH_CENTER: MapCenter = {
  lat: 24.7136,
  lng: 46.6753,
};

export const PREDEFINED_PROPERTY_TYPES = [
  'استوديو',
  'شقق',
  'فلل',
  'تاون هاوس',
  'دوبلكس',
  'دور',
  'عمائر',
];

export const PREDEFINED_SCHOOL_GENDERS: SchoolGender[] = ['Boys', 'Girls'];

export const PREDEFINED_SCHOOL_LEVELS: SchoolLevel[] = [
  'nursery',
  'kindergarten',
  'elementary',
  'middle',
  'high',
];
