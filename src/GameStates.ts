export const GameStates = {
    TITLE: 'title',
    IN_GAME: 'in_game',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    HI_SCORES: 'hi_scores',
};

export const GameObjectIds = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    ITEM: 'item',
    BULLET: 'bullet',
    EXPLOSION: 'explosion',
    PARTICLE: 'particle',
    AMMO: 'ammo',
};

export const PlayerStates = {
    IDLE: 'Idle',
    MOVING_LEFT: 'MovingLeft',
    MOVING_RIGHT: 'MovingRight',
    MOVING_UP: 'MovingUp',
    MOVING_DOWN: 'MovingDown',
};

export const EnemyStates = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
};

export class StateManager {
    private currentState: string;
    private previousState: string | null;
    private stateChangeCallbacks: Map<string, (() => void)[]>;

    constructor(initialState: string) {
        this.currentState = initialState;
        this.previousState = null;
        this.stateChangeCallbacks = new Map();
    }

    setState(newState: string): void {
        if (this.currentState !== newState) {
            this.previousState = this.currentState;
            this.currentState = newState;
            this.onStateChange(newState);
        }
    }

    getCurrentState(): string {
        return this.currentState;
    }

    getPreviousState(): string | null {
        return this.previousState;
    }

    private onStateChange(state: string): void {
        if (this.stateChangeCallbacks.has(state)) {
            this.stateChangeCallbacks.get(state)!.forEach(callback => callback());
        }
    }

    addStateChangeCallback(state: string, callback: () => void): void {
        if (!this.stateChangeCallbacks.has(state)) {
            this.stateChangeCallbacks.set(state, []);
        }
        this.stateChangeCallbacks.get(state)!.push(callback);
    }
}