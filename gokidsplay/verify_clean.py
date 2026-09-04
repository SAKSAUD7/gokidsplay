import os, glob

root = r'c:\Users\saksa\OneDrive\Desktop\spinpin\spinpin\frontend'
files = (
    glob.glob(os.path.join(root, '**', '*.ts'), recursive=True) +
    glob.glob(os.path.join(root, '**', '*.tsx'), recursive=True)
)

issues = []
for f in files:
    try:
        with open(f, 'r', encoding='utf-8', errors='replace') as fh:
            content = fh.read()
        for line_no, line in enumerate(content.splitlines(), 1):
            line_l = line.lower()
            short = f.replace(root + os.sep, '')
            if '127.0.0.1:8000' in line or 'localhost:8000' in line:
                issues.append(('PORT8000', short, line_no, line.strip()))
            elif 'inflatable' in line_l:
                issues.append(('INFLATABLE', short, line_no, line.strip()))
            elif "india" in line_l and "spinpin" not in line_l:
                issues.append(('INDIA', short, line_no, line.strip()))
            elif 'NIP-' in line:
                issues.append(('NIP-PREFIX', short, line_no, line.strip()))
    except Exception:
        pass

if not issues:
    print('ALL CLEAN: No legacy branding or port issues found!')
else:
    for kind, f, ln, line in issues:
        print('[{}] {}:{}: {}'.format(kind, f, ln, line[:80]))

print('Total remaining issues: {}'.format(len(issues)))
