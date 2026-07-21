import os

directory = r'C:\Nithish\Projects\AI Resume Management Platform\Frontend'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False
    
    # Fix double process.env
    old_str = "(process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'))"
    new_str = "(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')"
    if old_str in content:
        content = content.replace(old_str, new_str)
        changed = True

    # Fix template literal double process.env
    old_str2 = "${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')}"
    new_str2 = "${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}"
    if old_str2 in content:
        content = content.replace(old_str2, new_str2)
        changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

for root, dirs, files in os.walk(directory):
    if 'node_modules' in root or '.next' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            if process_file(filepath):
                print(f'Updated {filepath}')
