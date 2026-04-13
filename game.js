/* ========================================== */
/* ======== 1. 初始化與變數定義 ======== */
/* ========================================== */
let state = GameStorage.load();
let coins = state.coins;
let myBackpack = state.backpack;
let myPartner = state.partner || { 
    id: 25, name: "皮卡丘", rarity: 3, 
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" 
};

// 戰鬥狀態變數
let currentScreen = 'selection', playerHP = 100, enemyHP = 100, playerATB = 0, enemyATB = 0;
let currentEnemy = null, battleLoop = null, isPaused = false, isExtraBattle = false;
let currentRotation = 0, isRouletteRunning = false, currentMapOptions = [], currentMapIndex = 0;

// 啟動機台
function init() {
    refreshMachine();
    updateAll();
}

function updateAll() {
    GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner, currentEnemy);
    GameStorage.save(coins, myBackpack, myPartner);
}

/* ========================================== */
/* ======== 2. 地圖探索系統 (5 張地圖) ======== */
/* ========================================== */
async function refreshMachine() {
    const display = document.getElementById('single-map-display');
    display.innerHTML = '📡 正在搜尋強大氣息...';
    currentMapOptions = [];
    
    for (let i = 0; i < 5; i++) {
        let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
        let resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
        let data = await resp.json();
        currentMapOptions.push({ 
            ...p, 
            image: data.sprites.other['official-artwork'].front_default 
        });
    }
    currentMapIndex = 0;
    GameUI.renderCarousel(currentMapIndex, currentMapOptions);
}

function changeMap(dir) {
    currentMapIndex = (currentMapIndex + dir + 5) % 5;
    GameUI.renderCarousel(currentMapIndex, currentMapOptions);
}

function confirmMapSelection() {
    if (coins < GAME_CONFIG.MAP_REFRESH_COST) return alert("金幣不足，請先打工！");
    coins -= GAME_CONFIG.MAP_REFRESH_COST;
    isExtraBattle = false; // 重置加賽狀態
    updateAll();
    showGuaranteedChoice();
}

/* ========================================== */
/* ======== 3. 保底機制 (3 選 1 免費領取) ======== */
/* ========================================== */
async function showGuaranteedChoice() {
    currentScreen = 'guaranteed';
    document.getElementById('selection-page').classList.add('hidden');
    document.getElementById('guaranteed-page').classList.remove('hidden');
    const container = document.getElementById('guaranteed-choices');
    container.innerHTML = "📡 正在產生獎勵名單...";
    
    let choices = [];
    for(let i=0; i<3; i++) {
        let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
        let resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
        let data = await resp.json();
        choices.push({ ...p, image: data.sprites.other['official-artwork'].front_default });
    }
    
    container.innerHTML = "";
    choices.forEach(p => {
        let div = document.createElement('div');
        div.className = `choice-card ${p.rarity >= 6 ? 'rarity-6' : ''}`;
        div.innerHTML = `
            <img src="${p.image}" class="poke-sprite"><br>
            <b>${p.name}</b><br>★${p.rarity}<br>
            <button onclick="buyPokemon(${JSON.stringify(p).replace(/"/g, '&quot;')}, ${GAME_CONFIG.GUARANTEED_PRINT_COST})" 
                    style="background:cyan; color:black; font-weight:bold; margin-top:10px;">免費領取</button>
        `;
        container.appendChild(div);
    });
}

function buyPokemon(p, cost) {
    if (coins < cost) return alert("金幣不足！");
    coins -= cost;
    
    const existing = myBackpack.find(item => item.id === p.id);
    if (existing) {
        let reward = p.rarity * 10;
        coins += reward;
        alert(`重複獲得！${p.name} 已轉化為 ${reward} 金幣。`);
    } else {
        myBackpack.push(p);
        alert(`收服成功！${p.name} 已加入背包。`);
    }
    
    updateAll();
    if (currentScreen === 'guaranteed') skipGuaranteed();
    if (currentScreen === 'roulette') finishCapture();
}

function skipGuaranteed() {
    document.getElementById('guaranteed-page').classList.add('hidden');
    startFighting(null);
}

