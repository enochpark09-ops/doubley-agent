// api/researcher.js — 🔍 리서처 에이전트
// Trigger: cron 06:00 KST (21:00 UTC) 또는 수동 호출
// Output: 리서치 브리프 (트렌드 키워드 + 뉴스 요약 + 경쟁 분석)

import { callClaude, todayKST, PIPELINES } from "./_lib/utils.js";

const SYSTEM_PROMPT = `당신은 HANOK(하노크) 1인 크리에이터 기업의 "리서처" AI 에이전트입니다.

역할: 콘텐츠 원재료(트렌드·키워드·팩트)를 수집하여 기획자에게 전달
소속: 기획·분석부
가동 시간: 매일 06:00 KST

당신의 임무:
1. 오늘 요일에 해당하는 메인/서브 파이프라인의 트렌드 키워드를 분석
2. 각 파이프라인 관련 최신 뉴스/이슈 3개씩 요약
3. 검색량이 높은 키워드 5개 추천 (블로그 SEO용)
4. 경쟁 채널의 인기 콘텐츠 패턴 분석

정치 콘텐츠 팩트 컨텍스트:
- 이재명 = 제21대 대통령 (2025.6.4 취임)
- 윤석열 = 전 대통령 (내란으로 탄핵)
- 여당 = 더불어민주당, 야당 = 국민의힘
- 관점: 중도진보, 신이재명 지지층 기반, 팩트 중심 이성적 분석

출력 형식: 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.
{
  "date": "YYYY-MM-DD",
  "weekday": "요일",
  "main_pipeline": {
    "name": "파이프라인명",
    "trends": ["트렌드1", "트렌드2", "트렌드3"],
    "news": [
      {"title": "뉴스 제목", "summary": "2줄 요약", "angle": "콘텐츠 각도 제안"}
    ],
    "keywords": [
      {"keyword": "키워드", "reason": "추천 이유"}
    ]
  },
  "sub_pipeline": { ... 동일 구조 ... },
  "cross_opportunities": ["크로스연계 기회 1", "크로스연계 기회 2"]
}`;

export default async function handler(req, res) {
  // CRON secret 확인 (Vercel cron 보안)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}` && req.method !== "POST") {
    // 수동 호출 시 POST + API key 확인
    if (req.method === "GET" && !req.query.manual) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const { date, weekday } = todayKST();
    const pipeline = PIPELINES[weekday] || PIPELINES["월"];

    const userMessage = `오늘은 ${date} ${weekday}요일입니다.

오늘의 파이프라인 배치:
- 메인: ${pipeline.main}
- 서브: ${pipeline.sub}
- 웹소설: ${pipeline.novel || "—"}
${pipeline.music ? "- 🎵 음원 제작일" : ""}

각 파이프라인에 대해 리서치 브리프를 작성해주세요.
특히 메인 파이프라인에 대해 깊이 있는 트렌드 분석을 해주세요.`;

    const result = await callClaude(SYSTEM_PROMPT, userMessage, 2000);

    // JSON 파싱 시도
    let parsed;
    try {
      const jsonStr = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { raw: result, date, weekday, parse_error: true };
    }

    const output = {
      agent: "researcher",
      timestamp: new Date().toISOString(),
      ...parsed,
    };

    return res.status(200).json(output);
  } catch (error) {
    console.error("[Researcher] Error:", error.message);
    return res.status(500).json({ error: error.message, agent: "researcher" });
  }
}
