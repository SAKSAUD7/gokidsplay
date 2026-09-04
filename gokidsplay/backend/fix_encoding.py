import os

file_path = 'backend/requirements.txt'

try:
    # Try reading as UTF-16 (common PowerShell encoding)
    with open(file_path, 'r', encoding='utf-16') as f:
        content = f.read()
    print("Read as UTF-16")
except:
    try:
        # Try UTF-8
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        print("Read as UTF-8")
    except:
        # Fallback to binary/latin1
        with open(file_path, 'rb') as f:
            content = f.read().decode('latin1')
        print("Read as Binary/Latin1")

# Clean content (remove null bytes, ensure newlines)
content = content.replace('\x00', '')
lines = [line.strip() for line in content.splitlines() if line.strip()]

# Write back as UTF-8
with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

print(f"Fixed encoding for {file_path}")
print("First 5 lines:")
print('\n'.join(lines[:5]))
print("Last 5 lines:")
print('\n'.join(lines[-5:]))
