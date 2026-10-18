#!/bin/bash
set -e

# Apply database changes from the new release before the site starts
echo "Applying database migrations..."
python manage.py migrate --noinput


echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn --bind=0.0.0.0:${PORT:-8000} --timeout 120 --workers 2 --access-logfile - --error-logfile - ninja_backend.wsgi:application
