// api/briefing.js — 📋 모닝브리핑 통합 + 카카오톡 알림
// Trigger: cron 06:45 KST (21:45 UTC) 또는 수동 호출
// Input: 리서처 + 기획자 + 수익전략가 결과 통합
// Output: CEO용 모닝브리핑 + 카카오톡 나에게 보내기

import { callClaude, sendKakao, todayKST, PIPELINES } from "./_lib/utils.js";

const SYSTEM_PROMPT = `당신은 HANOK(하노크) 1인 크리에이터 기업의 "비서실장" AI 에이전트입니다.

역할: 기획·분석부 3명(리서처, 기획자, 수익전략가)의 결과물을 CEO용 모닝브리핑으로 통합
가동 시간: 매일 06:45 KST

모닝브리핑 구조:
1. 인사 + 오늘 날짜/요일
2. 오늘의 안건 3개 (기획자 결과) — 제목 + 한줄 설명
3. 추천 상품 TOP 3 (수익전략가 결과) — 상품명 + CTA
4. 트렌드 키워드 3개 (리서처 결과)
5. 웹소설/음원 현황 (해당일만)
6. CEO 할 일 요약 (컨펌할 것만)

톤: 간결하고 실행 가능한 정보 중심. 이모지 적절히 사용. 900자 이내.

출력 형식: 반드시 아래 JSON 형식으로만 응답하세요.
{
  "briefing_text": "카카오톡으로 보낼 텍스트 (900자 이내)",
  "topics_summary": [
    {"id": 1, "title": "제목", "pipeline": "파이프라인", "status": "컨펌 대기"}
  ],
  "ceo_actions": ["할 일 1", "할 일 2"],
  "estimated_time": "CEO 예상 소요 시간"
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
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };

    // 3명의 결과 수집 (병렬)
    const [researchRes, plannerRes, revenueRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/researcher?manual=1`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/planner?manual=1`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/revenue?manual=1`, { headers }).then(r => r.ok ? r.json() : null),
    ]);

    const research = researchRes.status === "fulfilled" ? researchRes.value : null;
    const planner = plannerRes.status === "fulfilled" ? plannerRes.value : null;
    const revenue = revenueRes.status === "fulfilled" ? revenueRes.value : null;

    const userMessage = `오늘은 ${date} ${weekday}요일입니다.

오늘의 파이프라인: 메인 [${pipeline.main}] / 서브 [${pipeline.sub}]
웹소설: ${pipeline.novel || "—"}
${pipeline.music ? "🎵 음원 제작일" : ""}

=== 리서처 브리프 ===
${research ? JSON.stringify(research, null, 2) : "리서처 미실행"}

=== 기획자 안건 ===
${planner ? JSON.stringify(planner, null, 2) : "기획자 미실행"}

=== 수익전략가 분석 ===
${revenue ? JSON.stringify(revenue, null, 2) : "수익전략가 미실행"}

위 3명의 결과를 종합하여 CEO용 모닝브리핑을 생성해주세요.
카카오톡으로 보낼 텍스트는 900자 이내로 핵심만 간결하게 작성하세요.`;

    const result = await callClaude(SYSTEM_PROMPT, userMessage, 1500);

    let parsed;
    try {
      const jsonStr = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { briefing_text: result.slice(0, 900), parse_error: true };
    }

    // 카카오톡 나에게 보내기
    let kakaoSent = false;
    if (parsed.briefing_text) {
      kakaoSent = await sendKakao(parsed.briefing_text);
    }

    const output = {
      agent: "briefing",
      timestamp: new Date().toISOString(),
      date,
      weekday,
      kakao_sent: kakaoSent,
      research_status: research ? "ok" : "failed",
      planner_status: planner ? "ok" : "failed",
      revenue_status: revenue ? "ok" : "failed",
      ...parsed,
    };

    return res.status(200).json(output);
  } catch (error) {
    console.error("[Briefing] Error:", error.message);
    return res.status(500).json({ error: error.message, agent: "briefing" });
  }
}
