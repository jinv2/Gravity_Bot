/**
 * G-Explorer Logic Core | CHILD-FRIENDLY EDITION
 * Shensist Matrix Spirit Protocol
 */

const canvas = document.getElementById('physics-canvas');
const ctx = canvas.getContext('2d');
const massSlider = document.getElementById('mass-slider');
const massDisplay = document.getElementById('mass-display');
const forceDisplay = document.getElementById('force-display');
const jumpBtn = document.getElementById('jump-btn');
const planetButtons = document.querySelectorAll('.planet-btn');
const speechBubble = document.getElementById('speech-bubble');
const robotSpeech = document.getElementById('robot-speech');
const heightMeter = document.getElementById('height-meter');
const velocityMeter = document.getElementById('velocity-meter');
const logList = document.getElementById('log-list');
const factText = document.getElementById('fact-text');
const bgmToggle = document.getElementById('bgm-toggle');
const sfxToggle = document.getElementById('sfx-toggle');
const launchOverlay = document.getElementById('launch-overlay');
const launchBtn = document.getElementById('launch-btn');
const body = document.body;

// --- Audio System (Bouncy & Cute) ---
const audioState = {
    bgmEnabled: false,
    sfxEnabled: true,
    initialized: false
};

// Background Music (Continuous Anthem)
const mainBgmSrc = 'assets/月球蹦跳指南.mp3';
const bgm = new Audio(mainBgmSrc);
bgm.loop = true;
bgm.volume = 0.5;
bgm.load();

// --- Preloaded SFX Engine ---
const sfx = {
    jump: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-cartoon-toy-whistle-616.mp3'),
    land: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-light-impact-with-thud-2101.mp3'),
    click: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-pop-character-item-2162.mp3'),
    pop: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-water-bubble-click-1107.mp3'),
    achievement: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-stipple-win-2005.mp3'),
    slide: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-foley-toy-spin-1464.mp3'),
    magic: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-magic-notification-ring-2359.mp3'),
    launch: new Audio('assets/sou.wav'),
    error: new Audio('assets/错误.wav'),
    fall: new Audio('assets/坠落.wav'),
    earthJump: new Audio('assets/跳跃.wav')
};

// Pre-set volumes and load
sfx.jump.volume = 0.7;
sfx.land.volume = 0.7;
sfx.click.volume = 0.6;
sfx.achievement.volume = 0.7;
sfx.slide.volume = 0.4;
sfx.magic.volume = 0.5;
sfx.launch.volume = 0.8;
sfx.error.volume = 0.8;
sfx.fall.volume = 0.8;
sfx.earthJump.volume = 0.8;



function playSfx(name) {
    if (!audioState.sfxEnabled) return;
    const sound = sfx[name];
    if (sound) {
        sound.currentTime = 0; // Reset for instant replay
        sound.play().catch(e => console.warn("SFX failed:", e));
    }
}



// --- Karaoke Lyrics System ---
const lyricsData = [
    { time: 0, text: "🎵 滴嘟！欢迎回来，小宇宙！" },
    { time: 3, text: "🚀 启动重力感应，我们去漫游。" },
    { time: 7, text: "🌙 月球上，轻轻一跳，飞得好高！" },
    { time: 11, text: "🥨 木星像巨人，把我们抓牢。" },
    { time: 15, text: "🌍 点亮星球按钮，换个 G 宇宙，" },
    { time: 18, text: "✨ 超级弹跳！和引力玩个够！" },
    { time: 22, text: "🌈 超级弹跳，玩个够！" },
    { time: 26, text: "🔋 滴——能量充能完毕！" }
];

const currentLyricText = document.getElementById('current-lyric');

bgm.addEventListener('timeupdate', () => {
    if (!audioState.bgmEnabled) return;
    const currentTime = bgm.currentTime;
    // Find the latest lyric line that has already started
    const currentLine = [...lyricsData].reverse().find(l => currentTime >= l.time);
    if (currentLine && currentLyricText.innerText !== currentLine.text) {
        currentLyricText.innerText = currentLine.text;
    }
});


