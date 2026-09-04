"""Fix corrupted emoji/special chars in BookingWizard.tsx"""
import re

path = r'c:\Users\saksa\OneDrive\Desktop\spinpin\spinpin\frontend\components\BookingWizard.tsx'

with open(path, 'rb') as f:
    raw = f.read()

content = raw.decode('utf-8', errors='replace')
REPL = '\ufffd'  # replacement character

# Context-based replacements (order matters)
fixes = [
    # Currency: pound sign
    (REPL + '2.95', '\u00a32.95'),
    (REPL + '9.95', '\u00a39.95'),
    # En-dash in age ranges
    ('1' + REPL + '6 yrs', '1\u20136 yrs'),
    ('4' + REPL + '6 yrs', '4\u20136 yrs'),
    # En-dash in descriptions
    ('tokens ' + REPL + ' best value', 'tokens \u2013 best value'),
    # Em-dash
    ('runtime ' + REPL + ' see', 'runtime \u2014 see'),
    # Pound sign in other contexts
    (REPL + '1', '\u00a31'),
    (REPL + '3', '\u00a33'),
    (REPL + '5', '\u00a35'),
]

for old, new in fixes:
    if old in content:
        content = content.replace(old, new)
        print(f'Fixed: {repr(old[:30])} -> {repr(new[:30])}')

# Now fix emoji patterns - corrupted bytes that show as multiple REPL chars
# Pattern: emoji: "XX" where X is REPL char
# Replace based on context
emoji_fixes = [
    # In getActivityAddOns
    ('Quality quad skates", emoji: "' + REPL + REPL + '"', 'Quality quad skates", emoji: "\u26F8\uFE0F"'),
    ('Secure your belongings", emoji: "' + REPL + REPL + '"', 'Secure your belongings", emoji: "\U0001F512"'),
    ('Bowling shoe rental", emoji: "' + REPL + REPL + '"', 'Bowling shoe rental", emoji: "\U0001F45F"'),
    ('20 game tokens", emoji: "' + REPL + REPL + '"', '20 game tokens", emoji: "\U0001FA99"'),
    ('50 game tokens', '50 game tokens'),
    ('best value!", emoji: "' + REPL + REPL + '"', 'best value!", emoji: "\U0001FA99"'),
    # Step icons and labels
    (REPL + REPL + ' Adults', '\U0001D7EC Adults'),  # will try alternate
]

for old, new in emoji_fixes:
    if old in content:
        content = content.replace(old, new)
        print(f'Fixed emoji: ...{repr(old[:40])}...')

# Final cleanup: replace any remaining lone REPL chars
# Find remaining and show context
remaining_count = content.count(REPL)
print(f'\nRemaining corrupted chars: {remaining_count}')

lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if REPL in line:
        snip = line.strip()[:150]
        print(f'  Line {i}: {snip}')

# Remove remaining replacement chars (they're just garbled display chars)
content = content.replace(REPL, '')
print(f'\nCleaned all remaining {REPL} chars')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('File saved successfully!')
