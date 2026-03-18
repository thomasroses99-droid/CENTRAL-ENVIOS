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
function Historial({ local, envios, setEnvios }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [expandido, setExpandido] = useState(null);

  const filtrados = envios
    .filter(e => (!desde || e.fecha >= desde) && (!hasta || e.fecha <= hasta))
    .sort((a,b) => b.fecha.localeCompare(a.fecha));

  const pendiente = filtrados.filter(e=>!e.pagado).reduce((s,e)=>s+e.total,0);
  const pagado    = filtrados.filter(e=>e.pagado).reduce((s,e)=>s+e.total,0);

  const togglePagado = id => setEnvios(envios.map(e => e.id!==id ? e : {...e, pagado:!e.pagado}));
  const eliminar = id => { if (confirm("¿Eliminar este envío?")) setEnvios(envios.filter(e=>e.id!==id)); };

  return (
    <div style={{ maxWidth:"900px", margin:"0 auto", padding:"24px" }}>
      <h2 style={{ margin:"0 0 20px", color:"#1a2e1a" }}>Historial / Deuda — {local.nombre}</h2>

      <div style={S.card}>
        <div style={{ display:"flex", gap:"16px", flexWrap:"wrap", alignItems:"flex-end" }}>
          <div><label style={S.label}>Desde</label><input type="date" value={desde} onChange={e=>setDesde(e.target.value)} style={S.inp} /></div>
          <div><label style={S.label}>Hasta</label><input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} style={S.inp} /></div>
          <button onClick={()=>{setDesde("");setHasta("");}} style={{...S.btn("#888"),fontSize:"12px",padding:"7px 14px"}}>Limpiar filtro</button>
        </div>
      </div>

      {filtrados.length > 0 && (
        <div style={{ display:"flex", gap:"12px", marginBottom:"16px", flexWrap:"wrap" }}>
          {[
            {label:"DEUDA PENDIENTE", val:pendiente, color:"#c0392b"},
            {label:"TOTAL PAGADO",    val:pagado,    color:"#27ae60"},
            {label:"TOTAL PERÍODO",   val:pendiente+pagado, color:"#1a2e1a"},
          ].map(({label,val,color})=>(
            <div key={label} style={{...S.card, flex:1, margin:0, textAlign:"center", borderTop:`3px solid ${color}`}}>
              <div style={{fontSize:"11px",color:"#888"}}>{label}</div>
              <div style={{fontSize:"22px",fontWeight:"700",color}}>{fmt(val)}</div>
              <div style={{fontSize:"11px",color:"#aaa"}}>{filtrados.filter(e=>label==="DEUDA PENDIENTE"?!e.pagado:label==="TOTAL PAGADO"?e.pagado:true).length} envíos</div>
            </div>
          ))}
        </div>
      )}

      {filtrados.length===0 && <div style={{...S.card,textAlign:"center",color:"#888"}}>No hay envíos en este período.</div>}

      {filtrados.map(e => (
        <div key={e.id} style={{...S.card, borderLeft:`4px solid ${e.pagado?"#27ae60":"#c0392b"}`}}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"8px" }}>
            <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
              <div>
                <div style={{fontWeight:"700",fontSize:"14px"}}>{e.fecha}</div>
                {e.nota && <div style={{fontSize:"12px",color:"#888"}}>{e.nota}</div>}
              </div>
              <Tag color={e.pagado?"#27ae60":"#c0392b"}>{e.pagado?"PAGADO":"PENDIENTE"}</Tag>
            </div>
            <div style={{ display:"flex", gap:"12px", alignItems:"center", flexWrap:"wrap" }}>
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
                      <td style={S.td}>{it.nombre}</td>
                      <td style={S.td}>{it.cantidad}</td>
                      <td style={S.td}>{it.unidad}</td>
                      <td style={S.td}>{fmt(it.precio_unidad)}</td>
                      <td style={S.td}>{it.merma_pct>0 ? <Tag color="#e67e22">{it.merma_pct}%</Tag> : <span style={{color:"#ccc"}}>—</span>}</td>
                      <td style={S.td}><strong>{fmt(it.subtotal ?? it.cantidad*it.precio_unidad)}</strong></td>
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

// ===================== MAIN APP =====================
const INITIAL_LOCALES = [
  { id:"bar-deportista", nombre:"Bar Deportista", color:"#c0392b" },
  { id:"bar-duendes",    nombre:"Bar Duendes",    color:"#2471a3" },
];

export default function App() {
  const [fbOk, setFbOk] = useState(null);
  useEffect(() => { onFbConnected = setFbOk; }, []);

  const [locales,   setLocales]   = usePersisted("ce-locales",  INITIAL_LOCALES);
  const [insumos,   setInsumos]   = usePersisted("ce-insumos",  []);
  const [allEnvios, setAllEnvios] = usePersisted("ce-envios",   {});

  const [selLocal, setSelLocal] = useState(null);
  const [tabLocal, setTabLocal] = useState(0); // 0=nuevo envío, 1=historial

  const localActual = locales.find(l => l.id === selLocal);
  const getEnvios = id => allEnvios[id] || [];
  const setEnvios = (id, envs) => setAllEnvios({...allEnvios, [id]: envs});

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

        <div style={{padding:"14px 18px 6px",fontSize:"10px",color:"#557",fontWeight:"700",letterSpacing:"1px",marginTop:"6px"}}>GENERAL</div>
        <button style={S.localBtn(selLocal==="insumos","#27ae60")} onClick={()=>setSelLocal("insumos")}>
          <span>🛒</span> Insumos
        </button>
        <button style={S.localBtn(selLocal==="locales","#7d3c98")} onClick={()=>setSelLocal("locales")}>
          <span>🏪</span> Locales
        </button>
      </div>

      {/* MAIN */}
      <div style={S.main}>
        <div style={{background:"#fff",borderBottom:"1px solid #e8e8e8",padding:"13px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:"52px"}}>
          <div style={{fontWeight:"700",fontSize:"15px",color:"#1a2e1a"}}>
            {selLocal==="insumos" ? "🛒 Insumos y precios"
              : selLocal==="locales" ? "🏪 Gestión de locales"
              : localActual ? localActual.nombre
              : "← Seleccioná un local para comenzar"}
          </div>
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
        {selLocal==="insumos" && <InsumosTab insumos={insumos} setInsumos={setInsumos} />}
        {selLocal==="locales" && <LocalesTab locales={locales} setLocales={setLocales} />}
        {localActual && tabLocal===0 && <NuevoEnvio local={localActual} insumos={insumos} onGuardar={env=>{setEnvios(localActual.id,[env,...getEnvios(localActual.id)]);setTabLocal(1);}} />}
        {localActual && tabLocal===1 && <Historial local={localActual} envios={getEnvios(localActual.id)} setEnvios={envs=>setEnvios(localActual.id,envs)} />}
      </div>
    </div>
  );
}
