"""
Arabic text normalization utilities
Handles variations in Arabic text for better matching
"""
import re
import unicodedata


def normalize_arabic_text(text: str) -> str:
    """
    Normalize Arabic text for better fuzzy matching.
    
    This function:
    - Converts to lowercase
    - Removes diacritics (tashkeel)
    - Normalizes different forms of the same letter
    - Removes extra spaces
    
    Args:
        text: Arabic text to normalize
        
    Returns:
        Normalized text
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove Arabic diacritics (tashkeel)
    text = re.sub(r'[\u0617-\u061A\u064B-\u0652]', '', text)
    
    # Normalize different forms of alef
    text = re.sub(r'[إأٱآا]', 'ا', text)
    
    # Normalize teh marbuta and heh
    text = re.sub(r'[ةه]', 'ه', text)
    
    # Normalize yeh variations
    text = re.sub(r'[يى]', 'ي', text)
    
    # Remove extra spaces and trim
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def calculate_similarity_score(text1: str, text2: str) -> float:
    """
    Calculate a simple similarity score between two Arabic texts.
    Optimized for university names and similar entities.
    
    Args:
        text1: First text
        text2: Second text
        
    Returns:
        Similarity score between 0 and 1
    """
    if not text1 or not text2:
        return 0.0
    
    # Normalize both texts
    norm1 = normalize_arabic_text(text1)
    norm2 = normalize_arabic_text(text2)
    
    # Exact match after normalization
    if norm1 == norm2:
        return 1.0
    
    # Check if one contains the other
    if norm1 in norm2:
        # norm1 is a subset of norm2
        return len(norm1) / len(norm2) * 0.95
    elif norm2 in norm1:
        # norm2 is a subset of norm1
        return len(norm2) / len(norm1) * 0.95
    
    # Calculate word overlap
    words1 = set(norm1.split())
    words2 = set(norm2.split())
    
    if not words1 or not words2:
        return 0.0
    
    # Remove common stop words that don't add meaning
    stop_words = {'جامعه', 'جامعة', 'كليه', 'كلية', 'معهد', 'مركز', 'فرع', 'في'}
    words1_filtered = words1 - stop_words
    words2_filtered = words2 - stop_words
    
    # If after filtering we have empty sets, use original
    if not words1_filtered or not words2_filtered:
        words1_filtered = words1
        words2_filtered = words2
    
    # Count common words (using filtered sets)
    common = words1_filtered & words2_filtered
    
    if not common:
        # No common words, check original sets
        common_orig = words1 & words2
        if not common_orig:
            return 0.0
        # Use original sets for scoring
        shorter_set = min(len(words1), len(words2))
        return len(common_orig) / shorter_set * 0.5
    
    # Calculate overlap ratio - use the shorter set as denominator
    shorter_set = min(len(words1_filtered), len(words2_filtered))
    overlap_ratio = len(common) / shorter_set
    
    # Boost score if all words from shorter text are in longer text
    if len(common) == shorter_set:
        # All key words match!
        return min(0.95, overlap_ratio)  # Cap at 0.95 since it's not exact match
    
    # For partial matches, still give good score
    return overlap_ratio * 0.85


def find_best_match(query: str, candidates: list, threshold: float = 0.6) -> tuple:
    """
    Find the best matching candidate for a query.
    
    Args:
        query: The search query
        candidates: List of candidate strings
        threshold: Minimum similarity score to consider a match
        
    Returns:
        Tuple of (best_match, score) or (None, 0.0) if no match found
    """
    if not query or not candidates:
        return None, 0.0
    
    best_match = None
    best_score = 0.0
    
    for candidate in candidates:
        score = calculate_similarity_score(query, candidate)
        if score > best_score and score >= threshold:
            best_score = score
            best_match = candidate
    
    return best_match, best_score


# Test the normalization
if __name__ == "__main__":
    # Test cases
    test_cases = [
        ("جامعة الأميرة نورة بنت عبد الرحمن", "جامعة الاميره نوره"),
        ("جامعة الإمام محمد إبن سعود", "جامعة الامام محمد بن سعود"),
        ("جامعة الملك سعود", "جامعه الملك سعود"),
    ]
    
    for text1, text2 in test_cases:
        norm1 = normalize_arabic_text(text1)
        norm2 = normalize_arabic_text(text2)
        score = calculate_similarity_score(text1, text2)
        
        # Show word sets for debugging
        words1 = set(norm1.split())
        words2 = set(norm2.split())
        stop_words = {'جامعه', 'جامعة', 'كليه', 'كلية', 'معهد', 'مركز', 'فرع', 'في'}
        words1_filtered = words1 - stop_words
        words2_filtered = words2 - stop_words
        common = words1_filtered & words2_filtered
        
        print(f"\n'{text1}'")
        print(f"  → '{norm1}'")
        print(f"  Words: {words1_filtered}")
        print(f"'{text2}'")
        print(f"  → '{norm2}'")
        print(f"  Words: {words2_filtered}")
        print(f"Common words: {common}")
        print(f"Similarity: {score:.2f}")