/* ========================================== */
/* ======== 4. 垂直戰鬥系統 (ATB) ======== */
/* ========================================== */
async function startFighting(target) {
    currentScreen = 'fight';
    isPaused = false;
    document.getElementById('fighting-page').classList.remove('hidden');
    
    if(!target) {
        // 根據加賽狀態決定對手機率 (使用 config.js 的權重)
        let roll = Math.random();
        let chances = isExtraBattle ? GAME_CONFIG.EXTRA_RARITY_CHANCE : GAME_CONFIG.RARITY_CHANCE;
        let targetRarity = 3;
        
        if (roll < (chances[6] || 0)) targetRarity = 6;
        else if (roll < (chances[6] || 0) + (chances[5] || 0)) targetRarity = 5;
        else if (roll < (chances[6] || 0) + (chances[5] || 0) + (chances[4] || 0)) targetRarity = 4;

        let pool = machineInventory.filter(p => p.rarity === targetRarity);
        let p = pool[Math.floor(Math.random() * pool.length)];
        let resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
        let data = await resp.json();
        currentEnemy = { ...p, image: data.sprites.other['official-artwork'].front_default };
    }

    // 處理 6 星虹光
    const enemyCard = document.getElementById('enemy-card');
    if (currentEnemy.rarity >= 6) enemyCard.classList.add('rarity-6');
    else enemyCard.classList.remove('rarity-6');

    document.getElementById('enemy-icon').src = currentEnemy.image;
    document.getElementById('enemy-racer-img').src = currentEnemy.image;
    document.getElementById('enemy-name').innerText = currentEnemy.name;
    
    playerHP = GAME_CONFIG.PLAYER_MAX_HP;
    enemyHP = GAME_CONFIG.ENEMY_MAX_HP;
    playerATB = 0; enemyATB = 0;
    
    if(battleLoop) clearInterval(battleLoop);
    battleLoop = setInterval(() => {
        if (currentScreen !== 'fight' || isPaused) return;
        playerATB += 0.45; 
        enemyATB += (currentEnemy.rarity * 0.35); // 稀有度越高跑越快
        
        if (playerATB >= 92) triggerAttack('player');
        else if (enemyATB >= 92) triggerAttack('enemy');
        updateAll();
    }, 50);
}

function triggerAttack(attacker) {
    isPaused = true;
    if (attacker === 'player') {
        enemyHP -= 20;
        GameUI.showDamage('enemy-card', 20);
        GameUI.shake('enemy-card');
        document.getElementById('action-msg').innerText = `⚡ ${myPartner.name} 攻擊！`;
    } else {
        playerHP -= 25;
        GameUI.showDamage('player-card', 25);
        GameUI.shake('player-card');
        document.getElementById('action-msg').innerText = `💥 ${currentEnemy.name} 反擊！`;
    }
    updateAll();

    if (enemyHP <= 0 || playerHP <= 0) {
        clearInterval(battleLoop);
        setTimeout(() => { 
            if(enemyHP <= 0) startRoulette(); 
            else finishCapture(); 
        }, 1200);
    } else {
        setTimeout(() => {
            if (attacker === 'player') playerATB = 0; else enemyATB = 0;
            document.getElementById('action-msg').innerText = "瘋狂按 A D 鍵加速！！";
            isPaused = false;
        }, 1200);
    }
}

/* ========================================== */
/* ======== 5. 轉盤與收費系統 ======== */
/* ========================================== */
function startRoulette() {
    currentScreen = 'roulette';
    document.getElementById('fighting-page').classList.add('hidden');
    document.getElementById('roulette-page').classList.remove('hidden');
    document.getElementById('stop-btn').classList.remove('hidden');
    document.getElementById('roulette-result').classList.add('hidden');
    isRouletteRunning = false;
}

