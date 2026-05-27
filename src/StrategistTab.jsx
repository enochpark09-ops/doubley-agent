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

// ── 3사업부 9파이프라인 체제 (HANOK 2026.5.26 확정) ──
const BIZ_UNITS = [
  { id: "creative", label: "크리에이티브", emoji: "📡", color: C.gold },
  { id: "content", label: "콘텐츠", emoji: "✍️", color: C.purple },
  { id: "store", label: "스토어", emoji: "🏪", color: C.teal },
];

const PIPELINES = [
  // 사업부 ① 크리에이티브 (6)
  { id: "politics", label: "정치 (BluntEdge)", emoji: "🎙️", color: C.red, unit: "creative", channels: ["YouTube","BluntEdge","X"], metric: "콘텐츠" },
  { id: "sports", label: "스포츠 (EdgeStats)", emoji: "⚽", color: C.blue, unit: "creative", channels: ["YouTube","X","IG"], metric: "콘텐츠" },
  { id: "economy", label: "경제 (MF)", emoji: "📈", color: C.green, unit: "creative", channels: ["네이버","X"], metric: "포스트" },
  { id: "life", label: "라이프 (onedo4u)", emoji: "☕", color: C.bronze, unit: "creative", channels: ["YouTube","onedo4u","X","IG"], metric: "포스트" },
  { id: "culture", label: "문화예술", emoji: "🎨", color: C.amber, unit: "creative", channels: ["onedo4u","X","IG"], metric: "포스트" },
  { id: "philosophy", label: "철학", emoji: "📜", color: "#9a8ec0", unit: "creative", channels: ["YouTube","X"], metric: "에세이" },
  // 사업부 ② 콘텐츠 (2)
  { id: "novel", label: "웹소설 (새작품)", emoji: "📖", color: C.purple, unit: "content", channels: ["조아라/문피아"], metric: "화" },
  { id: "music", label: "음원 (Suno→DistroKid)", emoji: "🎵", color: C.pink, unit: "content", channels: ["DistroKid"], metric: "곡" },
  // 사업부 ③ 스토어 (3)
  { id: "coffee", label: "커피 원두", emoji: "☕", color: "#6b4226", unit: "store", channels: ["스마트스토어"], metric: "상품/매출" },
  { id: "interior", label: "인테리어 시공", emoji: "🏠", color: "#cc9a6d", unit: "store", channels: ["스마트스토어"], metric: "건/매출" },
  { id: "ikea", label: "이케아 가구", emoji: "🪑", color: "#0051ba", unit: "store", channels: ["스마트스토어"], metric: "상품/매출" },
];

// 하위 호환: 기존 CHANNELS 참조가 있는 곳용
const CHANNELS = PIPELINES;

