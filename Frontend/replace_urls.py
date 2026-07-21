import os

directory = r'C:\Nithish\Projects\AI Resume Management Platform\Frontend'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '127.0.0.1:8000' not in content:
        return False

    content = content.replace('`http://127.0.0.1:8000', '`${process.env.NEXT_PUBLIC_API_URL || \'http://127.0.0.1:8000\'}')
    content = content.replace('\'http://127.0.0.1:8000/', '(process.env.NEXT_PUBLIC_API_URL || \'http://127.0.0.1:8000\') + \'/')
    content = content.replace('\"http://127.0.0.1:8000/', '(process.env.NEXT_PUBLIC_API_URL || \'http://127.0.0.1:8000\') + \"/')
    content = content.replace('\'http://127.0.0.1:8000\'', '(process.env.NEXT_PUBLIC_API_URL || \'http://127.0.0.1:8000\')')
    content = content.replace('\"http://127.0.0.1:8000\"', '(process.env.NEXT_PUBLIC_API_URL || \'http://127.0.0.1:8000\')')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

for root, dirs, files in os.walk(directory):
    if 'node_modules' in root or '.next' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            if process_file(filepath):
                print(f'Updated {filepath}')
