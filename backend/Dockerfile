FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.10.4 /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev
COPY . .
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1
RUN DJANGO_DEBUG=1 python manage.py collectstatic --noinput && useradd --create-home app
USER app
EXPOSE 8000
CMD ["sh", "start.sh"]
