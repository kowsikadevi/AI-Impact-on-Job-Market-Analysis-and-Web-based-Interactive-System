# ============================================================
# AI IMPACT ANALYZER - FASTAPI BACKEND
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
import numpy as np

# ============================================================
# INITIALIZE FASTAPI
# ============================================================

app = FastAPI(title="AI Impact Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# LOAD DATASET
# ============================================================

df = pd.read_csv("data/job_details_dataset.csv")

# ============================================================
# LOAD MODEL FILES
# ============================================================

model = joblib.load("model/best_ai_impact_model.pkl")
scaler = joblib.load("model/scaler.pkl")
label_encoder = joblib.load("model/label_encoder.pkl")

# ============================================================
# THRESHOLD LOGIC (IMPORTANT)
# ============================================================

def impact_threshold(ai_percent):
    if ai_percent <= 33:
        return "Low"
    elif ai_percent <= 66:
        return "Medium"
    else:
        return "High"

# Ensure dataset column exists
df['AI_Impact_Level'] = df['AI Impact'].apply(impact_threshold)

# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def home():
    return {"message": "AI Impact Analyzer Backend Running ✅"}

# ============================================================
# 1️⃣ GET ALL INDUSTRIES
# ============================================================

@app.get("/industries")
def get_industries():
    industries = sorted(df['Industry'].unique())
    return {"industries": industries}

# ============================================================
# 2️⃣ GET TOP JOBS BY INDUSTRY
# ============================================================

@app.get("/jobs/{industry_name}")
def get_top_jobs(industry_name: str):

    industry_df = df[
       df['Industry'].str.strip().str.lower() 
       == industry_name.strip().lower()
    ]

    if industry_df.empty:
        return {
            "status": "error",
            "message": "No jobs found for selected industry"
        }

    ranked = industry_df.sort_values(
        by='Expected Openings (2030)',
        ascending=False
    )

    top_jobs = ranked.head(3)

    job_list = []

    for _, row in top_jobs.iterrows():
        job_list.append({
            "Job Title": row['Job Title'],
            "AI Impact %": row['AI Impact'],
            "AI Impact Level": row['AI_Impact_Level'],
            "Required Education": row['Required Education'],
            "Median Salary (USD)": row['Median Salary (USD)'],
            "Automation Risk %": row['Automation Risk (%)'],
            "Expected Openings (2030)": row['Expected Openings (2030)'],
            "Experience Required (Years)": row['Experience Required (Years)']
        })

    return {
        "industry": industry_name,
        "top_jobs": job_list
    }

# ============================================================
# 3️⃣ OPTIONAL → MODEL PREDICTION ENDPOINT
# ============================================================

@app.post("/predict")
def predict_impact(data: dict):

    try:
        features = np.array([[
            data['AI_Workload_Ratio'],
            data['Automation Risk (%)'],
            data['Experience Required (Years)'],
            data['Median Salary (USD)'],
            data['Expected Openings (2030)']
        ]])

        features_scaled = scaler.transform(features)

        prediction = model.predict(features_scaled)
        impact_level = label_encoder.inverse_transform(prediction)[0]

        return {
            "status": "success",
            "Predicted Impact Level": impact_level
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}