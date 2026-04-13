let currentScreen = 'selection'; 
let currentMapOptions = [];      
let currentMapIndex = 0;         

let coins = 0;
let playerHP = 100;
let enemyHP = 100;
let playerATB = 0;
let enemyATB = 0;
let currentEnemyRarity = 1; 
let battleLoop = null;
let isPaused = false; // ★ 新增：控制畫面凍結的變數

function updateUI() {
    document.getElementById('coin-display').innerText = coins;
    
    if (currentScreen === 'fight') {
        document.getElementById('player-hp-text').innerText = playerHP;
        document.getElementById('player-hp-bar').style.width = playerHP + '%';
        
        document.getElementById('enemy-hp-text').innerText = enemyHP;
        document.getElementById('enemy-hp-bar').style.width = enemyHP + '%';

        // 更新賽道上圖標的位置 (最高 95%，預留終點線的寬度)
        document.getElementById('player-racer').style.left = Math.min(playerATB, 95) + '%';
        document.getElementById('enemy-racer').style.left = Math.min(enemyATB, 95) + '%';
    }
}

function earnCoins() { coins += 10; updateUI(); }

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

function confirmMapSelection() {
    if (coins < 30) { alert("金幣不足！請先打工！"); return; }
    coins -= 30; 
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
    document.getElementById('battle-page').classList.add('hidden');
    document.getElementById('fighting-page').classList.remove('hidden');
    
    document.getElementById('enemy-title').innerText = "遭遇野生 " + target.name + "！";
    document.getElementById('enemy-name').innerText = target.name;
    document.getElementById('enemy-icon').src = target.image; 
    document.getElementById('enemy-racer-img').src = target.image; // 賽道上的小圖
    currentEnemyRarity = target.rarity; 
    
    playerHP = 100; enemyHP = 100;
    playerATB = 0; enemyATB = 0;
    document.getElementById('action-msg').innerText = "瘋狂交替按 A 與 D 鍵加速前進！！";
    
    if(battleLoop) clearInterval(battleLoop);
    
    battleLoop = setInterval(() => {
        // ★ 如果畫面凍結中，賽跑暫停
        if (currentScreen !== 'fight' || isPaused) return;

        playerATB += 0.5; 
        enemyATB += (currentEnemyRarity * 0.4); 

        // 判定誰先到終點 (95% 就算摸到終點線)
        if (playerATB >= 95) {
            playerATB = 95;
            triggerAttack('player');
        } else if (enemyATB >= 95) {
            enemyATB = 95;
            triggerAttack('enemy');
        }
        
        updateUI();
    }, 50);
}

// ★ 核心結算邏輯：凍結、扣血、震動、單方歸零
function triggerAttack(attacker) {
    isPaused = true; // 暫停賽跑
    const msgBox = document.getElementById('action-msg');

    if (attacker === 'player') {
        enemyHP -= 20;
        msgBox.innerText = "⚡ 皮卡丘發動攻擊！敵人受到 20 點傷害！";
        document.getElementById('enemy-card').classList.add('shake'); // 敵人框震動
    } else {
        playerHP -= 25;
        msgBox.innerText = "💥 敵人發動攻擊！皮卡丘受到 25 點傷害！";
        document.getElementById('player-card').classList.add('shake'); // 我方框震動
    }
    
    updateUI();

    // 檢查是否有人死掉
    if (enemyHP <= 0 || playerHP <= 0) {
        checkWinLose();
        return; 
    }

    // ★ 等待 2 秒後恢復
    setTimeout(() => {
        if (attacker === 'player') {
            playerATB = 0; // 只有攻擊者歸零
            document.getElementById('enemy-card').classList.remove('shake');
        } else {
            enemyATB = 0; // 只有攻擊者歸零
            document.getElementById('player-card').classList.remove('shake');
        }
        
        msgBox.innerText = "瘋狂交替按 A 與 D 鍵加速前進！！";
        isPaused = false; // 解除凍結，繼續賽跑！
    }, 2000);
}

function checkWinLose() {
    setTimeout(() => {
        if (enemyHP <= 0) {
            enemyHP = 0; updateUI(); clearInterval(battleLoop);
            alert("勝利！成功收服寶可夢！"); backToMaps();
        } else if (playerHP <= 0) {
            playerHP = 0; updateUI(); clearInterval(battleLoop);
            alert("皮卡丘倒下了... 挑戰失敗，寶可夢逃跑了！"); backToMaps();
        }
        document.getElementById('enemy-card').classList.remove('shake');
        document.getElementById('player-card').classList.remove('shake');
    }, 500); // 延遲一下讓玩家看清楚血條歸零
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
        // ★ 只有在沒有暫停的時候，連打才有效
        if ((key === 'a' || key === 'd') && !isPaused) {
            playerATB += 4; 
            updateUI();
        }
    }
});

refreshMachine();
updateUI();
