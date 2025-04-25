import {GameObject} from './GameObjects.js';

export class Size {
    width: number;
    height: number;

    constructor(width: number = 0, height: number = 0) {
        this.width = width;
        this.height = height;
    }
}

export class Position {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }
}

export class Animation {
    width: number;
    height: number;
    startRow: number;
    startCol: number;
    length: number;
    delay: number;
    loop: number;
    currentFrame: number;
    timer: number;

    constructor(width: number, height: number, startRow: number, startCol: number, length: number, delay: number = 100, loop: number = 1) {
        this.width = width;
        this.height = height;
        this.length = length;
        this.startRow = startRow || 0;
        this.startCol = startCol || 0;
        this.currentFrame = 0;
        this.timer = 0;
        this.delay = delay;
        this.loop = loop;
    }

    update(deltaTime: number): void {
        this.timer += deltaTime;
        if (this.timer >= this.delay) {
            if (this.loop) {
                this.currentFrame = (this.currentFrame + 1) % this.length;
            } else if (this.currentFrame < this.length - 1) {
                this.currentFrame++;
            }
            this.timer = 0;
        }
    }

    isFinished(): boolean {
        return (!this.loop && this.currentFrame === (this.length - 1));
    }

    getCurrentFramePosition(): { x: number, y: number } {
        const col = this.startCol + this.currentFrame;
        const x = col * this.width;
        const y = this.startRow * this.height;
        return {x, y};
    }

    getCurrentFrameNumber(): number {
        return this.currentFrame;
    }
}

export class SoundEffect {
    private static audioContext: AudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    private src: string;
    private buffer: AudioBuffer | null = null;
    private mute: boolean = false;
    private playing: boolean = false;
    private gainNode: GainNode;
    private currentSource: AudioBufferSourceNode | null = null;
    private previousVolume: number = 1;

    constructor(src: string) {
        this.src = src;
        this.gainNode = SoundEffect.audioContext.createGain();
        this.gainNode.connect(SoundEffect.audioContext.destination);
        this.loadSound();
    }

    public setVolume(volume: number): void {
        if (!this.mute) {
            this.gainNode.gain.value = volume;
        }
        this.previousVolume = volume;
    }

    public setSoundEnabled(enabled: boolean): void {
        this.mute = !enabled;
        this.gainNode.gain.value = this.mute ? 0 : this.previousVolume;
    }

    private async loadSound(): Promise<void> {
        try {
            const response = await fetch(this.src);
            const arrayBuffer = await response.arrayBuffer();
            this.buffer = await SoundEffect.audioContext.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error('Error loading sound:', e);
        }
    }

    public async play(): Promise<void> {
        if (this.mute || !this.buffer) {
            return;
        }
        try {
            if (SoundEffect.audioContext.state === 'suspended') {
                await SoundEffect.audioContext.resume();
            }
            const source = SoundEffect.audioContext.createBufferSource();
            source.buffer = this.buffer;
            source.connect(this.gainNode);
            source.start(0);
            this.currentSource = source;
            this.playing = true;
            source.onended = () => {
                this.playing = false;
                this.currentSource = null;
            };
        } catch (e) {
            console.error('Error playing sound:', e);
        }
    }

    public stop(): void {
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource.disconnect();
            this.currentSource = null;
            this.playing = false;
        }
    }

    public isPlaying(): boolean {
        return this.playing;
    }
}

export class CollisionDetector {
    static hasCollided(objectA: GameObject, objectB: GameObject): boolean {
        if (!objectA.isActive || !objectB.isActive) {
            return false;
        }
        const posA = objectA.position;
        const sizeA = objectA.size;
        const posB = objectB.position;
        const sizeB = objectB.size;

        return (
            posA.x < posB.x + sizeB.width &&
            posA.x + sizeA.width > posB.x &&
            posA.y < posB.y + sizeB.height &&
            posA.y + sizeA.height > posB.y
        );
    }
}

export class CollisionManager {
    private collisionCallbacks: Map<string, (objectA: GameObject, objectB: GameObject) => void>;
    private collidedPairs: Set<string>;

    constructor() {
        this.collisionCallbacks = new Map();
        this.collidedPairs = new Set();
    }

    checkCollisions(objects: GameObject[]): void {
        this.collidedPairs.clear();
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                const objectA = objects[i];
                const objectB = objects[j];
                const pairKey = this.getPairKey(objectA.id, objectB.id);
                // TODO
                // && !this.collidedPairs.has(pairKey) // dont remember why this is commented
                if (CollisionDetector.hasCollided(objectA, objectB)) {
                    this.collidedPairs.add(pairKey);
                    this.handleCollision(objectA, objectB);
                }
            }
        }
    }

    private getPairKey(idA: string, idB: string): string {
        return idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
    }

    private handleCollision(objectA: GameObject, objectB: GameObject): void {
        const key = this.getPairKey(objectA.id, objectB.id);
        if (this.collisionCallbacks.has(key)) {
            this.collisionCallbacks.get(key)!(objectA, objectB);
            // TODO
            // dont remember why this is commented
            //  if (objectA.id < objectB.id) {
            //      this.collisionCallbacks.get(key)(objectA, objectB);
            //  } else {
            //      this.collisionCallbacks.get(key)(objectB, objectA);
            //  }
        }
    }

    addCollisionCallback(idA: string, idB: string, callback: (objectA: GameObject, objectB: GameObject) => void): void {
        const key = this.getPairKey(idA, idB);
        this.collisionCallbacks.set(key, callback);
    }
}