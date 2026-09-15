#!/bin/sh
set -eu
python manage.py migrate --noinput
python manage.py bootstrap_admin
if [ "${DEMO_MODE:-0}" = "1" ]; then python manage.py seed_portfolio; fi
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers 2 --threads 2 --timeout 60 --access-logfile -
