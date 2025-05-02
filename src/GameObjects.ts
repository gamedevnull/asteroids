import {Position, SoundEffect} from './Commons.js';
import {Size} from './Commons.js';
import {Animation} from './Commons.js';
import {WrapResult} from "./GameControlls.js";
import {Movement} from './GameControlls.js';
import {UserInputController} from './GameControlls.js';
import {ShootingComponent} from './GameControlls.js';
import {Viewport} from './GameControlls.js';
import {StateManager} from './GameStates.js';
//import {PlayerStates} from './GameStates.js';
import {GameObjectIds} from './GameStates.js';
import {EnemyStates} from './GameStates.js';

export class GameObject {
    id: string;
    position: Position;
    size: Size;
    isActive: boolean;
    wasEverActive: boolean;
    isDebugEnabled: boolean;
    isGraphicsEnabled: boolean;

    constructor(id: string, position: Position = new Position(), size: Size = new Size()) {
        this.id = id;
        this.position = position;
        this.size = size;
        this.isActive = true;
        this.wasEverActive = true;
        this.isDebugEnabled = false;
        this.isGraphicsEnabled = false;
    }

    setIsDebug(debug: boolean): void {
        this.isDebugEnabled = debug;
    }

    setIsGraphics(graphics: boolean): void {
        this.isGraphicsEnabled = graphics;
    }

    update(deltaTime: number): void {
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = 'gray';
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
    }
}


export class Player extends GameObject {
    //private stateManager: StateManager;
    private inputController: UserInputController;
    movement: Movement;
    private shooting: ShootingComponent;
    private viewport: Viewport;
    private spriteImage: HTMLImageElement;
    private thrustSound: SoundEffect;
    public positionWrapped: WrapResult;

    constructor(x: number, y: number, input: any, viewport: Viewport, shootingComponent: ShootingComponent, thrustSound: SoundEffect) {
        super(GameObjectIds.PLAYER, new Position(x, y), new Size(48, 48));
        //this.stateManager = new StateManager(PlayerStates.IDLE);
        this.inputController = new UserInputController(input);
        this.movement = new Movement(1, 450, 5, 200);
        this.movement.angle = -90;
        this.shooting = shootingComponent;
        this.viewport = viewport;
        this.thrustSound = thrustSound;
        this.positionWrapped = {wrappedX: 0, wrappedY: 0};

        // TODO maybe later
        // this.stateManager.addStateChangeCallback(PlayerStates.MOVING_LEFT, () => {
        //     console.log('Player is moving left');
        // });
        // this.stateManager.addStateChangeCallback(PlayerStates.MOVING_RIGHT, () => {
        //     console.log('Player is moving right');
        // });
        // this.stateManager.addStateChangeCallback(PlayerStates.MOVING_UP, () => {
        //     console.log('Player is moving up');
        //     if ( !this.thrustSound.isPlaying() ) {
        //         this.thrustSound.play();
        //     }
        // });
        // this.stateManager.addStateChangeCallback(PlayerStates.MOVING_DOWN, () => {
        //     console.log('Player is moving down');
        // });
        // this.stateManager.addStateChangeCallback(PlayerStates.IDLE, () => {
        //     console.log('Player is idle');
        // });

        this.spriteImage = new Image();
        this.spriteImage.src = 'img/spaceship.png';
    }

