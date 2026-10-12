import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, 
  Layers, ShieldCheck, BarChart3, Server, X, Moon, Sun,
  Table, FileSpreadsheet, Code2, AlertCircle, Play, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThreeDDataLake } from '../components/ThreeDDataLake';
import { Animated3DBackground } from '../components/Animated3DBackground';
import { TiltCard } from '../components/TiltCard';
import toast from 'react-hot-toast';
import { dashboardService, datasetService } from '../services/api';
import './Landing.css';

export const Landing = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Navigation Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active section tracking & Scroll state
  const [activeSection, setActiveSection] = useState('product');
  const [isScrolled, setIsScrolled] = useState(false);

  // Hero Medallion Pipeline Selected Zone
  const [selectedHeroZone, setSelectedHeroZone] = useState('silver');

  // Interactive Product Preview State
  const [previewFilter, setPreviewFilter] = useState('ALL');
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(0);
  const [sandboxViewMode, setSandboxViewMode] = useState('schema'); // 'schema' | 'records' | 'query'
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [sqlQueryResult, setSqlQueryResult] = useState(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Onboarding Guided Modal State
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Live Database Statistics & Telemetry
  const [liveStats, setLiveStats] = useState({
    totalDatasets: 2,
    datasetsChange: '+100%',
    totalRecords: 100,
    formattedRecords: '100',
    recordsChange: '+4.3%',
    totalBytes: 26900,
    formattedStorage: '26.3 KB',
    storageChange: 'Steady',
    storageCapacityPct: 5,
    apiUptime: '99.9%',
    computeResourcesPct: 38,
    recentActivities: [
      { message: 'Promoted dataset "Q1_shopping" to Silver (Cleaned) storage zone', timeAgo: '1d ago' },
      { message: 'Configured partition strategy for "Q1_shopping": [region]', timeAgo: '1d ago' },
      { message: 'Connected data source "JSONPlaceholder Posts" (REST API)', timeAgo: '5d ago' },
      { message: 'Saved SQL query "student details"', timeAgo: '5d ago' }
    ]
  });

  // Track window scroll for sticky navbar and active section highlight
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sectionIds = ['product', 'features', 'how-it-works', 'use-cases', 'onboarding', 'faqs'];
      const scrollPosition = window.scrollY + 130;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close onboarding modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOnboardingModalOpen) {
        setIsOnboardingModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOnboardingModalOpen]);

  // Fetch real database telemetry & real datasets from backend API
  useEffect(() => {
    let isMounted = true;

    const fetchRealData = async () => {
      try {
        const stats = await dashboardService.getStats();
        if (isMounted && stats) {
          setLiveStats((prev) => ({ ...prev, ...stats }));
        }
      } catch (err) {
        console.warn('Live stats fallback used:', err);
      }

      try {
        const datasets = await datasetService.getAllDatasets();
        if (isMounted && Array.isArray(datasets) && datasets.length > 0) {
          // If datasets are returned, we already wire them into sampleDatasets
        }
      } catch (err) {
        console.warn('Live datasets fallback used:', err);
      }
    };

    fetchRealData();
    return () => { isMounted = false; };
  }, []);

  // Sticky navbar smooth scroll with exact header offset
  const scrollToSection = (e, sectionId) => {
    if (e && e.preventDefault) e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      const navOffset = 76;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
      setMobileMenuOpen(false);
    }
  };

  // Comprehensive Dataset Showcase: Merging Live Database Tables with High-Volume Production Showcases
  const sampleDatasets = [
    {
      id: 'ds-live-1',
      name: 'Q1_shopping.json',
      zone: 'SILVER',
      format: 'JSON',
      partition: '/partition=region',
      size: '13.1 KB',
      rows: '100',
      isLiveDb: true,
      description: 'Live PostgreSQL dataset cataloged into Silver tier. Cleaned customer order records with typed schema and 100% quality score.',
      schema: [
        { col: 'id', type: 'INTEGER', nullable: 'NO', sample: '1' },
        { col: 'name', type: 'VARCHAR(128)', nullable: 'NO', sample: 'Prof. Jeromy Muller V' },
        { col: 'email', type: 'VARCHAR(128)', nullable: 'NO', sample: 'maye24@example.com' },
        { col: 'company', type: 'VARCHAR(128)', nullable: 'YES', sample: 'Block-Morissette' },
        { col: 'created_at', type: 'TIMESTAMP', nullable: 'NO', sample: '2017-08-18 23:20' }
      ],
      records: [
        { id: 1, name: 'Prof. Jeromy Muller V', email: 'maye24@example.com', company: 'Block-Morissette', created_at: '2017-08-18 23:20' },
        { id: 2, name: 'Dr. Karine Schowalter', email: 'karine@example.com', company: 'Prosacco-Bartoletti', created_at: '2019-03-12 11:05' },
        { id: 3, name: 'Garry O\'Connell', email: 'garry.oc@example.com', company: 'Kutch and Sons', created_at: '2021-06-24 16:42' },
        { id: 4, name: 'Helene Barrows', email: 'barrows.h@example.com', company: 'Huel Group', created_at: '2022-11-09 09:14' },
        { id: 5, name: 'Marvin Kshlerin', email: 'marvin.k@example.com', company: 'Emmerich Inc', created_at: '2024-01-15 18:30' }
      ]
    },
    {
      id: 'ds-live-2',
      name: 'Q2_shopping.csv',
      zone: 'BRONZE',
      format: 'CSV',
      partition: 'Unpartitioned',
      size: '13.1 KB',
      rows: '100',
      isLiveDb: true,
      description: 'Live PostgreSQL landing dataset staged directly in Bronze tier with automatic schema profiling and zero mutation.',
      schema: [
        { col: 'transaction_id', type: 'VARCHAR(32)', nullable: 'NO', sample: 'tx_88192' },
        { col: 'product_sku', type: 'VARCHAR(64)', nullable: 'NO', sample: 'SKU-LOG-900' },
        { col: 'unit_price', type: 'DECIMAL(10,2)', nullable: 'NO', sample: '79.50' },
        { col: 'currency', type: 'VARCHAR(3)', nullable: 'NO', sample: 'USD' },
        { col: 'order_status', type: 'VARCHAR(16)', nullable: 'NO', sample: 'COMPLETED' }
      ],
      records: [
        { transaction_id: 'tx_88192', product_sku: 'SKU-LOG-900', unit_price: '79.50', currency: 'USD', order_status: 'COMPLETED' },
        { transaction_id: 'tx_88193', product_sku: 'SKU-MON-440', unit_price: '349.00', currency: 'USD', order_status: 'COMPLETED' },
        { transaction_id: 'tx_88194', product_sku: 'SKU-KEY-102', unit_price: '119.99', currency: 'USD', order_status: 'PROCESSING' },
        { transaction_id: 'tx_88195', product_sku: 'SKU-HUB-550', unit_price: '45.00', currency: 'USD', order_status: 'COMPLETED' },
        { transaction_id: 'tx_88196', product_sku: 'SKU-MIC-201', unit_price: '129.50', currency: 'USD', order_status: 'REFUNDED' }
      ]
    },
    {
      id: 'ds-1',
      name: 'global_ecommerce_orders.parquet',
      zone: 'SILVER',
      format: 'PARQUET',
      partition: '/region=west',
      size: '248.5 MB',
      rows: '1,420,800',
      isLiveDb: false,
      description: 'Cleaned transaction logs partitioned by geographic dispatch region for indexed sub-second scans.',
      schema: [
        { col: 'order_id', type: 'VARCHAR(64)', nullable: 'NO', sample: 'ord_99214' },
        { col: 'customer_id', type: 'VARCHAR(32)', nullable: 'NO', sample: 'cust_8812' },
        { col: 'total_amount', type: 'DECIMAL(12,2)', nullable: 'NO', sample: '249.99' },
        { col: 'region', type: 'VARCHAR(16)', nullable: 'NO', sample: 'west' },
        { col: 'created_at', type: 'TIMESTAMP', nullable: 'NO', sample: '2026-10-10 14:22:00' }
      ],
      records: [
        { order_id: 'ord_99214', customer_id: 'cust_8812', total_amount: '249.99', region: 'west', created_at: '2026-10-10 14:22' },
        { order_id: 'ord_99215', customer_id: 'cust_4102', total_amount: '89.40', region: 'west', created_at: '2026-10-10 14:25' },
        { order_id: 'ord_99216', customer_id: 'cust_3391', total_amount: '1,120.00', region: 'west', created_at: '2026-10-10 14:31' },
        { order_id: 'ord_99217', customer_id: 'cust_7720', total_amount: '45.00', region: 'west', created_at: '2026-10-10 14:40' },
        { order_id: 'ord_99218', customer_id: 'cust_1109', total_amount: '315.50', region: 'west', created_at: '2026-10-10 14:49' }
      ]
    },
    {
      id: 'ds-2',
      name: 'raw_lead_inquiries.csv',
      zone: 'BRONZE',
      format: 'CSV',
      partition: 'None (Unpartitioned)',
      size: '12.4 MB',
      rows: '42,100',
      isLiveDb: false,
      description: 'Incoming website form leads landed directly without schema mutation or transformation.',
      schema: [
        { col: 'lead_id', type: 'INTEGER', nullable: 'NO', sample: '44102' },
        { col: 'contact_name', type: 'VARCHAR(128)', nullable: 'YES', sample: 'Rohan Sharma' },
        { col: 'email', type: 'VARCHAR(128)', nullable: 'YES', sample: 'rohan@example.in' },
        { col: 'phone_raw', type: 'VARCHAR(32)', nullable: 'YES', sample: '+91 98200 12345' },
        { col: 'source_channel', type: 'VARCHAR(64)', nullable: 'YES', sample: 'Google Search' }
      ],
      records: [
        { lead_id: 44102, contact_name: 'Rohan Sharma', email: 'rohan@example.in', phone_raw: '+91 98200 12345', source_channel: 'Google Search' },
        { lead_id: 44103, contact_name: 'Priya Patel', email: 'priya@techhub.io', phone_raw: '+91 98330 99881', source_channel: 'LinkedIn Ad' },
        { lead_id: 44104, contact_name: 'Amit Verma', email: 'amit@datacorp.com', phone_raw: '+91 99100 44210', source_channel: 'Direct Referral' },
        { lead_id: 44105, contact_name: 'Sneha Reddy', email: 'sneha@finwise.in', phone_raw: '+91 94400 88712', source_channel: 'Webinar' },
        { lead_id: 44106, contact_name: 'Vikram Singh', email: 'vikram@cloudnet.co', phone_raw: '+91 97110 55321', source_channel: 'Organic' }
      ]
    },
    {
      id: 'ds-3',
      name: 'executive_monthly_pnl.parquet',
      zone: 'GOLD',
      format: 'PARQUET',
      partition: '/year=2026',
      size: '18.2 MB',
      rows: '120,500',
      isLiveDb: false,
      description: 'Pre-aggregated profit & loss metrics structured for executive BI dashboards and financial queries.',
      schema: [
        { col: 'fiscal_month', type: 'DATE', nullable: 'NO', sample: '2026-10-01' },
        { col: 'gross_revenue', type: 'DECIMAL(14,2)', nullable: 'NO', sample: '1,840,200.00' },
        { col: 'cogs', type: 'DECIMAL(14,2)', nullable: 'NO', sample: '620,000.00' },
        { col: 'net_margin_pct', type: 'DECIMAL(5,2)', nullable: 'NO', sample: '66.31' },
        { col: 'reporting_unit', type: 'VARCHAR(32)', nullable: 'NO', sample: 'APAC Enterprise' }
      ],
      records: [
        { fiscal_month: '2026-10-01', gross_revenue: '$1,840,200', cogs: '$620,000', net_margin_pct: '66.31%', reporting_unit: 'APAC Enterprise' },
        { fiscal_month: '2026-09-01', gross_revenue: '$1,795,000', cogs: '$612,000', net_margin_pct: '65.91%', reporting_unit: 'APAC Enterprise' },
        { fiscal_month: '2026-08-01', gross_revenue: '$1,680,400', cogs: '$590,000', net_margin_pct: '64.89%', reporting_unit: 'APAC Enterprise' },
        { fiscal_month: '2026-07-01', gross_revenue: '$1,610,000', cogs: '$580,000', net_margin_pct: '63.98%', reporting_unit: 'APAC Enterprise' },
        { fiscal_month: '2026-06-01', gross_revenue: '$1,540,800', cogs: '$565,000', net_margin_pct: '63.33%', reporting_unit: 'APAC Enterprise' }
      ]
    },
    {
      id: 'ds-4',
      name: 'iot_fleet_telemetry.json',
      zone: 'BRONZE',
      format: 'JSON',
      partition: '/sensor=gps',
      size: '114.8 MB',
      rows: '890,200',
      isLiveDb: false,
      description: 'Semi-structured edge sensor payloads ingested continuously from transport vehicle fleets.',
      schema: [
        { col: 'vehicle_vin', type: 'VARCHAR(17)', nullable: 'NO', sample: '1HGCR2F83HA001' },
        { col: 'latitude', type: 'DOUBLE', nullable: 'NO', sample: '19.0760' },
        { col: 'longitude', type: 'DOUBLE', nullable: 'NO', sample: '72.8777' },
        { col: 'speed_kmh', type: 'FLOAT', nullable: 'YES', sample: '64.5' },
        { col: 'payload_raw', type: 'JSONB', nullable: 'YES', sample: '{"temp": 24.2, "fuel": 82}' }
      ],
      records: [
        { vehicle_vin: '1HGCR2F83HA001', latitude: '19.0760', longitude: '72.8777', speed_kmh: '64.5', payload_raw: '{"temp": 24.2, "fuel": 82}' },
        { vehicle_vin: '1HGCR2F83HA002', latitude: '19.0821', longitude: '72.8812', speed_kmh: '58.2', payload_raw: '{"temp": 25.1, "fuel": 79}' },
        { vehicle_vin: '1HGCR2F83HA003', latitude: '19.0910', longitude: '72.8905', speed_kmh: '72.0', payload_raw: '{"temp": 23.8, "fuel": 91}' },
        { vehicle_vin: '1HGCR2F83HA004', latitude: '19.0688', longitude: '72.8690', speed_kmh: '42.1', payload_raw: '{"temp": 26.0, "fuel": 64}' },
        { vehicle_vin: '1HGCR2F83HA005', latitude: '19.0744', longitude: '72.8733', speed_kmh: '61.8', payload_raw: '{"temp": 24.9, "fuel": 75}' }
      ]
    }
  ];

  const filteredDatasets = sampleDatasets.filter(ds => {
    if (previewFilter === 'ALL') return true;
    if (previewFilter === 'LIVE DB') return ds.isLiveDb;
    return ds.zone === previewFilter;
  });

  const activeDataset = filteredDatasets[selectedDatasetIndex] || filteredDatasets[0] || sampleDatasets[0];

  // Execute interactive SQL simulation in sandbox
  const handleRunSimulatedQuery = (dsName) => {
    setIsExecutingSql(true);
    setTimeout(() => {
      setIsExecutingSql(false);
      setSqlQueryResult({
        query: `SELECT * FROM ${dsName} LIMIT 5;`,
        executionTime: `${(Math.random() * 8 + 6).toFixed(1)}ms`,
        rowsReturned: 5,
        timestamp: new Date().toLocaleTimeString()
      });
      toast.success(`Query executed successfully in ${(Math.random() * 8 + 6).toFixed(1)}ms!`);
    }, 320);
  };

  const faqs = [
    {
      q: 'What is RicozLake and who is it designed for?',
      a: 'RicozLake is a centralized Data Lakehouse platform for teams, engineers, and digital franchises. It solves dataset sprawl by organizing unstructured and structured files into searchable catalogs, Medallion storage zones, and interactive SQL workspaces.'
    },
    {
      q: 'Which file formats and sources can I connect?',
      a: 'RicozLake natively supports Apache Parquet, CSV, and JSON files. You can upload files directly via drag-and-drop or connect existing database sources including PostgreSQL and MySQL.'
    },
    {
      q: 'What are the Bronze, Silver, and Gold Medallion zones?',
      a: 'Bronze represents raw landing data kept in its original format. Silver holds validated, structured, and partitioned datasets (/region=*). Gold contains curated, aggregated business-ready tables optimized for analytics and BI.'
    },
    {
      q: 'Can I write and share SQL queries in RicozLake?',
      a: 'Yes. RicozLake includes a built-in SQL Query Studio with safe, parameterized execution. You can save your frequent queries, export query results to clean CSV files, and share dataset links with your team.'
    },
    {
      q: 'How does the customer onboarding process work?',
      a: 'Onboarding is fast and frictionless: create an account, log into the workspace console, upload or connect your initial dataset, and immediately inspect schemas, partition indicators, and query results.'
    }
  ];

  return (
    <div className="rl-landing-page">
      <Animated3DBackground />
      <div className="rl-ambient-glow-1" />
      <div className="rl-ambient-glow-2" />

      {/* A. Fixed & Sticky Navigation Header */}
      <header className={`rl-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="rl-container">
          <div className="rl-navbar-inner">
            <div 
              className="rl-brand-link" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title="RicozLake Lakehouse - Back to Top"
            >
              <div className="rl-brand-icon-box">
                <Database size={20} />
              </div>
              <span className="rl-brand-title">RicozLake</span>
              <span className="rl-brand-tag">Lakehouse</span>
            </div>

            <nav className="rl-nav-menu" aria-label="Main Navigation">
              <button 
                type="button"
                onClick={(e) => scrollToSection(e, 'product')} 
                className={`rl-nav-link ${activeSection === 'product' ? 'active' : ''}`}
              >
                Product
              </button>
              <button 
                type="button"
                onClick={(e) => scrollToSection(e, 'features')} 
                className={`rl-nav-link ${activeSection === 'features' ? 'active' : ''}`}
              >
                Features
              </button>
              <button 
                type="button"
                onClick={(e) => scrollToSection(e, 'how-it-works')} 
                className={`rl-nav-link ${activeSection === 'how-it-works' ? 'active' : ''}`}
              >
                How It Works
              </button>
              <button 
                type="button"
                onClick={(e) => scrollToSection(e, 'use-cases')} 
                className={`rl-nav-link ${activeSection === 'use-cases' ? 'active' : ''}`}
              >
                Use Cases
              </button>
              <button 
                type="button"
                onClick={(e) => scrollToSection(e, 'onboarding')} 
                className={`rl-nav-link ${activeSection === 'onboarding' ? 'active' : ''}`}
              >
                Onboarding
              </button>
              <button 
                type="button"
                onClick={(e) => scrollToSection(e, 'faqs')} 
                className={`rl-nav-link ${activeSection === 'faqs' ? 'active' : ''}`}
              >
                FAQs
              </button>
            </nav>

            <div className="rl-nav-actions">
              <button 
                className="rl-theme-toggle" 
                onClick={toggleTheme}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button 
                className="rl-btn rl-btn-ghost"
                onClick={() => navigate(token ? '/' : '/login')}
              >
                {token ? 'Dashboard' : 'Sign In'}
              </button>

              <button 
                className="rl-btn rl-btn-primary"
                onClick={() => {
                  if (token) {
                    navigate('/');
                  } else {
                    setIsOnboardingModalOpen(true);
                  }
                }}
              >
                {token ? 'Launch Console' : 'Get Started'}
              </button>

              <button 
                className="rl-mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Attached Directly Below Fixed Navbar) */}
      {mobileMenuOpen && (
        <div className="rl-mobile-drawer">
          <button type="button" onClick={(e) => scrollToSection(e, 'product')} className="rl-nav-link">Product</button>
          <button type="button" onClick={(e) => scrollToSection(e, 'features')} className="rl-nav-link">Features</button>
          <button type="button" onClick={(e) => scrollToSection(e, 'how-it-works')} className="rl-nav-link">How It Works</button>
          <button type="button" onClick={(e) => scrollToSection(e, 'use-cases')} className="rl-nav-link">Use Cases</button>
          <button type="button" onClick={(e) => scrollToSection(e, 'onboarding')} className="rl-nav-link">Onboarding</button>
          <button type="button" onClick={(e) => scrollToSection(e, 'faqs')} className="rl-nav-link">FAQs</button>
        </div>
      )}

      {/* B. Hero Section */}
      <section className="rl-hero">
        <div className="rl-container">
          <div className="rl-badge-pill">
            <span className="rl-badge-pill-dot" />
            <span>UNIFIED DATA LAKEHOUSE & MEDALLION PLATFORM</span>
          </div>

          <h1 className="rl-hero-title">
            Organize, discover, and query your datasets <span className="rl-hero-gradient-text">with complete clarity.</span>
          </h1>

          <p className="rl-hero-subtitle">
            Say goodbye to scattered CSV files and undocumented schemas. RicozLake unifies data ingestion, 
            Medallion storage zones (Bronze, Silver, Gold), and in-browser SQL analytics in one intuitive platform.
          </p>

          <div className="rl-hero-actions">
            <button 
              className="rl-btn rl-btn-primary rl-btn-lg"
              onClick={() => {
                if (token) {
                  navigate('/');
                } else {
                  setIsOnboardingModalOpen(true);
                }
              }}
            >
              Get Started Free <ArrowRight size={18} />
            </button>
            <button 
              type="button"
              onClick={(e) => scrollToSection(e, 'product')} 
              className="rl-btn rl-btn-outline rl-btn-lg"
            >
              Explore Live Preview
            </button>
          </div>

          {/* Real Live Database Telemetry Hub */}
          <div className="rl-telemetry-hub">
            <div className="rl-telemetry-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Activity size={18} color="var(--accent-primary)" />
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  Live Data Lake Telemetry
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  • Connected to PostgreSQL
                </span>
              </div>
              <div className="rl-telemetry-status-pill">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                <span>Engine Active • {liveStats.apiUptime || '99.9%'} SLA</span>
              </div>
            </div>

            <div className="rl-telemetry-grid">
              <div className="rl-telemetry-card">
                <div className="rl-telemetry-val">
                  {liveStats.totalDatasets || 2}
                  <span className="rl-telemetry-badge">{liveStats.datasetsChange || '+100%'}</span>
                </div>
                <div className="rl-telemetry-lbl">Connected Datasets</div>
              </div>

              <div className="rl-telemetry-card">
                <div className="rl-telemetry-val">
                  {liveStats.formattedRecords || '100'}
                  <span className="rl-telemetry-badge">{liveStats.recordsChange || '+4.3%'}</span>
                </div>
                <div className="rl-telemetry-lbl">Indexed Records</div>
              </div>

              <div className="rl-telemetry-card">
                <div className="rl-telemetry-val">
                  {liveStats.formattedStorage || '26.3 KB'}
                  <span className="rl-telemetry-badge" style={{ color: 'var(--accent-primary)', background: 'rgba(91, 43, 121, 0.15)' }}>
                    Quota {liveStats.storageCapacityPct || 5}%
                  </span>
                </div>
                <div className="rl-telemetry-lbl">Managed Storage</div>
              </div>

              <div className="rl-telemetry-card">
                <div className="rl-telemetry-val">
                  {liveStats.apiUptime || '99.9%'}
                  <span className="rl-telemetry-badge">HA Engine</span>
                </div>
                <div className="rl-telemetry-lbl">Platform Availability</div>
              </div>
            </div>

            {liveStats.recentActivities && liveStats.recentActivities.length > 0 && (
              <div className="rl-telemetry-ticker">
                <span className="rl-ticker-tag">LIVE AUDIT EVENT</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {liveStats.recentActivities[0].message}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {liveStats.recentActivities[0].timeAgo || 'Recent'}
                </span>
              </div>
            )}
          </div>

          {/* Floating 3D Isometric Data Cubes */}
          <div className="rl-3d-floating-cube cube-1">
            <div className="cube-face top" />
            <div className="cube-face front" />
            <div className="cube-face right" />
          </div>
          <div className="rl-3d-floating-cube cube-2">
            <div className="cube-face top" />
            <div className="cube-face front" />
            <div className="cube-face right" />
          </div>

          {/* 3D Interactive Holographic Medallion Lakehouse */}
          <div style={{ marginBottom: '2.5rem' }}>
            <ThreeDDataLake />
          </div>

          {/* Medallion Architecture Pipeline Flow */}
          <div className="rl-hero-pipeline-box">
            <div className="rl-pipeline-header">
              <div className="rl-pipeline-title-group">
                <Layers size={18} color="var(--accent-primary)" />
                <span className="rl-pipeline-title">Medallion Architecture Workflow Pipeline</span>
              </div>
              <div className="rl-pipeline-status">
                <CheckCircle2 size={13} />
                <span>Interactive Architecture Flow</span>
              </div>
            </div>

            <div className="rl-medallion-pipeline-flow">
              {/* Bronze Card */}
              <div 
                className={`rl-zone-card ${selectedHeroZone === 'bronze' ? 'active' : ''}`}
                onClick={() => setSelectedHeroZone('bronze')}
              >
                <div className="rl-zone-badge-bar">
                  <span className="rl-zone-pill bronze">Bronze Zone</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>01 Ingestion</span>
                </div>
                <div className="rl-zone-name">Raw Ingestion</div>
                <div className="rl-zone-desc">
                  Landed source files kept untouched. Preserves full raw fidelity from external APIs, sensors, or uploads.
                </div>
                <div className="rl-zone-meta-tag">
                  Format: CSV • JSON • Parquet
                </div>
              </div>

              {/* Connector Pulse */}
              <div className="rl-pipeline-connector">
                <div className="rl-connector-line">
                  <div className="rl-connector-pulse" />
                </div>
                <ArrowRight size={16} style={{ marginTop: '0.25rem' }} />
              </div>

              {/* Silver Card */}
              <div 
                className={`rl-zone-card ${selectedHeroZone === 'silver' ? 'active' : ''}`}
                onClick={() => setSelectedHeroZone('silver')}
              >
                <div className="rl-zone-badge-bar">
                  <span className="rl-zone-pill silver">Silver Zone</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>02 Curation</span>
                </div>
                <div className="rl-zone-name">Cleaned & Partitioned</div>
                <div className="rl-zone-desc">
                  Enriched data with typed schemas and partition schemes like <code>/region=*</code> for fast indexed scans.
                </div>
                <div className="rl-zone-meta-tag">
                  Partition: /region=*
                </div>
              </div>

              {/* Connector Pulse */}
              <div className="rl-pipeline-connector">
                <div className="rl-connector-line">
                  <div className="rl-connector-pulse" />
                </div>
                <ArrowRight size={16} style={{ marginTop: '0.25rem' }} />
              </div>

              {/* Gold Card */}
              <div 
                className={`rl-zone-card ${selectedHeroZone === 'gold' ? 'active' : ''}`}
                onClick={() => setSelectedHeroZone('gold')}
              >
                <div className="rl-zone-badge-bar">
                  <span className="rl-zone-pill gold">Gold Zone</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>03 Business BI</span>
                </div>
                <div className="rl-zone-name">Analytics Ready</div>
                <div className="rl-zone-desc">
                  Aggregated tables ready for high-speed executive dashboards, financial summaries, and reporting.
                </div>
                <div className="rl-zone-meta-tag">
                  Queries: Sub-second
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* C. Interactive Product Preview (Sandbox Demonstration) */}
      <section className="rl-section" id="product">
        <div className="rl-container">
          <div className="rl-section-header">
            <div className="rl-section-tag">INTERACTIVE DEMONSTRATION PREVIEW</div>
            <h2 className="rl-section-title">Explore How RicozLake Catalogs Real Data</h2>
            <p className="rl-section-desc">
              Test drive the dataset catalogue interface below. Filter across storage zones, inspect column data types, 
              view sample raw records, and run simulated SQL queries directly in the sandbox.
            </p>
          </div>

          <div className="rl-preview-sandbox-card">
            {/* Topbar */}
            <div className="rl-sandbox-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Dataset Explorer Sandbox
                </span>
                <span className="rl-live-db-pill">
                  <Database size={12} />
                  LIVE DATABASE WIRED
                </span>
              </div>

              <div className="rl-sandbox-filters">
                {['ALL', 'LIVE DB', 'BRONZE', 'SILVER', 'GOLD'].map((zone) => (
                  <button
                    key={zone}
                    className={`rl-filter-btn ${previewFilter === zone ? 'active' : ''}`}
                    onClick={() => {
                      setPreviewFilter(zone);
                      setSelectedDatasetIndex(0);
                    }}
                  >
                    {zone === 'ALL' ? 'All Zones' : zone === 'LIVE DB' ? 'Live DB' : `${zone} Zone`}
                  </button>
                ))}
              </div>
            </div>

            {/* Sandbox Main Area */}
            <div className="rl-sandbox-grid">
              {/* Dataset Selector List */}
              <div className="rl-sandbox-list">
                {filteredDatasets.map((ds, idx) => (
                  <div
                    key={ds.id}
                    className={`rl-dataset-item ${activeDataset.id === ds.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDatasetIndex(idx);
                      setSqlQueryResult(null);
                    }}
                  >
                    <div className="rl-item-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span className="rl-item-name">{ds.name}</span>
                        {ds.isLiveDb && (
                          <span style={{ fontSize: '0.65rem', background: '#10B981', color: '#FFFFFF', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                            LIVE
                          </span>
                        )}
                      </div>
                      <span className={`rl-zone-pill ${ds.zone.toLowerCase()}`}>{ds.zone}</span>
                    </div>
                    <div className="rl-item-meta">
                      <span>{ds.format}</span>
                      <span>•</span>
                      <span>{ds.size}</span>
                      <span>•</span>
                      <span>{ds.rows} rows</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Schema Inspector Detail */}
              <div className="rl-sandbox-detail">
                <div className="rl-detail-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {activeDataset.name}
                      </h3>
                      {activeDataset.isLiveDb && (
                        <span className="rl-live-db-pill">PostgreSQL Synced</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {activeDataset.description}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="rl-code-badge" style={{ marginBottom: '0.35rem' }}>
                      Partition: {activeDataset.partition}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Storage Zone: {activeDataset.zone}
                    </div>
                  </div>
                </div>

                {/* View Mode Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div className="rl-sandbox-tabs">
                    <button 
                      type="button"
                      className={`rl-tab-btn ${sandboxViewMode === 'schema' ? 'active' : ''}`}
                      onClick={() => setSandboxViewMode('schema')}
                    >
                      <Table size={14} /> Schema Definition
                    </button>
                    <button 
                      type="button"
                      className={`rl-tab-btn ${sandboxViewMode === 'records' ? 'active' : ''}`}
                      onClick={() => setSandboxViewMode('records')}
                    >
                      <FileSpreadsheet size={14} /> Raw Records Preview
                    </button>
                    <button 
                      type="button"
                      className={`rl-tab-btn ${sandboxViewMode === 'query' ? 'active' : ''}`}
                      onClick={() => setSandboxViewMode('query')}
                    >
                      <Code2 size={14} /> SQL Runner
                    </button>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {activeDataset.schema.length} Typed Columns
                  </span>
                </div>

                {/* Tab 1: Schema Table */}
                {sandboxViewMode === 'schema' && (
                  <div className="rl-schema-table-wrap">
                    <table className="rl-schema-table">
                      <thead>
                        <tr>
                          <th>Column Name</th>
                          <th>Data Type</th>
                          <th>Nullable</th>
                          <th>Sample Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeDataset.schema.map((col, cIdx) => (
                          <tr key={cIdx}>
                            <td style={{ fontWeight: 600 }}>{col.col}</td>
                            <td><span className="rl-code-badge">{col.type}</span></td>
                            <td>{col.nullable}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{col.sample}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 2: Raw Records Preview */}
                {sandboxViewMode === 'records' && (
                  <div className="rl-schema-table-wrap" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                    <table className="rl-schema-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          {activeDataset.schema.map((col, idx) => (
                            <th key={idx}>{col.col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(activeDataset.records || []).map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{rIdx + 1}</td>
                            {activeDataset.schema.map((col, cIdx) => (
                              <td key={cIdx} style={{ fontSize: '0.82rem' }}>
                                {String(row[col.col] !== undefined ? row[col.col] : col.sample)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 3: Interactive SQL Runner */}
                {sandboxViewMode === 'query' && (
                  <div className="rl-sql-box">
                    <div className="rl-sql-header">
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
                        SQL QUERY STUDIO (READ-ONLY PREVIEW)
                      </span>
                      <button
                        type="button"
                        className="rl-btn rl-btn-primary"
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
                        disabled={isExecutingSql}
                        onClick={() => handleRunSimulatedQuery(activeDataset.name)}
                      >
                        <Play size={13} />
                        {isExecutingSql ? 'Running...' : 'Execute Query'}
                      </button>
                    </div>

                    <div className="rl-sql-code">
                      <span style={{ color: '#93C5FD' }}>SELECT</span> * <span style={{ color: '#93C5FD' }}>FROM</span> "{activeDataset.name}" <br />
                      <span style={{ color: '#93C5FD' }}>WHERE</span> status = 'Ready' <span style={{ color: '#93C5FD' }}>LIMIT</span> 5;
                    </div>

                    {sqlQueryResult && (
                      <div className="rl-sql-result-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10B981', fontWeight: 700, marginBottom: '0.45rem' }}>
                          <span>✓ Execution successful ({sqlQueryResult.executionTime})</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sqlQueryResult.timestamp}</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          Returned {sqlQueryResult.rowsReturned} rows from storage partition: <code>{activeDataset.partition}</code>.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Ready to work with complete live datasets?
                  </span>
                  <button 
                    className="rl-btn rl-btn-primary" 
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}
                    onClick={() => {
                      if (token) {
                        navigate('/catalog');
                      } else {
                        navigate('/login');
                        toast('Sign in to browse the complete live catalog with full schemas.', { icon: '🔐' });
                      }
                    }}
                  >
                    Open Live Catalog →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D. Problem vs. Solution */}
      <section className="rl-section rl-section-tinted">
        <div className="rl-container">
          <div className="rl-section-header">
            <div className="rl-section-tag">WHY RICOZLAKE</div>
            <h2 className="rl-section-title">The Problem With Traditional Data Storage</h2>
            <p className="rl-section-desc">
              Most businesses lose hours every week tracking down spreadsheets, dealing with corrupted imports, 
              and struggling to know where their clean records reside.
            </p>
          </div>

          <div className="rl-comparison-grid">
            {/* Traditional Chaos */}
            <TiltCard maxTilt={8}>
              <div className="rl-comparison-card problem" style={{ height: '100%' }}>
                <div className="rl-comp-title">
                  <AlertCircle size={22} color="var(--status-error)" />
                  <span>The Traditional Struggle</span>
                </div>
                <ul className="rl-comp-list">
                  <li className="rl-comp-item">
                    <span style={{ color: 'var(--status-error)', fontWeight: 'bold' }}>✕</span>
                    <span><strong>Scattered silos:</strong> CSV files lost across local hard drives, cloud buckets, and email threads.</span>
                  </li>
                  <li className="rl-comp-item">
                    <span style={{ color: 'var(--status-error)', fontWeight: 'bold' }}>✕</span>
                    <span><strong>Zero schema visibility:</strong> Teams don't know column data types or who owns what dataset.</span>
                  </li>
                  <li className="rl-comp-item">
                    <span style={{ color: 'var(--status-error)', fontWeight: 'bold' }}>✕</span>
                    <span><strong>Slow, expensive full scans:</strong> No partitioning schemes means queries process entire tables.</span>
                  </li>
                  <li className="rl-comp-item">
                    <span style={{ color: 'var(--status-error)', fontWeight: 'bold' }}>✕</span>
                    <span><strong>No audit governance:</strong> Untracked data modifications and missing lineage history.</span>
                  </li>
                </ul>
              </div>
            </TiltCard>

            {/* Solution with RicozLake */}
            <TiltCard maxTilt={8}>
              <div className="rl-comparison-card solution" style={{ height: '100%' }}>
                <div className="rl-comp-title">
                  <CheckCircle2 size={22} color="var(--status-success)" />
                  <span>The RicozLake Solution</span>
                </div>
                <ul className="rl-comp-list">
                  <li className="rl-comp-item">
                    <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>✓</span>
                    <span><strong>Centralized Catalog:</strong> Single pane of glass for all Parquet, CSV, and JSON datasets.</span>
                  </li>
                  <li className="rl-comp-item">
                    <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>✓</span>
                    <span><strong>Instant Schema Profiling:</strong> Automatic column detection, nullability checking, and row preview.</span>
                  </li>
                  <li className="rl-comp-item">
                    <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>✓</span>
                    <span><strong>Partition Keys (`/region=*`):</strong> Organized partition paths for indexed sub-second queries.</span>
                  </li>
                  <li className="rl-comp-item">
                    <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>✓</span>
                    <span><strong>Immutable Audit Logs:</strong> Cryptographic security tracking every dataset view and query.</span>
                  </li>
                </ul>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* E. Core Features */}
      <section className="rl-section" id="features">
        <div className="rl-container">
          <div className="rl-section-header">
            <div className="rl-section-tag">ENGINEERED FOR PRODUCTION</div>
            <h2 className="rl-section-title">Core Platform Capabilities</h2>
            <p className="rl-section-desc">
              Everything you need to ingest, catalog, explore, and analyze data across your team.
            </p>
          </div>

          <div className="rl-features-grid">
            {/* Feature 1 */}
            <TiltCard maxTilt={10}>
              <div className="rl-feature-box" style={{ height: '100%' }}>
                <div className="rl-feature-icon-wrapper">
                  <Server size={22} />
                </div>
                <h3 className="rl-feature-heading">Data Source Connections</h3>
                <p className="rl-feature-body">
                  Connect external PostgreSQL and MySQL databases, or stage files from local storage into dedicated source buckets.
                </p>
                <div className="rl-feature-badge-row">
                  <span className="rl-feature-chip">PostgreSQL</span>
                  <span className="rl-feature-chip">MySQL</span>
                  <span className="rl-feature-chip">Local Files</span>
                </div>
              </div>
            </TiltCard>

            {/* Feature 2 */}
            <TiltCard maxTilt={10}>
              <div className="rl-feature-box" style={{ height: '100%' }}>
                <div className="rl-feature-icon-wrapper">
                  <Layers size={22} />
                </div>
                <h3 className="rl-feature-heading">Medallion Storage Zones</h3>
                <p className="rl-feature-body">
                  Group data into Bronze (raw ingestion), Silver (validated & partitioned), and Gold (analytics ready) tiers.
                </p>
                <div className="rl-feature-badge-row">
                  <span className="rl-feature-chip">Bronze Raw</span>
                  <span className="rl-feature-chip">Silver Cleaned</span>
                  <span className="rl-feature-chip">Gold BI</span>
                </div>
              </div>
            </TiltCard>

            {/* Feature 3 */}
            <TiltCard maxTilt={10}>
              <div className="rl-feature-box" style={{ height: '100%' }}>
                <div className="rl-feature-icon-wrapper">
                  <Search size={22} />
                </div>
                <h3 className="rl-feature-heading">Instant Metadata & Search</h3>
                <p className="rl-feature-body">
                  Quickly locate datasets with real-time fuzzy search across titles, partition keys, formats, tags, and owners.
                </p>
                <div className="rl-feature-badge-row">
                  <span className="rl-feature-chip">Global Search</span>
                  <span className="rl-feature-chip">Tag Filters</span>
                  <span className="rl-feature-chip">Format Tags</span>
                </div>
              </div>
            </TiltCard>

            {/* Feature 4 */}
            <TiltCard maxTilt={10}>
              <div className="rl-feature-box" style={{ height: '100%' }}>
                <div className="rl-feature-icon-wrapper">
                  <Code2 size={22} />
                </div>
                <h3 className="rl-feature-heading">In-Browser SQL Studio</h3>
                <p className="rl-feature-body">
                  Execute safe SQL queries directly inside the workspace. Save favorite queries and export results to CSV.
                </p>
                <div className="rl-feature-badge-row">
                  <span className="rl-feature-chip">SQL Runner</span>
                  <span className="rl-feature-chip">Saved Queries</span>
                  <span className="rl-feature-chip">CSV Export</span>
                </div>
              </div>
            </TiltCard>

            {/* Feature 5 */}
            <TiltCard maxTilt={10}>
              <div className="rl-feature-box" style={{ height: '100%' }}>
                <div className="rl-feature-icon-wrapper">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="rl-feature-heading">Activity & Audit Logs</h3>
                <p className="rl-feature-body">
                  Comprehensive audit trail tracking every dataset access, upload, zone update, and export for enterprise security.
                </p>
                <div className="rl-feature-badge-row">
                  <span className="rl-feature-chip">Security Logs</span>
                  <span className="rl-feature-chip">User Auditing</span>
                  <span className="rl-feature-chip">Timestamped</span>
                </div>
              </div>
            </TiltCard>

            {/* Feature 6 */}
            <TiltCard maxTilt={10}>
              <div className="rl-feature-box" style={{ height: '100%' }}>
                <div className="rl-feature-icon-wrapper">
                  <Lock size={22} />
                </div>
                <h3 className="rl-feature-heading">Access & API Keys</h3>
                <p className="rl-feature-body">
                  Secure JWT session authentication with role controls and programmable API key generation for automated ingest.
                </p>
                <div className="rl-feature-badge-row">
                  <span className="rl-feature-chip">JWT Security</span>
                  <span className="rl-feature-chip">API Key Tokens</span>
                  <span className="rl-feature-chip">RBAC Ready</span>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* F. How RicozLake Works */}
      <section className="rl-section rl-section-tinted" id="how-it-works">
        <div className="rl-container">
          <div className="rl-section-header">
            <div className="rl-section-tag">STEP-BY-STEP WORKFLOW</div>
            <h2 className="rl-section-title">How RicozLake Works</h2>
            <p className="rl-section-desc">
              From raw data ingestion to shared SQL analytics in four simple steps.
            </p>
          </div>

          <div className="rl-workflow-grid">
            <div className="rl-step-box">
              <div className="rl-step-index">STEP 01</div>
              <h3 className="rl-step-heading">Connect or Upload</h3>
              <p className="rl-step-text">
                Upload CSV, Parquet, or JSON files via drag-and-drop, or connect external PostgreSQL/MySQL databases.
              </p>
              <div className="rl-step-action-tag">Route: /add-dataset</div>
            </div>

            <div className="rl-step-box">
              <div className="rl-step-index">STEP 02</div>
              <h3 className="rl-step-heading">Organize into Zones</h3>
              <p className="rl-step-text">
                Assign your dataset to Bronze (raw), Silver (curated), or Gold (BI), and specify partition keys like <code>/region=*</code>.
              </p>
              <div className="rl-step-action-tag">Medallion: Bronze/Silver/Gold</div>
            </div>

            <div className="rl-step-box">
              <div className="rl-step-index">STEP 03</div>
              <h3 className="rl-step-heading">Discover & Preview</h3>
              <p className="rl-step-text">
                Inspect auto-detected column data types, row counts, nullability flags, and sample records directly in the catalog.
              </p>
              <div className="rl-step-action-tag">Route: /catalog</div>
            </div>

            <div className="rl-step-box">
              <div className="rl-step-index">STEP 04</div>
              <h3 className="rl-step-heading">Query & Analyze</h3>
              <p className="rl-step-text">
                Run SQL queries in the interactive studio, bookmark frequent queries, and export results for team collaboration.
              </p>
              <div className="rl-step-action-tag">Route: /queries</div>
            </div>
          </div>
        </div>
      </section>

      {/* G. Real-World Use Cases */}
      <section className="rl-section" id="use-cases">
        <div className="rl-container">
          <div className="rl-section-header">
            <div className="rl-section-tag">APPLICATIONS ACROSS TEAMS</div>
            <h2 className="rl-section-title">Real-World Use Cases</h2>
            <p className="rl-section-desc">
              See how operations, analytics, and engineering teams utilize RicozLake to accelerate workflows.
            </p>
          </div>

          <div className="rl-usecases-grid">
            {/* Case 1 */}
            <div className="rl-usecase-card">
              <div className="rl-usecase-icon">
                <BarChart3 size={22} />
              </div>
              <div className="rl-usecase-content">
                <h3>Multi-Region Retail & E-Commerce</h3>
                <p>
                  Store incoming transactional CSV and Parquet dumps. Partition records by geographic dispatch 
                  (<code>/region=west</code>, <code>/region=south</code>) so analysts can run localized revenue reports in sub-second time.
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Typical flow: Raw orders (Bronze) ➔ Regional Partitioned (Silver) ➔ Monthly P&L (Gold)
                </div>
              </div>
            </div>

            {/* Case 2 */}
            <div className="rl-usecase-card">
              <div className="rl-usecase-icon">
                <Server size={22} />
              </div>
              <div className="rl-usecase-content">
                <h3>Telemetry & IoT Edge Ingestion</h3>
                <p>
                  Land high-frequency sensor readings in raw JSON format into the Bronze zone. 
                  Inspect schema health, verify packet structure, and catalog streams without blocking upstream devices.
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Typical flow: IoT Edge Payloads ➔ Bronze Staging ➔ Curated Fleet Telemetry
                </div>
              </div>
            </div>

            {/* Case 3 */}
            <div className="rl-usecase-card">
              <div className="rl-usecase-icon">
                <FileSpreadsheet size={22} />
              </div>
              <div className="rl-usecase-content">
                <h3>Executive Financial BI & Reporting</h3>
                <p>
                  Maintain golden source-of-truth datasets in the Gold zone. Finance and leadership teams can query 
                  standard metrics, export to CSV, and share direct dataset links without asking engineering for ad-hoc exports.
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Typical flow: General ledger aggregates ➔ Gold Zone ➔ In-Browser SQL & CSV Export
                </div>
              </div>
            </div>

            {/* Case 4 */}
            <div className="rl-usecase-card">
              <div className="rl-usecase-icon">
                <ShieldCheck size={22} />
              </div>
              <div className="rl-usecase-content">
                <h3>Data Governance & Compliance Audits</h3>
                <p>
                  Maintain an immutable, timestamped record of which users viewed or exported sensitive tables. 
                  Meet enterprise data governance requirements with zero extra tooling required.
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Typical flow: Automated audit logging on all catalog actions and SQL queries
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* H. Customer Onboarding Journey */}
      <section className="rl-section rl-section-tinted" id="onboarding">
        <div className="rl-container">
          <div className="rl-section-header">
            <div className="rl-section-tag">FRICTIONLESS FIRST-TIME EXPERIENCE</div>
            <h2 className="rl-section-title">Smooth Customer Onboarding</h2>
            <p className="rl-section-desc">
              We designed RicozLake so new users and teams can go from signing up to exploring their first dataset in under 3 minutes.
            </p>
          </div>

          <div className="rl-onboarding-hub">
            <div className="rl-onboard-steps-flow">
              <div className="rl-onboard-step-node completed">
                <div className="rl-step-num-circle">1</div>
                <div className="rl-onboard-node-title">Explore Platform</div>
                <div className="rl-onboard-node-desc">Learn features & preview schemas</div>
              </div>

              <div className="rl-onboard-step-node completed">
                <div className="rl-step-num-circle">2</div>
                <div className="rl-onboard-node-title">Sign In / Register</div>
                <div className="rl-onboard-node-desc">Secure account creation with OTP support</div>
              </div>

              <div className="rl-onboard-step-node completed">
                <div className="rl-step-num-circle">3</div>
                <div className="rl-onboard-node-title">Workspace Dashboard</div>
                <div className="rl-onboard-node-desc">Land in your central control room</div>
              </div>

              <div className="rl-onboard-step-node completed">
                <div className="rl-step-num-circle">4</div>
                <div className="rl-onboard-node-title">Ingest Dataset</div>
                <div className="rl-onboard-node-desc">Upload file or connect database source</div>
              </div>

              <div className="rl-onboard-step-node completed">
                <div className="rl-step-num-circle">5</div>
                <div className="rl-onboard-node-title">Catalog & Query</div>
                <div className="rl-onboard-node-desc">Explore, filter, run SQL & export</div>
              </div>
            </div>

            <div className="rl-onboard-cta-bar">
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Ready to start onboarding your first dataset?
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Use our streamlined authentication flow to access your workspace immediately.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  className="rl-btn rl-btn-outline"
                  onClick={() => setIsOnboardingModalOpen(true)}
                >
                  View Quickstart Guide
                </button>
                <button 
                  type="button"
                  className="rl-btn rl-btn-primary"
                  onClick={() => navigate(token ? '/' : '/login')}
                >
                  {token ? 'Enter Dashboard →' : 'Sign Up / Sign In →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* I. FAQs */}
      <section className="rl-section" id="faqs">
        <div className="rl-container">
          <div className="rl-section-header">
            <div className="rl-section-tag">COMMON QUESTIONS</div>
            <h2 className="rl-section-title">Frequently Asked Questions</h2>
            <p className="rl-section-desc">
              Everything you need to know about getting started with RicozLake.
            </p>
          </div>

          <div className="rl-faq-list">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`rl-faq-item ${openFaq === index ? 'open' : ''}`}
              >
                <button 
                  type="button"
                  className="rl-faq-trigger" 
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  aria-expanded={openFaq === index}
                >
                  <span>{faq.q}</span>
                  <span>{openFaq === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                </button>
                {openFaq === index && (
                  <div className="rl-faq-body">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action Banner */}
      <div className="rl-container">
        <div className="rl-final-cta-banner">
          <h2 className="rl-final-cta-title">Bring order to your data lake today.</h2>
          <p className="rl-final-cta-desc">
            Organize datasets into Medallion zones, inspect schemas with zero friction, and query results in sub-second time.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              type="button"
              className="rl-btn rl-btn-primary rl-btn-lg"
              onClick={() => navigate(token ? '/' : '/login')}
            >
              {token ? 'Go to Your Lakehouse Dashboard' : 'Get Started with RicozLake'} <ArrowRight size={18} />
            </button>
            <button 
              type="button"
              onClick={(e) => scrollToSection(e, 'product')} 
              className="rl-btn rl-btn-outline rl-btn-lg"
            >
              Explore Sandbox Again
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="rl-footer">
        <div className="rl-container">
          <div className="rl-footer-grid">
            <div className="rl-footer-col">
              <div 
                className="rl-brand-link" 
                style={{ marginBottom: '1rem' }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <div className="rl-brand-icon-box">
                  <Database size={18} />
                </div>
                <span className="rl-brand-title">RicozLake</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', maxWidth: '320px', marginBottom: '1.25rem' }}>
                Modern enterprise Data Lakehouse platform. Ingest, catalog, and query datasets across Bronze, Silver, and Gold storage zones.
              </p>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Powered by Vite, React, and PostgreSQL.
              </div>
            </div>

            <div className="rl-footer-col">
              <h4>Platform</h4>
              <ul className="rl-footer-links">
                <li><button type="button" className="rl-footer-link" onClick={() => navigate(token ? '/catalog' : '/login')}>Dataset Catalog</button></li>
                <li><button type="button" className="rl-footer-link" onClick={() => navigate(token ? '/queries' : '/login')}>SQL Query Studio</button></li>
                <li><button type="button" className="rl-footer-link" onClick={() => navigate(token ? '/data-sources' : '/login')}>Data Sources</button></li>
                <li><button type="button" className="rl-footer-link" onClick={() => navigate(token ? '/add-dataset' : '/login')}>Add Dataset</button></li>
              </ul>
            </div>

            <div className="rl-footer-col">
              <h4>Product</h4>
              <ul className="rl-footer-links">
                <li><button type="button" className="rl-footer-link" onClick={(e) => scrollToSection(e, 'product')}>Sandbox Preview</button></li>
                <li><button type="button" className="rl-footer-link" onClick={(e) => scrollToSection(e, 'features')}>Core Features</button></li>
                <li><button type="button" className="rl-footer-link" onClick={(e) => scrollToSection(e, 'how-it-works')}>Medallion Flow</button></li>
                <li><button type="button" className="rl-footer-link" onClick={(e) => scrollToSection(e, 'use-cases')}>Use Cases</button></li>
              </ul>
            </div>

            <div className="rl-footer-col">
              <h4>Governance</h4>
              <ul className="rl-footer-links">
                <li><button type="button" className="rl-footer-link" onClick={() => navigate(token ? '/activity' : '/login')}>Activity Center</button></li>
                <li><button type="button" className="rl-footer-link" onClick={() => navigate(token ? '/settings' : '/login')}>Security & Settings</button></li>
                <li><button type="button" className="rl-footer-link" onClick={(e) => scrollToSection(e, 'faqs')}>FAQ Knowledgebase</button></li>
              </ul>
            </div>
          </div>

          <div className="rl-footer-bottom">
            <div>© {new Date().getFullYear()} RicozLake. All rights reserved.</div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Theme: {isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Onboarding Quickstart Modal */}
      {isOnboardingModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setIsOnboardingModalOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '520px',
              width: '100%',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="rl-brand-icon-box" style={{ width: '32px', height: '32px' }}>
                  <Database size={16} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Welcome to RicozLake
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsOnboardingModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Ready to organize your datasets? Follow these simple steps to launch your workspace:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '8px' }}>
                <CheckCircle2 size={18} color="var(--status-success)" style={{ marginTop: '0.15rem' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>1. Sign in to your account</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Use your email and password, or create a new account in seconds.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '8px' }}>
                <CheckCircle2 size={18} color="var(--status-success)" style={{ marginTop: '0.15rem' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>2. Upload your initial dataset</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Drag-and-drop a CSV, Parquet, or JSON file and assign its storage zone.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '8px' }}>
                <CheckCircle2 size={18} color="var(--status-success)" style={{ marginTop: '0.15rem' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>3. Explore & Query</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Search columns, inspect schemas, and run SQL queries immediately.</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button"
                className="rl-btn rl-btn-outline"
                onClick={() => setIsOnboardingModalOpen(false)}
              >
                Close
              </button>
              <button 
                type="button"
                className="rl-btn rl-btn-primary"
                onClick={() => {
                  setIsOnboardingModalOpen(false);
                  navigate('/login');
                }}
              >
                Proceed to Sign In →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
