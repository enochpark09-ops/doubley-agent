import { useState, useRef, useEffect } from "react";
import CalendarTab from "./CalendarTab.jsx";
import PlannerTab from "./PlannerTab.jsx";
import BackupTab from "./BackupTab.jsx";
import PlanningDeptTab from "./PlanningDeptTab.jsx";
import StrategistTab from "./StrategistTab.jsx";

const C = {
  bg: "#1a1a18", surface: "#242422", surface2: "#2a2a27", border: "#3a3a36",
  gold: "#C4A86C", goldDim: "#c4a86c33", bronze: "#8B7355",
  text: "#e8e4dc", textMuted: "#9a9690", textDim: "#6a6660",
  green: "#6dcc7a", greenDim: "#6dcc7a22", red: "#e07070", redDim: "#e0707022", blue: "#7aabcc",
};

const callClaude = async (messages, system, max_tokens = 1000) => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-5-20250929", max_tokens, system, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || "";
};

// ── localStorage 헬퍼 ─────────────────────────────────────────
const ls = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const Ic = ({ n, s = 16 }) => {
  const d = {
    bot: <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><circle cx="19" cy="7" r="2" fill="currentColor" stroke="none" opacity=".5"/></>,
    chart: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    mic: <><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
    micOff: <><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></>,
    spin: <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>,
    cal: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    pdf: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6M9 17h4"/></>,
    back: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    cloud: <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d[n]}</svg>;
};

const BottomTab = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, padding:"9px 0 7px", background:"transparent", border:"none", color:active?C.gold:C.textDim, cursor:"pointer", fontSize:9, fontFamily:"inherit", fontWeight:active?700:400, borderTop:`2px solid ${active?C.gold:"transparent"}`, transition:"all .2s" }}>
    {icon}{label}
  </button>
);

// ── 체크리스트 헬퍼 ──────────────────────────────────────────
const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const FIXED_ITEMS = [
  { id:"qt",      emoji:"✝️", label:"QT" },
  { id:"prayer",  emoji:"🙏", label:"기도 30분" },
  { id:"workout", emoji:"🏃", label:"새벽운동" },
  { id:"politics",emoji:"🎙️", label:"정치 BluntEdge 콘텐츠" },
  { id:"sports",  emoji:"⚽", label:"스포츠 EdgeStats 콘텐츠" },
  { id:"economy", emoji:"📈", label:"경제 MarketEdge" },
  { id:"novel",   emoji:"📖", label:"웹소설 집필" },
  { id:"music",   emoji:"🎵", label:"음원 만들기" },
];
const loadCL = () => {
  const d = todayStr();
  return ls.get(`cl_v2_${d}`, { fixed: {}, planner: {} });
};
const saveCL = (d, data) => ls.set(`cl_v2_${d}`, data);

const getPlannerData = () => {
  const d = todayStr();
  const top3 = ls.get(`planner_top3_${d}`, []);
  const ptodos = ls.get(`planner_todos_${d}`, []);
  return [
    ...top3.filter(t => t).map((t, i) => ({ id: `p_top_${i}`, emoji: "📌", label: t })),
    ...ptodos.filter(t => t.text).map((t, i) => ({ id: `p_todo_${i}`, emoji: "✅", label: t.text })),
  ];
};
const saveTodoToPlanner = (text) => {
  const d = todayStr();
  const existing = ls.get(`planner_todos_${d}`, []);
  if (!existing.find(t => t.text === text))
    ls.set(`planner_todos_${d}`, [...existing, { text, done: false, stars: 0 }]);
};
const syncDoneToPlanner = (text, done) => {
  const d = todayStr();
  const existing = ls.get(`planner_todos_${d}`, []);
  ls.set(`planner_todos_${d}`, existing.map(t => t.text === text ? { ...t, done } : t));
};

