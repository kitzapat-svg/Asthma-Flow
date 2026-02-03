import streamlit as st
import pandas as pd

# Import Utils
from utils.gsheet_handler import load_data_staff, load_data_fast, log_action
from utils.style import load_custom_css, render_header

# Import Views
from views.patient_view import render_patient_view
from views.staff_dashboard import render_dashboard
from views.staff_action import render_patient_search, render_patient_profile, render_register_patient
from views.staff_import import render_import_appointment


# --- Page Config ---
st.set_page_config(
    page_title="Asthma Care Connect", 
    layout="wide", 
    page_icon="🫁",
    initial_sidebar_state="collapsed"
)
load_custom_css()

# ==========================================
# 🔐 SECURITY & CONFIG
# ==========================================
if "admin_password" not in st.secrets:
    st.error("❌ ไม่พบรหัสผ่านผู้ดูแลระบบ (กรุณาตั้งค่า admin_password ใน secrets.toml)")
    st.stop()

ADMIN_PASSWORD = st.secrets["admin_password"]

if "deploy_url" in st.secrets:
    BASE_URL = st.secrets["deploy_url"].rstrip("/")
else:
    BASE_URL = "http://localhost:8501" 

# ==========================================
# 🏥 SESSION STATE INITIALIZATION
# ==========================================
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False

if 'current_page' not in st.session_state:
    st.session_state.current_page = 'dashboard'

if 'selected_patient_hn' not in st.session_state:
    st.session_state.selected_patient_hn = None

if 'show_visit_form' not in st.session_state:
    st.session_state.show_visit_form = False

# ==========================================
# 🔗 NAVIGATION FUNCTIONS
# ==========================================
def navigate_to(page, patient_hn=None):
    st.session_state.current_page = page
    if patient_hn:
        st.session_state.selected_patient_hn = patient_hn
    st.rerun()

def go_back():
    st.session_state.current_page = 'dashboard'
    st.session_state.selected_patient_hn = None
    st.session_state.show_visit_form = False
    st.rerun()

# ==========================================
# 🏥 MAIN APP LOGIC
# ==========================================
query_params = st.query_params
target_token = query_params.get("token", None)

if target_token:
    # ---------------------------------------------------
    # 🟢 PATIENT VIEW (Public - Secure Token Access)
    # ---------------------------------------------------
    patients_db = load_data_fast("patients")
    
    target_hn = None
    if 'public_token' in patients_db.columns:
        match = patients_db[patients_db['public_token'] == target_token]
        if not match.empty:
            target_hn = match.iloc[0]['hn']
    
    if target_hn:
        visits_db = load_data_fast("visits")
        render_patient_view(target_hn, patients_db, visits_db)
    else:
        st.error("❌ Invalid or Expired Token (ไม่พบข้อมูลผู้ป่วย)")
        if st.button("กลับสู่หน้าหลัก"):
            st.query_params.clear()
            st.rerun()

