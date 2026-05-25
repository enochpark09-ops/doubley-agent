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
  const [view, setView] = useState("overview");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [buildState, setBuildState] = useState(() => ls.get("planning_build_v1", {}));

  useEffect(() => { ls.set("planning_build_v1", buildState); }, [buildState]);

  const toggleBuild = (agentId, idx) => {
    setBuildState(prev => {
      const key = `${agentId}_${idx}`;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const navBtns = [
    { id: "overview", label: "총괄", icon: "◈" },
    { id: "timeline", label: "타임라인", icon: "◷" },
    { id: "weekly", label: "주간배치", icon: "▦" },
    { id: "manual", label: "매뉴얼", icon: "📋" },
  ];

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
        {view === "overview" && renderOverview()}
        {view === "detail" && renderDetail()}
        {view === "timeline" && renderTimeline()}
        {view === "weekly" && renderWeekly()}
        {view === "manual" && renderManual()}
      </div>
    </div>
  );
}
