import * as THREE from 'three';

export class Monkey {
    constructor(scene) {
        this.scene = scene;
        const textureLoader = new THREE.TextureLoader();
        const monkeyTexture = textureLoader.load('/assets/images/monkey.png');
        
        const material = new THREE.SpriteMaterial({ map: monkeyTexture });
        this.mesh = new THREE.Sprite(material);
        this.mesh.scale.set(2, 2, 1);
        this.mesh.position.set(-5, 0, 0);
        
        this.dy = 0;
        this.jumpForce = 0.25;
        this.gravity = 0.01;
        this.groundY = 0;
        this.isJumping = false;
        
        this.scene.add(this.mesh);
        
        // Add a small light following the monkey
        this.light = new THREE.PointLight(0xfbbf24, 1, 10);
        this.light.position.set(-5, 1, 2);
        this.scene.add(this.light);
    }

    jump() {
        if (!this.isJumping) {
            this.dy = this.jumpForce;
            this.isJumping = true;
        }
    }

    update() {
        this.mesh.position.y += this.dy;
        this.light.position.y = this.mesh.position.y + 1;
        
        if (this.mesh.position.y > this.groundY) {
            this.dy -= this.gravity;
        } else {
            this.mesh.position.y = this.groundY;
            this.dy = 0;
            this.isJumping = false;
        }
    }
}

export class Obstacle {
    constructor(scene, speed) {
        this.scene = scene;
        const geometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xef4444,
            emissive: 0x991b1b,
            emissiveIntensity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(15, 0.75, 0);
        this.speed = speed * 0.02; // Scale speed for 3D units
        this.scene.add(this.mesh);
    }

    update() {
        this.mesh.position.x -= this.speed;
    }

    remove() {
        this.scene.remove(this.mesh);
    }
}

export class Coin {
    constructor(scene, speed) {
        this.scene = scene;
        const textureLoader = new THREE.TextureLoader();
        const coinTexture = textureLoader.load('/assets/images/coin.png');
        
        const material = new THREE.SpriteMaterial({ map: coinTexture });
        this.mesh = new THREE.Sprite(material);
        this.mesh.scale.set(1, 1, 1);
        this.mesh.position.set(15, 1.5 + Math.random() * 2, 0);
        this.speed = speed * 0.02;
        this.bobAmount = 0;
        this.bobSpeed = Math.random() * 0.05 + 0.02;
        
        this.scene.add(this.mesh);
    }

    update() {
        this.mesh.position.x -= this.speed;
        this.bobAmount += this.bobSpeed;
        this.mesh.position.y += Math.sin(this.bobAmount) * 0.01;
    }

    remove() {
        this.scene.remove(this.mesh);
    }
}

export class Particle {
    constructor(scene, x, y, color) {
        this.scene = scene;
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, 0);
        
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        this.life = 1.0;
        this.scene.add(this.mesh);
    }

    update() {
        this.mesh.position.add(this.velocity);
        this.life -= 0.02;
        this.mesh.scale.setScalar(this.life);
    }

    remove() {
        this.scene.remove(this.mesh);
    }
}

export class Environment {
    constructor(scene) {
        this.scene = scene;
        
        // Ground
        const groundGeo = new THREE.PlaneGeometry(200, 40);
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x064e3b, 
            roughness: 0.9,
            metalness: 0.1
        });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -0.5;
        this.scene.add(this.ground);

        // Decorative background trees (simple cones)
        for (let i = 0; i < 20; i++) {
            const treeGeo = new THREE.ConeGeometry(1, 4, 8);
            const treeMat = new THREE.MeshStandardMaterial({ color: 0x065f46 });
            const tree = new THREE.Mesh(treeGeo, treeMat);
            tree.position.set(
                Math.random() * 200 - 100,
                1.5,
                -10 - Math.random() * 20
            );
            this.scene.add(tree);
        }

        // Ambient Light
        const ambient = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambient);

        // Directional Light
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(10, 20, 10);
        this.scene.add(sun);
    }
}

