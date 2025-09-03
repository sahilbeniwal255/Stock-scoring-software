"""
Entity-level sentiment analyzer for financial statements/news.
Splits text into clauses, runs FinBERT per clause, and assigns
sentiment per entity. Supports filtering for a target entity and
aggregating mean sentiment across mentions.
"""

import re
from typing import List, Dict, Optional
import pandas as pd
import spacy
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# -------------------------
# Load models
# -------------------------
def load_pipeline(finbert_model_name="yiyanghkust/finbert-tone",
                  spacy_model_name="en_core_web_trf"):
    try:
        nlp = spacy.load(spacy_model_name)
    except OSError:
        raise RuntimeError(f"Run: python -m spacy download {spacy_model_name}")
    tokenizer = AutoTokenizer.from_pretrained(finbert_model_name)
    model = AutoModelForSequenceClassification.from_pretrained(finbert_model_name)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    id2label = {int(k): v.lower() for k,v in model.config.id2label.items()}
    return nlp, tokenizer, model, device, id2label

# -------------------------
# Entity extraction
# -------------------------
def extract_entities(doc, include_types=("ORG","PRODUCT","PERSON")) -> List[str]:
    ents = [ent.text.strip() for ent in doc.ents if ent.label_ in include_types]
    tickers = re.findall(r"\$[A-Za-z\.]{1,6}", doc.text)
    return list(dict.fromkeys(ents + tickers))  # dedupe preserving order

# -------------------------
# Clause splitting
# -------------------------
def split_into_clauses(doc, entities: List[str]) -> Dict[str, List[str]]:
    """Split the text into clauses and map entities -> their clause(s)."""
    clauses = re.split(r",|;| and | but | while |\. ", doc.text)
    entity_clauses = {ent: [] for ent in entities}
    for clause in clauses:
        for ent in entities:
            if ent.lower() in clause.lower():
                entity_clauses[ent].append(clause.strip())
    return {k:v for k,v in entity_clauses.items() if v}

# -------------------------
# Sentiment scoring
# -------------------------
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

# -------------------------
# Main
# -------------------------
def entity_sentiment_single(text: str,
                            finbert_model_name="yiyanghkust/finbert-tone",
                            spacy_model_name="en_core_web_trf",
                            entity_filter: Optional[str] = None) -> pd.DataFrame:
    """
    If entity_filter is provided, only return results for that entity.
    At the end, appends a mean sentiment row if multiple mentions exist.
    """
    nlp, tokenizer, model, device, id2label = load_pipeline(finbert_model_name, spacy_model_name)
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
        # Aggregate mean score for the filtered entity
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
# Example
# -------------------------
if __name__ == "__main__":
    text = "Apple market is growing rapidly while samsungs sees a drop in their year sales and Tata monthly sales are same as neutral."
    entity_name = input("Enter entity to analyze: ").strip()
    df = entity_sentiment_single(text, entity_filter=entity_name)
    print(df.to_string(index=False))
