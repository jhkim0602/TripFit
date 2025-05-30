# TripFit - 여행지 날씨 기반 옷차림 추천 웹사이트

## 📝 프로젝트 소개
TripFit은 여행지의 현재 날씨 정보를 바탕으로 적절한 옷차림을 추천해주는 웹 서비스입니다.

## 🌟 주요 기능
- 도시명 자동완성 검색
- 현재 날씨 정보 표시 (온도, 습도, 날씨 상태)
- 날씨 기반 옷차림 추천
- 현지 환율 정보 제공
  - 현지 환율 차트 보여주기 (구현 대기)
- 현지 시각 및 한국과의 시차 표시

## 🛠 사용 기술
- HTML5
- CSS3
- Vanilla JavaScript
- OpenWeatherMap API
- ExchangeRate API
- RestCountries API

## ⚙️ 설치 및 실행 방법
1. 프로젝트를 클론합니다
```bash
git clone https://github.com/[사용자명]/TripFit.git
```

2. OpenWeatherMap API 키 설정
- script.js 파일에서 `WEATHER_API_KEY` 값을 본인의 API 키로 변경합니다
```javascript
const WEATHER_API_KEY = 'YOUR_API_KEY_HERE';
```

3. index.html 파일을 웹 브라우저에서 실행합니다

## 📸 스크린샷
(스크린샷 추가 예정)

## 🔒 API 키 발급 방법
1. OpenWeatherMap API
- https://openweathermap.org 접속
- 회원가입 후 API 키 발급
- Free 티어로도 충분히 사용 가능

## 👥 기여 방법
1. 이 저장소를 포크합니다
2. 새로운 브랜치를 생성합니다
3. 변경사항을 커밋합니다
4. 브랜치에 푸시합니다
5. Pull Request를 생성합니다

## 📜 라이선스
이 프로젝트는 MIT 라이선스를 따릅니다.
