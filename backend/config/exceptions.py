import logging

from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        # Never log request bodies, flags, or credentials.
        logging.getLogger("audit").error("api_error type=%s", type(exc).__name__)
        return Response({"detail": "Something went wrong. Please retry."}, status=500)
    return response
