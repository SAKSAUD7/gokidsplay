@echo off
echo Starting Birthday Email Job...
cd %HOME%\site\wwwroot
python manage.py send_daily_birthdays
echo Job Finished.
