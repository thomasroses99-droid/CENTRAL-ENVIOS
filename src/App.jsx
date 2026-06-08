import { useState, useEffect, useCallback } from "react";

// ===================== STORAGE =====================
const stateRegistry = new Map();
let firestore = null;
let syncTimer = null;
let onFbConnected = null;

import("./firebase.js").then(fb => {
  firestore = fb;
  fb.onSnapshot(fb.doc(fb.db, "central", "main"), snap => {
    if (onFbConnected) onFbConnected(true);
    const data = snap.exists() ? snap.data() : {};
    for (const [k, setter] of stateRegistry) {
      if (data[k] !== undefined) {
        try { const p = JSON.parse(data[k]); localStorage.setItem(k, data[k]); setter(p); } catch {}
      }
    }
  }, () => { if (onFbConnected) onFbConnected(false); });
}).catch(() => { if (onFbConnected) onFbConnected(false); });

function scheduleSync() {
  if (!firestore) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    if (!firestore) return;
    const data = {};
    for (const key of stateRegistry.keys()) { const v = localStorage.getItem(key); if (v !== null) data[key] = v; }
    firestore.setDoc(firestore.doc(firestore.db, "central", "main"), data).catch(() => {});
  }, 800);
}

function lsLoad(key, fallback) {
  try { const r = localStorage.getItem(key); return r !== null ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function lsSave(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); scheduleSync(); } catch {}
}
function usePersisted(key, initial) {
  const [value, setValue] = useState(() => lsLoad(key, initial));
  const set = useCallback(v => {
    setValue(prev => { const next = typeof v === "function" ? v(prev) : v; lsSave(key, next); return next; });
  }, [key]);
  useEffect(() => { stateRegistry.set(key, setValue); return () => stateRegistry.delete(key); }, [key]);
  return [value, set];
}

// ===================== AUTH =====================
const SESSION_KEY = "ce-session";
const USUARIOS_FIJOS = [
  { email: "thomasroses99@gmail.com",      password: "Marcelo52",      isAdmin: true  },
  { email: "nicolasroses199412@gmail.com", password: "Corrientes1967", isAdmin: false },
  { email: "matiroses00@gmail.com",        password: "Evaperon8124",   isAdmin: false },
];

// ===================== HELPERS =====================
const fmt = n => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n ?? 0);
const today = () => new Date().toISOString().split("T")[0];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const CATS = ["Carnes","Panificados","Lacteos","Verduras","Salsas","Salsas base","Aceites","Especias","Guarniciones","Descartables","Packaging","Comandera","Limpieza"];
const COLORES = ["#c0392b","#2471a3","#1a7a3a","#7d3c98","#d35400","#117a65","#1a5276","#784212"];

