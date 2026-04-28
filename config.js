// config.js - V8.0 大師進化版：全域中樞設定
const GAME_CONFIG = {
    // 1. 基礎營運設定 (維持總監原始數值)
    INITIAL_COINS: 100,
    MAP_REFRESH_COST: 30,
    GUARANTEED_PRINT_COST: 0, 
    NORMAL_CATCH_COST: 20,
    EXTRA_CATCH_COST: 30,

    // 2. 戰鬥基礎數值
    PLAYER_MAX_HP: 100,
    ENEMY_MAX_HP: 100,
    
    // 🌟 [V8.0 重點] 戰鬥平衡參數 (讓 BattleSystem 直接讀取，不用進去翻代碼)
    BATTLE: {
        PLAYER_PASSIVE_ATB: 0.02,    // 玩家被動跑速 (V7.4.3 補丁值)
        PLAYER_ACTIVE_GAIN: 2.5,     // 玩家連打推力 (V7.4.3 補丁值)
        ENEMY_BASE_SPEED: 0.05,      // 敵人基礎跑速 (總監指定的慢速補丁)
        ENEMY_RARITY_WEIGHT: 0.01,   // 敵人稀有度速度加權
        COMBO_FEVER_THRESHOLD: 30,   // 進入 FEVER 的連擊數
        SKILL_CUTIN_DURATION: 1000   // 大招演出停頓時間 (ms)
    },

    // 🌟 [V8.0 重點] 資源路徑管理 (讓 game.js 和 ui.js 不再重複寫長網址)
    ASSET_PATH: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/",

    // 🌟 [V8.0 新增] 視覺演出參數 (為 EffectSystem 鋪路)
    VISUAL: {
        SCREEN_SHAKE_STRENGTH: 8,    // 爆擊震動強度
        FEVER_BLUR_AMOUNT: "4px",    // FEVER 模式模糊程度
        CRITICAL_COLOR: "#ffeb3b"    // 爆擊發光顏色
    },

    // 3. 機率設定 (維持總監原始數值)
    RARITY_CHANCE: { 6: 0.02, 5: 0.10, 4: 0.40, 3: 0.48 },
    EXTRA_RARITY_CHANCE: { 6: 0.15, 5: 0.45, 4: 0.40 },
    EXTRA_BATTLE_RATE: 0.6          // 總監設定：60% 高加賽率
};

// 🌟 [V8.0 新增] 圖鑑書本專屬設定 (一頁 3 張，左右對開 6 張)
const POKEDEX_CONFIG = {
    ITEMS_PER_PAGE: 3,        // 單頁 3 張
    ITEMS_PER_SPREAD: 6,      // 左右對開 6 張
    TOTAL_ENTRIES: 100        // 目前規劃收錄 100 隻
};
