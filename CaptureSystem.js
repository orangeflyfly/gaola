const CaptureSystem = {
    start() {
        currentScreen = 'roulette';
        document.getElementById('fighting-page').classList.add('hidden');
        document.getElementById('roulette-page').classList.remove('hidden');
        document.getElementById('stop-btn').classList.remove('hidden');
        document.getElementById('roulette-result').classList.add('hidden');
        isRouletteRunning = false;
    },

    spin() {
        if(isRouletteRunning) return;
        isRouletteRunning = true;
        document.getElementById('stop-btn').classList.add('hidden');
        
        let extra = Math.floor(Math.random() * 360);
        currentRotation += (1800 + extra);
        document.getElementById('wheel').style.transform = `rotate(${currentRotation}deg)`;
        
        setTimeout(() => {
            let angle = currentRotation % 360;
            let ball;
            if(angle < 90) ball = { name: "大師球", rate: 100, emoji: "🟣" };
            else if(angle < 180) ball = { name: "精靈球", rate: 10, emoji: "🔴" };
            else if(angle < 270) ball = { name: "超級球", rate: 30, emoji: "🔵" };
            else ball = { name: "高級球", rate: 50, emoji: "🟡" };
            
            const ballIcon = document.getElementById('result-ball');
            document.getElementById('roulette-result').classList.remove('hidden');
            ballIcon.innerText = ball.emoji;
            document.getElementById('result-msg').innerText = `丟出了 ${ball.name}！`;
            ballIcon.classList.add('catch-shake');

            setTimeout(() => {
                ballIcon.classList.remove('catch-shake');
                if((Math.random() * 100) <= ball.rate) {
                    document.getElementById('result-msg').innerText = "捕獲成功！";
                    document.getElementById('pay-confirm-box').classList.remove('hidden');
                    let cost = isExtraBattle ? GAME_CONFIG.EXTRA_CATCH_COST : GAME_CONFIG.NORMAL_CATCH_COST;
                    document.getElementById('pay-ask-text').innerText = `成功捕獲！是否支付 ${cost} 金幣？`;
                    document.getElementById('confirm-pay-btn').onclick = () => App.buyPokemon(currentEnemy, cost);
                } else {
                    document.getElementById('result-msg').innerText = "掙脫逃跑了...";
                    document.getElementById('fail-exit-btn').classList.remove('hidden');
                }
            }, 1600);
        }, 3500);
    }
};