function spinWheel() {
    if(isRouletteRunning) return;
    isRouletteRunning = true;
    document.getElementById('stop-btn').classList.add('hidden');
    
    let extra = Math.floor(Math.random() * 360);
    currentRotation += (1800 + extra);
    document.getElementById('wheel').style.transform = `rotate(${currentRotation}deg)`;
    
    setTimeout(() => {
        let angle = currentRotation % 360;
        let ball;
        // 0-90:大師, 90-180:精靈, 180-270:超級, 270-360:高級
        if(angle < 90) ball = { name: "大師球", rate: 100, emoji: "🟣" };
        else if(angle < 180) ball = { name: "精靈球", rate: 10, emoji: "🔴" };
        else if(angle < 270) ball = { name: "超級球", rate: 30, emoji: "🔵" };
        else ball = { name: "高級球", rate: 50, emoji: "🟡" };
        
        const resultDiv = document.getElementById('roulette-result');
        const ballIcon = document.getElementById('result-ball');
        
        resultDiv.classList.remove('hidden');
        ballIcon.innerText = ball.emoji;
        document.getElementById('result-msg').innerText = `丟出了 ${ball.name}！`;
        
        // 啟動搖晃特效
        ballIcon.classList.add('catch-shake');

        setTimeout(() => {
            ballIcon.classList.remove('catch-shake');
            let success = (Math.random() * 100) <= ball.rate;
            if(success) {
                document.getElementById('result-msg').innerText = "捕獲成功！";
                document.getElementById('pay-confirm-box').classList.remove('hidden');
                
                // 根據是否為加賽決定收費
                let cost = isExtraBattle ? GAME_CONFIG.EXTRA_CATCH_COST : GAME_CONFIG.NORMAL_CATCH_COST;
                document.getElementById('pay-ask-text').innerText = `捕獲成功！是否支付 ${cost} 金幣印製卡片？`;
                document.getElementById('confirm-pay-btn').onclick = () => buyPokemon(currentEnemy, cost);
            } else {
                document.getElementById('result-msg').innerText = "掙脫逃跑了...";
                document.getElementById('fail-exit-btn').classList.remove('hidden');
            }
        }, 1600);
    }, 3500);
}

/* ========================================== */
/* ======== 6. 加賽邏輯與結束流程 ======== */
/* ========================================== */
function finishCapture() {
    document.getElementById('roulette-page').classList.add('hidden');
    document.getElementById('pay-confirm-box').classList.add('hidden');
    document.getElementById('fail-exit-btn').classList.add('hidden');
    
    // 檢查是否觸發加賽 (僅限非加賽場結束時)
    if(!isExtraBattle && Math.random() < GAME_CONFIG.EXTRA_BATTLE_TRIGGER_RATE) {
        document.getElementById('extra-battle-pop').classList.remove('hidden');
    } else {
        backToMaps();
    }
}

function startExtraBattle() {
    document.getElementById('extra-battle-pop').classList.add('hidden');
    isExtraBattle = true;
    startFighting(null); // 直接進入隨機戰鬥
}

function hideExtraPop() {
    backToMaps();
}

function backToMaps() {
    location.reload(); // 最乾淨的街機重置方式
}

/* ========================================== */
/* ======== 7. 背包系統與按鍵監聽 ======== */
/* ========================================== */
function openBackpack() {
    document.getElementById('backpack-page').classList.remove('hidden');
    renderBackpack();
}

function closeBackpack() {
    document.getElementById('backpack-page').classList.add('hidden');
}

function renderBackpack() {
    const grid = document.getElementById('backpack-grid');
    grid.innerHTML = "";
    myBackpack.forEach(p => {
        let isP = (myPartner.id === p.id);
        const div = document.createElement('div');
        div.className = `backpack-item ${p.rarity >= 6 ? 'rarity-6' : ''}`;
        div.innerHTML = `
            ${isP ? '<div class="partner-tag">出戰中</div>' : ''}
            <img src="${p.image}" style="width:70px"><br>
            <b>${p.name}</b><br>★${p.rarity}<br>
            <button onclick="setPartner(${p.id})" ${isP ? 'disabled' : ''}>${isP ? '選擇' : '出戰'}</button>
        `;
        grid.appendChild(div);
    });
}

function setPartner(id) {
    const selected = myBackpack.find(p => p.id === id);
    if(selected) {
        myPartner = selected;
        updateAll();
        renderBackpack();
    }
}

// 鍵盤 A / D 連打加速
window.addEventListener('keydown', (e) => {
    if (currentScreen === 'fight' && !isPaused) {
        if (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'd') {
            playerATB += 4;
            updateAll();
        }
    }
});

// 啟動程式
init();
