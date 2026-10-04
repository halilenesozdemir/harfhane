TR_ALPHABET = set("abcçdefgğhıijklmnoöprsştuüvyz")

CASE_MAP_UPPER = {"i": "İ", "ı": "I"}
CASE_MAP_LOWER = {"İ": "i", "I": "ı"}


def tr_lower(text: str) -> str:
    chars = [CASE_MAP_LOWER.get(ch, ch) for ch in text]
    return "".join(chars).lower()


def tr_upper(text: str) -> str:
    chars = [CASE_MAP_UPPER.get(ch, ch) for ch in text]
    return "".join(chars).upper()


def is_turkish_alphabet(word_lower: str) -> bool:
    if not word_lower:
        return False
    return all(ch in TR_ALPHABET for ch in word_lower)
