// API 키 설정
const WEATHER_API_KEY = 'ec33fcf4c545bae8ff86fa150a63294d';

// exchangeChart.js 모듈 불러오기
import { createExchangeRateHTML, initializeChartControls } from './exchangeChart.js';

// DOM 요소
const cityInput = document.getElementById('cityInput');
const cityList = document.getElementById('cityList');
const searchButton = document.getElementById('searchButton');
const resultContainer = document.getElementById('resultContainer');
const weatherInfo = document.getElementById('weatherInfo');
const clothingRecommendation = document.getElementById('clothingRecommendation');
const exchangeRate = document.getElementById('exchangeRate');
const localTime = document.getElementById('localTime');

// 선택된 도시 정보를 저장할 변수
let selectedCity = null;

// 도시 검색 디바운스 타이머
let debounceTimer;

// 전역 변수로 현재 통화 코드 저장
let currentCurrencyCode = null;

// 검색 버튼 클릭 이벤트
searchButton.addEventListener('click', () => {
    const query = cityInput.value.trim();
    if (query.length >= 2) {
        searchCities(query);
    }
});

// Enter 키 이벤트
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = cityInput.value.trim();
        if (query.length >= 2) {
            searchCities(query);
        }
    }
});

// 도시명 자동완성
cityInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();

    if (query.length < 1) {
        cityList.style.display = 'none';
        return;
    }

    // 0.3초 디바운스 적용
    debounceTimer = setTimeout(() => {
        searchCities(query);
    }, 300);
});

// Geocoding API로 도시 검색
function searchCities(query) {
    const xhr = new XMLHttpRequest();
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${WEATHER_API_KEY}`;

    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const cities = JSON.parse(xhr.responseText);
                displayCityList(cities);
            } else {
                console.error('도시 검색 중 오류 발생:', xhr.status);
                cityList.innerHTML = '<li class="error">도시 검색 중 오류가 발생했습니다.</li>';
                cityList.style.display = 'block';
            }
        }
    };
    xhr.onerror = function() {
        console.error('도시 검색 중 네트워크 오류 발생');
        cityList.innerHTML = '<li class="error">네트워크 오류가 발생했습니다.</li>';
        cityList.style.display = 'block';
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
            const koreanCityName = countryMap[city.name] || city.name;
            const koreanCountryName = countryMap[city.country] || city.country;
            li.textContent = `${koreanCityName} (${koreanCountryName})`;
            li.onclick = () => selectCity(city);
            cityList.appendChild(li);
        });
    } else {
        cityList.innerHTML = '<li class="no-results">검색 결과가 없습니다.</li>';
        cityList.style.display = 'block';
    }
}

// 도시 선택 시 처리
function selectCity(city) {
    selectedCity = city;
    const koreanCityName = countryMap[city.name] || city.name;
    const koreanCountryName = countryMap[city.country] || city.country;
    cityInput.value = `${koreanCityName} (${koreanCountryName})`;
    cityList.style.display = 'none';

    // 선택된 도시의 날씨 정보 가져오기
    getCurrentWeather(city);
}

// 현재 날씨 정보 가져오기
function getCurrentWeather(city) {
    const xhr = new XMLHttpRequest();
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`;

    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const weatherData = JSON.parse(xhr.responseText);
                displayWeatherInfo(weatherData);
                getClothingRecommendation(weatherData);
                getExchangeRate(city.country);
                displayLocalTime(weatherData.timezone);
                resultContainer.style.display = 'block';
            } else {
                console.error('날씨 정보 가져오기 중 오류 발생:', xhr.status);
                weatherInfo.innerHTML = '<p class="error">날씨 정보를 가져오는 중 오류가 발생했습니다.</p>';
            }
        }
    };

    xhr.onerror = function() {
        console.error('날씨 정보 가져오기 중 네트워크 오류 발생');
        weatherInfo.innerHTML = '<p class="error">네트워크 오류가 발생했습니다.</p>';
    };
    xhr.send();
}

// 날씨 정보 표시
async function displayWeatherInfo(data) {
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

    try {
        // 국가 코드로 통화 코드 설정
        const countryResponse = await fetch(`https://restcountries.com/v3.1/alpha/${data.sys.country}`);
        const countryData = await countryResponse.json();
        currentCurrencyCode = Object.keys(countryData[0].currencies)[0];
    } catch (error) {
        console.error('Error:', error);
    }
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
    const url = `https://api.frankfurter.app/latest?from=${currencyCode}&to=KRW`;

    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            if (data.rates && data.rates.KRW) {
                const rate = data.rates.KRW;
                const krwPerUnit = rate.toFixed(2);

                // 환율 정보 HTML 생성 및 표시
                exchangeRate.innerHTML = createExchangeRateHTML(currencyCode, krwPerUnit, currencyName);
                exchangeRate.style.display = 'block';

                // 차트 컨트롤 초기화
                initializeChartControls(currencyCode);
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
