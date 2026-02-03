import streamlit as st
import pandas as pd
from datetime import datetime, date, timedelta
import qrcode
import io
import base64
import uuid

# Import Utils
from utils.gsheet_handler import save_patient_data, save_visit_data, update_patient_status, update_patient_token, log_action
from utils.calculations import (
    calculate_predicted_pefr, get_action_plan_zone, get_percent_predicted,
    check_technique_status, plot_pefr_chart, generate_qr
)
from utils.style import render_zone_badge, render_wizard_steps


def get_base64_qr(data):
    qr = qrcode.QRCode(version=1, box_size=10, border=1)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()


# ==========================================
# 📋 PATIENT REGISTRATION
# ==========================================
def render_register_patient(patients_db):
    with st.container(border=True):
        st.markdown("##### 📝 กรอกข้อมูลผู้ป่วยใหม่")
        
        with st.form("register_form", clear_on_submit=True):
            col1, col2 = st.columns(2)
            reg_hn_input = col1.text_input("HN (เลขประจำตัวผู้ป่วย)", placeholder="เช่น 1234567")
            reg_prefix = col2.selectbox("คำนำหน้า", ["นาย", "นาง", "น.ส.", "ด.ช.", "ด.ญ."])
            
            col3, col4 = st.columns(2)
            reg_fname = col3.text_input("ชื่อจริง", placeholder="กรอกชื่อ")
            reg_lname = col4.text_input("นามสกุล", placeholder="กรอกนามสกุล")
            
            col5, col6 = st.columns(2)
            reg_dob = col5.date_input("วันเกิด", min_value=datetime(1920, 1, 1), max_value=datetime.today())
            reg_height = col6.number_input("ส่วนสูง (cm)", 0, 300, 160)
            
            reg_best_pefr = st.number_input("Personal Best PEFR (ถ้ามี)", 0, 900, 0)
            
            col_btn, _ = st.columns([1, 3])
            with col_btn:
                submitted = st.form_submit_button("✅ ลงทะเบียน", type="primary", use_container_width=True)
            
            if submitted:
                errors = []
                if not reg_hn_input or not reg_fname or not reg_lname:
                    errors.append("กรุณากรอกข้อมูลให้ครบถ้วน (HN, ชื่อ, นามสกุล)")
                if reg_hn_input and not reg_hn_input.isdigit():
                    errors.append("HN ต้องเป็นตัวเลขเท่านั้น")
                if reg_height < 50 or reg_height > 250:
                    errors.append(f"ส่วนสูงผิดปกติ ({reg_height} cm) ควรอยู่ระหว่าง 50 - 250 cm")
                if reg_dob > date.today():
                    errors.append("วันเกิดห้ามเป็นอนาคต")

                if errors:
                    for err in errors:
                        st.error(f"❌ {err}")
                    return

                formatted_hn = str(reg_hn_input).strip().zfill(7)
                if formatted_hn in patients_db['hn'].values:
                    st.error(f"❌ HN {formatted_hn} มีอยู่ในระบบแล้ว")
                    return
                
                new_token = str(uuid.uuid4())
                new_pt_data = {
                    "hn": formatted_hn, "prefix": reg_prefix, "first_name": reg_fname,
                    "last_name": reg_lname, "dob": str(reg_dob),
                    "best_pefr": reg_best_pefr, "height": reg_height,
                    "public_token": new_token
                }
                try:
                    save_patient_data(new_pt_data)
                    log_action("Admin", "Register Patient", f"HN: {formatted_hn}")
                    st.success(f"🎉 ลงทะเบียนสำเร็จ! HN: {formatted_hn}")
                    st.balloons()
                except Exception as e:
                    st.error(f"Error: {e}")


