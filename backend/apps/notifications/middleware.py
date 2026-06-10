from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def _get_user(user_id):
    User = get_user_model()
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()


class JwtAuthMiddleware:
    """Authenticate WebSocket connections via ?token=<JWT access token>."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        scope["user"] = AnonymousUser()
        if scope["type"] == "websocket":
            params = parse_qs(scope.get("query_string", b"").decode())
            token = params.get("token", [None])[0]
            if token:
                try:
                    validated = AccessToken(token)
                    scope["user"] = await _get_user(validated["user_id"])
                except (InvalidToken, TokenError, KeyError):
                    pass
        return await self.inner(scope, receive, send)
