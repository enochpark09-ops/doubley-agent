// api/_lib/utils.js — 기획·분석부 공유 유틸리티

export const callClaude = async (system, userMessage, maxTokens = 2000) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Claude API HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || "";
};

// Web search 포함 Claude 호출 (리서처 팩트체크용)
export const callClaudeWithSearch = async (system, userMessage, maxTokens = 3000) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Claude API HTTP ${res.status}`);
  }
  const data = await res.json();
  // web search 결과를 포함한 전체 텍스트 추출
  const textBlocks = (data.content || []).filter(b => b.type === "text").map(b => b.text);
  return textBlocks.join("\n") || "";
};

export const sendKakao = async (text) => {
  const token = process.env.KAKAO_ACCESS_TOKEN;
  if (!token) {
    console.log("[Kakao] No token, skipping notification");
    return false;
  }
  try {
    const res = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body: new URLSearchParams({
        template_object: JSON.stringify({
          object_type: "text",
          text: text.slice(0, 1000),
          link: { web_url: "https://doubley-agent.vercel.app", mobile_web_url: "https://doubley-agent.vercel.app" },
          button_title: "에이전트 열기",
        }),
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("[Kakao] Send error:", e.message);
    return false;
  }
};

export const sendTelegram = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("[Telegram] No token/chatId, skipping notification");
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4096),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) console.error("[Telegram] API error:", data.description);
    return data.ok;
  } catch (e) {
    console.error("[Telegram] Send error:", e.message);
    return false;
  }
};

export const todayKST = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return { date: `${y}-${m}-${day}`, weekday: weekdays[d.getDay()], dayIndex: d.getDay() };
};

export const PIPELINES = {
  월: { main: "스포츠 (KBO 파워랭킹)", sub: "경제", novel: "웹소설 1화" },
  화: { main: "정치", sub: "라이프", novel: "웹소설 2화", music: true },
  수: { main: "경제 + 롱폼", sub: "스포츠", novel: "웹소설 3화" },
  목: { main: "스포츠", sub: "자기계발", novel: "웹소설 4화" },
  금: { main: "라이프", sub: "경제", novel: "웹소설 5화 (클리프행어)", music: true },
  토: { main: "— (예약발행)", sub: "—", novel: "휴재 (독자 피드백 분석)" },
  일: { main: "— (휴식)", sub: "—", novel: "다음주 개요 자동생성" },
};

// Vercel KV 대신 간단한 파일 저장소 (또는 환경변수 기반)
// 프로덕션에서는 Vercel KV 또는 Upstash Redis 사용 권장
export const saveResult = async (key, data) => {
  // 임시: 환경변수로는 저장 불가 → 로그로 남기고 프론트에서 fetch
  console.log(`[SAVE] ${key}:`, JSON.stringify(data).slice(0, 200));
  return data;
};

// ── CEO 일일 스케줄 (프론트 StrategistTab과 동기화) ──
export const DEFAULT_SCHEDULE = [
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

export const PIPELINE_LABELS = {
  politics: "🎙️ 정치 (BluntEdge)",
  sports: "⚽ 스포츠 (EdgeStats)",
  economy: "📈 경제 (MF)",
  life: "☕ 라이프 (onedo4u)",
  culture: "🎨 문화예술",
  philosophy: "📜 철학",
  novel: "📖 웹소설",
  music: "🎵 음원",
  _self: "💡 자기계발",
};
