/* ========================================== */
/* ======== 1. 核心設定與存檔管家 ======== */
/* ========================================== */
let coins = parseInt(localStorage.getItem('gaoleCoins')) || 100;
let myBackpack = JSON.parse(localStorage.getItem('gaoleBackpack')) || [];
let myPartner = JSON.parse(localStorage.getItem('gaolePartner')) || { 
    id: 25, name: "皮卡丘", rarity: 2, 
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" 
};

let currentScreen = 'selection', playerHP = 100, enemyHP = 100, playerATB = 0, enemyATB = 0;
let currentEnemy = null, battleLoop = null, isPaused = false, isExtraBattle = false;
let currentRotation = 0, isRouletteRunning = false;

function saveGame() {
    localStorage.setItem('gaoleCoins', coins);
    localStorage.setItem('gaoleBackpack', JSON.stringify(myBackpack));
    localStorage.setItem('gaolePartner', JSON.stringify(myPartner));
}

function updateUI() {
    document.getElementById('coin-display').innerText = coins;
    // 更新血量數值 (總監要求的 250/250 風格)
    document.getElementById('player-hp-text').innerText = `${Math.ceil(playerHP)} / 100`;
    document.getElementById('enemy-hp-text').innerText = `${Math.ceil(enemyHP)} / 100`;
    document.getElementById('player-hp-bar-real').style.width = playerHP + '%';
    document.getElementById('enemy-hp-bar').style.width = enemyHP + '%';
    document.getElementById('player-icon').src = myPartner.image;
    document.getElementById('player-name').innerText = myPartner.name;
    document.getElementById('player-racer').style.left = playerATB + '%';
    document.getElementById('enemy-racer').style.left = enemyATB + '%';
}

function earnCoins() { coins += 10; saveGame(); updateUI(); }

/* ========================================== */
/* ======== 2. 街機流程：投幣與保底 ======== */
/* ========================================== */
function confirmMapSelection() {
    if (coins < 30) return alert("金幣不足，請先打工！");
    coins -= 30; saveGame(); updateUI();
    showGuaranteedChoice();
}

