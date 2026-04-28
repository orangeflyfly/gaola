// config.js - V9.0.8 街機營業參數中樞 (全代碼不簡化)

const GAME_CONFIG = {
    // 1. 基礎營運設定
    INITIAL_COINS: 100,             // 初始金幣
    ENTRY_COST: 30,                 // 🌟 投幣啟動/保底入園費用
    POST_BATTLE_PRINT_COST: 10,     // 🌟 戰鬥後捕獲成功後的印卡費用
    
    // 2. 戰鬥基礎數值
    PLAYER_MAX_HP: 100,
    ENEMY_MAX_HP: 100,
    
    // 3. 戰鬥平衡與異色判定
    BATTLE: {
        PLAYER_PASSIVE_ATB: 0.02,
        PLAYER_ACTIVE_GAIN: 2.5,
        ENEMY_BASE_SPEED: 0.05,
        ENEMY_RARITY_WEIGHT: 0.01,
        COMBO_FEVER_THRESHOLD: 30,
        SKILL_CUTIN_DURATION: 1000,
        SHINY_CHANCE: 0.05           // 異色機率 (測試用 5%)
    },

    // 4. 🌟 V9.0.8 修正：全自動開獎與 BOSS 警告參數
    MAP_SYSTEM: {
        BOSS_ENCOUNTER_RATE: 0.7,    // 拿到保底怪後，遭遇區域 BOSS 的機率 (70%)
        INTER_BALL_DELAY: 200,       // 系統連丟三球的間隔時間 (ms)
        THROW_BALL_DURATION: 600,    // 球在空中飛行的時間 (ms)
        
        // 🌟 自動引爆節奏控制
        AUTO_REVEAL_INTERVAL: 300,   // 1->2->3 球與球之間引爆的間隔 (ms)
        REVEAL_DELAY_NORMAL: 800,    // 一般藍光光束維持時間 (ms)
        REVEAL_DELAY_GOLD: 1500,     // 🌟 傳說金光光束維持時間 (慢速震撼演出) (ms)
        
        // 🌟 BOSS 警告儀式
        BOSS_WARNING_DURATION: 3000, // BOSS 警告文字閃爍的總時長 (ms)
        EXTRA_BOSS_RATE: 0.2         // 點擊草叢時，強大氣息亂入的機率 (20%)
    },

    // 5. 資源路徑管理
    ASSET_PATH: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/",

    // 6. 視覺演出參數
    VISUAL: {
        SCREEN_SHAKE_STRENGTH: 12,   // 爆擊震動強度
        FEVER_BLUR_AMOUNT: "4px",
        CRITICAL_COLOR: "#ffeb3b",
        SHINY_GLOW: "hue-rotate(180deg) drop-shadow(0 0 10px gold)", // 異色版視覺特效
        BEAM_GOLD: "#ffeb3b",        // 6星金柱顏色
        BEAM_BLUE: "#00d4ff"         // 一般藍光顏色
    },

    // 7. 機率設定 (一般與加賽)
    RARITY_CHANCE: { 6: 0.02, 5: 0.10, 4: 0.40, 3: 0.48 },
    EXTRA_RARITY_CHANCE: { 6: 0.15, 5: 0.45, 4: 0.40 },
    EXTRA_BATTLE_RATE: 0.6           // 完賽後觸發加賽的機率
};

// 8. 圖鑑書本設定 (鎖定物理規格)
const POKEDEX_CONFIG = {
    ITEMS_PER_PAGE: 3,               // 單頁 3 隻
    ITEMS_PER_SPREAD: 6,             // 對開 6 隻
    TOTAL_ENTRIES: 100,              // 總數 100 隻
    BOOK_WIDTH: 1100,                // 螢幕寬度約束
    BOOK_HEIGHT: 800                 // 螢幕高度約束
};
