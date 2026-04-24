document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('routine-form');
    const resultSection = document.getElementById('result-section');
    const loader = document.getElementById('loader');
    const routineContent = document.getElementById('routine-content');
    
    // Auth UI
    const authBar = document.getElementById('auth-bar');
    const welcomeMsg = document.getElementById('welcome-msg');
    const btnLoginModal = document.getElementById('btn-login-modal');
    const btnLogout = document.getElementById('btn-logout');
    const btnMyRoutines = document.getElementById('btn-my-routines');
    
    // Modals
    const authModal = document.getElementById('auth-modal');
    const routinesModal = document.getElementById('routines-modal');
    const closeModal = document.querySelector('.close-modal');
    const closeRoutinesModal = document.querySelector('.close-routines-modal');
    
    // Auth Form
    const authForm = document.getElementById('auth-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const modalTitle = document.getElementById('modal-title');
    const switchAuthMode = document.getElementById('switch-auth-mode');
    
    let isLoginMode = true;
    let currentGeneratedRoutine = null;
    let currentGeneratedGoal = null;

    // --- Authentication Logic ---
    function checkAuth() {
        const token = localStorage.getItem('mc_token');
        const username = localStorage.getItem('mc_username');
        if (token && username) {
            welcomeMsg.textContent = `${username}님 환영합니다!`;
            welcomeMsg.classList.remove('hidden');
            btnLoginModal.classList.add('hidden');
            btnLogout.classList.remove('hidden');
            btnMyRoutines.classList.remove('hidden');
            return true;
        } else {
            welcomeMsg.classList.add('hidden');
            btnLoginModal.classList.remove('hidden');
            btnLogout.classList.add('hidden');
            btnMyRoutines.classList.add('hidden');
            return false;
        }
    }
    checkAuth();

    btnLoginModal.addEventListener('click', () => authModal.classList.remove('hidden'));
    closeModal.addEventListener('click', () => authModal.classList.add('hidden'));
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('mc_token');
        localStorage.removeItem('mc_username');
        checkAuth();
        alert('로그아웃 되었습니다.');
        // Remove save button if present
        const saveBtn = document.getElementById('save-routine-btn');
        if(saveBtn) saveBtn.remove();
    });
    
    switchAuthMode.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        modalTitle.textContent = isLoginMode ? '로그인' : '회원가입';
        authSubmitBtn.textContent = isLoginMode ? '로그인' : '회원가입 완료';
        switchAuthMode.textContent = isLoginMode ? '회원가입' : '로그인으로 돌아가기';
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = isLoginMode ? '/api/login' : '/api/signup';
        try {
            const res = await fetch(`http://localhost:3000${url}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameInput.value, password: passwordInput.value })
            });
            
            const data = await res.json();
            if (res.ok) {
                if (isLoginMode) {
                    localStorage.setItem('mc_token', data.token);
                    localStorage.setItem('mc_username', data.username);
                    checkAuth();
                    authModal.classList.add('hidden');
                    usernameInput.value = '';
                    passwordInput.value = '';
                    alert('로그인 성공!');
                } else {
                    alert('회원가입 성공! 이제 로그인해주세요.');
                    switchAuthMode.click(); // switch to login mode
                }
            } else {
                alert(data.error);
            }
        } catch(err) {
            alert("서버 연결 실패. 서버가 켜져있는지 확인하세요.");
        }
    });

    // --- My Routines ---
    btnMyRoutines.addEventListener('click', async () => {
        routinesModal.classList.remove('hidden');
        const container = document.getElementById('saved-routines-container');
        container.innerHTML = '<p>불러오는 중...</p>';
        
        try {
            const res = await fetch('http://localhost:3000/api/routines', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('mc_token')}` }
            });
            const data = await res.json();
            
            if(data.length === 0) {
                container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">저장된 루틴이 없습니다.</p>';
                return;
            }
            
            let html = '';
            data.forEach(item => {
                const date = new Date(item.created_at).toLocaleDateString('ko-KR');
                html += `
                <div class="saved-routine-item">
                    <h3 style="color: var(--accent-color); margin-bottom: 1rem;">[${date}] ${item.goal} 프로토콜</h3>
                `;
                item.routine_data.routines.forEach(day => {
                    html += `<div><strong>${day.day}</strong>: ${day.exercises.map(e=>e.name).join(', ')}</div>`;
                });
                html += `</div>`;
            });
            container.innerHTML = html;
            
        } catch(err) {
            container.innerHTML = '<p>오류가 발생했습니다.</p>';
        }
    });
    closeRoutinesModal.addEventListener('click', () => routinesModal.classList.add('hidden'));

    // --- Routine Generation Logic ---
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const bmiInput = document.getElementById('bmi');

    function updateBMI() {
        const h = parseFloat(heightInput.value) / 100;
        const w = parseFloat(weightInput.value);
        if(h > 0 && w > 0) {
            const bmi = (w / (h * h)).toFixed(1);
            bmiInput.value = bmi;
        }
    }
    heightInput.addEventListener('input', updateBMI);
    weightInput.addEventListener('input', updateBMI);
    updateBMI();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const data = {
            age: parseInt(document.getElementById('age').value),
            bmi: parseFloat(bmiInput.value),
            level: document.getElementById('level').value,
            goal: document.getElementById('goal').value,
            frequency: parseInt(document.getElementById('frequency').value),
            duration: parseInt(document.getElementById('duration').value),
            weight: parseFloat(weightInput.value)
        };

        resultSection.classList.remove('hidden');
        loader.classList.remove('hidden');
        routineContent.classList.add('hidden');
        routineContent.innerHTML = '';

        setTimeout(() => {
            const routine = generateClaudeStyleRoutine(data);
            currentGeneratedRoutine = routine;
            currentGeneratedGoal = data.goal;
            renderRoutine(routine, data);
            
            loader.classList.add('hidden');
            routineContent.classList.remove('hidden');
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 1200);
    });

    function generateClaudeStyleRoutine(data) {
        const template = [
            {
                day: "Day 1 — 밀기 (가슴/어깨/삼두)",
                count: "5종목",
                exercises: [
                    {name: "트라이셉스 딥스", tag: "삼두 체중 복합", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                    {name: "바벨 오버헤드 프레스", tag: "전삼각·복합", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                    {name: "덤벨 숄더 프레스", tag: "안정성 요구", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                    {name: "바벨 벤치프레스", tag: "다관절·주동근, 프리웨이트", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                    {name: "바벨 컬", tag: "이두 복합", sets: "3세트", reps: "8~12회", rest: "60~90초"}
                ]
            },
            {
                day: "Day 2 — 당기기 (등/이두)",
                count: "4종목",
                exercises: [
                    {name: "트라이셉스 딥스", tag: "삼두 체중 복합", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                    {name: "풀업 (가중)", tag: "광배·복합 다관절", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                    {name: "바벨 데드리프트", tag: "전신 복합, 고급자 권장", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                    {name: "바벨 컬", tag: "이두 복합", sets: "3세트", reps: "8~12회", rest: "60~90초"}
                ]
            },
            {
                day: "Day 3 — 하체 + 코어",
                count: "4종목",
                exercises: [
                    {name: "바벨 백스쿼트", tag: "하체 대표 복합, 고급자 권장", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                    {name: "케이블 크런치", tag: "복직근 고립", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                    {name: "레그 프레스", tag: "머신·무릎 부담 ↓", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                    {name: "플랭크", tag: "코어 안정화", sets: "3세트", reps: "8~12회", rest: "60~90초"}
                ]
            }
        ];

        let adjusted = JSON.parse(JSON.stringify(template)); 
        adjusted.forEach(day => {
            day.exercises.forEach(ex => {
                if(data.goal === "스트렝스") {
                    ex.sets = "5세트"; ex.reps = "3~6회"; ex.rest = "120~180초";
                } else if(data.goal === "다이어트") {
                    ex.sets = "4세트"; ex.reps = "12~15회"; ex.rest = "45~60초";
                }
                if(data.duration === 40) ex.sets = "2~3세트";
                else if(data.duration === 90) ex.sets = parseInt(ex.sets[0]) + 1 + "세트";

                if(data.age >= 45 || data.level === "초급") {
                    if(ex.name.includes("바벨 백스쿼트")) {
                        ex.name = "고블릿 스쿼트 또는 파워 레그프레스";
                        ex.tag = "안정성 강화, 부상위험 ↓"; ex.reps = "10~15회";
                    }
                    if(ex.name.includes("바벨 데드리프트")) {
                        ex.name = "루마니안 데드리프트 (가벼운 중량)";
                        ex.tag = "허리 부담 감소"; ex.reps = "10~12회";
                    }
                }
            });
        });

        let proteinMultiplier = data.goal === "근비대" ? 2.0 : (data.goal === "다이어트" ? 2.2 : 1.8);
        let protein = (data.weight * proteinMultiplier).toFixed(0);
        let surplus = data.goal === "다이어트" ? "-300~500" : (data.goal === "근비대" ? "+200~300" : "유지");
        let carbFocus = data.goal === "다이어트" ? "단백질 중심, 정제 탄수화물 엄격히 제한" : "탄수화물 중심 (운동 전후 필수 섭취)";

        return { routines: adjusted, nutrition: { surplus, protein, carbFocus } };
    }

    function renderRoutine(data, rawInput) {
        let html = `
        <div style="margin-bottom: 2.5rem;">
            <h3 style="color: var(--accent-color); font-size: 1.6rem; margin-bottom: 0.5rem; font-weight: 800;">🔥 ${rawInput.goal} 표준 프로토콜 완성</h3>
            <p style="color: var(--text-secondary); font-size: 1.05rem;">
                신체 스펙 (나이 ${rawInput.age}세, BMI ${rawInput.bmi}) 및 <strong>${rawInput.level}</strong> 수준을 모두 반영한 주 ${rawInput.frequency}회 (${rawInput.duration}분) 맞춤형 구성입니다.
            </p>
        </div>`;

        data.routines.forEach((day, index) => {
            html += `
            <div class="day-card" style="animation-delay: ${index * 0.1}s">
                <div class="day-header">
                    ${day.day} 
                    <span style="font-size: 0.9rem; color: #a1a1aa; font-weight: 400; margin-left: auto; background: rgba(255,255,255,0.05); padding: 0.2rem 0.6rem; border-radius: 4px;">${day.count}</span>
                </div>
                <div class="exercise-list">
                    ${day.exercises.map(ex => `
                        <div class="ex-card">
                            <div class="ex-info">
                                <div class="ex-name">${ex.name}</div>
                                <div class="ex-tag">${ex.tag}</div>
                            </div>
                            <div class="ex-meta">
                                <div class="meta-item"><span class="meta-label">Sets</span><span class="meta-value">${ex.sets}</span></div>
                                <div class="meta-item"><span class="meta-label">Reps</span><span class="meta-value">${ex.reps}</span></div>
                                <div class="meta-item"><span class="meta-label">Rest</span><span class="meta-value">${ex.rest}</span></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        });

        html += `
        <div class="nutrition-card" style="animation-delay: ${data.routines.length * 0.1 + 0.1}s; animation: slideUp 0.4s ease-out forwards; opacity: 0;">
            <div class="nutrition-title">
                📋 정밀 영양 가이드
            </div>
            <div class="nutrition-content">
                • <strong>칼로리 설정:</strong> 유지 칼로리 기준 <strong>${data.nutrition.surplus} kcal</strong> 잉여 섭취<br>
                • <strong>목표 단백질:</strong> 하루 약 <strong>${data.nutrition.protein}g</strong> 섭취 권장 (체중 × ${data.goal === '근비대'? '2.0~2.2':'1.8~2.2'}g)<br>
                • <strong>식단 포인트:</strong> ${data.nutrition.carbFocus}
            </div>
        </div>
        `;
        
        routineContent.innerHTML = html;

        // Add save button if user is logged in
        if(localStorage.getItem('mc_token')) {
            const saveBtn = document.createElement('button');
            saveBtn.id = 'save-routine-btn';
            saveBtn.className = 'save-routine-btn';
            saveBtn.textContent = '이 루틴 내 보관함에 저장하기';
            
            saveBtn.addEventListener('click', async () => {
                try {
                    const res = await fetch('http://localhost:3000/api/routines', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('mc_token')}`
                        },
                        body: JSON.stringify({ goal: currentGeneratedGoal, routine_data: currentGeneratedRoutine })
                    });
                    if(res.ok) {
                        alert('저장 완료! 내 루틴 보기에서 확인하세요.');
                        saveBtn.textContent = '저장됨 ✓';
                        saveBtn.disabled = true;
                    } else {
                        alert('저장에 실패했습니다.');
                    }
                } catch(e) {
                    alert('서버 연결 오류');
                }
            });
            routineContent.appendChild(saveBtn);
        }
    }
});
