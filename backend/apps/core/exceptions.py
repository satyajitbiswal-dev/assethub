from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Returns a consistent error envelope:
    { "success": false, "message": "...", "errors": {...} }
    """
    response = exception_handler(exc, context)

    if response is not None:
        data = response.data

        # Flatten single-key non-field errors
        if isinstance(data, dict):
            message = data.get("detail", "")
            if not message:
                # Grab first message from any field
                for v in data.values():
                    if isinstance(v, list) and v:
                        message = v[0] if isinstance(v[0], str) else str(v[0])
                        break
                    elif isinstance(v, str):
                        message = v
                        break

            response.data = {
                "success": False,
                "message": str(message) if message else "An error occurred.",
                "errors": data,
            }
        elif isinstance(data, list):
            response.data = {
                "success": False,
                "message": data[0] if data else "An error occurred.",
                "errors": data,
            }

    return response
