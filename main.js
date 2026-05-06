import * as THREE from 'three';
import { Monkey, Obstacle, Coin, Environment, Particle, PowerUp, WindStreak } from './src/game.js';

// Setup Three.js
const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020617);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// UI Elements
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const hud = document.getElementById('hud');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const currentScoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score');

// Game State
let gameState = 'START';
let score = 0;
let highScore = localStorage.getItem('monkeyRunHighScore') || 0;
let gameSpeed = 0.3;
let frameCount = 0;
let monkey;
let environment;
let obstacles = [];
let coins = [];
let powerups = [];
let activePowerup = null;
let powerupTimer = 0;
let particles = [];
let fireflies = [];
let windStreaks = [];
let shakeTime = 0;

highScoreEl.innerText = highScore;

// Resize
function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
window.addEventListener('resize', resize);
resize();

// Init
function init() {
    // Clear scene
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }

    environment = new Environment(scene);
    monkey = new Monkey(scene);
    obstacles = [];
    coins = [];
    powerups = [];
    activePowerup = null;
    powerupTimer = 0;
    particles = [];
    fireflies = [];
    score = 0;
    gameSpeed = 0.22;
    frameCount = 0;
    currentScoreEl.innerText = score;
    
    // Hide powerup UI
    document.getElementById('powerup-container').classList.add('hidden');

    // Add Fireflies
    for (let i = 0; i < 20; i++) {
        const light = new THREE.PointLight(0x00ffff, 0.5, 5);
        light.position.set(
            (Math.random() - 0.5) * 20,
            2 + Math.random() * 5,
            -Math.random() * 100
        );
        scene.add(light);
        fireflies.push({
            light,
            offset: Math.random() * Math.PI * 2,
            speed: 0.01 + Math.random() * 0.02
        });
    }

    // Add Wind Streaks
    windStreaks = [];
    for (let i = 0; i < 15; i++) {
        windStreaks.push(new WindStreak(scene));
    }
}

// Input
function handleInput(key) {
    if (gameState !== 'PLAYING') return;

    switch(key) {
        case 'ArrowLeft':
        case 'KeyA':
            monkey.moveLeft();
            break;
        case 'ArrowRight':
        case 'KeyD':
            monkey.moveRight();
            break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
            monkey.jump();
            break;
        case 'ArrowDown':
        case 'KeyS':
            monkey.slide();
            break;
    }
}

window.addEventListener('keydown', (e) => handleInput(e.code));

// Touch Handling
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) handleInput('ArrowRight');
        else if (dx < -30) handleInput('ArrowLeft');
    } else {
        if (dy > 30) handleInput('ArrowDown');
        else if (dy < -30) handleInput('ArrowUp');
    }
}, { passive: false });

