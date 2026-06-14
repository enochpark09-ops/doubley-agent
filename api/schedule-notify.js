// api/schedule-notify.js — ⏰ 투두 기반 스케줄 알림
// 플로우:
//   배치 미완료 + 새벽 6시 전 → 매시간 "배치 독촉" 알림
//   배치 미완료 + 6시 이후 → 매시간 강한 독촉
//   배치 완료 → 해당 시간 투두 알림
//   05:00 KST → 일간 모닝브리핑
//
// POST body: { assigned: bool, todos: [{id, text, time, done}] }
// cron-job.org: 매시간 정각 POST 호출

import { sendTelegram, todayKST, callClaude } from "./_lib/utils.js";

const nowKST = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return {
    hour: d.getHours(),
    minute: d.getMinutes(),
    hhmm: `${String(d.getHours()).padStart(2, "0")}:00`,
    fullTime: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
};

const generateMorningBriefing = async (date, weekday, todos) => {
  const system = `당신은 HANOK 1인 크리에이터 기업의 전략기획자 AI입니다.
매일 오전 5시 CEO에게 보내는 모닝브리핑을 작성합니다.
톤: 간결하고 실행 중심. 이모지 적절히. 600자 이내.
HTML 태그 사용 가능: <b>굵게</b>`;

  const todoText = todos && todos.length > 0
    ? todos.map(t => `- ${t.text}${t.time ? ` (${t.time})` : " (미배치)"}`).join("\n")
    : "아직 할 일 미입력";

  const msg = `오늘은 ${date} ${weekday}요일입니다.

=== 오늘 예정 할 일 ===
${todoText}

CEO용 모닝브리핑을 작성해주세요. 오늘 집중 포인트 포함. 600자 이내.`;

  try {
    return await callClaude(system, msg, 800);
  } catch (e) {
    return null;
  }
};

export default async function handler(req, res) {
  try {
    const { date, weekday } = todayKST();
    const kst = nowKST();

    // ── test=1 ──
    if (req.query.test === "1") {
      const sent = await sendTelegram(
        `✅ <b>HANOK 텔레그램 연동 테스트</b>\n\n📅 ${date} ${weekday}요일 ${kst.fullTime}\n🤖 schedule-notify API 정상 작동 중\n\n🔗 <a href="https://doubley-agent.vercel.app">에이전트 열기</a>`
      );
      return res.status(200).json({ mode: "test", telegram_sent: sent, kst_time: kst.fullTime });
    }

    // ── POST body 파싱 ──
    let assigned = false;
    let todos = [];
    if (req.method === "POST" && req.body) {
      assigned = !!req.body.assigned;
      todos = req.body.todos || [];
    }
    // GET 호출 (cron-job.org 기본 GET) → 미배치로 간주
    // assigned 상태는 프론트에서 POST로 명시해줘야 함

    let targetHour = kst.hour;
    if (req.query.hour !== undefined) targetHour = parseInt(req.query.hour);

    const results = [];

    // ── 05:00 KST: 모닝브리핑 ──
    if (targetHour === 5) {
      const briefingText = await generateMorningBriefing(date, weekday, todos);
      const todoPreview = todos.length > 0
        ? todos.map(t => `  • ${t.text}${t.time ? ` <b>${t.time}</b>` : " ⚠️미배치"}`).join("\n")
        : "  (아직 할 일 없음)";

      const msg = briefingText
        ? `🌅 <b>HANOK 모닝브리핑</b>\n📅 ${date} ${weekday}요일\n\n${briefingText}\n\n📋 오늘 할 일:\n${todoPreview}\n\n🔗 <a href="https://doubley-agent.vercel.app">에이전트 열기</a>`
        : `🌅 <b>Good Morning, CEO!</b>\n\n📅 ${date} ${weekday}요일\n\n📋 오늘 할 일:\n${todoPreview}\n\n⏰ 새벽 6시 전까지 시간 배치를 완료해주세요!\n🔗 <a href="https://doubley-agent.vercel.app">에이전트 열기</a>`;

      const sent = await sendTelegram(msg);
      results.push({ type: "morning_briefing", sent });
    }

    // ── 배치 미완료: 매시간 독촉 ──
    if (!assigned && targetHour !== 5) {
      const isLate = targetHour >= 6;
      const urgency = isLate
        ? `🚨 <b>배치 지연 알림</b> (${targetHour}시)`
        : `⏰ <b>시간 배치 리마인더</b> (${targetHour}시)`;

      const msg = `${urgency}\n📅 ${date} ${weekday}요일\n\n${
        isLate
          ? "새벽 6시가 지났는데 아직 오늘 스케줄 시간 배치가 완료되지 않았습니다! 지금 바로 배치해주세요."
          : `새벽 6시 전까지 오늘 할 일의 시간 배치를 완료해주세요.\n현재 할 일: ${todos.length > 0 ? todos.length + "개 입력됨" : "미입력"}`
      }\n\n🔗 <a href="https://doubley-agent.vercel.app">에이전트 열기</a>`;

      const sent = await sendTelegram(msg);
      results.push({ type: "assign_nudge", sent, hour: targetHour });
    }

    // ── 배치 완료: 해당 시간 투두 알림 ──
    if (assigned && targetHour !== 5) {
      const hhmm = `${String(targetHour).padStart(2, "0")}:00`;
      const matching = todos.filter(t => t.time && t.time.startsWith(hhmm.slice(0,3)));

      if (matching.length > 0) {
        const taskLines = matching.map(t => `  ✅ <b>${t.text}</b>`).join("\n");
        const msg = `⏰ <b>${hhmm} 스케줄 알림</b>\n📅 ${date} ${weekday}요일\n\n${taskLines}\n\n🔗 <a href="https://doubley-agent.vercel.app">에이전트 열기</a>`;
        const sent = await sendTelegram(msg);
        results.push({ type: "todo_notify", sent, time: hhmm, count: matching.length });
      } else {
        results.push({ type: "no_tasks", time: hhmm });
      }
    }

    return res.status(200).json({
      agent: "schedule-notify",
      timestamp: new Date().toISOString(),
      kst_time: kst.fullTime,
      target_hour: targetHour,
      assigned,
      todos_count: todos.length,
      date,
      results,
    });
  } catch (error) {
    console.error("[ScheduleNotify] Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
