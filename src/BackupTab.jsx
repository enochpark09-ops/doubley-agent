import { useState, useEffect } from "react";

const C = {
  bg: "#1a1a18", surface: "#242422", border: "#3a3a36",
  gold: "#C4A86C", goldDim: "#c4a86c33", goldMid: "#c4a86c55",
  bronze: "#8B7355",
  text: "#e8e4dc", textMuted: "#9a9690", textDim: "#6a6660",
  green: "#6dcc7a", greenDim: "#6dcc7a22",
  red: "#e07070", redDim: "#e0707022",
  blue: "#7aabcc", blueDim: "#7aabcc22",
};

// ── Google Drive API 헬퍼 ─────────────────────────────────────
const FOLDER_NAME = "DoubleY_Backup";
const FILE_NAME   = "doubley_data.json";

const drive = {
  // 폴더 찾기 또는 생성
  async getOrCreateFolder(token) {
    const search = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { files } = await search.json();
    if (files && files.length > 0) return files[0].id;
    // 폴더 없으면 생성
    const create = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
    });
    const folder = await create.json();
    return folder.id;
  },

  // 기존 백업 파일 찾기
  async findFile(token, folderId) {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and '${folderId}' in parents and trashed=false&fields=files(id,name,modifiedTime,size)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { files } = await res.json();
    return files && files.length > 0 ? files[0] : null;
  },

  // 업로드 (생성 or 덮어쓰기)
  async upload(token, folderId, fileId, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const form = new FormData();
    const meta = fileId
      ? JSON.stringify({ name: FILE_NAME })
      : JSON.stringify({ name: FILE_NAME, parents: [folderId] });
    form.append("metadata", new Blob([meta], { type: "application/json" }));
    form.append("file", blob);
    const url = fileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
      : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    const res = await fetch(url, {
      method: fileId ? "PATCH" : "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    return res.json();
  },

  // 다운로드
  async download(token, fileId) {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.json();
  },
};

// ── localStorage 전체 수집 ────────────────────────────────────
const collectAllData = () => {
  const data = { version: 2, savedAt: new Date().toISOString(), items: {} };
  const KEYS = [
    // 사업현황
    "biz_v1",
    // 체크리스트 (최근 30일)
    ...Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return `cl_v2_${d.toISOString().split("T")[0]}`;
    }),
    // 플래너 (최근 30일)
    ...Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      return [
        `planner_top3_${ds}`,
        `planner_todos_${ds}`,
        `planner_qt_${ds}`,
        `planner_qt_ai_${ds}`,
        `planner_notes_${ds}`,
        `planner_reflection_${ds}`,
        `planner_blocks_${ds}`,
        `planner_week_top3_${ds}`,
      ];
    }).flat(),
  ];
  KEYS.forEach(k => {
    const v = localStorage.getItem(k);
    if (v) data.items[k] = v;
  });
  return data;
};

// ── localStorage 복원 ─────────────────────────────────────────
const restoreAllData = (data) => {
  if (!data?.items) throw new Error("유효하지 않은 백업 파일입니다.");
  Object.entries(data.items).forEach(([k, v]) => {
    localStorage.setItem(k, v);
  });
  return Object.keys(data.items).length;
};

// ── 아이콘 ────────────────────────────────────────────────────
const Ic = ({ n, s = 16 }) => {
  const d = {
    upload:   <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    download: <><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></>,
    check:    <polyline points="20 6 9 17 4 12"/>,
    spin:     <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>,
    drive:    <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    lock:     <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    info:     <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    refresh:  <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d[n]}</svg>;
};

