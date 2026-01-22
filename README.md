# Asthma Flow 🫁

**Asthma Flow** is a web-based clinical application designed to assist pharmacists at **Sawankhalok Hospital** in managing and monitoring asthma patients effectively.

This application streamlines the process of tracking patient outcomes, assessing inhaler techniques, and documenting Drug-Related Problems (DRPs), leveraging a modern tech stack for reliability and real-time data management.

## 🎯 Key Features

* **Patient Profile Management:** Centralized view of patient demographic and clinical data.
* **Symptom & ACT Tracking:** Monitor Asthma Control Test (ACT) scores and symptom trends over time.
* **Inhaler Technique Assessment:** Tools for recording and correcting patient inhalation methods.
* **DRP Documentation:** Log medication issues and pharmacist interventions.
* **Clinical Dashboard:** Visualizing key metrics for quick decision-making.

## 🛠 Technology Stack

This project moves beyond static data by integrating a robust backend database:

* **Frontend & Logic:** [Streamlit](https://streamlit.io/) (Python framework for data apps)
* **Database & Backend:** [Supabase](https://supabase.com/) (Open source Firebase alternative based on PostgreSQL)
* **Data Handling:** Pandas
* **Visualization:** Plotly / Altair

## ⚙️ Setup & Configuration

To run this project locally, you need to connect it to your Supabase instance.

1.  Clone the repository.
2.  Install requirements: `pip install -r requirements.txt`
3.  Create a `.streamlit/secrets.toml` file in the project root directory.
4.  Add your Supabase credentials:

```toml
[supabase]
url = "YOUR_SUPABASE_PROJECT_URL"
key = "YOUR_SUPABASE_API_KEY" # service_role or anon key depending on your RLS setup