    update(deltaTime: number): void {
        if (!this.isActive) {
            return;
        }
        this.inputController.control(this.position, this.movement, this.shooting);
        this.movement.update(deltaTime, this.position);
        this.positionWrapped = this.viewport.wrapPosition(this.position, this.size);

        if (this.movement.isForceApplied()) {

            if (!this.thrustSound.isPlaying()) {
                this.thrustSound.play();
            }
            //this.stateManager.setState(PlayerStates.MOVING_UP);

        } else {

            if (this.thrustSound.isPlaying()) {
                this.thrustSound.stop();
            }
            // this.stateManager.setState(PlayerStates.IDLE);

        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (!this.isActive) {
            return;
        }

        if (this.isDebugEnabled) {
            this.renderDebugShape(ctx);
        }

        if (this.isGraphicsEnabled) {
            this.renderSpaceship(ctx);
        }
    }

    private renderDebugShape(ctx: CanvasRenderingContext2D): void {

        const xOffset = this.size.width / 2;
        const yOffset = this.size.height / 2;

        ctx.beginPath();
        ctx.rect(this.position.x, this.position.y, this.size.width, this.size.height);
        ctx.strokeStyle = 'gray';
        ctx.stroke();

        const position = this.position;
        const size = this.size;
        const angle = this.movement.angle + 90;

        const centerX = position.x + xOffset;
        const centerY = position.y + yOffset;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((angle * Math.PI) / 180);

        ctx.beginPath();
        ctx.moveTo(0, -size.height / 2);
        ctx.lineTo(-size.width / 2, size.height / 2);
        ctx.lineTo(size.width / 2, size.height / 2);
        ctx.closePath();

        ctx.strokeStyle = 'lime';
        ctx.stroke();

        ctx.restore();
    }

    private renderSpaceship(ctx: CanvasRenderingContext2D): void {

        const xOffset = this.size.width / 2;
        const yOffset = this.size.height / 2;

        const position = this.position;
        const size = this.size;
        const angle = this.movement.angle + 90;

        const centerX = position.x + xOffset;
        const centerY = position.y + yOffset;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((angle * Math.PI) / 180);

        ctx.drawImage(
            this.spriteImage,
            0, 0,
            320, 320,
            -size.width / 2, -size.height / 2,
            size.width, size.height
        );

        ctx.restore();

        if (this.movement.isForceApplied()) {
            this.renderThrusters(ctx);
        }
    }

    renderThrusters(ctx: CanvasRenderingContext2D): void {

        const xOffset = this.size.width / 2;
        const yOffset = this.size.height / 2;

        const position = this.position;
        const size = this.size;
        const angle = this.movement.angle + 90;

        const centerX = position.x + xOffset;
        const centerY = position.y + yOffset;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((angle * Math.PI) / 180);

        const isRedOrOrgange = Math.floor(Math.random() * 2) === 0;
        if (isRedOrOrgange) {
            ctx.fillStyle = 'orange';
        } else {
            ctx.fillStyle = 'red';
        }

        ctx.fillRect(-2 - 10, 20, 4, 8);
        ctx.fillRect(-2 + 10, 20, 4, 8);

        ctx.restore();
    }
}

export class Enemy extends GameObject {
    stateManager: StateManager;
    private viewport: Viewport;
    movement: Movement;
    private animation: Animation;

    private static spriteImage: HTMLImageElement;

    constructor(x: number, y: number, viewport: Viewport) {
        super(GameObjectIds.ENEMY, new Position(x, y), new Size(40, 40));
        this.stateManager = new StateManager(EnemyStates.INACTIVE);
        this.viewport = viewport;
        this.movement = new Movement(10, 20, 1, 350);
        this.movement.angle = 120;
        this.movement.velocity.x = 25;
        this.movement.velocity.y = 25;
        this.movement.friction = 0;

        this.wasEverActive = false;
        this.isActive = false;

        this.animation = new Animation(256, 256, 0, 0, 16, 100);

        Enemy.initializeSprite();

        // debug
        // this.stateManager.addStateChangeCallback(EnemyStates.ACTIVE, () => {
        //     this.isActive = true;
        //     console.log("Enemy activated");
        // });
        //
        // this.stateManager.addStateChangeCallback(EnemyStates.INACTIVE, () => {
        //     this.isActive = false;
        //     console.log("Enemy deactivated");
        // });
    }

    static initializeSprite(): void {
        if (!Enemy.spriteImage) {
            Enemy.spriteImage = new Image();
            Enemy.spriteImage.src = 'img/asteroid.png';
        }
    }

    update(deltaTime: number): void {
        this.movement.applyRotation(1);
        this.movement.update(deltaTime, this.position);

        this.animation.update(deltaTime);

        const outOfScreen = this.viewport.isOutOfScreen(this.position, this.size);

        if (!outOfScreen && !this.wasEverActive) {
            this.isActive = true;
            this.wasEverActive = true;
        } else if (outOfScreen && this.wasEverActive) {
            this.isActive = false;
        }

        if (this.viewport.isVeryOutOfScreen(this.position, this.size)) {
            this.isActive = false;
            this.wasEverActive = true;
        }
    }

