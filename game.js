let currentScreen = 'selection'; 
let currentMapOptions = [];      
let currentMapIndex = 0;         

// --- 新增：RPG 狀態變數 ---
let coins = 0;
let playerHP = 100;
let enemyHP = 100;
let playerATB = 0;
let enemyATB = 0;
let currentEnemyRarity = 1; // 用來決定敵人速度
let battleLoop = null;

// 更新所有 UI 顯示 (金幣、血量、行動條)
function updateUI() {
    document.getElementById('coin-display').innerText = coins;
    
    if (currentScreen === 'fight') {
        document.getElementById('player-hp-text').innerText = playerHP;
        document.getElementById('player-hp-bar').style.width = playerHP + '%';
        document.getElementById('player-atb-bar').style.width = playerATB + '%';

        document.getElementById('enemy-hp-text').innerText = enemyHP;
        document.getElementById('enemy-hp-bar').style.width = enemyHP + '%';
        document.getElementById('enemy-atb-bar').style.width = enemyATB + '%';
    }
}

// 打工賺錢
function earnCoins() {
    coins += 10;
    updateUI();
}

// 刷新機台 (不用錢，但要重新抓資料)
async function refreshMachine() {
    document.getElementById('single-map-display').innerHTML = '<h3 style="color: #aaa; font-size: 24px;">📡 正在下載官方圖片...</h3>';
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
    document.getElementById('single-map-display').innerHTML = `
        <div class="map-card">
            <img src="${data.image}" class="poke-sprite ${silhouette}">
            <div style="font-size: 28px; font-weight: bold;">地圖 ${currentMapIndex + 1}</div>
            <div style="font-size: 20px; color: #aaa; margin-top: 15px;">${data.name}</div>
        </div>
    `;
}

function changeMap(direction) {
    if(currentMapOptions.length === 0) return;
    currentMapIndex = (currentMapIndex + direction + 5) % 5;
    renderCarousel();
}

// ★ 確認進入地圖 (扣除金幣判定)
function confirmMapSelection() {
    if (coins < 30) {
        alert("金幣不足！請先點擊右上角「打工」賺取至少 30 金幣！");
        return;
    }
    coins -= 30; // 扣錢
    updateUI();
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
        card.innerHTML = `
            <img src="${p.image}" class="poke-sprite">
            <div style="font-size: 24px; font-weight: bold;">${p.name}</div>
            <div style="font-size: 18px; color: yellow; margin-top: 10px;">★${p.rarity}</div>
        `;
        screen.appendChild(card);
    });
}

function backToMaps() {
    currentScreen = 'selection';
    document.getElementById('selection-page').classList.remove('hidden');
    document.getElementById('battle-page').classList.add('hidden');
}

// ★ 核心戰鬥機制
function startFighting(target) {
    currentScreen = 'fight';
    document.getElementById('battle-page').classList.add('hidden');
    document.getElementById('fighting-page').classList.remove('hidden');
    
    document.getElementById('enemy-title').innerText = "遭遇野生 " + target.name + "！";
    document.getElementById('enemy-name').innerText = target.name;
    document.getElementById('enemy-icon').src = target.image; 
    currentEnemyRarity = target.rarity; // 記住敵人星級，決定他的速度
    
    // 戰鬥狀態重置
    playerHP = 100; enemyHP = 100;
    playerATB = 0; enemyATB = 0;
    
    if(battleLoop) clearInterval(battleLoop);
    
    // 戰鬥計時器：每 0.05 秒跑一次 (速度感)
    battleLoop = setInterval(() => {
        if (currentScreen !== 'fight') return;

        // 1. 雙方行動條自動增加 (敵人星級越高，長越快)
        playerATB += 0.5; 
        enemyATB += (currentEnemyRarity * 0.4); // 5星敵人每次加 2.0，非常快！

        // 2. 玩家攻擊判定
        if (playerATB >= 100) {
            playerATB = 0;
            enemyHP -= 20; // 玩家每次攻擊扣敵人 20 血
            checkWinLose();
        }
        
        // 3. 敵人攻擊判定
        if (enemyATB >= 100) {
            enemyATB = 0;
            playerHP -= 25; // 敵人打比較痛！
            checkWinLose();
        }
        
        updateUI();
    }, 50);
}

// 判定勝負
function checkWinLose() {
    if (enemyHP <= 0) {
        enemyHP = 0;
        clearInterval(battleLoop);
        updateUI();
        setTimeout(() => { alert("勝利！成功收服寶可夢！"); backToMaps(); }, 100);
    } else if (playerHP <= 0) {
        playerHP = 0;
        clearInterval(battleLoop);
        updateUI();
        setTimeout(() => { alert("皮卡丘倒下了... 挑戰失敗，寶可夢逃跑了！"); backToMaps(); }, 100);
    }
}

// 鍵盤控制器 (連打加速)
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (currentScreen === 'selection') {
        if (key === 'arrowleft') changeMap(-1);
        if (key === 'arrowright') changeMap(1);
        if (key === 'enter') confirmMapSelection();
    } else if (currentScreen === 'triple') {
        if (key === 'escape') backToMaps();
    } else if (currentScreen === 'fight') {
        // ★ 玩家瘋狂連打 A 和 D 鍵，可以直接增加行動條！
        if (key === 'a' || key === 'd') {
            playerATB += 5; // 按一下加 5%，手速夠快就能一直揍敵人
        }
    }
});

// 初始化
refreshMachine();
updateUI();
