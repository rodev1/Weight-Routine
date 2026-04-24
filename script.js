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

    // ============================================================
    // 운동 과학 기반 데이터베이스 (level: 0=초급, 1=중급, 2=고급)
    // maxAge: 이 나이 초과 시 비권장 / maxBMI: 이 BMI 초과 시 비권장
    // ============================================================
    const EXERCISE_DB = {
        push: [
            { name: "머신 체스트 프레스", tag: "가슴·고안정성·머신", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.7 },
            { name: "덤벨 벤치프레스", tag: "가슴·안정성 양호", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.75 },
            { name: "바벨 벤치프레스", tag: "가슴·다관절 복합", level: 1, maxAge: 99, maxBMI: 99, wRatio: 0.85 },
            { name: "인클라인 덤벨 프레스", tag: "윗가슴 집중", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.65 },
            { name: "인클라인 바벨 프레스", tag: "윗가슴·고강도", level: 2, maxAge: 60, maxBMI: 35, wRatio: 0.75 },
            { name: "케이블 크로스오버", tag: "가슴 고립·관절 보호", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.3 },
            { name: "머신 숄더 프레스", tag: "어깨·고안정성", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.45 },
            { name: "덤벨 숄더 프레스", tag: "어깨·안정성", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.4 },
            { name: "바벨 오버헤드 프레스", tag: "전삼각·복합", level: 1, maxAge: 50, maxBMI: 35, wRatio: 0.5 },
            { name: "사이드 레터럴 레이즈", tag: "측면 삼각근", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.12 },
            { name: "케이블 사이드 레이즈", tag: "측면 삼각근·일정 긴장", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.12 },
            { name: "케이블 푸시다운", tag: "삼두 고립", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.3 },
            { name: "오버헤드 덤벨 익스텐션", tag: "삼두 장두 집중", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.15 },
            { name: "트라이셉스 딥스", tag: "삼두 체중 복합", level: 1, maxAge: 55, maxBMI: 28, wRatio: 0, bodyweight: true }
        ],
        pull: [
            { name: "랫풀다운", tag: "광배·입문자 친화적", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.7 },
            { name: "케이블 시티드 로우", tag: "등 두께·관절 친화적", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.75 },
            { name: "덤벨 원암 로우", tag: "광배·단측 집중", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.35 },
            { name: "바벨 벤트오버 로우", tag: "등 두께·복합", level: 1, maxAge: 55, maxBMI: 35, wRatio: 0.9 },
            { name: "풀업", tag: "광배·체중 복합", level: 1, maxAge: 99, maxBMI: 26, wRatio: 0, bodyweight: true },
            { name: "가중 풀업", tag: "광배·고강도", level: 2, maxAge: 50, maxBMI: 24, wRatio: 0.2 },
            { name: "T바 로우", tag: "등 중간·복합", level: 1, maxAge: 55, maxBMI: 35, wRatio: 0.8 },
            { name: "페이스 풀", tag: "후면 삼각근·회전근개 보호", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.25 },
            { name: "덤벨 컬", tag: "이두 고립", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.15 },
            { name: "바벨 컬", tag: "이두 복합", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.25 },
            { name: "해머 컬", tag: "이두·완요골근 복합", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.18 }
        ],
        legs: [
            { name: "레그 프레스", tag: "대퇴·고안정성·머신", level: 0, maxAge: 99, maxBMI: 99, wRatio: 1.8 },
            { name: "핵 스쿼트 머신", tag: "대퇴·허리 부담 최소", level: 0, maxAge: 99, maxBMI: 40, wRatio: 1.3 },
            { name: "고블릿 스쿼트", tag: "하체·자세 학습", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.35 },
            { name: "바벨 백스쿼트", tag: "하체 대표 복합", level: 1, maxAge: 55, maxBMI: 32, wRatio: 1.5 },
            { name: "바벨 프론트스쿼트", tag: "대퇴·코어 집중", level: 2, maxAge: 50, maxBMI: 30, wRatio: 1.2 },
            { name: "불가리안 스플릿 스쿼트", tag: "단관절·균형·밸런스", level: 1, maxAge: 55, maxBMI: 30, wRatio: 0.3 },
            { name: "트랩바 데드리프트", tag: "전신·허리 친화적", level: 1, maxAge: 65, maxBMI: 35, wRatio: 1.4 },
            { name: "루마니안 데드리프트", tag: "햄스트링·허리 부담↓", level: 0, maxAge: 99, maxBMI: 38, wRatio: 1.0 },
            { name: "컨벤셔널 데드리프트", tag: "전신 복합·고강도", level: 2, maxAge: 50, maxBMI: 30, wRatio: 1.5 },
            { name: "레그 익스텐션", tag: "대퇴사두 고립", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.4 },
            { name: "레그 컬", tag: "햄스트링 고립", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.35 },
            { name: "스탠딩 카프 레이즈", tag: "종아리", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.9 }
        ],
        core: [
            { name: "플랭크", tag: "코어 안정화·허리 보호", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0, bodyweight: true },
            { name: "데드버그", tag: "코어 심부·허리 보호", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0, bodyweight: true },
            { name: "케이블 크런치", tag: "복직근·저충격", level: 0, maxAge: 99, maxBMI: 99, wRatio: 0.35 },
            { name: "행잉 레그레이즈", tag: "하복부 집중", level: 1, maxAge: 60, maxBMI: 28, wRatio: 0, bodyweight: true },
            { name: "Ab 휠 롤아웃", tag: "코어 전체·고강도", level: 2, maxAge: 55, maxBMI: 26, wRatio: 0, bodyweight: true }
        ]
    };

    function generateClaudeStyleRoutine(data) {
        // ── 1. 사용자 프로파일 숫자화 ──────────────────────────
        const lvlNum = data.level === '초급' ? 0 : data.level === '중급' ? 1 : 2;

        // ── 2. 운동 필터링 함수 ────────────────────────────────
        // 나이, BMI, 구력 3가지 조건을 AND로 교차 적용
        function filter(pool) {
            return pool.filter(ex =>
                ex.level <= lvlNum &&
                data.age <= ex.maxAge &&
                data.bmi <= ex.maxBMI
            );
        }

        const avail = {
            push: filter(EXERCISE_DB.push),
            pull:  filter(EXERCISE_DB.pull),
            legs:  filter(EXERCISE_DB.legs),
            core:  filter(EXERCISE_DB.core)
        };

        // ── 3. 운동 시간에 따른 하루 종목 수 결정 ──────────────
        // 1세트 소요 시간(휴식 포함) ≈ 2~3분 기준
        const exCount = data.duration === 40 ? 3 : data.duration === 60 ? 4 : 5;

        // ── 4. 주당 빈도별 분할 구성 ───────────────────────────
        function pick(pool, n) {
            return pool.slice(0, Math.min(n, pool.length));
        }

        let template = [];
        if (data.frequency === 3) {
            // PPL 3분할 (Push / Pull / Legs)
            template = [
                { day: "Day 1 — 밀기 (가슴 / 어깨 / 삼두)", exercises: pick(avail.push, exCount) },
                { day: "Day 2 — 당기기 (등 / 이두)", exercises: pick(avail.pull, exCount) },
                { day: "Day 3 — 하체 + 코어", exercises: [...pick(avail.legs, exCount - 1), pick(avail.core, 1)[0]].filter(Boolean) }
            ];
        } else if (data.frequency === 4) {
            // 상하체 4분할 (Upper / Lower / Upper / Lower)
            const half = Math.ceil(exCount / 2);
            template = [
                { day: "Day 1 — 상체 (밀기 중심)", exercises: [...pick(avail.push, half + 1), ...pick(avail.pull, half - 1)] },
                { day: "Day 2 — 하체 + 코어", exercises: [...pick(avail.legs, exCount - 1), pick(avail.core, 1)[0]].filter(Boolean) },
                { day: "Day 3 — 상체 (당기기 중심)", exercises: [...pick(avail.pull, half + 1), ...pick(avail.push.slice(half + 1), half - 1)] },
                { day: "Day 4 — 하체 집중", exercises: pick(avail.legs, exCount) }
            ];
        } else if (data.frequency === 5) {
            // 5분할 (가슴 / 등 / 하체 / 어깨 / 팔+코어)
            const chestPush = avail.push.filter(e => e.tag.includes('가슴'));
            const shoulder  = avail.push.filter(e => e.tag.includes('어깨') || e.tag.includes('삼각'));
            const tricep    = avail.push.filter(e => e.tag.includes('삼두'));
            const bicep     = avail.pull.filter(e => e.tag.includes('이두'));
            const backPull  = avail.pull.filter(e => !e.tag.includes('이두'));
            template = [
                { day: "Day 1 — 가슴 집중", exercises: pick(chestPush.length >= exCount ? chestPush : avail.push, exCount) },
                { day: "Day 2 — 등 집중", exercises: pick(backPull.length >= exCount ? backPull : avail.pull, exCount) },
                { day: "Day 3 — 하체", exercises: pick(avail.legs, exCount) },
                { day: "Day 4 — 어깨 집중", exercises: pick(shoulder.length >= exCount ? shoulder : avail.push, exCount) },
                { day: "Day 5 — 팔 + 코어", exercises: [...pick(tricep, 2), ...pick(bicep, 2), ...pick(avail.core, exCount - 4)].filter(Boolean) }
            ];
        }

        // ── 5. 세트 / 반복 / 휴식 프로토콜 결정 ──────────────
        //  (ACSM·NSCA 가이드라인 기반)
        let sets, reps, rest;
        if (data.goal === '스트렝스') {
            sets = 5; reps = '3~5회'; rest = '180~240초';
        } else if (data.goal === '다이어트') {
            sets = 3; reps = '12~15회'; rest = '45~60초';
        } else { // 근비대
            sets = 4; reps = '8~12회'; rest = '60~90초';
        }

        // 나이 45+ → 회복 고려: 세트 -1, 휴식 +30초
        if (data.age >= 45) {
            sets = Math.max(sets - 1, 2);
            rest = rest.replace(/(\d+)/g, n => String(parseInt(n) + 30));
        }
        // 구력 초급 → 신경적응 단계: 세트 3으로 고정, 여유 있는 휴식
        if (data.level === '초급') {
            sets = Math.min(sets, 3);
            rest = '90~120초';
        }
        // 운동 시간 40분 → 세트 수 감축
        if (data.duration === 40) sets = Math.max(sets - 1, 2);

        // ── 6. 각 운동에 프로토콜 + 추천 중량 적용 ────────────
        const adjusted = JSON.parse(JSON.stringify(template));
        adjusted.forEach(day => {
            day.count = day.exercises.length + '종목';
            day.exercises.forEach(ex => {
                ex.sets = sets + '세트';
                ex.reps = reps;
                ex.rest = rest;
                // 추천 중량
                if (ex.bodyweight || ex.wRatio === 0) {
                    ex.targetWeight = '맨몸';
                } else {
                    const lvlMult = data.level === '초급' ? 0.5 : data.level === '중급' ? 0.8 : 1.1;
                    const goalMult = data.goal === '스트렝스' ? 1.15 : data.goal === '다이어트' ? 0.85 : 1.0;
                    const raw = data.weight * ex.wRatio * lvlMult * goalMult;
                    const kg = Math.round(raw / 2.5) * 2.5;
                    ex.targetWeight = `${kg}kg`;
                }
            });
        });

        // ── 7. 영양 가이드 계산 ────────────────────────────────
        const proteinPerKg = data.goal === '근비대' ? 2.0 : data.goal === '다이어트' ? 2.2 : 1.8;
        const protein = (data.weight * proteinPerKg).toFixed(0);
        const surplus = data.goal === '다이어트' ? '-300~500' : data.goal === '근비대' ? '+200~300' : '유지';
        const carbFocus = data.goal === '다이어트'
            ? '단백질 중심, 정제 탄수화물 제한'
            : '탄수화물 중심 (운동 전후 필수 섭취)';

        // ── 8. 프로파일 분석 메시지 생성 ──────────────────────
        let profileNotes = [];
        if (data.age >= 45) profileNotes.push('45세 이상 → 회복 시간 확보 우선, 세트 수 최적화');
        if (data.bmi >= 25) profileNotes.push(`BMI ${data.bmi} → 관절 부하 낮은 머신/덤벨 우선 배치`);
        if (data.bmi < 18.5) profileNotes.push('저체중 → 소모 최소화, 복합 운동 중심');
        if (data.level === '초급') profileNotes.push('초급 → 신경적응 단계: 동작 패턴 학습 중심, 머신/덤벨 우선');
        if (data.level === '고급') profileNotes.push('고급 → 바벨 복합 운동 최우선, 고볼륨 프로토콜 적용');

        return {
            routines: adjusted,
            nutrition: { surplus, protein, carbFocus },
            profileNotes
        };


    function renderRoutine(data, rawInput) {
        const notes = data.profileNotes || [];
        let html = `
        <div style="margin-bottom: 2.5rem;">
            <h3 style="color: var(--accent-color); font-size: 1.6rem; margin-bottom: 0.5rem; font-weight: 800;">🔥 ${rawInput.goal} 맞춤 루틴 완성</h3>
            <p style="color: var(--text-secondary); font-size: 1.05rem;">
                나이 <strong>${rawInput.age}세</strong> · BMI <strong>${rawInput.bmi}</strong> · <strong>${rawInput.level}</strong> 기준 &mdash; 주 ${rawInput.frequency}회 / 1회 ${rawInput.duration}분 최적화
            </p>
            ${notes.length > 0 ? `
            <div style="margin-top: 1rem; background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; padding: 1rem 1.2rem;">
                <p style="font-size: 0.85rem; font-weight: 700; color: #60a5fa; margin-bottom: 0.5rem;">📊 신체 프로파일 분석 결과</p>
                ${notes.map(n => `<p style="font-size: 0.9rem; color: #a1a1aa; margin: 0.2rem 0;">• ${n}</p>`).join('')}
            </div>` : ''}
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
