import { useState, useEffect } from "react";

const C = {
  bg: "#1a1a18", surface: "#242422", surface2: "#2a2a27", border: "#3a3a36",
  gold: "#C4A86C", goldDim: "#c4a86c33", bronze: "#8B7355",
  text: "#e8e4dc", textMuted: "#9a9690", textDim: "#6a6660",
  green: "#6dcc7a", greenDim: "#6dcc7a22", red: "#e07070", redDim: "#e0707022", blue: "#7aabcc",
  pink: "#cc7aa0", purple: "#a07acc", amber: "#ccaa5a", teal: "#5ac0a0",
};
const ls = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const MONO = "'IBM Plex Mono', monospace";

// ── 3명의 기획·분석부 AI ──────────────────────────────────
const DEPT_AGENTS = [
  {
    id: "planner",
    emoji: "🧠",
    name: "콘텐츠 기획자",
    sub: "Content Strategist",
    color: C.pink,
    status: "build",
    schedule: "매일 06:30",
    role: "무엇을 만들지 결정하고, 7개 파이프라인의 크로스연계를 설계",
    outputs: ["주간 캘린더 1건/주", "일일 안건 3개/일", "월간 로드맵 1건/월"],
    tools: ["Claude API", "Google Trends", "Naver DataLab"],
    workflow: [
      { time: "06:30", action: "리서처 브리프 수신 → 안건 후보 5개 생성", auto: true },
      { time: "06:45", action: "크로스연계 분석 (정치→경제, 소설→OST)", auto: true },
      { time: "07:00", action: "안건 3개 + 추천상품 매칭 → 모닝브리핑에 합류", auto: true },
      { time: "07:15", action: "CEO에게 모닝브리핑 전달 → 컨펌 대기", auto: false },
      { time: "11:00", action: "내일 콘텐츠 소재 사전 기획 시작", auto: true },
    ],
    buildTasks: [
      { text: "주간캘린더 자동생성 프롬프트 구축", done: false },
      { text: "7개 파이프라인 크로스연계 로직 설계", done: false },
      { text: "안건 생성 system prompt 최적화", done: false },
      { text: "Google Trends API 연동", done: false },
      { text: "Vercel cron 06:30 스케줄 등록", done: false },
    ],
  },
  {
    id: "researcher",
    emoji: "🔍",
    name: "리서처",
    sub: "Research Analyst",
    color: C.blue,
    status: "build",
    schedule: "매일 06:00",
    role: "콘텐츠 원재료(트렌드·키워드·팩트)를 수집하여 기획자와 편집장에게 전달",
    outputs: ["리서치 브리프 2건/일", "경쟁분석 1건/주", "키워드 분석 5건/주"],
    tools: ["웹서치", "Python 크롤링", "Claude API", "네이버 키워드 도구"],
    workflow: [
      { time: "06:00", action: "정치/경제/스포츠/라이프 뉴스 자동 수집", auto: true },
      { time: "06:10", action: "키워드 검색량·경쟁도 분석", auto: true },
      { time: "06:20", action: "경쟁 채널 상위노출 분석", auto: true },
      { time: "06:30", action: "리서치 브리프 2건 생성 → 기획자에게 전달", auto: true },
      { time: "11:00", action: "내일 콘텐츠용 심층 리서치 시작", auto: true },
    ],
    buildTasks: [
      { text: "뉴스·트렌드 웹서치 파이프라인 구축", done: false },
      { text: "키워드 분석 자동화 (Naver DataLab)", done: false },
      { text: "경쟁채널 크롤링 스크립트", done: false },
      { text: "리서치 브리프 JSON 포맷 정의", done: false },
      { text: "Vercel cron 06:00 스케줄 등록", done: false },
    ],
  },
  {
    id: "revenue",
    emoji: "💰",
    name: "수익 전략가",
    sub: "Revenue Strategist",
    color: C.amber,
    status: "build",
    schedule: "매일 06:30",
    role: "콘텐츠 주제별 최적 상품을 매칭하고, 제휴링크를 자동 삽입",
    outputs: ["추천상품 3건/일", "주간 수익분석 1건", "월간 전략리포트 1건"],
    tools: ["쿠팡파트너스 API", "Python 데이터분석", "Claude API"],
    workflow: [
      { time: "06:30", action: "기획자 안건 수신 → 주제별 상품 매칭", auto: true },
      { time: "06:40", action: "쿠팡파트너스 제휴링크 자동 생성", auto: true },
      { time: "06:50", action: "추천상품 3건 + 링크 → 모닝브리핑에 합류", auto: true },
      { time: "10:00", action: "전일 수익 데이터 수집 → ROI 분석", auto: true },
      { time: "10:15", action: "CEO에게 수익 현황 + 전략 제안 전달", auto: false },
    ],
    buildTasks: [
      { text: "쿠팡파트너스 가입 + API 연동", done: false },
      { text: "주제→상품 매칭 프롬프트 구축", done: false },
      { text: "제휴링크 자동삽입 로직 구현", done: false },
      { text: "수익 트래킹 대시보드 (Google Sheet)", done: false },
      { text: "ROI 분석 자동화 스크립트", done: false },
    ],
  },
];

