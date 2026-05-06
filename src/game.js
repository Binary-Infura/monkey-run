import * as THREE from 'three';

export class Monkey {
    constructor(scene) {
        this.scene = scene;
        
        // Create a stylized 3D Monkey using primitives
        this.mesh = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.8;
        this.mesh.add(body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.y = 1.6;
        this.mesh.add(head);
        
        // Ears
        const earGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const leftEar = new THREE.Mesh(earGeo, bodyMat);
        leftEar.position.set(0.5, 1.7, 0);
        this.mesh.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeo, bodyMat);
        rightEar.position.set(-0.5, 1.7, 0);
        this.mesh.add(rightEar);

        // Eyes (Glow)
        const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(0.2, 1.7, 0.5);
        this.mesh.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(-0.2, 1.7, 0.5);
        this.mesh.add(rightEye);
        
        // Lane positions: -3, 0, 3
        this.lanes = [-3, 0, 3];
        this.currentLane = 1; // Middle
        this.targetX = 0;
        
        this.mesh.position.set(0, 1, 0);
        
        this.dy = 0;
        this.jumpForce = 0.25;
        this.gravity = 0.01;
        this.groundY = 1;
        this.isJumping = false;
        
        this.isSliding = false;
        this.slideTime = 0;
        
        this.scene.add(this.mesh);
        
        // Add a small light following the monkey
        this.light = new THREE.PointLight(0x00ffff, 2, 10);
        this.light.position.set(0, 2, 1);
        this.scene.add(this.light);
    }

    moveLeft() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.targetX = this.lanes[this.currentLane];
        }
    }

    moveRight() {
        if (this.currentLane < 2) {
            this.currentLane++;
            this.targetX = this.lanes[this.currentLane];
        }
    }

    jump() {
        if (!this.isJumping && !this.isSliding) {
            this.dy = this.jumpForce;
            this.isJumping = true;
        }
    }

    slide() {
        if (!this.isJumping && !this.isSliding) {
            this.isSliding = true;
            this.slideTime = 60;
            this.mesh.scale.y = 0.5;
            this.mesh.position.y = 0.5;
        }
    }

    update() {
        // Smooth lane transition
        this.mesh.position.x = THREE.MathUtils.lerp(this.mesh.position.x, this.targetX, 0.2);
        
        // Jump physics
        if (this.isJumping) {
            this.mesh.position.y += this.dy;
            this.dy -= this.gravity;
            
            if (this.mesh.position.y <= this.groundY) {
                this.mesh.position.y = this.groundY;
                this.dy = 0;
                this.isJumping = false;
            }
            // Rotate monkey during jump
            this.mesh.rotation.x -= 0.1;
        } else if (this.isSliding) {
            this.slideTime--;
            if (this.slideTime <= 0) {
                this.isSliding = false;
                this.mesh.scale.y = 1.0;
                this.mesh.position.y = this.groundY;
            }
        } else {
            this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, 0.1);
            // Gentle running wobble
            this.mesh.rotation.z = Math.sin(Date.now() * 0.01) * 0.1;
            this.mesh.position.y = this.groundY + Math.abs(Math.sin(Date.now() * 0.01)) * 0.1;
        }
        
        this.light.position.x = this.mesh.position.x;
        this.light.position.y = this.mesh.position.y + 1;
    }
}

export class Obstacle {
    constructor(scene, speed, lane) {
        this.scene = scene;
        this.lanes = [-3, 0, 3];
        const type = Math.random() > 0.5 ? 'HIGH' : 'LOW';
        
        let geometry;
        if (type === 'HIGH') {
            geometry = new THREE.BoxGeometry(2.5, 0.8, 1); // Hurdle
            this.y = 1;
        } else {
            geometry = new THREE.BoxGeometry(2.5, 4, 1); // Arch
            this.y = 3;
        }

        const material = new THREE.MeshStandardMaterial({ 
            color: 0xef4444,
            emissive: 0x991b1b,
            emissiveIntensity: 1.0
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.lanes[lane], this.y, -100);
        this.speed = speed;
        this.type = type;
        this.scene.add(this.mesh);
    }

    update() {
        this.mesh.position.z += this.speed;
    }

    remove() {
        this.scene.remove(this.mesh);
    }
}

export class Coin {
    constructor(scene, speed, lane) {
        this.scene = scene;
        this.lanes = [-3, 0, 3];
        
        // 3D Golden Banana (Cylinder-like)
        const geometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xfbbf24,
            emissive: 0xb45309,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = Math.PI / 2;
        this.mesh.position.set(this.lanes[lane], 1.5, -100);
        this.speed = speed;
        this.scene.add(this.mesh);
    }

    update() {
        this.mesh.position.z += this.speed;
        this.mesh.rotation.y += 0.05;
        this.mesh.position.y = 1.5 + Math.sin(Date.now() * 0.005) * 0.2;
    }

    remove() {
        this.scene.remove(this.mesh);
    }
}

export class Particle {
    constructor(scene, x, y, z, color) {
        this.scene = scene;
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        
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
        this.tiles = [];
        this.tileLength = 50;
        this.numTiles = 5;
        
        const textureLoader = new THREE.TextureLoader();
        const pathTexture = textureLoader.load('/assets/images/path.png');
        pathTexture.wrapS = THREE.RepeatWrapping;
        pathTexture.wrapT = THREE.RepeatWrapping;
        pathTexture.repeat.set(1, 5);

        for (let i = 0; i < this.numTiles; i++) {
            this.addTile(i * -this.tileLength, pathTexture);
        }

        // Ambient Light
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        // Directional Light
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(10, 20, 10);
        sun.castShadow = true;
        this.scene.add(sun);
        
        // Fog
        this.scene.fog = new THREE.FogExp2(0x020617, 0.02);
    }

    addTile(z, texture) {
        const geometry = new THREE.PlaneGeometry(10, this.tileLength);
        const material = new THREE.MeshStandardMaterial({ 
            map: texture,
            roughness: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(0, 0, z);
        this.scene.add(mesh);
        
        // Walls
        const wallGeo = new THREE.BoxGeometry(2, 12, this.tileLength);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x064e3b });
        
        const leftWall = new THREE.Mesh(wallGeo, wallMat);
        leftWall.position.set(-6, 6, z);
        this.scene.add(leftWall);
        
        const rightWall = new THREE.Mesh(wallGeo, wallMat);
        rightWall.position.set(6, 6, z);
        this.scene.add(rightWall);

        this.tiles.push({ path: mesh, leftWall, rightWall });
    }

    update(speed) {
        for (let tile of this.tiles) {
            tile.path.position.z += speed;
            tile.leftWall.position.z += speed;
            tile.rightWall.position.z += speed;
            
            if (tile.path.position.z > this.tileLength) {
                tile.path.position.z -= this.numTiles * this.tileLength;
                tile.leftWall.position.z -= this.numTiles * this.tileLength;
                tile.rightWall.position.z -= this.numTiles * this.tileLength;
            }
        }
    }
}
