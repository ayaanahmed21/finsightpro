import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const CATEGORIES = ["Food", "Transport", "Shopping", "Utilities", "Health", "Entertainment", "Education", "Rent", "Income"];
const CAT_COLORS = {
  Food: "#f97316", Transport: "#3b82f6", Shopping: "#a855f7",
  Utilities: "#10b981", Health: "#ef4444", Entertainment: "#f59e0b",
  Education: "#6366f1", Rent: "#14b8a6"
};

const generateTransactions = () => {
  const txns = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const count = randomBetween(1, 4);
    for (let j = 0; j < count; j++) {
      const cat = CATEGORIES[randomBetween(0, CATEGORIES.length - 1)];
      const isIncome = Math.random() < 0.08;
      txns.push({
        id: `txn-${i}-${j}`,
        date: date.toISOString().split("T")[0],
        category: isIncome ? "Income" : cat,
        description: isIncome ? "Salary / Freelance" : `${cat} expense`,
        amount: isIncome ? randomBetween(15000, 50000) : randomBetween(100, 5000),
        type: isIncome ? "income" : "expense",
      });
    }
  }
  return txns.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const INITIAL_TRANSACTIONS = generateTransactions();

function predictNextMonth(transactions) {
  const byCategory = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t.amount);
  });
  const predictions = {};
  Object.entries(byCategory).forEach(([cat, amounts]) => {
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const trend = amounts.length > 1 ? (amounts[amounts.length - 1] - amounts[0]) / amounts.length : 0;
    predictions[cat] = Math.max(0, Math.round(avg + trend * 0.3));
  });
  return predictions;
}

function detectAnomalies(transactions) {
  const byCategory = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t.amount);
  });
  const anomalies = [];
  Object.entries(byCategory).forEach(([cat, amounts]) => {
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const std = Math.sqrt(amounts.map(a => Math.pow(a - avg, 2)).reduce((a, b) => a + b, 0) / amounts.length);
    amounts.forEach((amt) => {
      if (amt > avg + 2 * std && std > 0) anomalies.push({ category: cat, amount: amt, avg: Math.round(avg), zscore: ((amt - avg) / std).toFixed(2) });
    });
  });
  return anomalies.slice(0, 5);
}

function computeSpendingPatterns(transactions) {
  const dayMap = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };
  const byDay = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  transactions.filter(t => t.type === "expense").forEach(t => {
    const d = new Date(t.date).getDay();
    byDay[dayMap[d]] += t.amount;
  });
  return Object.entries(byDay).map(([day, amt]) => ({ day, amount: amt }));
}

function monthlyTrend(transactions) {
  const months = {};
  transactions.forEach(t => {
    const m = t.date.slice(0, 7);
    if (!months[m]) months[m] = { month: m, income: 0, expense: 0 };
    months[m][t.type] += t.amount;
  });
  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
}

const Badge = ({ color, children }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
    {children}
  </span>
);

const KPICard = ({ label, value, sub, color, icon }) => (
  <div style={{
    background: "linear-gradient(135deg, #1a1d2e 0%, #12141f 100%)",
    border: `1px solid ${color}33`,
    borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden"
  }}>
    <div style={{ position: "absolute", top: 12, right: 16, fontSize: 28, opacity: 0.15 }}>{icon}</div>
    <div style={{ fontSize: 12, color: "#888", fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color, marginTop: 6, fontFamily: "'Syne', sans-serif" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{sub}</div>}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
  </div>
);

const SectionTitle = ({ children, accent }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
    <div style={{ width: 4, height: 22, borderRadius: 2, background: accent || "#6366f1" }} />
    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Syne', sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{children}</h2>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1d2e", border: "1px solid #2d3148", borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>{p.name}: {formatCurrency(p.value)}</div>
      ))}
    </div>
  );
};

