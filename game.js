// game.js - V6.1 緊急修復版
let state = GameStorage.load();
let coins = state.coins;
let myBackpack = state.backpack;
let myPartner = state.partner || { id: 25, name: "皮卡丘", rarity: 3, image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" };

let currentScreen = 'selection', playerHP = 100, enemyHP = 100, playerATB = 0, enemyATB = 0;
let currentEnemy = null, isPaused = false, isExtraBattle = false, currentRotation = 0, isRouletteRunning = false, currentMapOptions = [];

const App = {
    init() { 
        MapSystem.refresh(); 
        this.updateAll(); 
        // 只有在玩家點擊後音樂才能播放，這裡先嘗試啟動
        setTimeout(() => SoundSystem.playBGM('bgm_lobby'), 1000);
    },

    updateAll() { 
        GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner); 
        GameStorage.save(coins, myBackpack, myPartner); 
    },

    buyPokemon(p, cost) {
        if (coins < cost) return alert("金幣不足！");
        coins -= cost;
        const exists = myBackpack.find(item => item.id === p.id);
        if (exists) { 
            let r = p.rarity * 10; coins += r; 
            alert(`重複獲得！轉化為 ${r} 金幣。`); 
        } else { 
            myBackpack.push(p); 
            alert(`收服 ${p.name} 成功！`); 
        }
        this.updateAll();
        if (currentScreen === 'guaranteed') {
            document.getElementById('guaranteed-page').classList.add('hidden');
            BattleSystem.start(null);
        } else if (currentScreen === 'roulette') {
            this.finish();
        }
    },

    finish() {
        // 安全清理 UI
        const ids = ['roulette-page', 'pay-confirm-box', 'fail-exit-btn', 'roulette-result'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });

        if(!isExtraBattle && Math.random() < GAME_CONFIG.EXTRA_BATTLE_RATE) { 
            document.getElementById('extra-battle-pop').classList.remove('hidden'); 
        } else { 
            this.reload(); 
        }
    },

    reload() { 
        location.reload(); 
    }
};

// --- 全域橋樑函數 (供 HTML onclick 使用) ---
function earnCoins() { coins += 10; SoundSystem.play('button_click'); App.updateAll(); }
function confirmMapSelection() { 
    if (coins < 30) return alert("金幣不足！"); 
    coins -= 30; 
    SoundSystem.play('coin_in'); 
    SoundSystem.playBGM('bgm_battle'); 
    MapSystem.showGuaranteed(); 
}
function changeMap(dir) { MapSystem.change(dir); }
function spinWheel() { CaptureSystem.spin(); }
function startExtraBattle() { 
    document.getElementById('extra-battle-pop').classList.add('hidden'); 
    isExtraBattle = true; 
    BattleSystem.start(null); 
}
function hideExtraPop() { App.reload(); }
function finishCapture() { App.finish(); }
function refreshMachine() { MapSystem.refresh(); }
function openBackpack() { document.getElementById('backpack-page').classList.remove('hidden'); renderBackpack(); }
function closeBackpack() { document.getElementById('backpack-page').classList.add('hidden'); }

function renderBackpack() {
    const g = document.getElementById('backpack-grid');
    if(!g) return;
    g.innerHTML = "";
    myBackpack.forEach(p => {
        let isP = (myPartner && myPartner.id === p.id);
        const d = document.createElement('div');
        d.className = `backpack-item ${p.rarity >= 6 ? 'rarity-6' : ''}`;
        d.innerHTML = `
            <img src="${p.image}" class="poke-sprite">
            <div class="card-info">
                <b>${p.name}</b><br>★${p.rarity}<br>
                <button onclick="setPartner(${p.id})" ${isP ? 'disabled' : ''}>${isP ? '出戰中' : '選擇'}</button>
            </div>
        `;
        g.appendChild(d);
    });
}

function setPartner(id) { 
    const found = myBackpack.find(p => p.id === id);
    if(found) {
        myPartner = found; 
        App.updateAll(); 
        renderBackpack(); 
    }
}

// 啟動機台
App.init();

// 監聽連打
window.addEventListener('keydown', (e) => {
    if (currentScreen === 'fight' && !isPaused && (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'd')) { 
        playerATB += 4; 
        App.updateAll(); 
    }
});
