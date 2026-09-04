from fastapi.responses import JSONResponse


class PayloadTooLargeError(Exception):
    """Raised when an inbound request body exceeds the configured limit."""


class LimitUploadSizeMiddleware:
    def __init__(self, app, max_upload_size: int):
        self.app = app
        self.max_upload_size = max_upload_size

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        content_length = dict(scope.get("headers", [])).get(b"content-length")
        if content_length:
            try:
                if int(content_length.decode("latin-1")) > self.max_upload_size:
                    await self._send_payload_too_large(scope, send)
                    return
            except ValueError:
                pass

        received_bytes = 0

        async def limited_receive():
            nonlocal received_bytes

            message = await receive()
            if message["type"] == "http.request":
                received_bytes += len(message.get("body", b""))
                if received_bytes > self.max_upload_size:
                    raise PayloadTooLargeError()
            return message

        try:
            await self.app(scope, limited_receive, send)
        except PayloadTooLargeError:
            await self._send_payload_too_large(scope, send)

    async def _send_payload_too_large(self, scope, send) -> None:
        response = JSONResponse(
            status_code=413,
            content={
                "success": False,
                "error": {
                    "code": 413,
                    "message": "Payload Too Large: The request body exceeds the maximum allowed limit.",
                },
            },
        )

        async def _empty_receive():
            return {"type": "http.disconnect"}

        await response(scope, _empty_receive, send)
