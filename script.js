// API 키 설정
const WEATHER_API_KEY = 'YOUR_API_KEY_HERE';

// DOM 요소
const cityInput = document.getElementById('cityInput');
const cityList = document.getElementById('cityList');
const resultContainer = document.getElementById('resultContainer');
const weatherInfo = document.getElementById('weatherInfo');
const clothingRecommendation = document.getElementById('clothingRecommendation');
const exchangeRate = document.getElementById('exchangeRate');
const localTime = document.getElementById('localTime');

// 선택된 도시 정보를 저장할 변수
let selectedCity = null;

// 도시 검색 디바운스 타이머
let debounceTimer;

// [1단계] 도시명 자동완성
cityInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();

    if (query.length < 2) {
        cityList.style.display = 'none';
        return;
    }

    // 0.5초 디바운스 적용
    debounceTimer = setTimeout(() => {
        searchCities(query);
    }, 500);
});

// Geocoding API로 도시 검색
function searchCities(query) {
    const xhr = new XMLHttpRequest();
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${WEATHER_API_KEY}`;

    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const cities = JSON.parse(xhr.responseText);
            displayCityList(cities);
        }
    };
    xhr.send();
}

// 도시 목록 표시
function displayCityList(cities) {
    cityList.innerHTML = '';

    if (cities.length > 0) {
        cityList.style.display = 'block';
        cities.forEach(city => {
            const li = document.createElement('li');
            // 국가명이 매핑에 있으면 한글로, 없으면 영문 국가 코드 표시
            const countryName = countryMap[city.country] || city.country;
            li.textContent = `${city.name} (${countryName})`;
            li.onclick = () => selectCity(city);
            cityList.appendChild(li);
        });
    } else {
        cityList.style.display = 'none';
    }
}

// 도시 선택 시 처리
function selectCity(city) {
    selectedCity = city;
    cityInput.value = `${city.name} (${countryMap[city.country] || city.country})`;
    cityList.style.display = 'none';

    // 선택된 도시의 날씨 정보 가져오기
    getCurrentWeather(city);
}

// [2단계] 현재 날씨 정보 가져오기
function getCurrentWeather(city) {
    const xhr = new XMLHttpRequest();
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`;

    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const weatherData = JSON.parse(xhr.responseText);
            displayWeatherInfo(weatherData);
            getClothingRecommendation(weatherData);
            getExchangeRate(city.country);
            displayLocalTime(weatherData.timezone);
            resultContainer.style.display = 'block';
        }
    };
    xhr.send();
}

// 날씨 정보 표시
function displayWeatherInfo(data) {
    const weatherEmoji = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Snow': '❄️',
        'Thunderstorm': '⛈️',
        'Drizzle': '🌦️',
        'Mist': '🌫️',
        'Fog': '🌫️'
    };

    const emoji = weatherEmoji[data.weather[0].main] || '🌈';

    weatherInfo.innerHTML = `
        <h3>${emoji} 현재 날씨</h3>
        <p class="temp">🌡️ 현재 기온: ${data.main.temp.toFixed(1)}°C</p>
        <p class="feels-like">체감 온도: ${data.main.feels_like.toFixed(1)}°C</p>
        <p class="humidity">💧 습도: ${data.main.humidity}%</p>
        <p class="description">${data.weather[0].description}</p>
    `;

    resultContainer.style.display = 'block';
}

