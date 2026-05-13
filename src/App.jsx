import { useState, useRef, useEffect } from "react";
import CalendarTab from "./CalendarTab.jsx";
import PlannerTab from "./PlannerTab.jsx";
import BackupTab from "./BackupTab.jsx";

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
  { id:"stock",   emoji:"📈", label:"주식블로그 3개 작성" },
  { id:"novel",   emoji:"📖", label:"웹소설" },
  { id:"music",   emoji:"🎵", label:"음원만들기" },
  { id:"sports",  emoji:"⚽", label:"스포츠블로그 1개 작성" },
  { id:"youtube", emoji:"🎬", label:"정치유튜브 1개 제작" },
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
const AGENTS = [
  { id:"novel", name:"웹소설 제작", emoji:"📖", color:"#a07acc", status:"planned", url:"", desc:"팔국지 7시즌 웹소설 제작 에이전트", tags:["문피아","카카오페이지","연재"], schedule:"매일 2화 집필", revenue:"플랫폼 유료화" },
  { id:"politics", name:"정치 유튜브", emoji:"🎙️", color:"#e07070", status:"building", url:"", desc:"AI 보이스오버 기반 정치 논평 채널", tags:["유튜브","정치","AI 보이스"], schedule:"주 3회 업로드", revenue:"유튜브 광고" },
  { id:"sports", name:"스포츠 분석", emoji:"⚽", color:"#7aabcc", status:"planned", url:"", desc:"AI 기반 스포츠 경기 분석 유튜브", tags:["유튜브","스포츠","데이터분석"], schedule:"경기 후 24시간 이내", revenue:"유튜브 광고" },
  { id:"coffee", name:"커피 블로그", emoji:"☕", color:C.bronze, status:"building", url:"", desc:"원두·브루잉·카페 리뷰 전문 블로그", tags:["블로그","애드센스","원두"], schedule:"주 3회 포스팅", revenue:"애드센스/제휴" },
  { id:"interior", name:"인테리어 블로그", emoji:"🏠", color:"#cc9a6d", status:"building", url:"", desc:"DIY 인테리어·리모델링 정보 블로그", tags:["블로그","애드센스","인테리어"], schedule:"주 2회 포스팅", revenue:"애드센스/제휴" },
  { id:"essay", name:"철학/신앙 에세이", emoji:"✝️", color:C.gold, status:"building", url:"", desc:"기독교 철학·신앙 에세이 블로그", tags:["블로그","에세이","신앙"], schedule:"주 2회 포스팅", revenue:"구독/애드센스" },
  { id:"suno", name:"수노 작곡가", emoji:"🎵", color:C.blue, status:"active", url:"https://suno-agent.vercel.app", desc:"AI 음악 생성 & 아티스트 에이전트 (Hanokh)", tags:["Suno","DistroKid","K-POP"], schedule:"주 3곡 생성·배급", revenue:"스트리밍 수익" },
  { id:"mfstock", name:"MF 주식 분석", emoji:"📈", color:"#00d4aa", status:"active", url:"https://mf-stock-agent.vercel.app", desc:"MoveFutures 기반 AI반도체 주식 분석", tags:["주식","MF분석","블로그"], schedule:"매일 아침 분석", revenue:"블로그 광고" },
];

const SUGGESTED_AGENTS = [
  { emoji:"👶", name:"육아/교육 블로그", reason:"검색량 높고 애드센스 단가 우수. 아이 성장 기록 + 교육 정보 결합.", revenue:"애드센스/쿠팡파트너스" },
  { emoji:"🌏", name:"여행 브이로그", reason:"유튜브 알고리즘 친화적. 국내 여행지 + AI 편집으로 제작비 절감.", revenue:"유튜브 광고/제휴" },
  { emoji:"💼", name:"직장인 재테크 블로그", reason:"재테크 키워드 CPC 높음. MF 주식 경험 연계 가능.", revenue:"애드센스/제휴" },
];

