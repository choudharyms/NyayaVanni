import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

with open("models.txt", "w", encoding="utf-8") as f:
    for m in genai.list_models():
        f.write(f"{m.name}\n")
