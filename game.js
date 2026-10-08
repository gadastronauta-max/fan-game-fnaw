// ==================== ÁUDIO DO JUMPSCARE ====================
let audioContext = null;
let jumpscareSoundNodes = [];

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playJumpscareSound() {
    initAudioContext();
    if (!audioContext) return;

    const now = audioContext.currentTime;
    const duration = 4;

    const frequencies = [40, 55, 80, 110, 160, 220];
    const gains = [0.5, 0.4, 0.35, 0.3, 0.25, 0.2];

    jumpscareSoundNodes.forEach(node => {
        try { node.stop(); } catch(e) {}
    });
    jumpscareSoundNodes = [];

    frequencies.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * 1.5, now + duration * 0.5);
        osc.frequency.linearRampToValueAtTime(freq * 0.8, now + duration);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(400, now + duration);
        filter.Q.setValueAtTime(5, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(gains[i], now + 0.05);
        gain.gain.setValueAtTime(gains[i], now + duration * 0.7);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);

        osc.start(now);
        osc.stop(now + duration);

        jumpscareSoundNodes.push(osc);
    });

    const bufferSize = audioContext.sampleRate * duration;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.linearRampToValueAtTime(0.05, now + duration);

    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(300, now);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);

    noiseSource.start(now);
    noiseSource.stop(now + duration);

    jumpscareSoundNodes.push(noiseSource);

    setTimeout(() => {
        jumpscareSoundNodes.forEach(node => {
            try { node.stop(); } catch(e) {}
        });
        jumpscareSoundNodes = [];
    }, duration * 1000);
}

// ==================== MENU E HISTÓRIA ====================
const menuElements = {
    mainMenu: document.getElementById('main-menu'),
    storyScreen: document.getElementById('story-screen'),
    playBtn: document.getElementById('play-btn'),
    menuAnimatronic: document.getElementById('menu-animatronic'),
    storyAnimatronic: document.getElementById('story-animatronic'),
    gameContainer: document.getElementById('game-container'),
    blackScreen: document.getElementById('black-screen')
};

// Imagem do animatrônico principal (azul)
const ANIMATRONIC_IMAGE = "./imag/Animatrônico Azul de Olho Vermelho.png";

// Imagem do animatrônico vermelho — aparece APENAS na porta direita
const ANIMATRONIC_RED_IMAGE = "./imag/Animatronic vermelho.png";

let storyTapEnabled = false;

function initMenu() {
    menuElements.menuAnimatronic.style.backgroundImage = `url("${ANIMATRONIC_IMAGE}")`;
    menuElements.storyAnimatronic.style.backgroundImage = `url("${ANIMATRONIC_IMAGE}")`;

    menuElements.playBtn.addEventListener('click', () => {
        menuElements.mainMenu.style.display = 'none';
        menuElements.storyScreen.style.display = 'flex';
        addVHSEffectToStory();
        storyTapEnabled = true;
    });

    menuElements.storyScreen.addEventListener('touchend', (e) => {
        if (!storyTapEnabled) return;

        const currentTime = new Date().getTime();
        const tapLength = currentTime - (menuElements.storyScreen._lastTap || 0);

        if (tapLength < 500 && tapLength > 0) {
            e.preventDefault();
            storyTapEnabled = false;
            startGame();
        }
        menuElements.storyScreen._lastTap = currentTime;
    });

    let clickCount = 0;
    let clickTimer;

    menuElements.storyScreen.addEventListener('click', () => {
        if (!storyTapEnabled) return;

        clickCount++;

        if (clickCount === 1) {
            clickTimer = setTimeout(() => {
                clickCount = 0;
            }, 500);
        } else if (clickCount === 2) {
            clearTimeout(clickTimer);
            clickCount = 0;
            storyTapEnabled = false;
            startGame();
        }
    });

    addVHSEffectToMenu();
}

function addVHSEffectToMenu() {
    const menuOverlay = document.createElement('div');
    menuOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2001;
        opacity: 0.05;
        background: 
            repeating-linear-gradient(0deg, 
                rgba(0, 255, 0, 0.1) 0px, 
                transparent 2px, 
                transparent 4px);
        animation: static 0.3s infinite;
    `;
    menuElements.mainMenu.appendChild(menuOverlay);

    const menuScanline = document.createElement('div');
    menuScanline.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: rgba(0, 255, 0, 0.2);
        animation: scanline 10s linear infinite;
        pointer-events: none;
        z-index: 2001;
    `;
    menuElements.mainMenu.appendChild(menuScanline);
}

