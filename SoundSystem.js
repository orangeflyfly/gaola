// SoundSystem.js - 負責全機台的聲音發射
const SoundSystem = {
    // 音訊資源庫 (總監可自行替換更熱血的 URL)
    library: {
        bgm_lobby: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // 大廳背景音樂
        bgm_battle: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', // 戰鬥音樂
        coin_in: 'https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3', // 投幣聲
        button_click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // 按鈕聲
        attack_hit: 'https://assets.mixkit.co/active_storage/sfx/2770/2770-preview.mp3', // 打擊聲
        capture_shake: 'https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3', // 捕獲搖晃
        capture_success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // 成功！
        rarity_6_glow: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3' // 6星閃爍音
    },

    currentBGM: null,

    // 播放特效音 (SFX)
    play(soundKey) {
        if (this.library[soundKey]) {
            const audio = new Audio(this.library[soundKey]);
            audio.volume = 0.6; // 特效音量
            audio.play().catch(e => console.log("等待玩家點擊後啟動音效"));
        }
    },

    // 播放/切換背景音樂 (BGM)
    playBGM(bgmKey) {
        if (this.currentBGM) {
            this.currentBGM.pause();
        }
        
        if (this.library[bgmKey]) {
            this.currentBGM = new Audio(this.library[bgmKey]);
            this.currentBGM.loop = true;
            this.currentBGM.volume = 0.3; // BGM 通常小聲一點
            this.currentBGM.play().catch(e => console.log("BGM 等待激活"));
        }
    },

    stopBGM() {
        if (this.currentBGM) this.currentBGM.pause();
    }
};
