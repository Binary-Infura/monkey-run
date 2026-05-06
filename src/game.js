import * as THREE from 'three';

export class Monkey {
    constructor(scene) {
        this.scene = scene;
        
        // Create a detailed stylized 3D Monkey
        this.mesh = new THREE.Group();
        
        // Body (Lower)
        const bodyGeo = new THREE.SphereGeometry(0.7, 16, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.7;
        body.scale.set(1, 1.2, 0.9);
        this.mesh.add(body);
        
        // Chest (Lighter brown)
        const chestGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const chestMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
        const chest = new THREE.Mesh(chestGeo, chestMat);
        chest.position.set(0, 0.8, 0.4);
        chest.scale.set(1, 1.2, 0.5);
        this.mesh.add(chest);

        // Head
        const headGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.y = 1.6;
        this.mesh.add(head);
        
        // Face Mask (Lighter brown)
        const maskGeo = new THREE.SphereGeometry(0.45, 16, 16);
        const mask = new THREE.Mesh(maskGeo, chestMat);
        mask.position.set(0, 1.6, 0.2);
        mask.scale.set(1.1, 1, 0.8);
        this.mesh.add(mask);

        // Ears
        const earGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const leftEar = new THREE.Mesh(earGeo, bodyMat);
        leftEar.position.set(0.55, 1.7, 0);
        this.mesh.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeo, bodyMat);
        rightEar.position.set(-0.55, 1.7, 0);
        this.mesh.add(rightEar);

        // Eyes (Vibrant Cyan)
        const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(0.2, 1.7, 0.55);
        this.mesh.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(-0.2, 1.7, 0.55);
        this.mesh.add(rightEye);
        
        // Arms
        const armGeo = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
        this.leftArm = new THREE.Mesh(armGeo, bodyMat);
        this.leftArm.position.set(0.8, 1.1, 0);
        this.mesh.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, bodyMat);
        this.rightArm.position.set(-0.8, 1.1, 0);
        this.mesh.add(this.rightArm);

        // Legs
        const legGeo = new THREE.CapsuleGeometry(0.18, 0.5, 4, 8);
        this.leftLeg = new THREE.Mesh(legGeo, bodyMat);
        this.leftLeg.position.set(0.4, 0.3, 0);
        this.mesh.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, bodyMat);
        this.rightLeg.position.set(-0.4, 0.3, 0);
        this.mesh.add(this.rightLeg);
        
        // Tail
        const tailCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 0.5, -0.6),
            new THREE.Vector3(0, 1.0, -1.5),
            new THREE.Vector3(0, 2.0, -1.0),
            new THREE.Vector3(0, 2.5, -1.8)
        );
        const tailGeo = new THREE.TubeGeometry(tailCurve, 20, 0.08, 8, false);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        this.mesh.add(tail);

        // Lane positions: -3, 0, 3
        this.lanes = [-3, 0, 3];
        this.currentLane = 1; // Middle
        this.targetX = 0;
        
        this.mesh.position.set(0, 1, 0);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        this.dy = 0;
        this.jumpForce = 0.24;
        this.gravity = 0.01;
        this.groundY = 1;
        this.isJumping = false;
        
        this.isSliding = false;
        this.slideTime = 0;
        
        this.scene.add(this.mesh);
        
        // Add a warm light following the monkey
        this.light = new THREE.PointLight(0xf59e0b, 4, 15);
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
            // Dynamic Running Animation
            const time = Date.now() * 0.012;
            this.mesh.rotation.z = Math.sin(time) * 0.05;
            this.mesh.position.y = this.groundY + Math.abs(Math.sin(time)) * 0.15;
            
            // Animate limbs
            this.leftArm.rotation.x = Math.sin(time) * 0.8;
            this.rightArm.rotation.x = -Math.sin(time) * 0.8;
            this.leftLeg.rotation.x = -Math.sin(time) * 0.8;
            this.rightLeg.rotation.x = Math.sin(time) * 0.8;
        }
        
        this.light.position.x = this.mesh.position.x;
        this.light.position.y = this.mesh.position.y + 1.5;
        this.light.position.z = this.mesh.position.z + 1;
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
            emissive: 0xef4444,
            emissiveIntensity: 0.2
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
    constructor(scene, x, y, z, color, speed = 0.2) {
        this.scene = scene;
        const geometry = new THREE.SphereGeometry(0.12, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * speed,
            (Math.random() - 0.5) * speed,
            (Math.random() - 0.5) * speed
        );
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
        this.scene.add(this.mesh);
    }

    update() {
        this.mesh.position.add(this.velocity);
        this.velocity.y -= 0.005; // Gravity
        this.life -= this.decay;
        this.mesh.scale.setScalar(this.life);
        this.mesh.material.opacity = this.life;
    }

    remove() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}