// ── 크리에이티브 파이프라인 일일 스케줄 (CEO 손글씨 기반) ──
const DEFAULT_SCHEDULE = [
  // 정치 BluntEdge
  { id: "pol_1", pipeline: "politics", time: "09:00", task: "사설 3개 핫이슈 도출", round: 1 },
  { id: "pol_2", pipeline: "politics", time: "12:00", task: "정책분석 글 작성 + 감성 분석", round: 2 },
  { id: "pol_3", pipeline: "politics", time: "15:00", task: "유튜브 라이브 2개 + 연관 콘텐츠 쓰레드", round: 3 },
  // 경제 MF
  { id: "eco_1", pipeline: "economy", time: "09:00", task: "콘텐츠 기사 작성", round: 1 },
  { id: "eco_2", pipeline: "economy", time: "13:00", task: "MLB 실적 기사", round: 2 },
  // 스포츠 EdgeStats
  { id: "spo_1", pipeline: "sports", time: "11:00", task: "리서치 / 기사 작성", round: 1 },
  { id: "spo_2", pipeline: "sports", time: "13:00", task: "MLB 실적 기사 작성", round: 2 },
  { id: "spo_3", pipeline: "sports", time: "14:00", task: "KBO 5개 팀 피칭 + 그래프/데이터", round: 3 },
  // 라이프 onedo4u
  { id: "lif_1", pipeline: "life", time: "09:00", task: "커피 포스팅 2가지", round: 1 },
  { id: "lif_2", pipeline: "life", time: "13:00", task: "인테리어 관련 글", round: 2 },
  // 문화예술
  { id: "cul_1", pipeline: "culture", time: "11:00", task: "소식 / 레퍼런스 2가지", round: 1 },
  { id: "cul_2", pipeline: "culture", time: "14:00", task: "영화평 / 에세이 작업", round: 2 },
  // 철학
  { id: "phi_1", pipeline: "philosophy", time: "14:00", task: "문화활동 / 에세이", round: 1 },
  // 자기계발 (cross-pipeline)
  { id: "self_1", pipeline: "_self", time: "23:00", task: "2가지 아이디어 정리", round: 1 },
  { id: "self_2", pipeline: "_self", time: "09:00", task: "사업용 이슈 정리", round: 2 },
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
  const [view, setView] = useState("schedule");
  // 전략기획자 AI 결과
  const [briefing, setBriefing] = useState(() => ls.get(`strat_briefing_${date}`, null));
  const [briefingLoading, setBriefingLoading] = useState(false);
  // 일일 스케줄 체크
  const [scheduleChecks, setScheduleChecks] = useState(() => ls.get(`strat_sched_${date}`, {}));
  // 스케줄 편집
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [customSchedule, setCustomSchedule] = useState(() => ls.get("strat_schedule_custom", null));
  const activeSchedule = customSchedule || DEFAULT_SCHEDULE;

  useEffect(() => { ls.set(`strat_daily_${date}`, dailyActual); }, [dailyActual, date]);
  useEffect(() => { if (monthlyGoals) ls.set(`strat_goals_${monthKey}`, monthlyGoals); }, [monthlyGoals, monthKey]);
  useEffect(() => { if (briefing) ls.set(`strat_briefing_${date}`, briefing); }, [briefing, date]);
  useEffect(() => { ls.set(`strat_sched_${date}`, scheduleChecks); }, [scheduleChecks, date]);
  useEffect(() => { if (customSchedule) ls.set("strat_schedule_custom", customSchedule); }, [customSchedule]);

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
        schedule_progress: {
          total: activeSchedule.length,
          done: activeSchedule.filter(s => scheduleChecks[s.id]).length,
          pending: activeSchedule.filter(s => !scheduleChecks[s.id]).map(s => `${s.time} ${s.task}`),
        },
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
    { id: "schedule", label: "스케줄", icon: "⏰" },
    { id: "daily", label: "일일", icon: "📊" },
    { id: "weekly", label: "주간", icon: "📈" },
    { id: "monthly", label: "월간", icon: "📅" },
    { id: "goals", label: "목표", icon: "🎯" },
  ];

  // ── 스케줄 뷰 ──
  const renderSchedule = () => {
    const toggleCheck = (id) => setScheduleChecks(prev => ({ ...prev, [id]: !prev[id] }));
    const checkedCount = activeSchedule.filter(s => scheduleChecks[s.id]).length;
    const totalCount = activeSchedule.length;
    const pct = totalCount > 0 ? Math.round(checkedCount / totalCount * 100) : 0;

    // 시간순 정렬
    const sorted = [...activeSchedule].sort((a, b) => a.time.localeCompare(b.time));

    // 시간대별 그룹핑
    const timeGroups = {};
    sorted.forEach(s => {
      if (!timeGroups[s.time]) timeGroups[s.time] = [];
      timeGroups[s.time].push(s);
    });
    const timeKeys = Object.keys(timeGroups).sort();

    // 현재 시간 판단
    const now = new Date();
    const nowH = now.getHours();
    const nowM = now.getMinutes();
    const nowStr = `${String(nowH).padStart(2,"0")}:${String(nowM).padStart(2,"0")}`;

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
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 6, textAlign: "center" }}>{checkedCount} / {totalCount} 완료 {pct === 100 ? "🎉 오늘 스케줄 완주!" : ""}</div>
        </div>

        {/* 타임라인 */}
        {timeKeys.map((time, ti) => {
          const items = timeGroups[time];
          const isPast = time < nowStr;
          const isCurrent = ti < timeKeys.length - 1 ? time <= nowStr && nowStr < timeKeys[ti + 1] : time <= nowStr;
          return (
            <div key={time} style={{ marginBottom: 12 }}>
              {/* 시간 헤더 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: isCurrent ? C.gold : isPast ? C.green : C.border,
                  boxShadow: isCurrent ? `0 0 8px ${C.gold}` : "none",
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? C.gold : isPast ? C.textMuted : C.text, fontFamily: MONO }}>{time}</span>
                <div style={{ flex: 1, height: 1, background: isCurrent ? `${C.gold}44` : `${C.border}` }} />
              </div>
              {/* 작업 카드들 */}
              {items.map(item => {
                const pipe = PIPELINES.find(p => p.id === item.pipeline);
                const done = scheduleChecks[item.id];
                const color = pipe ? pipe.color : C.textMuted;
                const label = pipe ? pipe.label : "자기계발";
                const emoji = pipe ? pipe.emoji : "💡";
                return (
                  <div key={item.id} onClick={() => toggleCheck(item.id)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 4, marginLeft: 18,
                    borderRadius: 10, background: C.surface, border: `1px solid ${done ? `${color}55` : C.border}`,
                    borderLeft: `3px solid ${done ? C.green : color}`, cursor: "pointer", opacity: done ? 0.65 : 1, transition: "all .15s",
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 5, border: `2px solid ${done ? C.green : C.border}`,
                      background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, color: "#1a1a18", fontSize: 12, fontWeight: 700,
                    }}>{done ? "✓" : ""}</div>
                    <span style={{ fontSize: 14 }}>{emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: done ? C.textDim : C.text, textDecoration: done ? "line-through" : "none" }}>{item.task}</div>
                      <div style={{ fontSize: 9, color: color, fontWeight: 600, marginTop: 2 }}>{label}</div>
                    </div>
                    <Badge text={`R${item.round}`} color={color} small />
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* 스케줄 편집 버튼 */}
        <button onClick={() => setEditingSchedule(!editingSchedule)} style={{
          width: "100%", marginTop: 10, padding: "10px", borderRadius: 8, fontSize: 11, fontFamily: "inherit",
          cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted,
        }}>{editingSchedule ? "✕ 편집 닫기" : "✏️ 스케줄 편집"}</button>

        {editingSchedule && (
          <div style={{ background: C.surface, borderRadius: 12, padding: 14, marginTop: 10, border: `1px solid ${C.goldDim}` }}>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10 }}>시간과 작업 내용을 수정하세요. 저장하면 매일 이 스케줄이 적용됩니다.</div>
            {activeSchedule.map((item, idx) => {
              const pipe = PIPELINES.find(p => p.id === item.pipeline);
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `1px solid ${C.border}22` }}>
                  <span style={{ fontSize: 12 }}>{pipe ? pipe.emoji : "💡"}</span>
                  <input type="time" value={item.time}
                    onChange={e => {
                      const updated = [...activeSchedule];
                      updated[idx] = { ...item, time: e.target.value };
                      setCustomSchedule(updated);
                    }}
                    style={{ width: 70, padding: "3px 6px", borderRadius: 4, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontFamily: MONO }} />
                  <input value={item.task}
                    onChange={e => {
                      const updated = [...activeSchedule];
                      updated[idx] = { ...item, task: e.target.value };
                      setCustomSchedule(updated);
                    }}
                    style={{ flex: 1, padding: "4px 8px", borderRadius: 4, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 11, fontFamily: "inherit", outline: "none" }} />
                  <button onClick={() => {
                    const updated = activeSchedule.filter((_, i) => i !== idx);
                    setCustomSchedule(updated);
                  }} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setCustomSchedule(null)} style={{
                flex: 1, padding: "8px", borderRadius: 8, fontSize: 11, fontFamily: "inherit",
                cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted,
              }}>🔄 기본값 복원</button>
              <button onClick={() => setEditingSchedule(false)} style={{
                flex: 1, padding: "8px", borderRadius: 8, fontSize: 11, fontFamily: "inherit", fontWeight: 700,
                cursor: "pointer", border: "none", background: `linear-gradient(135deg,${C.bronze},${C.gold})`, color: "#1a1a18",
              }}>✅ 저장 완료</button>
            </div>
          </div>
        )}
      </>
    );
  };

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

      {/* 오늘 실적 입력 — 사업부별 그룹핑 */}
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 8 }}>📊 오늘 실적 입력</div>
      <div style={{ fontSize: 10, color: C.textDim, marginBottom: 10 }}>각 파이프라인의 오늘 발행 수를 입력하세요. 자동 저장됩니다.</div>

      {BIZ_UNITS.map(unit => {
        const pipelines = PIPELINES.filter(p => p.unit === unit.id);
        return (
          <div key={unit.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, padding: "4px 0" }}>
              <span style={{ fontSize: 13 }}>{unit.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: unit.color, letterSpacing: 1, fontFamily: MONO }}>{unit.label.toUpperCase()}</span>
              <div style={{ flex: 1, height: 1, background: `${unit.color}44` }} />
            </div>
            {pipelines.map(ch => {
              const target = getDailyTarget(ch.id);
              const actual = dailyActual[ch.id] || 0;
              const pct = target > 0 ? Math.round(actual / target * 100) : 0;
              return (
                <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 4, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${ch.color}` }}>
                  <span style={{ fontSize: 16 }}>{ch.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{ch.label}</div>
                    <div style={{ fontSize: 9, color: C.textDim }}>목표: {target}{ch.metric}/일</div>
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

        {BIZ_UNITS.map(unit => {
          const pipelines = PIPELINES.filter(p => p.unit === unit.id);
          return (
            <div key={unit.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, padding: "2px 0" }}>
                <span style={{ fontSize: 12 }}>{unit.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: unit.color, letterSpacing: 1, fontFamily: MONO }}>{unit.label.toUpperCase()}</span>
                <div style={{ flex: 1, height: 1, background: `${unit.color}44` }} />
              </div>
              {pipelines.map(ch => {
                const weekTotal = days.reduce((s, d) => s + (d.data[ch.id] || 0), 0);
                const weekTarget = getDailyTarget(ch.id) * 5;
                const pct = weekTarget > 0 ? Math.round(weekTotal / weekTarget * 100) : 0;
                return (
                  <div key={ch.id} style={{ background: C.surface, borderRadius: 10, padding: 10, marginBottom: 6, border: `1px solid ${C.border}`, borderLeft: `3px solid ${ch.color}` }}>
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

        {monthlyGoals && BIZ_UNITS.map(unit => {
          const pipelines = PIPELINES.filter(p => p.unit === unit.id);
          return (
            <div key={unit.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, padding: "2px 0" }}>
                <span style={{ fontSize: 12 }}>{unit.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: unit.color, letterSpacing: 1, fontFamily: MONO }}>{unit.label.toUpperCase()}</span>
                <div style={{ flex: 1, height: 1, background: `${unit.color}44` }} />
              </div>
              {pipelines.map(ch => {
                const goal = monthlyGoals[ch.id] || 0;
                const actual = getMonthlyActual(ch.id);
                const pct = goal > 0 ? Math.round(actual / goal * 100) : 0;
                const gap = goal - actual;
                const remainDays = new Date(year, month, 0).getDate() - day;
                const dailyNeeded = remainDays > 0 ? Math.ceil(gap / remainDays) : gap;
                return (
                  <div key={ch.id} style={{ background: C.surface, borderRadius: 10, padding: 12, marginBottom: 6, border: `1px solid ${C.border}`, borderLeft: `3px solid ${ch.color}` }}>
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
                        남은 GAP: {gap}{ch.metric} · 남은 {remainDays}일 · 일 {dailyNeeded}{ch.metric} 필요
                      </div>
                    )}
                  </div>
                );
              })}
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
            {BIZ_UNITS.map(unit => {
              const pipelines = PIPELINES.filter(p => p.unit === unit.id);
              return (
                <div key={unit.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, padding: "2px 0" }}>
                    <span style={{ fontSize: 12 }}>{unit.emoji}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: unit.color, letterSpacing: 1, fontFamily: MONO }}>{unit.label.toUpperCase()}</span>
                    <div style={{ flex: 1, height: 1, background: `${unit.color}44` }} />
                  </div>
                  {pipelines.map(ch => (
                    <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 4, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${ch.color}` }}>
                      <span>{ch.emoji}</span>
                      <span style={{ flex: 1, fontSize: 11, color: C.text }}>{ch.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.gold, fontFamily: MONO }}>{monthlyGoals[ch.id] || 0}</span>
                      <span style={{ fontSize: 10, color: C.textDim }}>{ch.metric}/월</span>
                    </div>
                  ))}
                </div>
              );
            })}
            <button onClick={() => { setEditingGoals(true); setGoalDraft({ ...monthlyGoals }); }} style={{
              width: "100%", marginTop: 10, padding: "10px", borderRadius: 8, fontSize: 11, fontFamily: "inherit",
              cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted,
            }}>✏️ 목표 수정</button>
          </>
        )}

        {editingGoals && (
          <div style={{ background: C.surface, borderRadius: 12, padding: 14, border: `1px solid ${C.goldDim}` }}>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10 }}>각 파이프라인의 월간 목표 수를 입력하세요.</div>
            {BIZ_UNITS.map(unit => {
              const pipelines = PIPELINES.filter(p => p.unit === unit.id);
              return (
                <div key={unit.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, padding: "4px 0" }}>
                    <span style={{ fontSize: 12 }}>{unit.emoji}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: unit.color, letterSpacing: 1 }}>{unit.label}</span>
                  </div>
                  {pipelines.map(ch => (
                    <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}22` }}>
                      <span>{ch.emoji}</span>
                      <span style={{ flex: 1, fontSize: 11, color: C.text }}>{ch.label}</span>
                      <input type="number" value={goalDraft[ch.id] || ""} placeholder="0"
                        onChange={e => setGoalDraft(prev => ({ ...prev, [ch.id]: parseInt(e.target.value) || 0 }))}
                        style={{ width: 60, padding: "4px 8px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, fontFamily: MONO, textAlign: "center" }} />
                      <span style={{ fontSize: 10, color: C.textDim, minWidth: 30 }}>{ch.metric}/월</span>
                    </div>
                  ))}
                </div>
              );
            })}
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
        {view === "schedule" && renderSchedule()}
        {view === "daily" && renderDaily()}
        {view === "weekly" && renderWeekly()}
        {view === "monthly" && renderMonthly()}
        {view === "goals" && renderGoals()}
      </div>
    </div>
  );
}