# ==========================================
# 🔍 PATIENT SEARCH
# ==========================================
def render_patient_search(patients_db, visits_db, base_url, navigate_fn):
    # Search Input
    search_query = st.text_input(
        "🔍 ค้นหาผู้ป่วย",
        placeholder="พิมพ์ HN, ชื่อ, หรือนามสกุล...",
        label_visibility="collapsed"
    )
    
    # Filter patients
    if search_query:
        query_lower = search_query.lower().strip()
        # Search in HN, first_name, last_name
        mask = (
            patients_db['hn'].astype(str).str.contains(query_lower, case=False, na=False) |
            patients_db['first_name'].astype(str).str.lower().str.contains(query_lower, na=False) |
            patients_db['last_name'].astype(str).str.lower().str.contains(query_lower, na=False)
        )
        filtered_patients = patients_db[mask]
    else:
        # Show recent patients (limit to 20)
        filtered_patients = patients_db.head(20)
    
    # Results Count
    total_count = len(filtered_patients)
    if search_query:
        st.caption(f"พบ {total_count} รายการ")
    else:
        st.caption(f"แสดง {total_count} รายการล่าสุด (กรอกคำค้นหาเพื่อค้นหาเพิ่มเติม)")
    
    st.divider()
    
    # Patient Cards
    if not filtered_patients.empty:
        for idx, row in filtered_patients.iterrows():
            hn = row['hn']
            name = f"{row.get('prefix', '')}{row.get('first_name', '')} {row.get('last_name', '')}"
            status = row.get('status', 'Active')
            if pd.isna(status) or str(status).strip() == "":
                status = "Active"
            
            # Status Color
            if status == "Discharge":
                status_color = "gray"
                status_emoji = "⚪"
            elif status == "COPD":
                status_color = "orange"
                status_emoji = "🟠"
            else:
                status_color = "green"
                status_emoji = "🟢"
            
            # Get last visit info
            pt_visits = visits_db[visits_db['hn'] == hn]
            if not pt_visits.empty:
                pt_visits['date'] = pd.to_datetime(pt_visits['date'], errors='coerce')
                last_visit = pt_visits.sort_values('date').iloc[-1]
                last_visit_str = last_visit['date'].strftime('%d/%m/%Y')
            else:
                last_visit_str = "ยังไม่มี Visit"
            
            # Card Layout
            col1, col2, col3 = st.columns([3, 2, 1])
            
            with col1:
                st.markdown(f"**{name}**")
                st.caption(f"HN: {hn}")
            
            with col2:
                st.caption(f"Visit ล่าสุด: {last_visit_str}")
                st.markdown(f"{status_emoji} {status}")
            
            with col3:
                if st.button("ดูข้อมูล", key=f"view_{hn}", use_container_width=True):
                    navigate_fn('patient_profile', hn)
            
            st.divider()
    else:
        st.info("🔍 ไม่พบผู้ป่วยที่ตรงกับคำค้นหา")


