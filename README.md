# Finesta – Stock Scoring Software  

**Finesta** is a comprehensive investment scoring platform that integrates multiple **financial metrics**, normalized against **industry peers and standards**, combined with **sentiment analysis** to reflect market perception.  

It evaluates companies across metrics like **earnings per share (EPS)**, **price-to-earnings (P/E) ratios**, **debt-to-assets**, and **industry growth rates**, applying **advanced normalization techniques** for fair comparisons.  

To ensure interpretability, Finesta leverages **Google’s Gemini API** as an explainability layer, generating **clear narrative justifications** of each company’s score. This empowers investors to understand **why** a stock is rated as a **buy, hold, or sell**—not just the numeric outcome.  

---

![WhatsApp Image 2025-09-04 at 5 44 32 PM](https://github.com/user-attachments/assets/9a3594a7-6331-4a57-8019-49bbe1c52a89)
![WhatsApp Image 2025-09-04 at 5 44 31 PM](https://github.com/user-attachments/assets/62dfc469-eaa9-4b8e-863c-490014f35090)
![WhatsApp Image 2025-09-04 at 5 44 31 PM (1)](https://github.com/user-attachments/assets/4d5f07f6-d962-4b50-9bd4-146bbb6fbc30)


## 📑 Table of Contents  

- [Overview](#-overview)  
- [Architecture](#-architecture)  
- [Technologies](#-technologies)  
- [Features](#-features)  
- [Getting Started](#-getting-started)  
  - [Prerequisites](#prerequisites)  
  - [Installation](#installation)  
  - [Running the App](#running-the-app)  
- [Usage](#-usage)  
- [Configuration](#-configuration)  
- [Project Structure](#-project-structure)  

---

## 🔎 Overview  

Finesta integrates **fundamental, technical, and sentiment-based indicators** into a single score:  

- **Backend** → Computes normalized stock scores across industries.  
- **Sentiment Analysis** → Incorporates market perception from **news & social media** using NLP.  
- **Explainability Layer** → Gemini API generates natural-language explanations of scoring logic.  
- **Frontend** → Visualizes performance, trends, and comparisons.  

✅ The outcome: A **data-driven, explainable stock assessment system**.  

---

## 🏛️ Architecture  

The system follows a **multi-layered design**:  

1. **Backend** — Data ingestion, feature extraction, scoring engine, normalization vs peers.  
2. **Sentiment Module** — Uses FinBERT-based transformer models to evaluate news/social sentiment.  
3. **Explainability Layer** — Gemini API converts scores into human-readable justifications.  
4. **Frontend** — React-based dashboards for investors to explore scores, trends, and comparisons.  

---

## 🛠️ Technologies  

- **Backend**: Node.js, Express.js  
- **Frontend**: React, TailwindCSS  
- **Sentiment Analysis**: Python (FinBERT) + FastAPI  
- **Explainability**: Google Gemini API  
- **Data Sources / APIs**:  
  - `NewsAPI` (news sentiment feed)  
  - `Financial Modelling Prep API` (fundamentals)  
  - `yfinance` (real-time & historical stock data)  

---

## ⭐ Features  

- Fetches **real-time & historical stock data**.  
- **Normalizes financial metrics** across industry peers.  
- Computes a **composite stock score** (fundamentals + sentiment).  
- **Explainable scoring** with Gemini API (why a stock got its score).  
- Intuitive **frontend dashboards** for:  
  - Stock scores & justifications  
  - Historical performance & trends  
  - Peer comparisons  
- **Export options** for reports & data.  
- **Modular architecture** for easy scalability.  

---

## 🚀 Getting Started  

### Prerequisites  

- Node.js (latest LTS)  
- Python (>=3.9)  
- Package managers: `npm`, `yarn`, `pip`  
- API keys for:  
  - `NewsAPI`  
  - `Financial Modelling Prep`  
  - `Gemini`  

### Installation  

```bash
# Clone repo
git clone https://github.com/Sumit0717/Stock-Scoring-Software.git
cd Stock-Scoring-Software

# Backend setup
cd backend
npm install

# Sentiment analysis module
cd sentiment
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
```

📊 Usage

- Input stock tickers (e.g., AAPL, GOOGL).
- View:
- Composite stock score
- Breakdown (fundamentals, sentiment, technicals)
- Gemini-powered narrative explanation
- Compare companies across industry benchmarks.

⚙️ Configuration

Each module contains a config file:
- Backend/config.js → API keys, normalization settings
- Sentiment/config.py → FinBERT model configs
- Frontend/config.js → UI & API endpoints


## 📂 Project Structure

- **Stock-Scoring-Software/**
  - **backend/** – Node.js backend (scoring engine, normalization)
    - config.js  
    - routes/  
    - services/  
  - **sentiment/** – Python sentiment module (FinBERT + FastAPI)
    - app.py  
    - models/  
    - config.py  
  - **frontend/** – React + Tailwind UI
    - src/  
    - components/  
    - config.js   
  - **README.md** – Project readme  

