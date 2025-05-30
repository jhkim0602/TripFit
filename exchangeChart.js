// 차트 인스턴스 저장 변수
let exchangeChart = null;

// 날짜 포맷팅 함수
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// 환율 이력 데이터 가져오기
async function getExchangeRateHistory(currencyCode, days) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        console.log('환율 데이터 요청:', {
            시작일: formatDate(startDate),
            종료일: formatDate(endDate),
            통화: currencyCode
        });

        const response = await fetch(`https://api.frankfurter.app/${formatDate(startDate)}..${formatDate(endDate)}?from=${currencyCode}&to=KRW`);
        const data = await response.json();

        console.log('받은 환율 데이터:', data);

        if (data.error) {
            console.error('API 오류:', data.error);
            return [];
        }

        if (!data || !data.rates) {
            console.error('환율 데이터를 가져오는데 실패했습니다:', data);
            return [];
        }

        // Frankfurter API 응답 구조에 맞게 데이터 변환
        const ratesData = Object.entries(data.rates).map(([date, rates]) => ({
            date,
            rate: rates.KRW
        }));

        console.log('변환된 환율 데이터:', ratesData);

        return ratesData.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
        console.error('환율 데이터 조회 중 오류 발생:', error);
        return [];
    }
}

// 차트 생성 함수
function createExchangeChart(data, currencyCode) {
    const ctx = document.getElementById('exchangeChart').getContext('2d');

    if (exchangeChart) {
        exchangeChart.destroy();
    }

    if (!data || data.length === 0) {
        console.error('차트를 그릴 데이터가 없습니다.');
        return;
    }

    console.log('차트 생성 데이터:', {
        날짜: data.map(item => item.date),
        환율: data.map(item => item.rate)
    });

    exchangeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.date),
            datasets: [{
                label: `1 ${currencyCode} = KRW`,
                data: data.map(item => item.rate),
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `1 ${currencyCode} = ${context.parsed.y.toFixed(2)} KRW`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'YYYY-MM-DD'
                        }
                    },
                    title: {
                        display: true,
                        text: '날짜'
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '환율 (KRW)'
                    },
                    ticks: {
                        callback: (value) => `${value.toFixed(2)} KRW`
                    }
                }
            }
        }
    });
}

// 차트 업데이트 함수
async function updateExchangeChart(currencyCode) {
    try {
        const days = parseInt(document.getElementById('periodSelect').value);
        const data = await getExchangeRateHistory(currencyCode, days);

        if (data.length === 0) {
            console.error('환율 데이터를 가져오는데 실패했습니다.');
            return;
        }

        createExchangeChart(data, currencyCode);
    } catch (error) {
        console.error('차트 업데이트 중 오류 발생:', error);
    }
}

// 차트 컨트롤 초기화 함수
function initializeChartControls(currencyCode) {
    const toggleChartBtn = document.getElementById('toggleChartBtn');
    const chartContainer = document.getElementById('chartContainer');
    const periodSelect = document.getElementById('periodSelect');

    toggleChartBtn.addEventListener('click', () => {
        const isHidden = chartContainer.style.display === 'none';
        chartContainer.style.display = isHidden ? 'block' : 'none';
        toggleChartBtn.textContent = isHidden ? '환율 차트 닫기' : '환율 차트 보기';

        if (isHidden && currencyCode) {
            updateExchangeChart(currencyCode);
        }
    });

    periodSelect.addEventListener('change', () => {
        if (currencyCode && chartContainer.style.display !== 'none') {
            updateExchangeChart(currencyCode);
        }
    });
}

// 환율 정보 HTML 생성 함수
function createExchangeRateHTML(currencyCode, krwPerUnit, currencyName) {
    return `
        <h3>💱 환율 정보</h3>
        <p>1 ${currencyCode} ≈ ${krwPerUnit} KRW</p>
        <p class="currency-name">${currencyName}</p>
        <div class="chart-controls">
            <select id="periodSelect">
                <option value="7">1주일</option>
                <option value="30" selected>1개월</option>
                <option value="365">1년</option>
            </select>
            <button id="toggleChartBtn">환율 차트 보기</button>
        </div>
        <div id="chartContainer" style="display: none;">
            <canvas id="exchangeChart"></canvas>
        </div>
    `;
}

// 외부로 내보낼 함수들
export {
    createExchangeRateHTML,
    initializeChartControls,
    updateExchangeChart
};
