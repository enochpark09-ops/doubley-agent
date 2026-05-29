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

  useEffect(() => { ls.set(`strat_daily_${date}`, dailyActual); }, [dailyActual, date]);
  useEffect(() => { if (monthlyGoals) ls.set(`strat_goals_${monthKey}`, monthlyGoals); }, [monthlyGoals, monthKey]);
  useEffect(() => { ls.set(`strat_sched_${date}`, scheduleChecks); }, [scheduleChecks, date]);
  useEffect(() => { if (customSchedule) ls.set("strat_schedule_custom", customSchedule); }, [customSchedule]);
  useEffect(() => { if (briefing) ls.set(`strat_briefing_${date}`, briefing); }, [briefing, date]);

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
  // 스케줄 뷰
  // ════════════════════════════════════════
  const renderSchedule = () => {
    const toggleCheck = (id) => setScheduleChecks(prev => ({ ...prev, [id]: !prev[id] }));
    const checkedCount = activeSchedule.filter(s => scheduleChecks[s.id]).length;
    const totalCount = activeSchedule.length;
    const pct = totalCount > 0 ? Math.round(checkedCount / totalCount * 100) : 0;
    const sorted = [...activeSchedule].sort((a, b) => a.time.localeCompare(b.time));
    const timeGroups = {};
    sorted.forEach(s => { if (!timeGroups[s.time]) timeGroups[s.time] = []; timeGroups[s.time].push(s); });
    const timeKeys = Object.keys(timeGroups).sort();
    const now = new Date();
    const nowStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

    return (
      <>
        {/* 진행률 바 */}
        <div style={{ background: C.surface, borderRadius: 12, padding: 14, marginBottom: 14, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>⏰ 오늘 스케줄</div>
              <div style={{ fontSize: 10, color: C.textDim }}>{date} {weekday}요일</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: pct === 100 ? C.green : C.gold }}>{pct}%</div>
          </div>
          <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
            <div style={{ height: "100%", borderRadius: 4, background: pct === 100 ? `linear-gradient(90deg,${C.green},#4aff7a)` : `linear-gradient(90deg,${C.bronze},${C.gold})`, width: `${pct}%`, transition: "width .5s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 6, textAlign: "center" }}>{checkedCount} / {totalCount} 완료 {pct === 100 ? "🎉" : ""}</div>
        </div>

        {/* 타임라인 */}
        {timeKeys.map((time, ti) => {
          const items = timeGroups[time];
          const isPast = time < nowStr;
          const isCurrent = ti < timeKeys.length - 1 ? time <= nowStr && nowStr < timeKeys[ti + 1] : time <= nowStr;
          return (
            <div key={time} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: isCurrent ? C.gold : isPast ? C.green : C.border, boxShadow: isCurrent ? `0 0 8px ${C.gold}` : "none", flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? C.gold : isPast ? C.textMuted : C.text, fontFamily: MONO }}>{time}</span>
                <div style={{ flex: 1, height: 1, background: isCurrent ? `${C.gold}44` : C.border }} />
              </div>
              {items.map(item => {
                const pipe = PIPELINES.find(p => p.id === item.pipeline);
                const done = scheduleChecks[item.id];
                const color = pipe ? pipe.color : C.textMuted;
                const label = pipe ? pipe.label : "자기계발";
                const emoji = pipe ? pipe.emoji : "💡";

                // 채널 링크들
                const channelLinks = pipe ? pipe.channels.map(ch => {
                  const key = `${ch}_${pipe.id}`;
                  const link = CHANNEL_LINKS[key];
                  return { name: ch, url: link?.url || "", opened: link?.opened || false };
                }) : [];

                return (
                  <div key={item.id} style={{ marginBottom: 4, marginLeft: 18 }}>
                    <div onClick={() => toggleCheck(item.id)} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                      borderRadius: 10, background: C.surface, border: `1px solid ${done ? `${color}55` : C.border}`,
                      borderLeft: `3px solid ${done ? C.green : color}`, cursor: "pointer", opacity: done ? 0.65 : 1, transition: "all .15s",
                    }}>
                      <div style={{ width: 22, height: 22, borderRadius: 5, border: `2px solid ${done ? C.green : C.border}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#1a1a18", fontSize: 12, fontWeight: 700 }}>{done ? "✓" : ""}</div>
                      <span style={{ fontSize: 14 }}>{emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: done ? C.textDim : C.text, textDecoration: done ? "line-through" : "none" }}>{item.task}</div>
                        <div style={{ fontSize: 9, color, fontWeight: 600, marginTop: 2 }}>{label}</div>
                      </div>
                      <Badge text={`R${item.round}`} color={color} small />
                    </div>
                    {/* 채널 링크 */}
                    {channelLinks.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, marginLeft: 34 }}>
                        {channelLinks.map((cl, ci) => (
                          cl.opened && cl.url ? (
                            <a key={ci} href={cl.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: `${color}15`, border: `1px solid ${color}33`, color, textDecoration: "none", fontWeight: 600 }}>{cl.name} →</a>
                          ) : (
                            <span key={ci} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: `${C.border}44`, border: `1px solid ${C.border}`, color: C.textDim, fontWeight: 600 }}>{cl.name} {cl.opened ? "" : "⚠️ 미개설"}</span>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* 편집 버튼 */}
        <button onClick={() => setEditingSchedule(!editingSchedule)} style={{ width: "100%", marginTop: 10, padding: "10px", borderRadius: 8, fontSize: 11, fontFamily: "inherit", cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted }}>
          {editingSchedule ? "✕ 편집 닫기" : "✏️ 스케줄 편집"}
        </button>
        {editingSchedule && (
          <div style={{ background: C.surface, borderRadius: 12, padding: 14, marginTop: 10, border: `1px solid ${C.goldDim}` }}>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10 }}>시간과 작업 내용을 수정하세요.</div>
            {activeSchedule.map((item, idx) => {
              const pipe = PIPELINES.find(p => p.id === item.pipeline);
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `1px solid ${C.border}22` }}>
                  <span style={{ fontSize: 12 }}>{pipe ? pipe.emoji : "💡"}</span>
                  <input type="time" value={item.time} onChange={e => { const u = [...activeSchedule]; u[idx] = { ...item, time: e.target.value }; setCustomSchedule(u); }}
                    style={{ width: 70, padding: "3px 6px", borderRadius: 4, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontFamily: MONO }} />
                  <input value={item.task} onChange={e => { const u = [...activeSchedule]; u[idx] = { ...item, task: e.target.value }; setCustomSchedule(u); }}
                    style={{ flex: 1, padding: "4px 8px", borderRadius: 4, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                  <button onClick={() => setCustomSchedule(activeSchedule.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setCustomSchedule(null)} style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 11, fontFamily: "inherit", cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted }}>🔄 기본값 복원</button>
              <button onClick={() => setEditingSchedule(false)} style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 11, fontFamily: "inherit", fontWeight: 700, cursor: "pointer", border: "none", background: `linear-gradient(135deg,${C.bronze},${C.gold})`, color: "#1a1a18" }}>✅ 저장</button>
            </div>
          </div>
        )}
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