function addVHSEffectToStory() {
    const storyOverlay = document.createElement('div');
    storyOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
        opacity: 0.08;
        background: 
            repeating-linear-gradient(0deg, 
                rgba(0, 255, 0, 0.1) 0px, 
                transparent 2px, 
                transparent 4px);
        animation: static 0.2s infinite;
    `;
    menuElements.storyScreen.appendChild(storyOverlay);
}

function startGame() {
    initAudioContext();
    menuElements.storyScreen.style.display = 'none';
    menuElements.gameContainer.style.display = 'block';

    resetGameState();
    initGame();
}

function resetGameState() {
    clearInterval(GameState.energyDrainInterval);
    clearInterval(GameState.animatronicMoveInterval);
    clearInterval(GameState.gameTimeInterval);

    if (GameState.doorAttackTimer) {
        clearTimeout(GameState.doorAttackTimer);
        GameState.doorAttackTimer = null;
    }
    if (GameState.rechargeTimer) {
        clearInterval(GameState.rechargeTimer);
        GameState.rechargeTimer = null;
    }
    // Limpa o timer do animatrônico vermelho
    if (GameState.redAttackTimer) {
        clearTimeout(GameState.redAttackTimer);
        GameState.redAttackTimer = null;
    }
    // Limpa timers do animatrônico azul
    if (GameState.doorAtDoorTimer) {
        clearTimeout(GameState.doorAtDoorTimer);
        GameState.doorAtDoorTimer = null;
    }
    if (GameState.animatronicCooldownTimer) {
        clearTimeout(GameState.animatronicCooldownTimer);
        GameState.animatronicCooldownTimer = null;
    }

    GameState.energy = 100;
    GameState.isGameOver = false;
    GameState.currentCamera = 0;
    GameState.isMonitorActive = false;
    GameState.leftDoorOpen = false;
    GameState.rightDoorOpen = false;
    GameState.animatronicPosition = 1;
    GameState.time = 0;
    GameState.isRecharging = false;
    GameState.doorAttackSide = null;
    GameState.redAnimatronicAtDoor = false;
    GameState.animatronicBlocked = false;

    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.disabled = false;
    });
    elements.rechargeBtn.disabled = false;
    elements.rechargeBtn.textContent = 'RECARREGAR';

    elements.leftDoorElement.classList.remove('door-open');
    elements.rightDoorElement.classList.remove('door-open');
    elements.leftDoorBtn.textContent = 'PORTA ESQ';
    elements.rightDoorBtn.textContent = 'PORTA DIR';
    elements.leftDoorIndicator.textContent = 'PORTA ESQ\nFECHADA';
    elements.rightDoorIndicator.textContent = 'PORTA DIR\nFECHADA';
    elements.leftDoorIndicator.classList.remove('door-open-indicator');
    elements.rightDoorIndicator.classList.remove('door-open-indicator');

    elements.monitorBtn.textContent = 'MONITOR';
    elements.cameraPanel.style.display = 'none';
    elements.monitorText.textContent = 'SISTEMA OFFLINE\nPRESSIONE MONITOR';
    elements.monitorText.style.display = 'flex';
    elements.cameraFeed.style.display = 'none';

    elements.animatronicDoor.style.display = 'none';
    elements.animatronicRedDoor.style.display = 'none';
    elements.cameraAnimatronic.style.display = 'none';

    elements.gameOverScreen.style.display = 'none';
    elements.gameOverAnimatronic.style.display = 'none';

    menuElements.blackScreen.style.display = 'none';

    elements.message.style.display = 'block';

    updateEnergyBox();
    updateCameraButtons();
}

function goToMenu() {
    clearInterval(GameState.energyDrainInterval);
    clearInterval(GameState.animatronicMoveInterval);
    clearInterval(GameState.gameTimeInterval);

    if (GameState.doorAttackTimer) {
        clearTimeout(GameState.doorAttackTimer);
        GameState.doorAttackTimer = null;
    }
    if (GameState.rechargeTimer) {
        clearInterval(GameState.rechargeTimer);
        GameState.rechargeTimer = null;
    }
    if (GameState.redAttackTimer) {
        clearTimeout(GameState.redAttackTimer);
        GameState.redAttackTimer = null;
    }
    if (GameState.doorAtDoorTimer) {
        clearTimeout(GameState.doorAtDoorTimer);
        GameState.doorAtDoorTimer = null;
    }
    if (GameState.animatronicCooldownTimer) {
        clearTimeout(GameState.animatronicCooldownTimer);
        GameState.animatronicCooldownTimer = null;
    }

    elements.gameOverScreen.style.display = 'none';
    elements.gameOverAnimatronic.style.display = 'none';
    menuElements.gameContainer.style.display = 'none';

    GameState.energy = 100;
    GameState.isGameOver = false;
    GameState.currentCamera = 0;
    GameState.isMonitorActive = false;
    GameState.leftDoorOpen = false;
    GameState.rightDoorOpen = false;
    GameState.animatronicPosition = 1;
    GameState.time = 0;
    GameState.isRecharging = false;
    GameState.doorAttackSide = null;
    GameState.redAnimatronicAtDoor = false;
    GameState.animatronicBlocked = false;

    menuElements.storyScreen._lastTap = 0;
    storyTapEnabled = false;

    menuElements.mainMenu.style.display = 'flex';
    menuElements.mainMenu.scrollTop = 0;
}

// ==================== CONFIGURAÇÃO DO JOGO ====================
const GameState = {
    energy: 100,
    isGameOver: false,
    currentCamera: 0,
    isMonitorActive: false,
    leftDoorOpen: false,
    rightDoorOpen: false,
    animatronicPosition: 1,
    difficulty: 1,
    time: 0,
    energyDrainInterval: null,
    animatronicMoveInterval: null,
    gameTimeInterval: null,
    doorAttackTimer: null,
    doorAttackSide: null,
    isRecharging: false,
    rechargeTimer: null,
    // Animatrônico azul — controle de tempo na porta
    doorAtDoorTimer: null,         // timer de 10s máximo na porta
    animatronicBlocked: false,     // true durante cooldown após recuar
    animatronicCooldownTimer: null,
    // Estado exclusivo do animatrônico vermelho
    redAnimatronicAtDoor: false,   // true quando está visível na porta direita
    redAttackTimer: null           // timer de 1s antes do game over
};

const elements = {
    message: document.getElementById('message'),
    energyBoxBar: document.getElementById('energy-box-bar'),
    energyBoxWarning: document.getElementById('energy-box-warning'),
    rechargeBtn: document.getElementById('recharge-btn'),
    leftDoorBtn: document.getElementById('left-door-btn'),
    rightDoorBtn: document.getElementById('right-door-btn'),
    monitorBtn: document.getElementById('monitor-btn'),
    cameraPanel: document.getElementById('camera-panel'),
    cameraButtons: document.querySelectorAll('.camera-btn'),
    gameOverScreen: document.getElementById('game-over'),
    restartBtn: document.getElementById('restart-btn'),
    leftDoorIndicator: document.getElementById('left-door-indicator'),
    rightDoorIndicator: document.getElementById('right-door-indicator'),
    leftDoorElement: document.getElementById('left-door'),
    rightDoorElement: document.getElementById('right-door'),
    animatronicDoor: document.getElementById('animatronic-door'),
    animatronicRedDoor: document.getElementById('animatronic-red-door'),
    cameraAnimatronic: document.getElementById('camera-animatronic'),
    cameraFeed: document.getElementById('camera-feed'),
    monitorText: document.getElementById('monitor-text'),
    gameOverAnimatronic: document.getElementById('game-over-animatronic'),
    gameOverText: document.getElementById('game-over-text'),
    timeDisplay: document.getElementById('time-display'),
    fullscreenBtn: document.getElementById('fullscreen-btn')
};

// ==================== FUNÇÕES DO JOGO ====================
function initGame() {
    updateEnergy(0);
    updateCameraButtons();
    updateAnimatronicPosition();
    updateTimeDisplay();

    startGameSystems();

    setTimeout(() => {
        elements.message.style.display = 'none';
    }, 5000);
}

function updateEnergy(amount) {
    GameState.energy = Math.max(0, Math.min(100, GameState.energy + amount));
    updateEnergyBox();

    if (GameState.energy <= 0 && !GameState.isGameOver) {
        energyGameOver();
    }
}

function updateEnergyBox() {
    elements.energyBoxBar.style.width = `${GameState.energy}%`;

    if (GameState.energy > 50) {
        elements.energyBoxBar.style.background = 'linear-gradient(to left, #0f0, #0a0)';
    } else if (GameState.energy > 20) {
        elements.energyBoxBar.style.background = 'linear-gradient(to left, #ff0, #aa0)';
    } else {
        elements.energyBoxBar.style.background = 'linear-gradient(to left, #f00, #a00)';
    }

    if (GameState.energy <= 25 && GameState.energy > 0) {
        elements.energyBoxWarning.classList.add('blinking');
    } else {
        elements.energyBoxWarning.classList.remove('blinking');
    }
}

function rechargeEnergy() {
    if (GameState.isRecharging || GameState.isGameOver) return;
    if (GameState.energy >= 100) return;

    GameState.isRecharging = true;
    elements.rechargeBtn.disabled = true;
    elements.rechargeBtn.textContent = 'RECARREGANDO...';

    let rechargeAmount = 0;
    const targetAmount = 100 - GameState.energy;
    const step = targetAmount / 20;

    GameState.rechargeTimer = setInterval(() => {
        if (GameState.isGameOver) {
            clearInterval(GameState.rechargeTimer);
            GameState.rechargeTimer = null;
            GameState.isRecharging = false;
            elements.rechargeBtn.disabled = false;
            elements.rechargeBtn.textContent = 'RECARREGAR';
            return;
        }

        rechargeAmount += step;

        if (rechargeAmount >= targetAmount) {
            updateEnergy(targetAmount);
            clearInterval(GameState.rechargeTimer);
            GameState.rechargeTimer = null;
            GameState.isRecharging = false;
            elements.rechargeBtn.disabled = false;
            elements.rechargeBtn.textContent = 'RECARREGAR';
        } else {
            updateEnergy(step);
        }
    }, 100);
}

function drainEnergy() {
    let drainRate = 1.5;

    if (GameState.leftDoorOpen) drainRate += 2.0;
    if (GameState.rightDoorOpen) drainRate += 2.0;
    if (GameState.isMonitorActive) drainRate += 1.0;

    updateEnergy(-drainRate);
}

function startDoorAttackTimer(side) {
    if (GameState.doorAttackTimer) return;

    const doorOpen = side === 'left' ? GameState.leftDoorOpen : GameState.rightDoorOpen;
    if (!doorOpen) return;

    GameState.doorAttackSide = side;

    GameState.doorAttackTimer = setTimeout(() => {
        GameState.doorAttackTimer = null;
        if (!GameState.isGameOver) {
            const currentDoorOpen = side === 'left' ? GameState.leftDoorOpen : GameState.rightDoorOpen;
            if (currentDoorOpen) {
                jumpscare(ANIMATRONIC_IMAGE);
            } else {
                GameState.doorAttackSide = null;
            }
        }
    }, 2500);
}

// Recua o animatrônico azul para a câmera 1 e impede movimento por um tempo
function retreatAnimatronic() {
    if (GameState.isGameOver) return;

    // Limpa timer de porta se houver
    if (GameState.doorAttackTimer) {
        clearTimeout(GameState.doorAttackTimer);
        GameState.doorAttackTimer = null;
        GameState.doorAttackSide = null;
    }
    if (GameState.doorAtDoorTimer) {
        clearTimeout(GameState.doorAtDoorTimer);
        GameState.doorAtDoorTimer = null;
    }

    GameState.animatronicPosition = 1;
    GameState.animatronicBlocked = true;
    updateAnimatronicPosition();
    updateCameraButtons();

    // Libera o movimento de novo após 20–35s
    const cooldown = 20000 + Math.random() * 15000;
    GameState.animatronicCooldownTimer = setTimeout(() => {
        GameState.animatronicBlocked = false;
        GameState.animatronicCooldownTimer = null;
    }, cooldown);
}

function moveAnimatronic() {
    if (GameState.isGameOver) return;
    if (GameState.animatronicBlocked) return;

    const moveChance = 0.55 + (GameState.difficulty * 0.10);

    if (Math.random() < moveChance) {
        if (GameState.animatronicPosition === 6 || GameState.animatronicPosition === 7) {
            const doorSide = GameState.animatronicPosition === 6 ? 'left' : 'right';
            const doorOpen = doorSide === 'left' ? GameState.leftDoorOpen : GameState.rightDoorOpen;

            if (doorOpen) {
                startDoorAttackTimer(doorSide);
            }

            // Inicia o timer de 10s para ele sair da porta caso não entre
            if (!GameState.doorAtDoorTimer) {
                GameState.doorAtDoorTimer = setTimeout(() => {
                    GameState.doorAtDoorTimer = null;
                    if (!GameState.isGameOver && !GameState.animatronicBlocked) {
                        retreatAnimatronic();
                    }
                }, 10000);
            }
            return;
        }

        if (GameState.animatronicPosition <= 5) {
            const possibleMoves = [];

            if (GameState.animatronicPosition > 1) possibleMoves.push(GameState.animatronicPosition - 1);
            if (GameState.animatronicPosition < 5) possibleMoves.push(GameState.animatronicPosition + 1);

            if (GameState.animatronicPosition === 1) possibleMoves.push(6);
            if (GameState.animatronicPosition === 2) possibleMoves.push(7);

            if (possibleMoves.length > 0) {
                GameState.animatronicPosition = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

                if (GameState.animatronicPosition === 6 && GameState.leftDoorOpen) {
                    startDoorAttackTimer('left');
                } else if (GameState.animatronicPosition === 7 && GameState.rightDoorOpen) {
                    startDoorAttackTimer('right');
                }

                // Se chegou a uma porta, inicia o contador de 10s
                if ((GameState.animatronicPosition === 6 || GameState.animatronicPosition === 7) && !GameState.doorAtDoorTimer) {
                    GameState.doorAtDoorTimer = setTimeout(() => {
                        GameState.doorAtDoorTimer = null;
                        if (!GameState.isGameOver && !GameState.animatronicBlocked) {
                            retreatAnimatronic();
                        }
                    }, 10000);
                }
            }
        }

        updateAnimatronicPosition();
        updateCameraButtons();
    }
}

function updateAnimatronicPosition() {
    elements.animatronicDoor.style.display = 'none';
    elements.cameraAnimatronic.style.display = 'none';

    switch(GameState.animatronicPosition) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
            if (GameState.isMonitorActive && GameState.currentCamera === GameState.animatronicPosition) {
                elements.cameraFeed.style.display = 'block';
                elements.monitorText.style.display = 'none';
                elements.cameraAnimatronic.style.display = 'block';
                elements.cameraAnimatronic.style.backgroundImage = `url("${ANIMATRONIC_IMAGE}")`;
            }
            break;

        case 6:
            if (GameState.leftDoorOpen) {
                elements.animatronicDoor.style.display = 'block';
                elements.animatronicDoor.style.backgroundImage = `url("${ANIMATRONIC_IMAGE}")`;
                elements.animatronicDoor.style.left = '2%';
                elements.animatronicDoor.style.right = 'auto';
                elements.animatronicDoor.style.transform = 'scaleX(-1)';
            }
            break;

        case 7:
            if (GameState.rightDoorOpen) {
                elements.animatronicDoor.style.display = 'block';
                elements.animatronicDoor.style.backgroundImage = `url("${ANIMATRONIC_IMAGE}")`;
                elements.animatronicDoor.style.right = '2%';
                elements.animatronicDoor.style.left = 'auto';
                elements.animatronicDoor.style.transform = 'scaleX(1)';
            }
            break;
    }
}

function updateCameraButtons() {
    elements.cameraButtons.forEach(btn => {
        btn.classList.remove('active', 'has-animatronic');

        if (parseInt(btn.dataset.camera) === GameState.currentCamera) {
            btn.classList.add('active');
        }

        if (parseInt(btn.dataset.camera) === GameState.animatronicPosition) {
            btn.classList.add('has-animatronic');
        }
    });
}

function switchCamera(cameraNum) {
    GameState.currentCamera = cameraNum;

    if (cameraNum > 0) {
        const locations = ['Sala Principal', 'Cozinha', 'Backstage', 'Estoque', 'Palco'];
        elements.monitorText.textContent = `CÂMERA ${cameraNum}\n${locations[cameraNum-1]}`;
        elements.cameraFeed.style.display = 'block';
        elements.monitorText.style.display = 'flex';

        updateAnimatronicPosition();
        updateCameraButtons();

        playStaticEffect();
    } else {
        elements.monitorText.textContent = 'SISTEMA OFFLINE\nPRESSIONE MONITOR';
        elements.monitorText.style.display = 'flex';
        elements.cameraFeed.style.display = 'none';
    }
}

function toggleLeftDoor() {
    if (GameState.isGameOver) return;

    GameState.leftDoorOpen = !GameState.leftDoorOpen;

    if (GameState.leftDoorOpen) {
        elements.leftDoorElement.classList.add('door-open');
        elements.leftDoorBtn.textContent = 'FECHAR ESQ';
        elements.leftDoorIndicator.textContent = 'PORTA ESQ\nABERTA';
        elements.leftDoorIndicator.classList.add('door-open-indicator');

        if (GameState.animatronicPosition === 6) {
            startDoorAttackTimer('left');
        }
    } else {
        elements.leftDoorElement.classList.remove('door-open');
        elements.leftDoorBtn.textContent = 'PORTA ESQ';
        elements.leftDoorIndicator.textContent = 'PORTA ESQ\nFECHADA';
        elements.leftDoorIndicator.classList.remove('door-open-indicator');

        if (GameState.doorAttackSide === 'left' && GameState.doorAttackTimer) {
            clearTimeout(GameState.doorAttackTimer);
            GameState.doorAttackTimer = null;
            GameState.doorAttackSide = null;
        }
    }

    updateAnimatronicPosition();
}

function toggleRightDoor() {
    if (GameState.isGameOver) return;

    GameState.rightDoorOpen = !GameState.rightDoorOpen;

    if (GameState.rightDoorOpen) {
        elements.rightDoorElement.classList.add('door-open');
        elements.rightDoorBtn.textContent = 'FECHAR DIR';
        elements.rightDoorIndicator.textContent = 'PORTA DIR\nABERTA';
        elements.rightDoorIndicator.classList.add('door-open-indicator');

        if (GameState.animatronicPosition === 7) {
            startDoorAttackTimer('right');
        }

        // Se o animatrônico vermelho já está na porta direita e a porta foi aberta,
        // inicia o timer de 1s para game over
        if (GameState.redAnimatronicAtDoor) {
            startRedAttackTimer();
        }
    } else {
        elements.rightDoorElement.classList.remove('door-open');
        elements.rightDoorBtn.textContent = 'PORTA DIR';
        elements.rightDoorIndicator.textContent = 'PORTA DIR\nFECHADA';
        elements.rightDoorIndicator.classList.remove('door-open-indicator');

        if (GameState.doorAttackSide === 'right' && GameState.doorAttackTimer) {
            clearTimeout(GameState.doorAttackTimer);
            GameState.doorAttackTimer = null;
            GameState.doorAttackSide = null;
        }

        // Porta fechada cancela o ataque do animatrônico vermelho
        if (GameState.redAttackTimer) {
            clearTimeout(GameState.redAttackTimer);
            GameState.redAttackTimer = null;
        }
    }

    updateAnimatronicPosition();
    updateRedAnimatronicVisibility();
}

function toggleMonitor() {
    if (GameState.isGameOver) return;

    GameState.isMonitorActive = !GameState.isMonitorActive;

    if (GameState.isMonitorActive) {
        elements.cameraPanel.style.display = 'flex';
        elements.monitorBtn.textContent = 'FECHAR MONITOR';
        switchCamera(1);
    } else {
        elements.cameraPanel.style.display = 'none';
        elements.monitorBtn.textContent = 'MONITOR';
        switchCamera(0);
    }
}

function jumpscare(image) {
    if (GameState.isGameOver) return;

    playJumpscareSound();

    const jumpscareElement = document.createElement('div');
    jumpscareElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url('${image}');
        background-size: cover;
        background-position: center 10%;
        background-repeat: no-repeat;
        filter: brightness(0.6) contrast(2) saturate(1.5);
        animation: jumpscare 0.5s infinite;
        z-index: 999;
    `;
    document.body.appendChild(jumpscareElement);

    setTimeout(() => {
        jumpscareElement.remove();
        gameOver(image);
    }, 1000);
}

