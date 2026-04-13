// game.js - 總指揮部
let state = GameStorage.load();
let coins = state.coins;
let myBackpack = state.backpack;
let myPartner = state.partner || { id: 25, name: "皮卡丘", rarity: 3, image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" };

let currentScreen = 'selection', playerHP = 100, enemyHP = 100, playerATB = 0, enemyATB = 0;
let currentEnemy = null, isPaused = false, isExtraBattle = false, currentRotation = 0, isRouletteRunning = false;

// 封裝成 App 對象供全域調用
const App = {
    init() {
        MapSystem.refresh();
        this.updateAll();
    },
    updateAll() {
        GameUI.updateDisplay(coins, playerHP, enemyHP, playerATB, enemyATB, myPartner);
        GameStorage.save(coins, myBackpack, myPartner);
    },
    buyPokemon(p, cost) {
        if (coins < cost) return alert("金幣不足！");
        coins -= cost;
        const existing = myBackpack.find(item => item.id === p.id);
        if (existing) {
            let reward = p.rarity * 10; coins += reward;
            alert(`重複獲得！轉化為 ${reward} 金幣。`);
        } else {
            myBackpack.push(p);
            alert(`收服成功！${p.name} 已入包。`);
        }
        this.updateAll();
        if (currentScreen === 'guaranteed') document.getElementById('guaranteed-page').classList.add('hidden'), BattleSystem.start(null);
        if (currentScreen === 'roulette') this.finish();
    },
    finish() {
        document.getElementById('roulette-page').classList.add('hidden');
        if(!isExtraBattle && Math.random() < GAME_CONFIG.EXTRA_BATTLE_RATE) {
            document.getElementById('extra-battle-pop').classList.remove('hidden');
        } else {
            this.reload();
        }
    },
    reload() { location.reload(); }
};

// 全域掛載函數（讓 HTML 上的 onclick 能找到）
function earnCoins() { coins += 10; App.updateAll(); }
function confirmMapSelection() { if (coins < 30) return alert("金幣不足！"); coins -= 30; MapSystem.showGuaranteed(); }
function changeMap(dir) { MapSystem.change(dir); }
function spinWheel() { CaptureSystem.spin(); }
function startExtraBattle() { document.getElementById('extra-battle-pop').classList.add('hidden'); isExtraBattle = true; BattleSystem.start(null); }
function finishCapture() { App.finish(); }
function hideExtraPop() { App.reload(); }
function refreshMachine() { MapSystem.refresh(); }
function openBackpack() { document.getElementById('backpack-page').classList.remove('hidden'); renderBackpack(); }
function closeBackpack() { document.getElementById('backpack-page').classList.add('hidden'); }

// 啟動
App.init();

// 監聽連打
window.addEventListener('keydown', (e) => {
    if (currentScreen === 'fight' && !isPaused && (e.key === 'a' || e.key === 'd')) {
        playerATB += 4; App.updateAll();
    }
});
