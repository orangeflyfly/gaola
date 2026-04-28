// storage.js - V9.0.5 數據金庫強化版 (數據持久化中樞 - 全代碼不簡化)

const GameStorage = {
    // 1. 全域保存 (存入：金幣、背包、夥伴)
    save: (coins, backpack, partner) => {
        localStorage.setItem('gaoleCoins', coins);
        localStorage.setItem('gaoleBackpack', JSON.stringify(backpack));
        localStorage.setItem('gaolePartner', JSON.stringify(partner));
    },

    // 🌟 [V9.0.5 新增] 即時狀態快速存檔 (不需參數，直接抓取全域變數)
    // 當草叢保底怪入包時，呼叫此函數可防止數據丟失
    saveCurrentState: () => {
        if (typeof coins !== 'undefined') localStorage.setItem('gaoleCoins', coins);
        if (typeof myBackpack !== 'undefined') localStorage.setItem('gaoleBackpack', JSON.stringify(myBackpack));
        if (typeof myPartner !== 'undefined') localStorage.setItem('gaolePartner', JSON.stringify(myPartner));
        console.log("[金庫] 營業數據已即時備份。");
    },

    // 2. 全域讀取 (初始化遊戲狀態)
    load: () => ({
        coins: parseInt(localStorage.getItem('gaoleCoins')) || (typeof GAME_CONFIG !== 'undefined' ? GAME_CONFIG.INITIAL_COINS : 0),
        backpack: JSON.parse(localStorage.getItem('gaoleBackpack')) || [],
        partner: JSON.parse(localStorage.getItem('gaolePartner')) || null
    }),

    // 3. 圖鑑專用讀取接口
    loadPokedexRecord: () => {
        const seen = JSON.parse(localStorage.getItem('gaolePokedexSeen')) || [];
        const caught = JSON.parse(localStorage.getItem('gaolePokedexCaught')) || [];
        return { seen, caught };
    },

    // 4. 圖鑑即時更新接口
    // type: 'seen' (遇見) 或 'caught' (收服)
    updatePokedex: (id, type) => {
        const key = type === 'seen' ? 'gaolePokedexSeen' : 'gaolePokedexCaught';
        let record = JSON.parse(localStorage.getItem(key)) || [];

        // 如果 ID 不在紀錄裡，則新增進去
        if (!record.includes(id)) {
            record.push(id);
            localStorage.setItem(key, JSON.stringify(record));
            console.log(`[圖鑑紀錄] 已更新 ID: ${id} 狀態為: ${type}`);
            
            // 🌟 如果是剛抓到，也必須確保它出現在「見過」的清單中
            if (type === 'caught') {
                let seenRecord = JSON.parse(localStorage.getItem('gaolePokedexSeen')) || [];
                if (!seenRecord.includes(id)) {
                    seenRecord.push(id);
                    localStorage.setItem('gaolePokedexSeen', JSON.stringify(seenRecord));
                }
            }
        }
    }
};
