/**
 * Real Estate Assistant API
 * للاتصال بالمساعد العقاري الذكي (Backend)
 *
 * النسخة المحدثة: دعم المحادثة التفاعلية (Multi-Turn)
 */

// ═══════════════════════════════════════════════════════════
// تعريف الأنواع (Types)
// ═══════════════════════════════════════════════════════════

export interface UserMessage {
  message: string;
}

// [جديد] نوع الإجراء للمحادثة التفاعلية
export type ActionType = "NEW_SEARCH" | "UPDATE_CRITERIA" | "CLARIFICATION" | "GREETING";

// [محدث] رسالة المساعد مع حقول المحادثة التفاعلية
export interface AssistantMessage {
  success: boolean;
  message: string;
  criteria?: PropertyCriteria;
  needs_clarification?: boolean;
  clarification_questions?: string[];

  // [جديد] حقول المحادثة التفاعلية
  action_type?: ActionType;
  changes_summary?: string | null;
  previous_criteria?: PropertyCriteria | null;
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
  price?: PriceFilter;
  metro_time_max?: number;
  school_requirements?: SchoolRequirements;
  university_requirements?: UniversityRequirements;
  mosque_requirements?: MosqueRequirements;
  original_query?: string;
}

export interface RangeFilter {
  exact?: number;
  min?: number;
  max?: number;
}

export interface PriceFilter {
  min?: number;
  max?: number;
  currency?: string;
  period?: string;
}

// [جديد] متطلبات المدارس
export interface SchoolRequirements {
  required: boolean;
  levels?: string[];
  gender?: string;
  max_distance_minutes?: number;
  walking?: boolean;
}

// [جديد] متطلبات الجامعات
export interface UniversityRequirements {
  required: boolean;
  university_name?: string;
  max_distance_minutes?: number;
}

// [جديد] متطلبات المساجد
export interface MosqueRequirements {
  required: boolean;
  mosque_name?: string;
  max_distance_minutes?: number;
  walking?: boolean;
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

export interface University {
  name_ar?: string;
  name_en?: string;
  lat: number;
  lon: number;
  drive_minutes?: number;
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
  nearby_schools?: School[];
  nearby_universities?: University[];
  nearby_mosques?: any[];
}

export interface SearchResponse {
  success: boolean;
  properties: Property[];
  total_count: number;
  search_mode: string;
  message?: string;
}

// ═══════════════════════════════════════════════════════════
// إعدادات API
// ═══════════════════════════════════════════════════════════

const API_BASE_URL = "https://riyal-estate-api.onrender.com";
//const API_BASE_URL = "http://localhost:8000";

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
      message:
        "مرحباً فيك! 🏡\n\nأنا مساعدك العقاري الذكي.\nاطلب اللي تبي وأنا بجيبه لك!\n\n💡 ميزة جديدة: تقدر تعدّل طلبك! مثلاً:\n• 'هونت، أبي أربع غرف بدل ثلاث'\n• 'نسيت، أبي قريب من مدرسة' 😊",
      action_type: "GREETING",
    };
  }
}

/**
 * إرسال طلب المستخدم واستخراج المعايير
 *
 * [محدث] يدعم الآن المحادثة التفاعلية:
 * - يمكن تمرير previous_criteria لدعم التعديلات
 * - يُرجع action_type لتحديد نوع الإجراء
 *
 * @param message رسالة المستخدم
 * @param previousCriteria المعايير السابقة (اختياري) لدعم التعديلات
 */
export async function sendUserQuery(
  message: string,
  previousCriteria?: PropertyCriteria | null,
): Promise<AssistantMessage> {
  try {
    // [محدث] إرسال المعايير السابقة مع الطلب
    const requestBody: {
      message: string;
      conversation_history: any[];
      previous_criteria: PropertyCriteria | null;
    } = {
      message,
      conversation_history: [],
      previous_criteria: previousCriteria || null,
    };

    console.log("🚀 Sending request to backend:", {
      message,
      hasPreviousCriteria: !!previousCriteria,
    });

    const response = await fetch(`${API_BASE_URL}/api/chat/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AssistantMessage = await response.json();

    // [جديد] تسجيل نوع الإجراء
    console.log("✅ Response received:", {
      success: result.success,
      actionType: result.action_type,
      changesSummary: result.changes_summary,
    });

    return result;
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
    console.log("🔍 Searching properties:", { criteria, mode });

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

    const result = await response.json();
    console.log("✅ Search results:", { count: result.total_count });

    return result;
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
