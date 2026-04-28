// EffectSystem.js - V8.0 大師視覺特效引擎

const EffectSystem = {
    // 1. 螢幕劇烈震動 (用於爆擊或強力攻擊)
    shakeScreen(intensity = 10) {
        const body = document.body;
        body.style.transition = 'none';
        
        let count = 0;
        const maxShakes = 10;
        const interval = setInterval(() => {
            const x = (Math.random() - 0.5) * intensity;
            const y = (Math.random() - 0.5) * intensity;
            body.style.transform = `translate(${x}px, ${y}px)`;
            
            count++;
            if (count >= maxShakes) {
                clearInterval(interval);
                body.style.transform = 'translate(0, 0)';
            }
        }, 30);
    },

    // 2. FEVER 模式動態模糊 (Radial Blur)
    // active: true (開啟) / false (關閉)
    applyFeverBlur(active) {
        const gameContainer = document.getElementById('fighting-page');
        if (!gameContainer) return;

        if (active) {
            gameContainer.style.filter = `blur(${GAME_CONFIG.VISUAL.FEVER_BLUR_AMOUNT || '4px'})`;
            gameContainer.style.transition = 'filter 0.5s ease-out';
            // 為了保持角色清晰，我們通常只對背景或賽道加模糊，但這取決於您的 CSS 結構
            // 這裡先對整個戰鬥頁面進行微量模糊處理
        } else {
            gameContainer.style.filter = 'none';
        }
    },

    // 3. 噴錢特效 (Coin Shower)
    spawnCoinShower(targetId) {
        const layer = document.getElementById('vfx-layer');
        const target = document.getElementById(targetId);
        if (!layer || !target) return;

        const rect = target.getBoundingClientRect();
        
        for (let i = 0; i < 10; i++) {
            const coin = document.createElement('div');
            coin.className = 'vfx-coin';
            coin.innerText = '🪙';
            coin.style.position = 'fixed';
            coin.style.left = `${rect.left + rect.width / 2}px`;
            coin.style.top = `${rect.top + rect.height / 2}px`;
            coin.style.zIndex = '1000';
            
            const tx = (Math.random() - 0.5) * 400;
            const ty = (Math.random() - 1) * 400; // 向上噴發
            
            coin.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0.5) rotate(360deg)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0, .9, .57, 1)'
            });

            layer.appendChild(coin);
            setTimeout(() => coin.remove(), 800);
        }
    },

    // 4. 入包儀式 (金光爆發)
    playGachaFlash(callback) {
        const flash = document.createElement('div');
        flash.id = 'gacha-flash-overlay';
        flash.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: white; z-index: 9999; opacity: 0;
        `;
        document.body.appendChild(flash);

        // 閃光動畫
        flash.animate([
            { opacity: 0 },
            { opacity: 1, offset: 0.1 },
            { opacity: 1, offset: 0.8 },
            { opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-in-out'
        });

        if(typeof SoundSystem !== 'undefined') SoundSystem.play('ui_click'); // 之後可換成爆裂音效

        setTimeout(() => {
            if (callback) callback();
            flash.remove();
        }, 1500);
    }
};
