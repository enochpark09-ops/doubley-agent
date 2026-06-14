import { useState, useEffect } from "react";

const C = {
  bg: "#1a1a18", surface: "#242422", surface2: "#2a2a27", border: "#3a3a36",
  gold: "#C4A86C", goldDim: "#c4a86c33", bronze: "#8B7355",
  text: "#e8e4dc", textMuted: "#9a9690", textDim: "#6a6660",
  green: "#6dcc7a", greenDim: "#6dcc7a22", red: "#e07070", blue: "#7aabcc",
  pink: "#cc7aa0", purple: "#a07acc", amber: "#ccaa5a", teal: "#5ac0a0",
};
const ls = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const MONO = "'IBM Plex Mono', monospace";

const Badge = ({ text, color, small }) => (
  <span style={{ fontSize: small ? 8 : 9, padding: small ? "1px 5px" : "2px 7px", borderRadius: 8, background: `${color}22`, color, border: `1px solid ${color}44`, fontWeight: 600, whiteSpace: "nowrap" }}>{text}</span>
);

// ── 3사업부 체제 ──
const BIZ_UNITS = [
  { id: "creative", label: "크리에이티브", emoji: "📡", color: C.gold },
  { id: "content", label: "콘텐츠", emoji: "✍️", color: C.purple },
  { id: "store", label: "스토어", emoji: "🏪", color: C.teal },
];

const PIPELINES = [
  { id: "politics", label: "정치 (BluntEdge)", emoji: "🎙️", color: C.red, unit: "creative", channels: ["YouTube","BluntEdge","X"], metric: "콘텐츠" },
  { id: "sports", label: "스포츠 (EdgeStats)", emoji: "⚽", color: C.blue, unit: "creative", channels: ["YouTube","X","IG"], metric: "콘텐츠" },
  { id: "economy", label: "경제 (MarketEdge)", emoji: "📈", color: C.green, unit: "creative", channels: ["YouTube","X"], metric: "포스트" },
  { id: "life", label: "라이프 (onedo4u)", emoji: "☕", color: C.bronze, unit: "creative", channels: ["YouTube","onedo4u","X","IG"], metric: "포스트" },
  { id: "culture", label: "문화예술", emoji: "🎨", color: C.amber, unit: "creative", channels: ["onedo4u","X","IG"], metric: "포스트" },
  { id: "philosophy", label: "철학", emoji: "📜", color: "#9a8ec0", unit: "creative", channels: ["YouTube","X"], metric: "에세이" },
  { id: "novel", label: "웹소설 (새작품)", emoji: "📖", color: C.purple, unit: "content", channels: ["조아라/문피아"], metric: "화" },
  { id: "music", label: "음원 (Suno→DistroKid)", emoji: "🎵", color: C.pink, unit: "content", channels: ["DistroKid"], metric: "곡" },
  { id: "coffee", label: "커피 원두", emoji: "☕", color: "#6b4226", unit: "store", channels: ["스마트스토어"], metric: "상품/매출" },
  { id: "interior", label: "인테리어 시공", emoji: "🏠", color: "#cc9a6d", unit: "store", channels: ["스마트스토어"], metric: "건/매출" },
  { id: "ikea", label: "이케아 가구", emoji: "🪑", color: "#0051ba", unit: "store", channels: ["스마트스토어"], metric: "상품/매출" },
];
const CHANNELS = PIPELINES;

// ── 채널 링크 데이터 ──
const CHANNEL_LINKS = {
  "YouTube_politics": { url: "https://youtube.com/@wjdcldbxnqj", opened: true },
  "BluntEdge_politics": { url: "https://thebluntedge.com", opened: true },
  "X_politics": { url: "https://x.com/blunt_edge_", opened: true },
  "YouTube_sports": { url: "https://youtube.com/@EdgeStats", opened: true },
  "X_sports": { url: "https://x.com/sportsedgestats", opened: true },
  "IG_sports": { url: "https://instagram.com/edgestats_", opened: true },
  "YouTube_economy": { url: "https://youtube.com/@MarketEdgeHanok", opened: true },
  "X_economy": { url: "https://x.com/market_edge_", opened: true },
  "YouTube_life": { url: "", opened: false },
  "onedo4u_life": { url: "https://onedo4u.com", opened: true },
  "X_life": { url: "", opened: false },
  "IG_life": { url: "", opened: false },
  "onedo4u_culture": { url: "", opened: false },
  "X_culture": { url: "", opened: false },
  "IG_culture": { url: "", opened: false },
  "YouTube_philosophy": { url: "", opened: false },
  "X_philosophy": { url: "", opened: false },
  "조아라/문피아_novel": { url: "", opened: false },
  "DistroKid_music": { url: "", opened: true },
};

