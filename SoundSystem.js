const SoundSystem = {
    library: {
        bgm_lobby: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        bgm_battle: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        coin_in: 'https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3',
        button_click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        attack_hit: 'https://assets.mixkit.co/active_storage/sfx/2770/2770-preview.mp3',
        capture_shake: 'https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3',
        capture_success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
        rarity_6_glow: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
    },
    currentBGM: null,
    play(key) {
        if(this.library[key]) {
            const a = new Audio(this.library[key]); a.volume = 0.6; a.play().catch(()=>{});
        }
    },
    playBGM(key) {
        if(this.currentBGM) this.currentBGM.pause();
        if(this.library[key]) {
            this.currentBGM = new Audio(this.library[key]);
            this.currentBGM.loop = true; this.currentBGM.volume = 0.3; this.currentBGM.play().catch(()=>{});
        }
    }
};
