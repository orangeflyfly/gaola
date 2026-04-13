// game.js - V6.2.7 旗艦對接修正版

const imageBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";

let state = GameStorage.load();
let coins = state.coins;
let myBackpack = state.backpack || [];
let myPartner = state.partner || { id: 25, name: "皮卡丘", rarity: 3, image: `${imageBaseUrl}25.png` };

let currentScreen = 'selection', playerHP = 100, enemyHP = 100, playerATB = 0, enemyATB = 0;
let currentEnemy = null, isPaused = false, isExtraBattle = false;

const App = {
    init() { 
        // 強制修復夥伴圖片路徑
        if(myPartner) myPartner.image = `${imageBaseUrl}${myPartner.id}.png`;
        MapSystem.refresh(); 
        this.updateAll(); 
        setTimeout(() => { if(typeof SoundSystem !== 'undefined') SoundSystem.playBGM('bgm_lobby'); }, 1000);
    },

    // [修正] 確保數字正確更新到 coin-count
    updateAll() { 
        const coinEl = document.getElementById('coin-count');
        if(coinEl) coinEl.innerText = coins;
        
        // 呼叫 UI 系統更新其他顯示
        if(typeof GameUI !== 'undefined') {
            GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner); 
        }
        GameStorage.save(coins, myBackpack, myPartner); 
    },

    buyPokemon(p, cost) {
        if (coins < cost) return alert("金幣不足！");
        coins -= cost;
        
        // 強制使用高清路徑
        p.image = `${imageBaseUrl}${p.id}.png`;

        const exists = myBackpack.find(item => item.id === p.id);
        if (exists) { 
            let r = p.rarity * 10; coins += r; 
            alert(`重複獲得！轉化為 ${r} 金幣。`); 
        } else { 
            myBackpack.push(p); 
            alert(`成功收服 ${p.name}！`); 
        }
        this.updateAll();

        // [修正] 三選一後的跳轉邏輯
        if (currentScreen === 'guaranteed') {
            document.getElementById('guaranteed-page').classList.add('hidden');
            // 確保戰鬥系統啟動
            if(typeof BattleSystem !== 'undefined') {
                BattleSystem.start(null); 
            }
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

        if(!isExtraBattle && Math.random() < 0.3) { 
            document.getElementById('extra-battle-pop').classList.remove('hidden'); 
        } else { 
            this.reload(); 
        }
    },

    reload() { location.reload(); }
};

// --- 橋樑函數修正 ---
function earnCoins() { 
    coins += 100; 
    if(typeof SoundSystem !== 'undefined') SoundSystem.play('button_click'); 
    App.updateAll(); 
}

function confirmMapSelection() { 
    if (coins < 30) return alert("金幣不足！"); 
    coins -= 30; 
    currentScreen = 'guaranteed'; // [關鍵] 標記狀態
    if(typeof SoundSystem !== 'undefined') {
        SoundSystem.play('coin_in'); 
        SoundSystem.playBGM('bgm_battle'); 
    }
    MapSystem.showGuaranteed(); 
}

function changeMap(dir) { MapSystem.change(dir); }
function spinWheel() { if(typeof CaptureSystem !== 'undefined') CaptureSystem.spin(); }
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

function renderBackpack() {
    const g = document.getElementById('backpack-grid');
    if(!g) return;
    g.innerHTML = "";
    myBackpack.forEach(p => {
        let isP = (myPartner && myPartner.id === p.id);
        const d = document.createElement('div');
        d.className = `backpack-item ${p.rarity >= 6 ? 'rarity-6' : ''}`;
        d.innerHTML = `
            <img src="${imageBaseUrl}${p.id}.png" class="poke-sprite">
            <div class="card-info">
                <b>${p.name}</b><br>
                <span style="color:#ffeb3b; font-weight:bold;">★ ${p.rarity}</span><br>
                <button onclick="setPartner(${p.id})" ${isP ? 'disabled' : ''} 
                        style="margin-top:5px; background: ${isP ? '#555' : 'linear-gradient(to bottom, #00fbff, #008183)'}; color: ${isP ? '#aaa' : '#000'};">
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
        myPartner = found; 
        App.updateAll(); 
        renderBackpack(); 
    }
}

App.init();

// 連打監聽
window.addEventListener('keydown', (e) => {
    if (currentScreen === 'fight' && (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'd')) { 
        playerATB += 5; 
        App.updateAll(); 
    }
    if (currentScreen === 'selection') {
        if (e.key === 'ArrowLeft') changeMap(-1);
        if (e.key === 'ArrowRight') changeMap(1);
        if (e.key === 'Enter') confirmMapSelection();
    }
});