function energyGameOver() {
    if (GameState.isGameOver) return;

    GameState.isGameOver = true;

    clearInterval(GameState.energyDrainInterval);
    clearInterval(GameState.animatronicMoveInterval);
    clearInterval(GameState.gameTimeInterval);

    if (GameState.doorAttackTimer) {
        clearTimeout(GameState.doorAttackTimer);
        GameState.doorAttackTimer = null;
    }
    if (GameState.rechargeTimer) {
        clearInterval(GameState.rechargeTimer);
        GameState.rechargeTimer = null;
    }
    if (GameState.redAttackTimer) {
        clearTimeout(GameState.redAttackTimer);
        GameState.redAttackTimer = null;
    }
    if (GameState.doorAtDoorTimer) {
        clearTimeout(GameState.doorAtDoorTimer);
        GameState.doorAtDoorTimer = null;
    }
    if (GameState.animatronicCooldownTimer) {
        clearTimeout(GameState.animatronicCooldownTimer);
        GameState.animatronicCooldownTimer = null;
    }

    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.disabled = true;
    });
    elements.rechargeBtn.disabled = true;

    menuElements.blackScreen.style.display = 'block';

    setTimeout(() => {
        menuElements.blackScreen.style.display = 'none';

        elements.gameOverScreen.style.display = 'flex';
        elements.gameOverAnimatronic.style.display = 'none';
        elements.gameOverText.textContent = 'GAME OVER';
    }, 1000);
}