export default function App() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [form, setForm] = useState({ description: "", amount: "", category: "Food", type: "expense", date: new Date().toISOString().split("T")[0] });
  const [filter, setFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [budget, setBudget] = useState({ Food: 8000, Transport: 3000, Shopping: 5000, Utilities: 2000, Health: 3000, Entertainment: 2000, Education: 4000, Rent: 15000 });
  const [editBudget, setEditBudget] = useState(false);

  const totalIncome = useMemo(() => transactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0), [transactions]);
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0;

  const catExpenses = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "expense").forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // FIX: always spread before sort to avoid mutating read-only arrays
  const catExpensesSorted = useMemo(() => [...catExpenses].sort((a, b) => b.value - a.value), [catExpenses]);

  const predictions = useMemo(() => predictNextMonth(transactions), [transactions]);
  const anomalies = useMemo(() => detectAnomalies(transactions), [transactions]);
  const spendingByDay = useMemo(() => computeSpendingPatterns(transactions), [transactions]);
  const trend = useMemo(() => monthlyTrend(transactions), [transactions]);

  const budgetStatus = useMemo(() => {
    const spent = {};
    transactions.filter(t => t.type === "expense").forEach(t => { spent[t.category] = (spent[t.category] || 0) + t.amount; });
    return CATEGORIES.map(cat => ({
      cat, spent: spent[cat] || 0, budget: budget[cat],
      pct: Math.min(100, Math.round(((spent[cat] || 0) / budget[cat]) * 100)),
    }));
  }, [transactions, budget]);

  const filteredTxns = useMemo(() => transactions.filter(t => {
    const matchFilter = filter === "all" || t.type === filter || t.category === filter;
    const matchSearch = t.description.toLowerCase().includes(searchQ.toLowerCase()) || t.category.toLowerCase().includes(searchQ.toLowerCase());
    return matchFilter && matchSearch;
  }), [transactions, filter, searchQ]);

  const addTransaction = () => {
    if (!form.description || !form.amount) return;
    const newTxn = { ...form, id: `txn-${Date.now()}`, amount: parseFloat(form.amount) };
    setTransactions(prev => [newTxn, ...prev]);
    setForm({ description: "", amount: "", category: "Food", type: "expense", date: new Date().toISOString().split("T")[0] });
  };

  const deleteTxn = (id) => setTransactions(prev => prev.filter(t => t.id !== id));

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: "⬡" },
    { id: "transactions", label: "Transactions", icon: "⟠" },
    { id: "analytics", label: "Analytics", icon: "◈" },
    { id: "predictions", label: "Predictions", icon: "⬢" },
    { id: "budget", label: "Budget", icon: "◉" },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "#0d0f1a", color: "#e2e8f0", fontFamily: "'Outfit', sans-serif" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(180deg, #12141f 0%, #0d0f1a 100%)", borderBottom: "1px solid #1e2235", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff" }}>₹</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: "#fff", letterSpacing: -0.5 }}>FinSight Pro</div>
              <div style={{ fontSize: 11, color: "#555", fontFamily: "'Space Mono', monospace" }}>Personal Finance & Predictive Analytics</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent", border: activeTab === tab.id ? "none" : "1px solid #2d3148", color: activeTab === tab.id ? "#fff" : "#888", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", fontFamily: "'Outfit', sans-serif" }}>
                <span style={{ fontSize: 14 }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>

          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                <KPICard label="Total Income" value={formatCurrency(totalIncome)} sub="Last 90 days" color="#10b981" icon="▲" />
                <KPICard label="Total Expense" value={formatCurrency(totalExpense)} sub="Last 90 days" color="#ef4444" icon="▼" />
                <KPICard label="Net Savings" value={formatCurrency(savings)} sub={`${savingsRate}% savings rate`} color={savings >= 0 ? "#6366f1" : "#f97316"} icon="◈" />
                <KPICard label="Transactions" value={transactions.length} sub="All records" color="#f59e0b" icon="≡" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
                <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #1e2235", padding: 24 }}>
                  <SectionTitle accent="#6366f1">Income vs Expense — Monthly</SectionTitle>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                        <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
                      <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#555", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#gi)" name="Income" strokeWidth={2} />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#ge)" name="Expense" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #1e2235", padding: 24 }}>
                  <SectionTitle accent="#a855f7">Spending by Category</SectionTitle>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={catExpenses} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                        {catExpenses.map((entry) => (<Cell key={entry.name} fill={CAT_COLORS[entry.name] || "#6366f1"} />))}
                      </Pie>
                      <Tooltip formatter={(val) => formatCurrency(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {catExpenses.slice(0, 6).map(e => (
                      <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#888" }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[e.name] }} />{e.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #ef444433", padding: 24 }}>
                  <SectionTitle accent="#ef4444">Anomaly Detection</SectionTitle>
                  {anomalies.length === 0 ? (
                    <div style={{ color: "#10b981", fontSize: 14 }}>✓ No anomalies detected.</div>
                  ) : anomalies.map((a, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e2235" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#ef4444" }}>{a.category}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>Avg: {formatCurrency(a.avg)} · Z-score: {a.zscore}</div>
                      </div>
                      <Badge color="#ef4444">{formatCurrency(a.amount)}</Badge>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #1e2235", padding: 24 }}>
                  <SectionTitle accent="#f59e0b">Spending Pattern by Day</SectionTitle>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={spendingByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
                      <XAxis dataKey="day" tick={{ fill: "#555", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#555", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" name="Spending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #1e2235", padding: 24 }}>
                <SectionTitle accent="#10b981">Recent Transactions</SectionTitle>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#555", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
                      {["Date", "Description", "Category", "Type", "Amount"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #1e2235" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 8).map(t => (
                      <tr key={t.id} style={{ borderBottom: "1px solid #141625" }}>
                        <td style={{ padding: "10px 12px", color: "#666", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{formatDate(t.date)}</td>
                        <td style={{ padding: "10px 12px", color: "#ccc" }}>{t.description}</td>
                        <td style={{ padding: "10px 12px" }}><Badge color={CAT_COLORS[t.category] || "#6366f1"}>{t.category}</Badge></td>
                        <td style={{ padding: "10px 12px" }}><Badge color={t.type === "income" ? "#10b981" : "#ef4444"}>{t.type}</Badge></td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: t.type === "income" ? "#10b981" : "#ef4444", fontFamily: "'Space Mono', monospace" }}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TRANSACTIONS */}
          {activeTab === "transactions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #1e2235", padding: 24 }}>
                <SectionTitle accent="#6366f1">Add Transaction</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
                  {[{ label: "Description", key: "description", type: "text" }, { label: "Amount (₹)", key: "amount", type: "number" }, { label: "Date", key: "date", type: "date" }].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize: 11, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 6 }}>{f.label}</div>
                      <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: "100%", background: "#0d0f1a", border: "1px solid #2d3148", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: 11, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 6 }}>Category</div>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      style={{ width: "100%", background: "#0d0f1a", border: "1px solid #2d3148", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontSize: 13 }}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 6 }}>Type</div>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      style={{ width: "100%", background: "#0d0f1a", border: "1px solid #2d3148", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontSize: 13 }}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <button onClick={addTransaction} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 8, color: "#fff", padding: "9px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+ Add</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <input placeholder="Search transactions…" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  style={{ flex: 1, background: "#12141f", border: "1px solid #2d3148", borderRadius: 8, padding: "9px 14px", color: "#e2e8f0", fontSize: 13 }} />
                {["all", "income", "expense"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? "#6366f1" : "#12141f", border: "1px solid #2d3148", borderRadius: 6, color: filter === f ? "#fff" : "#888", padding: "7px 12px", cursor: "pointer", fontSize: 12, textTransform: "capitalize" }}>{f}</button>
                ))}
              </div>
              <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #1e2235", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#0d0f1a", color: "#555", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
                      {["Date", "Description", "Category", "Type", "Amount", "Action"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid #1e2235" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxns.map(t => (
                      <tr key={t.id} style={{ borderBottom: "1px solid #141625" }}>
                        <td style={{ padding: "10px 16px", color: "#666", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{formatDate(t.date)}</td>
                        <td style={{ padding: "10px 16px", color: "#ccc" }}>{t.description}</td>
                        <td style={{ padding: "10px 16px" }}><Badge color={CAT_COLORS[t.category] || "#6366f1"}>{t.category}</Badge></td>
                        <td style={{ padding: "10px 16px" }}><Badge color={t.type === "income" ? "#10b981" : "#ef4444"}>{t.type}</Badge></td>
                        <td style={{ padding: "10px 16px", fontWeight: 700, color: t.type === "income" ? "#10b981" : "#ef4444", fontFamily: "'Space Mono', monospace" }}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <button onClick={() => deleteTxn(t.id)} style={{ background: "#ef444422", border: "1px solid #ef444433", color: "#ef4444", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: "12px 16px", color: "#555", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>
                  Showing {filteredTxns.length} of {transactions.length} transactions
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === "analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #1e2235", padding: 24 }}>
                  <SectionTitle accent="#a855f7">Category-wise Spending</SectionTitle>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={catExpensesSorted} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
                      <XAxis type="number" tick={{ fill: "#555", fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#aaa", fontSize: 12 }} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Spent" radius={[0, 4, 4, 0]}>
                        {catExpensesSorted.map((entry) => <Cell key={entry.name} fill={CAT_COLORS[entry.name] || "#6366f1"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #1e2235", padding: 24 }}>
                  <SectionTitle accent="#f59e0b">Spending Radar</SectionTitle>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={catExpenses}>
                      <PolarGrid stroke="#1e2235" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fill: "#555", fontSize: 9 }} />
                      <Radar name="Spending" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                      <Tooltip formatter={(val) => formatCurrency(val)} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #1e2235", padding: 24 }}>
                  <SectionTitle accent="#10b981">Day-of-Week Spending Pattern</SectionTitle>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={spendingByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
                      <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#555", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" name="Spending" radius={[4, 4, 0, 0]}>
                        {spendingByDay.map((d, i) => <Cell key={i} fill={`hsl(${160 + i * 25}, 70%, 50%)`} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #1e2235", padding: 24 }}>
                  <SectionTitle accent="#3b82f6">Savings Trend</SectionTitle>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trend.map(m => ({ ...m, savings: m.income - m.expense }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
                      <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#555", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: "#6366f1" }} name="Savings" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #1e2235", padding: 24 }}>
                <SectionTitle accent="#f59e0b">Smart Insights</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {[
                    { icon: "📊", title: "Highest Spending Category", body: catExpensesSorted[0]?.name || "—", sub: formatCurrency(catExpensesSorted[0]?.value || 0), color: "#ef4444" },
                    { icon: "📅", title: "Peak Spending Day", body: [...spendingByDay].sort((a, b) => b.amount - a.amount)[0]?.day || "—", sub: "Most expensive day of week", color: "#f59e0b" },
                    { icon: "💰", title: "Avg. Daily Spend", body: formatCurrency(Math.round(totalExpense / 90)), sub: "Based on last 90 days", color: "#6366f1" },
                    { icon: "📈", title: "Savings Rate", body: `${savingsRate}%`, sub: savingsRate > 20 ? "✓ Healthy savings" : "⚠ Below recommended 20%", color: savingsRate > 20 ? "#10b981" : "#f97316" },
                    { icon: "🔍", title: "Anomalies Found", body: anomalies.length, sub: "Unusual spending spikes", color: anomalies.length > 0 ? "#ef4444" : "#10b981" },
                    { icon: "🎯", title: "Active Categories", body: catExpenses.length, sub: "Unique spending categories", color: "#a855f7" },
                  ].map((ins, i) => (
                    <div key={i} style={{ background: "#0d0f1a", borderRadius: 12, padding: 18, border: `1px solid ${ins.color}22` }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{ins.icon}</div>
                      <div style={{ fontSize: 11, color: "#555", fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>{ins.title}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: ins.color, fontFamily: "'Syne', sans-serif" }}>{ins.body}</div>
                      <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{ins.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PREDICTIONS */}
          {activeTab === "predictions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "linear-gradient(135deg, #1a1d2e, #12141f)", borderRadius: 16, border: "1px solid #6366f133", padding: 24 }}>
                <SectionTitle accent="#6366f1">Next Month Spending Forecast</SectionTitle>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>Using weighted moving average with trend detection across 90-day history. Predictions use a 0.3x trend dampening factor.</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                  {Object.entries(predictions).map(([cat, amt]) => {
                    const currentSpent = catExpenses.find(c => c.name === cat)?.value || 0;
                    const diff = amt - currentSpent;
                    return (
                      <div key={cat} style={{ background: "#0d0f1a", borderRadius: 12, padding: 16, border: `1px solid ${CAT_COLORS[cat] || "#6366f1"}33` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: CAT_COLORS[cat] || "#6366f1" }}>{cat}</div>
                          <div style={{ fontSize: 10, color: diff > 0 ? "#ef4444" : "#10b981" }}>{diff > 0 ? "▲" : "▼"} {Math.abs(Math.round((diff / (currentSpent || 1)) * 100))}%</div>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Syne', sans-serif" }}>{formatCurrency(amt)}</div>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>Current: {formatCurrency(currentSpent)}</div>
                        <div style={{ marginTop: 10, height: 4, background: "#1e2235", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, (amt / Math.max(...Object.values(predictions))) * 100)}%`, background: CAT_COLORS[cat] || "#6366f1", borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <SectionTitle accent="#a855f7">Predicted vs Current Spending</SectionTitle>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={Object.entries(predictions).map(([cat, pred]) => ({ cat, predicted: pred, current: catExpenses.find(c => c.name === cat)?.value || 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
                    <XAxis dataKey="cat" tick={{ fill: "#888", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#555", fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: "#888", fontSize: 12 }} />
                    <Bar dataKey="current" name="Current" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.6} />
                    <Bar dataKey="predicted" name="Predicted" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #ef444433", padding: 24 }}>
                <SectionTitle accent="#ef4444">Statistical Anomaly Report</SectionTitle>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>Transactions flagged using Z-score analysis (threshold: 2σ above category mean).</div>
                {anomalies.length === 0 ? (
                  <div style={{ color: "#10b981", fontSize: 14, padding: 20 }}>✓ No statistical anomalies detected.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {anomalies.map((a, i) => (
                      <div key={i} style={{ background: "#0d0f1a", borderRadius: 12, padding: 16, border: "1px solid #ef444422", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ef444422", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚠</div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#ef4444" }}>{a.category}</div>
                            <div style={{ fontSize: 12, color: "#555" }}>Normal avg: {formatCurrency(a.avg)} | Z-score: {a.zscore}σ</div>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444", fontFamily: "'Syne', sans-serif" }}>{formatCurrency(a.amount)}</div>
                          <div style={{ fontSize: 11, color: "#666", textAlign: "right" }}>+{Math.round(((a.amount - a.avg) / a.avg) * 100)}% above avg</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BUDGET */}
          {activeTab === "budget" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#555", fontSize: 13 }}>Set monthly budget limits per category and track your progress.</div>
                <button onClick={() => setEditBudget(e => !e)} style={{ background: editBudget ? "#10b981" : "#6366f1", border: "none", borderRadius: 8, color: "#fff", padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                  {editBudget ? "✓ Save Budgets" : "✏ Edit Budgets"}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {budgetStatus.map(({ cat, spent, budget: bud, pct }) => (
                  <div key={cat} style={{ background: "#12141f", borderRadius: 16, border: `1px solid ${pct >= 90 ? "#ef444433" : pct >= 70 ? "#f59e0b33" : "#1e2235"}`, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: CAT_COLORS[cat], fontSize: 15 }}>{cat}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>Spent {formatCurrency(spent)} of {formatCurrency(bud)}</div>
                      </div>
                      {editBudget ? (
                        <input type="number" value={bud} onChange={e => setBudget(p => ({ ...p, [cat]: parseInt(e.target.value) || 0 }))}
                          style={{ width: 100, background: "#0d0f1a", border: "1px solid #2d3148", borderRadius: 8, padding: "6px 10px", color: "#e2e8f0", fontSize: 13, textAlign: "right" }} />
                      ) : (
                        <Badge color={pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981"}>{pct}%</Badge>
                      )}
                    </div>
                    <div style={{ height: 8, background: "#1e2235", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : CAT_COLORS[cat] }} />
                    </div>
                    {pct >= 90 && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>⚠ Budget nearly exceeded!</div>}
                    {pct >= 70 && pct < 90 && <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 6 }}>⚡ Approaching limit</div>}
                    {pct < 70 && <div style={{ fontSize: 11, color: "#10b981", marginTop: 6 }}>✓ On track — {formatCurrency(bud - spent)} remaining</div>}
                  </div>
                ))}
              </div>
              <div style={{ background: "#12141f", borderRadius: 16, border: "1px solid #1e2235", padding: 24 }}>
                <SectionTitle accent="#10b981">Budget Utilization Overview</SectionTitle>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={budgetStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
                    <XAxis dataKey="cat" tick={{ fill: "#888", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#555", fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: "#888", fontSize: 12 }} />
                    <Bar dataKey="budget" name="Budget" fill="#1e2235" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name="Spent" radius={[4, 4, 0, 0]}>
                      {budgetStatus.map(({ cat, pct }) => <Cell key={cat} fill={pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid #1e2235", padding: "16px 32px", textAlign: "center", color: "#2d3148", fontSize: 11, fontFamily: "'Space Mono', monospace" }}>
          FinSight Pro — Final Year BSc CS Project · Personal Finance Manager with Predictive Analytics & Spending Pattern Detection
        </div>
      </div>
    </>
  );
}
