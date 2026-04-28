// config.js - V8.5 閃耀進化設定版 (全域中樞)
const GAME_CONFIG = {
    // 1. 基礎營運設定
    INITIAL_COINS: 100,
    MAP_REFRESH_COST: 30,
    GUARANTEED_PRINT_COST: 0, 
    NORMAL_CATCH_COST: 20,
    EXTRA_CATCH_COST: 30,

    // 2. 戰鬥基礎數值
    PLAYER_MAX_HP: 100,
    ENEMY_MAX_HP: 100,
    
    // 🌟 [V8.5 更新] 戰鬥平衡與異色判定
    BATTLE: {
        PLAYER_PASSIVE_ATB: 0.02,
        PLAYER_ACTIVE_GAIN: 2.5,
        ENEMY_BASE_SPEED: 0.05,
        ENEMY_RARITY_WEIGHT: 0.01,
        COMBO_FEVER_THRESHOLD: 30,
        SKILL_CUTIN_DURATION: 1000,
        SHINY_CHANCE: 0.05           // 🌟 異色機率 (測試用 5%，正式上線建議調回 0.01)
    },

    // 資源路徑管理
    ASSET_PATH: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/",

    // 🌟 [V8.5 更新] 視覺演出參數
    VISUAL: {
        SCREEN_SHAKE_STRENGTH: 12,   // 爆擊震動加強
        FEVER_BLUR_AMOUNT: "4px",
        CRITICAL_COLOR: "#ffeb3b",
        SHINY_GLOW: "hue-rotate(180deg) drop-shadow(0 0 10px gold)" // 異色版視覺特效
    },

    // 3. 機率設定
    RARITY_CHANCE: { 6: 0.02, 5: 0.10, 4: 0.40, 3: 0.48 },
    EXTRA_RARITY_CHANCE: { 6: 0.15, 5: 0.45, 4: 0.40 },
    EXTRA_BATTLE_RATE: 0.6
};

// 圖鑑書本設定
const POKEDEX_CONFIG = {
    ITEMS_PER_PAGE: 3,
    ITEMS_PER_SPREAD: 6,
    TOTAL_ENTRIES: 100
};