// ══════════════════════════════════════════════════════════════
// 할일 뷰
// ══════════════════════════════════════════════════════════════
const TodosView = ({ newTodo, setNewTodo, addTodo }) => {
  const today = todayStr();
  const [plannerTop3, setPlannerTop3] = useState(() => ls.get(`planner_top3_${today}`, []));
  const [plannerTodos, setPlannerTodos] = useState(() => ls.get(`planner_todos_${today}`, []));

  useEffect(() => {
    const reload = () => {
      setPlannerTop3(ls.get(`planner_top3_${today}`, []));
      setPlannerTodos(ls.get(`planner_todos_${today}`, []));
    };
    reload();
    window.addEventListener("focus", reload);
    window.addEventListener("storage", reload);
    return () => { window.removeEventListener("focus", reload); window.removeEventListener("storage", reload); };
  }, [today]);

  const priorities = plannerTop3.filter(t => t);
  const filteredTodos = plannerTodos.filter(t => t.text);

  const toggleTodo = (idx) => {
    const updated = plannerTodos.map((t, i) => i === idx ? { ...t, done: !t.done } : t);
    ls.set(`planner_todos_${today}`, updated);
    setPlannerTodos(updated);
  };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:14 }}>
      <div style={{ background:C.goldDim, borderRadius:10, padding:"10px 13px", marginBottom:12, border:`1px solid ${C.gold}44` }}>
        <div style={{ fontSize:12, fontWeight:600, color:C.gold, marginBottom:3 }}>📋 플래너 자동 연동</div>
        <div style={{ fontSize:11, color:C.textMuted, lineHeight:1.6 }}>
          여기서 추가 → 오늘 플래너 TO-DO에 자동 저장<br/>
          플래너에서 입력한 내용이 여기에 표시됩니다
        </div>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <input value={newTodo} onChange={e=>setNewTodo(e.target.value)}
          onKeyDown={e=>{
            if(e.key==="Enter" && newTodo.trim()) {
              addTodo(newTodo);
              setNewTodo("");
              setTimeout(() => setPlannerTodos(ls.get(`planner_todos_${today}`, [])), 50);
            }
          }}
          placeholder="할일 입력 (오늘 플래너에 자동 추가)"
          style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, padding:"11px 13px", fontSize:13, outline:"none", fontFamily:"inherit" }}/>
        <button onClick={()=>{
          if(!newTodo.trim()) return;
          addTodo(newTodo);
          setNewTodo("");
          setTimeout(() => setPlannerTodos(ls.get(`planner_todos_${today}`, [])), 50);
        }} disabled={!newTodo.trim()}
          style={{ width:42, height:42, borderRadius:10, background:newTodo.trim()?C.goldDim:C.border, border:`1px solid ${newTodo.trim()?C.gold:C.border}`, color:newTodo.trim()?C.gold:C.textDim, cursor:newTodo.trim()?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Ic n="plus" s={18}/>
        </button>
      </div>
      {priorities.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, color:C.gold, fontWeight:700, letterSpacing:1, marginBottom:8 }}>📌 오늘의 우선순위</div>
          {priorities.map((t, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 13px", marginBottom:6, background:C.surface, borderRadius:10, border:`1px solid ${C.gold}33` }}>
              <div style={{ fontSize:12, color:C.gold, fontWeight:700, width:16 }}>{i+1}.</div>
              <span style={{ flex:1, fontSize:13, color:C.text }}>{t}</span>
              <span style={{ fontSize:9, color:C.textDim, background:C.goldDim, padding:"2px 6px", borderRadius:4 }}>우선순위</span>
            </div>
          ))}
        </div>
      )}
      {filteredTodos.length > 0 && (
        <div>
          <div style={{ fontSize:10, color:C.textMuted, fontWeight:700, letterSpacing:1, marginBottom:8 }}>✅ 오늘의 TO-DO</div>
          {filteredTodos.map((t, i) => {
            const origIdx = plannerTodos.findIndex((p, pi) => p.text === t.text && plannerTodos.indexOf(p) === pi);
            return (
              <div key={i} onClick={() => toggleTodo(origIdx === -1 ? i : origIdx)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 13px", marginBottom:6, background:C.surface, borderRadius:10, border:`1px solid ${t.done?C.gold+"44":C.border}`, cursor:"pointer", opacity:t.done?0.75:1, transition:"opacity .15s" }}>
                <div style={{ width:20, height:20, borderRadius:4, border:`1.5px solid ${t.done?C.gold:C.border}`, background:t.done?C.gold:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#1a1a18" }}>
                  {t.done && <Ic n="check" s={12}/>}
                </div>
                <span style={{ flex:1, fontSize:13, color:t.done?C.textDim:C.text, textDecoration:t.done?"line-through":"none" }}>{t.text}</span>
              </div>
            );
          })}
        </div>
      )}
      {priorities.length === 0 && filteredTodos.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 0", color:C.textDim, fontSize:12, lineHeight:2 }}>
          위 입력창에서 할일을 추가하거나<br/>
          플래너 탭 → 날짜 선택 → TO-DO 입력<br/>
          <span style={{ fontSize:10 }}>입력하면 여기에 자동으로 표시됩니다</span>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// AI 비서 탭
// ══════════════════════════════════════════════════════════════
const AssistantTab = ({ todos, setTodos }) => {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "안녕하세요, Enoch님! 🌙\nDouble Y Space AI 비서입니다.\n일정·할일·사업 조언 무엇이든 말씀해 주세요. 🎤 음성 입력도 가능해요!",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [newTodo, setNewTodo] = useState("");
  const [view, setView] = useState("chat");
  const chatRef = useRef(null);
  const recRef = useRef(null);
  const today = todayStr();

  const [clData, setClData] = useState(() => loadCL());
  const [plannerItems, setPlannerItems] = useState(getPlannerData);
  const clFixed = clData.fixed || {};
  const clPlanner = clData.planner || {};
  const clTotal = FIXED_ITEMS.length + plannerItems.length;
  const clDone = Object.values(clFixed).filter(Boolean).length + Object.values(clPlanner).filter(Boolean).length;
  const clPct = clTotal > 0 ? Math.round(clDone / clTotal * 100) : 0;

  useEffect(() => { saveCL(today, clData); }, [clData]);
  useEffect(() => { if (view === "checklist") setPlannerItems(getPlannerData()); }, [view]);

  const toggleFixed = id => setClData(p => ({ ...p, fixed: { ...p.fixed, [id]: !p.fixed[id] } }));
  const togglePlanner = id => setClData(p => ({ ...p, planner: { ...p.planner, [id]: !p.planner[id] } }));

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "ko-KR"; rec.continuous = false; rec.interimResults = true;
    rec.onresult = e => setInput(Array.from(e.results).map(r => r[0].transcript).join(""));
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
  }, []);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const toggleMic = () => {
    if (!recRef.current) { alert("음성 인식 미지원"); return; }
    if (listening) { recRef.current.stop(); } else { setInput(""); recRef.current.start(); setListening(true); }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setInput(""); setLoading(true);
    try {
      const reply = await callClaude(
        newMsgs.map(m => ({ role: m.role, content: m.content })),
        `당신은 Enoch의 AI 비서. Double Y Space(성남): 스마트스토어·웹소설·Suno·커피앱 운영중. 할일: ${todos.map(t => `[${t.done?"완료":"미완"}]${t.text}`).join(",")}. 친근하게 3~5문장 한국어.`
      );
      setMessages([...newMsgs, { role: "assistant", content: reply }]);
    } catch (e) {
      const msg = e.message === "API_KEY_MISSING"
        ? "⚠️ API 키가 설정되지 않았습니다.\nVercel → Settings → Environment Variables에서\nVITE_ANTHROPIC_API_KEY를 추가 후 Redeploy 해주세요."
        : `⚠️ 오류: ${e.message}\n잠시 후 다시 시도해 주세요.`;
      setMessages([...newMsgs, { role: "assistant", content: msg }]);
    }
    setLoading(false);
  };

  const addTodo = (text) => {
    if (!text.trim()) return;
    setTodos(prev => [...prev, { id: Date.now(), text: text.trim(), done: false }]);
    saveTodoToPlanner(text.trim());
  };
  const toggleTodo = (id, text, done) => {
    setTodos(prev => prev.map(x => x.id === id ? { ...x, done: !x.done } : x));
    syncDoneToPlanner(text, !done);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        {[["chat", "💬 대화"], ["checklist", "☑️ 체크리스트"], ["todos", "✅ 할일"]].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} style={{ flex:1, padding:"11px 0", background:"transparent", border:"none", borderBottom:`2px solid ${view===id?C.gold:"transparent"}`, color:view===id?C.gold:C.textMuted, fontSize:12, fontFamily:"inherit", cursor:"pointer", fontWeight:view===id?600:400 }}>{label}</button>
        ))}
      </div>

      {view === "chat" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:"14px 14px 8px", display:"flex", flexDirection:"column", gap:10 }}>
            {messages.map((m,i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"82%", padding:"10px 13px", borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", background:m.role==="user"?C.gold:C.surface, color:m.role==="user"?"#1a1a18":C.text, fontSize:14, lineHeight:1.65, whiteSpace:"pre-wrap", border:m.role==="assistant"?`1px solid ${C.border}`:"none" }}>{m.content}</div>
              </div>
            ))}
            {loading && <div style={{ display:"flex", alignItems:"center", gap:6, color:C.textMuted, fontSize:12 }}><div style={{ animation:"spin 1s linear infinite", color:C.gold }}><Ic n="spin" s={13}/></div>생각 중...</div>}
          </div>
          <div style={{ padding:"10px 12px", borderTop:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"center", flexShrink:0, paddingBottom:"env(safe-area-inset-bottom,10px)" }}>
            <button onClick={toggleMic} style={{ width:42, height:42, borderRadius:10, border:`1.5px solid ${listening?C.red:C.border}`, background:listening?C.redDim:C.bg, color:listening?C.red:C.textMuted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Ic n={listening?"micOff":"mic"} s={17}/></button>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={listening?"🔴 음성 인식 중...":"메시지 입력..."} style={{ flex:1, background:C.bg, border:`1px solid ${listening?C.red+"66":C.border}`, borderRadius:10, color:C.text, padding:"11px 13px", fontSize:14, outline:"none", fontFamily:"inherit" }}/>
            <button onClick={send} disabled={loading||!input.trim()} style={{ width:42, height:42, borderRadius:10, background:input.trim()&&!loading?C.gold:C.border, border:"none", color:input.trim()&&!loading?"#1a1a18":C.textDim, cursor:input.trim()&&!loading?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Ic n="send" s={16}/></button>
          </div>
        </div>
      )}

      {view === "checklist" && (
        <div style={{ flex:1, overflowY:"auto", padding:14 }}>
          <div style={{ background:C.surface, borderRadius:12, padding:14, marginBottom:14, border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.text }}>오늘의 달성률</div>
              <div style={{ fontSize:20, fontWeight:800, color:clPct===100?C.green:C.gold }}>{clPct}%</div>
            </div>
            <div style={{ height:8, background:C.border, borderRadius:4 }}>
              <div style={{ height:"100%", borderRadius:4, background:clPct===100?`linear-gradient(90deg,${C.green},#4aff7a)`:`linear-gradient(90deg,${C.bronze},${C.gold})`, width:`${clPct}%`, transition:"width .5s ease" }}/>
            </div>
            <div style={{ fontSize:11, color:C.textDim, marginTop:6, textAlign:"center" }}>{clDone} / {clTotal} 완료 {clPct===100?"🎉 오늘 하루 완주!":""}</div>
          </div>
          {plannerItems.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:C.gold, fontWeight:700, letterSpacing:1, marginBottom:8 }}>📋 플래너 연동 ({plannerItems.filter(p=>clPlanner[p.id]).length}/{plannerItems.length})</div>
              {plannerItems.map(item => (
                <div key={item.id} onClick={()=>togglePlanner(item.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", marginBottom:6, background:C.surface, borderRadius:10, border:`1px solid ${clPlanner[item.id]?C.gold+"55":C.border}`, cursor:"pointer", opacity:clPlanner[item.id]?0.7:1 }}>
                  <div style={{ width:22, height:22, borderRadius:5, border:`2px solid ${clPlanner[item.id]?C.gold:C.border}`, background:clPlanner[item.id]?C.gold:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#1a1a18" }}>{clPlanner[item.id]&&<Ic n="check" s={13}/>}</div>
                  <span style={{ fontSize:11 }}>{item.emoji}</span>
                  <span style={{ flex:1, fontSize:13, color:clPlanner[item.id]?C.textDim:C.text, textDecoration:clPlanner[item.id]?"line-through":"none" }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
          <div>
            <div style={{ fontSize:10, color:C.gold, fontWeight:700, letterSpacing:1, marginBottom:8 }}>⭐ 고정 루틴 ({Object.values(clFixed).filter(Boolean).length}/{FIXED_ITEMS.length})</div>
            {FIXED_ITEMS.map(item => (
              <div key={item.id} onClick={()=>toggleFixed(item.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 14px", marginBottom:6, background:C.surface, borderRadius:10, border:`1px solid ${clFixed[item.id]?C.gold+"55":C.border}`, cursor:"pointer", opacity:clFixed[item.id]?0.7:1, transition:"all .15s" }}>
                <div style={{ width:22, height:22, borderRadius:5, border:`2px solid ${clFixed[item.id]?C.gold:C.border}`, background:clFixed[item.id]?C.gold:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#1a1a18" }}>{clFixed[item.id]&&<Ic n="check" s={13}/>}</div>
                <span style={{ fontSize:15 }}>{item.emoji}</span>
                <span style={{ flex:1, fontSize:14, color:clFixed[item.id]?C.textDim:C.text, textDecoration:clFixed[item.id]?"line-through":"none" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "todos" && <TodosView newTodo={newTodo} setNewTodo={setNewTodo} addTodo={addTodo}/>}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// 에이전트 실행 탭
// ══════════════════════════════════════════════════════════════
// ── (AGENTS/SUGGESTED_AGENTS/STATUS_CONFIG 제거 — AgentTab 단순화로 불필요) ──

const AgentTab = () => {
  const agentLinks = [
    { name: "Double Y Agent", emoji: "🏠", url: "https://doubley-agent.vercel.app", status: "active", desc: "통합 에이전트 스튜디오" },
    { name: "EdgeStats PWA", emoji: "⚽", url: "https://sports-agent-pwa.vercel.app", status: "active", desc: "KBO/MLB 파워 랭킹 & 분석" },
    { name: "MarketEdge Agent", emoji: "📈", url: "https://mf-stock-agent.vercel.app", status: "active", desc: "AI 경제·주식·선물 분석" },
    { name: "Suno Agent", emoji: "🎵", url: "https://suno-agent.vercel.app", status: "active", desc: "AI 음악 생성 & 배급" },
    { name: "BluntEdge 블로그", emoji: "🎙️", url: "https://thebluntedge.com", status: "active", desc: "정치 시사 평론 블로그" },
    { name: "onedo4u 블로그", emoji: "☕", url: "https://onedo4u.com", status: "setup", desc: "라이프스타일 웹진" },
    { name: "스마트스토어", emoji: "🏪", url: "https://smartstore.naver.com/yourspaceyy", status: "active", desc: "더블와이스페이스 일본 소품" },
    { name: "Keiba Agent", emoji: "🏇", url: "https://keiba-agent-pwa.vercel.app", status: "active", desc: "JRA/NAR 경마 예측" },
  ];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ flex:1, overflowY:"auto", padding:14 }}>
        <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 12 }}>에이전트 / 서비스 바로가기</div>
        {agentLinks.map((a, i) => {
          const isActive = a.status === "active";
          return (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 6, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, opacity: isActive ? 1 : 0.65 }}>
              <span style={{ fontSize: 24 }}>{a.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{a.name}</div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{a.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 8, padding: "2px 8px", borderRadius: 10, background: isActive ? "#00d4aa18" : C.goldDim, color: isActive ? "#00d4aa" : C.gold, fontWeight: 700 }}>{isActive ? "● LIVE" : "◐ SETUP"}</span>
                <span style={{ fontSize: 16, color: C.textDim }}>→</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

// ── (구 AgentTab 상세 코드 제거 완료) ──

// ══════════════════════════════════════════════════════════════
// 크리에이터 탭 — 카테고리별 채널 링크 관리
// ══════════════════════════════════════════════════════════════
// 크리에이터 탭 — 카테고리별 채널 링크 관리 (편집·등록·진행률 추적)
// ══════════════════════════════════════════════════════════════
const CREATOR_CHANNELS_DEFAULT = [
  { category: "정치", emoji: "🎙️", color: "#e07070", channels: [
    { platform: "YouTube", handle: "@wjdcldbxnqj", url: "https://youtube.com/@wjdcldbxnqj", opened: true },
    { platform: "BluntEdge", handle: "thebluntedge.com", url: "https://thebluntedge.com", opened: true },
    { platform: "X", handle: "@blunt_edge_", url: "https://x.com/blunt_edge_", opened: true },
  ]},
  { category: "스포츠", emoji: "⚽", color: "#7aabcc", channels: [
    { platform: "YouTube", handle: "@EdgeStats", url: "https://youtube.com/@EdgeStats", opened: true },
    { platform: "X", handle: "@sportsedgestats", url: "https://x.com/sportsedgestats", opened: true },
    { platform: "Instagram", handle: "@edgestats_", url: "https://instagram.com/edgestats_", opened: true },
  ]},
  { category: "경제", emoji: "📈", color: "#00d4aa", channels: [
    { platform: "YouTube", handle: "@MarketEdgeHanok", url: "https://youtube.com/@MarketEdgeHanok", opened: true },
    { platform: "X", handle: "@market_edge_", url: "https://x.com/market_edge_", opened: true },
  ]},
  { category: "라이프", emoji: "☕", color: C.bronze, channels: [
    { platform: "YouTube", handle: "", url: "", opened: false },
    { platform: "onedo4u", handle: "onedo4u.com", url: "https://onedo4u.com", opened: true },
    { platform: "X", handle: "", url: "", opened: false },
    { platform: "Instagram", handle: "", url: "", opened: false },
  ]},
  { category: "문화예술", emoji: "🎨", color: "#ccaa5a", channels: [
    { platform: "onedo4u", handle: "", url: "", opened: false },
    { platform: "X", handle: "", url: "", opened: false },
    { platform: "Instagram", handle: "", url: "", opened: false },
  ]},
  { category: "철학", emoji: "📜", color: "#9a8ec0", channels: [
    { platform: "YouTube", handle: "", url: "", opened: false },
    { platform: "X", handle: "", url: "", opened: false },
  ]},
  { category: "웹소설", emoji: "📖", color: "#a07acc", channels: [
    { platform: "조아라", handle: "", url: "", opened: false },
    { platform: "문피아", handle: "", url: "", opened: false },
  ]},
  { category: "음원", emoji: "🎵", color: "#7aabcc", channels: [
    { platform: "DistroKid", handle: "Hanokh", url: "", opened: true },
  ]},
  { category: "스토어", emoji: "🏪", color: "#5ac0a0", channels: [
    { platform: "스마트스토어", handle: "yourspaceyy", url: "https://smartstore.naver.com/yourspaceyy", opened: true },
  ]},
];

const CREATOR_LS_KEY = "hanok_creator_channels_v2";

// 저장된 오버라이드를 기본값 위에 병합
function loadCreatorChannels() {
  try {
    const saved = JSON.parse(localStorage.getItem(CREATOR_LS_KEY) || "{}");
    return CREATOR_CHANNELS_DEFAULT.map(cat => ({
      ...cat,
      channels: cat.channels.map(ch => {
        const ov = saved[`${cat.category}__${ch.platform}`];
        return ov ? { ...ch, ...ov } : ch;
      }),
    }));
  } catch {
    return CREATOR_CHANNELS_DEFAULT;
  }
}

function saveCreatorOverride(category, platform, patch) {
  try {
    const cur = JSON.parse(localStorage.getItem(CREATOR_LS_KEY) || "{}");
    const k = `${category}__${platform}`;
    cur[k] = { ...(cur[k] || {}), ...patch };
    localStorage.setItem(CREATOR_LS_KEY, JSON.stringify(cur));
  } catch (e) {
    console.error("채널 저장 실패", e);
  }
}

const CreatorTab = () => {
  const [data, setData] = useState(loadCreatorChannels);
  const [editing, setEditing] = useState(null); // `${category}__${platform}` 또는 null
  const [form, setForm] = useState({ handle: "", url: "", opened: false });

  const total = data.reduce((n, c) => n + c.channels.length, 0);
  const openedCount = data.reduce((n, c) => n + c.channels.filter(ch => ch.opened).length, 0);
  const pct = total ? Math.round((openedCount / total) * 100) : 0;

  const startEdit = (cat, ch) => {
    setEditing(`${cat.category}__${ch.platform}`);
    setForm({ handle: ch.handle || "", url: ch.url || "", opened: !!ch.opened });
  };
  const cancelEdit = () => { setEditing(null); };

  const saveEdit = (cat, ch) => {
    const patch = { handle: form.handle.trim(), url: form.url.trim(), opened: form.opened };
    saveCreatorOverride(cat.category, ch.platform, patch);
    setData(prev => prev.map(c => c.category !== cat.category ? c : ({
      ...c,
      channels: c.channels.map(x => x.platform === ch.platform ? { ...x, ...patch } : x),
    })));
    setEditing(null);
  };

  const resetAll = () => {
    if (!window.confirm("채널 링크를 모두 기본값으로 되돌릴까요? 직접 등록한 URL이 삭제됩니다.")) return;
    try { localStorage.removeItem(CREATOR_LS_KEY); } catch {}
    setData(loadCreatorChannels());
    setEditing(null);
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "8px 10px", marginBottom: 6,
    fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}`,
    background: C.bg, color: C.text, fontFamily: "'IBM Plex Mono', monospace",
  };
  const btn = (bg, brd, col) => ({
    fontSize: 11, padding: "5px 12px", borderRadius: 6, background: bg,
    border: `1px solid ${brd}`, color: col, fontWeight: 600, cursor: "pointer",
  });

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ flex:1, overflowY:"auto", padding:14 }}>
        {/* 진행률 요약 */}
        <div style={{ marginBottom: 14, background: C.surface, borderRadius: 12, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: 1 }}>채널 가동 현황</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{openedCount} / {total} <span style={{ fontSize: 11, color: C.textDim }}>({pct}%)</span></span>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: `${C.border}66`, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: C.gold, transition: "width .3s" }} />
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
          <span style={{ fontSize: 10, color: C.textDim, letterSpacing: 1 }}>카테고리별 채널 링크</span>
          <span onClick={resetAll} style={{ fontSize: 10, color: C.textDim, cursor: "pointer", textDecoration: "underline" }}>기본값 복원</span>
        </div>

        {data.map(cat => {
          const catOpened = cat.channels.filter(c => c.opened).length;
          return (
          <div key={cat.category} style={{ marginBottom: 12, background: C.surface, borderRadius: 12, padding: 14, border: `1px solid ${C.border}`, borderLeft: `4px solid ${cat.color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>{cat.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{cat.category}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: catOpened === cat.channels.length ? cat.color : C.textDim }}>{catOpened}/{cat.channels.length} 가동</span>
            </div>
            {cat.channels.map((ch, ci) => {
              const key = `${cat.category}__${ch.platform}`;
              const isEditing = editing === key;
              return (
              <div key={ci} style={{ marginBottom: 3, borderRadius: 8, background: ch.opened ? C.surface2 : `${C.border}33`, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: ch.opened ? cat.color : C.textDim, minWidth: 70 }}>{ch.platform}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {ch.handle && <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'IBM Plex Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.handle}</div>}
                    {!ch.opened && <div style={{ fontSize: 10, color: C.red }}>⚠️ 미개설</div>}
                    {ch.opened && !ch.url && <div style={{ fontSize: 10, color: C.gold }}>● URL 미등록</div>}
                  </div>
                  {!isEditing && ch.opened && ch.url && (
                    <a href={ch.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: `${cat.color}18`, border: `1px solid ${cat.color}44`, color: cat.color, textDecoration: "none", fontWeight: 600 }}>열기 →</a>
                  )}
                  {!isEditing && (
                    <span onClick={() => startEdit(cat, ch)} style={{ fontSize: 10, padding: "4px 9px", borderRadius: 6, background: ch.opened && ch.url ? "transparent" : `${cat.color}18`, border: `1px solid ${ch.opened && ch.url ? C.border : cat.color + "44"}`, color: ch.opened && ch.url ? C.textDim : cat.color, fontWeight: 600, cursor: "pointer", marginLeft: ch.opened && ch.url ? 4 : 0 }}>
                      {ch.opened ? (ch.url ? "✎" : "URL 등록") : "개설하기"}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <div style={{ padding: "4px 10px 10px" }}>
                    <input style={inputStyle} placeholder="핸들 / 표시명 (예: @handle, store.com)" value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} />
                    <input style={inputStyle} placeholder="URL (https://...)" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textMuted, marginBottom: 8, cursor: "pointer" }}>
                      <input type="checkbox" checked={form.opened} onChange={e => setForm(f => ({ ...f, opened: e.target.checked }))} />
                      가동 중 (개설 완료)
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span onClick={() => saveEdit(cat, ch)} style={btn(`${cat.color}22`, `${cat.color}66`, cat.color)}>저장</span>
                      <span onClick={cancelEdit} style={btn("transparent", C.border, C.textDim)}>취소</span>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
          );
        })}
      </div>
    </div>
  );
};

// ── (구 CreatorTab 코드 제거 완료) ──


// ══════════════════════════════════════════════════════════════
// 메인 앱
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("strategist");
  const [gcalEvents, setGcalEvents] = useState([]);
  const [gcalToken, setGcalToken] = useState(() => {
    return sessionStorage.getItem("gtoken") || null;
  });
  const handleTokenChange = (t) => {
    setGcalToken(t);
    if (t) sessionStorage.setItem("gtoken", t);
    else sessionStorage.removeItem("gtoken");
  };
  const [todos, setTodos] = useState([]);

  const tabs = [
    { id:"strategist", icon:<Ic n="target" s={18}/>, label:"전략기획" },
    { id:"planner",   icon:<Ic n="pdf" s={18}/>, label:"플래너" },
    { id:"planning",  icon:<Ic n="target" s={18}/>, label:"기획부" },
    { id:"agent",     icon:<Ic n="chart" s={18}/>, label:"에이전트" },
    { id:"creator",   icon:<Ic n="target" s={18}/>, label:"크리에이터" },
    { id:"calendar",  icon:<Ic n="cal" s={18}/>, label:"캘린더" },
    { id:"backup",    icon:<Ic n="cloud" s={18}/>, label:"백업" },
  ];

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100dvh",background:C.bg,fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",color:C.text,overflow:"hidden" }}>
      <div style={{ background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,paddingTop:"calc(10px + env(safe-area-inset-top,0px))" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <svg width="36" height="22" viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 40 C15 25, 25 25, 35 35 C45 45, 50 45, 55 35 C60 25, 65 25, 75 35 C85 45, 90 45, 95 35 C100 25, 110 25, 115 40" stroke="#6B1D2A" strokeWidth="6" strokeLinecap="round" fill="none"/>
            <path d="M5 50 C15 35, 30 30, 40 40 C50 50, 55 48, 60 38 C65 28, 70 28, 80 38 C90 48, 95 48, 105 38 C110 30, 115 35, 115 45" stroke="#8B3040" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7"/>
            <path d="M20 45 C30 30, 40 32, 50 42 C55 47, 60 45, 65 38 C70 31, 80 30, 90 40 C95 45, 100 42, 108 35" stroke="#A04050" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5"/>
          </svg>
          <div>
            <div style={{ fontSize:14,fontWeight:800,color:"#6B1D2A",letterSpacing:2,lineHeight:1 }}>HANOK</div>
            <div style={{ fontSize:7,color:C.textDim,letterSpacing:1.5 }}>AGENT STUDIO</div>
          </div>
        </div>
        <div style={{ fontSize:10,color:C.textDim,textAlign:"right" }}>
          {new Date().toLocaleDateString("ko-KR",{month:"short",day:"numeric",weekday:"short"})}
          <br/><span style={{ color:C.green,fontSize:9 }}>● 온라인</span>
        </div>
      </div>
      <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column" }}>
        {tab==="strategist" && <StrategistTab/>}
        {tab==="calendar"  && <CalendarTab onEventsLoaded={setGcalEvents} externalToken={gcalToken} onTokenChange={handleTokenChange}/>}
        {tab==="planner"   && <PlannerTab gcalEvents={gcalEvents}/>}
        {tab==="planning"  && <PlanningDeptTab/>}
        {tab==="agent"     && <AgentTab/>}
        {tab==="creator"   && <CreatorTab/>}
        {tab==="backup"    && <BackupTab gcalToken={gcalToken}/>}
      </div>
      <div style={{ background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",flexShrink:0,paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
        {tabs.map(t => <BottomTab key={t.id} active={tab===t.id} onClick={()=>setTab(t.id)} icon={t.icon} label={t.label}/>)}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{-webkit-tap-highlight-color:transparent}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#3a3a36;border-radius:2px}input[type=date],input[type=time]{color-scheme:dark}`}</style>
    </div>
  );
}
