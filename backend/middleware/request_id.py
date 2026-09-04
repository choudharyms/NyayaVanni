import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique request ID to every request/response pair.

    The ID is generated once per request (or forwarded from an inbound
    ``X-Request-ID`` header), stored on ``request.state`` so exception
    handlers can echo it back, and set on the response ``X-Request-ID``
    header. This makes it possible to correlate an error response with
    server logs.
    """

    HEADER_NAME = "X-Request-ID"

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get(self.HEADER_NAME) or str(uuid.uuid4())
        request.state.request_id = request_id

        response: Response = await call_next(request)
        response.headers[self.HEADER_NAME] = request_id
        return response