// ── AI 제안 기본 투두 (파이프라인별) ──
const DEFAULT_TODOS_BY_PIPELINE = [
  // 🎙️ BluntEdge (정치)
  { id: "dt_pol_1", text: "BluntEdge 포스트 작성 (AdSense 15개 채우기)", pipeline: "politics", emoji: "🎙️", color: "#e07070" },
  { id: "dt_pol_2", text: "BluntEdge YouTube 쇼츠 업로드", pipeline: "politics", emoji: "🎙️", color: "#e07070" },
  { id: "dt_pol_3", text: "BluntEdge X 쓰레드 포스팅", pipeline: "politics", emoji: "🎙️", color: "#e07070" },
  // 📈 MarketEdge (경제)
  { id: "dt_eco_1", text: "MarketEdge 일일 스케줄 cron 설정 확인", pipeline: "economy", emoji: "📈", color: "#6dcc7a" },
  { id: "dt_eco_2", text: "MarketEdge X 자동포스팅 동작 확인", pipeline: "economy", emoji: "📈", color: "#6dcc7a" },
  { id: "dt_eco_3", text: "MarketEdge YouTube Shorts 업로드", pipeline: "economy", emoji: "📈", color: "#6dcc7a" },
  // ⚽ EdgeStats (스포츠)
  { id: "dt_spo_1", text: "KBO 파워랭킹 주간 업데이트 (월요일)", pipeline: "sports", emoji: "⚽", color: "#7aabcc" },
  { id: "dt_spo_2", text: "EdgeStats Instagram 카드뉴스 생성", pipeline: "sports", emoji: "⚽", color: "#7aabcc" },
  { id: "dt_spo_3", text: "EdgeStats YouTube Shorts 업로드", pipeline: "sports", emoji: "⚽", color: "#7aabcc" },
  // ☕ onedo4u (라이프)
  { id: "dt_lif_1", text: "onedo4u 블로그 포스트 작성 (커피/인테리어)", pipeline: "life", emoji: "☕", color: "#8B7355" },
  { id: "dt_lif_2", text: "onedo4u AdSense 재심사 포스트 추가", pipeline: "life", emoji: "☕", color: "#8B7355" },
  // 📖 웹소설
  { id: "dt_nov_1", text: "웹소설 새 작품 플롯/기획 작업", pipeline: "novel", emoji: "📖", color: "#a07acc" },
  { id: "dt_nov_2", text: "조아라/문피아 계정 개설 및 연재 준비", pipeline: "novel", emoji: "📖", color: "#a07acc" },
  // 🏗️ 앱 개발
  { id: "dt_dev_1", text: "doubley-agent PWA 업데이트 배포", pipeline: "_dev", emoji: "🛠️", color: "#C4A86C" },
  { id: "dt_dev_2", text: "Wonduroom 네이버 스마트스토어 상품 등록", pipeline: "_dev", emoji: "🏪", color: "#5ac0a0" },
];

// ── 일일 스케줄 ──
const DEFAULT_SCHEDULE = [
  { id: "pol_1", pipeline: "politics", time: "09:00", task: "사설 3개 핫이슈 도출", round: 1 },
  { id: "pol_2", pipeline: "politics", time: "12:00", task: "정책분석 글 작성 + 감성 분석", round: 2 },
  { id: "pol_3", pipeline: "politics", time: "15:00", task: "유튜브 라이브 2개 + 연관 콘텐츠 쓰레드", round: 3 },
  { id: "eco_1", pipeline: "economy", time: "09:00", task: "콘텐츠 기사 작성", round: 1 },
  { id: "eco_2", pipeline: "economy", time: "13:00", task: "MLB 실적 기사", round: 2 },
  { id: "spo_1", pipeline: "sports", time: "11:00", task: "리서치 / 기사 작성", round: 1 },
  { id: "spo_2", pipeline: "sports", time: "13:00", task: "MLB 실적 기사 작성", round: 2 },
  { id: "spo_3", pipeline: "sports", time: "14:00", task: "KBO 5개 팀 피칭 + 그래프/데이터", round: 3 },
  { id: "lif_1", pipeline: "life", time: "09:00", task: "커피 포스팅 2가지", round: 1 },
  { id: "lif_2", pipeline: "life", time: "13:00", task: "인테리어 관련 글", round: 2 },
  { id: "cul_1", pipeline: "culture", time: "11:00", task: "소식 / 레퍼런스 2가지", round: 1 },
  { id: "cul_2", pipeline: "culture", time: "14:00", task: "영화평 / 에세이 작업", round: 2 },
  { id: "phi_1", pipeline: "philosophy", time: "14:00", task: "문화활동 / 에세이", round: 1 },
  { id: "self_1", pipeline: "_self", time: "23:00", task: "2가지 아이디어 정리", round: 1 },
  { id: "self_2", pipeline: "_self", time: "09:00", task: "사업용 이슈 정리", round: 2 },
];

const todayKST = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return { date: `${y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`, weekday: weekdays[d.getDay()], month: m, year: y, day, dayIndex: d.getDay() };
};
const getMonthKey = (y, m) => `${y}-${String(m).padStart(2,"0")}`;