else:
    # ---------------------------------------------------
    # 🔵 STAFF VIEW (Staff Portal)
    # ---------------------------------------------------
    
    # === LOGIN SCREEN ===
    if not st.session_state.logged_in:
        # Center the login form
        col1, col2, col3 = st.columns([1, 2, 1])
        
        with col2:
            st.markdown("""
                <div style="text-align: center; padding: 60px 0 40px 0;">
                    <div style="font-size: 80px; margin-bottom: 16px;">🫁</div>
                    <h1 style="font-size: 32px; font-weight: 700; color: #1a365d; margin-bottom: 8px;">Asthma Care Connect</h1>
                    <p style="color: #718096; font-size: 16px;">ระบบติดตามผู้ป่วยโรคหืด</p>
                </div>
            """, unsafe_allow_html=True)
            
            with st.container(border=True):
                st.markdown("#### 🔐 เข้าสู่ระบบเจ้าหน้าที่")
                pwd = st.text_input("รหัสผ่าน", type="password", placeholder="กรอกรหัสผ่าน...")
                
                col_btn1, col_btn2 = st.columns([1, 1])
                with col_btn1:
                    if st.button("เข้าสู่ระบบ", type="primary", use_container_width=True):
                        if pwd == ADMIN_PASSWORD:
                            st.session_state.logged_in = True
                            log_action("Admin", "Login", "Success")
                            st.rerun()
                        else:
                            st.error("❌ รหัสผ่านผิด")
                            log_action("Unknown", "Login Failed", "Wrong Password")
        st.stop()

    # === MAIN APP (After Login) ===
    
    # Load Data
    patients_db = load_data_staff("patients")
    visits_db = load_data_staff("visits")

    # --- SIDEBAR (Minimalist) ---
    with st.sidebar:
        st.markdown("""
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 48px;">🫁</div>
                <h3 style="color: white; margin: 8px 0;">Asthma Care</h3>
            </div>
        """, unsafe_allow_html=True)
        
        st.divider()
        
        # Quick Navigation
        if st.button("📊 Dashboard", use_container_width=True, 
                    type="primary" if st.session_state.current_page == 'dashboard' else "secondary"):
            navigate_to('dashboard')
            
        if st.button("🔍 ค้นหาผู้ป่วย", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'search' else "secondary"):
            navigate_to('search')
            
        if st.button("➕ ลงทะเบียนใหม่", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'register' else "secondary"):
            navigate_to('register')
            
        if st.button("📥 Import ข้อมูล", use_container_width=True,
                    type="primary" if st.session_state.current_page == 'import' else "secondary"):
            navigate_to('import')
        
        st.divider()
        
        # User Info
        st.success("✅ เข้าสู่ระบบแล้ว")
        if st.button("🔓 ออกจากระบบ", use_container_width=True):
            log_action("Admin", "Logout", "User Initiated")
            st.session_state.logged_in = False
            st.session_state.current_page = 'dashboard'
            st.rerun()

    # --- MAIN CONTENT AREA ---
    current_page = st.session_state.current_page
    
    # ========== DASHBOARD PAGE ==========
    if current_page == 'dashboard':
        # Quick Action Header
        st.markdown("""
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <h1 style="font-size: 32px; font-weight: 700; color: #1a365d; margin: 0;">📊 Dashboard</h1>
                    <p style="color: #718096; margin: 4px 0 0 0;">ภาพรวมคลินิกโรคหืด</p>
                </div>
            </div>
        """, unsafe_allow_html=True)
        
        # Quick Actions Grid
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            if st.button("🔍 ค้นหาผู้ป่วย", use_container_width=True, type="primary"):
                navigate_to('search')
                
        with col2:
            if st.button("➕ ลงทะเบียนใหม่", use_container_width=True):
                navigate_to('register')
                
        with col3:
            if st.button("📥 Import ข้อมูล", use_container_width=True):
                navigate_to('import')
                
        with col4:
            st.button("📋 รายงาน", use_container_width=True, disabled=True)
        
        st.divider()
        
        # Render Dashboard Content
        render_dashboard(visits_db, patients_db)
    
    # ========== SEARCH PAGE ==========
    elif current_page == 'search':
        # Back Button
        col_back, col_title = st.columns([1, 11])
        with col_back:
            if st.button("⬅️", help="กลับ"):
                go_back()
        with col_title:
            st.markdown("""
                <h1 style="font-size: 28px; font-weight: 700; color: #1a365d; margin: 0;">🔍 ค้นหาผู้ป่วย</h1>
            """, unsafe_allow_html=True)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        render_patient_search(patients_db, visits_db, BASE_URL, navigate_to)
    
    # ========== PATIENT PROFILE PAGE ==========
    elif current_page == 'patient_profile':
        selected_hn = st.session_state.selected_patient_hn
        
        if selected_hn:
            # Back Button
            col_back, col_title = st.columns([1, 11])
            with col_back:
                if st.button("⬅️", help="กลับ"):
                    navigate_to('search')
            with col_title:
                st.markdown("""
                    <h1 style="font-size: 28px; font-weight: 700; color: #1a365d; margin: 0;">👤 ข้อมูลผู้ป่วย</h1>
                """, unsafe_allow_html=True)
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            render_patient_profile(selected_hn, patients_db, visits_db, BASE_URL)
        else:
            st.warning("กรุณาเลือกผู้ป่วยก่อน")
            if st.button("🔍 ไปหน้าค้นหา"):
                navigate_to('search')
    
    # ========== REGISTER PAGE ==========
    elif current_page == 'register':
        # Back Button
        col_back, col_title = st.columns([1, 11])
        with col_back:
            if st.button("⬅️", help="กลับ"):
                go_back()
        with col_title:
            st.markdown("""
                <h1 style="font-size: 28px; font-weight: 700; color: #1a365d; margin: 0;">➕ ลงทะเบียนผู้ป่วยใหม่</h1>
            """, unsafe_allow_html=True)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        render_register_patient(patients_db)
    
    # ========== IMPORT PAGE ==========
    elif current_page == 'import':
        # Back Button
        col_back, col_title = st.columns([1, 11])
        with col_back:
            if st.button("⬅️", help="กลับ"):
                go_back()
        with col_title:
            st.markdown("""
                <h1 style="font-size: 28px; font-weight: 700; color: #1a365d; margin: 0;">📥 นำเข้าข้อมูล</h1>
            """, unsafe_allow_html=True)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        render_import_appointment(patients_db, visits_db)