function initAudio() {
    if (audioState.initialized) return;
    audioState.initialized = true;
    if (audioState.bgmEnabled) bgm.play().catch(() => {});
}

launchBtn.addEventListener('click', () => {
    initAudio();
    
    // Auto-play BGM on start
    audioState.bgmEnabled = true;
    bgmToggle.classList.add('active');
    bgm.play().catch(e => console.warn("Auto-bgm failed:", e));
    
    launchOverlay.classList.add('fade-out');
    playSfx('click');
    setTimeout(() => {
        showSpeech("实验室已激活！我是重力小精灵，欢迎光临！🌈");
    }, 1000);
});

bgmToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    initAudio();
    audioState.bgmEnabled = !audioState.bgmEnabled;
    bgmToggle.classList.toggle('active', audioState.bgmEnabled);
    if (audioState.bgmEnabled) {
        bgm.play().catch(() => showSpeech("点点我，开启快乐音乐！🎵"));
    } else {
        bgm.pause();
    }
});

sfxToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    initAudio();
    audioState.sfxEnabled = !audioState.sfxEnabled;
    sfxToggle.classList.toggle('active', audioState.sfxEnabled);
    if (audioState.sfxEnabled) playSfx('click');
});

// --- Planet Data & Facts (Kid Style) ---
const gravityFacts = [
    "在月球上，你跳一下就能飞得很高哦！🐰",
    "木星是一个大肚皮行星，它的拉力超级大！🦁",
    "重力就像一只无形的手，一直拉着我们的脚丫。🐾",
    "没有重力的话，你的汤面会飘到天上去！🍜",
    "每一颗星星都有它自己的引力魔法感。🪄"
];

// --- Physics State ---
let physics = {
    g: 9.8,
    m: 100,
    y: 0,
    vy: 0,
    isJumping: false,
    groundY: 0,
    tremble: 0,
    impact: 0,
    maxHeight: 0,
    trail: []
};

function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    physics.groundY = canvas.height - 50;
    physics.y = 0;
}

window.addEventListener('resize', resize);
resize();

function addLog(planet, height, force) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `🌟 <b>${planet}</b>：跳了 <b>${height.toFixed(1)}</b> 米高呢！`;
    
    const placeholder = logList.querySelector('.log-placeholder');
    if (placeholder) placeholder.remove();
    
    logList.prepend(entry);
    if (logList.children.length > 8) logList.lastChild.remove();

    // Achievement sound for big jumps
    if (height > 5) playSfx('achievement');
}

massSlider.addEventListener('input', (e) => {
    physics.m = parseFloat(e.target.value);
    massDisplay.innerText = physics.m;
    updateForceUI();
    // Throttle slide sound
    if (Math.random() > 0.8) playSfx('slide');
});

planetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        planetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        physics.g = parseFloat(btn.dataset.g);
        
        const planet = btn.dataset.planet;
        body.className = `bg-${planet}`;
        
        playSfx('click');
        playSfx('magic'); 
        
        updateForceUI();
        
        factText.innerText = gravityFacts[Math.floor(Math.random() * gravityFacts.length)];
        
        if (planet === 'jupiter') showSpeech("哎呀呀！木星在用力抱我呢！🐻");
        else if (planet === 'moon') showSpeech("呼呜~ 我要在月亮上睡觉觉！☁️");
        else showSpeech("还是地球家园最暖和！🏠");
    });
});

jumpBtn.addEventListener('click', () => {
    if (physics.isJumping) return;
    
    const activeBtn = document.querySelector('.planet-btn.active');
    const planet = activeBtn ? activeBtn.dataset.planet : 'earth';
    
    if (planet === 'jupiter') {
        showSpeech("哎呀！木星引力太强啦，我跳不动呀... 😰");
        playSfx('error');
        return;
    }
    
    physics.vy = 18; // More jumpy for kids
    physics.isJumping = true;
    physics.maxHeight = 0;
    
    // Planet-specific launch sound
    if (planet === 'earth') {
        playSfx('earthJump');
    } else if (planet === 'moon') {
        playSfx('launch'); // The "唰" (sou.wav) sound
    }
});

