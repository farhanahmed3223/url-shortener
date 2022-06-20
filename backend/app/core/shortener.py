import random, string, re

def generate_short_code(length: int = 7) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))

def validate_custom_slug(slug: str) -> bool:
    # TODO: proper validation
    return bool(slug) and len(slug) >= 3
