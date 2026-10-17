"""
Coventry City Council school holidays and UK bank holidays.

Source: "School term dates 2026-2027" (coventry.gov.uk/termdates). Go Kids Play
also opens on weekdays (Monday–Friday) on these dates. Must match the lists in
frontend/lib/api/types.ts (a test checks they are identical).

Each new school year, add the council's dates here and in types.ts. One-off
openings or closures are made in the admin portal (Calendar → Opening Days).
"""
from datetime import date

# (first day, last day) inclusive — the council's pink "Holiday" days and the
# green LA training day
SCHOOL_HOLIDAY_RANGES = [
    # 2025
    ("2025-05-26", "2025-05-30"),  # Spring half-term
    ("2025-07-23", "2025-08-31"),  # Summer holiday
    ("2025-10-20", "2025-10-24"),  # Autumn half-term
    ("2025-12-20", "2026-01-04"),  # Christmas & New Year
    # 2026 spring/summer
    ("2026-02-16", "2026-02-20"),  # Spring half-term
    ("2026-03-30", "2026-04-10"),  # Easter holidays
    ("2026-05-25", "2026-05-29"),  # Summer half-term
    # 2026-27 school year
    ("2026-07-22", "2026-09-01"),  # Summer holiday 2026 + 1 Sep LA training day
    ("2026-10-26", "2026-10-30"),  # Autumn half-term
    ("2026-12-21", "2027-01-01"),  # Christmas & New Year
    ("2027-02-15", "2027-02-19"),  # Spring half-term
    ("2027-03-29", "2027-04-09"),  # Easter holidays
    ("2027-05-31", "2027-06-04"),  # Summer half-term
    ("2027-07-22", "2027-08-31"),  # Summer holiday 2027
]

# The council calendar's black "Bank holiday" days
UK_BANK_HOLIDAYS = {
    "2025-12-25", "2025-12-26",
    "2026-01-01", "2026-04-03", "2026-04-06", "2026-05-04", "2026-05-25", "2026-08-31",
    "2026-12-25", "2026-12-28",
    "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03", "2027-05-31", "2027-08-30",
}

_RANGES = [(date.fromisoformat(a), date.fromisoformat(b)) for a, b in SCHOOL_HOLIDAY_RANGES]


def is_bank_holiday(day: date) -> bool:
    return day.isoformat() in UK_BANK_HOLIDAYS


def is_school_holiday(day: date) -> bool:
    return any(start <= day <= end for start, end in _RANGES)


def is_holiday(day: date) -> bool:
    """Schools are off (holiday, bank holiday or training day)."""
    return is_bank_holiday(day) or is_school_holiday(day)
