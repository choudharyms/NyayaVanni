import asyncio

from backend.middleware.upload_limit import LimitUploadSizeMiddleware


async def _ok_app(_scope, receive, send):
    while True:
        message = await receive()
        if message["type"] != "http.request" or not message.get("more_body", False):
            break

    await send({"type": "http.response.start", "status": 200, "headers": []})
    await send({"type": "http.response.body", "body": b"ok"})


def test_limit_upload_size_middleware_rejects_chunked_bodies_without_content_length():
    middleware = LimitUploadSizeMiddleware(_ok_app, max_upload_size=5)
    scope = {"type": "http", "headers": []}
    incoming = [
        {"type": "http.request", "body": b"123", "more_body": True},
        {"type": "http.request", "body": b"456", "more_body": False},
    ]
    sent = []

    async def receive():
        if incoming:
            return incoming.pop(0)
        return {"type": "http.disconnect"}

    async def send(message):
        sent.append(message)

    asyncio.run(middleware(scope, receive, send))

    assert sent[0]["type"] == "http.response.start"
    assert sent[0]["status"] == 413


def test_limit_upload_size_middleware_rejects_oversized_content_length():
    middleware = LimitUploadSizeMiddleware(_ok_app, max_upload_size=5)
    scope = {"type": "http", "headers": [(b"content-length", b"6")]}
    sent = []

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message):
        sent.append(message)

    asyncio.run(middleware(scope, receive, send))

    assert sent[0]["type"] == "http.response.start"
    assert sent[0]["status"] == 413
