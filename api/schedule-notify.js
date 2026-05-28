// api/schedule-notify.js — ⏰ 스케줄 기반 텔레그램 알림
// Vercel Cron: 매시간 정각 호출
// 05:00 KST → 일간 브리핑 자동 생성 + 전송
// 그 외 시간 → 해당 시간의 스케줄 항목을 텔레그램 알림
// 수동: /api/schedule-notify?manual=1 또는 ?test=1 (테스트 메시지)
//       /api/schedule-notify?hour=9 (특정 시간 시뮬레이션)

import { sendTelegram, todayKST, DEFAULT_SCHEDULE, PIPELINE_LABELS, callClaude, PIPELINES } from "./_lib/utils.js";

// KST 현재 시간
const nowKST = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return {
    hour: d.getHours(),
    minute: d.getMinutes(),
    hhmm: `${String(d.getHours()).padStart(2, "0")}:00`,
    fullTime: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
};

// 일간 브리핑 생성 (05:00 KST 전용)
const generateDailyBriefing = async (date, weekday) => {
  const pipeline = PIPELINES[weekday] || PIPELINES["월"];

  const system = `당신은 HANOK(하노크) 1인 크리에이터 기업의 "전략기획자" AI 에이전트입니다.
매일 오전 5시에 CEO에게 보내는 일간 모닝브리핑을 작성합니다.

브리핑 포함 사항:
1. 오늘 날짜/요일 인사
2. 오늘의 메인/서브 파이프라인
3. 오늘 스케줄 요약 (시간대별 할 일)
4. 웹소설/음원 현황
5. CEO가 오늘 집중할 포인트 (2~3줄)

톤: 간결하고 실행 중심. 이모지 적절히. 텔레그램 메시지라 600자 이내.
HTML 태그 사용 가능: <b>굵게</b>, <i>기울임</i>`;

  const scheduleText = DEFAULT_SCHEDULE
    .sort((a, b) => a.time.localeCompare(b.time))
    .map(s => `${s.time} | ${PIPELINE_LABELS[s.pipeline] || s.pipeline} | ${s.task}`)
    .join("\n");

  const userMessage = `오늘은 ${date} ${weekday}요일입니다.

오늘의 파이프라인: 메인 [${pipeline.main}] / 서브 [${pipeline.sub}]
웹소설: ${pipeline.novel || "—"}
${pipeline.music ? "🎵 음원 제작일" : ""}

=== 오늘 CEO 스케줄 ===
${scheduleText}

위 정보를 바탕으로 CEO용 모닝브리핑 텔레그램 메시지를 작성해주세요. 600자 이내.`;

  try {
    const result = await callClaude(system, userMessage, 800);
    return result;
  } catch (e) {
    console.error("[DailyBriefing] Claude error:", e.message);
    return null;
  }
};

export default async function handler(req, res) {
  try {
    const { date, weekday } = todayKST();
    const kst = nowKST();
    const results = [];

    // ── test=1: 텔레그램 연결 테스트 ──
    if (req.query.test === "1") {
      const sent = await sendTelegram(
        `✅ <b>HANOK 텔레그램 연동 테스트</b>\n\n📅 ${date} ${weekday}요일 ${kst.fullTime}\n🤖 schedule-notify API 정상 작동 중\n\n🔗 <a href="https://doubley-agent.vercel.app">에이전트 열기</a>`
      );
      return res.status(200).json({
        agent: "schedule-notify",
        mode: "test",
        telegram_sent: sent,
        kst_time: kst.fullTime,
        env_check: {
          has_bot_token: !!process.env.TELEGRAM_BOT_TOKEN,
          has_chat_id: !!process.env.TELEGRAM_CHAT_ID,
          chat_id: process.env.TELEGRAM_CHAT_ID || "NOT SET",
        },
      });
    }

    // ── hour 파라미터로 시간 오버라이드 (시뮬레이션) ──
    let targetHour = kst.hour;
    let targetHHMM = kst.hhmm;
    if (req.query.hour !== undefined) {
      targetHour = parseInt(req.query.hour);
      targetHHMM = `${String(targetHour).padStart(2, "0")}:00`;
    }

    // ── 05:00 KST: 일간 브리핑 ──
    if (targetHour === 5) {
      const briefingText = await generateDailyBriefing(date, weekday);
      if (briefingText) {
        const sent = await sendTelegram(
          `🌅 <b>HANOK 모닝브리핑</b>\n📅 ${date} ${weekday}요일\n\n${briefingText}\n\n🔗 <a href="https://doubley-agent.vercel.app">에이전트 열기</a>`
        );
        results.push({ type: "daily_briefing", sent, time: "05:00" });
      } else {
        const pipeline = PIPELINES[weekday] || PIPELINES["월"];
        const fallback = `🌅 <b>Good Morning, CEO!</b>\n\n📅 ${date} ${weekday}요일\n🎯 메인: ${pipeline.main}\n📌 서브: ${pipeline.sub}\n📖 웹소설: ${pipeline.novel || "—"}\n${pipeline.music ? "🎵 음원 제작일\n" : ""}\n오늘도 화이팅! 💪`;
        const sent = await sendTelegram(fallback);
        results.push({ type: "daily_briefing_fallback", sent, time: "05:00" });
      }
    }

    // ── 매시간: 해당 시간 스케줄 알림 ──
    const matchingTasks = DEFAULT_SCHEDULE.filter(s => s.time === targetHHMM);

    if (matchingTasks.length > 0) {
      const taskLines = matchingTasks.map(s => {
        const label = PIPELINE_LABELS[s.pipeline] || s.pipeline;
        return `  ${label}\n  → <b>${s.task}</b> (R${s.round})`;
      }).join("\n\n");

      const message = `⏰ <b>${targetHHMM} 스케줄 알림</b>\n📅 ${date} ${weekday}요일\n\n${taskLines}\n\n🔗 <a href="https://doubley-agent.vercel.app">에이전트 열기</a>`;

      const sent = await sendTelegram(message);
      results.push({ type: "schedule_notify", sent, time: targetHHMM, tasks: matchingTasks.length });
    }

    // 아무 알림도 없으면 로그만
    if (results.length === 0) {
      results.push({ type: "no_tasks", time: targetHHMM, message: `${targetHHMM}에 예정된 스케줄 없음` });
    }

    return res.status(200).json({
      agent: "schedule-notify",
      timestamp: new Date().toISOString(),
      kst_time: kst.fullTime,
      target_hour: targetHour,
      target_hhmm: targetHHMM,
      date,
      weekday,
      results,
    });
  } catch (error) {
    console.error("[ScheduleNotify] Error:", error.message);
    return res.status(500).json({ error: error.message, agent: "schedule-notify" });
  }
}
