import random, string, re

def generate_short_code(length: int = 7) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))

def validate_custom_slug(slug: str) -> bool:
    if not slug:
        return False
    pattern = r'^[a-zA-Z0-9][a-zA-Z0-9\-]{1,18}[a-zA-Z0-9]$|^[a-zA-Z0-9]{3,20}$'
    return bool(re.match(pattern, slug)) and 3 <= len(slug) <= 20
