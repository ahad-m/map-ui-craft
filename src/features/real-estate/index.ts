/**
 * Real Estate Feature - Main Export
 * 
 * This barrel export provides a clean API for the real estate search feature.
 */

// Types - تصدير الأنواع مع إعادة تسمية ChatMessage لتجنب التعارض
export type {
  Property,
  PropertyWithDistance,
  GeoLocation,
  MapCenter,
  School,
  SchoolWithTravelTime,
  SchoolLevel,
  SchoolGender,
  University,
  UniversityWithTravelTime,
  NearbyUniversity,
  Mosque,
  MosqueWithTravelTime,
  NearbyMosque,
  NearbySchool,
  PropertyFilters,
  CustomSearchTerms,
  TransactionType,
  FilterSectionProps,
  PropertyDetailsFilterProps,
  EducationFilterProps,
  ChatMessage as ChatMessageType, // إعادة تسمية لتجنب التعارض
  SearchCriteria,
  MarkerProps,
  PropertyMarkerProps,
  SearchHeaderProps,
  FiltersSheetProps,
  PropertyMapProps,
  ChatPanelProps,
  FavoritesSheetProps,
  ResultsCounterProps,
} from './types';

export {
  DEFAULT_FILTERS,
  DEFAULT_CUSTOM_SEARCH_TERMS,
  RIYADH_CENTER,
  PREDEFINED_PROPERTY_TYPES,
  PREDEFINED_SCHOOL_GENDERS,
  PREDEFINED_SCHOOL_LEVELS,
} from './types';

// Hooks
export * from './hooks';

// Components
export * from './components';

// Utils
export * from './utils/distanceCalculations';
export * from './utils/filterHelpers';
