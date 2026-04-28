// storage.js - V8.0 大師架構重組版 (數據持久化中樞)

const GameStorage = {
    // 1. 全域保存 (存入：金幣、背包、夥伴)
    save: (coins, backpack, partner) => {
        localStorage.setItem('gaoleCoins', coins);
        localStorage.setItem('gaoleBackpack', JSON.stringify(backpack));
        localStorage.setItem('gaolePartner', JSON.stringify(partner));
    },

    // 2. 全域讀取 (初始化遊戲狀態)
    load: () => ({
        coins: parseInt(localStorage.getItem('gaoleCoins')) || GAME_CONFIG.INITIAL_COINS,
        backpack: JSON.parse(localStorage.getItem('gaoleBackpack')) || [],
        partner: JSON.parse(localStorage.getItem('gaolePartner')) || null
    }),

    // 🌟 [V8.0 新增] 圖鑑專用讀取接口
    loadPokedexRecord: () => {
        const seen = JSON.parse(localStorage.getItem('gaolePokedexSeen')) || [];
        const caught = JSON.parse(localStorage.getItem('gaolePokedexCaught')) || [];
        return { seen, caught };
    },

    // 🌟 [V8.0 新增] 圖鑑即時更新接口
    // type: 'seen' (遇見) 或 'caught' (收服)
    updatePokedex: (id, type) => {
        const key = type === 'seen' ? 'gaolePokedexSeen' : 'gaolePokedexCaught';
        let record = JSON.parse(localStorage.getItem(key)) || [];

        // 如果 ID 不在紀錄裡，則新增進去
        if (!record.includes(id)) {
            record.push(id);
            localStorage.setItem(key, JSON.stringify(record));
            console.log(`[圖鑑紀錄] 已更新 ID: ${id} 狀態為: ${type}`);
        }
    }
};