export default function StrategistTab() {
  const { date, weekday, month, year, day, dayIndex } = todayKST();
  const monthKey = getMonthKey(year, month);

  // 상위 탭: 스케줄 / 피드백
  const [mainTab, setMainTab] = useState("schedule");

  // 일일 실적
  const [dailyActual, setDailyActual] = useState(() => ls.get(`strat_daily_${date}`, {}));
  // 월간 목표
  const [monthlyGoals, setMonthlyGoals] = useState(() => ls.get(`strat_goals_${monthKey}`, null));
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalDraft, setGoalDraft] = useState({});
  // 피드백 서브탭
  const [feedbackTab, setFeedbackTab] = useState("daily");
  // 스케줄
  const [scheduleChecks, setScheduleChecks] = useState(() => ls.get(`strat_sched_${date}`, {}));
  const [customSchedule, setCustomSchedule] = useState(() => ls.get("strat_schedule_custom", null));
  const activeSchedule = customSchedule || DEFAULT_SCHEDULE;
  const [editingSchedule, setEditingSchedule] = useState(false);
  // 브리핑
  const [briefing, setBriefing] = useState(() => ls.get(`strat_briefing_${date}`, null));
  const [briefingLoading, setBriefingLoading] = useState(false);
  // 투두리스트 (새 구조: { id, text, time, done, scheduled } )
  const [todos, setTodos] = useState(() => ls.get(`strat_todos_${date}`, []));
  const [newTodo, setNewTodo] = useState("");
  const [showTodoInput, setShowTodoInput] = useState(false);
  // 스케줄 단계: "write" (투두 작성) | "assign" (시간 배치)
  const [scheduleStep, setScheduleStep] = useState(() => {
    const saved = ls.get(`strat_step_${date}`, "write");
    return saved;
  });
  // 시간배치 완료 여부
  const isScheduleAssigned = todos.length > 0 && todos.every(t => t.time);
  // 배치 완료 확정 여부 (CEO가 명시적으로 "배치 완료" 눌렀을 때)
  const [assignConfirmed, setAssignConfirmed] = useState(() => ls.get(`strat_assign_confirmed_${date}`, false));

  useEffect(() => { ls.set(`strat_daily_${date}`, dailyActual); }, [dailyActual, date]);
  useEffect(() => { if (monthlyGoals) ls.set(`strat_goals_${monthKey}`, monthlyGoals); }, [monthlyGoals, monthKey]);
  useEffect(() => { ls.set(`strat_sched_${date}`, scheduleChecks); }, [scheduleChecks, date]);
  useEffect(() => { if (customSchedule) ls.set("strat_schedule_custom", customSchedule); }, [customSchedule]);
  useEffect(() => { if (briefing) ls.set(`strat_briefing_${date}`, briefing); }, [briefing, date]);
  useEffect(() => { ls.set(`strat_todos_${date}`, todos); }, [todos, date]);
  useEffect(() => { ls.set(`strat_step_${date}`, scheduleStep); }, [scheduleStep, date]);
  useEffect(() => { ls.set(`strat_assign_confirmed_${date}`, assignConfirmed); }, [assignConfirmed, date]);

  // 배치 완료 확정 시 텔레그램에 상태 동기화 (POST)
  useEffect(() => {
    if (!assignConfirmed) return;
    fetch("/api/schedule-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned: true, todos }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignConfirmed]);

  // 투두 함수들
  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo = { id: Date.now(), text: newTodo.trim(), done: false, time: "", createdAt: new Date().toISOString() };
    setTodos(prev => [...prev, todo]);
    setNewTodo("");
  };
  const toggleTodo = (id) => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTodo = (id) => setTodos(prev => prev.filter(t => t.id !== id));
  const setTodoTime = (id, time) => setTodos(prev => prev.map(t => t.id === id ? { ...t, time } : t));
  const moveTodoToTomorrow = (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    const tomorrow = new Date(new Date(date).getTime() + 86400000);
    const tmKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,"0")}-${String(tomorrow.getDate()).padStart(2,"0")}`;
    const tmTodos = ls.get(`strat_todos_${tmKey}`, []);
    ls.set(`strat_todos_${tmKey}`, [...tmTodos, { ...todo, done: false, time: "", id: Date.now() }]);
    setTodos(prev => prev.filter(t => t.id !== id));
  };
  const confirmAssign = () => {
    setAssignConfirmed(true);
    setScheduleStep("assigned");
  };

  const getDailyTarget = (chId) => {
    if (!monthlyGoals || !monthlyGoals[chId]) return 0;
    return Math.ceil(monthlyGoals[chId] / 22);
  };
  const getMonthlyActual = (chId) => {
    let total = 0;
    for (let d = 1; d <= day; d++) {
      const dk = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      total += (ls.get(`strat_daily_${dk}`, {})[chId] || 0);
    }
    return total;
  };

  const generateBriefing = async (sendTelegram = false) => {
    setBriefingLoading(true);
    try {
      const yesterday = new Date(new Date(date).getTime() - 86400000);
      const yd = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;
      const yesterdayData = ls.get(`strat_daily_${yd}`, {});
      const monthlyActuals = {};
      CHANNELS.forEach(ch => { monthlyActuals[ch.id] = getMonthlyActual(ch.id); });
      const payload = {
        date, weekday, dayIndex, month, year, day,
        monthly_goals: monthlyGoals || {},
        monthly_actuals: monthlyActuals,
        yesterday_actuals: yesterdayData,
        channels: CHANNELS.map(c => ({ id: c.id, label: c.label })),
        schedule_progress: {
          total: activeSchedule.length,
          done: activeSchedule.filter(s => scheduleChecks[s.id]).length,
          pending: activeSchedule.filter(s => !scheduleChecks[s.id]).map(s => `${s.time} ${s.task}`),
        },
        send_telegram: sendTelegram,
        todos: {
          total: todos.length,
          done: todos.filter(t => t.done).length,
          pending: todos.filter(t => !t.done).map(t => t.text),
        },
        is_monday: dayIndex === 1,
        is_month_end: new Date(year, month, 0).getDate() === day,
        is_month_start: day === 1,
      };
      const res = await fetch("/api/strategist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBriefing(data);
    } catch (e) { setBriefing({ error: e.message }); }
    setBriefingLoading(false);
  };

  // ════════════════════════════════════════
  // 스케줄 뷰 — 2-Step 플로우
  // ════════════════════════════════════════
  const renderSchedule = () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const nowStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const nowHour = now.getHours();

    // 배치 완료 후: 타임라인 실행 뷰
    if (assignConfirmed) {
      const sorted = [...todos].filter(t => t.time).sort((a, b) => a.time.localeCompare(b.time));
      const timeGroups = {};
      sorted.forEach(t => { if (!timeGroups[t.time]) timeGroups[t.time] = []; timeGroups[t.time].push(t); });
      const timeKeys = Object.keys(timeGroups).sort();
      const doneCount = todos.filter(t => t.done).length;
      const pct = todos.length > 0 ? Math.round(doneCount / todos.length * 100) : 0;

      return (
        <>
          {/* 헤더 + 진행률 */}
          <div style={{ background: C.surface, borderRadius: 12, padding: 14, marginBottom: 14, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>⏰ 오늘 스케줄</div>
                <div style={{ fontSize: 10, color: C.textDim }}>{date} {weekday}요일 · 배치 완료 ✅</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: pct === 100 ? C.green : C.gold }}>{pct}%</div>
                <button onClick={() => { setAssignConfirmed(false); setScheduleStep("assign"); }}
                  style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, cursor: "pointer", fontFamily: "inherit" }}>✏️ 재편집</button>
              </div>
            </div>
            <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
              <div style={{ height: "100%", borderRadius: 4, background: pct === 100 ? `linear-gradient(90deg,${C.green},#4aff7a)` : `linear-gradient(90deg,${C.bronze},${C.gold})`, width: `${pct}%`, transition: "width .5s ease" }} />
            </div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 6, textAlign: "center" }}>{doneCount} / {todos.length} 완료 {pct === 100 ? "🎉" : ""}</div>
          </div>

          {/* 타임라인 */}
          {timeKeys.map((time, ti) => {
            const items = timeGroups[time];
            const isPast = time < nowStr;
            const isCurrent = ti < timeKeys.length - 1 ? time <= nowStr && nowStr < timeKeys[ti + 1] : time <= nowStr;
            return (
              <div key={time} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: isCurrent ? C.gold : isPast ? C.green : C.border, boxShadow: isCurrent ? `0 0 8px ${C.gold}` : "none", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? C.gold : isPast ? C.textMuted : C.text, fontFamily: MONO }}>{time}</span>
                  <div style={{ flex: 1, height: 1, background: isCurrent ? `${C.gold}44` : C.border }} />
                </div>
                {items.map(todo => (
                  <div key={todo.id} onClick={() => toggleTodo(todo.id)} style={{ marginLeft: 18, marginBottom: 4, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: C.surface, border: `1px solid ${todo.done ? `${C.green}55` : C.border}`, borderLeft: `3px solid ${todo.done ? C.green : C.gold}`, cursor: "pointer", opacity: todo.done ? 0.6 : 1 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, border: `2px solid ${todo.done ? C.green : C.border}`, background: todo.done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#1a1a18", fontSize: 12, fontWeight: 700 }}>{todo.done ? "✓" : ""}</div>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: todo.done ? C.textDim : C.text, textDecoration: todo.done ? "line-through" : "none" }}>{todo.text}</span>
                  </div>
                ))}
              </div>
            );
          })}

          {/* 시간 미배치 항목 */}
          {todos.filter(t => !t.time).length > 0 && (
            <div style={{ marginTop: 8, padding: 12, background: C.surface, borderRadius: 10, border: `1px dashed ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.textDim, marginBottom: 6 }}>⚠️ 시간 미배치</div>
              {todos.filter(t => !t.time).map(todo => (
                <div key={todo.id} onClick={() => toggleTodo(todo.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 3, borderRadius: 8, background: C.surface2, cursor: "pointer", opacity: todo.done ? 0.6 : 1 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${todo.done ? C.green : C.border}`, background: todo.done ? C.green : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#1a1a18", fontWeight: 700 }}>{todo.done ? "✓" : ""}</div>
                  <span style={{ fontSize: 11, color: todo.done ? C.textDim : C.text, textDecoration: todo.done ? "line-through" : "none" }}>{todo.text}</span>
                </div>
              ))}
            </div>
          )}
        </>
      );
    }

    // ── STEP 1: 투두 작성 ──
    if (scheduleStep === "write") {
      const deadline6am = nowHour >= 6;
      const addedIds = new Set(todos.map(t => t.sourceId).filter(Boolean));

      const addSuggested = (item) => {
        if (addedIds.has(item.id)) return;
        setTodos(prev => [...prev, { id: Date.now() + Math.random(), text: item.text, time: "", done: false, sourceId: item.id, createdAt: new Date().toISOString() }]);
      };

      const addAllSuggested = () => {
        const toAdd = DEFAULT_TODOS_BY_PIPELINE.filter(i => !addedIds.has(i.id));
        if (!toAdd.length) return;
        setTodos(prev => [...prev, ...toAdd.map(i => ({ id: Date.now() + Math.random(), text: i.text, time: "", done: false, sourceId: i.id, createdAt: new Date().toISOString() }))]);
      };

      return (
        <>
          {/* 상태 배너 */}
          <div style={{ background: deadline6am ? `${C.red}18` : `${C.gold}15`, borderRadius: 12, padding: 14, marginBottom: 14, border: `1px solid ${deadline6am ? C.red : C.gold}44` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: deadline6am ? C.red : C.gold, marginBottom: 4 }}>
              {deadline6am ? "⚠️ 새벽 6시가 지났습니다!" : "📝 STEP 1 — 오늘 할 일 작성"}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
              {deadline6am
                ? "시간 배치를 아직 완료하지 않았어요. 지금 바로 할 일을 입력하고 시간을 배치해주세요."
                : "새벽 6시 전까지 할 일을 선택/입력하고 시간 배치를 완료하세요. 배치 전까지 매시간 텔레그램 알림이 옵니다."}
            </div>
          </div>

          {/* ── AI 추천 할일 목록 ── */}
          <div style={{ background: C.surface, borderRadius: 14, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>🤖 AI 추천 할일</div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>탭하면 오늘 목록에 추가됩니다</div>
              </div>
              <button onClick={addAllSuggested} style={{ fontSize: 10, padding: "5px 10px", borderRadius: 7, border: `1px solid ${C.gold}55`, background: `${C.gold}15`, color: C.gold, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>
                전체 추가 +
              </button>
            </div>
            {[
              { key: "politics", label: "🎙️ BluntEdge", color: C.red },
              { key: "economy",  label: "📈 MarketEdge", color: C.green },
              { key: "sports",   label: "⚽ EdgeStats",  color: C.blue },
              { key: "life",     label: "☕ onedo4u",    color: C.bronze },
              { key: "novel",    label: "📖 웹소설",      color: C.purple },
              { key: "_dev",     label: "🛠️ 개발/운영",  color: C.gold },
            ].map(group => {
              const items = DEFAULT_TODOS_BY_PIPELINE.filter(i => i.pipeline === group.key);
              return (
                <div key={group.key} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: group.color, marginBottom: 5 }}>{group.label}</div>
                  {items.map(item => {
                    const added = addedIds.has(item.id);
                    return (
                      <div key={item.id} onClick={() => addSuggested(item)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 3, borderRadius: 8, background: added ? `${group.color}12` : C.surface2, border: `1px solid ${added ? group.color + "44" : C.border}`, cursor: added ? "default" : "pointer", opacity: added ? 0.55 : 1 }}>
                        <span style={{ fontSize: 13, flexShrink: 0, color: added ? C.green : C.textDim }}>{added ? "✓" : "+"}</span>
                        <span style={{ flex: 1, fontSize: 11, color: added ? C.textDim : C.text, textDecoration: added ? "line-through" : "none" }}>{item.text}</span>
                        {added && <span style={{ fontSize: 9, color: group.color, fontWeight: 600 }}>추가됨</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* ── 직접 추가 ── */}
          <div style={{ background: C.surface, borderRadius: 14, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>✏️ 직접 추가</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <input value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addTodo(); }}
                placeholder="직접 할 일 입력 후 Enter..."
                style={{ flex: 1, padding: "9px 12px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
              <button onClick={addTodo} style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: "#6B1D2A", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>추가</button>
            </div>
            {todos.length === 0
              ? <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", padding: "12px 0" }}>위 추천 항목을 선택하거나 직접 입력하세요</div>
              : (
                <>
                  <div style={{ fontSize: 10, color: C.textDim, marginBottom: 6 }}>오늘 할 일 — {todos.length}개 선택됨</div>
                  {todos.map(todo => (
                    <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 3, borderRadius: 8, background: C.surface2, border: `1px solid ${C.border}` }}>
                      <span style={{ flex: 1, fontSize: 11, color: C.text }}>{todo.text}</span>
                      <button onClick={() => deleteTodo(todo.id)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 14, padding: "0 4px", flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                </>
              )
            }
          </div>

          {/* 다음 단계 */}
          {todos.length > 0 && (
            <button onClick={() => setScheduleStep("assign")} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${C.bronze},${C.gold})`, color: "#1a1a18", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
              ➡️ STEP 2: 시간 배치하기 ({todos.length}개)
            </button>
          )}
        </>
      );
    }

    // ── STEP 2: 시간 배치 ──
    const unassigned = todos.filter(t => !t.time).length;
    return (
      <>
        {/* 헤더 */}
        <div style={{ background: C.surface, borderRadius: 12, padding: 14, marginBottom: 14, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>🕐 STEP 2 — 시간 배치</div>
            <button onClick={() => setScheduleStep("write")} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, cursor: "pointer", fontFamily: "inherit" }}>← 목록으로</button>
          </div>
          <div style={{ fontSize: 11, color: C.textMuted }}>
            각 할 일에 시간을 배치하세요. 배치 완료 후 텔레그램 알림이 해당 시간에 옵니다.
          </div>
          {unassigned > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: C.amber, fontWeight: 600 }}>⏳ {unassigned}개 미배치</div>
          )}
        </div>

        {/* 시간 배치 목록 */}
        {todos.map(todo => (
          <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 6, borderRadius: 10, background: C.surface, border: `1px solid ${todo.time ? `${C.gold}44` : C.border}`, borderLeft: `3px solid ${todo.time ? C.gold : C.border}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{todo.text}</div>
              {todo.time && <div style={{ fontSize: 10, color: C.gold, marginTop: 2, fontFamily: MONO }}>{todo.time}</div>}
            </div>
            <input
              type="time"
              value={todo.time || ""}
              onChange={e => setTodoTime(todo.id, e.target.value)}
              style={{ width: 80, padding: "5px 8px", borderRadius: 6, background: C.bg, border: `1px solid ${todo.time ? C.gold : C.border}`, color: todo.time ? C.gold : C.textMuted, fontSize: 12, fontFamily: MONO, cursor: "pointer" }}
            />
            <button onClick={() => deleteTodo(todo.id)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 14, padding: "0 4px", flexShrink: 0 }}>×</button>
          </div>
        ))}

        {/* 배치 완료 버튼 */}
        <button
          onClick={confirmAssign}
          disabled={unassigned > 0}
          style={{ width: "100%", marginTop: 10, padding: "13px", borderRadius: 10, border: "none", background: unassigned > 0 ? C.surface2 : `linear-gradient(135deg,${C.bronze},${C.gold})`, color: unassigned > 0 ? C.textDim : "#1a1a18", fontSize: 13, fontWeight: 800, cursor: unassigned > 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {unassigned > 0 ? `⏳ ${unassigned}개 시간을 배치해야 완료됩니다` : "✅ 배치 완료 — 스케줄 시작!"}
        </button>
      </>
    );
  };

  // ════════════════════════════════════════
  // 피드백 — 일간
  // ════════════════════════════════════════
  const renderFeedbackDaily = () => {
    const yesterday = new Date(new Date(date).getTime() - 86400000);
    const yd = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;
    const yesterdayData = ls.get(`strat_daily_${yd}`, {});

    return (
      <>
        {/* AI 브리핑 */}
        <div style={{ background: `linear-gradient(135deg,${C.surface},#2a2520)`, borderRadius: 14, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>🧠 일간 브리핑</div>
              <div style={{ fontSize: 10, color: C.textDim }}>{date} {weekday}요일 · 매일 오전 5시 자동 생성</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {briefing && !briefing.error && (
                <button onClick={() => generateBriefing(true)} disabled={briefingLoading} style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: briefingLoading ? "not-allowed" : "pointer", border: "1px solid #229ED9", background: "transparent", color: "#229ED9" }}>📨</button>
              )}
              <button onClick={() => generateBriefing(false)} disabled={briefingLoading} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontFamily: "inherit", fontWeight: 700, cursor: briefingLoading ? "not-allowed" : "pointer", border: "none", background: briefingLoading ? C.surface2 : `linear-gradient(135deg,${C.bronze},${C.gold})`, color: briefingLoading ? C.textDim : "#1a1a18" }}>
                {briefingLoading ? "⏳ 분석중..." : briefing ? "🔄 재생성" : "▶ 브리핑 생성"}
              </button>
            </div>
          </div>
          {briefing && !briefing.error && (
            <>
              <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto", padding: "10px 12px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                {briefing.briefing_text || JSON.stringify(briefing, null, 2)}
              </div>
              {briefing.telegram_sent && <div style={{ fontSize: 10, color: "#229ED9", marginTop: 6, textAlign: "right" }}>📨 텔레그램 전송 완료</div>}
            </>
          )}
          {briefing?.error && <div style={{ fontSize: 11, color: C.red, padding: "8px 12px", background: `${C.red}11`, borderRadius: 8 }}>{briefing.error}</div>}
          {!briefing && !briefingLoading && <div style={{ fontSize: 11, color: C.textDim, padding: "10px 12px", background: C.bg, borderRadius: 8 }}>브리핑을 생성하면 전일 실적, 조회수, 구독자 현황을 확인할 수 있습니다.</div>}
        </div>

        {/* 전일 발행 내역 */}
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 8 }}>📋 전일 발행 내역</div>
        {Object.keys(yesterdayData).length === 0 && <div style={{ fontSize: 11, color: C.textDim, padding: 12, background: C.surface, borderRadius: 8 }}>전일 데이터가 없습니다.</div>}
        {Object.keys(yesterdayData).length > 0 && BIZ_UNITS.map(unit => {
          const pipes = PIPELINES.filter(p => p.unit === unit.id && yesterdayData[p.id]);
          if (pipes.length === 0) return null;
          return (
            <div key={unit.id} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: unit.color, marginBottom: 4 }}>{unit.emoji} {unit.label}</div>
              {pipes.map(ch => (
                <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 3, borderRadius: 8, background: C.surface, borderLeft: `3px solid ${ch.color}` }}>
                  <span>{ch.emoji}</span>
                  <span style={{ flex: 1, fontSize: 11, color: C.text }}>{ch.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.green, fontFamily: MONO }}>{yesterdayData[ch.id]}</span>
                  <span style={{ fontSize: 9, color: C.textDim }}>{ch.metric}</span>
                </div>
              ))}
            </div>
          );
        })}

        {/* 오늘 실적 입력 */}
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 8, marginTop: 14 }}>📊 오늘 실적 입력</div>
        {BIZ_UNITS.map(unit => {
          const pipes = PIPELINES.filter(p => p.unit === unit.id);
          return (
            <div key={unit.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11 }}>{unit.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: unit.color, fontFamily: MONO }}>{unit.label.toUpperCase()}</span>
                <div style={{ flex: 1, height: 1, background: `${unit.color}44` }} />
              </div>
              {pipes.map(ch => {
                const target = getDailyTarget(ch.id);
                const actual = dailyActual[ch.id] || 0;
                const pct = target > 0 ? Math.round(actual / target * 100) : 0;
                return (
                  <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 3, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${ch.color}` }}>
                    <span style={{ fontSize: 16 }}>{ch.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{ch.label}</div>
                      <div style={{ fontSize: 9, color: C.textDim }}>목표: {target}{ch.metric}/일</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => setDailyActual(prev => ({ ...prev, [ch.id]: Math.max(0, (prev[ch.id]||0) - 1) }))} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 14, cursor: "pointer" }}>−</button>
                      <span style={{ fontSize: 16, fontWeight: 700, color: actual >= target && target > 0 ? C.green : C.text, minWidth: 24, textAlign: "center", fontFamily: MONO }}>{actual}</span>
                      <button onClick={() => setDailyActual(prev => ({ ...prev, [ch.id]: (prev[ch.id]||0) + 1 }))} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 14, cursor: "pointer" }}>+</button>
                    </div>
                    {target > 0 && <Badge text={`${pct}%`} color={pct >= 100 ? C.green : pct >= 50 ? C.amber : C.red} small />}
                  </div>
                );
              })}
            </div>
          );
        })}
      </>
    );
  };

  // ════════════════════════════════════════
  // 피드백 — 주간
  // ════════════════════════════════════════
  const renderFeedbackWeekly = () => {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const monday = new Date(d); monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
    const days = Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(monday); dd.setDate(monday.getDate() + i);
      const dk = `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}-${String(dd.getDate()).padStart(2,"0")}`;
      return { label: ["월","화","수","목","금","토","일"][i], date: dk, data: ls.get(`strat_daily_${dk}`, {}), isToday: dk === date };
    });
    return (
      <>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 4 }}>📈 주간 실적 ({days[0].date} ~ {days[6].date})</div>
        <div style={{ fontSize: 10, color: C.textDim, marginBottom: 10 }}>매주 월요일 자동 보고서 생성</div>
        {BIZ_UNITS.map(unit => {
          const pipes = PIPELINES.filter(p => p.unit === unit.id);
          return (
            <div key={unit.id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: unit.color, marginBottom: 4 }}>{unit.emoji} {unit.label}</div>
              {pipes.map(ch => {
                const weekTotal = days.reduce((s, d) => s + (d.data[ch.id] || 0), 0);
                const weekTarget = getDailyTarget(ch.id) * 5;
                const pct = weekTarget > 0 ? Math.round(weekTotal / weekTarget * 100) : 0;
                return (
                  <div key={ch.id} style={{ background: C.surface, borderRadius: 10, padding: 10, marginBottom: 4, border: `1px solid ${C.border}`, borderLeft: `3px solid ${ch.color}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{ch.emoji}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.text, flex: 1 }}>{ch.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? C.green : C.text, fontFamily: MONO }}>{weekTotal}</span>
                      <span style={{ fontSize: 10, color: C.textDim }}>/ {weekTarget}</span>
                      {weekTarget > 0 && <Badge text={`${pct}%`} color={pct >= 100 ? C.green : pct >= 70 ? C.amber : C.red} small />}
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {days.map((d, i) => (
                        <div key={i} style={{ flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: 8, color: d.isToday ? C.gold : C.textDim }}>{d.label}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: (d.data[ch.id] || 0) > 0 ? C.green : C.textDim, fontFamily: MONO }}>{d.data[ch.id] || 0}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </>
    );
  };

  // ════════════════════════════════════════
  // 피드백 — 월간 + 목표설정
  // ════════════════════════════════════════
  const renderFeedbackMonthly = () => {
    return (
      <>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 4 }}>📅 {year}년 {month}월 실적 + 목표</div>
        <div style={{ fontSize: 10, color: C.textDim, marginBottom: 10 }}>매월 1일 자동 보고서 생성 · 전략기획자가 목표 제안 → CEO 수정</div>

        {/* 목표 설정 / 실적 통합 */}
        {!monthlyGoals && !editingGoals && (
          <div style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12 }}>월간 목표가 설정되지 않았습니다.</div>
            <button onClick={() => { setEditingGoals(true); setGoalDraft({}); }} style={{ padding: "10px 24px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: `linear-gradient(135deg,${C.bronze},${C.gold})`, color: "#1a1a18", fontFamily: "inherit" }}>🎯 목표 설정</button>
          </div>
        )}

        {monthlyGoals && !editingGoals && (
          <>
            {BIZ_UNITS.map(unit => {
              const pipes = PIPELINES.filter(p => p.unit === unit.id);
              return (
                <div key={unit.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: unit.color, marginBottom: 4 }}>{unit.emoji} {unit.label}</div>
                  {pipes.map(ch => {
                    const goal = monthlyGoals[ch.id] || 0;
                    const actual = getMonthlyActual(ch.id);
                    const pct = goal > 0 ? Math.round(actual / goal * 100) : 0;
                    const gap = goal - actual;
                    const remainDays = new Date(year, month, 0).getDate() - day;
                    const dailyNeeded = remainDays > 0 ? Math.ceil(gap / remainDays) : gap;
                    return (
                      <div key={ch.id} style={{ background: C.surface, borderRadius: 10, padding: 12, marginBottom: 4, border: `1px solid ${C.border}`, borderLeft: `3px solid ${ch.color}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 13 }}>{ch.emoji}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.text, flex: 1 }}>{ch.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: pct >= 100 ? C.green : C.text, fontFamily: MONO }}>{actual}</span>
                          <span style={{ fontSize: 10, color: C.textDim }}>/ {goal}</span>
                          {goal > 0 && <Badge text={`${pct}%`} color={pct >= 100 ? C.green : pct >= 70 ? C.amber : C.red} />}
                        </div>
                        {goal > 0 && (
                          <div style={{ height: 6, background: C.border, borderRadius: 3, marginBottom: 4 }}>
                            <div style={{ height: "100%", borderRadius: 3, background: pct >= 100 ? C.green : pct >= 70 ? C.amber : C.red, width: `${Math.min(pct, 100)}%`, transition: "width .5s" }} />
                          </div>
                        )}
                        {gap > 0 && goal > 0 && <div style={{ fontSize: 9, color: C.textDim }}>GAP: {gap}{ch.metric} · {remainDays}일 남음 · 일 {dailyNeeded}{ch.metric} 필요</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <button onClick={() => { setEditingGoals(true); setGoalDraft({ ...monthlyGoals }); }} style={{ width: "100%", marginTop: 10, padding: "10px", borderRadius: 8, fontSize: 11, fontFamily: "inherit", cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted }}>✏️ 목표 수정</button>
          </>
        )}

        {editingGoals && (
          <div style={{ background: C.surface, borderRadius: 12, padding: 14, border: `1px solid ${C.goldDim}` }}>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10 }}>각 파이프라인의 월간 목표를 입력하세요.</div>
            {BIZ_UNITS.map(unit => {
              const pipes = PIPELINES.filter(p => p.unit === unit.id);
              return (
                <div key={unit.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: unit.color, marginBottom: 4 }}>{unit.emoji} {unit.label}</div>
                  {pipes.map(ch => (
                    <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.border}22` }}>
                      <span>{ch.emoji}</span>
                      <span style={{ flex: 1, fontSize: 11, color: C.text }}>{ch.label}</span>
                      <input type="number" value={goalDraft[ch.id] || ""} placeholder="0" onChange={e => setGoalDraft(prev => ({ ...prev, [ch.id]: parseInt(e.target.value) || 0 }))}
                        style={{ width: 60, padding: "4px 8px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: MONO, textAlign: "center" }} />
                      <span style={{ fontSize: 10, color: C.textDim, minWidth: 30 }}>{ch.metric}/월</span>
                    </div>
                  ))}
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => { setMonthlyGoals(goalDraft); setEditingGoals(false); }} style={{ flex: 1, padding: "10px", borderRadius: 8, fontSize: 12, fontFamily: "inherit", fontWeight: 700, cursor: "pointer", border: "none", background: `linear-gradient(135deg,${C.bronze},${C.gold})`, color: "#1a1a18" }}>✅ 목표 확정</button>
              <button onClick={() => setEditingGoals(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, fontSize: 12, fontFamily: "inherit", cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted }}>취소</button>
            </div>
          </div>
        )}
      </>
    );
  };

  // ════════════════════════════════════════
  // Main Return
  // ════════════════════════════════════════
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* 상위 탭: 스케줄 / 피드백 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        {[["schedule","⏰ 스케줄"],["feedback","📊 피드백"]].map(([id, label]) => (
          <button key={id} onClick={() => setMainTab(id)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: "none", borderBottom: `2px solid ${mainTab === id ? C.gold : "transparent"}`, color: mainTab === id ? C.gold : C.textMuted, fontSize: 13, fontFamily: "inherit", cursor: "pointer", fontWeight: mainTab === id ? 700 : 400 }}>{label}</button>
        ))}
      </div>

      {/* 피드백 서브탭 */}
      {mainTab === "feedback" && (
        <div style={{ display: "flex", gap: 4, padding: "6px 14px", background: C.surface2, flexShrink: 0 }}>
          {[["daily","일간"],["weekly","주간"],["monthly","월간"]].map(([id, label]) => (
            <button key={id} onClick={() => setFeedbackTab(id)} style={{ flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 11, fontFamily: "inherit", fontWeight: feedbackTab === id ? 700 : 400, cursor: "pointer", border: feedbackTab === id ? `1px solid ${C.gold}` : `1px solid ${C.border}`, background: feedbackTab === id ? C.goldDim : "transparent", color: feedbackTab === id ? C.gold : C.textDim }}>{label}</button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {mainTab === "schedule" && renderSchedule()}
        {mainTab === "feedback" && feedbackTab === "daily" && renderFeedbackDaily()}
        {mainTab === "feedback" && feedbackTab === "weekly" && renderFeedbackWeekly()}
        {mainTab === "feedback" && feedbackTab === "monthly" && renderFeedbackMonthly()}
      </div>
    </div>
  );
}