function gameOver(image) {
    if (GameState.isGameOver) return;

    GameState.isGameOver = true;

    clearInterval(GameState.energyDrainInterval);
    clearInterval(GameState.animatronicMoveInterval);
    clearInterval(GameState.gameTimeInterval);

    if (GameState.doorAttackTimer) {
        clearTimeout(GameState.doorAttackTimer);
        GameState.doorAttackTimer = null;
    }
    if (GameState.rechargeTimer) {
        clearInterval(GameState.rechargeTimer);
        GameState.rechargeTimer = null;
    }
    if (GameState.redAttackTimer) {
        clearTimeout(GameState.redAttackTimer);
        GameState.redAttackTimer = null;
    }
    if (GameState.doorAtDoorTimer) {
        clearTimeout(GameState.doorAtDoorTimer);
        GameState.doorAtDoorTimer = null;
    }
    if (GameState.animatronicCooldownTimer) {
        clearTimeout(GameState.animatronicCooldownTimer);
        GameState.animatronicCooldownTimer = null;
    }

    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.disabled = true;
    });

    elements.rechargeBtn.disabled = true;

    // Usa a imagem do animatrônico que causou o game over na tela final
    const gameOverImage = image || ANIMATRONIC_IMAGE;
    elements.gameOverScreen.style.display = 'flex';
    elements.gameOverAnimatronic.style.display = 'block';
    elements.gameOverAnimatronic.style.backgroundImage = `url("${gameOverImage}")`;
    elements.gameOverText.textContent = 'GAME OVER';
}

