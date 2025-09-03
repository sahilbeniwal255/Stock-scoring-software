import os
import re
from typing import List, Dict, Optional
import pandas as pd
import spacy
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import uvicorn
import gradio as gr



# -------------------------
# Load models once at startup
# -------------------------
FINBERT_MODEL = "yiyanghkust/finbert-tone"
SPACY_MODEL = "en_core_web_sm"   # ✅ lighter spaCy model for Render free tier

print("Loading models... this may take a minute on first startup.")
try:
    nlp = spacy.load(SPACY_MODEL)
except OSError:
    raise RuntimeError(f"Run: python -m spacy download {SPACY_MODEL}")

tokenizer = AutoTokenizer.from_pretrained(FINBERT_MODEL)
model = AutoModelForSequenceClassification.from_pretrained(FINBERT_MODEL)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
id2label = {int(k): v.lower() for k, v in model.config.id2label.items()}

# -------------------------
# Core functions
# -------------------------
def extract_entities(doc, include_types=("ORG","PRODUCT","PERSON")) -> List[str]:
    ents = [ent.text.strip() for ent in doc.ents if ent.label_ in include_types]
    tickers = re.findall(r"\$[A-Za-z\.]{1,6}", doc.text)
    return list(dict.fromkeys(ents + tickers))

def split_into_clauses(doc, entities: List[str]) -> Dict[str, List[str]]:
    clauses = re.split(r",|;| and | but | while |\. ", doc.text)
    entity_clauses = {ent: [] for ent in entities}
    for clause in clauses:
        for ent in entities:
            if ent.lower() in clause.lower():
                entity_clauses[ent].append(clause.strip())
    return {k:v for k,v in entity_clauses.items() if v}

def predict_probs(text, tokenizer, model, device, id2label):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512).to(device)
    with torch.no_grad():
        logits = model(**inputs).logits
        probs = F.softmax(logits, dim=-1).cpu().numpy()[0]
    labels = [id2label[i] for i in range(len(probs))]
    return {labels[i]: float(probs[i]) for i in range(len(probs))}

def probs_to_score(probs: Dict[str,float]) -> float:
    p_pos, p_neg = probs.get("positive",0), probs.get("negative",0)
    s = 0.5 + 0.5*(p_pos - p_neg)
    return max(0,min(1,s))

def entity_sentiment_single(text: str, entity_filter: Optional[str] = None) -> pd.DataFrame:
    doc = nlp(text)
    entities = extract_entities(doc)
    if not entities:
        return pd.DataFrame(columns=["entity","score","label","clause"])

    if entity_filter:
        entities = [e for e in entities if entity_filter.lower() in e.lower()]
        if not entities:
            return pd.DataFrame(columns=["entity","score","label","clause"])

    entity_clauses = split_into_clauses(doc, entities)
    rows = []
    for ent, clauses in entity_clauses.items():
        for clause in clauses:
            probs = predict_probs(clause, tokenizer, model, device, id2label)
            score = probs_to_score(probs)
            label = "positive" if score>0.5 else "negative" if score<0.5 else "neutral"
            rows.append({"entity":ent,"score":score,"label":label,"clause":clause})

    df = pd.DataFrame(rows)
    if not df.empty and entity_filter:
        mean_score = df["score"].mean()
        mean_label = "positive" if mean_score>0.5 else "negative" if mean_score<0.5 else "neutral"
        df = pd.concat([df, pd.DataFrame([{
            "entity": entity_filter,
            "score": mean_score,
            "label": f"MEAN-{mean_label}",
            "clause": "AGGREGATED"
        }])], ignore_index=True)
    return df

# -------------------------
# API Setup
# -------------------------
app = FastAPI(title="Entity-level Financial Sentiment API")

from fastapi.middleware.cors import CORSMiddleware

# After app = FastAPI(...)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify: ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SentimentRequest(BaseModel):
    text: str
    entity: Optional[str] = None

@app.get("/", response_class=HTMLResponse)
def home():
    return """
    <html>
        <head><title>Financial Sentiment API</title></head>
        <body style="font-family: sans-serif; max-width:600px; margin:auto;">
            <h2>📈 Financial Sentiment Analyzer</h2>
            <p>POST text to <code>/analyze</code> with JSON payload like:</p>
            <pre>{
  "text": "Apple reported growth while Samsung faced losses.",
  "entity": "Apple"
}</pre>
            <p>👉 Try the interactive API docs at <a href="/docs">/docs</a></p>
            <p>👉 Or test the UI at <a href="/gradio">/gradio</a></p>
        </body>
    </html>
    """

@app.post("/analyze")
def analyze_sentiment(request: SentimentRequest):
    df = entity_sentiment_single(request.text, entity_filter=request.entity)
    return df.to_dict(orient="records")

# -------------------------
# Optional Gradio UI
# -------------------------
def gradio_interface(text, entity):
    df = entity_sentiment_single(text, entity_filter=entity)
    return df

iface = gr.Interface(
    fn=gradio_interface,
    inputs=[gr.Textbox(label="Enter financial text"), gr.Textbox(label="Entity (optional)")],
    outputs="dataframe",
    title="📊 Financial Entity Sentiment Analyzer"
)

@app.get("/gradio")
def gradio_ui():
    return HTMLResponse(iface.launch(share=False, inline=True))

# -------------------------
# Entry point
# -------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  # Render sets $PORT
    uvicorn.run("sentiment_api:app", host="0.0.0.0", port=port)
