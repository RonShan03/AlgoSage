import uvicorn
from fastapi import FastAPI, Request
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

app = FastAPI()

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
print("GEMINI_API_KEY:", GEMINI_API_KEY)

class TopicRequest(BaseModel):
    topic: str

@app.get("/")
def root():
    return {"message": "Python microservice is running"}

@app.post("/rag-query")
def rag_query(query: dict):
    # Example: query Pinecone + Gemini here
    user_input = query.get("text", "")
    
    # Stub response (replace with Pinecone + Gemini logic)
    return {"answer": f"Response for: {user_input}"}


@app.post("/process-topic")
async def process_topic(req: TopicRequest):
    topic = req.topic

    # Example Gemini API call
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_API_KEY
    }
    payload = {
        "contents": [{"parts": [{"text": f"Give a short 6-8 sentence description about {topic} in DSA"}]}]
    }

    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        data = response.json()
        # Gemini returns text in data['candidates'][0]['content'] (check exact structure)
        gemini_text = data["candidates"][0]["content"]
    else:
        gemini_text = "Error fetching description from Gemini."

    return {"message": gemini_text}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)

