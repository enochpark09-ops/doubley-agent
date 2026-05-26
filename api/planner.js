// api/planner.js — 🧠 콘텐츠 기획자 에이전트
// Trigger: cron 06:30 KST (21:30 UTC) 또는 수동 호출
// Input: 리서처 브리프 (api/researcher.js 결과)
// Output: 안건 3개 + 크로스연계 + 주제별 상품 매칭 요청

import { callClaude, todayKST, PIPELINES } from "./_lib/utils.js";

const SYSTEM_PROMPT = `당신은 HANOK(하노크) 1인 크리에이터 기업의 "콘텐츠 기획자" AI 에이전트입니다.

역할: 리서처의 브리프를 받아 오늘 발행할 안건 3개를 생성하고, 파이프라인 간 크로스연계를 설계
소속: 기획·분석부
가동 시간: 매일 06:30 KST (리서처 완료 후)

7개 파이프라인:
1. 정치 (BluntEdge) — 중도진보, 팩트 기반 분석
2. 스포츠 (EdgeStats) — KBO/MLB 데이터 분석
3. 경제 (MF) — 주식/시장 분석
4. 라이프 (onedo4u) — 커피/인테리어/캠핑
5. 웹소설 (인사팀장/팔국지) — 일 1화 연재
6. 음원 (Suno/DistroKid) — 주 2곡
7. YouTube Shorts — 블로그 기반 영상

크로스연계 규칙:
- 정치 이슈 → 경제 영향 분석 연결
- 웹소설 챕터 → OST 음원 연계
- 스포츠 데이터 → Shorts 스크립트 연결
- 라이프 콘텐츠 → 쿠팡파트너스 상품 연결

출력 형식: 반드시 아래 JSON 형식으로만 응답하세요.
{
  "date": "YYYY-MM-DD",
  "weekday": "요일",
  "topics": [
    {
      "id": 1,
      "pipeline": "파이프라인명",
      "title": "블로그 제목 (SEO 최적화)",
      "angle": "콘텐츠 각도/관점",
      "keywords": ["SEO 키워드1", "키워드2", "키워드3"],
      "outline": "300자 개요",
      "cross_link": "크로스연계 가능한 파이프라인 + 방법",
      "revenue_hint": "제휴링크/수익화 연결 포인트"
    }
  ],
  "shorts_script_topic": "오늘 Shorts 주제 (메인 블로그 기반)",
  "novel_note": "오늘 웹소설 에피소드 관련 메모 (해당 시)",
  "music_note": "음원 관련 메모 (제작일만 해당)"
}`;

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}` && req.method !== "POST") {
    if (req.method === "GET" && !req.query.manual) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const { date, weekday } = todayKST();
    const pipeline = PIPELINES[weekday] || PIPELINES["월"];

    // 리서처 결과 가져오기 (같은 서버 내 호출)
    let researchBrief = "리서치 브리프 없음 (리서처 미실행 또는 에러)";
    try {
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
      const rRes = await fetch(`${baseUrl}/api/researcher?manual=1`, {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      if (rRes.ok) {
        const rData = await rRes.json();
        researchBrief = JSON.stringify(rData, null, 2);
      }
    } catch (e) {
      console.log("[Planner] Could not fetch researcher:", e.message);
    }

    // POST body로 직접 리서치 브리프를 받을 수도 있음
    if (req.method === "POST" && req.body?.research_brief) {
      researchBrief = JSON.stringify(req.body.research_brief, null, 2);
    }

    // CEO 피드백이 있으면 재생성 모드
    let ceoFeedback = "";
    let previousTopics = "";
    if (req.method === "POST" && req.body?.ceo_feedback) {
      ceoFeedback = req.body.ceo_feedback;
      previousTopics = req.body.previous_topics ? JSON.stringify(req.body.previous_topics, null, 2) : "";
    }

    let userMessage;
    if (ceoFeedback) {
      userMessage = `오늘은 ${date} ${weekday}요일입니다.

오늘의 파이프라인 배치:
- 메인: ${pipeline.main}
- 서브: ${pipeline.sub}
- 웹소설: ${pipeline.novel || "—"}
${pipeline.music ? "- 🎵 음원 제작일 (곡 기획 포함)" : ""}

=== 이전에 생성한 안건 ===
${previousTopics}

=== CEO 피드백 ===
${ceoFeedback}

CEO의 피드백을 반영하여 안건을 재생성해주세요.
팩트 오류가 지적되었다면 반드시 수정하세요.
방향 변경이 요청되었다면 새로운 각도로 안건을 작성하세요.
리서처 브리프도 참고하세요:
${researchBrief}`;
    } else {
      userMessage = `오늘은 ${date} ${weekday}요일입니다.

오늘의 파이프라인 배치:
- 메인: ${pipeline.main}
- 서브: ${pipeline.sub}
- 웹소설: ${pipeline.novel || "—"}
${pipeline.music ? "- 🎵 음원 제작일 (곡 기획 포함)" : ""}

리서처 브리프:
${researchBrief}

이 브리프를 바탕으로 오늘 발행할 안건 3개를 생성해주세요.
- 안건 1: 메인 파이프라인 블로그
- 안건 2: 서브 파이프라인 블로그
- 안건 3: 메인 또는 크로스연계 블로그
각 안건에 SEO 최적화 제목, 개요, 키워드, 크로스연계 포인트, 수익화 힌트를 포함하세요.`;
    }

    const result = await callClaude(SYSTEM_PROMPT, userMessage, 2500);

    let parsed;
    try {
      const jsonStr = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { raw: result, date, weekday, parse_error: true };
    }

    const output = {
      agent: "planner",
      timestamp: new Date().toISOString(),
      ...parsed,
    };

    return res.status(200).json(output);
  } catch (error) {
    console.error("[Planner] Error:", error.message);
    return res.status(500).json({ error: error.message, agent: "planner" });
  }
}
