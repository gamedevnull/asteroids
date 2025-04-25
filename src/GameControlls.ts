import {Size} from './Commons.js';
import {GameObject} from './GameObjects.js';
import {Position} from './Commons.js';
import {Bullet} from './GameObjects.js';
import {SoundEffect} from './Commons.js';

export class WrapResult {
    wrappedX: number;
    wrappedY: number;

    constructor(wrappedX: number = 0, wrappedY: number = 0) {
        this.wrappedX = wrappedX;
        this.wrappedY = wrappedY;
    }
}

export class Viewport {
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    wrapPosition(position: Position, size: Size): WrapResult {
        let wrappedX = 0;
        let wrappedY = 0;

        if (position.x + size.width < 0) {
            position.x = this.width;
            wrappedX = -1;
        } else if (position.x > this.width) {
            position.x = -size.width;
            wrappedX = 1;
        }
        if (position.y + size.height < 0) {
            position.y = this.height;
            wrappedY = -1;
        } else if (position.y > this.height) {
            position.y = -size.height;
            wrappedY = 1;
        }
        return { wrappedX, wrappedY }
    }

    isOutOfScreen(position: Position, size: Size): boolean {
        return position.x + size.width < 0 || position.x > this.width || position.y + size.height < 0 || position.y > this.height;
    }

    isVeryOutOfScreen(position: Position, size: Size): boolean {
        return position.x + size.width < -200 || position.x > this.width + 200 || position.y + size.height < -200 || position.y > this.height + 200;
    }
}

export class InputHandler {
    keys: { [key: string]: boolean };

    constructor() {
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            ' ': false,
            'x': false,
            'p': false,
            's': false,
            'd': false,
            'g': false,
        };

        window.addEventListener('keydown', (event) => {
            if (event.key in this.keys) {
                this.keys[event.key] = true;
                event.preventDefault();
            }
        });

        window.addEventListener('keyup', (event) => {
            if (event.key in this.keys) {
                this.keys[event.key] = false;
                event.preventDefault();
            }
        });

        document.getElementById('left-button')?.addEventListener('touchstart', () => this.keys['ArrowLeft'] = true);
        document.getElementById('left-button')?.addEventListener('touchend', () => this.keys['ArrowLeft'] = false);

        document.getElementById('right-button')?.addEventListener('touchstart', () => this.keys['ArrowRight'] = true);
        document.getElementById('right-button')?.addEventListener('touchend', () => this.keys['ArrowRight'] = false);

        document.getElementById('up-button')?.addEventListener('touchstart', () => this.keys['ArrowUp'] = true);
        document.getElementById('up-button')?.addEventListener('touchend', () => this.keys['ArrowUp'] = false);

        document.getElementById('shoot-button')?.addEventListener('touchstart', () => this.keys[' '] = true);
        document.getElementById('shoot-button')?.addEventListener('touchend', () => this.keys[' '] = false);

    }

    public isKeyPressed(key: string): boolean {
        return this.keys[key] || false;
    }
}

interface InputKeys {
    ArrowUp: boolean;
    ArrowDown: boolean;
    ArrowLeft: boolean;
    ArrowRight: boolean;
    ' ': boolean;
    'x': boolean;
    'p': boolean;
    's': boolean;
    'd': boolean;
    'g': boolean;
}

export class UserInputController {
    private input: { keys: InputKeys };

    constructor(input: { keys: InputKeys }) {
        this.input = input;
    }

    control(position: { x: number; y: number }, movement: any, shooting: any): void {
        if (this.input.keys.ArrowUp) {
            movement.applyForce();
        } else {
            movement.applyFriction();
            movement.resetForce();
        }

        if (this.input.keys.ArrowLeft) {
            movement.applyRotation(-1);
        } else if (this.input.keys.ArrowRight) {
            movement.applyRotation(1);
        }

        if (this.input.keys[' ']) {
            shooting.shoot(position, movement.angle);
            //this.input.keys[' '] = false; // its much more fun with this one commented
        }
    }
}

