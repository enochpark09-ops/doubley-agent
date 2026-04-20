import { useState, useRef, useEffect } from "react";

// ── 색상 팔레트 ─────────────────────────────────────────────────
const C = {
  bg: "#1a1a18", surface: "#242422", surface2: "#2a2a27",
  border: "#3a3a36",
  gold: "#C4A86C", goldDim: "#c4a86c33",
  bronze: "#8B7355", bronzeDim: "#8b735533",
  text: "#e8e4dc", textMuted: "#9a9690", textDim: "#6a6660",
  green: "#6dcc7a", greenDim: "#6dcc7a22",
  red: "#e07070", redDim: "#e0707022",
  blue: "#7aabcc", blueDim: "#7aabcc22",
};

// ── API 호출 ────────────────────────────────────────────────────
const callClaude = async (messages, system, max_tokens = 1000) => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens,
      system,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
};

// ── 아이콘 ──────────────────────────────────────────────────────
const Ic = ({ n, s = 16 }) => {
  const d = {
    bot: <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><circle cx="19" cy="7" r="2" fill="currentColor" stroke="none" opacity=".5"/></>,
    chart: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    strategy: <><path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M3 14h7v7H3z"/><path d="M17.5 14L21 21H14Z"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    mic: <><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
    micOff: <><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></>,
    spin: <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>,
    cal: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    note: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></>,
    arrow: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    back: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {d[n]}
    </svg>
  );
};

// ── 하단 탭바 ───────────────────────────────────────────────────
const BottomTab = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} style={{
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 4, padding: "10px 0 8px",
    background: "transparent", border: "none",
    color: active ? C.gold : C.textDim,
    cursor: "pointer", fontSize: 10, fontFamily: "inherit",
    fontWeight: active ? 700 : 400,
    borderTop: `2px solid ${active ? C.gold : "transparent"}`,
    transition: "all .2s",
  }}>
    {icon}{label}
  </button>
);

