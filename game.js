let currentScreen = 'selection'; 
let currentMapOptions = [];      
let currentMapIndex = 0;         

// ★ 讀取存檔：金幣、背包、出戰搭檔 (如果沒有存檔就給預設值)
let coins = parseInt(localStorage.getItem('gaoleCoins')) || 0;
let myBackpack = JSON.parse(localStorage.getItem('gaoleBackpack')) || [];
let myPartner = JSON.parse(localStorage.getItem('gaolePartner')) || { 
    id: 25, name: "皮卡丘", rarity: 2, 
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" 
};

let playerHP = 100;
let enemyHP = 100;
let playerATB = 0;
let enemyATB = 0;
let currentEnemy = null; // 記住目前的敵人完整資料
let battleLoop = null;
let isPaused = false; 

// ★ 存檔函式
function saveGame() {
    localStorage.setItem('gaoleCoins', coins);
    localStorage.setItem('gaoleBackpack', JSON.stringify(myBackpack));
    localStorage.setItem('gaolePartner', JSON.stringify(myPartner));
}

// UI 更新 (修復 Bug 1：載入真實搭檔圖片)
function updateUI() {
    document.getElementById('coin-display').innerText = coins;
    
    if (currentScreen === 'fight') {
        document.getElementById('player-hp-text').innerText = playerHP;
        document.getElementById('player-hp-bar').style.width = playerHP + '%';
        document.getElementById('enemy-hp-text').innerText = enemyHP;
        document.getElementById('enemy-hp-bar').style.width = enemyHP + '%';

        document.getElementById('player-racer').style.left = Math.min(playerATB, 95) + '%';
        document.getElementById('enemy-racer').style.left = Math.min(enemyATB, 95) + '%';

        // 顯示目前搭檔
        document.getElementById('player-name').innerText = myPartner.name + " (我方)";
        document.getElementById('player-icon').src = myPartner.image;
        document.getElementById('player-racer-img').src = myPartner.image;
    }
}

function earnCoins() { coins += 10; saveGame(); updateUI(); }

