// EffectSystem.js - V8.5 視覺總監版 (入包儀式與異色特效)

const EffectSystem = {
    // 1. 螢幕劇烈震動
    shakeScreen(intensity = 10) {
        const body = document.body;
        body.style.transition = 'none';
        let count = 0;
        const maxShakes = 10;
        const interval = setInterval(() => {
            const x = (Math.random() - 0.5) * intensity;
            const y = (Math.random() - 0.5) * intensity;
            body.style.transform = `translate(${x}px, ${y}px)`;
            if (++count >= maxShakes) {
                clearInterval(interval);
                body.style.transform = 'translate(0, 0)';
            }
        }, 30);
    },

    // 2. FEVER 模式動態模糊
    applyFeverBlur(active) {
        const gameContainer = document.getElementById('fighting-page');
        if (!gameContainer) return;
        gameContainer.style.transition = 'filter 0.5s ease-out';
        gameContainer.style.filter = active ? `blur(${GAME_CONFIG.VISUAL.FEVER_BLUR_AMOUNT || '4px'})` : 'none';
    },

    // 3. 噴錢特效
    spawnCoinShower(targetId) {
        const layer = document.getElementById('vfx-layer');
        const target = document.getElementById(targetId);
        if (!layer || !target) return;
        const rect = target.getBoundingClientRect();
        for (let i = 0; i < 10; i++) {
            const coin = document.createElement('div');
            coin.className = 'vfx-coin';
            coin.innerText = '🪙';
            coin.style.cssText = `position:fixed; left:${rect.left + rect.width/2}px; top:${rect.top + rect.height/2}px; z-index:1000;`;
            layer.appendChild(coin);
            coin.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${(Math.random()-0.5)*400}px, ${(Math.random()-1)*400}px) scale(0.5) rotate(360deg)`, opacity: 0 }
            ], { duration: 800, easing: 'cubic-bezier(0, .9, .57, 1)' });
            setTimeout(() => coin.remove(), 800);
        }
    },

    // 🌟 4. [V8.5 新增] 入包大儀式 (取代舊版 GachaFlash)
    playCaptureRitual(callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: black; z-index: 9999; display: flex;
            align-items: center; justify-content: center; opacity: 0;
            transition: opacity 0.5s;
        `;
        document.body.appendChild(overlay);

        // A. 進入黑暗
        setTimeout(() => { overlay.style.opacity = '1'; }, 10);

        // B. 虹光爆烈與大震動
        setTimeout(() => {
            overlay.style.background = 'radial-gradient(circle, #fff 10%, #ffd700 40%, #ff00ff 70%)';
            overlay.innerHTML = '<h1 style="color:white; font-size:80px; text-shadow: 0 0 20px gold; font-style:italic;">SUCCESS!!</h1>';
            if(typeof SoundSystem !== 'undefined') SoundSystem.play('skill_cutin');
            this.shakeScreen(30); 
        }, 1000);

        // C. 結束恢復
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if(callback) callback();
                overlay.remove();
            }, 500);
        }, 2500);
    },

    // 🌟 5. [V8.5 新增] 異色閃光動畫
    spawnShinySparkle(targetId) {
        const target = document.getElementById(targetId);
        if(!target) return;
        const rect = target.getBoundingClientRect();
        for(let i=0; i<12; i++) {
            const s = document.createElement('div');
            s.innerText = '✨';
            s.style.cssText = `
                position: fixed; z-index: 1001; font-size: 24px;
                left: ${rect.left + Math.random()*rect.width}px;
                top: ${rect.top + Math.random()*rect.height}px;
                pointer-events: none;
            `;
            document.body.appendChild(s);
            s.animate([
                { transform: 'scale(0) rotate(0deg)', opacity: 1 },
                { transform: `translate(${(Math.random()-0.5)*100}px, ${(Math.random()-0.5)*100}px) scale(1.5) rotate(180deg)`, opacity: 0 }
            ], { duration: 1000 + Math.random()*500 });
            setTimeout(() => s.remove(), 1500);
        }
    }
};
