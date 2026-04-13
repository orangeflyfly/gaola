// config.js - 遊戲數值與機率中心
const GAME_CONFIG = {
    INITIAL_COINS: 100,
    MAP_REFRESH_COST: 30,      // 投入 30 金幣開局
    GUARANTEED_PRINT_COST: 20, // 保底印製費 (0 為免費)
    NORMAL_CATCH_COST: 30,     // 戰鬥捕獲後的印製費
    EXTRA_CATCH_COST: 30,      // 加賽捕獲後的印製費
    
    PLAYER_MAX_HP: 100,
    ENEMY_MAX_HP: 100,
    
    // 出現率設定 (普通場)
    RARITY_CHANCE: {
        6: 0.02, // 6 星 2%
        5: 0.10, // 5 星 10%
        4: 0.38, // 4 星 38%
        3: 0.50  // 3 星 50%
    },
    
    // 出現率設定 (加賽場)
    EXTRA_RARITY_CHANCE: {
        6: 0.15, // 6 星 15%
        5: 0.45, // 5 星 45%
        4: 0.40  // 4 星 40%
    },
    
    EXTRA_BATTLE_TRIGGER_RATE: 0.6 // 加賽觸發率 60%
};
