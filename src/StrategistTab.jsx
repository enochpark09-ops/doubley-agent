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

const CHANNELS = [
  { id: "politics_blog", label: "정치 블로그", emoji: "🎙️", color: C.red },
  { id: "politics_shorts", label: "정치 쇼츠", emoji: "🎬", color: C.red },
  { id: "politics_x", label: "정치 X", emoji: "🐦", color: C.red },
  { id: "sports_blog", label: "스포츠 블로그", emoji: "⚽", color: C.blue },
  { id: "sports_x", label: "스포츠 X", emoji: "🐦", color: C.blue },
  { id: "sports_ig", label: "스포츠 IG", emoji: "📸", color: C.blue },
  { id: "economy_blog", label: "경제 블로그", emoji: "📈", color: C.green },
  { id: "life_blog", label: "라이프 블로그", emoji: "☕", color: C.bronze },
  { id: "novel", label: "웹소설 (화)", emoji: "📖", color: C.purple },
  { id: "music", label: "음원 (곡)", emoji: "🎵", color: C.pink },
  { id: "shorts", label: "YouTube Shorts", emoji: "🎬", color: C.amber },
];

const todayKST = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return { date: `${y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`, weekday: weekdays[d.getDay()], dayIndex: d.getDay(), month: m, year: y, day };
};

const getMonthKey = (y, m) => `${y}-${String(m).padStart(2,"0")}`;
const getWeekKey = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return `W${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,"0")}-${String(monday.getDate()).padStart(2,"0")}`;
};