function updateForceUI() {
    const force = physics.m * physics.g;
    let desc = "刚刚好";
    if (force > 5000) desc = "超大抱抱！";
    else if (force > 2000) desc = "有点重重";
    else if (force > 500) desc = "正合适";
    else desc = "轻飘飘";
    forceDisplay.innerText = desc;
}

function showSpeech(text) {
    robotSpeech.innerText = text;
    speechBubble.classList.remove('hidden');
    clearTimeout(window.speechTimeout);
    window.speechTimeout = setTimeout(() => {
        speechBubble.classList.add('hidden');
    }, 4000);
}

// --- RENDERING (Cute Robot) ---
function drawRobot(x, y) {
    const tX = x + (Math.random() - 0.5) * physics.tremble;
    const tY = y + (Math.random() - 0.5) * physics.tremble;
    const color = physics.g > 15 ? '#ff8fb1' : '#5c67f2';

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(tX-35, tY-60, 70, 60, 20);
    ctx.fill();

    // Belly
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(tX, tY-30, 20, 15, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Head/Antenna
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tX, tY-60);
    ctx.quadraticCurveTo(tX, tY-80, tX+10, tY-85);
    ctx.stroke();
    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.arc(tX+10, tY-85, 8, 0, Math.PI*2);
    ctx.fill();

    // Eyes (Big & Kawaii)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(tX-15, tY-45, 10, 0, Math.PI*2);
    ctx.arc(tX+15, tY-45, 10, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(tX-15, tY-45, 5, 0, Math.PI*2);
    ctx.arc(tX+15, tY-45, 5, 0, Math.PI*2);
    ctx.fill();

    // Smile
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.arc(tX, tY-35, 8, 0, Math.PI, false);
    ctx.stroke();
    
    // Thruster (Stars)
    if (physics.isJumping) {
        ctx.fillStyle = '#ffd93d';
        for(let i=0; i<3; i++) {
            ctx.fillText('✨', tX - 10 + i*10, tY + 20);
        }
    }
}

function update(dt) {
    if (physics.isJumping) {
        physics.vy -= (physics.g * 8) * dt;
        physics.y += physics.vy;
        if (physics.y > physics.maxHeight) physics.maxHeight = physics.y;
        if (physics.y <= 0) {
            physics.y = 0; physics.vy = 0; physics.isJumping = false;
            
            // Planet-specific landing sound
            const activeBtn = document.querySelector('.planet-btn.active');
            const planet = activeBtn ? activeBtn.dataset.planet : 'earth';
            if (planet === 'jupiter') {
                playSfx('error');
            } else {
                playSfx('fall');
            }
            
            const pLabel = activeBtn ? activeBtn.querySelector('.btn-label').innerText : "未知";
            addLog(pLabel, physics.maxHeight/10, physics.m * physics.g);
        }
    }

    if (heightMeter) heightMeter.innerText = `高度: ${(physics.y/10).toFixed(1)}米`;
    if (velocityMeter) velocityMeter.innerText = `速度: ${physics.vy.toFixed(1)}米/秒`;

    if (physics.g > 15 || physics.m > 700) physics.tremble = Math.min(physics.tremble + 0.4, 6);
    else physics.tremble = Math.max(physics.tremble - 0.4, 0);

    // Heart/Bubbles Trail
    if (physics.isJumping && Math.random() > 0.4) {
        physics.trail.push({ x: canvas.width/2, y: physics.groundY - physics.y, life: 1.0, char: '💖' });
    }
    physics.trail.forEach((p, i) => {
        p.life -= 0.04;
        if (p.life <= 0) physics.trail.splice(i, 1);
    });
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    physics.trail.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.font = '20px serif';
        ctx.fillText(p.char, p.x + (Math.random()-0.5)*20, p.y);
    });
    ctx.globalAlpha = 1.0;
    drawRobot(canvas.width/2, physics.groundY - physics.y);
}

let lastTime = 0;
function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (dt < 0.1) update(dt);
    render();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
