import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Importăm componentele React-Bootstrap
import { 
  Container, Row, Col, Card, Table, Button, 
  Nav, Modal, Form, Badge, InputGroup, 
  Alert, ProgressBar 
} from 'react-bootstrap';
// Importăm iconițele Lucide
import { 
  Wallet, TrendingUp, RefreshCcw, LayoutDashboard, List, Settings, 
  Search, Trash2, Brain, Loader2, Calendar,
  Edit3, BarChart3, Info, PieChart, CheckCircle,
  PlusCircle, ArrowUpRight, ArrowDownLeft, Plus, Menu
} from 'lucide-react';
// Importăm Chart.js pentru grafice
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';



// Înregistrăm modulele Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- CONFIGURARE API ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const MONTHS = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
];

export default function App() {
  // --- 1. STĂRI (STATE) ---
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ globalBalance: 0 });
  const [topCategories, setTopCategories] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [monthlyFlow, setMonthlyFlow] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [transactionModal, setTransactionModal] = useState({ 
    show: false, 
    mode: 'add', 
    data: null,
    type: 'expense'
  });

  // Starea pentru modalul de categorii 
  const [categoryModal, setCategoryModal] = useState({
    show: false,
    mode: 'add',
    data: null
  });

  // Stare pentru sidebar-ul mobil
  const [showSidebar, setShowSidebar] = useState(false);

  // --- 2. LOGICĂ DINAMICĂ ANI 
  // Această listă se calculează o singură dată și asigură intervalul 2010 -> An Curent + 5
  const yearsList = useMemo(() => {
    const startYear = 2010; // Anul de început dorit
    const endYear = new Date().getFullYear() + 5; // Anul curent + 5 ani de rezervă
    const totalYears = endYear - startYear + 1;
    
    return Array.from({ length: totalYears }, (_, i) => startYear + i);
  }, []);

  // --- 2. LOGICĂ PRELUARE DATE (LOAD DATA) ---
  // Această funcție apelează exclusiv endpoint-urile MySQL. 
  // Dacă serverul este offline, intră în catch și afișează eroarea.
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoints = [
        `${API_BASE_URL}/transactions/all`,
        `${API_BASE_URL}/categories`,
        `${API_BASE_URL}/stats/sold-global`,
        `${API_BASE_URL}/stats/top-expenses?limit=5`,
        `${API_BASE_URL}/stats/forecast?months=3`,
        `${API_BASE_URL}/stats/monthly-flow`
      ];

      const responses = await Promise.all(endpoints.map(url => 
        fetch(url).catch(e => ({ ok: false, error: e }))
      ));

      // Verificăm dacă serverul a răspuns
      if (responses[0].error) throw new Error("Backend Offline. Pornește 'node server.js'");

      const [dataT, dataC, dataB, dataTop, dataFor, dataFlow] = await Promise.all(
        responses.map(r => r.ok ? r.json() : null)
      );

      setTransactions(dataT || []);
      setCategories(dataC || []);
      setStats({ globalBalance: Number(dataB?.soldTotalGlobal) || 0 });
      setTopCategories(dataTop || []);
      setForecast(dataFor || []);
      setMonthlyFlow(dataFlow || []);

    } catch (err) {
      console.error("Eroare MySQL:", err);
      setError("Conexiunea la MySQL a eșuat. Verifică dacă serverul de backend rulează local.");
      // Resetăm datele pentru a nu păstra informații vechi/eronate în interfață
      setTransactions([]);
      setMonthlyFlow([]);
      setTopCategories([]);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Injectare Bootstrap CSS din CDN
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
    document.head.appendChild(link);
    return () => { if (document.head.contains(link)) document.head.removeChild(link); };
  }, [loadData]);

  // --- 3. FILTRARE LOCALĂ ---
  const displayedTransactions = useMemo(() => {
    return (transactions || []).filter(t => {
      const tDate = new Date(t.date);
      const matchesMonth = tDate.getMonth() === selectedMonth;
      const matchesYear = tDate.getFullYear() === selectedYear;
      const matchesSearch = (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesMonth && matchesYear && matchesSearch && matchesType;
    });
  }, [transactions, selectedMonth, selectedYear, searchQuery, typeFilter]);

const periodStats = useMemo(() => {
  // Calculăm veniturile forțând transformarea sumei în număr
  const income = displayedTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      
  // Calculăm cheltuielile forțând transformarea sumei în număr
  const expense = displayedTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  return { 
    income, 
    expense, 
    balance: income - expense 
  };
}, [displayedTransactions]);

  const formatRON = (val) => {
  const num = Number(val);
  // Dacă rezultatul nu este un număr valid (isNaN), afișăm 0
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' })
    .format(isNaN(num) ? 0 : num);
};

  // --- 4. CRUD OPERAȚIUNI (MYSQL DIRECT) ---
const handleTransactionSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  const isEdit = transactionModal.mode === 'edit';

  const url = isEdit
    ? `${API_BASE_URL}/transactions/${transactionModal.data.id}`
    : `${API_BASE_URL}/transactions`;

  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        amount: parseFloat(payload.amount),
        type: transactionModal.type
      })
    });

    if (res.ok) {
      setTransactionModal({
        show: false,
        mode: 'add',
        data: null,
        type: 'expense'
      });
      loadData();
    }
  } catch (err) {
    alert("Eroare la salvarea tranzacției.");
  }
};



