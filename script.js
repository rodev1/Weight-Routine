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
    const modalTitle = document.getElementById('modal-title');
    
    modalTitle.textContent = '가상 로그인';

    let currentGeneratedRoutine = null;
    let currentGeneratedGoal = null;

    // --- Authentication Logic ---
    function checkAuth() {
        const username = localStorage.getItem('mc_username');
        if (username) {
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
        localStorage.removeItem('mc_username');
        checkAuth();
        alert('로그아웃 되었습니다.');
        const saveBtn = document.getElementById('save-routine-btn');
        if(saveBtn) saveBtn.remove();
    });

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        if(!username) return alert('닉네임을 입력해주세요.');
        
        localStorage.setItem('mc_username', username);
        checkAuth();
        authModal.classList.add('hidden');
        usernameInput.value = '';
        alert('환영합니다!');
    });

    // --- My Routines ---
    btnMyRoutines.addEventListener('click', () => {
        routinesModal.classList.remove('hidden');
        const container = document.getElementById('saved-routines-container');
        
        const savedData = JSON.parse(localStorage.getItem('mc_routines') || '[]');
        
        if(savedData.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">저장된 루틴이 없습니다.</p>';
            return;
        }
        
        let html = '';
        savedData.reverse().forEach(item => {
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
        let baseExercises = {
            push: [
                {name: "바벨 벤치프레스", tag: "다관절·주동근", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                {name: "바벨 오버헤드 프레스", tag: "전삼각·복합", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                {name: "덤벨 숄더 프레스", tag: "안정성 요구", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                {name: "트라이셉스 딥스", tag: "삼두 복합", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                {name: "케이블 푸시다운", tag: "삼두 고립", sets: "3세트", reps: "8~12회", rest: "60~90초"}
            ],
            pull: [
                {name: "풀업 (가중)", tag: "광배·복합", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                {name: "바벨 로우", tag: "등 두께", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                {name: "바벨 데드리프트", tag: "전신 복합", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                {name: "바벨 컬", tag: "이두 복합", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                {name: "덤벨 컬", tag: "이두 고립", sets: "3세트", reps: "8~12회", rest: "60~90초"}
            ],
            legs: [
                {name: "바벨 백스쿼트", tag: "하체 복합", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                {name: "레그 프레스", tag: "머신·대퇴", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                {name: "레그 익스텐션", tag: "대퇴사두 고립", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                {name: "레그 컬", tag: "햄스트링 고립", sets: "3세트", reps: "8~12회", rest: "60~90초"}
            ],
            core: [
                {name: "케이블 크런치", tag: "복직근 고립", sets: "3세트", reps: "8~12회", rest: "60~90초"},
                {name: "플랭크", tag: "코어 안정화", sets: "3세트", reps: "8~12회", rest: "60~90초"}
            ]
        };

        let template = [];
        
        if (data.frequency === 3) {
            template = [
                { day: "Day 1 — 밀기 (가슴/어깨/삼두)", exercises: [...baseExercises.push] },
                { day: "Day 2 — 당기기 (등/이두)", exercises: [...baseExercises.pull] },
                { day: "Day 3 — 하체 + 코어", exercises: [...baseExercises.legs, ...baseExercises.core] }
            ];
        } else if (data.frequency === 4) {
            template = [
                { day: "Day 1 — 상체 (밀기 중심)", exercises: [baseExercises.push[0], baseExercises.push[1], baseExercises.pull[0], baseExercises.push[3], baseExercises.pull[3]] },
                { day: "Day 2 — 하체 + 코어", exercises: [...baseExercises.legs, ...baseExercises.core] },
                { day: "Day 3 — 상체 (당기기 중심)", exercises: [baseExercises.pull[1], baseExercises.pull[2], baseExercises.push[2], baseExercises.pull[4], baseExercises.push[4]] },
                { day: "Day 4 — 하체 집중", exercises: [...baseExercises.legs] }
            ];
        } else if (data.frequency === 5) {
            template = [
                { day: "Day 1 — 가슴 집중", exercises: [baseExercises.push[0], {name: "인클라인 벤치프레스", tag: "윗가슴", sets: "3세트", reps: "8~12회", rest: "60~90초"}, {name: "덤벨 플라이", tag: "가슴 고립", sets: "3세트", reps: "8~12회", rest: "60~90초"}, baseExercises.push[3]] },
                { day: "Day 2 — 등 집중", exercises: [baseExercises.pull[0], baseExercises.pull[1], baseExercises.pull[2], {name: "랫풀다운", tag: "광배 고립", sets: "3세트", reps: "8~12회", rest: "60~90초"}] },
                { day: "Day 3 — 하체", exercises: [...baseExercises.legs] },
                { day: "Day 4 — 어깨 집중", exercises: [baseExercises.push[1], baseExercises.push[2], {name: "사이드 레터럴 레이즈", tag: "측면 삼각근", sets: "3세트", reps: "8~12회", rest: "60~90초"}, {name: "페이스 풀", tag: "후면 삼각근", sets: "3세트", reps: "8~12회", rest: "60~90초"}] },
                { day: "Day 5 — 팔 + 코어", exercises: [baseExercises.push[4], baseExercises.pull[4], ...baseExercises.core] }
            ];
        }

        let adjusted = JSON.parse(JSON.stringify(template)); 
        adjusted.forEach(day => {
            day.count = day.exercises.length + "종목";
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
                // 추천 중량 계산
                ex.targetWeight = calculateWeight(ex.name, data.weight, data.level, data.goal);
            });
        });

        let proteinMultiplier = data.goal === "근비대" ? 2.0 : (data.goal === "다이어트" ? 2.2 : 1.8);
        let protein = (data.weight * proteinMultiplier).toFixed(0);
        let surplus = data.goal === "다이어트" ? "-300~500" : (data.goal === "근비대" ? "+200~300" : "유지");
        let carbFocus = data.goal === "다이어트" ? "단백질 중심, 정제 탄수화물 엄격히 제한" : "탄수화물 중심 (운동 전후 필수 섭취)";

        return { routines: adjusted, nutrition: { surplus, protein, carbFocus } };
    }

    function calculateWeight(name, bw, level, goal) {
        const n = name;
        // 맨몸 운동
        const bodyweight = ["플랭크", "크런치", "트라이셉스 딥스", "풀업"];
        if (bodyweight.some(k => n.includes(k))) return "맨몸";

        // 레벨 계수
        const lvl = level === "초급" ? 0.5 : level === "중급" ? 0.8 : 1.1;
        // 목표별 미세 보정 (스트렝스 ↑, 다이어트 ↓)
        const goalMult = goal === "스트렝스" ? 1.15 : goal === "다이어트" ? 0.85 : 1.0;

        let ratio;
        if (n.includes("백스쿼트") || n.includes("레그프레스") || n.includes("고블릿"))  ratio = 1.5;
        else if (n.includes("데드리프트") || n.includes("루마니안"))                       ratio = 1.4;
        else if (n.includes("레그 프레스"))                                                 ratio = 1.6;
        else if (n.includes("로우"))                                                        ratio = 0.9;
        else if (n.includes("벤치프레스") || n.includes("인클라인"))                        ratio = 0.85;
        else if (n.includes("오버헤드") || n.includes("숄더 프레스"))                       ratio = 0.5;
        else if (n.includes("랫풀다운") || n.includes("케이블 크런치") || n.includes("케이블 푸시다운") || n.includes("페이스 풀")) ratio = 0.35;
        else if (n.includes("레그 익스텐션") || n.includes("레그 컬"))                      ratio = 0.4;
        else if (n.includes("덤벨 플라이") || n.includes("사이드 레터럴") || n.includes("덤벨 컬")) ratio = 0.15;
        else if (n.includes("바벨 컬"))                                                     ratio = 0.25;
        else ratio = 0.3;

        const kg = Math.round((bw * lvl * ratio * goalMult) / 2.5) * 2.5; // 2.5kg 단위 반올림
        return `${kg}kg`;
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
                                <div class="meta-item"><span class="meta-label">추천 중량</span><span class="meta-value weight-highlight">${ex.targetWeight}</span></div>
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

        // Add save button if user is logged in (mock)
        if(localStorage.getItem('mc_username')) {
            const saveBtn = document.createElement('button');
            saveBtn.id = 'save-routine-btn';
            saveBtn.className = 'save-routine-btn';
            saveBtn.textContent = '이 루틴 로컬 기기에 저장하기';
            
            saveBtn.addEventListener('click', () => {
                const savedRoutines = JSON.parse(localStorage.getItem('mc_routines') || '[]');
                savedRoutines.push({
                    goal: currentGeneratedGoal,
                    routine_data: currentGeneratedRoutine,
                    created_at: new Date().toISOString()
                });
                localStorage.setItem('mc_routines', JSON.stringify(savedRoutines));
                alert('해당 기기에 루틴이 안전하게 보관되었습니다!');
                saveBtn.textContent = '저장됨 ✓';
                saveBtn.disabled = true;
            });
            routineContent.appendChild(saveBtn);
        }
    }
});
