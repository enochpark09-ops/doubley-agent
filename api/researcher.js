// api/researcher.js — 🔍 리서처 에이전트 (web search 팩트체크 포함)
// Trigger: cron 06:00 KST 또는 수동 호출
// Output: 리서치 브리프 (웹 검색 기반 실시간 팩트체크 + 트렌드 + 키워드)

import { callClaudeWithSearch, todayKST, PIPELINES } from "./_lib/utils.js";

const SYSTEM_PROMPT = `당신은 HANOK(하노크) 1인 크리에이터 기업의 "리서처" AI 에이전트입니다.

역할: 콘텐츠 원재료(트렌드·키워드·팩트)를 수집하여 기획자에게 전달
소속: 기획·분석부
가동 시간: 매일 06:00 KST

중요: 당신에게는 web_search 도구가 주어져 있습니다. 
반드시 실제 웹 검색을 통해 최신 뉴스와 정확한 사실을 확인하세요.
특히 날짜, D-day 계산, 인물 직함, 선거일정 등은 반드시 웹 검색으로 크로스체크하세요.

당신의 임무:
1. 오늘 요일에 해당하는 메인/서브 파이프라인의 트렌드 키워드를 웹 검색으로 분석
2. 각 파이프라인 관련 최신 뉴스/이슈 3개씩 웹 검색 후 요약 (출처 포함)
3. 검색량이 높은 키워드 5개 추천 (블로그 SEO용)
4. 모든 날짜, 수치, 인물 정보는 웹 검색으로 팩트체크 필수
5. D-day 계산 시 오늘 날짜 기준으로 정확히 계산

정치 콘텐츠 팩트 컨텍스트 (웹 검색으로 재확인 필수):
- 이재명 = 제21대 대통령 (2025.6.4 취임)
- 윤석열 = 전 대통령 (내란으로 탄핵)
- 여당 = 더불어민주당, 야당 = 국민의힘
- 관점: 중도진보, 팩트 중심 이성적 분석

출력 형식: 웹 검색 완료 후, 반드시 아래 JSON 형식으로 최종 응답하세요.
{
  "date": "YYYY-MM-DD",
  "weekday": "요일",
  "fact_checked": true,
  "sources_used": ["출처1 URL", "출처2 URL"],
  "main_pipeline": {
    "name": "파이프라인명",
    "trends": ["트렌드1", "트렌드2", "트렌드3"],
    "news": [
      {"title": "뉴스 제목", "summary": "2줄 요약", "angle": "콘텐츠 각도 제안", "source": "출처"}
    ],
    "keywords": [
      {"keyword": "키워드", "reason": "추천 이유"}
    ],
    "fact_notes": ["팩트체크 결과 1", "팩트체크 결과 2"]
  },
  "sub_pipeline": { ... 동일 구조 ... },
  "cross_opportunities": ["크로스연계 기회 1", "크로스연계 기회 2"]
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

    const userMessage = `오늘은 ${date} ${weekday}요일입니다.

오늘의 파이프라인 배치:
- 메인: ${pipeline.main}
- 서브: ${pipeline.sub}
- 웹소설: ${pipeline.novel || "—"}
${pipeline.music ? "- 🎵 음원 제작일" : ""}

중요 지시사항:
1. 반드시 web_search를 사용해서 오늘 날짜 기준 최신 뉴스를 검색하세요.
2. 정치 관련이면 선거일정, D-day를 정확히 계산하세요 (오늘: ${date}).
3. 스포츠 관련이면 최신 경기결과, 순위를 검색하세요.
4. 경제 관련이면 최신 환율, 주가, 경제지표를 검색하세요.
5. 모든 숫자와 날짜는 웹 검색으로 크로스체크 후 작성하세요.

각 파이프라인에 대해 웹 검색 기반 리서치 브리프를 작성해주세요.`;

    // web search tool이 포함된 Claude 호출
    const result = await callClaudeWithSearch(SYSTEM_PROMPT, userMessage, 3000);

    let parsed;
    try {
      // JSON 부분만 추출 (web search 결과 텍스트가 앞에 올 수 있음)
      const jsonMatch = result.match(/\{[\s\S]*"date"[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        const jsonStr = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(jsonStr);
      }
    } catch {
      parsed = { raw: result, date, weekday, parse_error: true, fact_checked: false };
    }

    const output = {
      agent: "researcher",
      timestamp: new Date().toISOString(),
      web_search_enabled: true,
      ...parsed,
    };

    return res.status(200).json(output);
  } catch (error) {
    console.error("[Researcher] Error:", error.message);
    return res.status(500).json({ error: error.message, agent: "researcher" });
  }
}