    renderDebugShape(ctx: CanvasRenderingContext2D) {

        const xOffset = this.size.width / 2;
        const yOffset = this.size.height / 2;

        ctx.beginPath();
        ctx.rect(this.position.x, this.position.y, this.size.width, this.size.height);
        ctx.strokeStyle = 'gray';
        ctx.stroke();

        const centerX = this.position.x + xOffset;
        const centerY = this.position.y + yOffset;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((this.movement.angle * Math.PI) / 180);

        ctx.beginPath();
        ctx.rect(-this.size.width / 2, -this.size.height / 2, this.size.width, this.size.height);
        if (this.size.width > 15) {
            ctx.strokeStyle = 'red';
        } else {
            ctx.strokeStyle = 'blue';
        }
        ctx.stroke();

        ctx.restore();

    }

    renderAsteroid(ctx: CanvasRenderingContext2D) {

        const xOffset = this.size.width / 2;
        const yOffset = this.size.height / 2;

        const frame = this.animation.getCurrentFramePosition();

        ctx.drawImage(
            Enemy.spriteImage,
            frame.x, frame.y,
            this.animation.width, this.animation.height,
            this.position.x - 4, this.position.y - 4,
            this.size.width + 8, this.size.height + 8
        );

    }

    render(ctx: CanvasRenderingContext2D): void {

        if (!this.isActive) {
            return;
        }

        if (this.isDebugEnabled) {
            this.renderDebugShape(ctx);
        }

        if (this.isGraphicsEnabled) {
            this.renderAsteroid(ctx);
        }
    }
}

export class Explosion extends GameObject {
    private animation: Animation;
    private static spriteImage: HTMLImageElement;

    constructor(x: number, y: number) {

        const xOffset = -128;
        const yOffset = -128;

        super(GameObjectIds.EXPLOSION, new Position(x + xOffset, y + yOffset), new Size(256, 256));
        this.animation = new Animation(256, 256, 0, 0, 48, 5, 0);

        Explosion.initializeSprite();
    }

    static initializeSprite(): void {
        if (!Explosion.spriteImage) {
            Explosion.spriteImage = new Image();
            Explosion.spriteImage.src = 'img/explosion.png';
        }
    }

    update(deltaTime: number): void {
        this.animation.update(deltaTime);
        if (this.animation.isFinished()) {
            this.isActive = false;
        }
    }

    renderDebugShape(ctx: CanvasRenderingContext2D): void {
        const xOffset = this.size.width / 2;
        const yOffset = this.size.height / 2;

        ctx.beginPath();
        ctx.rect(this.position.x, this.position.y, this.size.width, this.size.height);
        ctx.strokeStyle = 'gray';
        ctx.stroke();

        // render white circle shape
        ctx.beginPath();
        const size = this.animation.getCurrentFrameNumber();
        ctx.arc(this.position.x + xOffset, this.position.y + yOffset, size, 0, 2 * Math.PI);
        ctx.strokeStyle = 'white';
        ctx.stroke();

    }

    render(ctx: CanvasRenderingContext2D): void {

        if (this.isDebugEnabled) {
            this.renderDebugShape(ctx);
        }

        if (this.isGraphicsEnabled) {
            this.renderGfx(ctx);
        }

    }

    private renderGfx(ctx: CanvasRenderingContext2D): void {
        const frame = this.animation.getCurrentFramePosition();
        ctx.drawImage(
            Explosion.spriteImage,
            frame.x, frame.y,
            this.animation.width, this.animation.height,
            this.position.x, this.position.y,
            this.animation.width, this.animation.height
        );
    }
}

export class Bullet extends GameObject {
    private movement: Movement;
    private viewport: Viewport;
    private animation: Animation;
    private static spriteImage: HTMLImageElement;

    constructor(x: number, y: number, viewport: Viewport, angle: number) {
        super(GameObjectIds.BULLET, new Position(x, y), new Size(20, 20));
        this.movement = new Movement(1, 10, 0, 0);
        this.movement.angle = angle;
        this.viewport = viewport;
        this.animation = new Animation(32, 64, 0, 0, 16, 10);

        if (!Bullet.spriteImage) {
            Bullet.spriteImage = new Image();
            Bullet.spriteImage.src = 'img/weaponfire.png';
        }
    }

