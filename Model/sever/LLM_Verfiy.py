from urllib.parse import urlparse


def verify_llm_config(payload: dict) -> dict:
    api_type = str(payload.get("apiType") or "").strip()
    api_url = str(payload.get("apiUrl") or "").strip()
    api_key = str(payload.get("apiKey") or "").strip()
    model = str(payload.get("model") or "").strip()
    temperature = payload.get("temperature")
    max_tokens = payload.get("maxTokens")
    related_number = payload.get("relatedNumber")

    if api_type not in {"full_url", "base_url"}:
        return {"code": 422, "message": "API 类型不合法"}

    if not api_url:
        return {"code": 400, "message": "API 地址不能为空"}

    parsed = urlparse(api_url if "://" in api_url else f"http://{api_url}")
    if not parsed.netloc:
        return {"code": 422, "message": "API 地址格式不正确"}
    if api_type == "full_url" and parsed.scheme not in {"http", "https"}:
        return {"code": 422, "message": "Full URL 必须以 http/https 开头"}

    if not api_key:
        return {"code": 400, "message": "API Key 不能为空"}

    if not model:
        return {"code": 400, "message": "Name 不能为空"}

    try:
        t = float(temperature)
    except Exception:
        return {"code": 422, "message": "Temperature 必须为数字"}
    if t < 0 or t > 2:
        return {"code": 422, "message": "Temperature 范围必须在 0-2"}

    try:
        mt = int(max_tokens)
    except Exception:
        return {"code": 422, "message": "Max Tokens 必须为整数"}
    if mt <= 0:
        return {"code": 422, "message": "Max Tokens 必须大于 0"}

    try:
        rn = int(related_number)
    except Exception:
        return {"code": 422, "message": "Related Number 必须为整数"}
    if rn <= 0:
        return {"code": 422, "message": "Related Number 必须大于 0"}

    return {"code": 200, "message": "OK"}