async function showGuaranteedChoice() {
    currentScreen = 'guaranteed';
    document.getElementById('selection-page').classList.add('hidden');
    document.getElementById('guaranteed-page').classList.remove('hidden');
    const container = document.getElementById('guaranteed-choices');
    container.innerHTML = "<h2 style='color:#888'>📡 掃描強大氣息中...</h2>";
    
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
            <img src="${p.image}" style="width:100px"><br>
            <div style="font-weight:bold">${p.name}</div>
            <div style="color:yellow">★${p.rarity}</div>
            <button onclick="buyPokemon(${JSON.stringify(p).replace(/"/g, '&quot;')}, 20)" style="background:gold; color:black; font-size:14px; margin-top:10px;">20金幣購買</button>
        `;
        container.appendChild(div);
    });
}

function buyPokemon(p, cost) {
    if (coins < cost) return alert("金幣不足！");
    coins -= cost;
    // 檢查是否重複
    if (myBackpack.find(item => item.id === p.id)) {
        let reward = p.rarity * 10;
        coins += reward;
        alert(`已擁有 ${p.name}，轉化為 ${reward} 金幣獎勵！`);
    } else {
        myBackpack.push(p);
        alert(`成功獲得 ${p.name}！已存入背包。`);
    }
    saveGame(); updateUI();
    
    // 如果是保底環節買完，就進入戰鬥
    if (currentScreen === 'guaranteed') skipGuaranteed();
    // 如果是轉盤後買完，就結束
    if (currentScreen === 'roulette') finishCapture();
}

function skipGuaranteed() {
    document.getElementById('guaranteed-page').classList.add('hidden');
    startFighting(null);
}

/* ========================================== */
/* ======== 3. 戰鬥系統 (垂直布局與 6 星) ======== */
/* ========================================== */
async function startFighting(target) {
    currentScreen = 'fight'; isPaused = false;
    document.getElementById('fighting-page').classList.remove('hidden');
    
    if(!target) {
        // 隨機出現對手 (加賽時 6 星機率提升)
        let roll = Math.random();
        let targetRarity = isExtraBattle ? (roll < 0.15 ? 6 : (roll < 0.6 ? 5 : 4)) : (roll < 0.02 ? 6 : (roll < 0.1 ? 5 : (roll < 0.4 ? 4 : 3)));
        let pool = machineInventory.filter(p => p.rarity === targetRarity);
        let p = pool[Math.floor(Math.random() * pool.length)];
        let resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
        let data = await resp.json();
        currentEnemy = { ...p, image: data.sprites.other['official-artwork'].front_default };
    }

    const enemyCard = document.getElementById('enemy-card');
    if (currentEnemy.rarity >= 6) enemyCard.classList.add('rarity-6');
    else enemyCard.classList.remove('rarity-6');

    document.getElementById('enemy-icon').src = currentEnemy.image;
    document.getElementById('enemy-racer-img').src = currentEnemy.image;
    document.getElementById('enemy-name').innerText = currentEnemy.name;
    document.getElementById('player-racer-img').src = myPartner.image;
    
    playerHP = 100; enemyHP = 100; playerATB = 0; enemyATB = 0;
    if(battleLoop) clearInterval(battleLoop);
    battleLoop = setInterval(() => {
        if (currentScreen !== 'fight' || isPaused) return;
        playerATB += 0.4; enemyATB += (currentEnemy.rarity * 0.35);
        if (playerATB >= 92) triggerAttack('player');
        else if (enemyATB >= 92) triggerAttack('enemy');
        updateUI();
    }, 50);
}

function triggerAttack(attacker) {
    isPaused = true;
    if (attacker === 'player') {
        enemyHP -= 20; showDamage('enemy-card', 20);
        document.getElementById('enemy-card').classList.add('shake');
        document.getElementById('action-msg').innerText = `⚡ ${myPartner.name} 使用攻擊！`;
    } else {
        playerHP -= 25; showDamage('player-card', 25);
        document.getElementById('player-card').classList.add('shake');
        document.getElementById('action-msg').innerText = `💥 ${currentEnemy.name} 發動重擊！`;
    }
    updateUI();

    if (enemyHP <= 0 || playerHP <= 0) {
        clearInterval(battleLoop);
        setTimeout(() => { if(enemyHP <= 0) startRoulette(); else finishCapture(); }, 1200);
    } else {
        setTimeout(() => {
            if (attacker === 'player') playerATB = 0; else enemyATB = 0;
            document.querySelectorAll('.combatant').forEach(c => c.classList.remove('shake'));
            document.getElementById('action-msg').innerText = "瘋狂按 A D 鍵加速！！";
            isPaused = false;
        }, 1200);
    }
}

function showDamage(id, amt) {
    let card = document.getElementById(id);
    let rect = card.getBoundingClientRect();
    let d = document.createElement('div');
    d.className = 'damage-popup'; d.innerText = `-${amt}`;
    d.style.left = rect.left + 80 + 'px'; d.style.top = rect.top + 80 + 'px';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 800);
}

/* ========================================== */
/* ======== 4. 轉盤與捕獲後收費 ======== */
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
    let extra = Math.floor(Math.random()*360);
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
        
        document.getElementById('roulette-result').classList.remove('hidden');
        document.getElementById('result-ball').innerText = ball.emoji;
        document.getElementById('result-msg').innerText = `丟出了 ${ball.name}！`;
        
        setTimeout(() => {
            let success = (Math.random()*100) <= ball.rate;
            if(success) {
                document.getElementById('result-msg').innerText = "捕獲成功！";
                document.getElementById('pay-confirm-box').classList.remove('hidden');
                let cost = isExtraBattle ? 30 : 20;
                document.getElementById('pay-ask-text').innerText = `成功捕獲！是否支付 ${cost} 金幣印製卡片？`;
                document.getElementById('confirm-pay-btn').onclick = () => buyPokemon(currentEnemy, cost);
            } else {
                document.getElementById('result-msg').innerText = "掙脫逃跑了...";
                document.getElementById('fail-exit-btn').classList.remove('hidden');
            }
        }, 1500);
    }, 3500);
}

/* ========================================== */
/* ======== 5. 系統功能：加賽與重置 ======== */
/* ========================================== */
function finishCapture() {
    document.getElementById('roulette-page').classList.add('hidden');
    if(!isExtraBattle && Math.random() < 0.6) {
        document.getElementById('extra-battle-pop').classList.remove('hidden');
    } else {
        backToMaps();
    }
}

function startExtraBattle() {
    document.getElementById('extra-battle-pop').classList.add('hidden');
    isExtraBattle = true;
    startFighting(null);
}

function backToMaps() { location.reload(); }

function openBackpack() { document.getElementById('backpack-page').classList.remove('hidden'); renderBackpack(); }
function closeBackpack() { document.getElementById('backpack-page').classList.add('hidden'); }
function renderBackpack() {
    const g = document.getElementById('backpack-grid'); g.innerHTML = "";
    myBackpack.forEach(p => {
        let isP = (myPartner.id === p.id);
        g.innerHTML += `
            <div class="backpack-item ${p.rarity >= 6 ? 'rarity-6' : ''}">
                ${isP ? '<div class="partner-tag">出戰中</div>' : ''}
                <img src="${p.image}" style="width:70px"><br>
                <b>${p.name}</b><br>★${p.rarity}<br>
                <button onclick="setPartner(${p.id})" ${isP ? 'disabled' : ''}>${isP ? '使用中' : '選擇'}</button>
            </div>`;
    });
}
function setPartner(id) { 
    myPartner = myBackpack.find(p => p.id === id); saveGame(); renderBackpack(); updateUI();
}

window.addEventListener('keydown', (e) => {
    if (currentScreen === 'fight' && !isPaused && (e.key === 'a' || e.key === 'd')) {
        playerATB += 4; updateUI();
    }
});

updateUI();
