// api/revenue.js — 💰 수익 전략가 에이전트
// Trigger: cron 06:30 KST (21:30 UTC) 또는 수동 호출
// Input: 기획자의 안건 3개
// Output: 안건별 추천 상품 + 제휴링크 전략 + ROI 제안

import { callClaude, todayKST } from "./_lib/utils.js";

const SYSTEM_PROMPT = `당신은 HANOK(하노크) 1인 크리에이터 기업의 "수익 전략가" AI 에이전트입니다.

역할: 콘텐츠 주제별 최적 상품을 매칭하고, 제휴링크 자동 삽입 전략을 수립
소속: 기획·분석부
가동 시간: 매일 06:30 KST (기획자와 동시 가동)

수익원:
1. 쿠팡파트너스 (11% 수수료) — 블로그 내 상품 링크
2. Google AdSense — 블로그/YouTube 광고
3. 네이버 애드포스트 — 네이버 블로그 광고
4. 웹소설 PPS/유료화 — 조아라/문피아 연재 수익
5. 음원 스트리밍 — DistroKid 배포 수익
6. YouTube AdSense — Shorts/롱폼 광고 (장기)

상품 매칭 규칙:
- 정치/경제 → 투자 서적, 경제 신문 구독, 비즈니스 도구
- 스포츠 → 스포츠 용품, 구단 굿즈, 스포츠 영양제
- 라이프/커피 → 원두, 커피 용품, 캠핑 장비, 인테리어 소품
- 자기계발 → 도서, 온라인 강의, 플래너, 생산성 도구
- 웹소설 → e-reader, 전자책 구독, 관련 굿즈

출력 형식: 반드시 아래 JSON 형식으로만 응답하세요.
{
  "date": "YYYY-MM-DD",
  "products": [
    {
      "topic_id": 1,
      "topic_title": "안건 제목",
      "recommended_products": [
        {
          "product": "상품명",
          "category": "카테고리",
          "search_keyword": "쿠팡 검색 키워드",
          "placement": "블로그 본문 어디에 삽입할지",
          "cta_text": "클릭 유도 문구"
        }
      ],
      "revenue_strategy": "이 콘텐츠의 수익 최적화 전략"
    }
  ],
  "daily_revenue_tips": ["오늘의 수익 팁 1", "팁 2"],
  "adsense_keywords": ["고단가 AdSense 키워드 3개"]
}`;

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}` && req.method !== "POST") {
    if (req.method === "GET" && !req.query.manual) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const { date, weekday } = todayKST();

    // 기획자 결과 가져오기
    let plannerTopics = "기획자 안건 없음";
    try {
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
      const pRes = await fetch(`${baseUrl}/api/planner?manual=1`, {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        plannerTopics = JSON.stringify(pData.topics || pData, null, 2);
      }
    } catch (e) {
      console.log("[Revenue] Could not fetch planner:", e.message);
    }

    if (req.method === "POST" && req.body?.topics) {
      plannerTopics = JSON.stringify(req.body.topics, null, 2);
    }

    const userMessage = `오늘은 ${date} ${weekday}요일입니다.

기획자가 생성한 오늘의 안건:
${plannerTopics}

각 안건에 대해:
1. 쿠팡파트너스로 연결할 상품 2~3개 추천 (검색 키워드 포함)
2. 블로그 본문 어디에 자연스럽게 삽입할지 위치 제안
3. 클릭 유도 문구 (CTA) 작성
4. 이 콘텐츠의 수익 최적화 전략 한 줄 요약

추가로:
- 오늘의 수익 팁 2개
- AdSense 고단가 키워드 3개 추천`;

    const result = await callClaude(SYSTEM_PROMPT, userMessage, 2000);

    let parsed;
    try {
      const jsonStr = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { raw: result, date, weekday, parse_error: true };
    }

    const output = {
      agent: "revenue",
      timestamp: new Date().toISOString(),
      ...parsed,
    };

    return res.status(200).json(output);
  } catch (error) {
    console.error("[Revenue] Error:", error.message);
    return res.status(500).json({ error: error.message, agent: "revenue" });
  }
}