async function refreshMachine() {
    document.getElementById('single-map-display').innerHTML = '<h3 style="color: #aaa;">📡 正在下載官方圖片...</h3>';
    currentMapOptions = [];
    for (let i = 0; i < 5; i++) {
        let randomPoke = machineInventory[Math.floor(Math.random() * machineInventory.length)];
        try {
            let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomPoke.id}`);
            let apiData = await response.json();
            currentMapOptions.push({
                id: randomPoke.id, name: randomPoke.name, rarity: randomPoke.rarity,
                image: apiData.sprites.other['official-artwork'].front_default
            });
        } catch (error) { console.log("連線失敗"); }
    }
    currentMapIndex = 0;
    renderCarousel();
}

function renderCarousel() {
    if(currentMapOptions.length === 0) return;
    const data = currentMapOptions[currentMapIndex];
    const silhouette = (data.rarity >= 4) ? "silhouette" : "";
    document.getElementById('single-map-display').innerHTML = `<div class="map-card"><img src="${data.image}" class="poke-sprite ${silhouette}"><div style="font-size: 28px; font-weight: bold;">地圖 ${currentMapIndex + 1}</div><div style="font-size: 20px; color: #aaa; margin-top: 15px;">${data.name}</div></div>`;
}

function changeMap(direction) {
    if(currentMapOptions.length === 0) return;
    currentMapIndex = (currentMapIndex + direction + 5) % 5;
    renderCarousel();
}

function confirmMapSelection() {
    if (coins < 30) { alert("金幣不足！請先打工！"); return; }
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
        card.innerHTML = `<img src="${p.image}" class="poke-sprite"><div style="font-size: 24px; font-weight: bold;">${p.name}</div><div style="font-size: 18px; color: yellow; margin-top: 10px;">★${p.rarity}</div>`;
        screen.appendChild(card);
    });
}

function backToMaps() {
    currentScreen = 'selection';
    document.getElementById('selection-page').classList.remove('hidden');
    document.getElementById('battle-page').classList.add('hidden');
}

function startFighting(target) {
    currentScreen = 'fight';
    isPaused = false;
    currentEnemy = target; // 記住目前的對手
    
    document.getElementById('battle-page').classList.add('hidden');
    document.getElementById('fighting-page').classList.remove('hidden');
    document.getElementById('enemy-title').innerText = "遭遇野生 " + currentEnemy.name + "！";
    document.getElementById('enemy-name').innerText = currentEnemy.name;
    document.getElementById('enemy-icon').src = currentEnemy.image; 
    document.getElementById('enemy-racer-img').src = currentEnemy.image; 
    
    playerHP = 100; enemyHP = 100; playerATB = 0; enemyATB = 0;
    document.getElementById('action-msg').innerText = "瘋狂交替按 A 與 D 鍵加速前進！！";
    updateUI(); // 先更新一次，確保皮卡丘圖片載入
    
    if(battleLoop) clearInterval(battleLoop);
    battleLoop = setInterval(() => {
        if (currentScreen !== 'fight' || isPaused) return;

        playerATB += 0.5; 
        enemyATB += (currentEnemy.rarity * 0.4); 

        if (playerATB >= 95) { playerATB = 95; triggerAttack('player'); } 
        else if (enemyATB >= 95) { enemyATB = 95; triggerAttack('enemy'); }
        updateUI();
    }, 50);
}

// ★ 修復 Bug 2：攻擊字眼帶入雙方真實名字
function triggerAttack(attacker) {
    isPaused = true; 
    const msgBox = document.getElementById('action-msg');

    if (attacker === 'player') {
        enemyHP -= 20;
        msgBox.innerText = `⚡ ${myPartner.name} 發動攻擊！${currentEnemy.name} 受到 20 點傷害！`;
        document.getElementById('enemy-card').classList.add('shake'); 
    } else {
        playerHP -= 25;
        msgBox.innerText = `💥 ${currentEnemy.name} 發動攻擊！${myPartner.name} 受到 25 點傷害！`;
        document.getElementById('player-card').classList.add('shake'); 
    }
    updateUI();

    if (enemyHP <= 0 || playerHP <= 0) { checkWinLose(); return; }

    setTimeout(() => {
        if (attacker === 'player') { playerATB = 0; document.getElementById('enemy-card').classList.remove('shake'); } 
        else { enemyATB = 0; document.getElementById('player-card').classList.remove('shake'); }
        msgBox.innerText = "瘋狂交替按 A 與 D 鍵加速前進！！";
        isPaused = false; 
    }, 2000);
}

function checkWinLose() {
    setTimeout(() => {
        if (enemyHP <= 0) {
            enemyHP = 0; 
            updateUI(); 
            clearInterval(battleLoop);
            
            // ★ 修改點：這裡不再直接給獎勵，而是呼叫我們剛寫好的「轉盤模組」
            // 轉盤模組會在玩家「拍擊停止」後，才決定是要給金幣、存背包，還是讓它逃跑。
            startRoulette(); 
            
        } else if (playerHP <= 0) {
            playerHP = 0; 
            updateUI(); 
            clearInterval(battleLoop);
            alert(`${myPartner.name} 倒下了... 挑戰失敗！`); 
            backToMaps();
        }
        
        // 清除震動動畫
        document.getElementById('enemy-card').classList.remove('shake');
        document.getElementById('player-card').classList.remove('shake');
    }, 500); 
}

// ★ 背包管理系統
function openBackpack() {
    document.getElementById('backpack-page').classList.remove('hidden');
    document.getElementById('collection-count').innerText = myBackpack.length;
    const grid = document.getElementById('backpack-grid');
    grid.innerHTML = "";
    
    if(myBackpack.length === 0) {
        grid.innerHTML = "<h3 style='color:#aaa;'>你的背包空空如也，趕快去抓寶可夢吧！</h3>";
        return;
    }

    myBackpack.forEach(poke => {
        let isPartner = (myPartner.id === poke.id) ? `<div class="partner-tag">出戰中</div>` : "";
        let btnHtml = (myPartner.id === poke.id) 
            ? `<button class="btn-small" style="background:#555;" disabled>已派上場</button>`
            : `<button class="btn-small" onclick="setPartner(${poke.id})">設為出戰</button>`;

        grid.innerHTML += `
            <div class="backpack-item">
                ${isPartner}
                <img src="${poke.image}" class="poke-sprite">
                <div style="font-size: 20px; font-weight: bold;">${poke.name}</div>
                <div style="color: yellow; margin-bottom: 5px;">★${poke.rarity}</div>
                ${btnHtml}
            </div>
        `;
    });
}

function closeBackpack() {
    document.getElementById('backpack-page').classList.add('hidden');
}

function setPartner(id) {
    let selected = myBackpack.find(p => p.id === id);
    if(selected) {
        myPartner = selected;
        saveGame();
        alert(`已將 ${myPartner.name} 設為出戰搭檔！`);
        openBackpack(); // 重新整理背包畫面
        updateUI(); // 更新大廳的數字等
    }
}

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (currentScreen === 'selection') {
        if (key === 'arrowleft') changeMap(-1);
        if (key === 'arrowright') changeMap(1);
        if (key === 'enter') confirmMapSelection();
    } else if (currentScreen === 'triple') {
        if (key === 'escape') backToMaps();
    } else if (currentScreen === 'fight') {
        if ((key === 'a' || key === 'd') && !isPaused) {
            playerATB += 4; updateUI();
        }
    }
});

refreshMachine();
updateUI();

// ========================================== //
// ======== 🎰 精靈球捕獲轉盤模組 ======== //
// ========================================== //
let rouletteInterval = null;
let currentBallIndex = 0;
let isRouletteRunning = false;

// 定義球的機率 (總監設定版)
const ballTypes = [
    { id: 0, name: "大師球", emoji: "🟣", rate: 100 },
    { id: 1, name: "高級球", emoji: "🟡", rate: 50 },
    { id: 2, name: "超級球", emoji: "🔵", rate: 30 },
    { id: 3, name: "精靈球", emoji: "🔴", rate: 10 }
];

function startRoulette() {
    document.getElementById('roulette-page').classList.remove('hidden');
    document.getElementById('roulette-target-name').innerText = `野生 ${currentEnemy.name} (★${currentEnemy.rarity})`;
    
    document.getElementById('roulette-wheels').classList.remove('hidden');
    document.getElementById('stop-btn').classList.remove('hidden');
    document.getElementById('roulette-result').classList.add('hidden');

    isRouletteRunning = true;
    currentBallIndex = 0;

    // 啟動跑馬燈，每 0.1 秒換一格
    if(rouletteInterval) clearInterval(rouletteInterval);
    rouletteInterval = setInterval(() => {
        for(let i=0; i<4; i++) document.getElementById(`ball-${i}`).classList.remove('active');
        currentBallIndex = (currentBallIndex + 1) % 4;
        document.getElementById(`ball-${currentBallIndex}`).classList.add('active');
    }, 100);
}

function stopRoulette() {
    if (!isRouletteRunning) return;
    isRouletteRunning = false;
    clearInterval(rouletteInterval);

    const selectedBall = ballTypes[currentBallIndex];
    document.getElementById('roulette-wheels').classList.add('hidden');
    document.getElementById('stop-btn').classList.add('hidden');
    
    const resultBox = document.getElementById('roulette-result');
    const resultBall = document.getElementById('result-ball');
    const resultMsg = document.getElementById('result-msg');
    
    resultBox.classList.remove('hidden');
    resultBall.innerText = selectedBall.emoji;
    resultBall.className = 'catch-shake'; // 啟動搖晃 3 下的動畫
    resultMsg.innerText = `丟出了 ${selectedBall.name}！搖晃中...`;
    resultMsg.style.color = "white";

    // 模擬搖晃等待時間 (1.5秒後開獎)
    setTimeout(() => {
        resultBall.classList.remove('catch-shake');
        let randomNum = Math.random() * 100; 
        
        // 如果敵人星等較低，機率會有一點保底加成
        let finalRate = selectedBall.rate;
        if(currentEnemy.rarity <= 3) finalRate += 20;

        if (randomNum <= finalRate) {
            // 🌟 捕獲成功
            resultBall.classList.add('catch-success');
            resultMsg.style.color = "#4caf50";
            
            let reward = currentEnemy.rarity * 15;
            if (myBackpack.find(p => p.id === currentEnemy.id)) {
                coins += reward;
                resultMsg.innerHTML = `成功！<br>已擁有 ${currentEnemy.name}，化為 ${reward} 金幣！`;
            } else {
                myBackpack.push(currentEnemy);
                resultMsg.innerHTML = `成功！<br>${currentEnemy.name} 已存入背包！`;
            }
            saveGame();
        } else {
            // ❌ 捕獲失敗
            resultBall.classList.add('catch-fail');
            resultMsg.style.color = "#f44336";
            resultMsg.innerHTML = `啊！<br>${currentEnemy.name} 掙脫逃跑了...`;
        }
    }, 1500);
}

// 支援按空白鍵拍擊停下轉盤
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isRouletteRunning) {
        e.preventDefault(); // 防止空白鍵讓網頁往下捲動
        stopRoulette();
    }
});

function finishCapture() {
    document.getElementById('roulette-page').classList.add('hidden');
    document.getElementById('result-ball').className = ''; // 重置動畫
    backToMaps();
    updateUI();
}