export default function StrategistTab() {
  const { date, weekday, month, year, day, dayIndex } = todayKST();
  const monthKey = getMonthKey(year, month);
  const weekKey = getWeekKey(date);

  // 일일 실적
  const [dailyActual, setDailyActual] = useState(() => ls.get(`strat_daily_${date}`, {}));
  // 월간 목표
  const [monthlyGoals, setMonthlyGoals] = useState(() => ls.get(`strat_goals_${monthKey}`, null));
  // 목표 편집 모드
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalDraft, setGoalDraft] = useState({});
  // 뷰
  const [view, setView] = useState("daily");
  // 전략기획자 AI 결과
  const [briefing, setBriefing] = useState(() => ls.get(`strat_briefing_${date}`, null));
  const [briefingLoading, setBriefingLoading] = useState(false);

  useEffect(() => { ls.set(`strat_daily_${date}`, dailyActual); }, [dailyActual, date]);
  useEffect(() => { if (monthlyGoals) ls.set(`strat_goals_${monthKey}`, monthlyGoals); }, [monthlyGoals, monthKey]);
  useEffect(() => { if (briefing) ls.set(`strat_briefing_${date}`, briefing); }, [briefing, date]);

  // 일일 목표 (월간 목표에서 계산 — 영업일 기준)
  const getDailyTarget = (channelId) => {
    if (!monthlyGoals || !monthlyGoals[channelId]) return 0;
    const total = monthlyGoals[channelId];
    // 대략 22 영업일 기준
    return Math.ceil(total / 22);
  };

  // 월간 누적 실적 계산
  const getMonthlyActual = (channelId) => {
    let total = 0;
    const y = year, m = month;
    for (let d = 1; d <= day; d++) {
      const dk = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const data = ls.get(`strat_daily_${dk}`, {});
      total += (data[channelId] || 0);
    }
    return total;
  };

  // 전략기획자 AI 브리핑 호출
  const generateBriefing = async () => {
    setBriefingLoading(true);
    try {
      // 전일 실적 가져오기
      const yesterday = new Date(new Date(date).getTime() - 86400000);
      const yd = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;
      const yesterdayData = ls.get(`strat_daily_${yd}`, {});

      // 월간 누적
      const monthlyActuals = {};
      CHANNELS.forEach(ch => { monthlyActuals[ch.id] = getMonthlyActual(ch.id); });

      const payload = {
        date, weekday, dayIndex, month, year, day,
        monthly_goals: monthlyGoals || {},
        monthly_actuals: monthlyActuals,
        yesterday_actuals: yesterdayData,
        channels: CHANNELS.map(c => ({ id: c.id, label: c.label })),
        is_monday: dayIndex === 1,
        is_month_end: new Date(year, month, 0).getDate() === day,
        is_month_start: day === 1,
      };

      const res = await fetch("/api/strategist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBriefing(data);
    } catch (e) {
      setBriefing({ error: e.message });
    }
    setBriefingLoading(false);
  };

  const navBtns = [
    { id: "daily", label: "일일", icon: "📊" },
    { id: "weekly", label: "주간", icon: "📈" },
    { id: "monthly", label: "월간", icon: "📅" },
    { id: "goals", label: "목표설정", icon: "🎯" },
  ];

  // ── 일일 뷰 ──
  const renderDaily = () => (
    <>
      {/* 전략기획자 브리핑 */}
      <div style={{ background: `linear-gradient(135deg,${C.surface},#2a2520)`, borderRadius: 14, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>🧠 전략기획자 브리핑</div>
            <div style={{ fontSize: 10, color: C.textDim }}>{date} {weekday}요일</div>
          </div>
          <button onClick={generateBriefing} disabled={briefingLoading} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 11, fontFamily: "inherit", fontWeight: 700,
            cursor: briefingLoading ? "not-allowed" : "pointer", border: "none",
            background: briefingLoading ? C.surface2 : `linear-gradient(135deg,${C.bronze},${C.gold})`,
            color: briefingLoading ? C.textDim : "#1a1a18",
          }}>
            {briefingLoading ? "⏳ 분석 중..." : briefing ? "🔄 재생성" : "▶ 브리핑 생성"}
          </button>
        </div>

        {briefing && !briefing.error && (
          <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto", padding: "10px 12px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
            {briefing.briefing_text || JSON.stringify(briefing, null, 2)}
          </div>
        )}
        {briefing?.error && (
          <div style={{ fontSize: 11, color: C.red, padding: "8px 12px", background: `${C.red}11`, borderRadius: 8 }}>{briefing.error}</div>
        )}
        {!briefing && !briefingLoading && (
          <div style={{ fontSize: 11, color: C.textDim, padding: "10px 12px", background: C.bg, borderRadius: 8 }}>
            브리핑을 생성하면 오늘 목표, 전일 실적, 월간 달성률을 한눈에 확인할 수 있습니다.
          </div>
        )}
      </div>

      {/* 오늘 실적 입력 */}
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 8 }}>📊 오늘 실적 입력</div>
      <div style={{ fontSize: 10, color: C.textDim, marginBottom: 10 }}>각 채널의 오늘 발행 수를 입력하세요. 자동 저장됩니다.</div>

      {CHANNELS.map(ch => {
        const target = getDailyTarget(ch.id);
        const actual = dailyActual[ch.id] || 0;
        const pct = target > 0 ? Math.round(actual / target * 100) : 0;
        return (
          <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 4, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 16 }}>{ch.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{ch.label}</div>
              <div style={{ fontSize: 9, color: C.textDim }}>목표: {target}개/일</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setDailyActual(prev => ({ ...prev, [ch.id]: Math.max(0, (prev[ch.id]||0) - 1) }))}
                style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 14, cursor: "pointer" }}>−</button>
              <span style={{ fontSize: 16, fontWeight: 700, color: actual >= target && target > 0 ? C.green : C.text, minWidth: 24, textAlign: "center", fontFamily: MONO }}>{actual}</span>
              <button onClick={() => setDailyActual(prev => ({ ...prev, [ch.id]: (prev[ch.id]||0) + 1 }))}
                style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 14, cursor: "pointer" }}>+</button>
            </div>
            {target > 0 && <Badge text={`${pct}%`} color={pct >= 100 ? C.green : pct >= 50 ? C.amber : C.red} small />}
          </div>
        );
      })}
    </>
  );

  // ── 주간 뷰 ──
  const renderWeekly = () => {
    const days = [];
    const today = new Date(date);
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const weekdays = ["일","월","화","수","목","금","토"];
      days.push({ date: dk, label: weekdays[d.getDay()], data: ls.get(`strat_daily_${dk}`, {}), isToday: dk === date });
    }

    return (
      <>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 8 }}>📈 주간 실적 ({days[0].date} ~ {days[6].date})</div>

        {CHANNELS.map(ch => {
          const weekTotal = days.reduce((s, d) => s + (d.data[ch.id] || 0), 0);
          const weekTarget = getDailyTarget(ch.id) * 5; // 영업일 5일
          const pct = weekTarget > 0 ? Math.round(weekTotal / weekTarget * 100) : 0;
          return (
            <div key={ch.id} style={{ background: C.surface, borderRadius: 10, padding: 10, marginBottom: 6, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{ch.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.text, flex: 1 }}>{ch.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? C.green : C.text, fontFamily: MONO }}>{weekTotal}</span>
                <span style={{ fontSize: 10, color: C.textDim }}>/ {weekTarget}</span>
                <Badge text={`${pct}%`} color={pct >= 100 ? C.green : pct >= 70 ? C.amber : C.red} small />
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                {days.map((d, i) => {
                  const v = d.data[ch.id] || 0;
                  return (
                    <div key={i} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: d.isToday ? C.gold : C.textDim }}>{d.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: v > 0 ? C.green : C.textDim, fontFamily: MONO }}>{v}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  // ── 월간 뷰 ──
  const renderMonthly = () => {
    return (
      <>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 8 }}>📅 {year}년 {month}월 실적</div>

        {!monthlyGoals && (
          <div style={{ padding: 20, textAlign: "center", color: C.textDim, fontSize: 12 }}>
            월간 목표가 설정되지 않았습니다. "목표설정" 탭에서 먼저 목표를 설정하세요.
          </div>
        )}

        {monthlyGoals && CHANNELS.map(ch => {
          const goal = monthlyGoals[ch.id] || 0;
          const actual = getMonthlyActual(ch.id);
          const pct = goal > 0 ? Math.round(actual / goal * 100) : 0;
          const gap = goal - actual;
          const remainDays = new Date(year, month, 0).getDate() - day;
          const dailyNeeded = remainDays > 0 ? Math.ceil(gap / remainDays) : gap;

          return (
            <div key={ch.id} style={{ background: C.surface, borderRadius: 10, padding: 12, marginBottom: 6, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{ch.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.text, flex: 1 }}>{ch.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: pct >= 100 ? C.green : C.text, fontFamily: MONO }}>{actual}</span>
                <span style={{ fontSize: 10, color: C.textDim }}>/ {goal}</span>
                <Badge text={`${pct}%`} color={pct >= 100 ? C.green : pct >= 70 ? C.amber : C.red} />
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 3, marginBottom: 4 }}>
                <div style={{ height: "100%", borderRadius: 3, background: pct >= 100 ? C.green : pct >= 70 ? C.amber : C.red, width: `${Math.min(pct, 100)}%`, transition: "width .5s" }} />
              </div>
              {gap > 0 && (
                <div style={{ fontSize: 9, color: C.textDim }}>
                  남은 GAP: {gap}개 · 남은 {remainDays}일 · 일 {dailyNeeded}개 필요
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  };

  // ── 목표 설정 뷰 ──
  const renderGoals = () => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonthKey = getMonthKey(nextYear, nextMonth);
    const nextGoals = ls.get(`strat_goals_${nextMonthKey}`, null);

    return (
      <>
        {/* 이번 달 목표 */}
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 8 }}>🎯 {year}년 {month}월 목표</div>

        {!monthlyGoals && !editingGoals && (
          <div style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 10 }}>이번 달 목표가 아직 설정되지 않았습니다.</div>
            <button onClick={() => { setEditingGoals(true); setGoalDraft({}); }} style={{
              padding: "10px 24px", borderRadius: 8, fontSize: 12, fontFamily: "inherit", fontWeight: 700,
              cursor: "pointer", border: "none", background: `linear-gradient(135deg,${C.bronze},${C.gold})`, color: "#1a1a18",
            }}>🎯 목표 설정하기</button>
          </div>
        )}

        {monthlyGoals && !editingGoals && (
          <>
            {CHANNELS.map(ch => (
              <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 4, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}` }}>
                <span>{ch.emoji}</span>
                <span style={{ flex: 1, fontSize: 11, color: C.text }}>{ch.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.gold, fontFamily: MONO }}>{monthlyGoals[ch.id] || 0}</span>
                <span style={{ fontSize: 10, color: C.textDim }}>개/월</span>
              </div>
            ))}
            <button onClick={() => { setEditingGoals(true); setGoalDraft({ ...monthlyGoals }); }} style={{
              width: "100%", marginTop: 10, padding: "10px", borderRadius: 8, fontSize: 11, fontFamily: "inherit",
              cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted,
            }}>✏️ 목표 수정</button>
          </>
        )}

        {editingGoals && (
          <div style={{ background: C.surface, borderRadius: 12, padding: 14, border: `1px solid ${C.goldDim}` }}>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10 }}>각 채널의 월간 목표 수를 입력하세요.</div>
            {CHANNELS.map(ch => (
              <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}22` }}>
                <span>{ch.emoji}</span>
                <span style={{ flex: 1, fontSize: 11, color: C.text }}>{ch.label}</span>
                <input type="number" value={goalDraft[ch.id] || ""} placeholder="0"
                  onChange={e => setGoalDraft(prev => ({ ...prev, [ch.id]: parseInt(e.target.value) || 0 }))}
                  style={{ width: 60, padding: "4px 8px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: MONO, textAlign: "center" }} />
                <span style={{ fontSize: 10, color: C.textDim, minWidth: 30 }}>개/월</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => { setMonthlyGoals(goalDraft); setEditingGoals(false); }} style={{
                flex: 1, padding: "10px", borderRadius: 8, fontSize: 12, fontFamily: "inherit", fontWeight: 700,
                cursor: "pointer", border: "none", background: `linear-gradient(135deg,${C.bronze},${C.gold})`, color: "#1a1a18",
              }}>✅ 목표 확정</button>
              <button onClick={() => setEditingGoals(false)} style={{
                flex: 1, padding: "10px", borderRadius: 8, fontSize: 12, fontFamily: "inherit",
                cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted,
              }}>취소</button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 4, padding: "8px 14px", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {navBtns.map(b => (
          <button key={b.id} onClick={() => setView(b.id)} style={{
            flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 11, fontFamily: "inherit", fontWeight: view === b.id ? 700 : 400,
            cursor: "pointer", border: view === b.id ? `1px solid ${C.gold}` : `1px solid ${C.border}`,
            background: view === b.id ? C.goldDim : "transparent", color: view === b.id ? C.gold : C.textDim,
          }}>
            {b.icon} {b.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {view === "daily" && renderDaily()}
        {view === "weekly" && renderWeekly()}
        {view === "monthly" && renderMonthly()}
        {view === "goals" && renderGoals()}
      </div>
    </div>
  );
}
