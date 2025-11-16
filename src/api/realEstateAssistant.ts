/**
 * Real Estate Assistant API
 * للاتصال بالمساعد العقاري الذكي (Backend)
 */

// تعريف الأنواع (Types)
export interface UserMessage {
  message: string;
}

export interface AssistantMessage {
  success: boolean;
  message: string;
  criteria?: PropertyCriteria;
  needs_clarification?: boolean;
  clarification_questions?: string[];
}

// واجهة رسالة المحادثة المستخدمة في الـ API
export interface APIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PropertyCriteria {
  purpose: string;
  property_type: string;
  district?: string;
  city?: string;
  rooms?: RangeFilter;
  baths?: RangeFilter;
  halls?: RangeFilter;
  area_m2?: RangeFilter;
  price?: RangeFilter;
  metro_time_max?: number;
  school_requirements?: any;
  original_query: string;
}

export interface RangeFilter {
  exact?: number;
  min?: number;
  max?: number;
}

export interface SearchRequest {
  criteria: PropertyCriteria;
  mode: "exact" | "similar";
}

export interface School {
  name: string;
  lat: number;
  lon: number;
  gender?: string;
  levels_pg_array?: string;
  drive_minutes?: number;
  district?: string;
}

export interface SchoolProximity {
  name: string;
  distance_minutes: number;
  lat: number;
  lon: number;
}

export interface UniversityProximity {
  name: string;
  distance_minutes: number;
  lat: number;
  lon: number;
}

export interface Property {
  id: string;
  url?: string;
  purpose?: string;
  property_type?: string;
  city?: string;
  district?: string;
  title?: string;
  price_num?: string;
  price_currency?: string;
  price_period?: string;
  area_m2?: string;
  description?: string;
  image_url?: string;
  lat?: string;
  lon?: string;
  final_lat?: string;
  final_lon?: string;
  time_to_metro_min?: string;
  rooms?: number;
  baths?: number;
  halls?: number;
  schools_proximity?: SchoolProximity[];
  university_proximity?: UniversityProximity;
}

export interface SearchResponse {
  success: boolean;
  properties: Property[];
  total_count: number;
  search_mode: string;
  message?: string;
}

// إعدادات API
const API_BASE_URL = "https://riyal-estate-56q6.onrender.com";
/**
 * الحصول على رسالة الترحيب من المساعد
 */
export async function getWelcomeMessage(): Promise<AssistantMessage> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/welcome`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching welcome message:", error);

    // رسالة افتراضية في حالة الخطأ
    return {
      success: true,
      message: "مرحباً فيك! 🏡\n\nأنا مساعدك العقاري الذكي.\nاطلب اللي تبي وأنا بجيبه لك! 😊",
    };
  }
}

/**
 * إرسال طلب المستخدم واستخراج المعايير
 */
export async function sendUserQuery(message: string, history: APIChatMessage[] = []): Promise<AssistantMessage> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending user query:", error);
    throw error;
  }
}

/**
 * البحث عن العقارات
 */
export async function searchProperties(
  criteria: PropertyCriteria,
  mode: "exact" | "similar" = "similar",
): Promise<SearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ criteria, mode }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error searching properties:", error);
    throw error;
  }
}

/**
 * فحص حالة الاتصال بالـ Backend
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
    });

    return response.ok;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return false;
  }
}
