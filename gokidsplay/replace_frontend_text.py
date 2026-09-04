import os
import re

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), 'frontend')

# Order matters: we want to replace Spin Pin before SpinPin
REPLACEMENTS = [
    (r'Spin\s*Pin', 'Go Kids Play'),
    (r'SpinPin', 'GoKidsPlay'),
    (r'spinpin', 'gokidsplay'),
    (r'spin-pin', 'gokidsplay'),
    (r'SPIN\s*PIN', 'GO KIDS PLAY'),
    (r'SPINPIN', 'GOKIDSPLAY')
]

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return # Skip binary files
    
    new_content = content
    for pattern, repl in REPLACEMENTS:
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {os.path.relpath(filepath, FRONTEND_DIR)}")

def walk_dir():
    for root, dirs, files in os.walk(FRONTEND_DIR):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.next' in dirs:
            dirs.remove('.next')
        if '.git' in dirs:
            dirs.remove('.git')
            
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css')):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    print("Starting text replacement in frontend...")
    walk_dir()
    print("Done!")