// ==================== ANIMATRÔNICO VERMELHO ====================
// Aparece raramente (45–90s), APENAS na porta direita.
// Ao aparecer, dispara imediatamente 1s de countdown para game over.
// Fechar a porta direita ANTES do 1s acabar cancela o ataque.

function spawnRedAnimatronic() {
    if (GameState.isGameOver) return;
    if (GameState.redAnimatronicAtDoor) return;

    GameState.redAnimatronicAtDoor = true;
    updateRedAnimatronicVisibility();

    // Inicia o ataque imediatamente — porta aberta ou fechada
    startRedAttackTimer();
}

function updateRedAnimatronicVisibility() {
    if (GameState.redAnimatronicAtDoor) {
        elements.animatronicRedDoor.style.display = 'block';
        elements.animatronicRedDoor.style.backgroundImage = `url("${ANIMATRONIC_RED_IMAGE}")`;
        elements.animatronicRedDoor.style.right = '2%';
        elements.animatronicRedDoor.style.left = 'auto';
        elements.animatronicRedDoor.style.transform = 'scaleX(1)';
    } else {
        elements.animatronicRedDoor.style.display = 'none';
    }
}

function startRedAttackTimer() {
    if (GameState.redAttackTimer) return;

    // 1s para o jogador fechar a porta — se não fechar, game over
    GameState.redAttackTimer = setTimeout(() => {
        GameState.redAttackTimer = null;
        if (!GameState.isGameOver && GameState.redAnimatronicAtDoor) {
            jumpscare(ANIMATRONIC_RED_IMAGE);
        }
    }, 1000);
}

