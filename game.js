/* ========================================== */
/* ======== 1. 初始化資料與存檔系統 ======== */
/* ========================================== */
let currentScreen = 'selection'; 
let currentMapOptions = [];      
let currentMapIndex = 0;         

// 讀取存檔：金幣、背包、出戰搭檔
let coins = parseInt(localStorage.getItem('gaoleCoins')) || 0;
let myBackpack = JSON.parse(localStorage.getItem('gaoleBackpack')) || [];
let myPartner = JSON.parse(localStorage.getItem('gaolePartner')) || { 
    id: 25, name: "皮卡丘", rarity: 2, 
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" 
};

let playerHP = 100, enemyHP = 100;
let playerATB = 0, enemyATB = 0;
let currentEnemy = null; 
let battleLoop = null;
let isPaused = false; 
let isRouletteRunning = false;
let currentRotation = 0;

function saveGame() {
    localStorage.setItem('gaoleCoins', coins);
    localStorage.setItem('gaoleBackpack', JSON.stringify(myBackpack));
    localStorage.setItem('gaolePartner', JSON.stringify(myPartner));
}

// 更新 UI (包含新的垂直血條 ID)
function updateUI() {
    document.getElementById('coin-display').innerText = coins;
    
    // 更新搭檔圖片與名字
    document.getElementById('player-icon').src = myPartner.image;
    document.getElementById('player-racer-img').src = myPartner.image;
    document.getElementById('player-name').innerText = myPartner.name;

    if (currentScreen === 'fight') {
        // 更新垂直布局中的血條
        document.getElementById('player-hp-bar-real').style.width = playerHP + '%';
        document.getElementById('enemy-hp-bar').style.width = enemyHP + '%';
        
        // 更新賽道圖標位置
        document.getElementById('player-racer').style.left = Math.min(playerATB, 92) + '%';
        document.getElementById('enemy-racer').style.left = Math.min(enemyATB, 92) + '%';
    }
}

function earnCoins() { coins += 10; saveGame(); updateUI(); }

/* ========================================== */
/* ======== 2. 打擊感模組：傷害噴字 ======== */
/* ========================================== */
function showDamage(targetId, amount) {
    const targetElement = document.getElementById(targetId);
    const rect = targetElement.getBoundingClientRect();
    
    const damageDiv = document.createElement('div');
    damageDiv.className = 'damage-popup';
    damageDiv.innerText = `-${amount}`;
    
    // 讓數字出現在卡片中央位置
    damageDiv.style.left = (rect.left + rect.width / 2 - 20) + 'px';
    damageDiv.style.top = (rect.top + rect.height / 2 - 20) + 'px';
    
    document.body.appendChild(damageDiv);
    
    // 動畫播完後移除
    setTimeout(() => damageDiv.remove(), 800);
}

/* ========================================== */
/* ======== 3. 戰鬥邏輯與攻擊判定 ======== */
/* ========================================== */
function triggerAttack(attacker) {
    isPaused = true; 
    const msgBox = document.getElementById('action-msg');

    if (attacker === 'player') {
        enemyHP -= 20;
        showDamage('enemy-card', 20); // 敵方受傷噴字
        msgBox.innerText = `⚡ ${myPartner.name} 發動攻擊！`;
        document.getElementById('enemy-card').classList.add('shake'); 
    } else {
        playerHP -= 25;
        showDamage('player-card', 25); // 我方受傷噴字
        msgBox.innerText = `💥 ${currentEnemy.name} 發動攻擊！`;
        document.getElementById('player-card').classList.add('shake'); 
    }
    updateUI();

    if (enemyHP <= 0 || playerHP <= 0) { checkWinLose(); return; }

    setTimeout(() => {
        if (attacker === 'player') playerATB = 0; else enemyATB = 0;
        document.getElementById('enemy-card').classList.remove('shake');
        document.getElementById('player-card').classList.remove('shake');
        msgBox.innerText = "瘋狂按 A D 鍵加速！！";
        isPaused = false; 
    }, 1500);
}

function checkWinLose() {
    setTimeout(() => {
        if (enemyHP <= 0) {
            enemyHP = 0; updateUI(); clearInterval(battleLoop);
            startRoulette(); // 打贏後進入圓形轉盤
        } else if (playerHP <= 0) {
            playerHP = 0; updateUI(); clearInterval(battleLoop);
            alert(`${myPartner.name} 倒下了... 逃跑了！`); backToMaps();
        }
    }, 500);
}