// ══════════════════════════════════════════════════════════════
// 탭1: AI 비서
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
  const [view, setView] = useState("chat"); // "chat" | "todos"
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "ko-KR"; rec.continuous = false; rec.interimResults = true;
    rec.onresult = e => setInput(Array.from(e.results).map(r => r[0].transcript).join(""));
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const toggleMic = () => {
    if (!recognitionRef.current) { alert("음성 인식 미지원 브라우저입니다."); return; }
    if (listening) { recognitionRef.current.stop(); }
    else { setInput(""); recognitionRef.current.start(); setListening(true); }
  };

  const SYSTEM = `당신은 Enoch(에녹)의 개인 AI 비서입니다.
Double Y Space(성남시): 스마트스토어(일본 굿즈), 웹소설(팔국지), Suno 음악, 커피앱(AX-16) 운영 중.
할일 현황: ${todos.map(t => `[${t.done?"완료":"미완"}] ${t.text}`).join(", ")}
한국어로 친근하게 3~5문장.`;

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const reply = await callClaude(newMsgs.map(m => ({ role: m.role, content: m.content })), SYSTEM);
      setMessages([...newMsgs, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMsgs, { role: "assistant", content: "⚠️ 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }]);
    }
    setLoading(false);
  };

  const schedule = [
    { time: "06–08시", label: "새벽 창작", color: C.gold },
    { time: "09–15시", label: "스토어 운영", color: C.bronze },
    { time: "19–21시", label: "야간 업무", color: C.blue },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* 서브 탭 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        {[["chat","💬 대화"],["todos","✅ 할일"],["schedule","📅 일정"]].map(([id,label]) => (
          <button key={id} onClick={() => setView(id)} style={{
            flex: 1, padding: "10px 0", background: "transparent", border: "none",
            borderBottom: `2px solid ${view===id ? C.gold : "transparent"}`,
            color: view===id ? C.gold : C.textMuted,
            fontSize: 12, fontFamily: "inherit", cursor: "pointer", fontWeight: view===id ? 600 : 400,
          }}>{label}</button>
        ))}
      </div>

      {/* 대화 뷰 */}
      {view === "chat" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%", padding: "10px 13px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? C.gold : C.surface,
                  color: m.role === "user" ? "#1a1a18" : C.text,
                  fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap",
                  border: m.role === "assistant" ? `1px solid ${C.border}` : "none",
                }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontSize: 12 }}>
                <div style={{ animation: "spin 1s linear infinite", color: C.gold }}><Ic n="spin" s={13}/></div>생각 중...
              </div>
            )}
          </div>
          {/* 입력창 */}
          <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center", flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom, 10px)" }}>
            <button onClick={toggleMic} style={{
              width: 42, height: 42, borderRadius: 10, border: `1.5px solid ${listening ? C.red : C.border}`,
              background: listening ? C.redDim : C.bg, color: listening ? C.red : C.textMuted,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}><Ic n={listening ? "micOff" : "mic"} s={17}/></button>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder={listening ? "🔴 음성 인식 중..." : "메시지 입력..."}
              style={{ flex: 1, background: C.bg, border: `1px solid ${listening ? C.red+"66" : C.border}`, borderRadius: 10, color: C.text, padding: "11px 13px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
            />
            <button onClick={send} disabled={loading || !input.trim()} style={{
              width: 42, height: 42, borderRadius: 10, background: input.trim() && !loading ? C.gold : C.border,
              border: "none", color: input.trim() && !loading ? "#1a1a18" : C.textDim,
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}><Ic n="send" s={16}/></button>
          </div>
        </div>
      )}

      {/* 할일 뷰 */}
      {view === "todos" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={newTodo} onChange={e => setNewTodo(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newTodo.trim()) { setTodos([...todos, { id: Date.now(), text: newTodo.trim(), done: false }]); setNewTodo(""); }}}
              placeholder="새 할일 추가..."
              style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "11px 13px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
            />
            <button onClick={() => { if (newTodo.trim()) { setTodos([...todos, { id: Date.now(), text: newTodo.trim(), done: false }]); setNewTodo(""); }}}
              style={{ width: 42, height: 42, borderRadius: 10, background: C.goldDim, border: `1px solid ${C.gold}`, color: C.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic n="plus" s={18}/>
            </button>
          </div>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10 }}>
            {todos.filter(t=>!t.done).length}개 남음 / 총 {todos.length}개
          </div>
          {todos.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", marginBottom: 8, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <button onClick={() => setTodos(todos.map(x => x.id===t.id ? {...x, done:!x.done} : x))} style={{
                width: 22, height: 22, borderRadius: 5, border: `2px solid ${t.done ? C.gold : C.border}`,
                background: t.done ? C.gold : "transparent", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#1a1a18",
              }}>{t.done && <Ic n="check" s={13}/>}</button>
              <span style={{ flex: 1, fontSize: 14, color: t.done ? C.textDim : C.text, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
              <button onClick={() => setTodos(todos.filter(x => x.id!==t.id))} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, padding: 4 }}>
                <Ic n="trash" s={15}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 일정 뷰 */}
      {view === "schedule" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          <div style={{ fontSize: 12, color: C.textDim, marginBottom: 14 }}>
            {new Date().toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric", weekday:"long" })}
          </div>
          {schedule.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: 14, marginBottom: 10, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, alignItems: "center" }}>
              <div style={{ width: 4, height: 44, borderRadius: 2, background: s.color, flexShrink: 0 }}/>
              <div>
                <div style={{ fontSize: 12, color: C.textDim, marginBottom: 4 }}>{s.time}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{s.label}</div>
              </div>
            </div>
          ))}
          <div style={{ background: C.goldDim, borderRadius: 12, padding: 14, border: `1px solid ${C.gold}44`, marginTop: 8 }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 6 }}>오늘의 집중 목표</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
              {todos.filter(t=>!t.done).slice(0,3).map(t => `• ${t.text}`).join("\n") || "모든 할일 완료! 🎉"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// 탭2: 사업 현황 대시보드
// ══════════════════════════════════════════════════════════════
const INIT_BIZ = [
  {
    id: 1, name: "스마트스토어", emoji: "🏪", color: C.gold, progress: 65,
    kpis: [{ label: "상품수", value: "12개" }, { label: "리뷰", value: "4.8★" }, { label: "상태", value: "운영중" }],
    milestones: [
      { text: "SOU SOU 상품 등록", done: true },
      { text: "DULTON 라인업 확장", done: true },
      { text: "블로그 SEO 연동", done: false },
      { text: "Daangn 마켓 유입 전략", done: false },
    ],
    note: "일본 라이프스타일 굿즈 수입 판매. 쿠로로지 포워딩 검토 중.",
  },
  {
    id: 2, name: "팔국지 웹소설", emoji: "📖", color: "#a07acc", progress: 42,
    kpis: [{ label: "완성화수", value: "5화" }, { label: "플랫폼", value: "문피아" }, { label: "계획", value: "7시즌" }],
    milestones: [
      { text: "스토리 바이블 v2.0", done: true },
      { text: "100인 캐릭터 바이블", done: true },
      { text: "1~5화 초고 완성", done: true },
      { text: "6화 초고 작성", done: false },
      { text: "문피아 연재 시작", done: false },
    ],
    note: "아사달의 심장. 아사녀·김거등 듀얼 주인공.",
  },
  {
    id: 3, name: "AI 커피앱 AX-16", emoji: "☕", color: C.bronze, progress: 88,
    kpis: [{ label: "완성도", value: "90%" }, { label: "상태", value: "최종테스트" }, { label: "지원", value: "신청완료" }],
    milestones: [
      { text: "시장조사 196명 설문", done: true },
      { text: "BOM 설계 완료", done: true },
      { text: "특허 명세서 2건", done: true },
      { text: "앱 최종 테스트", done: false },
      { text: "런칭", done: false },
    ],
    note: "커스텀 블렌딩 앱. 정부 스타트업 지원 신청 완료.",
  },
  {
    id: 4, name: "Suno 음악", emoji: "🎵", color: C.blue, progress: 55,
    kpis: [{ label: "트랙", value: "40+곡" }, { label: "배급", value: "DistroKid" }, { label: "ContentID", value: "준비중" }],
    milestones: [
      { text: "트랙 40곡 생성", done: true },
      { text: "DistroKid 계정", done: false },
      { text: "전곡 업로드", done: false },
      { text: "YouTube Content ID", done: false },
    ],
    note: "AI 생성 음악 수익화. Social Media Pack 구독 예정.",
  },
  {
    id: 5, name: "디지털 플래너", emoji: "📓", color: "#cc9a6d", progress: 70,
    kpis: [{ label: "완성도", value: "70%" }, { label: "포맷", value: "GoodNotes" }, { label: "페이지", value: "64p" }],
    milestones: [
      { text: "30일 액션 플래너 PDF", done: true },
      { text: "GoodNotes 64p 인터랙티브", done: true },
      { text: "판매 페이지 제작", done: false },
      { text: "스마트스토어 등록", done: false },
    ],
    note: "차콜/골드/브론즈 컬러. 하이퍼링크 탭 네비게이션.",
  },
];

const DashboardTab = () => {
  const [businesses, setBusinesses] = useState(INIT_BIZ);
  const [selected, setSelected] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");

  const sel = businesses.find(b => b.id === selected);
  const overall = Math.round(businesses.reduce((s, b) => s + b.progress, 0) / businesses.length);

  const toggleMilestone = (bizId, mi) => {
    setBusinesses(businesses.map(b => {
      if (b.id !== bizId) return b;
      const newMs = b.milestones.map((m, i) => i === mi ? { ...m, done: !m.done } : m);
      return { ...b, milestones: newMs, progress: Math.round(newMs.filter(m => m.done).length / newMs.length * 100) };
    }));
  };

  const getAiAdvice = async (biz) => {
    setAiLoading(true); setAiAdvice("");
    try {
      const r = await callClaude([{ role: "user", content: `사업: ${biz.name}\n진행률: ${biz.progress}%\n미완료: ${biz.milestones.filter(m=>!m.done).map(m=>m.text).join(", ")}\n메모: ${biz.note}\n\n이번 주 핵심 액션 3가지만 번호 매겨 간결하게.` }],
        "개인사업자 전략 컨설턴트. 간결하고 실행 가능한 조언만 한국어로.");
      setAiAdvice(r);
    } catch { setAiAdvice("조언을 불러오지 못했습니다."); }
    setAiLoading(false);
  };

  const statusColor = p => p >= 80 ? C.green : p >= 50 ? C.gold : C.bronze;

  if (sel) {
    return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* 상세 헤더 */}
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, background: C.surface, flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => { setSelected(null); setAiAdvice(""); }} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 4, display: "flex" }}>
            <Ic n="back" s={20}/>
          </button>
          <span style={{ fontSize: 20 }}>{sel.emoji}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, flex: 1 }}>{sel.name}</span>
          <button onClick={() => getAiAdvice(sel)} style={{
            background: C.goldDim, border: `1px solid ${C.gold}`, borderRadius: 8, padding: "7px 13px",
            color: C.gold, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600,
          }}>{aiLoading ? "분석 중..." : "AI 조언"}</button>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 진행률 */}
          <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>진행률</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: statusColor(sel.progress) }}>{sel.progress}%</span>
            </div>
            <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
              <div style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${sel.color}88, ${sel.color})`, width: `${sel.progress}%`, transition: "width .8s" }}/>
            </div>
          </div>

          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {sel.kpis.map((k, i) => (
              <div key={i} style={{ background: C.surface, borderRadius: 10, padding: "12px 8px", textAlign: "center", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: sel.color }}>{k.value}</div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* 마일스톤 */}
          <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginBottom: 12, letterSpacing: 0.8 }}>MILESTONES</div>
            {sel.milestones.map((m, i) => (
              <div key={i} onClick={() => toggleMilestone(sel.id, i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${m.done ? sel.color : C.border}`, background: m.done ? sel.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#1a1a18" }}>
                  {m.done && <Ic n="check" s={12}/>}
                </div>
                <span style={{ fontSize: 13, color: m.done ? C.textDim : C.text, textDecoration: m.done ? "line-through" : "none" }}>{m.text}</span>
              </div>
            ))}
          </div>

          {/* 메모 */}
          <div style={{ background: C.surface, borderRadius: 12, padding: 14, border: `1px solid ${C.border}`, borderLeft: `4px solid ${sel.color}` }}>
            <div style={{ fontSize: 10, color: C.textDim, marginBottom: 6 }}>메모</div>
            <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65 }}>{sel.note}</div>
          </div>

          {/* AI 조언 */}
          {(aiAdvice || aiLoading) && (
            <div style={{ background: C.goldDim, borderRadius: 12, padding: 16, border: `1px solid ${C.gold}44` }}>
              <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 8 }}>🤖 AI 전략 조언</div>
              {aiLoading
                ? <div style={{ fontSize: 13, color: C.textMuted, display: "flex", gap: 6, alignItems: "center" }}><div style={{ animation: "spin 1s linear infinite" }}><Ic n="spin" s={13}/></div>분석 중...</div>
                : <div style={{ fontSize: 14, color: C.text, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{aiAdvice}</div>
              }
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
      {/* 총괄 */}
      <div style={{ background: `linear-gradient(135deg, ${C.surface}, #2e2a22)`, borderRadius: 14, padding: 18, marginBottom: 14, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.textDim, letterSpacing: 1, marginBottom: 8 }}>DOUBLE Y SPACE · 전체 진행률</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: C.gold, lineHeight: 1 }}>{overall}</span>
          <span style={{ fontSize: 16, color: C.bronze, paddingBottom: 3 }}>%</span>
          <span style={{ fontSize: 12, color: C.textDim, paddingBottom: 3, marginLeft: 4 }}>활성 사업 {businesses.length}개</span>
        </div>
        <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
          <div style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${C.bronze}, ${C.gold})`, width: `${overall}%`, transition: "width 1s" }}/>
        </div>
      </div>

      {/* 카드 목록 */}
      {businesses.map(biz => (
        <div key={biz.id} onClick={() => setSelected(biz.id)} style={{
          background: C.surface, borderRadius: 14, padding: 16, marginBottom: 10,
          border: `1px solid ${C.border}`, cursor: "pointer", transition: "all .2s",
          WebkitTapHighlightColor: "transparent",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>{biz.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{biz.name}</div>
              <div style={{ fontSize: 11, color: C.textDim }}>{biz.milestones.filter(m=>m.done).length}/{biz.milestones.length} 마일스톤</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: statusColor(biz.progress) }}>{biz.progress}%</div>
          </div>
          <div style={{ height: 5, background: C.border, borderRadius: 3, marginBottom: 12 }}>
            <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${biz.color}88, ${biz.color})`, width: `${biz.progress}%`, transition: "width .8s" }}/>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {biz.kpis.map((k, i) => (
              <div key={i} style={{ flex: 1, background: C.bg, borderRadius: 7, padding: "7px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: biz.color }}>{k.value}</div>
                <div style={{ fontSize: 9, color: C.textDim, marginTop: 1 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// 탭3: 전략기획
// ══════════════════════════════════════════════════════════════
const StrategyTab = () => {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [view, setView] = useState("input");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "ko-KR"; rec.continuous = false; rec.interimResults = true;
    rec.onresult = e => setIdea(Array.from(e.results).map(r => r[0].transcript).join(""));
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (listening) { recognitionRef.current.stop(); }
    else { setIdea(""); recognitionRef.current.start(); setListening(true); }
  };

  const SYSTEM = `전략기획 전문가. 순수 JSON만 출력:
{"summary":"2문장","marketability":{"score":숫자,"comment":"2문장"},"profitability":{"score":숫자,"comment":"2문장"},"feasibility":{"score":숫자,"comment":"2문장"},"risks":["리스크1","리스크2","리스크3"],"actions":["액션1","액션2","액션3"],"verdict":"GO|CONDITIONAL|NO-GO","verdictReason":"2문장"}`;

  const analyze = async () => {
    if (!idea.trim() || loading) return;
    setLoading(true); setResult(null); setView("result");
    try {
      const raw = await callClaude([{ role: "user", content: idea }], SYSTEM);
      setResult(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch { setResult({ error: true }); }
    setLoading(false);
  };

  const Bar = ({ score, label, color }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>{label}</span>
        <span style={{ fontSize: 14, color: color, fontWeight: 700 }}>{score}/10</span>
      </div>
      <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
        <div style={{ height: "100%", borderRadius: 3, background: color, width: `${score * 10}%`, transition: "width .8s" }}/>
      </div>
    </div>
  );

  const vStyle = { GO: { bg: C.greenDim, col: C.green, label: "✓ 진행 추천" }, CONDITIONAL: { bg: C.goldDim, col: C.gold, label: "◈ 조건부 추천" }, "NO-GO": { bg: C.redDim, col: C.red, label: "✕ 재검토 필요" } };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* 서브탭 */}
      {result && (
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
          {[["input","📝 입력"],["result","📊 결과"]].map(([id,label]) => (
            <button key={id} onClick={() => setView(id)} style={{
              flex: 1, padding: "10px 0", background: "transparent", border: "none",
              borderBottom: `2px solid ${view===id ? C.gold : "transparent"}`,
              color: view===id ? C.gold : C.textMuted, fontSize: 12, fontFamily: "inherit", cursor: "pointer", fontWeight: view===id ? 600 : 400,
            }}>{label}</button>
          ))}
        </div>
      )}

      {view === "input" && (
        <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10, letterSpacing: 0.8 }}>사업 아이디어를 입력하거나 음성으로 말씀해 주세요</div>
          <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", marginBottom: 12 }}>
            <textarea value={idea} onChange={e => setIdea(e.target.value)}
              placeholder={"어떤 사업인가요?\n타겟 고객은? 수익 모델은?"}
              style={{ flex: 1, background: C.surface, border: `1px solid ${listening ? C.red+"99" : C.border}`, borderRadius: 12, color: C.text, padding: "14px 50px 14px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.7 }}
            />
            <button onClick={toggleMic} style={{
              position: "absolute", bottom: 12, right: 12, width: 36, height: 36, borderRadius: 8,
              border: `1.5px solid ${listening ? C.red : C.border}`, background: listening ? C.redDim : C.bg,
              color: listening ? C.red : C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}><Ic n={listening ? "micOff" : "mic"} s={15}/></button>
          </div>
          <button onClick={analyze} disabled={loading || !idea.trim()} style={{
            background: idea.trim() && !loading ? `linear-gradient(135deg, ${C.bronze}, ${C.gold})` : C.border,
            border: "none", borderRadius: 12, padding: "14px 0", color: idea.trim() && !loading ? "#1a1a18" : C.textDim,
            fontSize: 15, fontWeight: 700, cursor: idea.trim() && !loading ? "pointer" : "not-allowed",
            fontFamily: "inherit", marginBottom: 12,
          }}>전략 분석 시작 →</button>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 8 }}>빠른 예시</div>
          {["일본 라이프스타일 굿즈 확장","AI 커피앱 구독 서비스","웹소설 IP 굿즈 판매","스포츠 분석 Shorts 채널"].map((ex, i) => (
            <button key={i} onClick={() => setIdea(ex)} style={{
              display: "block", width: "100%", textAlign: "left", background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 13px",
              color: C.textMuted, fontSize: 13, cursor: "pointer", marginBottom: 7, fontFamily: "inherit",
            }}>{ex}</button>
          ))}
        </div>
      )}

      {view === "result" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 14, color: C.textMuted }}>
              <div style={{ animation: "spin 1s linear infinite", color: C.gold }}><Ic n="spin" s={36}/></div>
              <div style={{ fontSize: 13 }}>시장성 · 수익성 · 실행가능성 분석 중...</div>
            </div>
          )}
          {result && !result.error && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.gold}` }}>
                <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, marginBottom: 6, letterSpacing: 0.8 }}>SUMMARY</div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.65 }}>{result.summary}</div>
              </div>
              <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, marginBottom: 12, letterSpacing: 0.8 }}>SCORES</div>
                <Bar score={result.marketability?.score} label="시장성" color={C.blue}/>
                <Bar score={result.profitability?.score} label="수익성" color={C.green}/>
                <Bar score={result.feasibility?.score} label="실행가능성" color={C.gold}/>
              </div>
              {[["marketability","시장성"],["profitability","수익성"],["feasibility","실행가능성"]].map(([k,l]) => (
                <div key={k} style={{ background: C.surface, borderRadius: 12, padding: 14, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginBottom: 6 }}>{l} 분석</div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.65 }}>{result[k]?.comment}</div>
                </div>
              ))}
              <div style={{ background: C.surface, borderRadius: 12, padding: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.red, fontWeight: 700, marginBottom: 8 }}>⚠️ RISKS</div>
                {result.risks?.map((r, i) => <div key={i} style={{ fontSize: 13, color: C.text, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}><span style={{ color: C.red, marginRight: 8 }}>▸</span>{r}</div>)}
              </div>
              <div style={{ background: C.surface, borderRadius: 12, padding: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.green, fontWeight: 700, marginBottom: 8 }}>✅ ACTION ITEMS</div>
                {result.actions?.map((a, i) => <div key={i} style={{ fontSize: 13, color: C.text, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}><span style={{ color: C.green, marginRight: 8 }}>{i+1}.</span>{a}</div>)}
              </div>
              {result.verdict && (() => {
                const vs = vStyle[result.verdict] || {};
                return (
                  <div style={{ background: vs.bg, borderRadius: 12, padding: 16, border: `1px solid ${vs.col}44` }}>
                    <div style={{ color: vs.col, fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{vs.label}</div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.65 }}>{result.verdictReason}</div>
                  </div>
                );
              })()}
            </div>
          )}
          {result?.error && <div style={{ color: C.red, fontSize: 14, textAlign: "center", marginTop: 60 }}>⚠️ 분석 오류. 다시 시도해 주세요.</div>}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// 메인 앱
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("assistant");
  const [todos, setTodos] = useState([
    { id: 1, text: "커피앱 최종 테스트", done: false },
    { id: 2, text: "Suno 40곡 DistroKid 업로드", done: false },
    { id: 3, text: "팔국지 6화 초고 작성", done: false },
    { id: 4, text: "스마트스토어 블로그 SEO", done: false },
  ]);

  const tabs = [
    { id: "assistant", icon: <Ic n="bot" s={20}/>, label: "AI 비서" },
    { id: "dashboard", icon: <Ic n="chart" s={20}/>, label: "사업현황" },
    { id: "strategy", icon: <Ic n="strategy" s={20}/>, label: "전략기획" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: C.bg, fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif", color: C.text, overflow: "hidden" }}>
      {/* 상단 헤더 */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, paddingTop: "calc(12px + env(safe-area-inset-top, 0px))" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.gold, letterSpacing: 1.5, lineHeight: 1 }}>DOUBLE Y</div>
          <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 2 }}>AGENT STUDIO</div>
        </div>
        <div style={{ fontSize: 11, color: C.textDim, textAlign: "right" }}>
          {new Date().toLocaleDateString("ko-KR", { month:"short", day:"numeric", weekday:"short" })}
          <br/>
          <span style={{ color: C.green, fontSize: 10 }}>● 온라인</span>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tab === "assistant" && <AssistantTab todos={todos} setTodos={setTodos}/>}
        {tab === "dashboard" && <DashboardTab/>}
        {tab === "strategy" && <StrategyTab/>}
      </div>

      {/* 하단 탭바 */}
      <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {tabs.map(t => <BottomTab key={t.id} active={tab===t.id} onClick={() => setTab(t.id)} icon={t.icon} label={t.label}/>)}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.3} }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #3a3a36; border-radius: 2px; }
      `}</style>
    </div>
  );
}