    update(deltaTime: number): void {
        this.animation.update(deltaTime);
        this.movement.velocity.x = 550 * Math.cos((this.movement.angle * Math.PI) / 180);
        this.movement.velocity.y = 550 * Math.sin((this.movement.angle * Math.PI) / 180);
        this.movement.update(deltaTime, this.position);
        if (this.isActive) {
            this.isActive = !this.viewport.isOutOfScreen(this.position, this.size);
        }
    }

    renderDebugShape(ctx: CanvasRenderingContext2D): void {

        const xOffset = this.size.width / 2;
        const yOffset = this.size.height / 2;

        ctx.beginPath();
        ctx.rect(this.position.x, this.position.y, this.size.width, this.size.height);
        ctx.strokeStyle = 'gray';
        ctx.stroke();

        const angle = this.movement.angle + 90;

        ctx.save();
        ctx.translate(this.position.x + xOffset, this.position.y + yOffset);
        ctx.rotate((angle * Math.PI) / 180);

        if (this.isActive) {
            ctx.fillStyle = 'yellow';
        } else {
            ctx.fillStyle = 'gray'; // debug
        }

        ctx.fillRect(-2, -6, 4, 12);

        ctx.restore();
    }

    renderGfx(ctx: CanvasRenderingContext2D): void {

        const xOffset = this.size.width / 2;
        const yOffset = this.size.height / 2;

        const angle = this.movement.angle + 90;
        ctx.save();
        ctx.translate(this.position.x + xOffset, this.position.y + yOffset);
        ctx.rotate((angle * Math.PI) / 180);
        const frame = this.animation.getCurrentFramePosition();

        const gfxWidth = 32;
        const gfxHeight = 64;

        ctx.drawImage(
            Bullet.spriteImage,
            frame.x, frame.y,
            this.animation.width, this.animation.height,
            -gfxWidth / 2, -gfxHeight / 2,
            gfxWidth, gfxHeight
        );

        ctx.restore();
    }

    render(ctx: CanvasRenderingContext2D): void {

        if (this.isDebugEnabled) {
            this.renderDebugShape(ctx);
        }

        if (this.isGraphicsEnabled) {
            this.renderGfx(ctx);
        }

    }
}

export class Particle extends GameObject {
    stateManager: StateManager;
    private viewport: Viewport;
    movement: Movement;
    private animation: Animation;
    private static spriteImage: HTMLImageElement;
    lifetime;

    constructor(x: number, y: number, viewport: Viewport) {
        super(GameObjectIds.PARTICLE, new Position(x, y), new Size(40, 40));
        this.stateManager = new StateManager(EnemyStates.INACTIVE);
        this.viewport = viewport;
        this.movement = new Movement(10, 20, 1, 350);
        this.movement.angle = 120;
        this.movement.velocity.x = 25;
        this.movement.velocity.y = 25;
        this.movement.friction = 0;

        this.wasEverActive = false;
        this.isActive = false;
        this.lifetime = Math.floor(Math.random() * (3001 - 1000) + 1200);
        this.animation = new Animation(256, 256, 0, 0, 16, 100);

        if (!Particle.spriteImage) {
            Particle.spriteImage = new Image();
            Particle.spriteImage.src = 'img/asteroidStatic.png';
        }
    }

    update(deltaTime: number): void {

        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.isActive = false;
        }

        if (this.isActive && this.size.width >= 5 && this.lifetime % 3 === 0) {
            this.size.width -= 1;
            this.size.height -= 1;
        }

        this.movement.applyRotation(1);
        this.movement.update(deltaTime, this.position);

        this.animation.update(deltaTime);

        const outOfScreen = this.viewport.isOutOfScreen(this.position, this.size);

        if (!outOfScreen && !this.wasEverActive) {
            this.isActive = true;
            this.wasEverActive = true;
        } else if (outOfScreen && this.wasEverActive) {
            this.isActive = false;
        }

        if (this.viewport.isVeryOutOfScreen(this.position, this.size)) {
            this.isActive = false;
            this.wasEverActive = true;
        }
    }

