// game.js - V6.2.6 總監專屬加強版 (基於您的 V6.1)

// --- 1. [新增] 統一圖片路徑中控 ---
const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";

let state = GameStorage.load();
let coins = state.coins;
let myBackpack = state.backpack;
// [修正] 預留我方圖片高清化
let myPartner = state.partner || { 
    id: 25, 
    name: "皮卡丘", 
    rarity: 3, 
    image: `${imageBaseUrl}25.png` 
};

let currentScreen = 'selection', playerHP = 100, enemyHP = 100, playerATB = 0, enemyATB = 0;
let currentEnemy = null, isPaused = false, isExtraBattle = false, currentRotation = 0, isRouletteRunning = false, currentMapOptions = [];

const App = {
    init() { 
        // [修正] 確保一開始夥伴就不會破圖
        if(myPartner) myPartner.image = `${imageBaseUrl}${myPartner.id}.png`;
        MapSystem.refresh(); 
        this.updateAll(); 
        setTimeout(() => SoundSystem.playBGM('bgm_lobby'), 1000);
    },

    updateAll() { 
        GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner); 
        GameStorage.save(coins, myBackpack, myPartner); 
    },

    buyPokemon(p, cost) {
        if (coins < cost) return alert("金幣不足！");
        coins -= cost;
        
        // [新增] 確保新獲得的寶可夢路徑正確
        p.image = `${imageBaseUrl}${p.id}.png`;

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

// --- 全域橋樑函數 (針對佈局優化) ---
function earnCoins() { coins += 100; SoundSystem.play('button_click'); App.updateAll(); }
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

// [修正] 背包頁面開啟時標記狀態
function openBackpack() { 
    currentScreen = 'backpack';
    document.getElementById('backpack-page').classList.remove('hidden'); 
    renderBackpack(); 
}
function closeBackpack() { 
    currentScreen = 'selection';
    document.getElementById('backpack-page').classList.add('hidden'); 
}

// [重點修正] 移除 HTML 內的 style 標籤，讓它完全由 CSS 網格控制
function renderBackpack() {
    const g = document.getElementById('backpack-grid');
    if(!g) return;
    g.innerHTML = "";
    myBackpack.forEach(p => {
        let isP = (myPartner && myPartner.id === p.id);
        const d = document.createElement('div');
        // 加入 rarity-6 判斷，對接 CSS 的虹光特效
        d.className = `backpack-item ${p.rarity >= 6 ? 'rarity-6' : ''}`;
        d.innerHTML = `
            <img src="${p.image}" class="poke-sprite">
            <div class="card-info">
                <b>${p.name}</b><br>
                <span style="color:#ffeb3b; font-weight:bold;">★ ${p.rarity}</span><br>
                <button onclick="setPartner(${p.id})" ${isP ? 'disabled' : ''} 
                        style="background: ${isP ? '#555' : 'linear-gradient(to bottom, #00fbff, #008183)'}; color: ${isP ? '#aaa' : '#000'};">
                    ${isP ? '出戰中' : '選擇出戰'}
                </button>
            </div>
        `;
        g.appendChild(d);
    });
}

function setPartner(id) { 
    const found = myBackpack.find(p => p.id === id);
    if(found) {
        // [新增] 更換夥伴時也強制修正路徑為高清版
        found.image = `${imageBaseUrl}${found.id}.png`;
        myPartner = found; 
        App.updateAll(); 
        renderBackpack(); 
    }
}

App.init();

// --- [加強] 中央鍵盤控制系統 ---
window.addEventListener('keydown', (e) => {
    // 戰鬥中的連打 (保留原本邏輯)
    if (currentScreen === 'fight' && !isPaused && (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'd')) { 
        playerATB += 5; // 稍微加強連打威力
        App.updateAll(); 
    }
    // [新增] 大廳模式下的鍵盤控制
    if (currentScreen === 'selection') {
        if (e.key === 'ArrowLeft') changeMap(-1);
        if (e.key === 'ArrowRight') changeMap(1);
        if (e.key === 'Enter') confirmMapSelection();
    }
});
