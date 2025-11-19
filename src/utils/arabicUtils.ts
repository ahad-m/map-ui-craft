/**
 * Arabic text normalization utilities for frontend
 * Handles variations in Arabic text for better matching
 */

/**
 * Normalize Arabic text for better fuzzy matching
 * @param {string} text - Arabic text to normalize
 * @returns {string} - Normalized text
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  
  // Convert to lowercase
  text = text.toLowerCase();
  
  // Normalize different forms of alef
  text = text.replace(/[إأٱآا]/g, 'ا');
  
  // Normalize teh marbuta to heh (makes ة and ه equivalent)
  text = text.replace(/ة/g, 'ه');
  
  // Normalize yeh variations
  text = text.replace(/[يى]/g, 'ي');
  
  // Remove extra spaces and trim
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Check if one Arabic text matches another with fuzzy matching
 * @param {string} query - The search query
 * @param {string} target - The target text to search in
 * @returns {boolean} - True if query matches target
 */
export function arabicTextMatches(query: string, target: string): boolean {
  if (!query || !target) return false;
  
  // Normalize both texts
  const normQuery = normalizeArabicText(query);
  const normTarget = normalizeArabicText(target);
  
  // Check if target contains query
  return normTarget.includes(normQuery);
}