/* ========================================== */
/* ======== 4. 🎰 圓形大轉盤模組 ======== */
/* ========================================== */
function startRoulette() {
    currentScreen = 'roulette';
    document.getElementById('roulette-page').classList.remove('hidden');
    document.getElementById('roulette-target-name').innerText = `野生 ${currentEnemy.name} (★${currentEnemy.rarity})`;
    document.getElementById('stop-btn').classList.remove('hidden');
    document.getElementById('roulette-result').classList.add('hidden');
    isRouletteRunning = false;
}

function spinWheel() {
    if (isRouletteRunning) return;
    isRouletteRunning = true;
    
    document.getElementById('stop-btn').classList.add('hidden');
    
    // 隨機決定轉幾圈：至少 5 圈 (1800度) + 隨機角度
    const randomExtra = Math.floor(Math.random() * 360);
    currentRotation += (1800 + randomExtra);
    
    const wheel = document.getElementById('wheel');
    wheel.style.transform = `rotate(${currentRotation}deg)`;

    // 根據角度判定落在什麼球 (對應 CSS 的 conic-gradient)
    // 0-90: 大師, 90-180: 精靈, 180-270: 超級, 270-360: 高級
    const finalAngle = (currentRotation % 360);
    let ballResult;
    if (finalAngle >= 0 && finalAngle < 90) ballResult = { name: "大師球", emoji: "🟣", rate: 100 };
    else if (finalAngle >= 90 && finalAngle < 180) ballResult = { name: "精靈球", emoji: "🔴", rate: 10 };
    else if (finalAngle >= 180 && finalAngle < 270) ballResult = { name: "超級球", emoji: "🔵", rate: 30 };
    else ballResult = { name: "高級球", emoji: "🟡", rate: 50 };

    // 演出時間：等待旋轉動畫結束 (3.5秒)
    setTimeout(() => {
        showRouletteResult(ballResult);
    }, 3500);
}

function showRouletteResult(ball) {
    const resultBox = document.getElementById('roulette-result');
    const resultBall = document.getElementById('result-ball');
    const resultMsg = document.getElementById('result-msg');
    
    resultBox.classList.remove('hidden');
    resultBall.innerText = ball.emoji;
    resultBall.className = 'catch-shake'; // CSS 動畫：搖晃 3 下
    resultMsg.innerText = `丟出了 ${ball.name}！`;

    setTimeout(() => {
        resultBall.classList.remove('catch-shake');
        let randomNum = Math.random() * 100;
        
        if (randomNum <= ball.rate) {
            resultBall.className = 'catch-success';
            if (myBackpack.find(p => p.id === currentEnemy.id)) {
                let reward = currentEnemy.rarity * 15;
                coins += reward;
                resultMsg.innerHTML = `捕獲成功！<br>重複已轉化為 ${reward} 金幣！`;
            } else {
                myBackpack.push(currentEnemy);
                resultMsg.innerHTML = `捕獲成功！<br>${currentEnemy.name} 已加入背包！`;
            }
            saveGame();
        } else {
            resultBall.className = 'catch-fail';
            resultMsg.innerHTML = `啊！<br>${currentEnemy.name} 掙脫逃跑了...`;
        }
    }, 1500);
}

function finishCapture() {
    document.getElementById('roulette-page').classList.add('hidden');
    backToMaps();
    updateUI();
}

