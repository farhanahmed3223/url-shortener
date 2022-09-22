import hashlib, time, string, re

BASE62_CHARS = string.ascii_letters + string.digits

def _sha256_to_int(data: str) -> int:
    digest = hashlib.sha256(data.encode()).digest()
    return int.from_bytes(digest, byteorder="big")

def _int_to_base62(n: int, length: int = 7) -> str:
    result = []
    while n > 0:
        result.append(BASE62_CHARS[n % 62])
        n //= 62
    code = "".join(reversed(result))
    return code[:length].ljust(length, BASE62_CHARS[0])

def generate_short_code(url: str, length: int = 7) -> str:
    seed = f"{url}{time.time_ns()}"
    return _int_to_base62(_sha256_to_int(seed), length)

def validate_custom_slug(slug: str) -> bool:
    if not slug:
        return False
    pattern = r'^[a-zA-Z0-9][a-zA-Z0-9\-]{1,18}[a-zA-Z0-9]$|^[a-zA-Z0-9]{3,20}$'
    return bool(re.match(pattern, slug)) and 3 <= len(slug) <= 20
