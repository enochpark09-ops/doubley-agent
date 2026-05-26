// api/strategist.js — 🧠 전략기획자 에이전트
// Input: 목표, 실적, 날짜 정보
// Output: 일일 브리핑 (목표 vs 실적, 전일 리뷰, 주간/월간 분석)

import { callClaude } from "./_lib/utils.js";

const SYSTEM_PROMPT = `당신은 HANOK(하노크) 1인 크리에이터 기업의 "전략기획자" AI 에이전트입니다.

역할: CEO에게 일일/주간/월간 목표 대비 실적을 브리핑하고, GAP 원인과 대안을 제시
가동 시간: 매일 새벽 5시 KST

브리핑 구조:
1. 인사 + 오늘 날짜
2. 전일 실적 요약 (채널별 달성율)
3. 오늘 목표 (채널별 발행 목표 수)
4. 월간 달성률 (목표 대비 현재 진행률)
5. GAP 분석 (목표 미달 채널 원인 + 대안)
6. 특별 알림 (월요일=주간리뷰, 월말=다음달 목표 제안, 월초=전월 최종 리뷰)

톤: 간결하고 실행 가능한 정보. 숫자 중심. CEO가 30초에 파악 가능하게.
길이: 800자 이내.

출력 형식: 반드시 아래 JSON 형식으로만 응답하세요.
{
  "briefing_text": "CEO에게 보낼 전체 브리핑 텍스트 (800자 이내)",
  "today_targets": [{"channel": "채널명", "target": 3, "note": "참고사항"}],
  "yesterday_review": [{"channel": "채널명", "actual": 2, "target": 3, "status": "미달/달성/초과"}],
  "monthly_progress": {"achieved_pct": 65, "gap_channels": ["미달 채널1"], "on_track": true},
  "gap_analysis": [{"channel": "채널명", "gap": 5, "cause": "원인", "action": "대안"}],
  "special_note": "특별 알림 (해당 시에만)"
}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const body = req.body || {};
    const { date, weekday, month, year, day, dayIndex,
            monthly_goals, monthly_actuals, yesterday_actuals, channels,
            is_monday, is_month_end, is_month_start } = body;

    let specialContext = "";
    if (is_monday) specialContext += "\n오늘은 월요일입니다. 지난주 실적을 종합 리뷰하고 이번주 전략을 제시해주세요.";
    if (is_month_end) specialContext += "\n오늘은 이번달 마지막 날입니다. 월간 최종 실적을 정리하고, 다음달 목표치를 제안해주세요.";
    if (is_month_start) specialContext += "\n오늘은 월초입니다. 전월 최종 목표 대비 달성률과 GAP 원인을 분석해주세요.";

    const userMessage = `오늘은 ${date} ${weekday}요일입니다. (${year}년 ${month}월 ${day}일)

=== 채널 목록 ===
${(channels || []).map(c => `- ${c.label} (${c.id})`).join("\n")}

=== 월간 목표 ===
${monthly_goals ? Object.entries(monthly_goals).map(([k,v]) => `${k}: ${v}개/월`).join("\n") : "월간 목표 미설정"}

=== 월간 누적 실적 (${month}월 1일~${day}일) ===
${monthly_actuals ? Object.entries(monthly_actuals).map(([k,v]) => `${k}: ${v}개`).join("\n") : "실적 데이터 없음"}

=== 전일 실적 ===
${yesterday_actuals && Object.keys(yesterday_actuals).length > 0 ? Object.entries(yesterday_actuals).map(([k,v]) => `${k}: ${v}개`).join("\n") : "전일 실적 없음"}
${specialContext}

위 데이터를 기반으로 CEO용 전략 브리핑을 생성해주세요.
목표가 설정되지 않은 채널은 제외하고, 설정된 채널만 분석하세요.
GAP이 큰 채널은 구체적인 원인과 대안을 제시하세요.`;

    const result = await callClaude(SYSTEM_PROMPT, userMessage, 1500);

    let parsed;
    try {
      const jsonStr = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { briefing_text: result.slice(0, 800), parse_error: true };
    }

    return res.status(200).json({
      agent: "strategist",
      timestamp: new Date().toISOString(),
      date,
      ...parsed,
    });
  } catch (error) {
    console.error("[Strategist] Error:", error.message);
    return res.status(500).json({ error: error.message, agent: "strategist" });
  }
}
