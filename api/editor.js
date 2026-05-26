// api/editor.js — 📝 편집장 에이전트
// Input: 기획자의 안건 (topic) + 수익전략가의 상품 매칭
// Output: 블로그 초안 (2,000자+, SEO 최적화, 제휴링크 삽입)

import { callClaude, todayKST } from "./_lib/utils.js";

const CHANNEL_TONES = {
  "정치": `톤: 중도진보 관점, 팩트 기반 이성적 분석. 감정적 표현 배제, 데이터와 근거 중심.
스타일: 날카로운 분석 + 균형 잡힌 시각. 독자가 스스로 판단할 수 있는 재료를 제공.
브랜드: BluntEdge (blunt|edge) — "무딘 날도 베인다"
팩트 컨텍스트: 이재명 = 제21대 대통령(2025.6.4 취임), 윤석열 = 전 대통령(내란 탄핵), 여당 = 더불어민주당, 야당 = 국민의힘`,

  "스포츠": `톤: 데이터 드리븐 스포츠 분석. 숫자와 통계 중심, 팬 감성도 적절히 포함.
스타일: "분석관이 쓴 칼럼" 느낌. 파워랭킹, 선수 WAR, 팀 성적 비교 등 정량적 접근.
브랜드: EdgeStats — 스포츠를 숫자로 읽다`,

  "경제": `톤: 실용적 경제 분석. 어려운 경제 개념을 쉽게 풀어서 설명.
스타일: "내 지갑에 미치는 영향" 관점. 독자의 실생활과 연결. 투자 조언은 정보 제공에 그침.
브랜드: 하노크 경제분석`,

  "라이프": `톤: 따뜻하고 개인적인 에세이 스타일. CEO의 경험과 감성이 묻어나는 글.
스타일: 커피, 인테리어, 캠핑 등 취미 생활을 스토리텔링으로 풀어냄. 독자와 공감대 형성.
브랜드: onedo4u — 온도(溫度), 1인 라이프 감성`,

  "자기계발": `톤: 동기부여보다는 실행 가능한 방법론 중심. "이렇게 해보세요" 구체적 가이드.
스타일: 체크리스트, 단계별 가이드, Before/After 구조. 뜬구름 잡는 이야기 배제.
브랜드: 하노크`,
};

const SYSTEM_PROMPT = `당신은 HANOK(하노크) 1인 크리에이터 기업의 "편집장" AI 에이전트입니다.

역할: CEO가 채택한 안건을 받아 블로그 초안을 작성
소속: 제작부
목표: 2,000자 이상의 SEO 최적화된 블로그 포스트 초안 생성

작성 규칙:
1. 제목: SEO 키워드 포함, 클릭 유도 (숫자, 질문, 리스트 활용)
2. 도입부: 독자의 관심을 끄는 훅 (질문, 통계, 공감)
3. 본문: H2/H3 소제목으로 구조화, 각 섹션 300자 이상
4. 제휴링크: 본문 중간에 자연스럽게 상품 추천 삽입 (광고 느낌 배제)
5. 마무리: 핵심 요약 + CTA (댓글 유도, 공유 유도)
6. 메타: SEO 메타 설명 (160자), 태그 5개

글자 수: 2,000자 이상 3,000자 이하
형식: 마크다운 (H2, H3, 볼드, 리스트 활용)

출력 형식: 반드시 아래 JSON 형식으로만 응답하세요.
{
  "title": "블로그 제목",
  "meta_description": "SEO 메타 설명 (160자 이내)",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "body": "마크다운 형식의 블로그 본문 (2,000자 이상)",
  "affiliate_products": [
    {"product": "상품명", "placement": "본문 어디에 삽입했는지", "cta": "클릭 유도 문구"}
  ],
  "word_count": 2000,
  "channel": "발행 채널명",
  "tone_used": "사용된 톤 요약"
}`;

export default async function handler(req, res) {
  // 인증
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    if (req.method === "GET" && !req.query.manual) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const { date, weekday } = todayKST();

    // POST로 안건 데이터를 받음
    let topic = null;
    let revenueData = null;

    if (req.method === "POST" && req.body) {
      topic = req.body.topic;
      revenueData = req.body.revenue;
    }

    // GET 파라미터로도 받을 수 있음 (테스트용)
    if (req.query.topic) {
      try { topic = JSON.parse(decodeURIComponent(req.query.topic)); } catch {}
    }

    if (!topic) {
      return res.status(400).json({
        error: "안건 데이터가 필요합니다",
        usage: "POST /api/editor with body: { topic: {...}, revenue: {...} }",
        agent: "editor",
      });
    }

    // 채널별 톤 결정
    const pipeline = topic.pipeline || "라이프";
    const toneKey = Object.keys(CHANNEL_TONES).find(k => pipeline.includes(k)) || "라이프";
    const tone = CHANNEL_TONES[toneKey];

    const userMessage = `오늘은 ${date} ${weekday}요일입니다.

=== 채널 톤 ===
${tone}

=== CEO가 채택한 안건 ===
제목: ${topic.title || "제목 없음"}
파이프라인: ${topic.pipeline || "일반"}
각도/관점: ${topic.angle || "일반적 분석"}
키워드: ${(topic.keywords || []).join(", ")}
개요: ${topic.outline || "개요 없음"}
크로스연계: ${topic.cross_link || "없음"}
수익화 힌트: ${topic.revenue_hint || "없음"}

=== 수익전략가 추천 상품 ===
${revenueData ? JSON.stringify(revenueData, null, 2) : "추천 상품 없음 — 자연스러운 상품 추천을 본문에 포함해주세요"}

위 안건을 기반으로 블로그 초안을 작성해주세요.
반드시 2,000자 이상 작성하고, 채널 톤에 맞춰 작성하세요.
제휴링크 삽입 위치는 본문에 자연스럽게 포함하세요.`;

    const result = await callClaude(SYSTEM_PROMPT, userMessage, 4000);

    let parsed;
    try {
      const jsonStr = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // JSON 파싱 실패 시 본문 텍스트로 처리
      parsed = {
        title: topic.title || "제목",
        body: result,
        tags: topic.keywords || [],
        meta_description: "",
        word_count: result.length,
        channel: pipeline,
        parse_error: true,
      };
    }

    const output = {
      agent: "editor",
      timestamp: new Date().toISOString(),
      date,
      weekday,
      source_topic: topic.title,
      ...parsed,
    };

    return res.status(200).json(output);
  } catch (error) {
    console.error("[Editor] Error:", error.message);
    return res.status(500).json({ error: error.message, agent: "editor" });
  }
}
