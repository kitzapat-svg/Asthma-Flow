import streamlit as st

def load_custom_css():
    """
    Premium Modern CSS Theme for Asthma-Flow
    """
    st.markdown("""
    <style>
        /* ============================================== */
        /* 1. FONT & BASE IMPORTS                        */
        /* ============================================== */
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons');

        /* ============================================== */
        /* 2. CSS VARIABLES (Design Tokens)              */
        /* ============================================== */
        :root {
            /* Primary Colors */
            --primary-50: #E8F5E9;
            --primary-100: #C8E6C9;
            --primary-500: #4CAF50;
            --primary-600: #43A047;
            --primary-700: #388E3C;
            
            /* Accent Colors */
            --accent-blue: #2196F3;
            --accent-purple: #7C4DFF;
            --accent-orange: #FF9800;
            --accent-red: #EF5350;
            
            /* Neutral Colors */
            --gray-50: #FAFAFA;
            --gray-100: #F5F5F5;
            --gray-200: #EEEEEE;
            --gray-300: #E0E0E0;
            --gray-400: #BDBDBD;
            --gray-500: #9E9E9E;
            --gray-600: #757575;
            --gray-700: #616161;
            --gray-800: #424242;
            --gray-900: #212121;
            
            /* Semantic Colors */
            --success: #10B981;
            --warning: #F59E0B;
            --danger: #EF4444;
            --info: #3B82F6;
            
            /* Shadows */
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            
            /* Border Radius */
            --radius-sm: 6px;
            --radius-md: 10px;
            --radius-lg: 16px;
            --radius-xl: 24px;
            --radius-full: 9999px;
            
            /* Transitions */
            --transition-fast: 150ms ease;
            --transition-normal: 250ms ease;
            --transition-slow: 350ms ease;
        }

        /* ============================================== */
        /* 3. GLOBAL STYLES                               */
        /* ============================================== */
        html, body, h1, h2, h3, h4, h5, h6, p, li, button, input, textarea, label {
            font-family: 'Kanit', 'Inter', sans-serif !important;
        }
        
        .stApp {
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
        }
        
        [data-testid="stMarkdownContainer"] p, [data-testid="stMarkdownContainer"] span {
            font-family: 'Kanit', sans-serif !important;
        }

        /* Protect Icons */
        i, .material-icons, .material-symbols-rounded, [data-testid="stExpander"] svg {
            font-family: 'Material Icons' !important;
            font-weight: normal;
            font-style: normal;
        }

        /* ============================================== */
        /* 4. PREMIUM HEADER BAR                          */
        /* ============================================== */
        .header-bar {
            background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
            padding: 20px 30px;
            border-radius: var(--radius-lg);
            margin-bottom: 24px;
            box-shadow: var(--shadow-lg);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header-title {
            color: white;
            font-size: 28px;
            font-weight: 600;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .header-subtitle {
            color: rgba(255,255,255,0.7);
            font-size: 14px;
            margin: 4px 0 0 0;
        }

        /* ============================================== */
        /* 5. ACTION BUTTONS                              */
        /* ============================================== */
        .action-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            border-radius: var(--radius-full);
            font-weight: 500;
            font-size: 15px;
            cursor: pointer;
            transition: all var(--transition-normal);
            border: none;
            text-decoration: none;
        }
        
        .action-btn-primary {
            background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
            color: white;
            box-shadow: 0 4px 14px 0 rgba(76, 175, 80, 0.39);
        }
        
        .action-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
        }
        
        .action-btn-secondary {
            background: white;
            color: var(--gray-700);
            border: 1px solid var(--gray-300);
            box-shadow: var(--shadow-sm);
        }
        
        .action-btn-secondary:hover {
            background: var(--gray-50);
            border-color: var(--gray-400);
        }

        /* ============================================== */
        /* 6. PREMIUM CARDS                               */
        /* ============================================== */
        .premium-card {
            background: white;
            border-radius: var(--radius-lg);
            padding: 24px;
            box-shadow: var(--shadow-md);
            border: 1px solid var(--gray-200);
            transition: all var(--transition-normal);
        }
        
        .premium-card:hover {
            box-shadow: var(--shadow-lg);
            transform: translateY(-2px);
        }
        
        .stat-card {
            background: white;
            border-radius: var(--radius-lg);
            padding: 20px;
            text-align: center;
            box-shadow: var(--shadow-md);
            border: 1px solid var(--gray-200);
            transition: all var(--transition-normal);
        }
        
        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-xl);
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: var(--primary-700);
            margin: 8px 0;
        }
        
        .stat-label {
            font-size: 14px;
            color: var(--gray-600);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .stat-icon {
            font-size: 40px;
            margin-bottom: 8px;
        }

        /* ============================================== */
        /* 7. PATIENT CARDS                               */
        /* ============================================== */
        .patient-card {
            background: white;
            border-radius: var(--radius-md);
            padding: 16px 20px;
            margin-bottom: 12px;
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--gray-200);
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all var(--transition-fast);
        }
        
        .patient-card:hover {
            background: var(--primary-50);
            border-color: var(--primary-500);
            box-shadow: var(--shadow-md);
        }
        
        .patient-info {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .patient-avatar {
            width: 48px;
            height: 48px;
            border-radius: var(--radius-full);
            background: linear-gradient(135deg, var(--primary-500) 0%, var(--accent-blue) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 18px;
        }
        
        .patient-name {
            font-size: 16px;
            font-weight: 600;
            color: var(--gray-900);
            margin: 0;
        }
        
        .patient-hn {
            font-size: 13px;
            color: var(--gray-500);
            margin: 2px 0 0 0;
        }

        /* ============================================== */
        /* 8. SEARCH BOX                                  */
        /* ============================================== */
        .search-container {
            position: relative;
            margin-bottom: 24px;
        }
        
        .search-box {
            width: 100%;
            padding: 16px 20px 16px 50px;
            border: 2px solid var(--gray-200);
            border-radius: var(--radius-full);
            font-size: 16px;
            transition: all var(--transition-normal);
            background: white;
        }
        
        .search-box:focus {
            outline: none;
            border-color: var(--primary-500);
            box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.1);
        }
        
        .search-icon {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--gray-400);
            font-size: 20px;
        }

        /* ============================================== */
        /* 9. STATUS BADGES                               */
        /* ============================================== */
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: var(--radius-full);
            font-size: 13px;
            font-weight: 500;
        }
        
        .badge-success {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .badge-warning {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .badge-danger {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .badge-info {
            background: rgba(59, 130, 246, 0.1);
            color: var(--info);
            border: 1px solid rgba(59, 130, 246, 0.3);
        }

        /* ============================================== */
        /* 10. FORM WIZARD STEPS                          */
        /* ============================================== */
        .wizard-steps {
            display: flex;
            justify-content: space-between;
            margin-bottom: 32px;
            position: relative;
        }
        
        .wizard-steps::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 40px;
            right: 40px;
            height: 3px;
            background: var(--gray-200);
            z-index: 0;
        }
        
        .wizard-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 1;
        }
        
        .step-circle {
            width: 44px;
            height: 44px;
            border-radius: var(--radius-full);
            background: white;
            border: 3px solid var(--gray-300);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 16px;
            color: var(--gray-400);
            transition: all var(--transition-normal);
        }
        
        .step-circle.active {
            background: var(--primary-500);
            border-color: var(--primary-500);
            color: white;
            box-shadow: 0 4px 14px rgba(76, 175, 80, 0.4);
        }
        
        .step-circle.completed {
            background: var(--success);
            border-color: var(--success);
            color: white;
        }
        
        .step-label {
            margin-top: 8px;
            font-size: 12px;
            color: var(--gray-500);
            font-weight: 500;
        }
        
        .step-label.active {
            color: var(--primary-700);
            font-weight: 600;
        }

        /* ============================================== */
        /* 11. METRIC CARDS ENHANCEMENT                   */
        /* ============================================== */
        div[data-testid="stMetric"] {
            background: white;
            padding: 20px;
            border-radius: var(--radius-lg);
            border: 1px solid var(--gray-200);
            box-shadow: var(--shadow-md);
            text-align: center;
            transition: all var(--transition-normal);
        }
        
        div[data-testid="stMetric"]:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        
        div[data-testid="stMetricLabel"] {
            font-size: 0.85rem !important;
            color: var(--gray-600) !important;
            font-family: 'Kanit', sans-serif !important;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        div[data-testid="stMetricValue"] {
            font-size: 1.8rem !important;
            font-weight: 700 !important;
            background: linear-gradient(135deg, var(--primary-600) 0%, var(--accent-blue) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-family: 'Kanit', sans-serif !important;
        }

        /* ============================================== */
        /* 12. ZONE INDICATORS                            */
        /* ============================================== */
        .zone-indicator {
            padding: 12px 20px;
            border-radius: var(--radius-md);
            text-align: center;
            font-weight: 600;
            font-size: 15px;
        }
        
        .zone-green {
            background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%);
            color: #166534;
            border: 2px solid #86EFAC;
        }
        
        .zone-yellow {
            background: linear-gradient(135deg, #FEF9C3 0%, #FDE68A 100%);
            color: #854D0E;
            border: 2px solid #FDE047;
        }
        
        .zone-red {
            background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
            color: #991B1B;
            border: 2px solid #FCA5A5;
        }

        /* ============================================== */
        /* 13. NAVIGATION TABS                            */
        /* ============================================== */
        .nav-pills {
            display: flex;
            gap: 8px;
            padding: 8px;
            background: var(--gray-100);
            border-radius: var(--radius-full);
            margin-bottom: 24px;
        }
        
        .nav-pill {
            padding: 10px 20px;
            border-radius: var(--radius-full);
            font-weight: 500;
            font-size: 14px;
            color: var(--gray-600);
            cursor: pointer;
            transition: all var(--transition-fast);
            border: none;
            background: transparent;
        }
        
        .nav-pill:hover {
            background: white;
            color: var(--gray-800);
        }
        
        .nav-pill.active {
            background: white;
            color: var(--primary-700);
            box-shadow: var(--shadow-sm);
        }

        /* ============================================== */
        /* 14. MODAL OVERLAY                              */
        /* ============================================== */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.2s ease;
        }
        
        .modal-content {
            background: white;
            border-radius: var(--radius-xl);
            padding: 32px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: var(--shadow-xl);
            animation: slideUp 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        /* ============================================== */
        /* 15. QUICK ACTION GRID                          */
        /* ============================================== */
        .quick-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .quick-action-card {
            background: white;
            border-radius: var(--radius-lg);
            padding: 24px 16px;
            text-align: center;
            cursor: pointer;
            transition: all var(--transition-normal);
            border: 2px solid transparent;
            box-shadow: var(--shadow-sm);
        }
        
        .quick-action-card:hover {
            border-color: var(--primary-500);
            box-shadow: var(--shadow-lg);
            transform: translateY(-4px);
        }
        
        .quick-action-icon {
            font-size: 36px;
            margin-bottom: 12px;
        }
        
        .quick-action-label {
            font-size: 14px;
            font-weight: 600;
            color: var(--gray-700);
        }

        /* ============================================== */
        /* 16. PROFILE HEADER                             */
        /* ============================================== */
        .profile-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: var(--radius-xl);
            padding: 32px;
            margin-bottom: 24px;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .profile-header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 100%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        }
        
        .profile-name {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
        }
        
        .profile-hn {
            font-size: 16px;
            opacity: 0.8;
            margin-top: 4px;
        }

        /* ============================================== */
        /* 17. SIDEBAR ENHANCEMENT                        */
        /* ============================================== */
        section[data-testid="stSidebar"] {
            background: linear-gradient(180deg, #1a365d 0%, #2d3748 100%);
        }
        
        section[data-testid="stSidebar"] [data-testid="stMarkdownContainer"] {
            color: white;
        }

        /* ============================================== */
        /* 18. BUTTON ENHANCEMENTS                        */
        /* ============================================== */
        .stButton > button {
            border-radius: var(--radius-md) !important;
            font-family: 'Kanit', sans-serif !important;
            font-weight: 500 !important;
            transition: all var(--transition-normal) !important;
            padding: 8px 24px !important;
        }
        
        .stButton > button:hover {
            transform: translateY(-1px) !important;
            box-shadow: var(--shadow-md) !important;
        }
        
        .stButton > button[kind="primary"] {
            background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%) !important;
            border: none !important;
        }

        /* ============================================== */
        /* 19. INFO/SUCCESS/WARNING BOXES                 */
        /* ============================================== */
        div[data-testid="stAlert"] {
            border-radius: var(--radius-md) !important;
            border-left-width: 4px !important;
        }

        /* ============================================== */
        /* 20. EXPANDER FIX                               */
        /* ============================================== */
        div[data-testid="stExpander"] summary {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
        }
        
        div[data-testid="stExpander"] {
            background: white;
            border-radius: var(--radius-md);
            border: 1px solid var(--gray-200);
            overflow: hidden;
        }
    </style>
    """, unsafe_allow_html=True)


