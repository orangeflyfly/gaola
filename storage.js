// storage.js - 負責 localStorage 的存取
const GameStorage = {
    save: function(coins, backpack, partner) {
        localStorage.setItem('gaoleCoins', coins);
        localStorage.setItem('gaoleBackpack', JSON.stringify(backpack));
        localStorage.setItem('gaolePartner', JSON.stringify(partner));
    },
    
    load: function() {
        return {
            coins: parseInt(localStorage.getItem('gaoleCoins')) || GAME_CONFIG.INITIAL_COINS,
            backpack: JSON.parse(localStorage.getItem('gaoleBackpack')) || [],
            partner: JSON.parse(localStorage.getItem('gaolePartner')) || null
        };
    }
};