/* ========================================== */
/* ======== 5. 地圖、背包與系統流程 ======== */
/* ========================================== */
async function refreshMachine() {
    document.getElementById('single-map-display').innerHTML = '📡 載入中...';
    currentMapOptions = [];
    for (let i = 0; i < 5; i++) {
        let randomPoke = machineInventory[Math.floor(Math.random() * machineInventory.length)];
        try {
            let resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomPoke.id}`);
            let data = await resp.json();
            currentMapOptions.push({
                id: randomPoke.id, name: randomPoke.name, rarity: randomPoke.rarity,
                image: data.sprites.other['official-artwork'].front_default
            });
        } catch (e) { console.log("API Error"); }
    }
    currentMapIndex = 0;
    renderCarousel();
}

function renderCarousel() {
    if(currentMapOptions.length === 0) return;
    const data = currentMapOptions[currentMapIndex];
    document.getElementById('single-map-display').innerHTML = `
        <div class="map-card">
            <img src="${data.image}" class="poke-sprite ${data.rarity >= 4 ? 'silhouette' : ''}">
            <div style="font-size: 24px; font-weight: bold;">地圖 ${currentMapIndex + 1}</div>
            <div style="font-size: 18px; color: #aaa;">${data.name}</div>
        </div>`;
}

function changeMap(dir) { currentMapIndex = (currentMapIndex + dir + 5) % 5; renderCarousel(); }

function confirmMapSelection() {
    if (coins < 30) { alert("金幣不足！"); return; }
    coins -= 30; saveGame(); updateUI();
    enterTripleChoice(currentMapOptions[currentMapIndex]);
}

function enterTripleChoice(boss) {
    currentScreen = 'triple';
    document.getElementById('selection-page').classList.add('hidden');
    document.getElementById('battle-page').classList.remove('hidden');
    let choices = [boss];
    while(choices.length < 3) {
        let r = currentMapOptions[Math.floor(Math.random() * currentMapOptions.length)];
        if(!choices.find(p => p.id === r.id)) choices.push(r);
    }
    const screen = document.getElementById('battle-select-screen');
    screen.innerHTML = "";
    choices.forEach(p => {
        const card = document.createElement('div');
        card.className = 'choice-card';
        card.onclick = () => startFighting(p);
        card.innerHTML = `<img src="${p.image}" class="poke-sprite"><div>${p.name}</div><div style="color:yellow;">★${p.rarity}</div>`;
        screen.appendChild(card);
    });
}

function startFighting(target) {
    currentScreen = 'fight';
    isPaused = false; currentEnemy = target;
    document.getElementById('battle-page').classList.add('hidden');
    document.getElementById('fighting-page').classList.remove('hidden');
    document.getElementById('enemy-icon').src = target.image;
    document.getElementById('enemy-racer-img').src = target.image;
    document.getElementById('enemy-name').innerText = target.name;
    playerHP = 100; enemyHP = 100; playerATB = 0; enemyATB = 0;
    updateUI();
    if(battleLoop) clearInterval(battleLoop);
    battleLoop = setInterval(() => {
        if (currentScreen !== 'fight' || isPaused) return;
        playerATB += 0.5; enemyATB += (currentEnemy.rarity * 0.4);
        if (playerATB >= 92) triggerAttack('player');
        else if (enemyATB >= 92) triggerAttack('enemy');
        updateUI();
    }, 50);
}

function backToMaps() {
    currentScreen = 'selection';
    document.getElementById('selection-page').classList.remove('hidden');
    document.getElementById('battle-page').classList.add('hidden');
    document.getElementById('fighting-page').classList.add('hidden');
}

function openBackpack() {
    document.getElementById('backpack-page').classList.remove('hidden');
    renderBackpack();
}
function closeBackpack() { document.getElementById('backpack-page').classList.add('hidden'); }

function renderBackpack() {
    document.getElementById('collection-count').innerText = myBackpack.length;
    const grid = document.getElementById('backpack-grid');
    grid.innerHTML = "";
    myBackpack.forEach(poke => {
        let isPartner = (myPartner.id === poke.id);
        grid.innerHTML += `
            <div class="backpack-item" style="border-color: ${isPartner ? '#ffeb3b' : '#555'}">
                ${isPartner ? '<div class="partner-tag">出戰中</div>' : ''}
                <img src="${poke.image}" style="width:80px">
                <div style="font-weight:bold">${poke.name}</div>
                <button onclick="setPartner(${poke.id})" ${isPartner ? 'disabled' : ''}>${isPartner ? '使用中' : '更換'}</button>
            </div>`;
    });
}

function setPartner(id) {
    let selected = myBackpack.find(p => p.id === id);
    if(selected) { myPartner = selected; saveGame(); renderBackpack(); updateUI(); }
}

// 鍵盤監聽
window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (currentScreen === 'selection') {
        if (k === 'arrowleft') changeMap(-1);
        if (k === 'arrowright') changeMap(1);
        if (k === 'enter') confirmMapSelection();
    } else if (currentScreen === 'fight' && !isPaused && (k === 'a' || k === 'd')) {
        playerATB += 4; updateUI();
    } else if (currentScreen === 'roulette' && e.code === 'Space') {
        spinWheel();
    }
});

refreshMachine();
updateUI();
