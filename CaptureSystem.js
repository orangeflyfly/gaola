// CaptureSystem.js - V8.5.3 街機完美復刻修正版

const CaptureSystem = {
    // 20 等分球種分佈 (維持精準街機體感)
    segments: [
        'M', 'P', 'G', 'U', 'P', 'G', 'P', 'U', 'G', 'P',
        'M', 'P', 'G', 'U', 'P', 'G', 'U', 'P', 'G', 'U'
    ],
    colors: { 'M': '#9c27b0', 'U': '#ffeb3b', 'G': '#2196f3', 'P': '#f44336' },
    names: { 'M': '大師球', 'U': '高級球', 'G': '超級球', 'P': '精靈球' },
    rates: { 'M': 100, 'U': 2.5, 'G': 1.5, 'P': 1.0 },
    balls: { 'M': '🟣', 'U': '🟡', 'G': '🔵', 'P': '🔴' },

    currentDeg: 0,
    isSpinning: false,
    spinInterval: null,
    targetEnemy: null,

    // 1. 初始化捕獲階段 (修正佈局問題)
    init(enemy) {
        this.targetEnemy = enemy;
        this.currentDeg = 0;

        // 🚀 [關鍵修正] 使用 V8.5 頁面管理器，徹底關閉戰鬥畫面
        if(typeof GameUI !== 'undefined') {
            GameUI.switchPage('roulette-page');
        } else {
            document.getElementById('roulette-page').classList.remove('hidden');
        }
        
        // 重置 UI 狀態
        document.getElementById('roulette-result').classList.add('hidden');
        document.getElementById('pay-confirm-box').classList.add('hidden');
        document.getElementById('fail-exit-btn').classList.add('hidden');
        document.getElementById('roulette-title').innerText = `準備捕獲：${enemy.name}`;

        const stopBtn = document.getElementById('stop-btn');
        if (stopBtn) {
            stopBtn.style.display = 'inline-block';
            stopBtn.onclick = () => this.stop();
        }

        this.renderWheel();
        this.startSpin();
    },

    // 🌟 [復原] 恢復轉盤所有視覺樣式，確保 350px 尺寸與圓形邊框
    renderWheel() {
        const wheel = document.getElementById('wheel');
        if(!wheel) return;
        let gradient = [];
        for (let i = 0; i < 20; i++) {
            let color = this.colors[this.segments[i]];
            gradient.push(`${color} ${i * 18}deg ${(i + 1) * 18}deg`);
        }
        wheel.style.background = `conic-gradient(${gradient.join(', ')})`;
        
        // --- 恢復被刪掉的樣式 ---
        wheel.style.borderRadius = '50%';
        wheel.style.width = '350px';
        wheel.style.height = '350px';
        wheel.style.border = '8px solid #fff';
        wheel.style.boxShadow = '0 0 30px rgba(255, 235, 59, 0.4)';
        wheel.style.transition = 'transform 0s'; 
    },

    startSpin() {
        this.isSpinning = true;
        this.spinInterval = setInterval(() => {
            this.currentDeg += 18; 
            document.getElementById('wheel').style.transform = `rotate(${this.currentDeg}deg)`;
        }, 40);
    },

    stop() {
        if (!this.isSpinning) return;
        this.isSpinning = false;
        clearInterval(this.spinInterval);
        document.getElementById('stop-btn').style.display = 'none';

        let normalized = this.currentDeg % 360;
        let hitAngle = (360 - normalized) % 360; 
        let hitIndex = Math.floor(hitAngle / 18);
        let hitBall = this.segments[hitIndex];

        this.processResult(hitBall);
    },

    // 2. 處理捕獲結果 (對接入包儀式)
    processResult(ballCode) {
        const resultBox = document.getElementById('roulette-result');
        const msgEl = document.getElementById('result-msg');
        const ballEmoji = document.getElementById('result-ball');

        if(!resultBox) return;
        resultBox.classList.remove('hidden');
        ballEmoji.innerText = this.balls[ballCode];
        msgEl.innerText = `丟出了 ${this.names[ballCode]}！ 判定中...`;

        if(typeof GameUI !== 'undefined') GameUI.shake('result-ball');
        if(typeof SoundSystem !== 'undefined') SoundSystem.play('attack_hit'); 

        setTimeout(() => {
            let success = false;
            if (ballCode === 'M') {
                success = true; 
            } else {
                let baseRate = (7 - this.targetEnemy.rarity) * 15; 
                let finalRate = baseRate * this.rates[ballCode];
                success = (Math.random() * 100) < finalRate;
            }

            if (success) {
                msgEl.innerText = `✨ 成功捕獲 ${this.targetEnemy.name}！ ✨`;
                msgEl.style.color = "#4caf50";
                
                if (this.targetEnemy.isShiny) {
                    msgEl.innerText = `✨ 成功捕獲閃耀之星 ${this.targetEnemy.name}！ ✨`;
                }

                document.getElementById('pay-ask-text').innerText = `是否投入 10 金幣將卡匣印出？`;
                document.getElementById('pay-confirm-box').classList.remove('hidden');

                document.getElementById('confirm-pay-btn').onclick = () => {
                    if (coins >= 10) {
                        App.buyPokemon(this.targetEnemy, 10);
                        document.getElementById('pay-confirm-box').classList.add('hidden');
                    } else {
                        alert("❌ 投幣餘額不足！");
                    }
                };

            } else {
                msgEl.innerText = `💨 哎呀！ ${this.targetEnemy.name} 掙脫逃跑了...`;
                msgEl.style.color = "#f44336";
                document.getElementById('fail-exit-btn').classList.remove('hidden');
            }
        }, 1800);
    }
};