// ════════════════════════════════════════════════════════════
// 메인 BackupTab
// ════════════════════════════════════════════════════════════
export default function BackupTab({ gcalToken }) {
  const [status, setStatus] = useState("idle"); // idle | backing | restoring | done | error
  const [message, setMessage] = useState("");
  const [lastBackup, setLastBackup] = useState(() => {
    try { return JSON.parse(localStorage.getItem("last_backup") || "null"); } catch { return null; }
  });
  const [previewData, setPreviewData] = useState(null);
  const [showRestore, setShowRestore] = useState(false);
  const [autoBackup, setAutoBackup] = useState(() => localStorage.getItem("auto_backup") === "true");

  // 자동 백업 토글
  useEffect(() => {
    localStorage.setItem("auto_backup", autoBackup);
  }, [autoBackup]);

  // 자동 백업: 앱 열 때마다 (토큰 있고 자동백업 켜져있으면)
  useEffect(() => {
    if (!gcalToken || !autoBackup) return;
    const last = lastBackup?.date;
    const today = new Date().toDateString();
    if (last === today) return; // 오늘 이미 백업함
    backup(true); // silent=true
  }, [gcalToken]);

  const backup = async (silent = false) => {
    if (!gcalToken) {
      setMessage("구글 캘린더 탭에서 먼저 로그인해주세요.");
      setStatus("error"); return;
    }
    if (!silent) setStatus("backing");
    setMessage(silent ? "" : "백업 중...");
    try {
      const folderId = await drive.getOrCreateFolder(gcalToken);
      const existing = await drive.findFile(gcalToken, folderId);
      const data = collectAllData();
      await drive.upload(gcalToken, folderId, existing?.id || null, data);
      const info = {
        date: new Date().toDateString(),
        time: new Date().toLocaleTimeString("ko-KR"),
        count: Object.keys(data.items).length,
      };
      localStorage.setItem("last_backup", JSON.stringify(info));
      setLastBackup(info);
      if (!silent) {
        setStatus("done");
        setMessage(`✅ 백업 완료! ${info.count}개 항목이 구글 드라이브에 저장됐습니다.`);
      }
    } catch (e) {
      if (!silent) {
        setStatus("error");
        setMessage(`❌ 백업 실패: ${e.message}`);
      }
    }
    if (!silent) setTimeout(() => setStatus("idle"), 3000);
  };

  const fetchPreview = async () => {
    if (!gcalToken) { setMessage("먼저 로그인해주세요."); setStatus("error"); return; }
    setStatus("backing"); setMessage("드라이브에서 백업 확인 중...");
    try {
      const folderId = await drive.getOrCreateFolder(gcalToken);
      const file = await drive.findFile(gcalToken, folderId);
      if (!file) { setStatus("error"); setMessage("❌ 저장된 백업이 없습니다."); return; }
      const data = await drive.download(gcalToken, file.id);
      setPreviewData({ ...data, fileInfo: file });
      setShowRestore(true);
      setStatus("idle"); setMessage("");
    } catch (e) {
      setStatus("error"); setMessage(`❌ 불러오기 실패: ${e.message}`);
    }
  };

  const restore = async () => {
    if (!previewData) return;
    setStatus("restoring"); setMessage("복원 중...");
    try {
      const count = restoreAllData(previewData);
      setStatus("done");
      setMessage(`✅ 복원 완료! ${count}개 항목이 복원됐습니다. 앱을 새로고침해주세요.`);
      setShowRestore(false);
    } catch (e) {
      setStatus("error"); setMessage(`❌ 복원 실패: ${e.message}`);
    }
  };

  const isLoading = status === "backing" || status === "restoring";
  const dataCount = Object.keys(collectAllData().items).length;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:16 }}>

      {/* 헤더 */}
      <div style={{ background:`linear-gradient(135deg,${C.surface},#2a2820)`, borderRadius:14, padding:18, marginBottom:14, border:`1px solid ${C.goldMid}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:C.goldDim, border:`1px solid ${C.goldMid}`, display:"flex", alignItems:"center", justifyContent:"center", color:C.gold }}>
            <Ic n="drive" s={20}/>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text }}>구글 드라이브 백업</div>
            <div style={{ fontSize:11, color:C.textDim }}>DoubleY_Backup / doubley_data.json</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1, background:C.bg, borderRadius:8, padding:"10px 12px", border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10, color:C.textDim, marginBottom:3 }}>현재 저장된 항목</div>
            <div style={{ fontSize:20, fontWeight:800, color:C.gold }}>{dataCount}개</div>
          </div>
          <div style={{ flex:1, background:C.bg, borderRadius:8, padding:"10px 12px", border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10, color:C.textDim, marginBottom:3 }}>마지막 백업</div>
            <div style={{ fontSize:12, fontWeight:700, color:lastBackup ? C.green : C.textDim }}>
              {lastBackup ? lastBackup.time : "없음"}
            </div>
            {lastBackup && <div style={{ fontSize:9, color:C.textDim }}>{lastBackup.date}</div>}
          </div>
        </div>
      </div>

      {/* 구글 로그인 상태 */}
      {!gcalToken ? (
        <div style={{ background:C.redDim, borderRadius:12, padding:14, marginBottom:14, border:`1px solid ${C.red}44`, display:"flex", alignItems:"center", gap:10 }}>
          <Ic n="lock" s={18}/>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:C.red }}>구글 로그인 필요</div>
            <div style={{ fontSize:11, color:C.textMuted }}>캘린더 탭에서 구글 로그인 후 사용하세요</div>
          </div>
        </div>
      ) : (
        <div style={{ background:C.greenDim, borderRadius:10, padding:"9px 14px", marginBottom:14, border:`1px solid ${C.green}44`, display:"flex", alignItems:"center", gap:8 }}>
          <Ic n="check" s={14}/>
          <div style={{ fontSize:12, color:C.green }}>구글 계정 연결됨 · 백업 사용 가능</div>
        </div>
      )}

      {/* 자동 백업 토글 */}
      <div style={{ background:C.surface, borderRadius:12, padding:14, marginBottom:12, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:C.text }}>자동 백업</div>
          <div style={{ fontSize:11, color:C.textDim, marginTop:2 }}>앱 실행 시 하루 1회 자동 저장</div>
        </div>
        <button onClick={() => setAutoBackup(!autoBackup)} style={{
          width:48, height:26, borderRadius:13, border:"none", cursor:"pointer",
          background:autoBackup ? C.gold : C.border, position:"relative", transition:"background .2s",
        }}>
          <div style={{ width:20, height:20, borderRadius:"50%", background:"white", position:"absolute", top:3, left:autoBackup?25:3, transition:"left .2s" }}/>
        </button>
      </div>

      {/* 수동 백업 버튼 */}
      <button onClick={() => backup(false)} disabled={isLoading || !gcalToken} style={{
        width:"100%", padding:"14px 0", marginBottom:10,
        background: gcalToken && !isLoading ? `linear-gradient(135deg,${C.bronze},${C.gold})` : C.border,
        border:"none", borderRadius:12,
        color: gcalToken && !isLoading ? "#1a1a18" : C.textDim,
        fontSize:15, fontWeight:800, cursor: gcalToken && !isLoading ? "pointer" : "not-allowed",
        fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      }}>
        {status === "backing"
          ? <><div style={{ animation:"spin 1s linear infinite" }}><Ic n="spin" s={16}/></div>백업 중...</>
          : <><Ic n="upload" s={16}/>지금 백업하기</>
        }
      </button>

      {/* 복원 버튼 */}
      <button onClick={fetchPreview} disabled={isLoading || !gcalToken} style={{
        width:"100%", padding:"13px 0", marginBottom:14,
        background:"transparent",
        border:`1px solid ${gcalToken && !isLoading ? C.blue : C.border}`,
        borderRadius:12,
        color: gcalToken && !isLoading ? C.blue : C.textDim,
        fontSize:14, fontWeight:600, cursor: gcalToken && !isLoading ? "pointer" : "not-allowed",
        fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      }}>
        {status === "restoring"
          ? <><div style={{ animation:"spin 1s linear infinite" }}><Ic n="spin" s={16}/></div>복원 중...</>
          : <><Ic n="download" s={16}/>드라이브에서 복원하기</>
        }
      </button>

      {/* 상태 메시지 */}
      {message && (
        <div style={{
          background: status === "error" ? C.redDim : status === "done" ? C.greenDim : C.surface,
          border: `1px solid ${status === "error" ? C.red+"44" : status === "done" ? C.green+"44" : C.border}`,
          borderRadius:10, padding:"11px 14px", marginBottom:14,
          fontSize:13, color: status === "error" ? C.red : status === "done" ? C.green : C.textMuted,
          lineHeight:1.6,
        }}>{message}</div>
      )}

      {/* 무엇이 저장되나요? */}
      <div style={{ background:C.surface, borderRadius:12, padding:14, marginBottom:14, border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:11, color:C.gold, fontWeight:700, letterSpacing:1, marginBottom:10 }}>📦 백업되는 데이터</div>
        {[
          { emoji:"📊", label:"사업현황", desc:"사업 목록, 진행률, 마일스톤" },
          { emoji:"☑️", label:"체크리스트", desc:"최근 30일 체크 기록" },
          { emoji:"📋", label:"일별 플래너", desc:"최근 30일 할일, 우선순위" },
          { emoji:"✝️", label:"QT 기록", desc:"최근 30일 말씀, 적용, 기도" },
        ].map((item, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:i<3?`1px solid ${C.border}`:"none" }}>
            <span style={{ fontSize:18 }}>{item.emoji}</span>
            <div>
              <div style={{ fontSize:13, color:C.text, fontWeight:600 }}>{item.label}</div>
              <div style={{ fontSize:11, color:C.textDim }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 안내 */}
      <div style={{ background:C.surface, borderRadius:10, padding:12, border:`1px solid ${C.border}`, display:"flex", gap:8 }}>
        <div style={{ color:C.textDim, flexShrink:0, marginTop:1 }}><Ic n="info" s={14}/></div>
        <div style={{ fontSize:11, color:C.textDim, lineHeight:1.7 }}>
          구글 드라이브의 <strong style={{ color:C.textMuted }}>DoubleY_Backup</strong> 폴더에 저장됩니다.<br/>
          기기를 바꿔도 구글 계정으로 로그인하면 복원 가능합니다.<br/>
          복원 후 앱을 새로고침해야 데이터가 반영됩니다.
        </div>
      </div>

      {/* 복원 확인 모달 */}
      {showRestore && previewData && (
        <div style={{ position:"fixed", inset:0, background:"#000b", zIndex:100, display:"flex", alignItems:"flex-end" }}>
          <div style={{ width:"100%", background:C.surface, borderRadius:"20px 20px 0 0", padding:20, paddingBottom:"calc(20px + env(safe-area-inset-bottom,0px))" }}>
            <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:6 }}>백업 데이터 확인</div>
            <div style={{ fontSize:12, color:C.textDim, marginBottom:14 }}>
              저장 시각: {new Date(previewData.savedAt).toLocaleString("ko-KR")}
            </div>
            <div style={{ background:C.bg, borderRadius:10, padding:12, marginBottom:14, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, color:C.gold, fontWeight:700, marginBottom:8 }}>백업 내용</div>
              <div style={{ fontSize:13, color:C.text }}>총 {Object.keys(previewData.items || {}).length}개 항목</div>
              {Object.keys(previewData.items || {}).slice(0, 5).map(k => (
                <div key={k} style={{ fontSize:11, color:C.textDim, marginTop:3 }}>• {k}</div>
              ))}
              {Object.keys(previewData.items || {}).length > 5 && (
                <div style={{ fontSize:11, color:C.textDim, marginTop:3 }}>... 외 {Object.keys(previewData.items).length - 5}개</div>
              )}
            </div>
            <div style={{ background:"#e0707022", borderRadius:8, padding:"9px 12px", marginBottom:14, border:"1px solid #e0707044", fontSize:12, color:C.red }}>
              ⚠️ 복원하면 현재 기기의 데이터가 백업 데이터로 덮어쓰입니다.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowRestore(false)} style={{ flex:1, padding:"12px 0", background:"transparent", border:`1px solid ${C.border}`, borderRadius:10, color:C.textMuted, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>취소</button>
              <button onClick={restore} style={{ flex:2, padding:"12px 0", background:`linear-gradient(135deg,${C.bronze},${C.gold})`, border:"none", borderRadius:10, color:"#1a1a18", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"inherit" }}>복원하기</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