export class ShootingComponent {
    private gameObjects: GameObject[];
    bulletsNumber: number;
    private viewport: Viewport;
    shootingSound: SoundEffect;
    private isDebugEnabled: boolean;
    private reloadTime: number;
    private isGraphicsEnabled: boolean;
    private ammo: number;

    constructor(gameObjects: GameObject[], viewport: Viewport, initialAmmo: number = 50, sound: SoundEffect) {
        this.gameObjects = gameObjects;
        this.bulletsNumber = 0;
        this.viewport = viewport;
        this.shootingSound = sound;
        this.isDebugEnabled = false;
        this.reloadTime = 0;
        this.isGraphicsEnabled = true;
        this.ammo = initialAmmo;
    }

    getAmmo(): number {
        return this.ammo;
    }

    setAmmo(ammo: number): void {
        this.ammo = ammo;
        if (this.ammo < 0) {
            this.ammo = 0;
        }
    }

    addAmmo(ammo: number): void {
        this.ammo += ammo;
        if (this.ammo > 200) {
            this.ammo = 200;
        }
    }

    setDebug(isDebug: boolean): void {
        this.isDebugEnabled = isDebug;
    }

    setIsGraphics(isGraphics: boolean): void {
        this.isGraphicsEnabled = isGraphics;
    }

    update(deltaTime: number): void {
        this.reloadTime += deltaTime;
    }

    shoot(position: Position, angle: number): void {

        if (this.ammo === 0) {
            return;
        }

        if (this.reloadTime < 100) {
            return;
        }

        const offsetX = 24 - 10;
        const offsetY =  24 - 10;

        const bulletX = position.x + offsetX;
        const bulletY = position.y + offsetY;

        const bullet = new Bullet(bulletX, bulletY, this.viewport, angle);

        bullet.setIsDebug(this.isDebugEnabled);
        bullet.setIsGraphics(this.isGraphicsEnabled);

        this.gameObjects.push(bullet);

        this.bulletsNumber++;
        this.shootingSound.play();
        this.reloadTime = 0;
        this.ammo--;
    }
}

export class Movement {
    private mass: number;
    public velocity: { x: number; y: number };
    friction: number;
    private force: { x: number; y: number };
    private forceFactor: number;
    private rotationFactor: number;
    public angle: number;
    private maxVelocity: number;

    constructor(mass: number = 1, forceFactor: number = 350, rotationFactor: number = 4, maxVelocity: number = 600) {
        this.mass = mass;
        this.velocity = {x: 0, y: 0};
        this.friction = 0.995;
        this.force = {x: 0, y: 0};
        this.forceFactor = forceFactor;
        this.rotationFactor = rotationFactor;
        this.angle = 0;
        this.maxVelocity = maxVelocity;
    }

    applyRotation(direction: number): void {
        if (direction === -1) {
            this.angle -= this.rotationFactor;
        } else if (direction === 1) {
            this.angle += this.rotationFactor;
        }

        this.angle = (this.angle % 360 + 360) % 360;
    }

    applyForce(): void {
        const radians = this.angle * Math.PI / 180;
        this.force.x = Math.cos(radians) * this.forceFactor;
        this.force.y = Math.sin(radians) * this.forceFactor;
    }

    isForceApplied() : boolean
    {
        return this.force.x !== 0 || this.force.y !== 0;
    }

    applyFriction(): void {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
    }

    resetForce(): void {
        this.force.x = 0;
        this.force.y = 0;
    }

    update(deltaTime: number, position: { x: number; y: number }): void {
        this.velocity.x += this.force.x * deltaTime / 1000;
        this.velocity.y += this.force.y * deltaTime / 1000;

        if (this.maxVelocity > 0) {
            const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            if (speed > this.maxVelocity) {
                const ratio = this.maxVelocity / speed;
                this.velocity.x *= ratio;
                this.velocity.y *= ratio;
            }

            if (speed < 1) {
                this.velocity.x = 0;
                this.velocity.y = 0;
            }
        }

        position.x += this.velocity.x * deltaTime / 1000;
        position.y += this.velocity.y * deltaTime / 1000;
    }

    getVelocity(): { x: number; y: number } {
        return this.velocity;
    }
}