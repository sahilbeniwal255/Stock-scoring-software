from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import Optional
import pandas as pd
from EntitySentiment import entity_sentiment_single, load_pipeline

# Initialize FastAPI
app = FastAPI(
    title="Entity-Level Financial Sentiment API",
    description="Runs entity-based sentiment analysis on financial texts using FinBERT + spaCy",
    version="1.0.0"
)

# Load pipeline ONCE at startup (so models don’t reload every request)
nlp, tokenizer, model, device, id2label = load_pipeline()

class SentimentRequest(BaseModel):
    text: str
    entity_filter: Optional[str] = None

@app.post("/analyze")
def analyze_sentiment(req: SentimentRequest):
    df = entity_sentiment_single(
        text=req.text,
        entity_filter=req.entity_filter,
        finbert_model_name="yiyanghkust/finbert-tone",
        spacy_model_name="en_core_web_trf"
    )
    return df.to_dict(orient="records")

@app.get("/")
def root():
    return {"message": "Entity-Level Financial Sentiment API is running!"}
