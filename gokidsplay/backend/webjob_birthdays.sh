#!/bin/bash
echo "Starting Birthday Email Job..."
# Navigate to web root
cd $HOME/site/wwwroot

# Activate virtual environment if it exists (common Azure Python pattern)
if [ -f "antenv/bin/activate" ]; then
    source antenv/bin/activate
fi

# Run command
python manage.py send_daily_birthdays
echo "Job Finished."
