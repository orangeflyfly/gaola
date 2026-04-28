// SoundSystem.js - V9.0.5 街機音效全對接版 (全代碼不簡化)

const SoundSystem = {
    library: {
        // --- 背景音樂 (BGM) ---
        bgm_lobby: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        bgm_battle: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',

        // --- 系統音效 (System SFX) ---
        coin_in: 'https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3',       // 投幣聲
        button_click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',  // 實體按鈕聲
        ui_click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',      // 螢幕點擊聲 (草叢選擇)
        
        // --- 戰鬥與特效 (Combat & VFX) ---
        attack_hit: 'https://assets.mixkit.co/active_storage/sfx/2770/2770-preview.mp3',    // 擊中/球落地聲
        skill_cutin: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',   // 大招特寫聲
        
        // --- 捕獲與開獎 (Capture & Gacha) ---
        capture_shake: 'https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3', // 輪盤判讀聲
        capture_success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // 捕獲成功聲
        
        // 🌟 V9.0.5 新增：光束開獎專用音效
        shiny_spawn: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',   // 6星金光爆發聲
        rarity_6_glow: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'  // 6星卡匣發光聲
    },
    currentBGM: null,

    // 1. 播放一般短音效
    play(key) {
        if(this.library[key]) {
            const a = new Audio(this.library[key]); 
            a.volume = 0.6; 
            a.play().catch(()=>{
                // 處理瀏覽器自動播放限制
                console.warn(`音效 ${key} 播放被阻擋，需使用者互動`);
            });
        }
    },

    // 2. 播放循環背景音樂
    playBGM(key) {
        // 先停止當前背景音樂
        if(this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM = null;
        }

        if(this.library[key]) {
            this.currentBGM = new Audio(this.library[key]);
            this.currentBGM.loop = true; 
            this.currentBGM.volume = 0.3; 
            this.currentBGM.play().catch(()=>{
                console.warn(`BGM ${key} 播放失敗`);
            });
        }
    }
};
