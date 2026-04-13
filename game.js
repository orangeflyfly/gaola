/* --- 1. 核心設定與存檔 --- */
let coins = parseInt(localStorage.getItem('gaoleCoins')) || 100;
let myBackpack = JSON.parse(localStorage.getItem('gaoleBackpack')) || [];
let myPartner = JSON.parse(localStorage.getItem('gaolePartner')) || { id: 25, name: "皮卡丘", rarity: 2, image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" };
let currentScreen = 'selection', playerHP = 100, enemyHP = 100, playerATB = 0, enemyATB = 0;
let currentEnemy = null, battleLoop = null, isPaused = false, isExtraBattle = false;
let currentRotation = 0, isRouletteRunning = false, currentMapOptions = [], currentMapIndex = 0;

function saveGame() {
    localStorage.setItem('gaoleCoins', coins);
    localStorage.setItem('gaoleBackpack', JSON.stringify(myBackpack));
    localStorage.setItem('gaolePartner', JSON.stringify(myPartner));
}

function updateUI() {
    document.getElementById('coin-display').innerText = coins;
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

/* --- 2. 地圖選擇與刷新 (補回消失的功能) --- */
async function refreshMachine() {
    document.getElementById('single-map-display').innerHTML = '📡 掃描中...';
    currentMapOptions = [];
    for (let i = 0; i < 5; i++) {
        let p = machineInventory[Math.floor(Math.random() * machineInventory.length)];
        let resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
        let data = await resp.json();
        currentMapOptions.push({ ...p, image: data.sprites.other['official-artwork'].front_default });
    }
    currentMapIndex = 0;
    renderCarousel();
}

function renderCarousel() {
    if(currentMapOptions.length === 0) return;
    const data = currentMapOptions[currentMapIndex];
    document.getElementById('single-map-display').innerHTML = `
        <div class="map-card ${data.rarity >= 6 ? 'rarity-6' : ''}">
            <img src="${data.image}" class="poke-sprite ${data.rarity >= 4 ? 'silhouette' : ''}">
            <div style="font-size: 20px; font-weight: bold; margin-top:10px;">地圖區域 ${currentMapIndex + 1}</div>
            <div style="color: #aaa;">${data.name} (★${data.rarity})</div>
        </div>`;
}

function changeMap(dir) { currentMapIndex = (currentMapIndex + dir + 5) % 5; renderCarousel(); }

function confirmMapSelection() {
    if (coins < 30) return alert("金幣不足！");
    coins -= 30; saveGame(); updateUI();
    showGuaranteedChoice();
}

/* --- 3. 保底機制 (改為免費 0 元) --- */
async function showGuaranteedChoice() {
    currentScreen = 'guaranteed';
    document.getElementById('selection-page').classList.add('hidden');
    document.getElementById('guaranteed-page').classList.remove('hidden');
    const container = document.getElementById('guaranteed-choices');
    container.innerHTML = "載入候選名單...";
    
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
            <b>${p.name}</b><br>★${p.rarity}<br>
            <button onclick="buyPokemon(${JSON.stringify(p).replace(/"/g, '&quot;')}, 0)" style="background:cyan; color:black; font-weight:bold; margin-top:10px;">免費領取</button>
        `;
        container.appendChild(div);
    });
}

function buyPokemon(p, cost) {
    if (coins < cost) return alert("金幣不足！");
    coins -= cost;
    if (myBackpack.find(item => item.id === p.id)) {
        let reward = p.rarity * 10; coins += reward;
        alert(`重複獲得！轉化為 ${reward} 金幣。`);
    } else {
        myBackpack.push(p);
        alert(`收服成功！${p.name} 已入包。`);
    }
    saveGame(); updateUI();
    if (currentScreen === 'guaranteed') skipGuaranteed();
    if (currentScreen === 'roulette') finishCapture();
}

function skipGuaranteed() {
    document.getElementById('guaranteed-page').classList.add('hidden');
    startFighting(null);
}

/* --- 4. 戰鬥系統 (包含傷害噴字) --- */
async function startFighting(target) {
    currentScreen = 'fight'; isPaused = false;
    document.getElementById('fighting-page').classList.remove('hidden');
    if(!target) {
        let roll = Math.random();
        let targetRarity = isExtraBattle ? (roll < 0.15 ? 6 : (roll < 0.5 ? 5 : 4)) : (roll < 0.05 ? 6 : (roll < 0.2 ? 5 : 4));
        let pool = machineInventory.filter(p => p.rarity === targetRarity);
        let p = pool[Math.floor(Math.random() * pool.length)];
        let resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
        let data = await resp.json();
        currentEnemy = { ...p, image: data.sprites.other['official-artwork'].front_default };
    }
    const enemyCard = document.getElementById('enemy-card');
    if (currentEnemy.rarity >= 6) enemyCard.classList.add('rarity-6'); else enemyCard.classList.remove('rarity-6');
    document.getElementById('enemy-icon').src = currentEnemy.image;
    document.getElementById('enemy-racer-img').src = currentEnemy.image;
    document.getElementById('enemy-name').innerText = currentEnemy.name;
    document.getElementById('player-racer-img').src = myPartner.image;
    playerHP = 100; enemyHP = 100; playerATB = 0; enemyATB = 0;
    if(battleLoop) clearInterval(battleLoop);
    battleLoop = setInterval(() => {
        if (currentScreen !== 'fight' || isPaused) return;
        playerATB += 0.45; enemyATB += (currentEnemy.rarity * 0.35);
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
    } else {
        playerHP -= 25; showDamage('player-card', 25);
        document.getElementById('player-card').classList.add('shake');
    }
    updateUI();
    if (enemyHP <= 0 || playerHP <= 0) {
        clearInterval(battleLoop);
        setTimeout(() => { if(enemyHP <= 0) startRoulette(); else finishCapture(); }, 1200);
    } else {
        setTimeout(() => {
            if (attacker === 'player') playerATB = 0; else enemyATB = 0;
            document.querySelectorAll('.combatant').forEach(c => c.classList.remove('shake'));
            isPaused = false;
        }, 1200);
    }
}

function showDamage(id, amt) {
    let card = document.getElementById(id); let rect = card.getBoundingClientRect();
    let d = document.createElement('div'); d.className = 'damage-popup'; d.innerText = `-${amt}`;
    d.style.left = rect.left + 80 + 'px'; d.style.top = rect.top + 80 + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 800);
}

/* --- 5. 轉盤與收費 (補回搖晃特效) --- */
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
        if(angle < 90) ball = { name: "大師球", rate: 100, emoji: "🟣" };
        else if(angle < 180) ball = { name: "精靈球", rate: 10, emoji: "🔴" };
        else if(angle < 270) ball = { name: "超級球", rate: 30, emoji: "🔵" };
        else ball = { name: "高級球", rate: 50, emoji: "🟡" };
        
        document.getElementById('roulette-result').classList.remove('hidden');
        document.getElementById('result-ball').innerText = ball.emoji;
        document.getElementById('result-msg').innerText = `丟出了 ${ball.name}！`;
        
        // ★ 啟動搖晃特效 ★
        document.getElementById('result-ball').classList.add('catch-shake');

        setTimeout(() => {
            document.getElementById('result-ball').classList.remove('catch-shake');
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
        }, 1600); // 等搖晃動畫跑完
    }, 3500);
}

/* --- 6. 加賽與重置 --- */
function finishCapture() {
    document.getElementById('roulette-page').classList.add('hidden');
    if(!isExtraBattle && Math.random() < 0.6) {
        document.getElementById('extra-battle-pop').classList.remove('hidden');
    } else {
        backToMaps();
    }
}
function startExtraBattle() { document.getElementById('extra-battle-pop').classList.add('hidden'); isExtraBattle = true; startFighting(null); }
function hideExtraPop() { backToMaps(); }
function backToMaps() { location.reload(); }

/* --- 7. 背包與初始化 --- */
function openBackpack() { document.getElementById('backpack-page').classList.remove('hidden'); renderBackpack(); }
function closeBackpack() { document.getElementById('backpack-page').classList.add('hidden'); }
function renderBackpack() {
    const g = document.getElementById('backpack-grid'); g.innerHTML = "";
    myBackpack.forEach(p => {
        let isP = (myPartner.id === p.id);
        g.innerHTML += `<div class="backpack-item ${p.rarity >= 6 ? 'rarity-6' : ''}" style="border:1px solid #555; padding:10px;">
            <img src="${p.image}" style="width:60px"><br>${p.name}<br>★${p.rarity}
            <button onclick="setPartner(${p.id})" ${isP ? 'disabled' : ''}>${isP ? '出戰中' : '選擇'}</button>
        </div>`;
    });
}
function setPartner(id) { myPartner = myBackpack.find(p => p.id === id); saveGame(); renderBackpack(); updateUI(); }

window.addEventListener('keydown', (e) => {
    if (currentScreen === 'fight' && !isPaused && (e.key === 'a' || e.key === 'd')) { playerATB += 4; updateUI(); }
    if (currentScreen === 'selection' && e.key === 'Enter') confirmMapSelection();
});

refreshMachine();
updateUI();
