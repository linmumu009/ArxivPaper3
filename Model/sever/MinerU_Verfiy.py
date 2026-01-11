import re


def verify_mineru_token(token: str) -> dict:
    raw = (token or "").strip()
    if not raw:
        return {"code": 400, "message": "Token 不能为空"}
    if len(raw) < 8:
        return {"code": 422, "message": "Token 长度过短"}
    if len(raw) > 256:
        return {"code": 422, "message": "Token 长度过长"}
    if re.search(r"\s", raw):
        return {"code": 422, "message": "Token 不能包含空白字符"}
    if not re.fullmatch(r"[A-Za-z0-9_\-\.]+", raw):
        return {"code": 422, "message": "Token 包含非法字符"}
    return {"code": 200, "message": "OK"}

