import * as THREE from 'three';
import { Monkey, Obstacle, Coin, Environment, Particle } from './src/game.js';

// Setup Three.js
const canvas = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020617);
scene.fog = new THREE.Fog(0x020617, 10, 30);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 8);
camera.lookAt(0, 1, 0);

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
let gameSpeed = 5;
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
    // Clear scene (except lights if needed, but we re-init environment)
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }

    environment = new Environment(scene);
    monkey = new Monkey(scene);
    obstacles = [];
    coins = [];
    particles = [];
    score = 0;
    gameSpeed = 5;
    frameCount = 0;
    currentScoreEl.innerText = score;
}

// Input
function handleInput() {
    if (gameState === 'PLAYING') {
        monkey.jump();
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') handleInput();
});
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput();
});

// Game Loop
function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'PLAYING') {
        frameCount++;
        monkey.update();

        // Screen Shake
        if (shakeTime > 0) {
            camera.position.x += (Math.random() - 0.5) * 0.1;
            camera.position.y += (Math.random() - 0.5) * 0.1;
            shakeTime--;
        }

        // Spawn
        if (frameCount % 100 === 0) {
            obstacles.push(new Obstacle(scene, gameSpeed));
            gameSpeed += 0.05;
        }
        if (frameCount % 150 === 0) {
            coins.push(new Coin(scene, gameSpeed));
        }

        // Update Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.update();

            const dx = monkey.mesh.position.x - obs.mesh.position.x;
            const dy = monkey.mesh.position.y - obs.mesh.position.y;
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                shakeTime = 15;
                endGame();
            }

            if (obs.mesh.position.x < -15) {
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

            const dx = monkey.mesh.position.x - coin.mesh.position.x;
            const dy = monkey.mesh.position.y - coin.mesh.position.y;
            if (Math.abs(dx) < 0.8 && Math.abs(dy) < 0.8) {
                for (let j = 0; j < 12; j++) {
                    particles.push(new Particle(scene, coin.mesh.position.x, coin.mesh.position.y, 0xfbbf24));
                }
                coin.remove();
                coins.splice(i, 1);
                score += 50;
                currentScoreEl.innerText = score;
            }

            if (coin.mesh.position.x < -15) {
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
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, monkey.mesh.position.x * 0.1, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 3 + (monkey.mesh.position.y * 0.2), 0.05);
        camera.lookAt(0, 1, 0);
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