// ── 전체 워크플로우 타임라인 ──────────────────────────────
const DAILY_TIMELINE = [
  { time: "06:00", phase: "A", label: "자동 기획", agents: ["researcher"], desc: "리서처가 뉴스·트렌드·키워드 자동 수집 시작", ceo: false },
  { time: "06:10", phase: "A", label: "자동 기획", agents: ["researcher"], desc: "키워드 검색량·경쟁도 분석 + 팩트체크", ceo: false },
  { time: "06:30", phase: "A", label: "자동 기획", agents: ["planner","revenue"], desc: "기획자: 안건 5개 생성 / 수익전략가: 상품 매칭", ceo: false },
  { time: "06:45", phase: "A", label: "자동 기획", agents: ["planner"], desc: "크로스연계 분석 + 안건 3개로 압축", ceo: false },
  { time: "07:00", phase: "A", label: "브리핑 합산", agents: ["planner","researcher","revenue"], desc: "3명의 결과물 → 모닝브리핑으로 통합", ceo: false },
  { time: "07:15", phase: "B", label: "CEO 1차 컨펌", agents: [], desc: "모닝브리핑 확인 → 안건 2건 채택 + 방향 지시", ceo: true, duration: "10분" },
  { time: "07:25", phase: "C", label: "제작 전달", agents: ["planner"], desc: "CEO 채택 안건 → 편집장/영상PD/웹소설 에이전트에게 전달", ceo: false },
  { time: "07:35", phase: "D", label: "CEO 2차 컨펌", agents: [], desc: "블로그 #1 검토 → 퍼스널터치 → 발행승인", ceo: true, duration: "15분" },
  { time: "08:00", phase: "D", label: "CEO 2차 컨펌", agents: [], desc: "블로그 #2 검토 → 발행승인", ceo: true, duration: "15분" },
  { time: "08:35", phase: "D", label: "CEO 2차 컨펌", agents: [], desc: "Shorts 영상 확인 → 업로드 승인", ceo: true, duration: "10분" },
  { time: "08:50", phase: "D", label: "CEO 2차 컨펌", agents: [], desc: "웹소설 에피소드 검토 → 퍼스널터치 → 발행 컨펌", ceo: true, duration: "20분" },
  { time: "09:15", phase: "D", label: "CEO 2차 컨펌", agents: [], desc: "음원 선곡 + 배포 컨펌 (화/금만)", ceo: true, duration: "10분" },
  { time: "09:30", phase: "D", label: "CEO 소통", agents: [], desc: "X/IG 포스팅 승인 + 커뮤니티 소통", ceo: true, duration: "45분" },
  { time: "10:00", phase: "E", label: "수익 분석", agents: ["revenue"], desc: "전일 수익 데이터 수집 → ROI 분석 → CEO에게 전달", ceo: false },
  { time: "10:15", phase: "E", label: "전략 컨펌", agents: [], desc: "수익 현황 확인 + 전략 방향 결정", ceo: true, duration: "15분" },
  { time: "11:00", phase: "F", label: "백그라운드", agents: ["planner","researcher"], desc: "내일 소재 기획 + 심층 리서치 (자동)", ceo: false },
  { time: "21:00", phase: "G", label: "이브닝 리뷰", agents: [], desc: "이브닝 리뷰 확인 + 내일 우선순위 결정", ceo: true, duration: "30분" },
];

const PHASE_COLORS = {
  A: { bg: "#1a2a40", color: C.blue, label: "자동 기획" },
  B: { bg: "#3a1a1a", color: C.red, label: "CEO 1차 컨펌" },
  C: { bg: "#1a3a2a", color: C.green, label: "제작 전달" },
  D: { bg: "#3a1a1a", color: C.red, label: "CEO 2차 컨펌" },
  E: { bg: "#2a2a1a", color: C.amber, label: "수익 분석" },
  F: { bg: "#1a2a2a", color: C.teal, label: "백그라운드" },
  G: { bg: "#2a1a2a", color: C.purple, label: "이브닝 리뷰" },
};

// ── 7개 파이프라인 ───────────────────────────────────────
const PIPELINES = [
  { id: "politics", emoji: "🎙️", name: "정치 (BluntEdge)", color: C.red, days: "월~금", frequency: "일 1~2편" },
  { id: "sports", emoji: "⚽", name: "스포츠 (EdgeStats)", color: C.blue, days: "월~금", frequency: "일 1~2편" },
  { id: "economy", emoji: "📈", name: "경제 (MF)", color: C.green, days: "월~금", frequency: "일 1편" },
  { id: "life", emoji: "☕", name: "라이프 (onedo)", color: C.bronze, days: "화/목/토", frequency: "주 3편" },
  { id: "novel", emoji: "📖", name: "웹소설", color: C.purple, days: "월~금", frequency: "일 1화" },
  { id: "music", emoji: "🎵", name: "음원", color: C.pink, days: "화/금", frequency: "주 2곡" },
  { id: "shorts", emoji: "🎬", name: "YouTube Shorts", color: C.amber, days: "월~금", frequency: "일 1편" },
];

const WEEK_SCHEDULE = {
  월: { main: "스포츠", sub: "경제", special: "주간캘린더 확인", novel: "1화", music: false },
  화: { main: "정치", sub: "라이프", special: "", novel: "2화", music: true },
  수: { main: "경제+롱폼", sub: "스포츠", special: "수요롱폼 발행", novel: "3화", music: false },
  목: { main: "스포츠", sub: "자기계발", special: "제품매니저 가동", novel: "4화", music: false },
  금: { main: "라이프", sub: "경제", special: "주말 예약발행", novel: "5화 (클리프행어)", music: true },
  토: { main: "—", sub: "—", special: "주간 리뷰 + 전략 조정", novel: "휴재", music: false },
  일: { main: "—", sub: "—", special: "휴식", novel: "다음주 개요 자동생성", music: false },
};

