import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("No GOOGLE_API_KEY found in environment variables.")
    exit(1)

print(f"Testing key starting with: {api_key[:5]}...")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
response = requests.get(url)

if response.status_code == 200:
    models = response.json().get('models', [])
    print(f"Success! Found {len(models)} models.")
    for m in models:
        print(f"- {m['name']}")
else:
    print(f"Error {response.status_code}: {response.text}")