// --- LOGICĂ SUBMIT CATEGORII (POST/PUT) ---
const handleCategorySubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  const isEdit = categoryModal.mode === 'edit';

  const url = isEdit
    ? `${API_BASE_URL}/categories/${categoryModal.data.id}`
    : `${API_BASE_URL}/categories`;

  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setCategoryModal({ show: false, mode: 'add', data: null });
      loadData();
    }
  } catch (err) {
    alert("Eroare la salvarea categoriei.");
  }
};



  const deleteTransaction = async (id) => {
    if (!window.confirm("Ștergi această înregistrare definitiv din MySQL?")) return;
    try {
      await fetch(`${API_BASE_URL}/transactions/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert("Eroare la ștergerea datelor.");
    }
  };

const deleteCategory = async (id) => {
    if (!window.confirm("Ștergi această categorie? Tranzacțiile asociate ar putea rămâne fără categorie!")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      alert("Eroare la ștergerea categoriei.");
    }
  };


  // --- 5. COMPONENTE VIZUALE ---

  const Sidebar = () => (
    <div className={`sidebar-container text-white min-vh-100 p-4 shadow-lg position-fixed d-flex flex-column ${showSidebar ? 'd-block' : 'd-none d-lg-block'}`} 
         style={{ width: '280px', backgroundColor: '#0f172a', zIndex: 1050, left: 0, top: 0 }}>
      <div className="d-flex align-items-center mb-5 gap-3 px-2">
        <div className="bg-success p-2 rounded-3 text-white shadow-success">
          <Wallet size={24} />
        </div>
        <h4 className="mb-0 fw-bold tracking-tight">MyBudget</h4>
      </div>

      <Nav className="flex-column gap-2 flex-grow-1 font-bold">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'transactions', label: 'Registru', icon: List },
          { id: 'categories', label: 'Categorii', icon: Settings },
          { id: 'analytics', label: 'Analiză AI', icon: BarChart3 },
        ].map(item => (
          <Nav.Link 
            key={item.id}
            onClick={() => {
              setView(item.id);
              setShowSidebar(false); // Închide sidebar-ul pe mobil după selecție
            }}
            className={`d-flex align-items-center gap-3 p-3 rounded-4 transition-all ${view === item.id ? 'bg-success text-white shadow-success-soft' : 'text-secondary bg-transparent hover-dark-blue'}`}
            style={{ cursor: 'pointer' }}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Nav.Link>
        ))}
      </Nav>

      <div className="mt-auto border-top border-secondary pt-4 opacity-75">
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className={`rounded-circle ${error ? 'bg-danger' : 'bg-success'}`} style={{ width: 8, height: 8 }}></div>
          <small className="text-secondary fw-bold text-uppercase" style={{ fontSize: '9px' }}>
            {error ? 'MySQL Offline' : 'MySQL Online'}
          </small>
        </div>
        <Button variant="outline-light" size="sm" className="w-100 border-secondary opacity-50 shadow-none" onClick={loadData}>
          <RefreshCcw size={14} className="me-2" /> Sincronizează
        </Button>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="animate-in">
      <header className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">Tablou Principal</h2>
          <p className="text-muted small">Date pentru {MONTHS[selectedMonth]} {selectedYear}</p>
        </div>
        <Button variant="success" className="rounded-3 fw-bold px-4 py-2 shadow-success btn-green-effect" onClick={() => setTransactionModal({ show: true, mode: 'add', data: null, type: 'expense' })}>
          <Plus size={18} className="me-2" /> Adaugă Tranzacție
        </Button>
      </header>

      <Row className="g-3 mb-4">
        {[
          { label: 'Sold Global', value: stats.globalBalance, color: 'dark' },
          { label: `Venituri ${MONTHS[selectedMonth]}`, value: periodStats.income, color: 'primary' },
          { label: `Cheltuieli ${MONTHS[selectedMonth]}`, value: periodStats.expense, color: 'danger' },
          { label: `Profit Lună`, value: periodStats.balance, color: 'success' },
        ].map((item, i) => (
          <Col xs={12} sm={6} lg={3} key={i}>
            <Card className={`border-0 shadow-sm rounded-4 h-100 border-start border-5 border-${item.color}`}>
              <Card.Body className="p-3">
                <div className={`text-${item.color} small fw-bold mb-1 text-uppercase tracking-wider`} style={{ fontSize: '15px' }}>{item.label}</div>
                <div className="h4 fw-bold text-dark mb-0 tracking-tighter">{formatRON(item.value)}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4 mb-4">
        <Col xs={12} lg={8}>
          <Card className="border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><BarChart3 size={20} className="text-primary"/> Evoluție Flux Numerar</h5>
            <div style={{ height: '300px' }}>
              <Bar 
                data={{
                  labels: (monthlyFlow || []).map(f => `${MONTHS[f.month - 1]} ${f.year}`),
                  datasets: [
                    { label: 'Venituri', data: (monthlyFlow || []).map(f => f.total_income), backgroundColor: 'rgba(34, 197, 94, 0.7)', borderColor: '#22c55e', borderWidth: 2 },
                    { label: 'Cheltuieli', data: (monthlyFlow || []).map(f => f.total_expense), backgroundColor: 'rgba(239, 68, 68, 0.7)', borderColor: '#ef4444', borderWidth: 2 }
                  ]
                }} 
                options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} 
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card className="border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><PieChart size={20} className="text-danger"/> Top Cheltuieli</h5>
            <div style={{ height: '240px' }}>
              <Doughnut 
                data={{
                  labels: (topCategories || []).map(c => c.category_name),
                  datasets: [{
                    data: (topCategories || []).map(c => c.total_spent),
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316'],
                    borderWidth: 0
                  }]
                }} 
                options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } }} 
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div className="px-4 py-3 bg-light border-bottom d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold">Ultimele Tranzacții Realizate</h6>
            <Button variant="link" className="text-success text-decoration-none p-0 fw-bold small shadow-none" onClick={() => setView('transactions')}>Vezi Registrul</Button>
        </div>
        <Table hover responsive className="mb-0 align-middle">
          <thead className="small text-muted text-uppercase tracking-widest bg-light">
            <tr><th className="ps-4">Descriere</th><th>Dată</th><th className="text-end pe-4">Suma</th></tr>
          </thead>
          <tbody>
            {displayedTransactions.slice(0, 5).map(t => (
              <tr key={t.id}>
                <td className="ps-4 py-3 fw-bold text-dark">{t.description}</td>
                <td className="text-muted small">{new Date(t.date).toLocaleDateString('ro-RO')}</td>
                <td className={`text-end pe-4 fw-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                  {t.type === 'income' ? '+' : '-'} {formatRON(t.amount)}
                </td>
              </tr>
            ))}
            {displayedTransactions.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-muted small">Nicio tranzacție găsită în MySQL pentru această perioadă.</td></tr>}
          </tbody>
        </Table>
      </Card>
    </div>
  );

