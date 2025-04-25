import {GameObject, AmmoPack} from './GameObjects.js';
import {Player} from './GameObjects.js';
import {Enemy} from './GameObjects.js';
import {Particle} from './GameObjects.js';
import {Explosion} from './GameObjects.js';
import {StateManager} from './GameStates.js';
import {SoundEffect} from './Commons.js';
import {CollisionManager} from './Commons.js';
import {ShootingComponent} from './GameControlls.js';
import {Viewport} from './GameControlls.js';
import {InputHandler} from './GameControlls.js';
import {GameObjectIds} from './GameStates.js';
import {GameStates} from './GameStates.js';

export class Game {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private lastTime: number;
    private boundLoop: (timestamp: number) => void;
    private input: InputHandler;
    private viewport: Viewport;
    private objects: GameObject[];
    private shootingComponent: ShootingComponent;
    private score: number;
    private level: number;
    private shield: number;
    private enemyNumber: number;
    private backgroundImg: HTMLImageElement;
    private title1Img: HTMLImageElement;
    private collisionManager: CollisionManager;
    private explosionSound: SoundEffect;
    private gameStateManager: StateManager;
    private thrustSound: SoundEffect;
    private isDebugEnabled: boolean;
    private isGraphicsEnabled: boolean;
    private isSoundEnabled: boolean;
    private gameOverTimer: number;
    private isAmmoOnTheWay: boolean;
    private ammoSupplyTime: number;
    private player: Player;

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        this.isDebugEnabled = false;
        this.isGraphicsEnabled = true;
        this.isSoundEnabled = true;
        this.isAmmoOnTheWay = false;
        this.ctx = ctx;
        this.canvas = canvas;
        this.lastTime = 0;
        this.boundLoop = this.loop.bind(this);
        this.input = new InputHandler();
        this.viewport = new Viewport(800, 600);
        this.objects = [];
        this.ammoSupplyTime = this.getNextAmmoSupplyTime();

        const shootingSound = new SoundEffect('img/weaponfire.wav');
        shootingSound.setSoundEnabled(this.isSoundEnabled);
        shootingSound.setVolume(0.1);

        this.shootingComponent = new ShootingComponent(this.objects, this.viewport, 100, shootingSound);

        this.score = 0;
        this.level = 1;
        this.shield = 100;
        this.enemyNumber = 0;
        this.backgroundImg = new Image();
        this.backgroundImg.src = 'img/gameBg.jpg';

        this.title1Img = new Image();
        this.title1Img.src = 'img/titleBg.jpg';

        this.thrustSound = new SoundEffect('img/thrusters.wav');
        this.thrustSound.setSoundEnabled(this.isSoundEnabled);
        this.thrustSound.setVolume(0.2);

        this.player = new Player(400 - 24, 300 - 24, this.input, this.viewport, this.shootingComponent, this.thrustSound);
        this.objects.push(this.player);

        this.collisionManager = new CollisionManager();
        this.explosionSound = new SoundEffect('img/explosion.wav');
        this.explosionSound.setVolume(0.3);

        this.explosionSound.setSoundEnabled(this.isSoundEnabled);

        this.gameStateManager = new StateManager(GameStates.TITLE);

        this.gameOverTimer = 0;

        this.setupCollisionCallbacks();
        this.spawnEnemy();

        document.getElementById('sound-toggle-icon')?.addEventListener('touchend', () => {
            this.toggleSound();
        });

