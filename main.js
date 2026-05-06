import * as THREE from 'three';
import { Monkey, Obstacle, Coin, Environment, Particle } from './src/game.js';

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
let particles = [];
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
    particles = [];
    score = 0;
    gameSpeed = 0.3;
    frameCount = 0;
    currentScoreEl.innerText = score;
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

        // Spawn
        if (frameCount % 60 === 0) {
            const lane = Math.floor(Math.random() * 3);
            obstacles.push(new Obstacle(scene, gameSpeed, lane));
            gameSpeed += 0.0005;
        }
        if (frameCount % 40 === 0) {
            const lane = Math.floor(Math.random() * 3);
            coins.push(new Coin(scene, gameSpeed, lane));
        }

        // Update Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.update();

            // Collision detection
            const dz = Math.abs(monkey.mesh.position.z - obs.mesh.position.z);
            const dx = Math.abs(monkey.mesh.position.x - obs.mesh.position.x);
            
            if (dz < 1 && dx < 1.5) {
                // Check if jumping/sliding correctly
                let hit = true;
                if (obs.type === 'HIGH' && monkey.isJumping) hit = false;
                if (obs.type === 'LOW' && monkey.isSliding) hit = false;
                
                if (hit) {
                    shakeTime = 20;
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
            coin.update();

            const dz = Math.abs(monkey.mesh.position.z - coin.mesh.position.z);
            const dx = Math.abs(monkey.mesh.position.x - coin.mesh.position.x);
            const dy = Math.abs(monkey.mesh.position.y - coin.mesh.position.y);

            if (dz < 1 && dx < 1 && dy < 2) {
                for (let j = 0; j < 12; j++) {
                    particles.push(new Particle(scene, coin.mesh.position.x, coin.mesh.position.y, coin.mesh.position.z, 0xfbbf24));
                }
                coin.remove();
                coins.splice(i, 1);
                score += 50;
                currentScoreEl.innerText = score;
            }

            if (coin.mesh.position.z > 20) {
                coin.remove();
                coins.splice(i, 1);
            }
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

        // Dynamic Camera
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, monkey.mesh.position.x * 0.5, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 5 + (monkey.mesh.position.y * 0.1), 0.05);
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