def render_header(title, subtitle=None):
    """Render premium header bar"""
    subtitle_html = f'<p class="header-subtitle">{subtitle}</p>' if subtitle else ''
    st.markdown(f"""
        <div class="header-bar">
            <div>
                <h1 class="header-title">🫁 {title}</h1>
                {subtitle_html}
            </div>
        </div>
    """, unsafe_allow_html=True)


def render_stat_card(icon, value, label, color="#4CAF50"):
    """Render a statistic card"""
    return f"""
        <div class="stat-card">
            <div class="stat-icon">{icon}</div>
            <div class="stat-value" style="color: {color};">{value}</div>
            <div class="stat-label">{label}</div>
        </div>
    """


def render_patient_card_html(name, hn, status="Active"):
    """Render patient card HTML"""
    initials = name[0] if name else "?"
    status_class = "badge-success" if status == "Active" else "badge-warning" if status == "COPD" else "badge-info"
    return f"""
        <div class="patient-card">
            <div class="patient-info">
                <div class="patient-avatar">{initials}</div>
                <div>
                    <p class="patient-name">{name}</p>
                    <p class="patient-hn">HN: {hn}</p>
                </div>
            </div>
            <span class="badge {status_class}">{status}</span>
        </div>
    """


def render_zone_badge(zone_name, percentage):
    """Render zone indicator badge"""
    if "Green" in zone_name:
        zone_class = "zone-green"
    elif "Yellow" in zone_name:
        zone_class = "zone-yellow"
    else:
        zone_class = "zone-red"
    
    return f"""
        <div class="zone-indicator {zone_class}">
            {zone_name} ({percentage}%)
        </div>
    """


def render_wizard_steps(steps, current_step):
    """Render wizard progress steps"""
    html = '<div class="wizard-steps">'
    for i, step in enumerate(steps):
        if i < current_step:
            circle_class = "completed"
            label_class = ""
        elif i == current_step:
            circle_class = "active"
            label_class = "active"
        else:
            circle_class = ""
            label_class = ""
        
        icon = "✓" if i < current_step else str(i + 1)
        html += f"""
            <div class="wizard-step">
                <div class="step-circle {circle_class}">{icon}</div>
                <span class="step-label {label_class}">{step}</span>
            </div>
        """
    html += '</div>'
    return html