# ==========================================
# 👤 PATIENT PROFILE
# ==========================================
def render_patient_profile(selected_hn, patients_db, visits_db, base_url):
    if selected_hn not in patients_db['hn'].values:
        st.error("❌ ไม่พบข้อมูลผู้ป่วยรายนี้")
        return
    
    # Reset visit form state
    if st.session_state.get('reset_visit_form', False):
        if 'assess_toggle' in st.session_state:
            st.session_state['assess_toggle'] = False
        keys_to_clear = [k for k in st.session_state.keys() if k.startswith('step_') or k.startswith('adv_')]
        for k in keys_to_clear:
            del st.session_state[k]
        st.session_state['reset_visit_form'] = False
    
    pt_data = patients_db[patients_db['hn'] == selected_hn].iloc[0]
    pt_visits = visits_db[visits_db['hn'] == selected_hn]
    
    # Patient Status
    current_status = pt_data.get('status', 'Active')
    if pd.isna(current_status) or str(current_status).strip() == "":
        current_status = "Active"
    
    status_colors = {"Active": "#10B981", "Discharge": "#9CA3AF", "COPD": "#F59E0B"}
    status_color = status_colors.get(current_status, "#10B981")
    
    # Token Check
    public_token = pt_data.get('public_token', '')
    if pd.isna(public_token) or str(public_token).strip() == "" or str(public_token).lower() == "nan":
        with st.spinner("Creating Secure Token..."):
            new_token = str(uuid.uuid4())
            if update_patient_token(selected_hn, new_token):
                log_action("Admin", "Generate Token", f"HN: {selected_hn}")
                public_token = new_token
                st.rerun()
            else:
                st.error("Failed to generate token")
    
    # Calculate Basic Info
    dob = pd.to_datetime(pt_data['dob'])
    age = (datetime.now() - dob).days // 365
    height = pt_data.get('height', 0)
    predicted_pefr = calculate_predicted_pefr(age, height, pt_data['prefix'])
    ref_pefr = predicted_pefr if predicted_pefr > 0 else pt_data.get('best_pefr', 0)
    
    # ========== PROFILE HEADER ==========
    st.markdown(f"""
        <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            padding: 28px;
            margin-bottom: 24px;
            color: white;
            position: relative;
            overflow: hidden;
        ">
            <div style="position: relative; z-index: 1;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h2 style="margin: 0; font-size: 28px; font-weight: 700;">
                            {pt_data['prefix']}{pt_data['first_name']} {pt_data['last_name']}
                        </h2>
                        <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">HN: {selected_hn}</p>
                    </div>
                    <div style="
                        background: rgba(255,255,255,0.2);
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-weight: 500;
                    ">
                        {current_status}
                    </div>
                </div>
            </div>
        </div>
    """, unsafe_allow_html=True)
    
    # ========== INFO CARDS ==========
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("อายุ", f"{age} ปี")
    col2.metric("ส่วนสูง", f"{height} cm")
    col3.metric("Ref. PEFR", f"{int(ref_pefr)}")
    col4.metric("สถานะ", current_status)
    
    # ========== STATUS CHANGE ==========
    with st.expander("⚙️ แก้ไขสถานะคนไข้"):
        new_status = st.radio(
            "เลือกสถานะใหม่:", 
            ["Active", "Discharge", "COPD"],
            horizontal=True,
            index=["Active", "Discharge", "COPD"].index(current_status)
        )
        if new_status != current_status:
            if st.button("บันทึกการเปลี่ยนสถานะ", type="primary"):
                with st.spinner("กำลังอัปเดต..."):
                    if update_patient_status(selected_hn, new_status):
                        log_action("Admin", "Update Status", f"HN: {selected_hn} -> {new_status}")
                        st.success(f"เปลี่ยนสถานะเป็น {new_status} เรียบร้อย!")
                        st.rerun()
    
    # ========== DEFAULT MEDICATIONS FROM LAST VISIT ==========
    controller_options = ["Seretide", "Budesonide", "Symbicort"]
    reliever_options = ["Salbutamol", "Berodual"]
    default_controllers = []
    default_relievers = []
    
    def parse_meds(med_str, available_opts):
        if pd.isna(med_str) or str(med_str).strip() == "": return []
        items = [x.strip() for x in str(med_str).split(",")]
        return [x for x in items if x in available_opts]
    
    # ========== CURRENT STATUS SECTION ==========
    if not pt_visits.empty:
        pt_visits['date'] = pd.to_datetime(pt_visits['date'], errors='coerce')
        pt_visits_sorted = pt_visits.sort_values(by="date")
        last_actual_visit = pt_visits_sorted.iloc[-1]
        
        default_controllers = parse_meds(last_actual_visit.get('controller'), controller_options)
        default_relievers = parse_meds(last_actual_visit.get('reliever'), reliever_options)
        
        st.divider()
        
        # Latest PEFR Info
        valid_pefr_visits = pt_visits_sorted[pt_visits_sorted['pefr'] > 0]
        
        if not valid_pefr_visits.empty:
            last_valid_visit = valid_pefr_visits.iloc[-1]
            current_pefr = last_valid_visit['pefr']
            visit_date_str = last_valid_visit['date'].strftime('%d/%m/%Y')
            
            zone_name, zone_color, advice = get_action_plan_zone(current_pefr, ref_pefr)
            pct_std = get_percent_predicted(current_pefr, ref_pefr)
            
            st.subheader(f"📋 สถานะล่าสุด ({visit_date_str})")
            
            if last_actual_visit['date'] != last_valid_visit['date']:
                st.caption(f"ℹ️ ล่าสุดเมื่อ {last_actual_visit['date'].strftime('%d/%m/%Y')} ไม่ได้เป่า Peak Flow")
            
            s1, s2, s3, s4 = st.columns(4)
            s1.metric("PEFR ล่าสุด", f"{int(current_pefr)}")
            s2.metric("% มาตรฐาน", f"{pct_std}%")
            
            with s3:
                st.markdown(f"""
                    <div style="
                        background-color: {zone_color}15;
                        color: {zone_color};
                        border: 2px solid {zone_color};
                        padding: 10px 16px;
                        border-radius: 12px;
                        text-align: center;
                        font-weight: 600;
                    ">{zone_name.split('(')[0].strip()}</div>
                """, unsafe_allow_html=True)
            
            with s4:
                raw_ctrl = last_valid_visit.get('control_level', '-')
                if pd.isna(raw_ctrl) or str(raw_ctrl).strip() in ['', 'nan', 'None']:
                    ctrl_lvl = "-"
                else:
                    ctrl_lvl = str(raw_ctrl).strip()
                
                if "Uncontrolled" in ctrl_lvl:
                    c_color = "#EF4444"
                elif "Partly" in ctrl_lvl:
                    c_color = "#F59E0B"
                elif "Well" in ctrl_lvl or "Controlled" == ctrl_lvl:
                    c_color = "#10B981"
                else:
                    c_color = "#94A3B8"
                
                st.markdown(f"""
                    <div style="
                        background-color: {c_color}15;
                        color: {c_color};
                        border: 2px solid {c_color};
                        padding: 10px 16px;
                        border-radius: 12px;
                        text-align: center;
                        font-weight: 600;
                    ">{ctrl_lvl if ctrl_lvl != "-" else "รอประเมิน"}</div>
                """, unsafe_allow_html=True)
        else:
            st.warning("⚠️ ยังไม่มีข้อมูลการเป่า Peak Flow")
        
        # DRP Alert
        last_drp = str(last_actual_visit.get('drp', '')).strip()
        if last_drp and last_drp != "-" and last_drp.lower() != "nan":
            st.warning(f"⚠️ **DRP ครั้งล่าสุด:** {last_drp}")
        
        # Technique Status Alert
        tech_status, tech_days, tech_last_date = check_technique_status(pt_visits)
        
        if tech_status == "overdue":
            st.error(f"🚨 **Alert: ขาดทบทวนเทคนิคพ่นยา!** (เลยมา {tech_days} วัน)")
        elif tech_status == "never":
            st.error("🚨 **Alert: ยังไม่เคยสอนเทคนิคพ่นยา**")
        else:
            st.success(f"✅ **เทคนิคพ่นยา: ปกติ** (ครบกำหนดใน {tech_days} วัน)")
    
    # ========== PEFR CHART ==========
    st.divider()
    st.subheader("📈 กราฟติดตามอาการ")
    
    if not pt_visits.empty:
        valid_pefr_visits_all = pt_visits_sorted[pt_visits_sorted['pefr'] > 0]
        if not valid_pefr_visits_all.empty:
            chart = plot_pefr_chart(valid_pefr_visits_all, ref_pefr)
            st.altair_chart(chart, use_container_width=True)
        else:
            st.caption("ไม่มีข้อมูลกราฟ")
    else:
        st.info("ℹ️ ยังไม่มีประวัติการรักษา")
    
    # ========== VISIT HISTORY ==========
    with st.expander("📋 ประวัติการรักษาทั้งหมด"):
        if not pt_visits.empty:
            history_df = pt_visits.copy()
            history_df = history_df.sort_values(by="date", ascending=False)
            history_df['date'] = history_df['date'].dt.strftime('%d/%m/%Y')
            st.dataframe(history_df, use_container_width=True)
        else:
            st.info("ℹ️ ยังไม่มีประวัติการรักษา")
    
    # ========== ADD VISIT BUTTON ==========
    st.divider()
    
    col_visit_btn, _ = st.columns([1, 2])
    with col_visit_btn:
        if st.button("📝 บันทึก Visit ใหม่", type="primary", use_container_width=True):
            st.session_state.show_visit_form = not st.session_state.get('show_visit_form', False)
    
    # ========== VISIT FORM ==========
    if st.session_state.get('show_visit_form', False):
        render_visit_form(selected_hn, pt_data, default_controllers, default_relievers, 
                         controller_options, reliever_options)
    
    # ========== DIGITAL CARD ==========
    st.divider()
    render_digital_card(pt_data, selected_hn, public_token, base_url, predicted_pefr)


