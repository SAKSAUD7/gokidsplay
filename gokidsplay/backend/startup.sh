#!/bin/bash
set -e

# Temporarily bypassed to prevent DB lock hangs during crash loop recovery
# python manage.py migrate --noinput


echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn --bind=0.0.0.0:8000 --timeout 120 --workers 2 --access-logfile - --error-logfile - ninja_backend.wsgi:application