// ── 컴포넌트 ─────────────────────────────────────────────
const SectionHeader = ({ icon, title, sub }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 14, fontWeight: 800, color: C.gold, display: "flex", alignItems: "center", gap: 6 }}>
      <span>{icon}</span>{title}
    </div>
    {sub && <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Badge = ({ text, color, small }) => (
  <span style={{ fontSize: small ? 8 : 9, padding: small ? "1px 5px" : "2px 7px", borderRadius: 8, background: `${color}22`, color, border: `1px solid ${color}44`, fontWeight: 600, whiteSpace: "nowrap" }}>{text}</span>
);

export default function PlanningDeptTab() {
  const [view, setView] = useState("run");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [buildState, setBuildState] = useState(() => ls.get("planning_build_v1", {}));

  useEffect(() => { ls.set("planning_build_v1", buildState); }, [buildState]);

  const toggleBuild = (agentId, idx) => {
    setBuildState(prev => {
      const key = `${agentId}_${idx}`;
      return { ...prev, [key]: !prev[key] };
    });
  };

  // ── 실행 상태 ──
  const [runStatus, setRunStatus] = useState(() => ls.get("planning_status_v1", { researcher: "idle", planner: "idle", revenue: "idle", briefing: "idle" }));
  const [runResults, setRunResults] = useState(() => ls.get("planning_results_v1", { researcher: null, planner: null, revenue: null, briefing: null }));
  const [runLog, setRunLog] = useState(() => ls.get("planning_log_v1", []));
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState(() => ls.get("planning_last_run", null));

  // 결과가 바뀔 때마다 localStorage에 저장
  useEffect(() => { ls.set("planning_results_v1", runResults); }, [runResults]);
  useEffect(() => { ls.set("planning_status_v1", runStatus); }, [runStatus]);
  useEffect(() => { ls.set("planning_log_v1", runLog); }, [runLog]);

  const addLog = (msg) => setRunLog(prev => [...prev, { time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), msg }]);

  const runAgent = async (name, label, emoji) => {
    setRunStatus(prev => ({ ...prev, [name]: "running" }));
    addLog(`${emoji} ${label} 가동 시작...`);
    try {
      const res = await fetch(`/api/${name}?manual=1`);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }
      const data = await res.json();
      setRunResults(prev => ({ ...prev, [name]: data }));
      setRunStatus(prev => ({ ...prev, [name]: "done" }));
      addLog(`${emoji} ${label} 완료 ✓`);
      return data;
    } catch (e) {
      setRunStatus(prev => ({ ...prev, [name]: "error" }));
      addLog(`${emoji} ${label} 에러: ${e.message}`);
      return null;
    }
  };

  const runAll = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setRunLog([]);
    setRunResults({ researcher: null, planner: null, revenue: null, briefing: null });
    setRunStatus({ researcher: "idle", planner: "idle", revenue: "idle", briefing: "idle" });
    addLog("🚀 기획·분석부 가동 시작 (이전 결과 삭제됨)");

    const rr = await runAgent("researcher", "리서처", "🔍");
    const pr = await runAgent("planner", "콘텐츠 기획자", "🧠");
    const rv = await runAgent("revenue", "수익 전략가", "💰");
    const br = await runAgent("briefing", "모닝브리핑 통합", "📋");

    addLog(br ? "✅ 전체 완료 — 카카오톡 확인하세요!" : "⚠️ 일부 에이전트 실행 실패");

    const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    setLastRun(now);
    ls.set("planning_last_run", now);
    setIsRunning(false);
  };

  const statusIcon = (s) => {
    if (s === "running") return "⏳";
    if (s === "done") return "✅";
    if (s === "error") return "❌";
    return "⏸️";
  };
  const statusColor = (s) => {
    if (s === "running") return C.amber;
    if (s === "done") return C.green;
    if (s === "error") return C.red;
    return C.textDim;
  };

  const navBtns = [
    { id: "run", label: "실행", icon: "▶" },
    { id: "overview", label: "총괄", icon: "◈" },
    { id: "timeline", label: "타임라인", icon: "◷" },
    { id: "weekly", label: "주간배치", icon: "▦" },
    { id: "manual", label: "매뉴얼", icon: "📋" },
  ];

  // ── Run Panel ──
  const renderRun = () => {
    const agents = [
      { key: "researcher", emoji: "🔍", name: "리서처", desc: "트렌드·키워드·뉴스 수집", color: C.blue },
      { key: "planner", emoji: "🧠", name: "콘텐츠 기획자", desc: "안건 3개 생성 + 크로스연계", color: C.pink },
      { key: "revenue", emoji: "💰", name: "수익 전략가", desc: "상품 매칭 + 제휴링크 전략", color: C.amber },
      { key: "briefing", emoji: "📋", name: "모닝브리핑", desc: "통합 + 카카오톡 발송", color: C.teal },
    ];

    return (
      <>
        {/* 실행 버튼 */}
        <button onClick={runAll} disabled={isRunning} style={{
          width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: isRunning ? "not-allowed" : "pointer",
          background: isRunning ? C.surface2 : `linear-gradient(135deg, ${C.bronze}, ${C.gold})`,
          color: isRunning ? C.textDim : "#1a1a18", fontSize: 16, fontWeight: 800, fontFamily: "inherit",
          marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          {isRunning ? (
            <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span> 기획부 3명 일하는 중...</>
          ) : (
            <>▶ 기획·분석부 가동하기</>
          )}
        </button>

        {lastRun && !isRunning && (
          <div style={{ fontSize: 10, color: C.textDim, textAlign: "center", marginBottom: 14 }}>
            마지막 실행: {lastRun}
          </div>
        )}

        {/* 에이전트 상태 카드 */}
        {agents.map(a => {
          const status = runStatus[a.key];
          const result = runResults[a.key];
          return (
            <div key={a.key} style={{
              background: C.surface, borderRadius: 12, padding: 14, marginBottom: 8,
              border: `1px solid ${status === "running" ? a.color : C.border}`,
              borderLeft: `4px solid ${statusColor(status)}`,
              opacity: status === "idle" && isRunning ? 0.5 : 1,
              transition: "all .3s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: result ? 10 : 0 }}>
                <span style={{ fontSize: 24, filter: status === "running" ? "none" : status === "idle" ? "grayscale(0.5)" : "none" }}>{a.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.name}</span>
                    <span style={{ fontSize: 11 }}>{statusIcon(status)}</span>
                    {status === "running" && (
                      <span style={{ fontSize: 9, color: a.color, fontWeight: 600, animation: "pulse 1.5s infinite" }}>작업 중...</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: C.textDim }}>{a.desc}</div>
                </div>
                {status === "done" && <Badge text="완료" color={C.green} />}
                {status === "error" && <Badge text="에러" color={C.red} />}
              </div>

              {/* 결과 미리보기 */}
              {result && !result.error && a.key === "researcher" && result.main_pipeline && (
                <div style={{ background: C.bg, borderRadius: 8, padding: 10, marginTop: 6 }}>
                  <div style={{ fontSize: 10, color: C.blue, fontWeight: 700, marginBottom: 4 }}>🔍 트렌드 키워드</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(result.main_pipeline.trends || []).slice(0, 5).map((t, i) => <Badge key={i} text={t} color={C.blue} small />)}
                  </div>
                </div>
              )}
              {result && !result.error && a.key === "planner" && result.topics && (
                <div style={{ background: C.bg, borderRadius: 8, padding: 10, marginTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ fontSize: 10, color: C.pink, fontWeight: 700 }}>🧠 오늘의 안건</div>
                    <span style={{ fontSize: 8, color: C.textDim }}>탭하여 수정 가능</span>
                  </div>
                  {result.topics.slice(0, 3).map((t, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: C.gold, fontWeight: 700, fontSize: 11 }}>#{i + 1}</span>
                        <input type="text" value={t.title || ""} onChange={e => {
                          const updated = { ...runResults };
                          updated.planner.topics[i].title = e.target.value;
                          setRunResults({ ...updated });
                        }} style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px dashed ${C.border}`, color: C.text, fontSize: 11, fontWeight: 600, padding: "2px 4px", outline: "none", fontFamily: "inherit" }} />
                      </div>
                      {t.outline && (
                        <textarea value={t.outline} onChange={e => {
                          const updated = { ...runResults };
                          updated.planner.topics[i].outline = e.target.value;
                          setRunResults({ ...updated });
                        }} style={{ width: "100%", marginTop: 4, background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 4, color: C.textMuted, fontSize: 10, padding: "4px 6px", outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: 36, lineHeight: 1.5 }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {result && !result.error && a.key === "revenue" && result.products && (
                <div style={{ background: C.bg, borderRadius: 8, padding: 10, marginTop: 6 }}>
                  <div style={{ fontSize: 10, color: C.amber, fontWeight: 700, marginBottom: 4 }}>💰 추천 상품</div>
                  {result.products.slice(0, 2).map((p, i) => (
                    <div key={i} style={{ fontSize: 11, color: C.textMuted, padding: "2px 0" }}>
                      {p.topic_title || `안건 ${p.topic_id}`}: {(p.recommended_products || []).slice(0, 2).map(r => r.product).join(", ")}
                    </div>
                  ))}
                </div>
              )}
              {result && !result.error && a.key === "briefing" && result.briefing_text && (
                <div style={{ background: C.bg, borderRadius: 8, padding: 10, marginTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ fontSize: 10, color: C.teal, fontWeight: 700 }}>📋 모닝브리핑</div>
                    {result.kakao_sent && <Badge text="카톡 전송 ✓" color={C.green} small />}
                    {result.kakao_sent === false && <Badge text="카톡 미전송" color={C.red} small />}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto" }}>
                    {result.briefing_text}
                  </div>
                </div>
              )}
              {result && result.error && (
                <div style={{ background: `${C.red}11`, borderRadius: 8, padding: 10, marginTop: 6 }}>
                  <div style={{ fontSize: 11, color: C.red }}>{result.error}</div>
                </div>
              )}
            </div>
          );
        })}

        {/* 실행 로그 */}
        {runLog.length > 0 && (
          <div style={{ background: C.surface, borderRadius: 12, padding: 14, marginTop: 8, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>EXECUTION LOG</div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {runLog.map((log, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "3px 0", borderBottom: `1px solid ${C.border}22` }}>
                  <span style={{ fontSize: 9, fontFamily: MONO, color: C.textDim, minWidth: 60 }}>{log.time}</span>
                  <span style={{ fontSize: 11, color: C.text }}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 개별 실행 버튼 */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, color: C.textDim, marginBottom: 8 }}>개별 에이전트 실행</div>
          <div style={{ display: "flex", gap: 6 }}>
            {agents.slice(0, 3).map(a => (
              <button key={a.key} onClick={() => runAgent(a.key, a.name, a.emoji)} disabled={isRunning}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 10, fontFamily: "inherit", cursor: isRunning ? "not-allowed" : "pointer",
                  border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted }}>
                {a.emoji} {a.name}
              </button>
            ))}
          </div>
        </div>

        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

        {/* ── 제작부 연동: 편집장 에이전트 ── */}
        {runResults.planner && !runResults.planner.error && runResults.planner.topics && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span>⚡</span> 다음 단계: 편집장에게 초안 요청
            </div>

            <div style={{ background: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, border: `1px solid ${C.goldDim}` }}>
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10, lineHeight: 1.6 }}>
                안건을 선택하면 📝 편집장 에이전트가 자동으로 2,000자 블로그 초안을 작성합니다.<br/>
                채널별 톤(정치=날카롭게, 라이프=따뜻하게)이 자동 적용됩니다.
              </div>

              {runResults.planner.topics.map((t, i) => {
                const draftKey = `draft_${i}`;
                const draft = runResults[draftKey];
                const draftStatus = runStatus[draftKey];

                return (
                  <div key={i} style={{ marginBottom: 12, borderRadius: 10, border: `1px solid ${draft ? `${C.green}44` : C.border}`, overflow: "hidden" }}>
                    {/* 안건 헤더 + 초안 요청 버튼 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: draft ? `${C.green}11` : C.bg }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>#{i+1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{t.title || `안건 ${i+1}`}</div>
                        <div style={{ fontSize: 10, color: C.textDim }}>{t.pipeline || ""} · {(t.keywords || []).slice(0,3).join(", ")}</div>
                      </div>
                      {!draft && draftStatus !== "running" && (
                        <button onClick={async () => {
                          setRunStatus(prev => ({ ...prev, [draftKey]: "running" }));
                          addLog(`📝 편집장: 안건 #${i+1} "${t.title}" 초안 작성 시작...`);
                          try {
                            const revenue = runResults.revenue?.products?.[i] || null;
                            const res = await fetch("/api/editor?manual=1", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ topic: t, revenue }),
                            });
                            if (!res.ok) throw new Error(`HTTP ${res.status}`);
                            const data = await res.json();
                            setRunResults(prev => ({ ...prev, [draftKey]: data }));
                            setRunStatus(prev => ({ ...prev, [draftKey]: "done" }));
                            addLog(`📝 편집장: 안건 #${i+1} 초안 완료 ✓ (${data.word_count || "?"}자)`);
                          } catch (e) {
                            setRunStatus(prev => ({ ...prev, [draftKey]: "error" }));
                            addLog(`📝 편집장: 안건 #${i+1} 에러 — ${e.message}`);
                          }
                        }} disabled={isRunning} style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: 11, fontFamily: "inherit",
                          cursor: "pointer", border: "none",
                          background: `linear-gradient(135deg, ${C.bronze}, ${C.gold})`,
                          color: "#1a1a18", fontWeight: 700,
                        }}>
                          📝 초안 작성
                        </button>
                      )}
                      {draftStatus === "running" && (
                        <span style={{ fontSize: 11, color: C.amber, fontWeight: 600, animation: "pulse 1.5s infinite" }}>⏳ 작성 중...</span>
                      )}
                      {draft && <Badge text="초안 완료" color={C.green} />}
                    </div>

                    {/* 초안 결과 */}
                    {draft && draft.body && (
                      <div style={{ padding: "12px", borderTop: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>📝 {draft.title || t.title}</span>
                          <Badge text={`${draft.word_count || "?"}자`} color={C.blue} small />
                          <Badge text={draft.channel || t.pipeline} color={C.purple} small />
                        </div>

                        {/* 메타 정보 */}
                        {draft.meta_description && (
                          <div style={{ fontSize: 10, color: C.textDim, marginBottom: 6, padding: "6px 8px", background: C.bg, borderRadius: 6 }}>
                            SEO: {draft.meta_description}
                          </div>
                        )}
                        {draft.tags && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
                            {draft.tags.map((tag, j) => <Badge key={j} text={`#${tag}`} color={C.teal} small />)}
                          </div>
                        )}

                        {/* 본문 미리보기 */}
                        <div style={{
                          fontSize: 11, color: C.textMuted, lineHeight: 1.8, whiteSpace: "pre-wrap",
                          maxHeight: 300, overflowY: "auto",
                          padding: "10px 12px", background: C.bg, borderRadius: 8,
                          border: `1px solid ${C.border}`,
                        }}>
                          {draft.body}
                        </div>

                        {/* 제휴 상품 */}
                        {draft.affiliate_products && draft.affiliate_products.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 10, color: C.amber, fontWeight: 700, marginBottom: 4 }}>💰 삽입된 제휴 상품</div>
                            {draft.affiliate_products.map((ap, j) => (
                              <div key={j} style={{ fontSize: 10, color: C.textDim, padding: "2px 0" }}>
                                • {ap.product} — {ap.placement}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 복사 버튼 */}
                        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                          <button onClick={() => {
                            const text = `# ${draft.title}\n\n${draft.body}`;
                            navigator.clipboard?.writeText(text).then(() => alert("초안 전체가 복사되었습니다!"));
                          }} style={{
                            flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 11, fontFamily: "inherit",
                            cursor: "pointer", border: `1px solid ${C.green}`, background: `${C.green}11`, color: C.green, fontWeight: 600,
                          }}>
                            📋 초안 복사
                          </button>
                          <button onClick={() => {
                            const text = `제목: ${draft.title}\nSEO: ${draft.meta_description}\n태그: ${(draft.tags||[]).join(", ")}`;
                            navigator.clipboard?.writeText(text).then(() => alert("메타 정보가 복사되었습니다!"));
                          }} style={{
                            flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 11, fontFamily: "inherit",
                            cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted,
                          }}>
                            🏷️ 메타 복사
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 전체 초안 일괄 요청 */}
            {runResults.planner.topics.length > 1 && !runResults.draft_0 && !runResults.draft_1 && (
              <button onClick={async () => {
                for (let i = 0; i < Math.min(runResults.planner.topics.length, 3); i++) {
                  const t = runResults.planner.topics[i];
                  const draftKey = `draft_${i}`;
                  if (runResults[draftKey]) continue;
                  setRunStatus(prev => ({ ...prev, [draftKey]: "running" }));
                  addLog(`📝 편집장: 안건 #${i+1} "${t.title}" 초안 작성 시작...`);
                  try {
                    const revenue = runResults.revenue?.products?.[i] || null;
                    const res = await fetch("/api/editor?manual=1", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ topic: t, revenue }),
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    setRunResults(prev => ({ ...prev, [draftKey]: data }));
                    setRunStatus(prev => ({ ...prev, [draftKey]: "done" }));
                    addLog(`📝 편집장: 안건 #${i+1} 완료 ✓`);
                  } catch (e) {
                    setRunStatus(prev => ({ ...prev, [draftKey]: "error" }));
                    addLog(`📝 편집장: 안건 #${i+1} 에러 — ${e.message}`);
                  }
                }
              }} disabled={isRunning} style={{
                width: "100%", padding: "12px", borderRadius: 10, fontSize: 12, fontFamily: "inherit",
                cursor: "pointer", border: "none",
                background: `linear-gradient(135deg, ${C.bronze}, ${C.gold})`,
                color: "#1a1a18", fontWeight: 700, marginBottom: 10,
              }}>
                📝 전체 안건 일괄 초안 작성
              </button>
            )}
          </div>
        )}

        {/* 결과 초기화 버튼 */}
        {(runResults.researcher || runResults.planner) && !isRunning && (
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <button onClick={() => {
              if (confirm("기존 기획 결과를 삭제하시겠습니까?")) {
                setRunResults({ researcher: null, planner: null, revenue: null, briefing: null });
                setRunStatus({ researcher: "idle", planner: "idle", revenue: "idle", briefing: "idle" });
                setRunLog([]);
                ls.set("planning_results_v1", null);
                ls.set("planning_status_v1", null);
                ls.set("planning_log_v1", null);
              }
            }} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 10, fontFamily: "inherit", cursor: "pointer", border: `1px solid ${C.border}`, background: "transparent", color: C.textDim }}>
              🗑️ 기존 결과 삭제
            </button>
          </div>
        )}
      </>
    );
  };

  // ── Overview ──
  const renderOverview = () => {
    const totalTasks = DEPT_AGENTS.reduce((s, a) => s + a.buildTasks.length, 0);
    const doneTasks = DEPT_AGENTS.reduce((s, a) => s + a.buildTasks.filter((_, i) => buildState[`${a.id}_${i}`]).length, 0);

    return (
      <>
        <div style={{ background: `linear-gradient(135deg,${C.surface},#2a2520)`, borderRadius: 14, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 1, marginBottom: 10 }}>HANOK · 기획·분석부</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[
              { label: "AI 직원", value: 3, color: C.pink },
              { label: "구축 완료", value: `${doneTasks}/${totalTasks}`, color: doneTasks === totalTasks ? C.green : C.gold },
              { label: "일일 산출물", value: "8건", color: C.blue },
              { label: "CEO 소요", value: "10분", color: C.teal },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "8px 4px", textAlign: "center", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 8, color: C.textDim, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>구축 진행률</div>
          <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
            <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${C.bronze},${C.gold})`, width: `${totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0}%`, transition: "width .5s" }} />
          </div>
        </div>

        <SectionHeader icon="🧠" title="기획·분석부 3인" sub="기획 → CEO 컨펌 → 제작 → CEO 컨펌 → 업로드 중 '기획' 단계를 담당" />

        {DEPT_AGENTS.map(agent => (
          <div key={agent.id} onClick={() => { setSelectedAgent(agent.id); setView("detail"); }} style={{ background: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${C.border}`, borderLeft: `4px solid ${agent.color}`, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>{agent.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{agent.name}</span>
                  <Badge text="신규 구축" color={C.red} />
                </div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{agent.sub} · {agent.schedule}</div>
              </div>
              <span style={{ fontSize: 12, color: C.textDim }}>›</span>
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, lineHeight: 1.5 }}>{agent.role}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {agent.outputs.map((o, i) => <Badge key={i} text={o} color={agent.color} small />)}
            </div>
          </div>
        ))}

        <div style={{ background: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${C.goldDim}` }}>
          <SectionHeader icon="⚡" title="5단계 자동화 구조" sub="CEO는 ②와 ④에서만 개입" />
          {[
            { step: "① 기획", who: "AI (기획부 3명)", color: C.blue, desc: "트렌드 분석 → 안건 자동 생성" },
            { step: "② CEO 컨펌 ①", who: "CEO", color: C.red, desc: "안건 2건 채택 + 방향 지시 (10분)" },
            { step: "③ 제작", who: "AI (제작부 6명)", color: C.green, desc: "초안·영상·음원 자동 생성" },
            { step: "④ CEO 컨펌 ②", who: "CEO", color: C.red, desc: "퍼스널터치 + 발행 승인 (15~20분)" },
            { step: "⑤ 업로드", who: "AI (운영부 3명)", color: C.purple, desc: "다채널 자동 발행 + 성과 추적" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "8px 10px", borderRadius: 8, background: `${s.color}11`, borderLeft: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.color, minWidth: 90 }}>{s.step}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.text }}>{s.desc}</div>
                <div style={{ fontSize: 9, color: C.textDim }}>{s.who}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // ── Agent Detail ──
  const renderDetail = () => {
    const agent = DEPT_AGENTS.find(a => a.id === selectedAgent);
    if (!agent) return <div style={{ padding: 20, color: C.textDim }}>에이전트를 선택해주세요.</div>;

    return (
      <>
        <button onClick={() => setView("overview")} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontSize: 12, fontFamily: "inherit", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>← 돌아가기</button>

        <div style={{ background: `linear-gradient(135deg,${C.surface},${agent.color}11)`, borderRadius: 14, padding: 16, marginBottom: 14, border: `1px solid ${agent.color}44`, borderLeft: `4px solid ${agent.color}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 36 }}>{agent.emoji}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{agent.name}</div>
              <div style={{ fontSize: 11, color: agent.color, fontFamily: MONO }}>{agent.sub}</div>
              <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>⏰ {agent.schedule} 자동 가동</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, padding: "8px 12px", background: C.bg, borderRadius: 8 }}>{agent.role}</div>
        </div>

        <SectionHeader icon="📤" title="일일 산출물" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
          {agent.outputs.map((o, i) => (
            <div key={i} style={{ padding: "8px 12px", background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, color: C.text }}>📊 {o}</div>
          ))}
        </div>

        <SectionHeader icon="🔧" title="사용 도구" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {agent.tools.map((t, i) => <Badge key={i} text={t} color={agent.color} />)}
        </div>

        <SectionHeader icon="◷" title="일일 워크플로우" sub="시간순 자동 실행 → CEO 컨펌 포인트" />
        {agent.workflow.map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontFamily: MONO, color: agent.color, fontWeight: 700, minWidth: 42, marginTop: 2 }}>{w.time}</div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: w.auto ? agent.color : C.red, marginTop: 4, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: "6px 10px", background: w.auto ? C.surface : `${C.red}18`, borderRadius: 8, border: `1px solid ${w.auto ? C.border : `${C.red}44`}` }}>
              <div style={{ fontSize: 11, color: C.text }}>{w.action}</div>
              <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>{w.auto ? "🤖 AI 자동" : "👔 CEO 컨펌 필요"}</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 16 }}>
          <SectionHeader icon="🔨" title="구축 체크리스트" sub={`${agent.buildTasks.filter((_, i) => buildState[`${agent.id}_${i}`]).length}/${agent.buildTasks.length} 완료`} />
          {agent.buildTasks.map((task, i) => {
            const key = `${agent.id}_${i}`;
            const done = buildState[key];
            return (
              <div key={i} onClick={() => toggleBuild(agent.id, i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 4, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", opacity: done ? 0.6 : 1 }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, background: done ? agent.color : "transparent", border: `2px solid ${done ? agent.color : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 12, fontWeight: 700 }}>{done ? "✓" : ""}</div>
                <span style={{ fontSize: 12, color: done ? C.textDim : C.text, textDecoration: done ? "line-through" : "none" }}>{task.text}</span>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // ── Timeline ──
  const renderTimeline = () => (
    <>
      <SectionHeader icon="◷" title="CEO 일일 타임라인" sub="기획·분석부가 어떻게 하루를 시작하고, CEO는 언제 개입하는가" />
      <div style={{ background: C.surface, borderRadius: 12, padding: "6px 10px", marginBottom: 14, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {Object.entries(PHASE_COLORS).map(([k, v]) => (
            <span key={k} style={{ fontSize: 8, padding: "2px 6px", borderRadius: 6, background: v.bg, color: v.color, border: `1px solid ${v.color}33` }}>{k} {v.label}</span>
          ))}
        </div>
      </div>
      {DAILY_TIMELINE.map((item, i) => {
        const pc = PHASE_COLORS[item.phase];
        return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontFamily: MONO, color: pc.color, fontWeight: 700, minWidth: 40, marginTop: 6 }}>{item.time}</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.ceo ? C.red : pc.color, border: `2px solid ${item.ceo ? C.red : pc.color}`, flexShrink: 0 }} />
              {i < DAILY_TIMELINE.length - 1 && <div style={{ width: 1, flex: 1, background: C.border, minHeight: 20 }} />}
            </div>
            <div style={{ flex: 1, padding: "6px 10px", marginBottom: 2, borderRadius: 8, background: pc.bg, border: `1px solid ${pc.color}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: pc.color }}>{item.ceo ? "👔 CEO" : "🤖 AI"}</span>
                {item.duration && <Badge text={item.duration} color={C.red} small />}
                {item.agents.map(a => {
                  const ag = DEPT_AGENTS.find(d => d.id === a);
                  return ag ? <Badge key={a} text={ag.emoji + " " + ag.name} color={ag.color} small /> : null;
                })}
              </div>
              <div style={{ fontSize: 11, color: C.text, marginTop: 3 }}>{item.desc}</div>
            </div>
          </div>
        );
      })}
      <div style={{ background: `${C.gold}11`, borderRadius: 10, padding: 12, marginTop: 10, border: `1px solid ${C.goldDim}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 6 }}>📊 CEO 일일 시간 합산</div>
        <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.8 }}>
          1차 컨펌 (기획): 10분{"\n"}
          2차 컨펌 (제작): 60~95분{"\n"}
          전략 컨펌: 15분{"\n"}
          이브닝 리뷰: 30분{"\n"}
          <span style={{ color: C.gold, fontWeight: 700 }}>총 약 2시간 15분 ~ 2시간 30분/일</span>
        </div>
      </div>
    </>
  );

  // ── Weekly Schedule ──
  const renderWeekly = () => (
    <>
      <SectionHeader icon="▦" title="주간 파이프라인 배치" sub="요일별 메인/서브 파이프라인 + 웹소설/음원 스케줄" />
      {Object.entries(WEEK_SCHEDULE).map(([day, sched]) => (
        <div key={day} style={{ background: C.surface, borderRadius: 10, padding: 12, marginBottom: 6, border: `1px solid ${C.border}`, opacity: day === "일" ? 0.6 : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: day === "토" || day === "일" ? C.red : C.gold, minWidth: 24 }}>{day}</span>
            <div style={{ flex: 1, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {sched.main !== "—" && <Badge text={"메인: " + sched.main} color={C.blue} />}
              {sched.sub !== "—" && <Badge text={"서브: " + sched.sub} color={C.teal} />}
              {sched.novel !== "휴재" && sched.novel !== "다음주 개요 자동생성" && <Badge text={"📖 " + sched.novel} color={C.purple} />}
              {sched.music && <Badge text="🎵 음원 제작" color={C.pink} />}
            </div>
          </div>
          {sched.special && <div style={{ fontSize: 10, color: C.textDim, paddingLeft: 32 }}>{sched.novel === "휴재" || sched.novel === "다음주 개요 자동생성" ? `📖 ${sched.novel} · ` : ""}{sched.special}</div>}
        </div>
      ))}

      <div style={{ marginTop: 14 }}>
        <SectionHeader icon="🔄" title="7개 파이프라인" />
        {PIPELINES.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 4, borderRadius: 8, background: C.surface, borderLeft: `3px solid ${p.color}`, border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 18 }}>{p.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{p.name}</div>
              <div style={{ fontSize: 9, color: C.textDim }}>{p.days} · {p.frequency}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // ── Manual ──
  const renderManual = () => (
    <>
      <SectionHeader icon="📋" title="AI 자동화 운영 매뉴얼" sub="CEO가 알아야 할 모든 규칙" />

      <div style={{ background: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${C.goldDim}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 8 }}>핵심 원칙</div>
        {[
          "CEO는 의사결정과 컨펌만 한다. 나머지는 모두 AI가 실행한다.",
          "CEO 컨펌 응답: '승인' / '수정 후 재제출' / '방향 변경' 3가지만 사용.",
          "24시간 미응답 시 자동 발행 (웹소설 제외 — 퍼스널터치 필수).",
          "각 단계 사이에 자동 알림 전송 (Telegram/카카오톡).",
        ].map((r, i) => (
          <div key={i} style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6, padding: "6px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ color: C.gold, marginRight: 6 }}>•</span>{r}
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 8 }}>AI가 자동 수행하는 것</div>
        {[
          { area: "기획", items: "트렌드 수집, 키워드 분석, 주간캘린더, 안건 생성" },
          { area: "제작", items: "초안 작성, 썸네일, 영상 조립, 음원 생성, 교정" },
          { area: "발행", items: "포맷 변환, 예약 발행, 다채널 배포, 메타데이터" },
          { area: "운영", items: "성과 수집, 대시보드 갱신, 모닝브리핑, 독자 피드백" },
          { area: "수익화", items: "제휴링크 삽입, DistroKid 배포, 정산 트래킹" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, padding: "6px 8px", borderRadius: 6, background: `${C.blue}08` }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.blue, minWidth: 40 }}>{r.area}</span>
            <span style={{ fontSize: 10, color: C.textMuted, flex: 1 }}>{r.items}</span>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 8 }}>CEO가 직접 수행하는 것</div>
        {[
          { area: "기획", items: "안건 3개 중 2개 선택, 작품 방향 결정" },
          { area: "제작", items: "퍼스널터치 편집, 품질 컨펌, 음원 선곡" },
          { area: "발행", items: "발행 최종 승인 (버튼 1개)" },
          { area: "운영", items: "전략 방향 조정, 우선순위 재배치" },
          { area: "소통", items: "커뮤니티 직접 소통 (CEO만 가능)" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, padding: "6px 8px", borderRadius: 6, background: `${C.red}08` }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.red, minWidth: 40 }}>{r.area}</span>
            <span style={{ fontSize: 10, color: C.textMuted, flex: 1 }}>{r.items}</span>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, marginBottom: 8 }}>파이프라인별 CEO 소요시간</div>
        {[
          { name: "블로그 (정치/스포츠/경제/라이프)", time: "15~20분/편", color: C.blue },
          { name: "YouTube Shorts", time: "8분/편", color: C.amber },
          { name: "웹소설 (인사팀장)", time: "25분/화", color: C.purple },
          { name: "음원 (화/금)", time: "13분/곡", color: C.pink },
          { name: "SNS 포스팅 (X/IG)", time: "15분/일괄", color: C.green },
          { name: "모닝브리핑 + 이브닝리뷰", time: "40분/일", color: C.teal },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}22` }}>
            <span style={{ fontSize: 11, color: C.text }}>{r.name}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: r.color, fontFamily: MONO }}>{r.time}</span>
          </div>
        ))}
      </div>

      <div style={{ background: `${C.green}11`, borderRadius: 10, padding: 12, marginBottom: 10, border: `1px solid ${C.green}33` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 6 }}>주간 산출물 총량 (목표)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            { label: "블로그", value: "10편/주" },
            { label: "Shorts", value: "5편/주" },
            { label: "웹소설", value: "5화/주" },
            { label: "음원", value: "2곡/주" },
            { label: "SNS", value: "20~30건/주" },
            { label: "CEO 시간", value: "~10.8h/주" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "6px 8px", background: C.surface, borderRadius: 6, border: `1px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{s.value}</div>
              <div style={{ fontSize: 9, color: C.textDim }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {view !== "detail" && (
        <div style={{ display: "flex", gap: 4, padding: "8px 14px", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {navBtns.map(b => (
            <button key={b.id} onClick={() => setView(b.id)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 11, fontFamily: "inherit", fontWeight: view === b.id ? 700 : 400, cursor: "pointer", border: view === b.id ? `1px solid ${C.gold}` : `1px solid ${C.border}`, background: view === b.id ? C.goldDim : "transparent", color: view === b.id ? C.gold : C.textDim }}>
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {view === "run" && renderRun()}
        {view === "overview" && renderOverview()}
        {view === "detail" && renderDetail()}
        {view === "timeline" && renderTimeline()}
        {view === "weekly" && renderWeekly()}
        {view === "manual" && renderManual()}
      </div>
    </div>
  );
}