# ==========================================
# 📝 VISIT RECORDING FORM
# ==========================================
def render_visit_form(selected_hn, pt_data, default_controllers, default_relievers,
                     controller_options, reliever_options):
    
    st.markdown("### 📝 บันทึก Visit ใหม่")
    
    inhaler_summary_text = "-"
    tech_check_status = "ไม่"
    
    # Wizard Steps Display
    steps = ["ข้อมูลพื้นฐาน", "การควบคุม", "ยาและคำแนะนำ", "ประเมินเทคนิค"]
    current_step = st.session_state.get('visit_step', 0)
    
    st.markdown(render_wizard_steps(steps, current_step), unsafe_allow_html=True)
    
    # Technique Assessment Section
    with st.container(border=True):
        st.markdown("##### 🎯 การประเมินเทคนิคพ่นยา (Optional)")
        is_teach_and_assess = st.checkbox("✅ ต้องการสอน/ประเมินเทคนิคพ่นยาในครั้งนี้", key="assess_toggle")
        
        if is_teach_and_assess:
            tech_check_status = "ทำ"
            st.info("📝 **แบบประเมินเทคนิค MDI**")
            
            steps_list = [
                "(1) เขย่าหลอดพ่นยาในแนวตั้ง 3-4 ครั้ง",
                "(2) ถือหลอดพ่นยาในแนวตั้ง",
                "(3) หายใจออกทางปากให้สุดเต็มที่",
                "(4) ตั้งศีรษะให้ตรง",
                "(5) ใช้ริมฝีปากอมปากหลอดพ่นยาให้สนิท",
                "(6) หายใจเข้าทางปากช้าๆ ลึกๆ พร้อมกดที่พ่นยา 1 ครั้ง",
                "(7) กลั้นลมหายใจประมาณ 10 วินาที",
                "(8) ผ่อนลมหายใจออกทางปากหรือจมูกช้าๆ"
            ]
            
            checks = []
            cols_check = st.columns(2)
            for i, step in enumerate(steps_list):
                with cols_check[i % 2]:
                    checks.append(st.checkbox(step, value=True, key=f"step_{i}"))
            
            score = sum(checks)
            critical_fail = []
            if not checks[4]: critical_fail.append("ข้อ 5 (อมไม่สนิท)")
            if not checks[5]: critical_fail.append("ข้อ 6 (กดพร้อมสูด)")
            if not checks[6]: critical_fail.append("ข้อ 7 (กลั้นหายใจ)")
            
            if critical_fail:
                st.error(f"🚨 **Critical Fail:** {', '.join(critical_fail)}")
                inhaler_status = "Fail (Critical)"
            elif score == 8:
                st.success("✅ เทคนิคถูกต้องสมบูรณ์ (Perfect)")
                inhaler_status = "Pass"
            else:
                st.warning(f"⚠️ ยังไม่สมบูรณ์ (ขาด {8-score} ข้อ)")
                inhaler_status = "Needs Improvement"
            
            st.divider()
            c_adv1, c_adv2 = st.columns(2)
            adv_rinse = c_adv1.checkbox("แนะนำบ้วนปาก", key="adv_rinse")
            adv_clean = c_adv2.checkbox("แนะนำล้างอุปกรณ์", key="adv_clean")
            
            failed_indices = [i+1 for i, x in enumerate(checks) if not x]
            fail_str = ",".join(map(str, failed_indices)) if failed_indices else "None"
            inhaler_summary_text = f"Score: {score}/8 ({inhaler_status}) | Fail: {fail_str}"
            if adv_rinse: inhaler_summary_text += " | Adv:Rinse"
            if adv_clean: inhaler_summary_text += " | Adv:Clean"
    
    # Main Visit Form
    with st.form("new_visit", clear_on_submit=True):
        st.markdown("##### 📋 ข้อมูล Visit")
        
        col_a, col_b = st.columns(2)
        with col_a:
            v_date = st.date_input("วันที่", value=date.today())
            v_is_new = st.checkbox("🆕 เป็นผู้ป่วยรายใหม่ (New Case)")
        
        with col_b:
            v_pefr = st.number_input("PEFR (L/min)", 0, 999, step=10)
            v_no_pefr = st.checkbox("ไม่ได้เป่า Peak Flow (N/A)")
        
        st.divider()
        st.markdown("##### 🎯 Control Level")
        
        v_control = st.radio(
            "ระดับการควบคุมโรค",
            ["Well Controlled", "Partly Controlled", "Uncontrolled"],
            horizontal=True,
            label_visibility="collapsed"
        )
        
        st.divider()
        st.markdown("##### 💊 ยาที่ใช้")
        
        c_med1, c_med2 = st.columns(2)
        v_cont = c_med1.multiselect("Controller", controller_options, default=default_controllers)
        v_rel = c_med2.multiselect("Reliever", reliever_options, default=default_relievers)
        
        if default_controllers or default_relievers:
            st.caption("✨ ระบบดึงรายการยาจากครั้งล่าสุดมาให้แล้ว")
        
        st.divider()
        st.markdown("##### 📝 รายละเอียดเพิ่มเติม")
        
        c_adh, _ = st.columns([1, 1])
        v_adh = c_adh.slider("ความร่วมมือ (%)", 0, 100, 100)
        v_relative_pickup = st.checkbox("ญาติรับยาแทน")
        
        v_drp = st.text_area("DRP (Drug Related Problem)", placeholder="ระบุปัญหาจากการใช้ยา...")
        v_adv = st.text_area("Advice", placeholder="คำแนะนำเพิ่มเติม...")
        v_note = st.text_input("หมายเหตุ", placeholder="หมายเหตุอื่นๆ...")
        v_next = st.date_input("นัดถัดไป", value=date.today() + timedelta(days=90))
        
        col_submit, col_cancel = st.columns([1, 1])
        with col_submit:
            submitted = st.form_submit_button("💾 บันทึกข้อมูล", type="primary", use_container_width=True)
        
        if submitted:
            visit_errors = []
            if v_next < v_date:
                visit_errors.append(f"วันนัดถัดไป ({v_next}) ต้องไม่ใช่อดีต")
            
            if not v_no_pefr:
                if v_pefr == 0:
                    visit_errors.append("ค่า PEFR เป็น 0 (ถ้าไม่ได้เป่า ให้ติ๊กช่อง 'ไม่ได้เป่า')")
                elif v_pefr > 900:
                    visit_errors.append(f"ค่า PEFR สูงผิดปกติ ({v_pefr})")
            
            if visit_errors:
                for err in visit_errors:
                    st.error(f"❌ {err}")
                return
            
            actual_pefr = 0 if v_no_pefr else v_pefr
            actual_adherence = 0 if v_relative_pickup else v_adh
            final_note = f"[ญาติรับแทน] {v_note}" if v_relative_pickup else v_note
            
            new_data = {
                "hn": selected_hn, "date": str(v_date), "pefr": actual_pefr,
                "control_level": v_control,
                "controller": ", ".join(v_cont),
                "reliever": ", ".join(v_rel),
                "adherence": actual_adherence,
                "drp": v_drp, "advice": v_adv,
                "technique_check": tech_check_status,
                "next_appt": str(v_next), "note": final_note,
                "is_new_case": "TRUE" if v_is_new else "FALSE",
                "inhaler_eval": inhaler_summary_text
            }
            
            try:
                save_visit_data(new_data)
                log_action("Admin", "Record Visit", f"HN: {selected_hn}, Date: {v_date}")
                
                st.session_state['reset_visit_form'] = True
                st.session_state['show_visit_form'] = False
                
                st.success("✅ บันทึกสำเร็จ!")
                st.balloons()
                st.rerun()
            except Exception as e:
                st.error(f"เกิดข้อผิดพลาด: {e}")


