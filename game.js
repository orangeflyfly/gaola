// game.js - V6.2.7 旗艦重裝大腦版 (強制路徑修復 & 不簡化)

// --- 1. [新增] 統一圖片路徑中控 (GitHub RAW 高清版) ---
const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";

let state = GameStorage.load();
let coins = state.coins;
let myBackpack = state.backpack;

// [修正] 初始化夥伴：強制使用高清路徑組合
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
        // [強制修正] 確保一開始夥伴的圖片網址就是正確的
        if(myPartner && myPartner.id) {
            myPartner.image = `${imageBaseUrl}${myPartner.id}.png`;
        }
        MapSystem.refresh(); 
        this.updateAll(); 
        setTimeout(() => SoundSystem.playBGM('bgm_lobby'), 1000);
    },

    updateAll() { 
        // 在更新顯示前，再次確認夥伴圖片路徑
        if(myPartner && myPartner.id) {
            myPartner.image = `${imageBaseUrl}${myPartner.id}.png`;
        }
        GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner); 
        GameStorage.save(coins, myBackpack, myPartner); 
    },

    buyPokemon(p, cost) {
        if (coins < cost) return alert("金幣不足！");
        coins -= cost;
        
        // [新增] 確保新獲得的寶可夢路徑強制轉為高清版
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

// --- 全域橋樑函數 ---
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

function openBackpack() { 
    currentScreen = 'backpack';
    document.getElementById('backpack-page').classList.remove('hidden'); 
    renderBackpack(); 
}
function closeBackpack() { 
    currentScreen = 'selection';
    document.getElementById('backpack-page').classList.add('hidden'); 
}

// [重點修正] 背包渲染時強制計算高清路徑，不依賴存檔中的路徑
function renderBackpack() {
    const g = document.getElementById('backpack-grid');
    if(!g) return;
    g.innerHTML = "";
    myBackpack.forEach(p => {
        let isP = (myPartner && myPartner.id === p.id);
        const d = document.createElement('div');
        d.className = `backpack-item ${p.rarity >= 6 ? 'rarity-6' : ''}`;
        
        // 這裡強制使用高清路徑 render
        const currentImg = `${imageBaseUrl}${p.id}.png`;
        
        d.innerHTML = `
            <img src="${currentImg}" class="poke-sprite">
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
    if (currentScreen === 'fight' && !isPaused && (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'd')) { 
        playerATB += 5; 
        App.updateAll(); 
    }
    if (currentScreen === 'selection') {
        if (e.key === 'ArrowLeft') changeMap(-1);
        if (e.key === 'ArrowRight') changeMap(1);
        if (e.key === 'Enter') confirmMapSelection();
    }
});