    renderDebugShape(ctx: CanvasRenderingContext2D) {

        const xOffset = this.size.width / 2;
        const yOffset = this.size.height / 2;

        ctx.beginPath();
        ctx.rect(this.position.x, this.position.y, this.size.width, this.size.height);
        ctx.strokeStyle = 'gray';
        ctx.stroke();

        const centerX = this.position.x + xOffset;
        const centerY = this.position.y + yOffset;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((this.movement.angle * Math.PI) / 180);

        ctx.beginPath();
        ctx.rect(-this.size.width / 2, -this.size.height / 2, this.size.width, this.size.height);
        if (this.size.width > 15) {
            ctx.strokeStyle = 'red';
        } else {
            ctx.strokeStyle = 'blue';
        }
        ctx.stroke();

        ctx.restore();

    }

    renderAsteroid(ctx: CanvasRenderingContext2D) {

        const xOffset = this.size.width / 2;
        const yOffset = this.size.height / 2;

        const centerX = this.position.x + xOffset;
        const centerY = this.position.y + yOffset;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((this.movement.angle * Math.PI) / 180);

        ctx.drawImage(
            Particle.spriteImage,
            0, 0,
            320, 320,
            -this.size.width / 2, -this.size.height / 2,
            this.size.width * 1.6, this.size.height * 1.6
        );
        ctx.restore();
    }

    render(ctx: CanvasRenderingContext2D): void {

        if (!this.isActive) {
            return;
        }

        if (this.isDebugEnabled) {
            this.renderDebugShape(ctx);
        }

        if (this.isGraphicsEnabled) {
            this.renderAsteroid(ctx);
        }
    }

}

export class AmmoPack extends GameObject {
    stateManager: StateManager;
    private viewport: Viewport;
    movement: Movement;
    private static spriteImage: HTMLImageElement;

    constructor(x: number, y: number, viewport: Viewport) {
        super(GameObjectIds.AMMO, new Position(x, y), new Size(22, 22));
        this.stateManager = new StateManager(EnemyStates.INACTIVE);
        this.viewport = viewport;
        this.movement = new Movement(10, 20, 1, 350);
        this.movement.angle = 120;
        this.movement.velocity.x = 25;
        this.movement.velocity.y = 25;
        this.movement.friction = 0;
        this.wasEverActive = false;
        this.isActive = false;

        if (!AmmoPack.spriteImage) {
            AmmoPack.spriteImage = new Image();
            AmmoPack.spriteImage.src = 'img/ammo.png';
        }

    }

    update(deltaTime: number): void {

        this.movement.applyRotation(1);
        this.movement.update(deltaTime, this.position);

        const outOfScreen = this.viewport.isOutOfScreen(this.position, this.size);

        if (!outOfScreen && !this.wasEverActive) {
            this.isActive = true;
            this.wasEverActive = true;
        } else if (outOfScreen && this.wasEverActive) {
            this.isActive = false;
        }

        if (this.viewport.isVeryOutOfScreen(this.position, this.size)) {
            this.isActive = false;
            this.wasEverActive = true;
        }
    }

    renderDebugShape(ctx: CanvasRenderingContext2D) {

        const xOffset = this.size.width / 2;
        const yOffset = this.size.height / 2;

        ctx.beginPath();
        ctx.rect(this.position.x, this.position.y, this.size.width, this.size.height);
        ctx.strokeStyle = 'gray';
        ctx.stroke();

        const centerX = this.position.x + xOffset;
        const centerY = this.position.y + yOffset;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((this.movement.angle * Math.PI) / 180);

        ctx.beginPath();
        ctx.rect(-this.size.width / 2, -this.size.height / 2, this.size.width, this.size.height);

        ctx.strokeStyle = 'green';

        ctx.stroke();

        ctx.restore();
    }

    renderAmmoPack(ctx: CanvasRenderingContext2D) {

        const xOffset = this.size.width / 2;
        const yOffset = this.size.height / 2;

        const centerX = this.position.x + xOffset;
        const centerY = this.position.y + yOffset;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((this.movement.angle * Math.PI) / 180);

        ctx.drawImage(
            AmmoPack.spriteImage,
            0, 0,
            320, 320,
            -this.size.width / 2, -this.size.height / 2,
            this.size.width, this.size.height
        );

        ctx.restore();
    }

    render(ctx: CanvasRenderingContext2D): void {

        if (!this.isActive) {
            return;
        }

        if (this.isDebugEnabled) {
            this.renderDebugShape(ctx);
        }

        if (this.isGraphicsEnabled) {
            this.renderAmmoPack(ctx);
        }
    }

}