const AnalyticsView = () => {
  // 1. Calculăm rata de economisire
  const savingsRate = useMemo(() => {
    const income = Number(periodStats?.income) || 0;
    const balance = Number(periodStats?.balance) || 0;
    if (income <= 0) return 0;
    const rate = Math.round((balance / income) * 100);
    return Math.max(0, Math.min(100, rate));
  }, [periodStats]);

  // 2. Stări locale pentru AI
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiText, setAiText] = useState("");

  // 3. Funcția care apelează backend-ul Gemini
  const generateAIReport = async () => {
    setLoadingAI(true);
    setAiText("");
    try {
      // Trimitem luna și anul selectate în interfață către backend
      const res = await fetch(`${API_BASE_URL}/ai/financial-report?month=${selectedMonth}&year=${selectedYear}`);
      const data = await res.json();
      
      if (res.ok) {
        setAiText(data.text);
      } else {
        setAiText(data.text || "Nu s-a putut genera analiza.");
      }
    } catch (err) {
      console.error("Eroare AI:", err);
      setAiText("Eroare la conectarea cu serviciul AI. Verifică dacă serverul backend (port 5000) rulează.");
    } finally {
      setLoadingAI(false);
    }
  };

    // 2. Identificăm categoria principală de cheltuieli
    const mainCategory = topCategories && topCategories.length > 0 
      ? topCategories[0].category_name 
      : 'Altele';

    // 3. Calculăm potențialul de economisire (10% din cheltuieli)
    const potentialSavings = formatRON(Number(periodStats?.expense || 0) * 0.1);

    return (
      <div className="animate-in">
        <h2 className="fw-bold mb-4 text-dark">Analiză și Predicții AI</h2>
        <Row className="g-4 align-items-start">
          <Col xs={12} md={8}>
            {/* FORECAST CARD */}
            <Card className="border-0 shadow-sm rounded-4 p-5 bg-white mb-4">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-3">
                <Brain className="text-success" size={40} /> Forecast Sold Viitor
              </h5>
              <p className="text-muted small mb-4">Algoritmul estimează evoluția averii tale bazat pe media profitului lunar.</p>
              {(forecast || []).length > 0 ? (
                forecast.map((f, i) => (
                  <div key={i} className="p-3 p-md-4 bg-light rounded-4 mb-3 border border-white shadow-sm">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-success bg-opacity-10 p-2 rounded-3 text-success"><Calendar size={20}/></div>
                        <span className="fw-bold text-dark fs-6 fs-md-5">Peste {f.month_projection} {f.month_projection === 1 ? 'lună' : 'luni'}</span>
                      </div>
                      <span className="h5 h4-md mb-0 fw-bold text-success text-nowrap">
                        {formatRON(Number(f.projected_sold) || 0)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted border rounded-4 border-dashed bg-light">
                  Insuficiente date în MySQL pentru a genera proiecții financiare.
                </div>
              )}
            </Card>

            {/* TREND GRAPH */}
            <Card className="border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold mb-4 text-dark">Trend Profit Real (Venituri - Cheltuieli)</h5>
              <div style={{ height: '300px' }}>
                <Line 
                  data={{
                    labels: (monthlyFlow || []).map(f => `${MONTHS[f.month - 1]}`),
                    datasets: [{
                      label: 'Profit Net',
                      data: (monthlyFlow || []).map(f => Number(f.total_income) - Number(f.total_expense)),
                      fill: true,
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      borderColor: '#22c55e',
                      tension: 0.4,
                      pointRadius: 4
                    }]
                  }} 
                  options={{ 
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              </div>
            </Card>
          </Col>

          {/* SMART ADVISOR CARD */}
          <Col xs={12} md={4}>
            <Card className="border-0 shadow-sm rounded-4 text-white p-4 position-relative overflow-hidden shadow-lg smart-advisor-card" style={{ backgroundColor: '#0f172a' }}>
              <div className="position-absolute top-0 end-0 p-3 opacity-10"><Brain size={73}/></div>
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2"><Info size={20} className="text-info"/> Smart Advisor</h5>

              <div className="position-relative h-100 d-flex flex-column smart-advisor-content" style={{ zIndex: 2 }}>

                <h6 className="text-info fw-semibold mb-3">
                  Analiză AI Generativă
                </h6>

                {!aiText && !loadingAI && (
                 <p className="small text-secondary lh-lg mb-4 flex-grow-1">
                    Generează un raport financiar inteligent în timp real pe baza datelor tale.
                    <br /><br />
                    Sistemul va analiza veniturile, cheltuielile, rata de economisire și
                    va crea un raport structurat în mai multe paragrafe,
                    împreună cu recomandări concrete pentru optimizare.
                  </p>
                )}

                {loadingAI && (
                  <div className="text-center my-4 flex-grow-1 d-flex flex-column justify-content-center">
                    <div className="spinner-border text-success mb-3" />
                    <p className="small text-secondary">
                      AI analizează datele financiare...
                    </p>
                  </div>
                )}

                {aiText && (
                  <div className="mt-3 flex-grow-1 d-flex flex-column">
                    <div className="p-3 rounded-4 bg-dark bg-opacity-50 border border-success flex-grow-1 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="badge bg-success">AI Generated</span>
                        <button
                          className="btn btn-sm btn-outline-light"
                          onClick={generateAIReport}
                        >
                          Generează din nou
                        </button>
                      </div>

                      <div className="flex-grow-1 overflow-auto" style={{ whiteSpace: "pre-line" }}>
                        {aiText}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={generateAIReport}
                  disabled={loadingAI}
                  className="btn btn-success w-100 py-3 rounded-4 fw-bold border-0 mt-3 shadow-success"
                  style={{ opacity: loadingAI ? 0.7 : 1, transition: 'opacity 0.2s' }}
                >
                  {loadingAI ? "Se generează..." : aiText ? "Actualizează Analiza AI" : "Generează Raport Financiar AI"}
                </button>

              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // --- 6. RENDER PRINCIPAL ---
  if (loading && transactions.length === 0 && !error) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-white">
      <Loader2 className="text-success animate-spin mb-3" size={48} />
      <h6 className="fw-bold text-muted uppercase tracking-widest" style={{ fontSize: '10px' }}>Sincronizare MySQL...</h6>
    </div>
  );

  return (
    <div className="bg-light min-vh-100 d-flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        body { background-color: #f8f9fa; margin: 0; position: relative; }
        .hover-dark-blue:hover { background-color: rgba(255, 255, 255, 0.05); color: #fff !important; }
        .shadow-success { box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.3); }
        .shadow-success-soft { box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.2); }
        .btn-green-effect { transition: all 0.3s ease; }
        .btn-green-effect:hover { transform: translateY(-2px); box-shadow: 0 15px 20px -5px rgba(34, 197, 94, 0.4); }
        .animate-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .main-content { 
          position: absolute; 
          top: 0; 
          left: 0; 
          right: 0; 
          bottom: 0; 
          overflow-y: auto; 
        }
        @media (min-width: 992px) { 
          .main-content { 
            left: 280px; 
            right: 0; 
          } 
        }
        .main-content .container-fluid { max-width: none; padding-left: 1.5rem; padding-right: 1.5rem; }
        @media (min-width: 576px) { .main-content .container-fluid { padding-left: 2rem; padding-right: 2rem; } }
        @media (min-width: 768px) { .main-content .container-fluid { padding-left: 2.5rem; padding-right: 2.5rem; } }
        @media (min-width: 992px) { .main-content .container-fluid { padding-left: 3rem; padding-right: 3rem; } }
        .responsive-filters { min-width: auto; }
        @media (min-width: 992px) { .responsive-filters { min-width: 310px; } }
        .responsive-search { width: 200px; }
        @media (min-width: 992px) { .responsive-search { width: 300px; } }
        .smart-advisor-card { min-height: 740px; }
        @media (max-width: 991px) { .smart-advisor-card { min-height: 700px; } }
        @media (max-width: 767px) { .smart-advisor-card { min-height: 560px; } }
        .smart-advisor-content { display: flex; flex-direction: column; height: calc(100% - 80px); }
        .smart-advisor-text { overflow-y: auto; flex-grow: 1; }
      `}</style>
      
      <Sidebar />
      
      {/* Overlay pentru sidebar pe mobil */}
      {showSidebar && (
        <div 
          className="d-lg-none position-fixed" 
          style={{ 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: 1040 
          }}
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      <main className="main-content p-3 p-lg-5">
        <Container fluid>
          {error && <Alert variant="danger" className="border-0 shadow-sm rounded-4 mb-4 animate-in"><b>Atenție:</b> {error}</Alert>}

          {/* TOP BAR FILTRE */}
          <Card className="border-0 shadow-sm rounded-4 mb-5 bg-white p-3">
            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-2">
              {/* Rând 1 (mobil): Hamburger + Căutare */}
              <div className="d-flex d-md-none w-100 justify-content-between align-items-center gap-2">
                {/* Hamburger Menu pentru mobil */}
                <Button 
                  variant="link" 
                  className="d-md-none text-dark p-2" 
                  onClick={() => setShowSidebar(!showSidebar)}
                  style={{ border: 'none', background: 'none' }}
                >
                  <Menu size={24} />
                </Button>

                <InputGroup size="sm" className="responsive-search flex-grow-1">
                  <InputGroup.Text className="bg-light border-0"><Search size={14}/></InputGroup.Text>
                  <Form.Control placeholder="Caută..." className="bg-light border-0 shadow-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </InputGroup>
              </div>

              {/* Hamburger + Luna/An (tabletă+) */}
              <div className="d-none d-md-flex w-100 w-md-auto align-items-center justify-content-between gap-2">
                <div className="d-flex gap-2 gap-md-3 gap-lg-4 align-items-center bg-light p-1 rounded-3 justify-content-center text-center responsive-filters">
                  <Calendar size={50} className="text-success ms-2" />
                  <Form.Select size="sm" className="border-0 bg-transparent fw-bold shadow-none" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </Form.Select>
                  <Form.Select 

    size="sm" 
    className="border-0 bg-transparent fw-bold shadow-none cursor-pointer" 
    value={selectedYear} 
    onChange={e => setSelectedYear(Number(e.target.value))}
  >
    {yearsList.map(y => (
      <option key={y} value={y}>{y}</option>
    ))}
  </Form.Select>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <InputGroup size="sm" className="responsive-search">
                    <InputGroup.Text className="bg-light border-0"><Search size={14}/></InputGroup.Text>
                    <Form.Control placeholder="Caută..." className="bg-light border-0 shadow-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </InputGroup>

                  <Button 
                    variant="link" 
                    className="d-md-block d-lg-none text-dark p-2" 
                    onClick={() => setShowSidebar(!showSidebar)}
                    style={{ border: 'none', background: 'none' }}
                  >
                    <Menu size={24} />
                  </Button>
                </div>
              </div>

              {/* Rând 2 (mobil): Luna + An */}
              <div className="d-md-none w-100 d-flex gap-2 align-items-center bg-light p-1 rounded-3 justify-content-center text-center">
                <Calendar size={50} className="text-success ms-2" />
                <Form.Select size="sm" className="border-0 bg-transparent fw-bold shadow-none" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </Form.Select>
                <Form.Select 
  size="sm" 
  className="border-0 bg-transparent fw-bold shadow-none cursor-pointer" 
  value={selectedYear} 
  onChange={e => setSelectedYear(Number(e.target.value))}
>
  {yearsList.map(y => (
    <option key={y} value={y}>{y}</option>
  ))}
</Form.Select>
              </div>
            </div>
          </Card>

          {/* VEDERI DINAMICE */}
          {view === 'dashboard' && <DashboardView />}
          {view === 'analytics' && <AnalyticsView />}

          {view === 'transactions' && (
            <div className="animate-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-dark mb-0">Registru Tranzacții</h2>
                <Button variant="success" className="rounded-3 fw-bold px-4 shadow-success" onClick={() => setTransactionModal({ show: true, mode: 'add', type: 'expense' })}>
                  <PlusCircle size={18} className="me-2" /> Adaugă Tranzacție
                </Button>
              </div>
              <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="table-dark small">
                    <tr><th className="ps-4 py-3">STATUS</th><th>DESCRIERE</th><th>DATA</th><th className="text-end">SUMA</th><th className="text-center">OPȚIUNI</th></tr>
                  </thead>
                  <tbody>
                    {displayedTransactions.map(t => (
                      <tr key={t.id}>
                        <td className="ps-4">
                          <Badge bg={t.type === 'income' ? 'success' : 'danger'} pill className="px-3 py-1 uppercase" style={{ fontSize: '9px' }}>{t.type === 'income' ? 'VENIT' : 'PLATĂ'}</Badge>
                        </td>
                        <td className="fw-bold text-dark">{t.description}</td>
                        <td className="text-muted small">{new Date(t.date).toLocaleDateString('ro-RO')}</td>
                        <td className={`text-end fw-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>{formatRON(t.amount)}</td>
                        <div className="d-flex gap-1">
                            {/* BUTON DE EDITARE CATEGORIE */}
                           <td className="text-center">
                            <Button
                              variant="link"
                              className="text-primary p-1 shadow-none"
                              onClick={() =>
                                setTransactionModal({
                                  show: true,
                                  mode: 'edit',
                                  data: t,
                                  type: t.type
                                })
                              }
                            >
                              <Edit3 size={16} />
                            </Button>

                            <Button
                              variant="link"
                              className="text-danger p-1 shadow-none"
                              onClick={() => deleteTransaction(t.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>

                            
                          </div>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </div>
          )}

          {view === 'categories' && (
            <div className="animate-in">
              <h2 className="fw-bold mb-4 text-dark">Management Categorii</h2>
              <Row className="g-3">
                {(categories || []).map(cat => (
  <Col xs={12} sm={6} md={4} lg={3} key={cat.id}>
    <Card className="border-0 shadow-sm rounded-4 p-3 d-flex flex-row justify-content-between align-items-center bg-white border-hover-success transition-all shadow-sm">
      <span className="fw-bold text-dark">{cat.name}</span>
      <div className="d-flex gap-1">
        {/* BUTON EDITARE - ACUM ARE onClick */}
        <Button 
          variant="link" 
          className="text-primary p-1 shadow-none"
          onClick={() => setCategoryModal({ show: true, mode: 'edit', data: cat })}
        >
          <Edit3 size={14}/>
        </Button>

        {/* BUTON ȘTERGERE - ACUM ARE onClick */}
        <Button 
          variant="link" 
          className="text-danger p-1 shadow-none"
          onClick={() => deleteCategory(cat.id)}
        >
          <Trash2 size={14}/>
        </Button>
      </div>
    </Card>
  </Col>
))}
                <Col xs={12} sm={6} md={4} lg={3}>
                  <Card onClick={() => setCategoryModal({show: true,mode: 'add',data: null})} 
                    className="border-0 shadow-sm rounded-4 p-3 d-flex flex-row justify-content-center align-items-center bg-light" style={{ border: '2px dashed #cbd5e1', cursor: 'pointer' }}>
                    <span className="text-muted fw-bold small"><PlusCircle size={14} className="me-1"/> Categorie Nouă</span>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Container>
      </main>

     {/* MODAL CATEGORII - Adaugă acest bloc la finalul return-ului, înainte de ultimele </div> și ); */}
      <Modal show={categoryModal.show} onHide={() => setCategoryModal({ ...categoryModal, show: false })} centered>
        <Modal.Header closeButton className="border-0 bg-light p-4 rounded-top-4">
          <Modal.Title className="fw-bold text-dark">
            {categoryModal.mode === 'add' ? 'Categorie Nouă' : 'Editează Categoria'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 bg-white rounded-bottom-4">
          <Form onSubmit={handleCategorySubmit} key={categoryModal.data?.id || 'new_cat'}>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted uppercase">Nume Categorie</Form.Label>
              <Form.Control 
                name="name" 
                required 
                className="bg-light border-0 p-3 rounded-3 shadow-none" 
                placeholder="Ex: Mâncare, Sănătate..." 
                defaultValue={categoryModal.data?.name} 
              />
            </Form.Group>
            <Button type="submit" variant="success" className="w-100 py-3 rounded-3 fw-bold border-0 shadow-lg">
              <CheckCircle size={18} className="me-2"/> Salvează
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* MODAL TRANZACȚIE - Această secțiune gestionează atât adăugarea, cât și editarea */}
<Modal show={transactionModal.show} onHide={() => setTransactionModal({ ...transactionModal, show: false })} centered>
  <Modal.Header closeButton className="border-0 bg-light p-4 rounded-top-4">
    <Modal.Title className="fw-bold text-dark">
      {transactionModal.mode === 'add' ? 'Tranzacție Nouă MySQL' : 'Editează Înregistrarea'}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body className="p-4 bg-white rounded-bottom-4">
    
    {/* 1. Formularul folosește acum 'key' pentru a se reseta corect la schimbarea ID-ului */}
    <Form onSubmit={handleTransactionSubmit} key={transactionModal.data?.id || 'new'}>
      
      {/* Selector Tip: Cheltuială / Venit */}
      <div className="btn-group w-100 mb-4 bg-light p-1 rounded-3 shadow-inner">
        <Button 
          variant={transactionModal.type === 'expense' ? 'danger' : 'light'} 
          className={`rounded-2 fw-bold flex-grow-1 border-0 shadow-none transition-all ${transactionModal.type === 'expense' ? 'text-white' : 'text-muted'}`} 
          onClick={() => setTransactionModal({...transactionModal, type: 'expense'})}
        >
          Cheltuială
        </Button>
        <Button 
          variant={transactionModal.type === 'income' ? 'success' : 'light'} 
          className={`rounded-2 fw-bold flex-grow-1 border-0 shadow-none transition-all ${transactionModal.type === 'income' ? 'text-white' : 'text-muted'}`} 
          onClick={() => setTransactionModal({...transactionModal, type: 'income'})}
        >
          Venit
        </Button>
      </div>

      {/* Descriere cu defaultValue pentru Editare */}
      <Form.Group className="mb-3">
        <Form.Label className="small fw-bold text-muted uppercase">Descriere</Form.Label>
        <Form.Control 
          name="description" 
          required 
          className="bg-light border-0 p-3 rounded-3 shadow-none" 
          placeholder="Ex: Factură Gaz" 
          defaultValue={transactionModal.data?.description} 
        />
      </Form.Group>

      <Row>
        <Col xs={12} md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted uppercase">Suma</Form.Label>
            <Form.Control 
              name="amount" 
              type="number" 
              step="0.01" 
              required 
              className="bg-light border-0 p-3 rounded-3 shadow-none" 
              defaultValue={transactionModal.data?.amount}
            />
          </Form.Group>
        </Col>
        <Col xs={12} md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted uppercase">Data</Form.Label>
            <Form.Control 
              name="date" 
              type="date" 
              required 
              className="bg-light border-0 p-3 rounded-3 shadow-none" 
              defaultValue={transactionModal.data?.date ? transactionModal.data.date.split('T')[0] : new Date().toISOString().split('T')[0]} 
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Selector Categorie cu defaultValue */}
      <Form.Group className="mb-4">
        <Form.Label className="small fw-bold text-muted uppercase">Categorie</Form.Label>
        <Form.Select 
          name="category_id" 
          required 
          className="bg-light border-0 p-3 rounded-3 shadow-none fw-bold"
          defaultValue={transactionModal.data?.category_id}
        >
          <option value="">Alege categoria...</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* Buton Dinamic (Salvează vs Actualizează) */}
      <Button 
        type="submit" 
        variant="dark" 
        className={`w-100 py-3 rounded-3 fw-bold border-0 shadow-lg ${transactionModal.type === 'income' ? 'bg-success' : 'bg-danger'}`}
      >
        <CheckCircle size={18} className="me-2"/> 
        {transactionModal.mode === 'add' ? 'Salvează' : 'Actualizează Datele'}
      </Button>
    </Form>
  </Modal.Body>
</Modal>
    </div>
  );
}