# ==========================================
# 💳 DIGITAL ASTHMA CARD
# ==========================================
def render_digital_card(pt_data, selected_hn, public_token, base_url, predicted_pefr):
    st.subheader("📇 Digital Asthma Card")
    
    link = f"{base_url}/?token={public_token}"
    
    card_best_pefr = int(predicted_pefr)
    if card_best_pefr == 0:
        card_best_pefr = pt_data.get('best_pefr', 0)
    
    if card_best_pefr > 0:
        green_lim = int(card_best_pefr * 0.8)
        yellow_lim = int(card_best_pefr * 0.6)
        txt_g = f"> {green_lim}"
        txt_y = f"{yellow_lim} - {green_lim}"
        txt_r = f"< {yellow_lim}"
    else:
        txt_g, txt_y, txt_r = "-", "-", "-"
    
    qr_b64 = get_base64_qr(link)
    
    card_html = f"""
    <style>
        .asthma-card {{
            position: relative;
            width: 100%;
            max-width: 420px;
            padding-top: 63%;
            background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #cbd5e1;
            overflow: hidden;
            font-family: 'Kanit', sans-serif;
            color: #334155;
        }}
        .card-content {{
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }}
        .card-header {{
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 5px;
        }}
        .card-chip {{
            width: 42px; height: 28px;
            background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%);
            border-radius: 6px; border: 1px solid #64748b; opacity: 0.8;
        }}
        .card-logo {{
            font-size: 10px; font-weight: bold; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase;
        }}
        .card-body {{
            display: flex; justify-content: space-between; align-items: center; flex: 1;
        }}
        .info-col {{ 
            flex: 1; padding-right: 10px; display: flex; flex-direction: column; justify-content: center;
        }}
        .pt-name {{ 
            font-size: 18px; font-weight: 600; color: #1e293b; line-height: 1.3; margin-bottom: 6px;
        }}
        .pt-meta {{ font-size: 12px; color: #64748B; }}
        .pt-meta b {{ color: #0f172a; font-size: 14px; font-weight: 600; }}
        .qr-box {{
            background: white; padding: 4px; border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;
        }}
        .zone-container {{ display: flex; gap: 6px; margin-top: auto; }}
        .zone-box {{ 
            flex: 1; padding: 6px 2px; border-radius: 8px; text-align: center;
        }}
        .z-green {{ background: #DCFCE7; border: 1px solid #86EFAC; color: #166534; }}
        .z-yellow {{ background: #FEF9C3; border: 1px solid #FDE047; color: #854D0E; }}
        .z-red {{ background: #FEE2E2; border: 1px solid #FCA5A5; color: #991B1B; }}
        .z-lbl {{ font-size: 8px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; opacity: 0.9; }}
        .z-val {{ font-size: 11px; font-weight: 800; letter-spacing: 0.5px; }}
    </style>
    
    <div class="asthma-card">
        <div class="card-content">
            <div class="card-header">
                <div class="card-chip"></div>
                <div class="card-logo">Asthma Care Card</div>
            </div>
            <div class="card-body">
                <div class="info-col">
                    <div class="pt-name">{pt_data['prefix']}{pt_data['first_name']} {pt_data['last_name']}</div>
                    <div class="pt-meta">
                        HN: {selected_hn} <br> 
                        Ref. PEFR: <b>{card_best_pefr}</b>
                    </div>
                </div>
                <div class="qr-box">
                    <img src="data:image/png;base64,{qr_b64}" width="65" height="65" style="display:block; border-radius: 4px;">
                </div>
            </div>
            <div class="zone-container">
                <div class="zone-box z-green">
                    <span class="z-lbl">Normal</span>
                    <span class="z-val">{txt_g}</span>
                </div>
                <div class="zone-box z-yellow">
                    <span class="z-lbl">Caution</span>
                    <span class="z-val">{txt_y}</span>
                </div>
                <div class="zone-box z-red">
                    <span class="z-lbl">Danger</span>
                    <span class="z-val">{txt_r}</span>
                </div>
            </div>
        </div>
    </div>
    """
    
    c_main, c_dummy = st.columns([1.5, 1])
    with c_main:
        st.markdown(card_html, unsafe_allow_html=True)
        
        st.write("")
        col_b1, col_b2 = st.columns(2)
        col_b1.link_button("🔗 เปิดหน้าคนไข้", link, use_container_width=True)
        with col_b2.popover("📋 Copy Link"):
            st.code(link)