// ===================== STYLES =====================
const S = {
  sidebar: { width: "230px", minWidth: "230px", background: "#16213e", minHeight: "100vh", display: "flex", flexDirection: "column" },
  main: { flex: 1, background: "#f4f6f9", minHeight: "100vh", overflowY: "auto" },
  localBtn: (active, color) => ({ display: "flex", alignItems: "center", gap: "10px", padding: "11px 20px", cursor: "pointer", background: active ? color + "33" : "transparent", borderLeft: active ? `3px solid ${color}` : "3px solid transparent", color: active ? "#fff" : "#9ab", fontSize: "13px", fontWeight: active ? "700" : "400", border: "none", width: "100%", textAlign: "left" }),
  dot: color => ({ width: "9px", height: "9px", borderRadius: "50%", background: color, flexShrink: 0 }),
  card: { background: "#fff", borderRadius: "10px", padding: "20px", marginBottom: "16px", boxShadow: "0 1px 4px #0001" },
  btn: (color="#1a7a3a") => ({ background: color, color: "#fff", border: "none", borderRadius: "7px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", fontWeight: "700", fontFamily: "inherit" }),
  inp: { border: "1px solid #ddd", borderRadius: "7px", padding: "7px 10px", fontSize: "13px", fontFamily: "inherit", outline: "none", background: "#fafafa" },
  tab: active => ({ padding: "9px 18px", cursor: "pointer", border: "none", background: "transparent", borderBottom: active ? "2px solid #1a7a3a" : "2px solid transparent", fontWeight: active ? "700" : "400", fontSize: "13px", fontFamily: "inherit", color: active ? "#1a7a3a" : "#666" }),
  label: { fontSize: "11px", color: "#888", marginBottom: "3px", display: "block" },
  th: { padding: "9px 12px", textAlign: "left", fontSize: "11px", color: "#666", fontWeight: "700", background: "#f8f9fa", borderBottom: "1px solid #eee" },
  td: { padding: "9px 12px", fontSize: "13px", borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" },
};

function Tag({ children, color="#1a7a3a" }) {
  return <span style={{ background: color+"22", color, fontSize: "10px", fontWeight: "700", borderRadius: "4px", padding: "2px 7px" }}>{children}</span>;
}

// ===================== RECETAS DATA =====================
const initialCookInsumos = [
  { id: 1,  nombre: "Carne",            unidad: "kg",    precio_unidad: 15100,   categoria: "Carnes" },
  { id: 2,  nombre: "Panceta",          unidad: "kg",    precio_unidad: 19154,   categoria: "Carnes" },
  { id: 3,  nombre: "Veggies",          unidad: "kg",    precio_unidad: 1170,    categoria: "Carnes" },
  { id: 4,  nombre: "Medallon pollo",   unidad: "kg",    precio_unidad: 7000,    categoria: "Carnes" },
  { id: 5,  nombre: "Cheddar",          unidad: "kg",    precio_unidad: 26138,   categoria: "Lacteos" },
  { id: 6,  nombre: "Cheddar Liquido",  unidad: "kg",    precio_unidad: 31553,   categoria: "Lacteos" },
  { id: 7,  nombre: "Crema de leche",   unidad: "kg",    precio_unidad: 2859,    categoria: "Lacteos" },
  { id: 8,  nombre: "Leche",            unidad: "kg",    precio_unidad: 1810,    categoria: "Lacteos" },
  { id: 9,  nombre: "Roquefort",        unidad: "kg",    precio_unidad: 12993,   categoria: "Lacteos" },
  { id: 10, nombre: "Casancrem",        unidad: "kg",    precio_unidad: 4752,    categoria: "Lacteos" },
  { id: 11, nombre: "Manteca",          unidad: "kg",    precio_unidad: 12417,   categoria: "Lacteos" },
  { id: 25, nombre: "Mayonesa",         unidad: "kg",    precio_unidad: 11522,   categoria: "Salsas base" },
  { id: 26, nombre: "Ketchup",          unidad: "kg",    precio_unidad: 11761,   categoria: "Salsas base" },
  { id: 27, nombre: "Barbacoa",         unidad: "kg",    precio_unidad: 12505,   categoria: "Salsas base" },
  { id: 28, nombre: "Savora",           unidad: "kg",    precio_unidad: 8528,    categoria: "Salsas base" },
  { id: 29, nombre: "Relish",           unidad: "kg",    precio_unidad: 0,       categoria: "Salsas base" },
  { id: 30, nombre: "Mostaza de Dijon", unidad: "kg",    precio_unidad: 0,       categoria: "Salsas base" },
  { id: 31, nombre: "Mostaza",          unidad: "kg",    precio_unidad: 0,       categoria: "Salsas base" },
  { id: 32, nombre: "Salsa Inglesa",    unidad: "kg",    precio_unidad: 0,       categoria: "Salsas base" },
  { id: 23, nombre: "Aceite Girasol",   unidad: "litro", precio_unidad: 3052,    categoria: "Aceites" },
  { id: 24, nombre: "Aceite Oliva",     unidad: "litro", precio_unidad: 4600,    categoria: "Aceites" },
  { id: 12, nombre: "Ajo en Polvo",     unidad: "kg",    precio_unidad: 16438,   categoria: "Especias" },
  { id: 13, nombre: "Pimenton",         unidad: "kg",    precio_unidad: 16325,   categoria: "Especias" },
  { id: 14, nombre: "Sal",              unidad: "kg",    precio_unidad: 1796,    categoria: "Especias" },
  { id: 15, nombre: "Azucar",           unidad: "kg",    precio_unidad: 1384,    categoria: "Especias" },
  { id: 16, nombre: "Humo Liquido",     unidad: "litro", precio_unidad: 21172,   categoria: "Especias" },
  { id: 17, nombre: "Alicante",         unidad: "kg",    precio_unidad: 3107,    categoria: "Especias" },
  { id: 18, nombre: "Miel",             unidad: "kg",    precio_unidad: 6425,    categoria: "Especias" },
  { id: 19, nombre: "Vinagre",          unidad: "litro", precio_unidad: 1008,    categoria: "Especias" },
  { id: 20, nombre: "Pepinos",          unidad: "kg",    precio_unidad: 19405,   categoria: "Especias" },
  { id: 21, nombre: "Minerva",          unidad: "litro", precio_unidad: 2551,    categoria: "Especias" },
  { id: 37, nombre: "Cebolla",          unidad: "kg",    precio_unidad: 18000,   categoria: "Especias" },
  { id: 39, nombre: "Perejil",          unidad: "kg",    precio_unidad: 0,       categoria: "Especias" },
  { id: 40, nombre: "Ciboulette",       unidad: "kg",    precio_unidad: 0,       categoria: "Especias" },
  { id: 41, nombre: "Ajo picado",       unidad: "kg",    precio_unidad: 0,       categoria: "Especias" },
  { id: 42, nombre: "Aji Molido",       unidad: "kg",    precio_unidad: 0,       categoria: "Especias" },
  { id: 43, nombre: "Jugo de limon",    unidad: "kg",    precio_unidad: 0,       categoria: "Especias" },
  { id: 44, nombre: "Cebolla picada",   unidad: "kg",    precio_unidad: 18000,   categoria: "Especias" },
  { id: 45, nombre: "Pimienta",         unidad: "kg",    precio_unidad: 0,       categoria: "Especias" },
];

const initialSalsasData = [
  { id:1,  nombre:"Salsa Stacker",          rendTipo:"peso", rendCantidad:1, ingredientes:[{insumo_id:25,cantidad:0.300},{insumo_id:26,cantidad:0.030},{insumo_id:29,cantidad:0.040},{insumo_id:19,cantidad:0.040},{insumo_id:15,cantidad:0.005},{insumo_id:13,cantidad:0.005},{insumo_id:45,cantidad:0.0005},{insumo_id:17,cantidad:0.003},{insumo_id:16,cantidad:0.005}] },
  { id:2,  nombre:"Salsa Cheese",           rendTipo:"peso", rendCantidad:1, ingredientes:[{insumo_id:8,cantidad:0.100},{insumo_id:30,cantidad:0.010},{insumo_id:26,cantidad:0.010},{insumo_id:11,cantidad:0.100},{insumo_id:23,cantidad:0.100},{insumo_id:14,cantidad:0.001},{insumo_id:12,cantidad:0.001},{insumo_id:45,cantidad:0.0005},{insumo_id:17,cantidad:0.003},{insumo_id:19,cantidad:0.015}] },
  { id:3,  nombre:"Salsa Classic",          rendTipo:"peso", rendCantidad:1, ingredientes:[{insumo_id:7,cantidad:0.100},{insumo_id:25,cantidad:0.200},{insumo_id:19,cantidad:0.020},{insumo_id:30,cantidad:0.005},{insumo_id:18,cantidad:0.015},{insumo_id:45,cantidad:0.0005},{insumo_id:14,cantidad:0.001},{insumo_id:13,cantidad:0.001},{insumo_id:17,cantidad:0.003}] },
  { id:4,  nombre:"Salsa Cowboy",           rendTipo:"peso", rendCantidad:1, ingredientes:[{insumo_id:11,cantidad:0.240},{insumo_id:39,cantidad:0.010},{insumo_id:40,cantidad:0.010},{insumo_id:41,cantidad:0.006},{insumo_id:19,cantidad:0.030},{insumo_id:13,cantidad:0.005},{insumo_id:45,cantidad:0.001},{insumo_id:42,cantidad:0.005},{insumo_id:32,cantidad:0.015},{insumo_id:30,cantidad:0.010},{insumo_id:10,cantidad:0.200},{insumo_id:18,cantidad:0.010},{insumo_id:23,cantidad:0.100},{insumo_id:8,cantidad:0.050}] },
  { id:5,  nombre:"Salsa Smokey",           rendTipo:"peso", rendCantidad:1, ingredientes:[{insumo_id:27,cantidad:0.240},{insumo_id:18,cantidad:0.080},{insumo_id:12,cantidad:0.005},{insumo_id:16,cantidad:0.005},{insumo_id:45,cantidad:0.005},{insumo_id:13,cantidad:0.005}] },
  { id:6,  nombre:"Salsa 1967",             rendTipo:"peso", rendCantidad:1, ingredientes:[{insumo_id:25,cantidad:0.480},{insumo_id:31,cantidad:0.030},{insumo_id:26,cantidad:0.120},{insumo_id:15,cantidad:0.030},{insumo_id:19,cantidad:0.030},{insumo_id:29,cantidad:0.045}] },
  { id:7,  nombre:"Salsa Cheesebacon",      rendTipo:"peso", rendCantidad:1, ingredientes:[{insumo_id:10,cantidad:0.300},{insumo_id:2,cantidad:0.200},{insumo_id:8,cantidad:0.150},{insumo_id:30,cantidad:0.015},{insumo_id:19,cantidad:0.015},{insumo_id:45,cantidad:0.0005},{insumo_id:17,cantidad:0.003},{insumo_id:18,cantidad:0.010},{insumo_id:16,cantidad:0.002},{insumo_id:40,cantidad:0.015}] },
  { id:8,  nombre:"Salsa Ruby y Crispy Garlic", rendTipo:"peso", rendCantidad:1, ingredientes:[{insumo_id:10,cantidad:0.200},{insumo_id:8,cantidad:0.199},{insumo_id:19,cantidad:0.015},{insumo_id:30,cantidad:0.015},{insumo_id:14,cantidad:0.001},{insumo_id:45,cantidad:0.0005},{insumo_id:41,cantidad:0.005},{insumo_id:17,cantidad:0.003}] },
  { id:9,  nombre:"Salsa Blue",             rendTipo:"peso", rendCantidad:1, ingredientes:[{insumo_id:25,cantidad:0.240},{insumo_id:30,cantidad:0.060},{insumo_id:31,cantidad:0.060},{insumo_id:18,cantidad:0.120},{insumo_id:45,cantidad:0.0005},{insumo_id:42,cantidad:0.003},{insumo_id:12,cantidad:0.001},{insumo_id:17,cantidad:0.003}] },
  { id:10, nombre:"Salsa Biggie",           rendTipo:"peso", rendCantidad:1, ingredientes:[{insumo_id:25,cantidad:0.520},{insumo_id:30,cantidad:0.045},{insumo_id:12,cantidad:0.001},{insumo_id:44,cantidad:0.015},{insumo_id:45,cantidad:0.0005},{insumo_id:13,cantidad:0.001},{insumo_id:17,cantidad:0.003},{insumo_id:43,cantidad:0.015}] },
  { id:11, nombre:"Cebolla crispy",         rendTipo:"peso", rendCantidad:1, ingredientes:[{insumo_id:37,cantidad:0.5},{insumo_id:23,cantidad:0.5},{insumo_id:14,cantidad:0.005},{insumo_id:45,cantidad:0.002}] },
  { id:12, nombre:"Cebolla caramelizada",   rendTipo:"peso", rendCantidad:1, ingredientes:[{insumo_id:37,cantidad:0.5},{insumo_id:11,cantidad:0.05},{insumo_id:15,cantidad:0.03},{insumo_id:14,cantidad:0.003}] },
];

function calcPesoTotalSalsa(salsa) {
  return (salsa?.ingredientes || []).reduce((s, ing) => s + ing.cantidad, 0);
}
function calcCostoSalsa(salsa, insumos) {
  const total = (salsa?.ingredientes || []).reduce((s, ing) => {
    const ins = insumos.find(i => i.id === ing.insumo_id);
    return s + (ins ? ins.precio_unidad * ing.cantidad : 0);
  }, 0);
  if (salsa?.rendTipo === "unidad") return total / (salsa.rendCantidad || 1);
  const kg = calcPesoTotalSalsa(salsa);
  return kg > 0 ? total / kg : 0;
}

function calcConsumoEnvios(allEnvios) {
  const consumo = {};
  for (const lista of Object.values(allEnvios || {})) {
    for (const envio of lista) {
      for (const item of (envio.items || [])) {
        const id = Number(item.insumo_id);
        consumo[id] = (consumo[id] || 0) + (Number(item.cantidad) || 0);
      }
    }
  }
  return consumo;
}

function calcConsumoProduccion(produccion, salsas) {
  const consumo = {};
  for (const p of (produccion || [])) {
    if (p.tipo === "despacho") continue;
    const salsa = salsas.find(s => s.id === p.salsa_id);
    if (!salsa) continue;
    const factor = salsa.rendTipo === "unidad"
      ? p.cantidadKg / (salsa.rendCantidad || 1)
      : (() => { const kg = calcPesoTotalSalsa(salsa); return kg > 0 ? p.cantidadKg / kg : 0; })();
    for (const ing of (salsa.ingredientes || [])) {
      consumo[ing.insumo_id] = (consumo[ing.insumo_id] || 0) + ing.cantidad * factor;
    }
  }
  return consumo;
}

function calcConsumoMedallon(produccionMedallon) {
  const total = (produccionMedallon||[]).filter(p => p.tipo !== "despacho").reduce((s, p) => s + (p.carneKg || 0), 0);
  return total > 0 ? { 1: total } : {};
}

const fmt2 = n => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

// ── Estilos zona-sur para sección Recetas ──
function useMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
}
const RIS = { background: "#f4faf4", border: "1px solid #c8e6c9", borderRadius: "6px", color: "#1a2e1a", padding: "7px 9px", fontFamily: "'DM Mono', monospace", fontSize: "12px", outline: "none", boxSizing: "border-box" };
const RCard = ({ children, style = {} }) => <div style={{ background: "#ffffff", border: "1px solid #d4e8d0", borderRadius: "11px", padding: "18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }}>{children}</div>;
function RStatBox({ label, value, accent }) {
  const c = accent ? "#1a7a3a" : "#1a2e1a";
  return (
    <div style={{ background: accent ? "#e8f5e9" : "#f4faf4", border: `1px solid ${accent ? "#a5d6a7" : "#c8e6c9"}`, borderRadius: "9px", padding: "13px 16px" }}>
      <div style={{ color: "#5a7a5a", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: c, fontSize: "19px", fontWeight: "700", fontFamily: "'DM Mono', monospace" }}>{value}</div>
    </div>
  );
}
const RBtn = ({ onClick, children, style = {}, variant = "primary" }) => (
  <button onClick={onClick} style={{ background: variant === "primary" ? "#2e7d32" : "#e8f5e9", color: variant === "primary" ? "#fff" : "#2e7d32", border: variant === "primary" ? "none" : "1px solid #a5d6a7", borderRadius: "6px", padding: "7px 13px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", fontWeight: "700", ...style }}>{children}</button>
);
const RX = ({ onClick }) => <button onClick={onClick} style={{ background: "none", border: "none", color: "#c8a0a0", cursor: "pointer", fontSize: "15px", padding: "2px 5px", lineHeight: 1 }}>✕</button>;
const RH = ({ title }) => <div style={{ display: "flex", alignItems: "center", marginBottom: "13px" }}><span style={{ color: "#1a3a1a", fontSize: "13px", fontWeight: "700", fontFamily: "'DM Mono', monospace" }}>{title}</span></div>;

// ===================== INSUMOS =====================
function InsumosTab({ insumos, setInsumos }) {
  const [form, setForm] = useState({ nombre: "", unidad: "kg", precio_unidad: "", categoria: "Carnes" });
  const byCat = CATS.map(cat => ({ cat, items: insumos.filter(i => i.categoria === cat) })).filter(g => g.items.length > 0);
  const add = () => {
    if (!form.nombre || !form.precio_unidad) return;
    setInsumos([...insumos, { id: uid(), ...form, precio_unidad: Number(form.precio_unidad) }]);
    setForm({ ...form, nombre: "", precio_unidad: "" });
  };
  const upd = (id, f, v) => setInsumos(insumos.map(i => i.id !== id ? i : { ...i, [f]: f === "precio_unidad" ? Number(v) : v }));
  const del = id => setInsumos(insumos.filter(i => i.id !== id));

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <h2 style={{ margin: "0 0 20px", color: "#1a2e1a" }}>Insumos y precios</h2>
      <div style={S.card}>
        <div style={{ fontWeight: "700", marginBottom: "12px", fontSize: "13px" }}>Agregar insumo</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input placeholder="Nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} style={{...S.inp, flex:"1 1 150px"}} />
          <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} style={S.inp}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
          <select value={form.unidad} onChange={e => setForm({...form, unidad: e.target.value})} style={{...S.inp, width:"80px"}}>{["kg","litro","unidad","gr"].map(u=><option key={u}>{u}</option>)}</select>
          <input type="number" placeholder="Precio" value={form.precio_unidad} onChange={e => setForm({...form, precio_unidad: e.target.value})} style={{...S.inp, width:"130px"}} />
          <button onClick={add} style={S.btn()}>+ Agregar</button>
        </div>
      </div>
      {byCat.map(({cat, items}) => (
        <div key={cat} style={S.card}>
          <div style={{ fontWeight:"700", fontSize:"13px", marginBottom:"10px", color:"#1a7a3a" }}>{cat}</div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr><th style={S.th}>Nombre</th><th style={S.th}>Unidad</th><th style={S.th}>Precio / unidad</th><th style={S.th}></th></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id}>
                  <td style={S.td}><input value={i.nombre} onChange={e=>upd(i.id,"nombre",e.target.value)} style={{...S.inp, width:"100%"}} /></td>
                  <td style={S.td}><select value={i.unidad} onChange={e=>upd(i.id,"unidad",e.target.value)} style={S.inp}>{["kg","litro","unidad","gr"].map(u=><option key={u}>{u}</option>)}</select></td>
                  <td style={S.td}><input type="number" value={i.precio_unidad} onChange={e=>upd(i.id,"precio_unidad",e.target.value)} style={{...S.inp, width:"130px"}} /></td>
                  <td style={S.td}><button onClick={()=>del(i.id)} style={{background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:"16px"}}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {insumos.length === 0 && <div style={{...S.card, color:"#888", textAlign:"center"}}>No hay insumos cargados todavía.</div>}
    </div>
  );
}

// ===================== SALSAS / RECETAS =====================
function SalsasTab({ salsas, setSalsas, cookInsumos }) {
  const isMobile = useMobile();
  const [sel, setSel] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [nf, setNf] = useState({ nombre: "" });
  const [ni, setNi] = useState({ insumo_id: cookInsumos[0]?.id || "", cantidad: "" });

  const salsa = salsas[sel];
  const esPorUnidad = salsa?.rendTipo === "unidad";
  const costoReceta = salsa ? salsa.ingredientes.reduce((s, ing) => { const ins = cookInsumos.find(i => i.id === ing.insumo_id); return s + (ins ? ins.precio_unidad * ing.cantidad : 0); }, 0) : 0;
  const pesoTotalKg = salsa ? calcPesoTotalSalsa(salsa) : 0;
  const pesoTotalGr = pesoTotalKg * 1000;
  const costoPorBase = salsa ? calcCostoSalsa(salsa, cookInsumos) : 0;
  const costoPorGr = !esPorUnidad ? costoPorBase / 1000 : 0;

  const addS = () => { if (!nf.nombre) return; setSalsas([...salsas, { id: Date.now(), nombre: nf.nombre, rendTipo: "peso", rendCantidad: 1, ingredientes: [] }]); setSel(salsas.length); setShowNew(false); setNf({ nombre: "" }); };
  const delS = i => { if (salsas.length <= 1) return; setSalsas(salsas.filter((_, ii) => ii !== i)); setSel(Math.max(0, i - 1)); };
  const updS = (f, v) => setSalsas(salsas.map((s, i) => i !== sel ? s : { ...s, [f]: v }));
  const addI = () => { if (!ni.insumo_id || !ni.cantidad) return; setSalsas(salsas.map((s, i) => i !== sel ? s : { ...s, ingredientes: [...s.ingredientes, { insumo_id: Number(ni.insumo_id), cantidad: Number(ni.cantidad) }] })); setNi({ insumo_id: cookInsumos[0]?.id || "", cantidad: "" }); };
  const delI = idx => setSalsas(salsas.map((s, i) => i !== sel ? s : { ...s, ingredientes: s.ingredientes.filter((_, ii) => ii !== idx) }));
  const updI = (idx, f, v) => setSalsas(salsas.map((s, i) => i !== sel ? s : { ...s, ingredientes: s.ingredientes.map((ing, ii) => ii !== idx ? ing : { ...ing, [f]: Number(v) }) }));

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "14px", padding: "20px" }}>
      {/* Lista de recetas */}
      <div style={{ ...(isMobile ? { width: "100%" } : { width: "190px", flexShrink: 0, maxHeight: "calc(100vh - 180px)" }), display: "flex", flexDirection: "column" }}>
        <div style={{ color: "#222", fontSize: "10px", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", marginBottom: "7px", letterSpacing: "0.1em" }}>Recetas</div>
        <div style={{ ...(isMobile ? { display: "flex", flexDirection: "row", overflowX: "auto", gap: "6px", paddingBottom: "6px" } : { overflowY: "auto", flex: 1, paddingRight: "2px" }) }}>
          {salsas.map((s, i) => (
            <div key={s.id} style={{ display: "flex", gap: "4px", marginBottom: isMobile ? 0 : "4px", flexShrink: 0 }}>
              <button onClick={() => setSel(i)} style={{ flex: 1, background: sel===i ? "#1a7a3a" : "#d4edd9", color: sel===i ? "#d4edd9" : "#aaa", border: `1px solid ${sel===i ? "#1a7a3a" : "#222"}`, borderRadius: "7px", padding: "8px 11px", textAlign: "left", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "11px", fontWeight: sel===i ? "700" : "400", whiteSpace: "nowrap" }}>🧪 {s.nombre}</button>
              {salsas.length > 1 && <RX onClick={() => delS(i)} />}
            </div>
          ))}
        </div>
        {showNew ? (
          <RCard style={{ padding: "11px", marginTop: "5px" }}>
            <input placeholder="Nombre" value={nf.nombre} onChange={e => setNf({ ...nf, nombre: e.target.value })} style={{ ...RIS, width: "100%", marginBottom: "5px" }} onKeyDown={e => e.key==="Enter" && addS()} />
            <div style={{ display: "flex", gap: "5px" }}><RBtn onClick={addS} style={{ flex: 1 }}>Crear</RBtn><RBtn onClick={() => setShowNew(false)} variant="ghost" style={{ flex: 1 }}>✕</RBtn></div>
          </RCard>
        ) : (
          <button onClick={() => setShowNew(true)} style={{ width: "100%", background: "transparent", color: "#222", border: "1px dashed #a0c0a0", borderRadius: "7px", padding: "8px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", marginTop: "4px" }}>+ Nueva receta</button>
        )}
      </div>

      {/* Detalle de la receta */}
      {salsa && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "11px", minWidth: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "9px" }}>
            <RStatBox label="Costo total receta" value={fmt(costoReceta)} />
            {esPorUnidad ? <RStatBox label="Rinde (unidades)" value={salsa.rendCantidad || 1} /> : <RStatBox label="Peso total" value={`${Math.round(pesoTotalGr)} gr`} />}
            {esPorUnidad ? <RStatBox label="Costo por unidad" value={fmt(costoPorBase)} accent /> : <RStatBox label="Costo por kg" value={fmt(costoPorBase)} />}
            {esPorUnidad ? <RStatBox label="Tipo" value="Por unidad" accent /> : <RStatBox label="Costo por gr" value={`$${costoPorGr.toFixed(2)}`} accent />}
          </div>

          <RCard>
            <div style={{ display: "flex", gap: "11px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ color: "#5a8a6e", fontSize: "10px", fontFamily: "'DM Mono', monospace", marginBottom: "4px" }}>NOMBRE</div>
                <input value={salsa.nombre} onChange={e => updS("nombre", e.target.value)} style={{ ...RIS, width: "100%" }} />
              </div>
              <div style={{ width: 160 }}>
                <div style={{ color: "#5a8a6e", fontSize: "10px", fontFamily: "'DM Mono', monospace", marginBottom: "4px" }}>TIPO DE RENDIMIENTO</div>
                <div style={{ display: "flex", gap: "5px" }}>
                  {["peso", "unidad"].map(t => (
                    <button key={t} onClick={() => updS("rendTipo", t)} style={{ flex: 1, padding: "7px 6px", borderRadius: "6px", border: "none", background: (salsa.rendTipo||"peso")===t ? "#2e7d32" : "#e8f5e9", color: (salsa.rendTipo||"peso")===t ? "#fff" : "#2e7d32", fontFamily: "'DM Mono', monospace", fontSize: "10px", fontWeight: "700", cursor: "pointer", textTransform: "uppercase" }}>{t}</button>
                  ))}
                </div>
              </div>
              {esPorUnidad && (
                <div style={{ width: 130 }}>
                  <div style={{ color: "#5a8a6e", fontSize: "10px", fontFamily: "'DM Mono', monospace", marginBottom: "4px" }}>RINDE (unidades)</div>
                  <input type="number" min="1" value={salsa.rendCantidad || 1} onChange={e => updS("rendCantidad", Number(e.target.value))} style={{ ...RIS, width: "100%" }} />
                </div>
              )}
              {!esPorUnidad && (
                <div style={{ width: 200 }}>
                  <div style={{ color: "#5a8a6e", fontSize: "10px", fontFamily: "'DM Mono', monospace", marginBottom: "4px" }}>PESO TOTAL: {Math.round(pesoTotalGr)}gr — ${costoPorGr.toFixed(2)}/gr</div>
                  <div style={{ ...RIS, width: "100%", color: "#1a7a3a", fontWeight: "700", padding: "7px 9px" }}>{fmt(costoPorBase)} por kg</div>
                </div>
              )}
            </div>
          </RCard>

          <RCard>
            <RH title="Ingredientes de la salsa" />
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 80px auto", gap: "7px", padding: "3px 0 7px", borderBottom: "1px solid #d4edd9", minWidth: 380 }}>
                {["Insumo", "Unidad", "Cantidad", "Costo", ""].map((h, i) => <div key={i} style={{ color: "#1a5c2a", fontSize: "10px", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>{h}</div>)}
              </div>
              {salsa.ingredientes.map((ing, idx) => {
                const ins = cookInsumos.find(i => i.id === ing.insumo_id);
                return (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 80px auto", gap: "7px", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e0f0e6", minWidth: 380 }}>
                    <select value={ing.insumo_id} onChange={e => updI(idx, "insumo_id", e.target.value)} style={{ ...RIS, fontSize: "11px" }}>{cookInsumos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}</select>
                    <span style={{ color: "#222", fontSize: "11px", fontFamily: "'DM Mono', monospace" }}>{ins?.unidad || "-"}</span>
                    <input type="number" step="0.001" value={ing.cantidad} onChange={e => updI(idx, "cantidad", e.target.value)} style={{ ...RIS, fontSize: "12px" }} />
                    <span style={{ color: "#1a7a3a", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}>{fmt2(ins ? ins.precio_unidad * ing.cantidad : 0)}</span>
                    <RX onClick={() => delI(idx)} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "7px", marginTop: "9px", padding: "9px", background: "#f0faf4", borderRadius: "7px", flexWrap: "wrap" }}>
              <select value={ni.insumo_id} onChange={e => setNi({ ...ni, insumo_id: e.target.value })} style={{ ...RIS, flex: "1 1 140px" }}>{cookInsumos.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>)}</select>
              <input type="number" step="0.001" placeholder="Cantidad" value={ni.cantidad} onChange={e => setNi({ ...ni, cantidad: e.target.value })} style={{ ...RIS, width: "95px" }} />
              <RBtn onClick={addI}>+ Agregar</RBtn>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0 0", marginTop: "5px", borderTop: "2px solid #b8dfc4" }}>
              <span style={{ color: "#222", fontFamily: "'DM Mono', monospace", fontSize: "11px" }}>TOTAL RECETA</span>
              <span style={{ color: "#cc4400", fontFamily: "'DM Mono', monospace", fontSize: "14px", fontWeight: "700" }}>{fmt(costoReceta)}</span>
            </div>
          </RCard>
        </div>
      )}
    </div>
  );
}

// ===================== PRODUCCION =====================
function ProduccionTab({ salsas, cookInsumos, produccion, setProduccion, locales }) {
  const [selSalsa, setSelSalsa] = useState(salsas[0]?.id || "");
  const [cantGr, setCantGr] = useState("");
  const [fecha, setFecha] = useState(today());
  const [nota, setNota] = useState("");
  const [despSelSalsa, setDespSelSalsa] = useState(salsas[0]?.id || "");
  const [despCant, setDespCant] = useState("");
  const [despLocal, setDespLocal] = useState(locales[0]?.id || "");
  const [despFecha, setDespFecha] = useState(today());
  const [despNota, setDespNota] = useState("");
  const [histExpanded, setHistExpanded] = useState(false);

  const fmtFecha = iso => { try { const [y,m,d] = iso.split("-"); return `${d}/${m}/${y}`; } catch { return iso; } };
  const fmtGr = kg => { const gr = Math.round(kg * 1000); return gr >= 1000 ? `${(gr/1000).toFixed(2)} kg` : `${gr} gr`; };

  const stockPorReceta = salsas.map(s => {
    const producidoKg = (produccion||[]).filter(p => p.salsa_id===s.id && p.tipo!=="despacho").reduce((a,p) => a+p.cantidadKg, 0);
    const despachado  = (produccion||[]).filter(p => p.salsa_id===s.id && p.tipo==="despacho").reduce((a,p) => a+p.cantidadKg, 0);
    const actualKg = producidoKg - despachado;
    const esPorUnidad = s.rendTipo === "unidad";
    const color = producidoKg===0 && despachado===0 ? "#aaa" : actualKg < 0 ? "#c0392b" : actualKg < (esPorUnidad ? 2 : 0.2) ? "#e67e22" : "#1a7a3a";
    return { ...s, producidoKg, despachado, actualKg, color, esPorUnidad };
  });

  const salsaSel = salsas.find(s => s.id === Number(selSalsa));
  const esPorUnidad = salsaSel?.rendTipo === "unidad";

  const registrar = () => {
    if (!selSalsa || !cantGr || Number(cantGr) <= 0) return;
    setProduccion(prev => [{ id: Date.now(), fecha, salsa_id: Number(selSalsa), tipo: "produccion", cantidadKg: esPorUnidad ? Number(cantGr) : Number(cantGr)/1000, nota: nota.trim() }, ...(prev||[])]);
    setCantGr(""); setNota("");
  };

  const despSalsaSel = salsas.find(s => s.id === Number(despSelSalsa));
  const despEsPorUnidad = despSalsaSel?.rendTipo === "unidad";

  const despachar = () => {
    if (!despSelSalsa || !despCant || Number(despCant) <= 0 || !despLocal) return;
    const local = locales.find(l => l.id === despLocal);
    setProduccion(prev => [{ id: Date.now(), fecha: despFecha, salsa_id: Number(despSelSalsa), tipo: "despacho", cantidadKg: despEsPorUnidad ? Number(despCant) : Number(despCant)/1000, local_id: despLocal, local_nombre: local?.nombre || "", nota: despNota.trim() }, ...(prev||[])]);
    setDespCant(""); setDespNota("");
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <h2 style={{ margin: "0 0 20px", color: "#1a2e1a" }}>Producción de recetas</h2>

      <div style={S.card}>
        <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "12px" }}>Stock actual por receta</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Receta","Producido","Despachado","Stock actual"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {stockPorReceta.map((s, i) => (
              <tr key={s.id} style={{ background: i%2===0?"#fafafa":"#fff" }}>
                <td style={S.td}>🧪 {s.nombre}</td>
                <td style={{ ...S.td, color: s.producidoKg>0?"#1a7a3a":"#bbb", fontWeight:"700" }}>
                  {s.producidoKg > 0 ? (s.esPorUnidad ? `${Math.round(s.producidoKg)} u` : fmtGr(s.producidoKg)) : "—"}
                </td>
                <td style={{ ...S.td, color: s.despachado>0?"#c0392b":"#bbb" }}>
                  {s.despachado > 0 ? (s.esPorUnidad ? `${Math.round(s.despachado)} u` : fmtGr(s.despachado)) : "—"}
                </td>
                <td style={{ ...S.td, fontWeight:"700", color: s.color }}>
                  {s.producidoKg===0&&s.despachado===0 ? "—" : s.esPorUnidad ? `${Math.round(s.actualKg)} u` : fmtGr(s.actualKg)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={S.card}>
        <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "12px" }}>+ Registrar producción</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><label style={S.label}>Fecha</label><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={S.inp} /></div>
          <div style={{ flex:"1 1 160px" }}><label style={S.label}>Receta</label><select value={selSalsa} onChange={e=>setSelSalsa(e.target.value)} style={{...S.inp,width:"100%"}}>{salsas.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
          <div><label style={S.label}>{esPorUnidad?"Unidades producidas":"Gramos producidos"}</label><input type="number" min="1" placeholder={esPorUnidad?"10":"500"} value={cantGr} onChange={e=>setCantGr(e.target.value)} style={{...S.inp,width:"130px"}} /></div>
          <div style={{ flex:"2 1 160px" }}><label style={S.label}>Nota (opcional)</label><input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Ej: producción del día" style={{...S.inp,width:"100%"}} /></div>
          <button onClick={registrar} style={S.btn()}>+ Registrar</button>
        </div>
      </div>

      <div style={{ ...S.card, borderLeft: "4px solid #e67e22" }}>
        <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "12px", color: "#e67e22" }}>📦 Despachar a local</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><label style={S.label}>Fecha</label><input type="date" value={despFecha} onChange={e=>setDespFecha(e.target.value)} style={S.inp} /></div>
          <div style={{ flex:"1 1 140px" }}><label style={S.label}>Receta</label><select value={despSelSalsa} onChange={e=>setDespSelSalsa(e.target.value)} style={{...S.inp,width:"100%"}}>{salsas.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
          <div style={{ flex:"1 1 130px" }}><label style={S.label}>Local destino</label><select value={despLocal} onChange={e=>setDespLocal(e.target.value)} style={{...S.inp,width:"100%"}}>{locales.map(l=><option key={l.id} value={l.id}>{l.nombre}</option>)}</select></div>
          <div><label style={S.label}>{despEsPorUnidad?"Unidades":"Gramos"}</label><input type="number" min="1" placeholder={despEsPorUnidad?"10":"500"} value={despCant} onChange={e=>setDespCant(e.target.value)} style={{...S.inp,width:"110px"}} /></div>
          <div style={{ flex:"2 1 130px" }}><label style={S.label}>Nota (opcional)</label><input value={despNota} onChange={e=>setDespNota(e.target.value)} placeholder="Ej: semana 12" style={{...S.inp,width:"100%"}} /></div>
          <button onClick={despachar} style={S.btn("#e67e22")}>📦 Despachar</button>
        </div>
        {locales.length === 0 && <div style={{ marginTop: "10px", fontSize: "12px", color: "#e67e22" }}>⚠ Agregá locales primero en "Locales".</div>}
      </div>

      {(produccion||[]).length > 0 && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setHistExpanded(v=>!v)}>
            <div style={{ fontWeight: "700", fontSize: "13px" }}>Historial ({(produccion||[]).length})</div>
            <span style={{ fontSize: "12px", color: "#888" }}>{histExpanded ? "▲ Ocultar" : "▼ Ver"}</span>
          </div>
          {histExpanded && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {(produccion||[]).slice(0,60).map(p => {
                const salsa = salsas.find(s => s.id === p.salsa_id);
                const esDespacho = p.tipo === "despacho";
                const porUnidad = salsa?.rendTipo === "unidad";
                const cantDisplay = porUnidad ? `${Math.round(p.cantidadKg)} u` : fmtGr(p.cantidadKg);
                return (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: "7px", background: esDespacho?"#fff8f0":"#f0faf4", borderLeft: `3px solid ${esDespacho?"#e67e22":"#27ae60"}` }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "700", fontSize: "12px" }}>{fmtFecha(p.fecha)}</span>
                      <span style={{ fontSize: "12px" }}>🧪 {salsa?.nombre || "?"}</span>
                      {esDespacho && <Tag color="#e67e22">→ {p.local_nombre}</Tag>}
                      {p.nota && <span style={{ fontSize: "11px", color: "#888" }}>{p.nota}</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: "700", fontSize: "12px", color: esDespacho?"#e67e22":"#1a7a3a" }}>{esDespacho?"-":"+"}{cantDisplay}</span>
                      <button onClick={() => { if(confirm("¿Eliminar?")) setProduccion(prev=>prev.filter(x=>x.id!==p.id)); }} style={{ background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:"14px",padding:"0 4px" }}>×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===================== COSTOS FIJOS =====================
const CATS_CF = ["Impuestos","Personal","Servicios","Seguros","Inmueble","Financiero","Otro"];

function CostosFijosTab({ costosFijos, setCostosFijos }) {
  const [form, setForm] = useState({ nombre: "", monto: "", categoria: "Servicios" });

  const add = () => {
    if (!form.nombre || !form.monto) return;
    setCostosFijos([...costosFijos, { id: uid(), nombre: form.nombre.trim(), monto: Number(form.monto), categoria: form.categoria }]);
    setForm({ ...form, nombre: "", monto: "" });
  };
  const upd = (id, f, v) => setCostosFijos(costosFijos.map(c => c.id !== id ? c : { ...c, [f]: f === "monto" ? Number(v) : v }));
  const del = id => { if (confirm("¿Eliminar este costo?")) setCostosFijos(costosFijos.filter(c => c.id !== id)); };

  const byCat = CATS_CF.map(cat => ({ cat, items: costosFijos.filter(c => c.categoria === cat) })).filter(g => g.items.length > 0);
  const total = costosFijos.reduce((s, c) => s + c.monto, 0);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <h2 style={{ margin: "0 0 20px", color: "#1a2e1a" }}>Costos fijos</h2>

      <div style={{ ...S.card, background: "#1a2e1a", color: "#fff", marginBottom: "20px" }}>
        <div style={{ fontSize: "11px", opacity: 0.6, marginBottom: "4px" }}>TOTAL MENSUAL</div>
        <div style={{ fontSize: "28px", fontWeight: "700" }}>{fmt(total)}</div>
        <div style={{ fontSize: "11px", opacity: 0.5, marginTop: "4px" }}>{costosFijos.length} ítems en {byCat.length} categorías</div>
      </div>

      <div style={S.card}>
        <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "12px" }}>Agregar costo fijo</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input placeholder="Nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} style={{...S.inp, flex: "1 1 160px"}} onKeyDown={e => e.key==="Enter" && add()} />
          <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} style={S.inp}>
            {CATS_CF.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="number" placeholder="Monto $" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} style={{...S.inp, width: "140px"}} />
          <button onClick={add} style={S.btn()}>+ Agregar</button>
        </div>
      </div>

      {byCat.map(({ cat, items }) => {
        const subtotal = items.reduce((s, c) => s + c.monto, 0);
        return (
          <div key={cat} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontWeight: "700", fontSize: "13px", color: "#1a7a3a" }}>{cat}</div>
              <div style={{ fontWeight: "700", fontSize: "13px" }}>{fmt(subtotal)}</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={S.th}>Nombre</th><th style={S.th}>Categoría</th><th style={S.th}>Monto</th><th style={S.th}></th></tr></thead>
              <tbody>
                {items.map(c => (
                  <tr key={c.id}>
                    <td style={S.td}><input value={c.nombre} onChange={e => upd(c.id,"nombre",e.target.value)} style={{...S.inp, width:"100%"}} /></td>
                    <td style={S.td}><select value={c.categoria} onChange={e => upd(c.id,"categoria",e.target.value)} style={S.inp}>{CATS_CF.map(x=><option key={x}>{x}</option>)}</select></td>
                    <td style={S.td}><input type="number" value={c.monto} onChange={e => upd(c.id,"monto",e.target.value)} style={{...S.inp, width:"140px"}} /></td>
                    <td style={S.td}><button onClick={() => del(c.id)} style={{background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:"16px"}}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {costosFijos.length === 0 && <div style={{...S.card, color:"#888", textAlign:"center"}}>No hay costos fijos cargados todavía.</div>}
    </div>
  );
}

// ===================== NUEVO ENVÍO =====================
function NuevoEnvio({ local, insumos, onGuardar }) {
  const [fecha, setFecha] = useState(today());
  const [busqueda, setBusqueda] = useState("");
  const [items, setItems] = useState([]);
  const [horas, setHoras] = useState([]);
  const [nota, setNota] = useState("");

  const insFiltrados = insumos.filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const toggleIns = ins => {
    if (items.find(it => it.insumo_id === ins.id)) setItems(items.filter(it => it.insumo_id !== ins.id));
    else setItems([...items, { insumo_id: ins.id, nombre: ins.nombre, unidad: ins.unidad, cantidad: "", precio_unidad: ins.precio_unidad, merma_pct: 0 }]);
  };
  const updCant   = (id, v) => setItems(items.map(it => it.insumo_id===id ? {...it, cantidad: v} : it));
  const updPrecio = (id, v) => setItems(items.map(it => it.insumo_id===id ? {...it, precio_unidad: Number(v)} : it));
  const updMerma  = (id, v) => setItems(items.map(it => it.insumo_id===id ? {...it, merma_pct: Number(v)} : it));
  const subtotal  = it => { const m = it.merma_pct > 0 ? 100/(100-it.merma_pct) : 1; return (Number(it.cantidad)||0) * it.precio_unidad * m; };
  const addHora = () => setHoras([...horas, { id: uid(), descripcion:"", horas:"", precio_hora:"" }]);
  const updHora = (id, f, v) => setHoras(horas.map(h => h.id!==id ? h : {...h, [f]:v}));
  const delHora = id => setHoras(horas.filter(h => h.id!==id));

  const totalMerc  = items.reduce((s,it) => s + subtotal(it), 0);
  const totalHoras = horas.reduce((s,h) => s + (Number(h.horas)||0)*(Number(h.precio_hora)||0), 0);
  const total = totalMerc + totalHoras;

  const guardar = () => {
    const itemsOk = items.filter(it => Number(it.cantidad) > 0);
    if (!fecha || itemsOk.length === 0) { alert("Completá la fecha y al menos un insumo con cantidad."); return; }
    onGuardar({
      id: uid(), fecha, nota,
      items: itemsOk.map(it => ({...it, cantidad: Number(it.cantidad), merma_pct: it.merma_pct||0, subtotal: subtotal(it)})),
      horas: horas.filter(h => h.descripcion && Number(h.horas)>0).map(h => ({...h, horas:Number(h.horas), precio_hora:Number(h.precio_hora)})),
      total_mercaderia: totalMerc, total_horas: totalHoras, total, pagado: false,
    });
    setItems([]); setHoras([]); setNota(""); setBusqueda("");
  };

  return (
    <div style={{ maxWidth:"900px", margin:"0 auto", padding:"24px" }}>
      <h2 style={{ margin:"0 0 20px", color:"#1a2e1a" }}>Nuevo envío → {local.nombre}</h2>

      <div style={S.card}>
        <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
          <div><label style={S.label}>Fecha del envío</label><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={S.inp} /></div>
          <div style={{flex:1}}><label style={S.label}>Nota (opcional)</label><input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Ej: Semana 12" style={{...S.inp, width:"100%"}} /></div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontWeight:"700", fontSize:"13px", marginBottom:"12px" }}>Seleccioná los insumos</div>
        <input placeholder="Buscar insumo..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{...S.inp, width:"100%", marginBottom:"12px"}} />
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom: items.length>0 ? "16px":"0" }}>
          {insFiltrados.map(ins => {
            const sel = !!items.find(it => it.insumo_id===ins.id);
            return (
              <button key={ins.id} onClick={()=>toggleIns(ins)}
                style={{ padding:"5px 12px", borderRadius:"20px", border:`1px solid ${sel?"#1a7a3a":"#ddd"}`, background:sel?"#e8f5e9":"#fff", color:sel?"#1a7a3a":"#555", cursor:"pointer", fontSize:"12px", fontWeight:sel?"700":"400", fontFamily:"inherit" }}>
                {ins.nombre}
              </button>
            );
          })}
          {insumos.length===0 && <span style={{color:"#aaa",fontSize:"13px"}}>No hay insumos. Agregalos en la sección Insumos.</span>}
        </div>
        {items.length > 0 && (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr><th style={S.th}>Insumo</th><th style={S.th}>Cantidad</th><th style={S.th}>Unidad</th><th style={S.th}>Precio unit.</th><th style={S.th}>Merma %</th><th style={S.th}>Subtotal</th><th style={S.th}></th></tr></thead>
            <tbody>
              {items.map(it => (
                <tr key={it.insumo_id}>
                  <td style={S.td}>{it.nombre}</td>
                  <td style={S.td}><input type="number" value={it.cantidad} onChange={e=>updCant(it.insumo_id,e.target.value)} style={{...S.inp, width:"80px"}} placeholder="0" /></td>
                  <td style={S.td}>{it.unidad}</td>
                  <td style={S.td}><input type="number" value={it.precio_unidad} onChange={e=>updPrecio(it.insumo_id,e.target.value)} style={{...S.inp, width:"110px"}} /></td>
                  <td style={S.td}><input type="number" value={it.merma_pct||0} onChange={e=>updMerma(it.insumo_id,e.target.value)} style={{...S.inp, width:"65px"}} min="0" max="99" placeholder="0" /></td>
                  <td style={S.td}>
                    <strong>{fmt(subtotal(it))}</strong>
                    {it.merma_pct>0 && <div style={{fontSize:"10px",color:"#e67e22"}}>+{it.merma_pct}% merma</div>}
                  </td>
                  <td style={S.td}><button onClick={()=>setItems(items.filter(i=>i.insumo_id!==it.insumo_id))} style={{background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:"16px"}}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
          <div style={{ fontWeight:"700", fontSize:"13px" }}>Horas de empleados</div>
          <button onClick={addHora} style={{...S.btn("#2471a3"), fontSize:"12px", padding:"5px 12px"}}>+ Agregar</button>
        </div>
        {horas.length===0 && <div style={{color:"#aaa",fontSize:"13px"}}>Sin horas de empleados para este envío.</div>}
        {horas.map(h => (
          <div key={h.id} style={{ display:"flex", gap:"8px", marginBottom:"8px", flexWrap:"wrap", alignItems:"center" }}>
            <input placeholder="Descripción (ej: Cocinero)" value={h.descripcion} onChange={e=>updHora(h.id,"descripcion",e.target.value)} style={{...S.inp, flex:"1 1 150px"}} />
            <input type="number" placeholder="Horas" value={h.horas} onChange={e=>updHora(h.id,"horas",e.target.value)} style={{...S.inp, width:"80px"}} />
            <input type="number" placeholder="$ / hora" value={h.precio_hora} onChange={e=>updHora(h.id,"precio_hora",e.target.value)} style={{...S.inp, width:"110px"}} />
            <span style={{fontSize:"13px", fontWeight:"700", minWidth:"90px"}}>{fmt((Number(h.horas)||0)*(Number(h.precio_hora)||0))}</span>
            <button onClick={()=>delHora(h.id)} style={{background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:"16px"}}>×</button>
          </div>
        ))}
      </div>

      <div style={{...S.card, background:"#1a2e1a", color:"#fff"}}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
          <div style={{ display:"flex", gap:"32px" }}>
            <div><div style={{fontSize:"11px",opacity:0.6}}>Mercadería</div><div style={{fontSize:"18px",fontWeight:"700"}}>{fmt(totalMerc)}</div></div>
            <div><div style={{fontSize:"11px",opacity:0.6}}>Horas</div><div style={{fontSize:"18px",fontWeight:"700"}}>{fmt(totalHoras)}</div></div>
            <div><div style={{fontSize:"11px",opacity:0.6}}>TOTAL ENVÍO</div><div style={{fontSize:"24px",fontWeight:"700"}}>{fmt(total)}</div></div>
          </div>
          <button onClick={guardar} style={{...S.btn("#27ae60"), fontSize:"14px", padding:"10px 24px"}}>💾 Guardar envío</button>
        </div>
      </div>
    </div>
  );
}

// ===================== HISTORIAL =====================
function Historial({ local, envios, setEnvios, produccion, produccionMedallon, salsas, pagos, setPagos }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [expandido, setExpandido] = useState(null);
  const [histTab, setHistTab] = useState(0); // 0=envíos 1=producción 2=pagos
  const [pagoFecha, setPagoFecha] = useState(today());
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoNota, setPagoNota] = useState("");

  const fmtFecha = iso => { try { const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; } catch { return iso; } };
  const fmtGr = kg => Math.round(kg*1000)>=1000 ? `${kg.toFixed(2)} kg` : `${Math.round(kg*1000)} gr`;

  // ── Envíos filtrados ──
  const filtrados = envios
    .filter(e => (!desde || e.fecha >= desde) && (!hasta || e.fecha <= hasta))
    .sort((a,b) => b.fecha.localeCompare(a.fecha));

  // ── Despachos de producción para este local ──
  const despachosProd = (produccion||[])
    .filter(p => p.tipo==="despacho" && p.local_id===local.id)
    .filter(p => (!desde || p.fecha >= desde) && (!hasta || p.fecha <= hasta))
    .sort((a,b) => b.fecha.localeCompare(a.fecha));

  const despachosMed = (produccionMedallon||[])
    .filter(p => p.tipo==="despacho" && p.local_id===local.id)
    .filter(p => (!desde || p.fecha >= desde) && (!hasta || p.fecha <= hasta))
    .sort((a,b) => b.fecha.localeCompare(a.fecha));

  // ── Pagos ──
  const todosLosPagos = pagos[local.id] || [];
  const pagosLocal = todosLosPagos
    .filter(p => (!desde || p.fecha >= desde) && (!hasta || p.fecha <= hasta))
    .sort((a,b) => b.fecha.localeCompare(a.fecha));

  const totalPagosRecibidos = todosLosPagos.reduce((s,p) => s+p.monto, 0);
  const deudaEnvios  = envios.filter(e=>!e.pagado).reduce((s,e)=>s+e.total,0);
  const balance      = deudaEnvios - totalPagosRecibidos;

  const togglePagado = id => setEnvios(envios.map(e => e.id!==id ? e : {...e, pagado:!e.pagado}));
  const eliminar = id => { if (confirm("¿Eliminar este envío?")) setEnvios(envios.filter(e=>e.id!==id)); };

  const registrarPago = () => {
    if (!pagoMonto || Number(pagoMonto)<=0) return;
    setPagos(prev => ({
      ...prev,
      [local.id]: [{ id:uid(), fecha:pagoFecha, monto:Number(pagoMonto), nota:pagoNota.trim() }, ...(prev[local.id]||[])]
    }));
    setPagoMonto(""); setPagoNota("");
  };
  const eliminarPago = id => {
    if (confirm("¿Eliminar este pago?")) {
      setPagos(prev => ({ ...prev, [local.id]: (prev[local.id]||[]).filter(p=>p.id!==id) }));
    }
  };

  const exportarPDF = () => {
    const per = `${desde||"inicio"} → ${hasta||today()}`;
    const rowsEnv = filtrados.map(e=>`
      <tr><td>${fmtFecha(e.fecha)}</td><td>${e.nota||'—'}</td><td style="text-align:right">${fmt(e.total)}</td><td style="text-align:center;color:${e.pagado?"#27ae60":"#c0392b"}">${e.pagado?"PAGADO":"PENDIENTE"}</td></tr>`).join("");
    const rowsProd = despachosProd.map(p=>{
      const s=(salsas||[]).find(x=>x.id===p.salsa_id);
      const pu=s?.rendTipo==="unidad";
      return `<tr><td>${fmtFecha(p.fecha)}</td><td>🧪 ${s?.nombre||"?"}</td><td style="text-align:right">${pu?`${Math.round(p.cantidadKg)} u`:fmtGr(p.cantidadKg)}</td><td>—</td></tr>`;
    }).join("");
    const rowsMed = despachosMed.map(p=>`<tr><td>${fmtFecha(p.fecha)}</td><td>🥩 Medallones</td><td style="text-align:right">${p.medallones} u</td><td>—</td></tr>`).join("");
    const rowsPag = pagosLocal.map(p=>`<tr><td>${fmtFecha(p.fecha)}</td><td>${p.nota||'—'}</td><td style="text-align:right;color:#27ae60">+${fmt(p.monto)}</td><td></td></tr>`).join("");
    const balStr  = balance>0?`Debe ${fmt(balance)}`:balance<0?`Saldo a favor: ${fmt(Math.abs(balance))}`:"Al día ✓";
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cuenta ${local.nombre}</title>
      <style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;padding:24px;color:#111}h1{font-size:20px;margin:0 0 4px}h2{font-size:13px;color:#555;margin:18px 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px}table{width:100%;border-collapse:collapse;margin-bottom:8px}th{background:#f0f0f0;padding:6px 8px;text-align:left;font-size:11px;border-bottom:2px solid #ccc}td{padding:6px 8px;border-bottom:1px solid #eee}.balance{font-size:16px;font-weight:700;margin-top:16px;padding:10px 14px;background:#f5f5f5;border-radius:6px}.footer{margin-top:20px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:8px}@media print{body{padding:10px}}</style>
      </head><body>
      <h1>Cuenta Corriente — ${local.nombre}</h1>
      <p style="color:#888;font-size:11px">Período: ${per} | Generado: ${fmtFecha(today())}</p>
      <h2>Envíos de mercadería</h2>
      <table><thead><tr><th>Fecha</th><th>Nota</th><th style="text-align:right">Total</th><th style="text-align:center">Estado</th></tr></thead><tbody>${rowsEnv||'<tr><td colspan=4 style="color:#aaa;padding:8px">Sin envíos</td></tr>'}</tbody></table>
      <h2>Producción despachada (recetas)</h2>
      <table><thead><tr><th>Fecha</th><th>Receta</th><th style="text-align:right">Cantidad</th><th>—</th></tr></thead><tbody>${(rowsProd+rowsMed)||'<tr><td colspan=4 style="color:#aaa;padding:8px">Sin despachos de producción</td></tr>'}</tbody></table>
      <h2>Pagos recibidos</h2>
      <table><thead><tr><th>Fecha</th><th>Nota</th><th style="text-align:right">Monto</th><th></th></tr></thead><tbody>${rowsPag||'<tr><td colspan=4 style="color:#aaa;padding:8px">Sin pagos registrados</td></tr>'}</tbody></table>
      <div class="balance">Balance neto (deuda envíos − pagos): ${balStr}</div>
      <div class="footer">Central de Envíos · ${local.nombre} · ${fmtFecha(today())}</div>
      </body></html>`;
    const w=window.open("","_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(()=>w.print(),350);
  };

  const pendEnvios = filtrados.filter(e=>!e.pagado).length;
  const totalDespachos = despachosProd.length + despachosMed.length;

  return (
    <div style={{ maxWidth:"950px", margin:"0 auto", padding:"24px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", flexWrap:"wrap", gap:"10px" }}>
        <h2 style={{ margin:0, color:"#1a2e1a" }}>Cuenta corriente — {local.nombre}</h2>
        <button onClick={exportarPDF} style={{...S.btn("#1a5276"),fontSize:"12px",padding:"7px 16px"}}>🖨️ Exportar PDF</button>
      </div>

      {/* Filtro fechas */}
      <div style={S.card}>
        <div style={{ display:"flex", gap:"16px", flexWrap:"wrap", alignItems:"flex-end" }}>
          <div><label style={S.label}>Desde</label><input type="date" value={desde} onChange={e=>setDesde(e.target.value)} style={S.inp} /></div>
          <div><label style={S.label}>Hasta</label><input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} style={S.inp} /></div>
          <button onClick={()=>{setDesde("");setHasta("");}} style={{...S.btn("#888"),fontSize:"12px",padding:"7px 14px"}}>Limpiar</button>
        </div>
      </div>

      {/* Balance cards */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"18px", flexWrap:"wrap" }}>
        <div style={{...S.card,flex:1,margin:0,textAlign:"center",borderTop:"3px solid #c0392b"}}>
          <div style={{fontSize:"11px",color:"#888"}}>DEUDA ENVÍOS</div>
          <div style={{fontSize:"20px",fontWeight:"700",color:"#c0392b"}}>{fmt(deudaEnvios)}</div>
          <div style={{fontSize:"10px",color:"#aaa"}}>{envios.filter(e=>!e.pagado).length} pendientes</div>
        </div>
        <div style={{...S.card,flex:1,margin:0,textAlign:"center",borderTop:"3px solid #27ae60"}}>
          <div style={{fontSize:"11px",color:"#888"}}>PAGOS RECIBIDOS</div>
          <div style={{fontSize:"20px",fontWeight:"700",color:"#27ae60"}}>{fmt(totalPagosRecibidos)}</div>
          <div style={{fontSize:"10px",color:"#aaa"}}>{todosLosPagos.length} pagos</div>
        </div>
        <div style={{...S.card,flex:"2 1 200px",margin:0,textAlign:"center",borderTop:`3px solid ${balance>0?"#e67e22":balance<0?"#1a7a3a":"#aaa"}`}}>
          <div style={{fontSize:"11px",color:"#888"}}>BALANCE NETO</div>
          <div style={{fontSize:"22px",fontWeight:"700",color:balance>0?"#e67e22":balance<0?"#1a7a3a":"#888"}}>
            {balance>0?`Debe ${fmt(balance)}`:balance<0?`Saldo a favor ${fmt(Math.abs(balance))}`:"Al día ✓"}
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:"flex", gap:"2px", marginBottom:"16px" }}>
        {[
          {label:"📋 Envíos", badge: pendEnvios > 0 ? pendEnvios : 0},
          {label:"🏭 Producción enviada", badge: totalDespachos > 0 ? totalDespachos : 0},
          {label:"💰 Pagos", badge: 0},
        ].map(({label,badge},i) => (
          <button key={i} style={{...S.tab(histTab===i), display:"flex", alignItems:"center", gap:"5px"}} onClick={()=>setHistTab(i)}>
            {label}
            {badge > 0 && <span style={{background:i===0?"#c0392b":"#e67e22",color:"#fff",borderRadius:"8px",fontSize:"9px",padding:"1px 5px"}}>{badge}</span>}
          </button>
        ))}
      </div>

      {/* ── TAB 0: Envíos ── */}
      {histTab===0 && (
        <>
          {filtrados.length===0 && <div style={{...S.card,textAlign:"center",color:"#888"}}>No hay envíos en este período.</div>}
          {filtrados.map(e => (
            <div key={e.id} style={{...S.card,borderLeft:`4px solid ${e.pagado?"#27ae60":"#c0392b"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
                <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:"700",fontSize:"14px"}}>{fmtFecha(e.fecha)}</div>
                    {e.nota && <div style={{fontSize:"12px",color:"#888"}}>{e.nota}</div>}
                  </div>
                  <Tag color={e.pagado?"#27ae60":"#c0392b"}>{e.pagado?"PAGADO":"PENDIENTE"}</Tag>
                </div>
                <div style={{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{textAlign:"right"}}><div style={{fontSize:"11px",color:"#888"}}>Mercadería</div><div style={{fontWeight:"700"}}>{fmt(e.total_mercaderia)}</div></div>
                  {e.total_horas>0 && <div style={{textAlign:"right"}}><div style={{fontSize:"11px",color:"#888"}}>Horas</div><div style={{fontWeight:"700"}}>{fmt(e.total_horas)}</div></div>}
                  <div style={{textAlign:"right"}}><div style={{fontSize:"11px",color:"#888"}}>TOTAL</div><div style={{fontWeight:"700",fontSize:"16px"}}>{fmt(e.total)}</div></div>
                  <div style={{display:"flex",gap:"6px"}}>
                    <button onClick={()=>setExpandido(expandido===e.id?null:e.id)} style={{...S.btn("#2471a3"),fontSize:"11px",padding:"5px 10px"}}>{expandido===e.id?"▲":"▼"}</button>
                    <button onClick={()=>togglePagado(e.id)} style={{...S.btn(e.pagado?"#888":"#27ae60"),fontSize:"11px",padding:"5px 10px"}}>{e.pagado?"Desmarcar":"✓ Pagado"}</button>
                    <button onClick={()=>eliminar(e.id)} style={{...S.btn("#c0392b"),fontSize:"11px",padding:"5px 10px"}}>🗑</button>
                  </div>
                </div>
              </div>
              {expandido===e.id && (
                <div style={{marginTop:"14px",borderTop:"1px solid #f0f0f0",paddingTop:"14px"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",marginBottom:e.horas?.length>0?"12px":0}}>
                    <thead><tr><th style={S.th}>Insumo</th><th style={S.th}>Cantidad</th><th style={S.th}>Unidad</th><th style={S.th}>Precio unit.</th><th style={S.th}>Merma %</th><th style={S.th}>Subtotal</th></tr></thead>
                    <tbody>
                      {e.items.map((it,i)=>(
                        <tr key={i}>
                          <td style={S.td}>{it.nombre}</td><td style={S.td}>{it.cantidad}</td><td style={S.td}>{it.unidad}</td>
                          <td style={S.td}>{fmt(it.precio_unidad)}</td>
                          <td style={S.td}>{it.merma_pct>0?<Tag color="#e67e22">{it.merma_pct}%</Tag>:<span style={{color:"#ccc"}}>—</span>}</td>
                          <td style={S.td}><strong>{fmt(it.subtotal??it.cantidad*it.precio_unidad)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {e.horas?.length>0 && <>
                    <div style={{fontSize:"12px",fontWeight:"700",color:"#2471a3",marginBottom:"6px"}}>Horas de empleados</div>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr><th style={S.th}>Descripción</th><th style={S.th}>Horas</th><th style={S.th}>$ / hora</th><th style={S.th}>Subtotal</th></tr></thead>
                      <tbody>{e.horas.map((h,i)=>(
                        <tr key={i}><td style={S.td}>{h.descripcion}</td><td style={S.td}>{h.horas}</td><td style={S.td}>{fmt(h.precio_hora)}</td><td style={S.td}><strong>{fmt(h.horas*h.precio_hora)}</strong></td></tr>
                      ))}</tbody>
                    </table>
                  </>}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── TAB 1: Producción enviada ── */}
      {histTab===1 && (
        <>
          {despachosProd.length===0 && despachosMed.length===0 && (
            <div style={{...S.card,textAlign:"center",color:"#888"}}>No hay despachos de producción para este local en este período.<br/><span style={{fontSize:"11px"}}>Usá "Despachar a local" desde Producción o Medallón.</span></div>
          )}
          {despachosProd.map(p => {
            const s=(salsas||[]).find(x=>x.id===p.salsa_id);
            const pu=s?.rendTipo==="unidad";
            const cant=pu?`${Math.round(p.cantidadKg)} u`:fmtGr(p.cantidadKg);
            return (
              <div key={p.id} style={{...S.card,borderLeft:"4px solid #e67e22",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
                <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
                  <span style={{fontWeight:"700",fontSize:"13px"}}>{fmtFecha(p.fecha)}</span>
                  <Tag color="#e67e22">Receta</Tag>
                  <span style={{fontSize:"13px"}}>🧪 {s?.nombre||"?"}</span>
                  {p.nota && <span style={{fontSize:"11px",color:"#888"}}>{p.nota}</span>}
                </div>
                <span style={{fontWeight:"700",fontSize:"14px",color:"#e67e22"}}>{cant}</span>
              </div>
            );
          })}
          {despachosMed.map(p => (
            <div key={p.id} style={{...S.card,borderLeft:"4px solid #8b4513",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
              <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
                <span style={{fontWeight:"700",fontSize:"13px"}}>{fmtFecha(p.fecha)}</span>
                <Tag color="#8b4513">Medallón</Tag>
                <span style={{fontSize:"13px"}}>🥩 Medallones</span>
                {p.nota && <span style={{fontSize:"11px",color:"#888"}}>{p.nota}</span>}
              </div>
              <span style={{fontWeight:"700",fontSize:"14px",color:"#8b4513"}}>{p.medallones} u</span>
            </div>
          ))}
        </>
      )}

      {/* ── TAB 2: Pagos ── */}
      {histTab===2 && (
        <>
          <div style={S.card}>
            <div style={{fontWeight:"700",fontSize:"13px",marginBottom:"12px"}}>+ Registrar pago recibido</div>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"flex-end"}}>
              <div><label style={S.label}>Fecha</label><input type="date" value={pagoFecha} onChange={e=>setPagoFecha(e.target.value)} style={S.inp} /></div>
              <div><label style={S.label}>Monto $</label><input type="number" min="0" placeholder="0" value={pagoMonto} onChange={e=>setPagoMonto(e.target.value)} style={{...S.inp,width:"150px"}} onKeyDown={e=>e.key==="Enter"&&registrarPago()} /></div>
              <div style={{flex:"1 1 160px"}}><label style={S.label}>Nota (opcional)</label><input value={pagoNota} onChange={e=>setPagoNota(e.target.value)} placeholder="Ej: transferencia, efectivo" style={{...S.inp,width:"100%"}} /></div>
              <button onClick={registrarPago} style={S.btn("#27ae60")}>+ Registrar</button>
            </div>
          </div>
          {pagosLocal.length===0 && <div style={{...S.card,textAlign:"center",color:"#888"}}>No hay pagos registrados en este período.</div>}
          {pagosLocal.map(p => (
            <div key={p.id} style={{...S.card,borderLeft:"4px solid #27ae60",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
              <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
                <span style={{fontWeight:"700",fontSize:"13px"}}>{fmtFecha(p.fecha)}</span>
                {p.nota && <span style={{fontSize:"12px",color:"#555"}}>{p.nota}</span>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <span style={{fontWeight:"700",fontSize:"16px",color:"#27ae60"}}>+{fmt(p.monto)}</span>
                <button onClick={()=>eliminarPago(p.id)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:"16px"}}>×</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ===================== LOCALES =====================
function LocalesTab({ locales, setLocales }) {
  const [form, setForm] = useState({ nombre:"", color:COLORES[0] });
  const add = () => {
    if (!form.nombre.trim()) return;
    setLocales([...locales, { id: uid(), nombre:form.nombre.trim(), color:form.color }]);
    setForm({nombre:"",color:COLORES[0]});
  };
  const del = id => { if(confirm("¿Eliminar este local? Se perderán sus envíos.")) setLocales(locales.filter(l=>l.id!==id)); };
  return (
    <div style={{ maxWidth:"600px", margin:"0 auto", padding:"24px" }}>
      <h2 style={{ margin:"0 0 20px", color:"#1a2e1a" }}>Gestión de locales</h2>
      <div style={S.card}>
        <div style={{fontWeight:"700",fontSize:"13px",marginBottom:"12px"}}>Agregar local</div>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          <input placeholder="Nombre del local" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} style={{...S.inp,flex:1}} onKeyDown={e=>e.key==="Enter"&&add()} />
          <select value={form.color} onChange={e=>setForm({...form,color:e.target.value})} style={S.inp}>
            {COLORES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={add} style={S.btn()}>+ Agregar</button>
        </div>
      </div>
      {locales.map(l=>(
        <div key={l.id} style={{...S.card,display:"flex",justifyContent:"space-between",alignItems:"center",borderLeft:`4px solid ${l.color}`}}>
          <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
            <div style={S.dot(l.color)}/>
            <span style={{fontWeight:"700",fontSize:"14px"}}>{l.nombre}</span>
          </div>
          <button onClick={()=>del(l.id)} style={{...S.btn("#c0392b"),fontSize:"12px",padding:"5px 12px"}}>Eliminar</button>
        </div>
      ))}
    </div>
  );
}

// ===================== USUARIOS =====================
function UsuariosTab({ usuarios, setUsuarios }) {
  const [form, setForm] = useState({ nombre:"", email:"", password:"" });
  const [error, setError] = useState("");
  const add = () => {
    if (!form.nombre || !form.email || !form.password) { setError("Completá todos los campos."); return; }
    if (usuarios.find(u => u.email === form.email)) { setError("Ese email ya existe."); return; }
    setUsuarios([...usuarios, { id: Date.now(), ...form }]);
    setForm({ nombre:"", email:"", password:"" }); setError("");
  };
  const del = id => { if (window.confirm("¿Eliminar este usuario?")) setUsuarios(usuarios.filter(u => u.id !== id)); };
  return (
    <div style={{ maxWidth:"700px", margin:"0 auto", padding:"24px" }}>
      <h2 style={{ margin:"0 0 20px", color:"#1a2e1a" }}>Gestión de usuarios</h2>
      <div style={S.card}>
        <div style={{ fontWeight:"700", fontSize:"13px", marginBottom:"12px" }}>Agregar usuario</div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} style={{...S.inp,flex:"1 1 130px"}} />
          <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={{...S.inp,flex:"1 1 180px"}} />
          <input type="password" placeholder="Contraseña" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} style={{...S.inp,flex:"1 1 130px"}} />
          <button onClick={add} style={S.btn()}>+ Agregar</button>
        </div>
        {error && <div style={{color:"#c0392b",fontSize:"11px",marginTop:"8px"}}>{error}</div>}
      </div>
      <div style={S.card}>
        <div style={{ fontWeight:"700", fontSize:"13px", marginBottom:"12px" }}>Usuarios con acceso</div>
        <div style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #eee", alignItems:"center" }}>
          <div><div style={{fontWeight:"700",fontSize:"13px"}}>Thomas (admin)</div><div style={{fontSize:"11px",color:"#888"}}>{USUARIOS_FIJOS[0].email}</div></div>
          <span style={{background:"#e8f5e9",color:"#1a7a3a",fontSize:"10px",fontWeight:"700",padding:"2px 8px",borderRadius:"4px"}}>Admin</span>
        </div>
        {USUARIOS_FIJOS.slice(1).map(u => (
          <div key={u.email} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #f0f0f0", alignItems:"center" }}>
            <div><div style={{fontWeight:"600",fontSize:"13px"}}>{u.email}</div><div style={{fontSize:"11px",color:"#888"}}>Usuario fijo</div></div>
            <span style={{background:"#e8f0fe",color:"#2471a3",fontSize:"10px",fontWeight:"700",padding:"2px 8px",borderRadius:"4px"}}>Fijo</span>
          </div>
        ))}
        {usuarios.map(u => (
          <div key={u.id} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #f0f0f0", alignItems:"center" }}>
            <div><div style={{fontWeight:"600",fontSize:"13px"}}>{u.nombre}</div><div style={{fontSize:"11px",color:"#888"}}>{u.email}</div></div>
            <button onClick={()=>del(u.id)} style={{background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:"16px"}}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== STOCK =====================
function StockTab({ cookInsumos, stockInicial, setStockInicial, ingresosStock, setIngresosStock, salsas, produccion, allEnvios, produccionMedallon }) {
  const [tabStock, setTabStock] = useState(0); // 0=actual, 1=ingresos, 2=recetas
  const [form, setForm] = useState({ fecha: today(), insumo_id: cookInsumos[0]?.id || "", cantidad: "", nota: "" });
  const [histOpen, setHistOpen] = useState(false);

  const fmtKg = kg => {
    if (kg === 0) return "0";
    const abs = Math.abs(kg);
    return abs >= 1 ? `${kg.toFixed(2)} kg` : `${Math.round(kg * 1000)} gr`;
  };
  const fmtFecha = iso => { try { const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; } catch { return iso; } };

  const consumoProd  = calcConsumoProduccion(produccion, salsas);
  const consumoEnv   = calcConsumoEnvios(allEnvios);
  const consumoMed   = calcConsumoMedallon(produccionMedallon);

  const stockActual = cookInsumos.map(ins => {
    const inicial   = Number(stockInicial[ins.id] || 0);
    const recibido  = ingresosStock.filter(e => e.insumo_id === ins.id).reduce((a,e) => a + e.cantidad, 0);
    const usadoProd = (consumoProd[ins.id] || 0) + (consumoMed[ins.id] || 0);
    const usadoEnv  = consumoEnv[ins.id]  || 0;
    const usado     = usadoProd + usadoEnv;
    const actual    = inicial + recibido - usado;
    const color     = actual < 0 ? "#c0392b" : actual === 0 ? "#aaa" : actual < 1 ? "#e67e22" : "#1a7a3a";
    return { ...ins, inicial, recibido, usadoProd, usadoEnv, usado, actual, color };
  });

  const byCat = CATS.map(cat => ({ cat, items: stockActual.filter(i => i.categoria === cat) })).filter(g => g.items.length > 0);

  const registrarIngreso = () => {
    if (!form.insumo_id || !form.cantidad || Number(form.cantidad) <= 0) return;
    setIngresosStock(prev => [{ id: uid(), fecha: form.fecha, insumo_id: Number(form.insumo_id), cantidad: Number(form.cantidad), nota: form.nota.trim() }, ...prev]);
    setForm(f => ({ ...f, cantidad: "", nota: "" }));
  };

  const stockRecetas = salsas.map(s => {
    const producidoKg = (produccion||[]).filter(p => p.salsa_id===s.id && p.tipo!=="despacho").reduce((a,p) => a+p.cantidadKg, 0);
    const despachado  = (produccion||[]).filter(p => p.salsa_id===s.id && p.tipo==="despacho").reduce((a,p) => a+p.cantidadKg, 0);
    const actualKg = producidoKg - despachado;
    const esPU = s.rendTipo === "unidad";
    const color = producidoKg===0&&despachado===0 ? "#aaa" : actualKg<0 ? "#c0392b" : actualKg<(esPU?2:0.2) ? "#e67e22" : "#1a7a3a";
    return { ...s, producidoKg, despachado, actualKg, esPU, color };
  });
  const medallonesProducidos = (produccionMedallon||[]).filter(p => p.tipo !== "despacho").reduce((s, p) => s + (p.medallones||0), 0);
  const medallonesDesp       = (produccionMedallon||[]).filter(p => p.tipo === "despacho").reduce((s, p) => s + (p.medallones||0), 0);
  const medallonStock = medallonesProducidos - medallonesDesp;
  const medallonColor = medallonesProducidos===0&&medallonesDesp===0 ? "#aaa" : medallonStock<0 ? "#c0392b" : medallonStock<5 ? "#e67e22" : "#1a7a3a";

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      <h2 style={{ margin: "0 0 16px", color: "#1a2e1a" }}>Stock</h2>
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        <button style={S.tab(tabStock===0)} onClick={() => setTabStock(0)}>📋 Stock actual</button>
        <button style={S.tab(tabStock===1)} onClick={() => setTabStock(1)}>📥 Recibir mercadería</button>
        <button style={S.tab(tabStock===2)} onClick={() => setTabStock(2)}>🧪 Stock recetas</button>
      </div>

      {/* ── STOCK ACTUAL ── */}
      {tabStock === 0 && (
        <>
          {byCat.map(({ cat, items }) => (
            <div key={cat} style={S.card}>
              <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "10px", color: "#1a7a3a" }}>{cat}</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={S.th}>Insumo</th>
                    <th style={S.th}>Inicial</th>
                    <th style={S.th}>Recibido</th>
                    <th style={S.th}>Producción</th>
                    <th style={S.th}>Enviado</th>
                    <th style={S.th}>Stock actual</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((ins, i) => (
                    <tr key={ins.id} style={{ background: i%2===0?"#fafafa":"#fff" }}>
                      <td style={S.td}>{ins.nombre}</td>
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <input type="number" min="0" step="0.01" value={stockInicial[ins.id] ?? ""} placeholder="0"
                            onChange={e => setStockInicial(prev => ({ ...prev, [ins.id]: e.target.value === "" ? 0 : Number(e.target.value) }))}
                            style={{ ...S.inp, width: "80px", fontSize: "12px" }} />
                          <span style={{ fontSize: "11px", color: "#aaa" }}>{ins.unidad}</span>
                        </div>
                      </td>
                      <td style={{ ...S.td, color: ins.recibido > 0 ? "#2471a3" : "#bbb" }}>
                        {ins.recibido > 0 ? `+${fmtKg(ins.recibido)} ${ins.unidad}` : "—"}
                      </td>
                      <td style={{ ...S.td, color: ins.usadoProd > 0.0001 ? "#e67e22" : "#bbb" }}>
                        {ins.usadoProd > 0.0001 ? `-${fmtKg(ins.usadoProd)} ${ins.unidad}` : "—"}
                      </td>
                      <td style={{ ...S.td, color: ins.usadoEnv > 0 ? "#c0392b" : "#bbb" }}>
                        {ins.usadoEnv > 0 ? `-${fmtKg(ins.usadoEnv)} ${ins.unidad}` : "—"}
                      </td>
                      <td style={{ ...S.td, fontWeight: "700", color: ins.color }}>
                        {ins.actual === 0 && ins.inicial === 0 && ins.recibido === 0 ? "—" : `${fmtKg(ins.actual)} ${ins.unidad}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <div style={{ fontSize: "11px", color: "#aaa", textAlign: "center" }}>El campo "Inicial" es editable — ingresá el stock de arranque.</div>
        </>
      )}

      {/* ── RECIBIR MERCADERÍA ── */}
      {tabStock === 1 && (
        <>
          <div style={S.card}>
            <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "14px" }}>📥 Registrar ingreso de mercadería</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div><label style={S.label}>Fecha</label><input type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} style={S.inp} /></div>
              <div style={{ flex: "1 1 160px" }}>
                <label style={S.label}>Insumo</label>
                <select value={form.insumo_id} onChange={e=>setForm(f=>({...f,insumo_id:e.target.value}))} style={{...S.inp,width:"100%"}}>
                  {cookInsumos.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Cantidad</label>
                <input type="number" min="0" step="0.01" placeholder="0" value={form.cantidad} onChange={e=>setForm(f=>({...f,cantidad:e.target.value}))} style={{...S.inp,width:"110px"}} />
              </div>
              <div style={{ flex: "2 1 160px" }}>
                <label style={S.label}>Nota (opcional)</label>
                <input value={form.nota} onChange={e=>setForm(f=>({...f,nota:e.target.value}))} placeholder="Ej: Proveedor X" style={{...S.inp,width:"100%"}} />
              </div>
              <button onClick={registrarIngreso} style={S.btn("#2471a3")}>+ Registrar</button>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={()=>setHistOpen(v=>!v)}>
              <div style={{ fontWeight: "700", fontSize: "13px" }}>Historial de ingresos ({ingresosStock.length})</div>
              <span style={{ fontSize: "12px", color: "#888" }}>{histOpen?"▲ Ocultar":"▼ Ver"}</span>
            </div>
            {histOpen && (
              <div style={{ marginTop: "12px" }}>
                {ingresosStock.length === 0 && <div style={{ color: "#aaa", fontSize: "13px" }}>Sin ingresos registrados todavía.</div>}
                {ingresosStock.slice(0, 80).map(e => {
                  const ins = cookInsumos.find(i => i.id === e.insumo_id);
                  return (
                    <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: "7px", marginBottom: "4px", background: "#f0f8ff", borderLeft: "3px solid #2471a3" }}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontWeight: "700", fontSize: "12px" }}>{fmtFecha(e.fecha)}</span>
                        <span style={{ fontSize: "12px" }}>{ins?.nombre || "?"}</span>
                        {e.nota && <span style={{ fontSize: "11px", color: "#888" }}>{e.nota}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontWeight: "700", fontSize: "12px", color: "#2471a3" }}>+{e.cantidad} {ins?.unidad}</span>
                        <button onClick={()=>{ if(confirm("¿Eliminar?")) setIngresosStock(prev=>prev.filter(x=>x.id!==e.id)); }} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:"14px",padding:"0 4px"}}>×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── STOCK RECETAS ── */}
      {tabStock === 2 && (
        <div style={S.card}>
          <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "12px" }}>Stock de recetas</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Receta","Producido","Despachado","Stock actual"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              <tr style={{ background: "#fff8f0" }}>
                <td style={S.td}>🥩 Medallón (carne)</td>
                <td style={{ ...S.td, color: medallonesProducidos>0?"#1a7a3a":"#bbb", fontWeight:"700" }}>{medallonesProducidos>0?`${medallonesProducidos} u`:"—"}</td>
                <td style={{ ...S.td, color: medallonesDesp>0?"#c0392b":"#bbb" }}>{medallonesDesp>0?`${medallonesDesp} u`:"—"}</td>
                <td style={{ ...S.td, fontWeight:"700", color: medallonColor }}>{medallonesProducidos===0&&medallonesDesp===0?"—":`${medallonStock} u`}</td>
              </tr>
              {stockRecetas.map((s, i) => (
                <tr key={s.id} style={{ background: i%2===0?"#fafafa":"#fff" }}>
                  <td style={S.td}>🧪 {s.nombre}</td>
                  <td style={{ ...S.td, color: s.producidoKg>0?"#1a7a3a":"#bbb", fontWeight:"700" }}>
                    {s.producidoKg>0 ? (s.esPU?`${Math.round(s.producidoKg)} u`:fmtKg(s.producidoKg)) : "—"}
                  </td>
                  <td style={{ ...S.td, color: s.despachado>0?"#c0392b":"#bbb" }}>
                    {s.despachado>0 ? (s.esPU?`${Math.round(s.despachado)} u`:fmtKg(s.despachado)) : "—"}
                  </td>
                  <td style={{ ...S.td, fontWeight:"700", color: s.color }}>
                    {s.producidoKg===0&&s.despachado===0?"—":s.esPU?`${Math.round(s.actualKg)} u`:fmtKg(s.actualKg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===================== MEDALLÓN =====================
function MedallonTab({ produccionMedallon, setProduccionMedallon, locales }) {
  const [fecha, setFecha] = useState(today());
  const [carneKg, setCarneKg] = useState("");
  const [medallones, setMedallones] = useState("");
  const [nota, setNota] = useState("");
  const [despFecha, setDespFecha] = useState(today());
  const [despCant, setDespCant] = useState("");
  const [despLocal, setDespLocal] = useState(locales[0]?.id || "");
  const [despNota, setDespNota] = useState("");
  const [histOpen, setHistOpen] = useState(false);

  const totalProd = (produccionMedallon||[]).filter(p => p.tipo !== "despacho").reduce((s,p) => s + (p.medallones||0), 0);
  const totalDesp = (produccionMedallon||[]).filter(p => p.tipo === "despacho").reduce((s,p) => s + (p.medallones||0), 0);
  const stockAct  = totalProd - totalDesp;
  const totalCarne= (produccionMedallon||[]).filter(p => p.tipo !== "despacho").reduce((s,p) => s + (p.carneKg||0), 0);
  const stockColor= stockAct < 0 ? "#c0392b" : stockAct === 0 ? "#aaa" : stockAct < 10 ? "#e67e22" : "#1a7a3a";

  const fmtFecha = iso => { try { const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; } catch { return iso; } };

  const registrar = () => {
    if (!carneKg || !medallones || Number(carneKg)<=0 || Number(medallones)<=0) return;
    setProduccionMedallon(prev => [{ id:Date.now(), fecha, tipo:"produccion", carneKg:Number(carneKg), medallones:Number(medallones), nota:nota.trim() }, ...(prev||[])]);
    setCarneKg(""); setMedallones(""); setNota("");
  };

  const despachar = () => {
    if (!despCant || Number(despCant)<=0 || !despLocal) return;
    const local = locales.find(l => l.id === despLocal);
    setProduccionMedallon(prev => [{ id:Date.now(), fecha:despFecha, tipo:"despacho", carneKg:0, medallones:Number(despCant), local_id:despLocal, local_nombre:local?.nombre||"", nota:despNota.trim() }, ...(prev||[])]);
    setDespCant(""); setDespNota("");
  };

  const grPorMedallon = carneKg && medallones && Number(medallones)>0 ? (Number(carneKg)/Number(medallones)*1000).toFixed(0) : null;

  return (
    <div style={{ maxWidth:"900px", margin:"0 auto", padding:"24px" }}>
      <h2 style={{ margin:"0 0 20px", color:"#1a2e1a", fontFamily:"'DM Mono',monospace" }}>🥩 Receta Medallón</h2>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"10px", marginBottom:"20px" }}>
        <RStatBox label="Stock actual" value={`${stockAct} u`} accent={stockAct>0} />
        <RStatBox label="Total producidos" value={`${totalProd} u`} />
        <RStatBox label="Total despachados" value={`${totalDesp} u`} />
        <RStatBox label="Carne usada total" value={`${totalCarne.toFixed(2)} kg`} />
      </div>

      <RCard style={{ marginBottom:"14px" }}>
        <RH title="+ Registrar producción" />
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"flex-end" }}>
          <div>
            <div style={{ color:"#5a8a6e", fontSize:"10px", fontFamily:"'DM Mono',monospace", marginBottom:"4px" }}>FECHA</div>
            <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={RIS} />
          </div>
          <div>
            <div style={{ color:"#5a8a6e", fontSize:"10px", fontFamily:"'DM Mono',monospace", marginBottom:"4px" }}>CARNE USADA (kg)</div>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={carneKg} onChange={e=>setCarneKg(e.target.value)} style={{...RIS, width:"130px"}} />
          </div>
          <div>
            <div style={{ color:"#5a8a6e", fontSize:"10px", fontFamily:"'DM Mono',monospace", marginBottom:"4px" }}>MEDALLONES PRODUCIDOS</div>
            <input type="number" min="1" placeholder="0" value={medallones} onChange={e=>setMedallones(e.target.value)} style={{...RIS, width:"160px"}} />
          </div>
          <div style={{ flex:"1 1 160px" }}>
            <div style={{ color:"#5a8a6e", fontSize:"10px", fontFamily:"'DM Mono',monospace", marginBottom:"4px" }}>NOTA (opcional)</div>
            <input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Ej: producción del día" style={{...RIS, width:"100%"}} />
          </div>
          <RBtn onClick={registrar}>+ Registrar</RBtn>
        </div>
        {grPorMedallon && (
          <div style={{ marginTop:"10px", fontSize:"11px", color:"#1a7a3a", fontFamily:"'DM Mono',monospace" }}>
            → {grPorMedallon} gr por medallón
          </div>
        )}
      </RCard>

      <RCard style={{ marginBottom:"14px", borderLeft:"4px solid #e67e22" }}>
        <div style={{ fontWeight:"700", fontSize:"13px", marginBottom:"12px", color:"#e67e22", fontFamily:"'DM Mono',monospace" }}>📦 Despachar a local</div>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"flex-end" }}>
          <div>
            <div style={{ color:"#5a8a6e", fontSize:"10px", fontFamily:"'DM Mono',monospace", marginBottom:"4px" }}>FECHA</div>
            <input type="date" value={despFecha} onChange={e=>setDespFecha(e.target.value)} style={RIS} />
          </div>
          <div>
            <div style={{ color:"#5a8a6e", fontSize:"10px", fontFamily:"'DM Mono',monospace", marginBottom:"4px" }}>LOCAL DESTINO</div>
            <select value={despLocal} onChange={e=>setDespLocal(e.target.value)} style={{...RIS, width:"160px"}}>
              {locales.map(l=><option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>
          <div>
            <div style={{ color:"#5a8a6e", fontSize:"10px", fontFamily:"'DM Mono',monospace", marginBottom:"4px" }}>CANTIDAD (unidades)</div>
            <input type="number" min="1" placeholder="0" value={despCant} onChange={e=>setDespCant(e.target.value)} style={{...RIS, width:"130px"}} />
          </div>
          <div style={{ flex:"1 1 160px" }}>
            <div style={{ color:"#5a8a6e", fontSize:"10px", fontFamily:"'DM Mono',monospace", marginBottom:"4px" }}>NOTA (opcional)</div>
            <input value={despNota} onChange={e=>setDespNota(e.target.value)} placeholder="Ej: semana 12" style={{...RIS, width:"100%"}} />
          </div>
          <RBtn onClick={despachar} style={{ background:"#e67e22" }}>📦 Despachar</RBtn>
        </div>
        {locales.length===0 && <div style={{ marginTop:"10px", fontSize:"12px", color:"#e67e22" }}>⚠ Agregá locales primero en "Locales".</div>}
      </RCard>

      {(produccionMedallon||[]).length > 0 && (
        <RCard>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }} onClick={()=>setHistOpen(v=>!v)}>
            <div style={{ fontWeight:"700", fontSize:"13px", fontFamily:"'DM Mono',monospace" }}>Historial ({(produccionMedallon||[]).length})</div>
            <span style={{ fontSize:"12px", color:"#888" }}>{histOpen?"▲ Ocultar":"▼ Ver"}</span>
          </div>
          {histOpen && (
            <div style={{ marginTop:"12px", display:"flex", flexDirection:"column", gap:"4px" }}>
              {(produccionMedallon||[]).slice(0,60).map(p => {
                const esD = p.tipo==="despacho";
                return (
                  <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderRadius:"7px", background:esD?"#fff8f0":"#f0faf4", borderLeft:`3px solid ${esD?"#e67e22":"#27ae60"}` }}>
                    <div style={{ display:"flex", gap:"10px", alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontWeight:"700", fontSize:"12px", fontFamily:"'DM Mono',monospace" }}>{fmtFecha(p.fecha)}</span>
                      {esD
                        ? <span style={{fontSize:"12px"}}>📦 → {p.local_nombre}</span>
                        : <span style={{fontSize:"12px"}}>🥩 {p.carneKg} kg → {p.medallones} u</span>
                      }
                      {p.nota && <span style={{fontSize:"11px",color:"#888"}}>{p.nota}</span>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <span style={{ fontWeight:"700", fontSize:"12px", color:esD?"#e67e22":"#1a7a3a" }}>{esD?`-${p.medallones} u`:`+${p.medallones} u`}</span>
                      <button onClick={()=>{ if(confirm("¿Eliminar?")) setProduccionMedallon(prev=>prev.filter(x=>x.id!==p.id)); }} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:"14px",padding:"0 4px"}}>×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </RCard>
      )}
    </div>
  );
}

// ===================== LOGIN =====================
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [error, setError] = useState("");

  const login = () => {
    const em = email.trim().toLowerCase();
    const pw = pass.trim();
    if (!em || !pw) { setError("Completá todos los campos."); return; }
    const found = USUARIOS_FIJOS.find(u => u.email === em && u.password === pw);
    if (found) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email: em, isAdmin: found.isAdmin }));
      onLogin({ email: em, isAdmin: found.isAdmin });
    } else {
      setError("Email o contraseña incorrectos.");
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#16213e", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:"14px", padding:"40px 36px", width:"100%", maxWidth:"360px", boxShadow:"0 8px 40px #00000050" }}>
        <div style={{ textAlign:"center", marginBottom:"28px" }}>
          <div style={{ fontSize:"40px", marginBottom:"10px" }}>📦</div>
          <div style={{ fontWeight:"700", fontSize:"18px", color:"#16213e" }}>Central de Envíos</div>
          <div style={{ fontSize:"11px", color:"#888", marginTop:"4px" }}>Gestión de envíos entre locales</div>
        </div>
        <div style={{ marginBottom:"12px" }}>
          <div style={{ fontSize:"10px", color:"#888", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.08em" }}>Email</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="tu@email.com"
            style={{ width:"100%", padding:"10px 12px", border:"1px solid #ddd", borderRadius:"7px", fontSize:"13px", outline:"none" }} />
        </div>
        <div style={{ marginBottom:"20px" }}>
          <div style={{ fontSize:"10px", color:"#888", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.08em" }}>Contraseña</div>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="••••••••"
            style={{ width:"100%", padding:"10px 12px", border:"1px solid #ddd", borderRadius:"7px", fontSize:"13px", outline:"none" }} />
        </div>
        {error && <div style={{ background:"#fdecea", color:"#c0392b", borderRadius:"7px", padding:"8px 12px", fontSize:"11px", marginBottom:"14px", textAlign:"center" }}>{error}</div>}
        <button onClick={login} style={{ width:"100%", background:"#1a5276", color:"#fff", border:"none", borderRadius:"7px", padding:"11px", fontSize:"13px", fontWeight:"700", cursor:"pointer" }}>
          Ingresar
        </button>
      </div>
    </div>
  );
}

// ===================== MAIN APP =====================
const INITIAL_LOCALES = [
  { id:"bar-deportista", nombre:"Bar Deportista", color:"#c0392b" },
  { id:"bar-duendes",    nombre:"Bar Duendes",    color:"#2471a3" },
];

export default function App() {
  const [fbOk, setFbOk] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } });
  useEffect(() => { onFbConnected = setFbOk; }, []);

  const [locales,      setLocales]      = usePersisted("ce-locales",      INITIAL_LOCALES);
  const [allEnvios,    setAllEnvios]    = usePersisted("ce-envios",       {});
  const [usuarios,     setUsuarios]     = usePersisted("ce-users",        []);
  const [cookInsumos,  setCookInsumos]  = usePersisted("ce-cook-insumos", initialCookInsumos);
  const [salsas,       setSalsas]       = usePersisted("ce-salsas",       initialSalsasData);
  const [produccion,          setProduccion]          = usePersisted("ce-produccion",     []);
  const [produccionMedallon,  setProduccionMedallon]  = usePersisted("ce-prod-medallon",  []);
  const [costosFijos,         setCostosFijos]         = usePersisted("ce-costos-fijos",   []);
  const [stockInicial, setStockInicial] = usePersisted("ce-stock-inicial", {});
  const [ingresosStock,setIngresosStock]= usePersisted("ce-ingresos-stock",[]);
  const [pagos,        setPagos]        = usePersisted("ce-pagos",         {});

  const [selLocal, setSelLocal] = useState(null);
  const [tabLocal, setTabLocal] = useState(0);

  const logout = () => { localStorage.removeItem(SESSION_KEY); setCurrentUser(null); };
  if (!currentUser) return <LoginScreen onLogin={u => setCurrentUser(u)} />;

  const localActual = locales.find(l => l.id === selLocal);
  const getEnvios = id => allEnvios[id] || [];
  const setEnvios = (id, envs) => setAllEnvios({...allEnvios, [id]: envs});

  const headerTitle =
    selLocal==="locales"      ? "🏪 Gestión de locales"
    : selLocal==="usuarios"   ? "👥 Usuarios"
    : selLocal==="insumos"    ? "🛒 Insumos"
    : selLocal==="recetas"    ? "🧪 Recetas"
    : selLocal==="medallon"   ? "🥩 Receta Medallón"
    : selLocal==="produccion" ? "🏭 Producción"
    : selLocal==="costos"     ? "💰 Costos fijos"
    : selLocal==="stock"      ? "📊 Stock"
    : localActual             ? localActual.nombre
    : "← Seleccioná un local para comenzar";

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={{ padding:"20px 18px 16px", borderBottom:"1px solid #ffffff10" }}>
          <div style={{color:"#fff",fontWeight:"700",fontSize:"16px"}}>📦 Central de Envíos</div>
          <div style={{fontSize:"10px",marginTop:"4px",color:fbOk===true?"#6ee49a":fbOk===false?"#f1948a":"#667"}}>
            {fbOk===true?"☁️ sincronizado":fbOk===false?"⚠️ sin conexión":"⏳ conectando..."}
          </div>
        </div>

        <div style={{padding:"14px 18px 6px",fontSize:"10px",color:"#557",fontWeight:"700",letterSpacing:"1px"}}>LOCALES</div>
        {locales.map(l => (
          <button key={l.id} style={S.localBtn(selLocal===l.id, l.color)} onClick={()=>{setSelLocal(l.id);setTabLocal(0);}}>
            <div style={S.dot(l.color)}/>
            <span style={{flex:1}}>{l.nombre}</span>
            {getEnvios(l.id).filter(e=>!e.pagado).length > 0 && (
              <span style={{background:"#c0392b",color:"#fff",borderRadius:"10px",fontSize:"10px",padding:"1px 6px"}}>
                {getEnvios(l.id).filter(e=>!e.pagado).length}
              </span>
            )}
          </button>
        ))}

        <div style={{padding:"14px 18px 6px",fontSize:"10px",color:"#557",fontWeight:"700",letterSpacing:"1px",marginTop:"6px"}}>GESTIÓN</div>
        <button style={S.localBtn(selLocal==="locales","#7d3c98")} onClick={()=>setSelLocal("locales")}>
          <span>🏪</span> Locales
        </button>
        {currentUser?.isAdmin && (
          <button style={S.localBtn(selLocal==="usuarios","#d35400")} onClick={()=>setSelLocal("usuarios")}>
            <span>👥</span> Usuarios
          </button>
        )}

        <div style={{padding:"14px 18px 6px",fontSize:"10px",color:"#557",fontWeight:"700",letterSpacing:"1px",marginTop:"6px"}}>COCINA</div>
        <button style={S.localBtn(selLocal==="insumos","#117a65")} onClick={()=>setSelLocal("insumos")}>
          <span>🛒</span> Insumos
        </button>
        <button style={S.localBtn(selLocal==="recetas","#1a7a3a")} onClick={()=>setSelLocal("recetas")}>
          <span>🧪</span> Recetas
        </button>
        <button style={S.localBtn(selLocal==="medallon","#8b4513")} onClick={()=>setSelLocal("medallon")}>
          <span>🥩</span> Medallón
        </button>
        <button style={S.localBtn(selLocal==="produccion","#e67e22")} onClick={()=>setSelLocal("produccion")}>
          <span>🏭</span> Producción
        </button>
        <button style={S.localBtn(selLocal==="stock","#2471a3")} onClick={()=>setSelLocal("stock")}>
          <span>📊</span> Stock
        </button>
        <button style={S.localBtn(selLocal==="costos","#c0392b")} onClick={()=>setSelLocal("costos")}>
          <span>💰</span> Costos fijos
        </button>

        <div style={{marginTop:"auto",borderTop:"1px solid #ffffff10",padding:"12px 14px"}}>
          <div style={{fontSize:"9px",color:"#446",fontWeight:"700",letterSpacing:"1px",marginBottom:"6px"}}>SESIÓN</div>
          <div style={{fontSize:"10px",color:"#667",marginBottom:"8px",wordBreak:"break-all"}}>{currentUser?.email}</div>
          <button onClick={logout}
            style={{width:"100%",background:"transparent",border:"1px solid #334",borderRadius:"6px",padding:"6px 10px",cursor:"pointer",fontSize:"10px",color:"#889",textAlign:"left"}}>
            ↩ Cerrar sesión
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={S.main}>
        <div style={{background:"#fff",borderBottom:"1px solid #e8e8e8",padding:"13px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:"52px"}}>
          <div style={{fontWeight:"700",fontSize:"15px",color:"#1a2e1a"}}>{headerTitle}</div>
          {localActual && (
            <div style={{display:"flex",gap:"4px"}}>
              <button style={S.tab(tabLocal===0)} onClick={()=>setTabLocal(0)}>📤 Nuevo Envío</button>
              <button style={S.tab(tabLocal===1)} onClick={()=>setTabLocal(1)}>📋 Historial / Deuda</button>
            </div>
          )}
        </div>

        {!selLocal && (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"75vh",flexDirection:"column",gap:"12px",color:"#aaa"}}>
            <div style={{fontSize:"52px"}}>📦</div>
            <div style={{fontSize:"16px"}}>Seleccioná un local del panel izquierdo</div>
          </div>
        )}
        {selLocal==="locales"     && <LocalesTab locales={locales} setLocales={setLocales} />}
        {selLocal==="usuarios"    && currentUser?.isAdmin && <UsuariosTab usuarios={usuarios} setUsuarios={setUsuarios} />}
        {selLocal==="insumos"     && <InsumosTab insumos={cookInsumos} setInsumos={setCookInsumos} />}
        {selLocal==="recetas"     && <SalsasTab salsas={salsas} setSalsas={setSalsas} cookInsumos={cookInsumos} />}
        {selLocal==="medallon"    && <MedallonTab produccionMedallon={produccionMedallon} setProduccionMedallon={setProduccionMedallon} locales={locales} />}
        {selLocal==="produccion"  && <ProduccionTab salsas={salsas} cookInsumos={cookInsumos} produccion={produccion} setProduccion={setProduccion} locales={locales} />}
        {selLocal==="stock"       && <StockTab cookInsumos={cookInsumos} stockInicial={stockInicial} setStockInicial={setStockInicial} ingresosStock={ingresosStock} setIngresosStock={setIngresosStock} salsas={salsas} produccion={produccion} allEnvios={allEnvios} produccionMedallon={produccionMedallon} />}
        {selLocal==="costos"      && <CostosFijosTab costosFijos={costosFijos} setCostosFijos={setCostosFijos} />}
        {localActual && tabLocal===0 && <NuevoEnvio local={localActual} insumos={cookInsumos} onGuardar={env=>{setEnvios(localActual.id,[env,...getEnvios(localActual.id)]);setTabLocal(1);}} />}
        {localActual && tabLocal===1 && <Historial local={localActual} envios={getEnvios(localActual.id)} setEnvios={envs=>setEnvios(localActual.id,envs)} produccion={produccion} produccionMedallon={produccionMedallon} salsas={salsas} pagos={pagos} setPagos={setPagos} />}
      </div>
    </div>
  );
}