function dismissRedAnimatronic() {
    // Jogador fechou a porta a tempo
    GameState.redAnimatronicAtDoor = false;
    updateRedAnimatronicVisibility();

    if (GameState.redAttackTimer) {
        clearTimeout(GameState.redAttackTimer);
        GameState.redAttackTimer = null;
    }
}

function scheduleRedAnimatronic() {
    if (GameState.isGameOver) return;

    // Intervalo longo: 45–90 segundos entre aparições
    const delay = 45000 + Math.random() * 45000;

    setTimeout(() => {
        if (GameState.isGameOver) return;

        spawnRedAnimatronic();

        // Agenda a próxima aparição após esta ser resolvida (game over ou dismiss)
        // O scheduleRedAnimatronic recursivo só roda se o jogador sobreviveu
        setTimeout(() => {
            if (!GameState.isGameOver) {
                // Remove o vermelho se ainda estiver lá (não deveria, mas por segurança)
                if (GameState.redAnimatronicAtDoor) {
                    dismissRedAnimatronic();
                }
                scheduleRedAnimatronic();
            }
        }, 3000);
    }, delay);
}

// ==================== TEMPO DO JOGO (6:00 AM até 9:00 AM) ====================
function updateTimeDisplay() {
    const totalMinutes = 180;

    const gameMinutes = Math.floor((GameState.time / totalMinutes) * totalMinutes);

    const hours = Math.floor(gameMinutes / 60) + 6;
    const minutes = gameMinutes % 60;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours;

    elements.timeDisplay.textContent = `${displayHours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

    GameState.time += 1;

    if (GameState.time >= totalMinutes && !GameState.isGameOver) {
        winGame();
    }
}

function winGame() {
    alert("Parabéns! Você sobreviveu até as 9:00 AM!");
    goToMenu();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(console.log);
        elements.fullscreenBtn.textContent = 'SAIR TELA CHEIA';
    } else {
        document.exitFullscreen();
        elements.fullscreenBtn.textContent = 'TELA CHEIA';
    }
}

function startGameSystems() {
    clearInterval(GameState.energyDrainInterval);
    clearInterval(GameState.animatronicMoveInterval);
    clearInterval(GameState.gameTimeInterval);

    GameState.energyDrainInterval = setInterval(drainEnergy, 1500);
    GameState.animatronicMoveInterval = setInterval(moveAnimatronic, 3500 + Math.random() * 3500);
    GameState.gameTimeInterval = setInterval(updateTimeDisplay, 1500);

    // Inicia o ciclo de aparição do animatrônico vermelho
    scheduleRedAnimatronic();
}

function playStaticEffect() {
    const overlay = document.getElementById('vhs-overlay');
    overlay.style.opacity = '0.4';
    setTimeout(() => {
        overlay.style.opacity = '0.3';
    }, 100);
}

// ==================== INICIAR TUDO ====================
window.addEventListener('load', () => {
    initMenu();

    elements.leftDoorBtn.addEventListener('click', toggleLeftDoor);
    elements.rightDoorBtn.addEventListener('click', () => {
        const wasOpen = GameState.rightDoorOpen;
        toggleRightDoor();
        // Se fechou a porta enquanto o vermelho estava lá → cancela o ataque
        if (wasOpen && !GameState.rightDoorOpen && GameState.redAnimatronicAtDoor) {
            dismissRedAnimatronic();
        }
    });
    elements.monitorBtn.addEventListener('click', toggleMonitor);
    elements.restartBtn.addEventListener('click', goToMenu);
    elements.rechargeBtn.addEventListener('click', rechargeEnergy);
    elements.fullscreenBtn.addEventListener('click', toggleFullscreen);

    elements.cameraButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (GameState.isGameOver) return;
            switchCamera(parseInt(btn.dataset.camera));
        });
    });

    document.addEventListener('keydown', (e) => {
        if (GameState.isGameOver) return;

        switch(e.key.toLowerCase()) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                if (GameState.isMonitorActive) {
                    switchCamera(parseInt(e.key));
                }
                break;
            case 'q':
                toggleLeftDoor();
                break;
            case 'e': {
                const wasOpen = GameState.rightDoorOpen;
                toggleRightDoor();
                if (wasOpen && !GameState.rightDoorOpen && GameState.redAnimatronicAtDoor) {
                    dismissRedAnimatronic();
                }
                break;
            }
            case 'm':
                toggleMonitor();
                break;
            case 'r':
                rechargeEnergy();
                break;
            case 'escape':
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
                break;
        }
    });

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
});