const STATUS_CONFIG = {
  active:    { label:"운영중",    color:"#00d4aa", bg:"#00d4aa18", icon:"●" },
  building:  { label:"제작중",    color:C.gold,    bg:C.goldDim,   icon:"◐" },
  planned:   { label:"기획중",    color:C.textDim, bg:C.border,    icon:"○" },
};

const AgentTab = () => {
  const [agents, setAgents] = useState(() => ls.get("agents_v1", AGENTS));
  const [showSuggest, setShowSuggest] = useState(false);
  const [todayRun, setTodayRun] = useState(() => ls.get("agent_run_today", {}));

  useEffect(() => { ls.set("agents_v1", agents); }, [agents]);
  useEffect(() => { ls.set("agent_run_today", todayRun); }, [todayRun]);

  const activeCount = agents.filter(a => a.status === "active").length;
  const buildCount  = agents.filter(a => a.status === "building").length;
  const todayCount  = Object.values(todayRun).filter(Boolean).length;

  const toggleRun = (id) => setTodayRun(p => ({ ...p, [id]: !p[id] }));
  const cycleStatus = (id) => {
    const order = ["planned","building","active"];
    setAgents(agents.map(a => {
      if (a.id !== id) return a;
      const next = order[(order.indexOf(a.status) + 1) % order.length];
      return { ...a, status: next };
    }));
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ flex:1, overflowY:"auto", padding:14 }}>
        <div style={{ background:`linear-gradient(135deg,${C.surface},#2a2520)`, borderRadius:14, padding:16, marginBottom:14, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:10 }}>DOUBLE Y · 에이전트 현황</div>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {[
              { label:"운영중",  value:activeCount,  color:"#00d4aa" },
              { label:"제작중",  value:buildCount,   color:C.gold },
              { label:"기획중",  value:agents.filter(a=>a.status==="planned").length, color:C.textDim },
              { label:"오늘 실행", value:todayCount, color:C.blue },
            ].map((s,i) => (
              <div key={i} style={{ flex:1, background:C.bg, borderRadius:10, padding:"10px 6px", textAlign:"center", border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:9, color:C.textDim, marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:10, color:C.textMuted, marginBottom:5 }}>오늘 실행률</div>
          <div style={{ height:6, background:C.border, borderRadius:3 }}>
            <div style={{ height:"100%", borderRadius:3, background:`linear-gradient(90deg,${C.bronze},${C.gold})`,
              width:`${agents.length>0?Math.round(todayCount/agents.filter(a=>a.status==="active").length*100)||0:0}%`,
              transition:"width .5s" }}/>
          </div>
        </div>

        {agents.map(agent => {
          const sc = STATUS_CONFIG[agent.status];
          const ran = todayRun[agent.id];
          return (
            <div key={agent.id} style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:10, border:`1px solid ${ran ? agent.color+"55" : C.border}`, borderLeft:`4px solid ${ran ? agent.color : sc.color}`, opacity: agent.status==="planned" ? 0.8 : 1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <span style={{ fontSize:24 }}>{agent.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{agent.name}</span>
                    <button onClick={()=>cycleStatus(agent.id)} style={{ background:sc.bg, border:`1px solid ${sc.color}33`, borderRadius:10, padding:"2px 8px", fontSize:9, color:sc.color, cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>{sc.icon} {sc.label}</button>
                  </div>
                  <div style={{ fontSize:10, color:C.textDim, marginTop:2 }}>{agent.desc}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <div style={{ flex:1, background:C.surface2, borderRadius:8, padding:"6px 9px" }}>
                  <div style={{ fontSize:9, color:C.textDim }}>📅 스케줄</div>
                  <div style={{ fontSize:11, color:C.text, marginTop:2 }}>{agent.schedule}</div>
                </div>
                <div style={{ flex:1, background:C.surface2, borderRadius:8, padding:"6px 9px" }}>
                  <div style={{ fontSize:9, color:C.textDim }}>💰 수익 모델</div>
                  <div style={{ fontSize:11, color:C.gold, marginTop:2 }}>{agent.revenue}</div>
                </div>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
                {agent.tags.map((t,i) => (
                  <span key={i} style={{ fontSize:10, background:`${agent.color}18`, color:agent.color, border:`1px solid ${agent.color}33`, padding:"2px 8px", borderRadius:10 }}>{t}</span>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>toggleRun(agent.id)} style={{ flex:1, padding:"8px 0", borderRadius:9, background: ran ? `${agent.color}22` : "transparent", border:`1px solid ${ran ? agent.color : C.border}`, color: ran ? agent.color : C.textMuted, cursor:"pointer", fontSize:11, fontFamily:"inherit", fontWeight:ran?700:400, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                  <div style={{ width:14, height:14, borderRadius:3, border:`1.5px solid ${ran ? agent.color : C.border}`, background: ran ? agent.color : "transparent", display:"flex", alignItems:"center", justifyContent:"center", color:C.bg, flexShrink:0 }}>{ran && <Ic n="check" s={10}/>}</div>
                  {ran ? "오늘 실행 완료" : "오늘 실행 체크"}
                </button>
                {agent.url ? (
                  <a href={agent.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none", flex:1 }}>
                    <div style={{ padding:"8px 0", borderRadius:9, textAlign:"center", background:`${agent.color}18`, border:`1px solid ${agent.color}44`, color:agent.color, fontSize:11, fontWeight:700 }}>에이전트 열기 →</div>
                  </a>
                ) : (
                  <button style={{ flex:1, padding:"8px 0", borderRadius:9, background:"transparent", border:`1px solid ${C.border}`, color:C.textDim, cursor:"not-allowed", fontSize:11, fontFamily:"inherit" }}>{agent.status==="planned" ? "기획 예정" : "URL 미설정"}</button>
                )}
              </div>
            </div>
          );
        })}

        <div style={{ marginBottom:10 }}>
          <button onClick={()=>setShowSuggest(!showSuggest)} style={{ width:"100%", padding:"11px 0", background:"transparent", border:`2px dashed ${C.border}`, borderRadius:12, color:C.textDim, cursor:"pointer", fontSize:13, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <Ic n="plus" s={15}/>{showSuggest ? "추천 접기" : "추가 에이전트 제안 보기"}
          </button>
        </div>
        {showSuggest && (
          <div style={{ background:C.surface, borderRadius:14, padding:14, marginBottom:20, border:`1px solid ${C.goldDim}` }}>
            <div style={{ fontSize:11, color:C.gold, fontWeight:700, marginBottom:12 }}>💡 추가 크리에이티브 에이전트 제안</div>
            {SUGGESTED_AGENTS.map((sa, i) => (
              <div key={i} style={{ background:C.surface2, borderRadius:10, padding:12, marginBottom:8, border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                  <span style={{ fontSize:20 }}>{sa.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{sa.name}</div>
                    <div style={{ fontSize:10, color:C.gold }}>{sa.revenue}</div>
                  </div>
                </div>
                <div style={{ fontSize:11, color:C.textMuted, lineHeight:1.6 }}>{sa.reason}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// 크리에이터 탭 — 계정 관리 + 포트폴리오 + 채널별 TODO
// ══════════════════════════════════════════════════════════════
const CR_LS_ACCOUNTS = "dy_creator_accounts";
const CR_LS_TODOS = "dy_creator_todos";
const CR_MONO = "'IBM Plex Mono', monospace";

const CR_DEFAULT_ACCOUNTS = [
  { id: "bluntedge_yt", brand: "BluntEdge", platform: "YouTube", handle: "@wjdcldbxnqj", url: "https://youtube.com/@wjdcldbxnqj", status: "active", followers: "", memo: "정치 시사 평론, 익명 보이스오버" },
  { id: "bluntedge_x", brand: "BluntEdge", platform: "X", handle: "@blunt_edge_", url: "https://x.com/blunt_edge_", status: "active", followers: "", memo: "3채널 자동화 완성" },
  { id: "bluntedge_blog", brand: "BluntEdge", platform: "WordPress", handle: "thebluntedge.com", url: "https://thebluntedge.com", status: "setup", followers: "", memo: "카페24, Astra 테마, 첫 15포스트 → 애드센스" },
  { id: "sports_yt", brand: "스포츠 AI", platform: "YouTube", handle: "", url: "", status: "plan", followers: "", memo: "스포츠 분석 쇼츠 (새 계정)" },
  { id: "sports_x", brand: "스포츠 AI", platform: "X", handle: "", url: "", status: "plan", followers: "", memo: "X 스레드 (새 계정)" },
  { id: "sports_ig", brand: "스포츠 AI", platform: "Instagram", handle: "", url: "", status: "plan", followers: "", memo: "인스타 카드뉴스 (새 계정)" },
  { id: "sports_blog", brand: "스포츠 AI", platform: "네이버블로그", handle: "", url: "", status: "plan", followers: "", memo: "네이버 블로그 (새 계정)" },
  { id: "onedo_blog", brand: "onedo.works", platform: "WordPress", handle: "onedo.works", url: "https://onedo.works", status: "setup", followers: "", memo: "커피·인테리어 라이프스타일 웹진" },
  { id: "smartstore", brand: "더블와이스페이스", platform: "스마트스토어", handle: "yourspaceyy", url: "https://smartstore.naver.com/yourspaceyy", status: "active", followers: "", memo: "일본 라이프스타일 소품 수입/판매" },
  { id: "suno_distrokid", brand: "Hanokh", platform: "DistroKid", handle: "Hanokh", url: "", status: "active", followers: "", memo: "기독교 K-POP, 40곡+ 완성" },
];

const CR_DEFAULT_TODOS = [
  { id: 1, brand: "BluntEdge", text: "첫 포스트 15개 작성", done: false },
  { id: 2, brand: "BluntEdge", text: "애드센스 신청", done: false },
  { id: 3, brand: "스포츠 AI", text: "YouTube 계정 개설", done: false },
  { id: 4, brand: "스포츠 AI", text: "X 계정 개설", done: false },
  { id: 5, brand: "스포츠 AI", text: "Instagram 계정 개설", done: false },
  { id: 6, brand: "스포츠 AI", text: "네이버 블로그 계정 개설", done: false },
  { id: 7, brand: "스포츠 AI", text: "Sports AI Agent 배포 (Vercel)", done: false },
  { id: 8, brand: "onedo.works", text: "프롤로그 포스트 발행", done: false },
  { id: 9, brand: "onedo.works", text: "SEO 메타데이터 설정", done: false },
  { id: 10, brand: "더블와이스페이스", text: "상세페이지 리뉴얼", done: false },
];

const CR_TRACKS = [
  { id: "productivity", label: "Productivity", title: "자기계발·생산성", icon: "◈", projects: ["더블와이 플래너", "가계부 플래너", "Double Y Agent"] },
  { id: "finance", label: "Finance", title: "투자·금융", icon: "◆", projects: ["MF Stock Agent"] },
  { id: "media", label: "Media", title: "미디어·콘텐츠", icon: "◉", projects: ["BluntEdge", "onedo.works", "Sports AI Agent"] },
  { id: "creative", label: "Creative", title: "크리에이티브", icon: "◎", projects: ["인사팀장", "팔국지", "임꺽정", "계약직 하녀", "Suno AI"] },
  { id: "commerce", label: "Commerce", title: "커머스·유통", icon: "◐", projects: ["스마트스토어", "AI 커피 앱"] },
];

const CR_STATUS = {
  active: { bg: C.gold, color: "#000", label: "ACTIVE" },
  setup: { bg: C.bronze, color: "#fff", label: "SETUP" },
  plan: { bg: C.surface2, color: C.textDim, label: "PLAN", border: `1px solid ${C.border}` },
};
const CR_PLATFORM_COLORS = {
  YouTube: "#FF0000", X: "#000", Instagram: "#E1306C",
  WordPress: "#21759B", "네이버블로그": "#03C75A", "스마트스토어": "#03C75A", DistroKid: "#9b6dff",
};

const crInputStyle = { padding: "7px 10px", borderRadius: 6, background: C.surface2, border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontFamily: "inherit", outline: "none" };

const CreatorTab = () => {
  const [subTab, setSubTab] = useState("accounts");
  const [accounts, setAccounts] = useState(() => ls.get(CR_LS_ACCOUNTS, CR_DEFAULT_ACCOUNTS));
  const [crTodos, setCrTodos] = useState(() => ls.get(CR_LS_TODOS, CR_DEFAULT_TODOS));

  // ── 계정 섹션 ──
  const [editId, setEditId] = useState(null);
  const brands = [...new Set(accounts.map(a => a.brand))];
  const [filterBrand, setFilterBrand] = useState("all");
  const filteredAccounts = filterBrand === "all" ? accounts : accounts.filter(a => a.brand === filterBrand);

  const updateAccount = (id, field, value) => {
    const updated = accounts.map(a => a.id === id ? { ...a, [field]: value } : a);
    setAccounts(updated);
    ls.set(CR_LS_ACCOUNTS, updated);
  };

  // ── TODO 섹션 ──
  const todoBrands = [...new Set(crTodos.map(t => t.brand))];
  const [todoFilter, setTodoFilter] = useState("all");
  const [newText, setNewText] = useState("");
  const [newBrand, setNewBrand] = useState(todoBrands[0] || "");
  const filteredTodos = todoFilter === "all" ? crTodos : crTodos.filter(t => t.brand === todoFilter);

  const toggleCrTodo = (id) => {
    const updated = crTodos.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setCrTodos(updated);
    ls.set(CR_LS_TODOS, updated);
  };
  const addCrTodo = () => {
    if (!newText.trim() || !newBrand) return;
    const updated = [...crTodos, { id: Date.now(), brand: newBrand, text: newText.trim(), done: false }];
    setCrTodos(updated);
    ls.set(CR_LS_TODOS, updated);
    setNewText("");
  };
  const removeCrTodo = (id) => {
    const updated = crTodos.filter(t => t.id !== id);
    setCrTodos(updated);
    ls.set(CR_LS_TODOS, updated);
  };

  const doneCount = filteredTodos.filter(t => t.done).length;
  const totalCount = filteredTodos.length;

  const subTabs = [
    { id: "accounts", label: "📡 계정" },
    { id: "portfolio", label: "📊 포트폴리오" },
    { id: "todo", label: "☑️ TODO" },
  ];

  const FilterBtn = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{ padding:"5px 12px", borderRadius:5, fontSize:11, fontFamily:"inherit", fontWeight:600, cursor:"pointer", border:`1px solid ${active?C.gold:C.border}`, background:active?C.goldDim:"transparent", color:active?C.gold:C.textMuted }}>{label}</button>
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{ flex:1, padding:"11px 0", fontSize:12, fontFamily:"inherit", fontWeight:subTab===t.id?600:400, cursor:"pointer", background:"none", border:"none", color:subTab===t.id?C.gold:C.textMuted, borderBottom:`2px solid ${subTab===t.id?C.gold:"transparent"}`, transition:"all .15s" }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:14 }}>
        {/* ── 계정 관리 ── */}
        {subTab === "accounts" && (
          <div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
              <FilterBtn label="전체" active={filterBrand==="all"} onClick={()=>setFilterBrand("all")} />
              {brands.map(b => <FilterBtn key={b} label={b} active={filterBrand===b} onClick={()=>setFilterBrand(b)} />)}
            </div>
            {filteredAccounts.map(acc => {
              const st = CR_STATUS[acc.status] || CR_STATUS.plan;
              const pc = CR_PLATFORM_COLORS[acc.platform] || C.textMuted;
              const isEd = editId === acc.id;
              return (
                <div key={acc.id} style={{ padding:"14px 16px", marginBottom:6, borderRadius:10, background:C.surface, border:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:9, fontFamily:CR_MONO, padding:"2px 7px", borderRadius:4, background:`${pc}22`, color:pc, fontWeight:600 }}>{acc.platform}</span>
                      <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{acc.brand}</span>
                      <span style={{ fontSize:8, fontFamily:CR_MONO, padding:"2px 6px", borderRadius:3, background:st.bg, color:st.color, border:st.border||"none", letterSpacing:1 }}>{st.label}</span>
                    </div>
                    <button onClick={()=>setEditId(isEd?null:acc.id)} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:12 }}>{isEd?"✓":"✎"}</button>
                  </div>
                  {acc.handle && <div style={{ fontSize:12, color:C.gold, fontFamily:CR_MONO, marginBottom:4 }}>{acc.handle}</div>}
                  {acc.url && !isEd && <div style={{ fontSize:10, color:C.textDim, fontFamily:CR_MONO, marginBottom:4, wordBreak:"break-all" }}>{acc.url}</div>}
                  <div style={{ fontSize:11, color:C.textMuted, lineHeight:1.6 }}>{acc.memo}</div>
                  {acc.followers && <div style={{ fontSize:10, color:C.gold, fontFamily:CR_MONO, marginTop:4 }}>👥 {acc.followers}</div>}
                  {isEd && (
                    <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:6 }}>
                      <input value={acc.handle} onChange={e=>updateAccount(acc.id,"handle",e.target.value)} placeholder="핸들 (@...)" style={crInputStyle} />
                      <input value={acc.url} onChange={e=>updateAccount(acc.id,"url",e.target.value)} placeholder="URL" style={crInputStyle} />
                      <input value={acc.followers} onChange={e=>updateAccount(acc.id,"followers",e.target.value)} placeholder="팔로워/구독자 수" style={crInputStyle} />
                      <input value={acc.memo} onChange={e=>updateAccount(acc.id,"memo",e.target.value)} placeholder="메모" style={crInputStyle} />
                      <div style={{ display:"flex", gap:6 }}>
                        {["active","setup","plan"].map(s => (
                          <button key={s} onClick={()=>updateAccount(acc.id,"status",s)} style={{ padding:"4px 10px", borderRadius:4, fontSize:10, fontFamily:CR_MONO, cursor:"pointer", border:`1px solid ${acc.status===s?C.gold:C.border}`, background:acc.status===s?C.goldDim:"transparent", color:acc.status===s?C.gold:C.textDim }}>{CR_STATUS[s].label}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── 포트폴리오 ── */}
        {subTab === "portfolio" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:1, background:C.border, borderRadius:8, overflow:"hidden", marginBottom:20 }}>
              {CR_TRACKS.map(t => (
                <div key={t.id} style={{ background:C.surface, padding:"14px 8px", textAlign:"center" }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{t.icon}</div>
                  <div style={{ fontSize:18, fontWeight:800, fontFamily:CR_MONO, color:C.gold }}>{t.projects.length}</div>
                  <div style={{ fontSize:8, fontFamily:CR_MONO, color:C.textDim, letterSpacing:1, marginTop:2 }}>{t.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
            {CR_TRACKS.map(t => (
              <div key={t.id} style={{ marginBottom:12, padding:"14px 16px", borderRadius:10, background:C.surface, border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:16 }}>{t.icon}</span>
                  <span style={{ fontSize:10, fontFamily:CR_MONO, color:C.textDim, letterSpacing:1 }}>{t.label.toUpperCase()}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{t.title}</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {t.projects.map(p => (
                    <span key={p} style={{ fontSize:11, fontFamily:"inherit", padding:"4px 10px", borderRadius:5, background:C.surface2, color:C.textMuted, border:`1px solid ${C.border}` }}>{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TODO ── */}
        {subTab === "todo" && (
          <div>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:10, fontFamily:CR_MONO, color:C.textDim, letterSpacing:1 }}>PROGRESS</span>
                <span style={{ fontSize:12, fontFamily:CR_MONO, color:C.gold, fontWeight:600 }}>{doneCount}/{totalCount}</span>
              </div>
              <div style={{ height:6, background:C.surface2, borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", background:C.gold, borderRadius:3, width:`${totalCount?(doneCount/totalCount*100):0}%`, transition:"width .3s" }} />
              </div>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
              <FilterBtn label="전체" active={todoFilter==="all"} onClick={()=>setTodoFilter("all")} />
              {todoBrands.map(b => <FilterBtn key={b} label={b} active={todoFilter===b} onClick={()=>setTodoFilter(b)} />)}
            </div>
            {filteredTodos.map(t => (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", marginBottom:4, borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, opacity:t.done?0.5:1 }}>
                <button onClick={()=>toggleCrTodo(t.id)} style={{ width:20, height:20, borderRadius:4, flexShrink:0, background:t.done?C.gold:"transparent", border:`2px solid ${t.done?C.gold:C.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#000", fontSize:12, fontWeight:700 }}>{t.done?"✓":""}</button>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:t.done?C.textDim:C.text, textDecoration:t.done?"line-through":"none" }}>{t.text}</div>
                  <div style={{ fontSize:9, fontFamily:CR_MONO, color:C.textDim, marginTop:2 }}>{t.brand}</div>
                </div>
                <button onClick={()=>removeCrTodo(t.id)} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:14 }}>×</button>
              </div>
            ))}
            <div style={{ marginTop:14, padding:"12px 14px", borderRadius:10, background:C.surface, border:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                <select value={newBrand} onChange={e=>setNewBrand(e.target.value)} style={{ padding:"7px 10px", borderRadius:6, background:C.surface2, border:`1px solid ${C.border}`, color:C.text, fontSize:11, fontFamily:"inherit" }}>
                  {todoBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <input value={newText} onChange={e=>setNewText(e.target.value)} placeholder="새 할 일..." onKeyDown={e=>e.key==="Enter"&&addCrTodo()} style={{ flex:1, padding:"7px 10px", borderRadius:6, background:C.surface2, border:`1px solid ${C.border}`, color:C.text, fontSize:12, fontFamily:"inherit", outline:"none" }} />
              </div>
              <button onClick={addCrTodo} disabled={!newText.trim()} style={{ width:"100%", padding:"8px", borderRadius:6, fontSize:12, fontFamily:"inherit", fontWeight:600, cursor:newText.trim()?"pointer":"not-allowed", border:"none", background:newText.trim()?C.gold:C.surface2, color:newText.trim()?"#000":C.textDim }}>+ 추가</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// 메인 앱
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("assistant");
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
    { id:"assistant", icon:<Ic n="bot" s={18}/>, label:"AI 비서" },
    { id:"calendar",  icon:<Ic n="cal" s={18}/>, label:"캘린더" },
    { id:"planner",   icon:<Ic n="pdf" s={18}/>, label:"플래너" },
    { id:"agent",     icon:<Ic n="chart" s={18}/>, label:"에이전트" },
    { id:"creator",   icon:<Ic n="target" s={18}/>, label:"크리에이터" },
    { id:"backup",    icon:<Ic n="cloud" s={18}/>, label:"백업" },
  ];

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100dvh",background:C.bg,fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",color:C.text,overflow:"hidden" }}>
      <div style={{ background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,paddingTop:"calc(10px + env(safe-area-inset-top,0px))" }}>
        <div>
          <div style={{ fontSize:14,fontWeight:800,color:C.gold,letterSpacing:1.5,lineHeight:1 }}>DOUBLE Y</div>
          <div style={{ fontSize:8,color:C.textDim,letterSpacing:2 }}>AGENT STUDIO</div>
        </div>
        <div style={{ fontSize:10,color:C.textDim,textAlign:"right" }}>
          {new Date().toLocaleDateString("ko-KR",{month:"short",day:"numeric",weekday:"short"})}
          <br/><span style={{ color:C.green,fontSize:9 }}>● 온라인</span>
        </div>
      </div>
      <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column" }}>
        {tab==="assistant" && <AssistantTab todos={todos} setTodos={setTodos}/>}
        {tab==="calendar"  && <CalendarTab onEventsLoaded={setGcalEvents} externalToken={gcalToken} onTokenChange={handleTokenChange}/>}
        {tab==="planner"   && <PlannerTab gcalEvents={gcalEvents}/>}
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