        document.getElementById('sound-toggle-icon')?.addEventListener('click', () => {
            this.toggleSound();
        });

    }

    toggleSound(): void {
        const soundOnPath = document.getElementById('sound-on');
        const soundOffPath = document.getElementById('sound-off');

        this.isSoundEnabled = !this.isSoundEnabled;

        this.explosionSound.setSoundEnabled(this.isSoundEnabled);
        this.shootingComponent.shootingSound.setSoundEnabled(this.isSoundEnabled);
        this.thrustSound.setSoundEnabled(this.isSoundEnabled);

        if (soundOnPath && soundOffPath) {
            if (this.isSoundEnabled) {
                soundOnPath.style.display = 'block';
                soundOffPath.style.display = 'none';
            } else {
                soundOnPath.style.display = 'none';
                soundOffPath.style.display = 'block';
            }
        }
    }

    private setupCollisionCallbacks(): void {
        this.collisionManager.addCollisionCallback(GameObjectIds.PLAYER, GameObjectIds.ENEMY, (objectA, objectB) => {
            let player: GameObject;
            let enemy: GameObject;
            if (objectA.id === GameObjectIds.PLAYER) {
                player = objectA;
                enemy = objectB;
            } else {
                player = objectB;
                enemy = objectA;
            }

            if (enemy.size.width > 15) {
                this.explosionSound.play();
                this.gameStateManager.setState(GameStates.GAME_OVER);
                player.isActive = false;
                this.thrustSound.stop();

                let explosion = new Explosion(player.position.x, player.position.y);

                explosion.setIsDebug(this.isDebugEnabled);
                explosion.setIsGraphics(this.isGraphicsEnabled);
                this.objects.push(explosion);
            }
        });

        this.collisionManager.addCollisionCallback(GameObjectIds.BULLET, GameObjectIds.ENEMY, (objectA, objectB) => {
            let bullet: GameObject;
            let enemy: GameObject;
            if (objectA.id === GameObjectIds.BULLET) {
                bullet = objectA;
                enemy = objectB;
            } else {
                bullet = objectB;
                enemy = objectA;
            }

            if (enemy.size.width > 15) {
                this.explosionSound.play();
                bullet.isActive = false;
                enemy.isActive = false;
                this.score += 1;

                const posX = enemy.position.x;
                const posY = enemy.position.y;

                if (this.score % 10 === 0) {
                    this.level += 1;
                }

                const particleNumber = Math.floor(Math.random() * 5) + 3;
                for (let i = 0; i < particleNumber; i++) {
                    this.spawnParticle(posX, posY);
                }

                let explosion = new Explosion(posX, posY);

                explosion.setIsDebug(this.isDebugEnabled);
                explosion.setIsGraphics(this.isGraphicsEnabled);
                this.objects.push(explosion);
            }
        });

        this.collisionManager.addCollisionCallback(GameObjectIds.PLAYER, GameObjectIds.AMMO, (objectA, objectB) => {
            let player: GameObject;
            let ammoBox: GameObject;
            if (objectA.id === GameObjectIds.PLAYER) {
                player = objectA;
                ammoBox = objectB;
            } else {
                player = objectB;
                ammoBox = objectA;
            }

            ammoBox.isActive = false;
            this.shootingComponent.addAmmo(100);
            this.resetAmmoSupplyTime();

        });

        this.collisionManager.addCollisionCallback(GameObjectIds.PLAYER, GameObjectIds.PARTICLE, (objectA, objectB) => {
            let player: GameObject;
            let particle: GameObject;
            if (objectA.id === GameObjectIds.PLAYER) {
                player = objectA;
                particle = objectB;
            } else {
                player = objectB;
                particle = objectA;
            }

            this.shield = this.shield - 1;
            particle.isActive = false;

            if (this.shield <= 0) {
                this.explosionSound.play();
                player.isActive = false;
                this.gameStateManager.setState(GameStates.GAME_OVER);
                let explosion = new Explosion(player.position.x, player.position.y);

                explosion.setIsDebug(this.isDebugEnabled);
                explosion.setIsGraphics(this.isGraphicsEnabled);
                this.objects.push(explosion);
            }
        });
    }

    private getMaxEnemyNumber(): number {
        if (this.level === 1) return 5;
        if (this.level === 2) return 7;
        if (this.level === 3) return 9;
        if (this.level === 4) return 11;
        if (this.level === 5) return 13;
        if (this.level === 6) return 15;
        if (this.level === 7) return 18;
        if (this.level === 8) return 21;
        if (this.level === 9) return 25;
        if (this.level === 10) return 28;
        return 32;
    }

    private spawnParticle(px: number, py: number): void {
        const enemy = new Particle(0, 0, this.viewport);
        const size = Math.random() * 10 + 5;
        enemy.size.width = size;
        enemy.size.height = size;
        enemy.wasEverActive = true;
        enemy.isActive = true;

        let negativeMultiplier = Math.random() < 0.5 ? -1 : 1;
        enemy.position.x = px;
        enemy.position.y = py;
        enemy.movement.velocity.x = negativeMultiplier * Math.random() * 100;

        negativeMultiplier = Math.random() < 0.5 ? -1 : 1;
        enemy.movement.velocity.y = negativeMultiplier * Math.random() * 100;

        this.objects.push(enemy);
    }

    private countEnemies(): number {
        return this.objects.filter(obj => obj.id === GameObjectIds.ENEMY).length;
    }

    private spawnEnemy(): void {
        if (this.enemyNumber >= this.getMaxEnemyNumber()) return;

        const enemy = new Enemy(0, 0, this.viewport);
        enemy.setIsDebug(this.isDebugEnabled);
        enemy.setIsGraphics(this.isGraphicsEnabled);
        enemy.stateManager.setState("1");
        const size = Math.random() * 40 + 20;
        enemy.size.width = size;
        enemy.size.height = size;

        const negativeMultiplier = Math.random() < 0.5 ? -1 : 1;
        const dir = Math.floor(Math.random() * 4);
        switch (dir) {
            case 0: // top
                enemy.position.x = Math.random() * 800 + enemy.size.width;
                enemy.position.y = -10 - enemy.size.height;
                enemy.movement.velocity.x = negativeMultiplier * Math.random() * 200;
                enemy.movement.velocity.y = Math.random() * 100;
                break;
            case 1: // left
                enemy.position.x = -10 - enemy.size.width;
                enemy.position.y = Math.random() * 600;
                enemy.movement.velocity.x = Math.random() * 200;
                enemy.movement.velocity.y = negativeMultiplier * Math.random() * 250;
                break;
            case 2: // right
                enemy.position.x = 800 + enemy.size.width;
                enemy.position.y = Math.random() * 600;
                enemy.movement.velocity.x = -Math.random() * 150;
                enemy.movement.velocity.y = negativeMultiplier * Math.random() * 100;
                break;
            case 3: // bottom
                enemy.position.x = Math.random() * 800 + enemy.size.width;
                enemy.position.y = 600 + enemy.size.height;
                enemy.movement.velocity.x = negativeMultiplier * Math.random() * 150;
                enemy.movement.velocity.y = -Math.random() * 150;
                break;
        }

        this.objects.push(enemy);
        this.enemyNumber++;
    }

    private spawnAmmo(): void {
        if (this.isAmmoOnTheWay || this.ammoSupplyTime > 0) return;

        const enemy = new AmmoPack(0, 0, this.viewport);
        enemy.setIsDebug(this.isDebugEnabled);
        enemy.setIsGraphics(this.isGraphicsEnabled);
        enemy.stateManager.setState("1");
        const size = 28; //Math.random() * 40 + 20;
        enemy.size.width = size;
        enemy.size.height = size;

        const negativeMultiplier = Math.random() < 0.5 ? -1 : 1;
        const dir = Math.floor(Math.random() * 4);
        switch (dir) {
            case 0: // top
                enemy.position.x = Math.random() * 500 + enemy.size.width + 100;
                enemy.position.y = -10 - enemy.size.height;
                enemy.movement.velocity.x = 0; //negativeMultiplier * Math.random() * 50;
                enemy.movement.velocity.y = Math.random() * 50 + 80;
                break;
            case 1: // left
                enemy.position.x = -10 - enemy.size.width;
                enemy.position.y = Math.random() * 400 + 100;
                enemy.movement.velocity.x = Math.random() * 50 + 80;
                enemy.movement.velocity.y = 0; //negativeMultiplier * Math.random() * 50;
                break;
            case 2: // right
                enemy.position.x = 800 + enemy.size.width;
                enemy.position.y = Math.random() * 400 + 100;
                enemy.movement.velocity.x = -Math.random() * 50 - 80;
                enemy.movement.velocity.y = 0; //negativeMultiplier * Math.random() * 50;
                break;
            case 3: // bottom
                enemy.position.x = Math.random() * 500 + enemy.size.width + 100;
                enemy.position.y = 600 + enemy.size.height;
                enemy.movement.velocity.x = 0; //negativeMultiplier * Math.random() * 50;
                enemy.movement.velocity.y = -Math.random() * 50 - 80;
                break;
        }

        this.objects.push(enemy);
        this.isAmmoOnTheWay = true;
        this.resetAmmoSupplyTime();
    }

    private restart(): void {
        this.shootingComponent.bulletsNumber = 0;

        this.objects.forEach(obj => {
            if (obj instanceof Player && obj.id === GameObjectIds.PLAYER) {
                obj.position.x = 400 - 24;
                obj.position.y = 300 - 24;
                obj.movement.velocity.x = 0;
                obj.movement.velocity.y = 0;
                obj.isActive = true;
                obj.movement.angle = 0;
                this.isAmmoOnTheWay = false;
                this.resetAmmoSupplyTime();
                this.shootingComponent.setAmmo(100);
            } else {
                obj.isActive = false;
                obj.wasEverActive = true;
            }
        });

        this.score = 0;
        this.level = 1;
        this.shield = 100;

        this.spawnEnemy();
        this.spawnEnemy();
        this.spawnEnemy();
        this.spawnEnemy();
        this.gameOverTimer = 0;
    }

    private update(deltaTime: number): void {
        const currentState = this.gameStateManager.getCurrentState();

        if (this.input.keys[' ']) {
            switch (currentState) {
                case GameStates.TITLE:
                    this.gameStateManager.setState(GameStates.IN_GAME);
                    this.input.keys[' '] = false;
                    break;
                case GameStates.PAUSED:
                    this.gameStateManager.setState(GameStates.IN_GAME);
                    this.input.keys[' '] = false;
                    break;
                case GameStates.GAME_OVER:
                    if (this.gameOverTimer >= 3000) {
                        this.objects.forEach(obj => {
                            if (obj.id === GameObjectIds.ENEMY || obj.id === GameObjectIds.BULLET) {
                                obj.isActive = false;
                            }
                        });
                        this.restart();
                        this.input.keys[' '] = false;
                        this.gameStateManager.setState(GameStates.IN_GAME);
                    }
                    break;
                case GameStates.HI_SCORES:
                    this.gameStateManager.setState(GameStates.TITLE);
                    this.input.keys[' '] = false;
                    break;
            }
        }

        if (this.input.keys['s']) {
            this.toggleSound();
            this.input.keys['s'] = false;
        }

        if (this.input.keys['d']) {
            this.isDebugEnabled = !this.isDebugEnabled;
            this.input.keys['d'] = false;
        }

        if (this.input.keys['g']) {
            this.isGraphicsEnabled = !this.isGraphicsEnabled;
            this.input.keys['g'] = false;
        }

        if (currentState === GameStates.GAME_OVER) {
            this.gameOverTimer += deltaTime;
        }

        if (this.input.keys['p'] && currentState === GameStates.IN_GAME) {
            this.gameStateManager.setState(GameStates.PAUSED);
            this.input.keys['p'] = false;
        }

        this.shootingComponent.setDebug(this.isDebugEnabled);
        this.shootingComponent.setIsGraphics(this.isGraphicsEnabled);

        this.objects.forEach(obj => obj.setIsDebug(this.isDebugEnabled));
        this.objects.forEach(obj => obj.setIsGraphics(this.isGraphicsEnabled));

        if (currentState === GameStates.IN_GAME || currentState === GameStates.GAME_OVER) { //
            this.objects.forEach(obj => obj.update(deltaTime));
            this.collisionManager.checkCollisions(this.objects);
            this.shootingComponent.update(deltaTime);

            if (this.ammoSupplyTime > 0 && !this.isAmmoOnTheWay) {
                this.ammoSupplyTime -= deltaTime;
                if (this.ammoSupplyTime < 1) {
                    this.ammoSupplyTime = 0;
                }
            }
        }

        this.objects.forEach(obj => {
            if (obj.id !== GameObjectIds.PLAYER) {
                if (!obj.isActive && obj.wasEverActive) {
                    const index = this.objects.indexOf(obj);
                    if (index > -1) {
                        if (obj.id === GameObjectIds.BULLET && this.shootingComponent.bulletsNumber > 0) {
                            this.shootingComponent.bulletsNumber--;
                        }
                        if (obj.id === GameObjectIds.ENEMY && obj.size.width > 15) {
                            this.enemyNumber--;
                        }

                        if (obj.id === GameObjectIds.AMMO) {

                            this.isAmmoOnTheWay = false;
                            this.resetAmmoSupplyTime();
                        }

                        this.objects.splice(index, 1);
                    }
                }
            }
        });

        this.spawnEnemy();
        this.spawnAmmo();
    }

    resetAmmoSupplyTime() {
        this.ammoSupplyTime = this.getNextAmmoSupplyTime();
    }

    getNextAmmoSupplyTime(): number {
        return 10000;
    }

    private render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.isGraphicsEnabled) {
            this.ctx.drawImage(this.backgroundImg, -100, -100);
        }

        switch (this.gameStateManager.getCurrentState()) {
            case GameStates.IN_GAME:
                this.objects.forEach(obj => obj.render(this.ctx));
                this.drawScore();
                break;
            case GameStates.TITLE:
                this.drawTitleScreen();
                break;
            case GameStates.PAUSED:
                this.objects.forEach(obj => obj.render(this.ctx));
                this.drawPausedScreen();
                break;
            case GameStates.GAME_OVER:
                this.objects.forEach(obj => obj.render(this.ctx));
                this.drawGameOverScreen1();
                if (this.gameOverTimer >= 3000) {
                    this.drawGameOverScreen2();
                }
                break;
            case GameStates.HI_SCORES:
                this.drawHiScoresScreen();
                break;
        }
    }

    private drawScore(): void
    {
        this.ctx.fillStyle = 'beige';
        this.ctx.font = '20px Courier New';
        this.ctx.textAlign = 'left';

        this.ctx.fillText(`SCORE: ${this.score}`, this.canvas.width / 2 - 50, 25);
        this.ctx.fillText(`LEVEL: ${this.level}`, 20, 25);
        this.ctx.fillText(`SHIELD: ${this.shield}`, 20, 570);

        this.ctx.textAlign = 'left';
        const ammoCounter = this.shootingComponent.getAmmo();
        if (ammoCounter < 25) {
            this.ctx.fillStyle = 'red';

        } else {
            this.ctx.fillStyle = 'beige';
        }
        this.ctx.fillText(`AMMO: ${ammoCounter}`, this.canvas.width / 2 - 50, 570);
    }

    private drawTitleScreen(): void {

        if (this.isGraphicsEnabled) {
            this.ctx.drawImage(this.title1Img, 0, 0, 800, 600);
        }

        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#3dbadf';
        this.ctx.font = '20px Courier New';
        this.ctx.fillText('Press SPACE to start', this.canvas.width / 2, this.canvas.height / 2 + 85);

        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#3dbadf';
        this.ctx.font = '15px Courier New';
        this.ctx.fillText('UP, LEFT, RIGHT to move', 560, 500);
        this.ctx.fillText('SPACE to shoot', 560, 520);
        this.ctx.fillText('P - pause', 560, 550);
        this.ctx.fillText('S - sound', 560, 570);
    }

    private drawPausedScreen(): void {
        this.ctx.fillStyle = 'beige';
        this.ctx.font = '30px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Paused', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.font = '20px Courier New';
        this.ctx.fillText('Press SPACE to resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    private drawGameOverScreen1(): void {
        this.ctx.fillStyle = 'beige';
        this.ctx.font = '30px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.ctx.font = '20px Courier New';
        if (this.score > 0) {
            this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }

    private drawGameOverScreen2(): void {
        this.ctx.fillStyle = 'beige';
        this.ctx.font = '20px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }

    private drawHiScoresScreen(): void {
        this.ctx.fillStyle = 'beige';
        this.ctx.font = '30px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Hi Scores - Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2);
    }

    private loop(timestamp: number): void {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.boundLoop);
    }

    public start(): void {
        requestAnimationFrame(this.boundLoop);
    }
}