// Game Loop
function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'PLAYING') {
        frameCount++;
        monkey.update();
        environment.update(gameSpeed);

        // Screen Shake
        if (shakeTime > 0) {
            camera.position.x += (Math.random() - 0.5) * 0.1;
            camera.position.y += (Math.random() - 0.5) * 0.1;
            shakeTime--;
        }

        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            if (p.life <= 0) {
                p.remove();
                particles.splice(i, 1);
            }
        }

        // Update Fireflies
        fireflies.forEach(f => {
            f.offset += f.speed;
            f.light.position.x += Math.sin(f.offset) * 0.05;
            f.light.position.y += Math.cos(f.offset) * 0.05;
            f.light.position.z += gameSpeed;
            if (f.light.position.z > 10) f.light.position.z = -100;
        });

        // Update Wind Streaks
        windStreaks.forEach(w => w.update(gameSpeed));

        // Spawn
        if (frameCount % 50 === 0) {
            const lane = Math.floor(Math.random() * 3);
            obstacles.push(new Obstacle(scene, gameSpeed, lane));
            gameSpeed += 0.0004;
        }
        if (frameCount % 30 === 0) {
            const lane = Math.floor(Math.random() * 3);
            coins.push(new Coin(scene, gameSpeed, lane));
        }
        if (frameCount % 600 === 0) {
            const lane = Math.floor(Math.random() * 3);
            const type = Math.random() > 0.5 ? 'MAGNET' : 'TURBO';
            powerups.push(new PowerUp(scene, gameSpeed, lane, type));
        }

        // Powerup Logic
        if (activePowerup) {
            powerupTimer--;
            const progress = (powerupTimer / 600) * 100;
            document.getElementById('powerup-progress').style.width = `${progress}%`;
            
            if (powerupTimer <= 0) {
                if (activePowerup === 'TURBO') gameSpeed -= 0.12;
                activePowerup = null;
                document.getElementById('powerup-container').classList.add('hidden');
            }
        }

        // Update Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.update();

            const dz = Math.abs(monkey.mesh.position.z - obs.mesh.position.z);
            const dx = Math.abs(monkey.mesh.position.x - obs.mesh.position.x);
            
            if (dz < 1.2 && dx < 1.5) {
                if (activePowerup === 'TURBO') {
                    // Smash obstacle
                    obs.remove();
                    obstacles.splice(i, 1);
                    shakeTime = 10;
                    for (let j = 0; j < 15; j++) {
                        particles.push(new Particle(scene, obs.mesh.position.x, obs.mesh.position.y, obs.mesh.position.z, 0xffffff, 0.3));
                    }
                    score += 20;
                    continue;
                }

                let hit = true;
                if (obs.type === 'HIGH' && monkey.isJumping) hit = false;
                if (obs.type === 'LOW' && (monkey.isSliding || monkey.isJumping)) hit = false; 
                
                if (hit) {
                    shakeTime = 30;
                    for (let j = 0; j < 20; j++) {
                        particles.push(new Particle(scene, monkey.mesh.position.x, monkey.mesh.position.y, monkey.mesh.position.z, 0xef4444, 0.5));
                    }
                    endGame();
                }
            }

            if (obs.mesh.position.z > 20) {
                obs.remove();
                obstacles.splice(i, 1);
                score += 10;
                currentScoreEl.innerText = score;
            }
        }

        // Update Coins
        for (let i = coins.length - 1; i >= 0; i--) {
            const coin = coins[i];
            
            // Magnet logic
            if (activePowerup === 'MAGNET') {
                const dist = coin.mesh.position.distanceTo(monkey.mesh.position);
                if (dist < 15) {
                    coin.mesh.position.lerp(monkey.mesh.position, 0.15);
                }
            }
            
            coin.update();

            const dz = Math.abs(monkey.mesh.position.z - coin.mesh.position.z);
            const dx = Math.abs(monkey.mesh.position.x - coin.mesh.position.x);
            const dy = Math.abs(monkey.mesh.position.y - coin.mesh.position.y);

            if (dz < 1.5 && dx < 1.5 && dy < 2.5) {
                for (let j = 0; j < 8; j++) {
                    particles.push(new Particle(scene, coin.mesh.position.x, coin.mesh.position.y, coin.mesh.position.z, 0xfbbf24));
                }
                coin.remove();
                coins.splice(i, 1);
                score += 50;
                currentScoreEl.innerText = score;
                shakeTime = 5;
            }

            if (coin.mesh.position.z > 20) {
                coin.remove();
                coins.splice(i, 1);
            }
        }

        // Update Powerups
        for (let i = powerups.length - 1; i >= 0; i--) {
            const pu = powerups[i];
            pu.update();

            const dz = Math.abs(monkey.mesh.position.z - pu.mesh.position.z);
            const dx = Math.abs(monkey.mesh.position.x - pu.mesh.position.x);

            if (dz < 1.5 && dx < 1.5) {
                const pColor = pu.type === 'MAGNET' ? 0x06b6d4 : 0xec4899;
                for (let j = 0; j < 25; j++) {
                    particles.push(new Particle(scene, pu.mesh.position.x, pu.mesh.position.y, pu.mesh.position.z, pColor, 0.4));
                }
                
                activePowerup = pu.type;
                powerupTimer = 600;
                if (activePowerup === 'TURBO') gameSpeed += 0.12;
                
                pu.remove();
                powerups.splice(i, 1);
                
                document.getElementById('powerup-container').classList.remove('hidden');
                document.getElementById('powerup-label').innerText = pu.type;
                const progressFill = document.getElementById('powerup-progress');
                progressFill.style.background = activePowerup === 'MAGNET' ? 'linear-gradient(90deg, #06b6d4, #0891b2)' : 'linear-gradient(90deg, #ec4899, #db2777)';
            }

            if (pu.mesh.position.z > 20) {
                pu.remove();
                powerups.splice(i, 1);
            }
        }

        // Dynamic Camera
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, monkey.mesh.position.x * 0.4, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4.5 + (monkey.mesh.position.y * 0.1), 0.05);
        camera.lookAt(0, 2, -5);
    }

    renderer.render(scene, camera);
}

function startGame() {
    gameState = 'PLAYING';
    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    hud.classList.remove('hidden');
    init();
}

function endGame() {
    gameState = 'GAME_OVER';
    gameOverOverlay.classList.remove('hidden');
    hud.classList.add('hidden');
    finalScoreEl.innerText = score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('monkeyRunHighScore', highScore);
        highScoreEl.innerText = highScore;
    }
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

animate();
