# Double Y Agent Studio — 배포 가이드

## 📱 PWA 바탕화면 설치 방법

배포 후 스마트폰 브라우저에서:
- **안드로이드 (크롬)**: 주소창 옆 ⋮ 메뉴 → "앱 설치" 또는 "홈 화면에 추가"
- **아이폰 (사파리)**: 하단 공유 버튼(□↑) → "홈 화면에 추가"

---

## 🚀 Vercel 배포 단계

### 1단계: GitHub에 올리기
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_ID/doubley-agent.git
git push -u origin main
```

### 2단계: Vercel 연결
1. https://vercel.com 접속 → GitHub 로그인
2. "Add New Project" → GitHub 저장소 선택
3. Framework: **Vite** (자동 감지됨)
4. "Deploy" 클릭

### 3단계: API 키 설정 (필수!)
1. Vercel 대시보드 → 프로젝트 → **Settings**
2. **Environment Variables** 탭
3. 추가:
   - Name: `VITE_ANTHROPIC_API_KEY`
   - Value: Anthropic 콘솔에서 발급받은 API 키
4. **Redeploy** (설정 적용)

### 4단계: 커스텀 도메인 (선택)
- Vercel Settings → Domains → 원하는 도메인 연결
- 무료 도메인: `doubley-agent.vercel.app` 형태로 자동 발급

---

## 🔑 API 키 발급 방법
1. https://console.anthropic.com 접속
2. "API Keys" → "Create Key"
3. 복사해서 Vercel 환경변수에 붙여넣기

---

## 로컬 개발
```bash
npm install
cp .env.example .env.local
# .env.local에 실제 API 키 입력
npm run dev
```