// [3단계] 날씨 기반 옷차림 추천
function getClothingRecommendation(weatherData) {
    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const weather = weatherData.weather[0].main;
    const month = new Date().getMonth() + 1;

    let recommendation = '';

    // 기온별 기본 옷차림 추천
    if (temp >= 28) {
        recommendation = '민소매, 반팔, 반바지, 린넨 소재 옷';
    } else if (temp >= 23) {
        recommendation = '반팔, 얇은 셔츠, 얇은 긴바지';
    } else if (temp >= 20) {
        recommendation = '얇은 가디건, 긴팔, 면바지, 청바지';
    } else if (temp >= 17) {
        recommendation = '가디건, 얇은 니트, 맨투맨, 청바지';
    } else if (temp >= 12) {
        recommendation = '자켓, 가디건, 청바지, 면바지';
    } else if (temp >= 9) {
        recommendation = '트렌치코트, 야상, 니트, 청바지, 스타킹';
    } else if (temp >= 5) {
        recommendation = '코트, 가죽자켓, 히트텍, 니트, 청바지, 레깅스';
    } else {
        recommendation = '패딩, 두꺼운 코트, 목도리, 기모제품';
    }

    // 날씨 상태에 따른 추가 추천
    if (weather === 'Rain' || weather === 'Drizzle') {
        recommendation += '\n☔ 우산, 레인코트를 챙기세요!';
    } else if (weather === 'Snow') {
        recommendation += '\n❄️ 방수되는 신발과 두꺼운 장갑을 챙기세요!';
    }

    // 습도에 따른 추가 추천
    if (humidity >= 70) {
        recommendation += '\n💧 습도가 높으니 쾌적한 소재를 선택하세요.';
    }

    // 계절성 보정
    if ((month >= 6 && month <= 8) && temp < 12) {
        recommendation += '\n🌡️ 일교차가 클 수 있으니 겉옷을 챙기세요.';
    }

    clothingRecommendation.innerHTML = `
        <h3>옷차림 추천</h3>
        <p>${recommendation}</p>
    `;
}

// [4단계] 환율 정보 가져오기
function getExchangeRate(countryCode) {
    // RestCountries API로 통화 코드 가져오기
    const xhr = new XMLHttpRequest();
    const url = `https://restcountries.com/v3.1/alpha/${countryCode}`;

    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const countryData = JSON.parse(xhr.responseText)[0];
            if (countryData && countryData.currencies) {
                const currencies = Object.keys(countryData.currencies);
                if (currencies.length > 0) {
                    const currencyCode = currencies[0];
                    const currencyInfo = countryData.currencies[currencyCode];
                    fetchExchangeRate(currencyCode, currencyInfo.name);
                }
            }
        }
    };
    xhr.send();
}

// 환율 정보 가져오기
function fetchExchangeRate(currencyCode, currencyName) {
    const xhr = new XMLHttpRequest();
    const url = `https://open.er-api.com/v6/latest/KRW`;

    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            if (data.rates && data.rates[currencyCode]) {
                const rate = data.rates[currencyCode];
                // 현지 통화 1단위 당 한화 가격 계산 (1/rate는 현지통화 1단위의 원화 가격)
                const krwPerUnit = (1 / rate).toFixed(2);

                exchangeRate.innerHTML = `
                    <h3>💱 환율 정보</h3>
                    <p>1 ${currencyCode} ≈ ${krwPerUnit} KRW</p>
                    <p class="currency-name">${currencyName}</p>
                `;
                exchangeRate.style.display = 'block';
            }
        }
    };
    xhr.send();
}

// [5단계] 현지 시간 표시
function displayLocalTime(timezoneOffset) {
    const now = new Date();
    const localTimeDate = new Date(now.getTime() + (timezoneOffset * 1000));

    // 한국 시간과의 시차 계산 (한국은 GMT+9)
    const koreaOffset = 9;
    const targetOffset = timezoneOffset / 3600;
    const timeDiff = targetOffset - koreaOffset;

    // 시차 메시지 생성
    let timeDiffMessage = '';
    if (timeDiff === 0) {
        timeDiffMessage = '한국과 같은 시간대입니다';
    } else if (timeDiff > 0) {
        timeDiffMessage = `한국보다 ${timeDiff}시간 빠릅니다`;
    } else {
        timeDiffMessage = `한국보다 ${Math.abs(timeDiff)}시간 느립니다`;
    }

    const formattedDate = localTimeDate.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    localTime.innerHTML = `
        <h3>🕒 현지 시각</h3>
        <p>${formattedDate}</p>
        <p class="time-diff">${timeDiffMessage}</p>
    `;
}