export class PowerUp {
    constructor(scene, speed, lane, type = 'MAGNET') {
        this.scene = scene;
        this.lanes = [-3, 0, 3];
        this.type = type;
        
        const color = type === 'MAGNET' ? 0x06b6d4 : 0xec4899;
        const geometry = new THREE.OctahedronGeometry(0.6);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 1.0,
            wireframe: false
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.lanes[lane], 1.5, -100);
        this.speed = speed;
        
        // Halo
        const haloGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 24);
        const haloMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
        this.halo = new THREE.Mesh(haloGeo, haloMat);
        this.mesh.add(this.halo);
        
        this.scene.add(this.mesh);
    }

    update() {
        this.mesh.position.z += this.speed;
        this.mesh.rotation.y += 0.1;
        this.mesh.rotation.x += 0.05;
        this.halo.rotation.z += 0.05;
        this.mesh.position.y = 1.5 + Math.sin(Date.now() * 0.008) * 0.3;
    }

    remove() {
        this.scene.remove(this.mesh);
    }
}

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.tiles = [];
        this.tileLength = 60;
        this.numTiles = 6;
        
        // Background Plane
        const bgGeo = new THREE.PlaneGeometry(200, 200);
        const bgMat = new THREE.MeshBasicMaterial({ 
            color: 0xf1f5f9,
            transparent: true,
            opacity: 1
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -150;
        this.scene.add(bg);

        for (let i = 0; i < this.numTiles; i++) {
            this.addTile(i * -this.tileLength);
        }

        // Ambient Light (Bright for Light Mode)
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambient);

        // Bright Sunlight
        const sun = new THREE.DirectionalLight(0xffffff, 1.2);
        sun.position.set(20, 30, 20);
        sun.castShadow = true;
        this.scene.add(sun);
        
        // Soft Blue/White Fog
        this.scene.fog = new THREE.FogExp2(0xf1f5f9, 0.015);
    }

    createTree(x, z) {
        const tree = new THREE.Group();
        
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 6, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 3;
        tree.add(trunk);
        
        // Leaves (Low poly canopy)
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x064e3b });
        for (let i = 0; i < 3; i++) {
            const leafGeo = new THREE.ConeGeometry(2 - i * 0.4, 2.5, 8);
            const leaves = new THREE.Mesh(leafGeo, leafMat);
            leaves.position.y = 5 + i * 1.2;
            tree.add(leaves);
        }
        
        tree.position.set(x, 0, z);
        return tree;
    }

    addTile(z) {
        const group = new THREE.Group();
        
        // Path (Light Gray)
        const pathGeo = new THREE.PlaneGeometry(10, this.tileLength);
        const pathMat = new THREE.MeshStandardMaterial({ 
            color: 0xe2e8f0,
            roughness: 0.7
        });
        const path = new THREE.Mesh(pathGeo, pathMat);
        path.rotation.x = -Math.PI / 2;
        group.add(path);
        
        // Curbs (Warm Golden edges)
        const curbGeo = new THREE.BoxGeometry(0.2, 0.4, this.tileLength);
        const curbMat = new THREE.MeshStandardMaterial({ 
            color: 0xf59e0b, 
            emissive: 0xf59e0b,
            emissiveIntensity: 0.3
        });
        
        const leftCurb = new THREE.Mesh(curbGeo, curbMat);
        leftCurb.position.set(-5, 0.2, 0);
        group.add(leftCurb);
        
        const rightCurb = new THREE.Mesh(curbGeo, curbMat);
        rightCurb.position.set(5, 0.2, 0);
        group.add(rightCurb);

        // Add trees on the sides
        for (let i = 0; i < 4; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            const treeZ = (Math.random() - 0.5) * this.tileLength;
            const treeX = side * (7 + Math.random() * 5);
            group.add(this.createTree(treeX, treeZ));
        }

        group.position.z = z;
        this.scene.add(group);
        this.tiles.push(group);
    }

    update(speed) {
        for (let tile of this.tiles) {
            tile.position.z += speed;
            
            if (tile.position.z > this.tileLength) {
                tile.position.z -= this.numTiles * this.tileLength;
            }
        }
    }
}

export class WindStreak {
    constructor(scene) {
        this.scene = scene;
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 5)
        ]);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x64748b, 
            transparent: true, 
            opacity: 0.2 
        });
        this.mesh = new THREE.Line(geometry, material);
        this.reset();
        this.scene.add(this.mesh);
    }

    reset() {
        this.mesh.position.set(
            (Math.random() - 0.5) * 15,
            Math.random() * 10,
            -100 - Math.random() * 50
        );
        this.speed = 2 + Math.random() * 3;
    }

    update(gameSpeed) {
        this.mesh.position.z += this.speed + (gameSpeed * 10);
        if (this.mesh.position.z > 20) {
            this.reset();
        }
    }
}
