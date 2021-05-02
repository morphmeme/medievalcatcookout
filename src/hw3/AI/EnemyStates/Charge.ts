import AABB from "../../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import GameNode from "../../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Timer from "../../../Wolfie2D/Timing/Timer";
import EnemyAI, { EnemyStates } from "../EnemyAI";
import EnemyState from "./EnemyState";

export default class Charge extends EnemyState {
    exitTimer: Timer;

    // The current known position of the player
    playerPos: Vec2;

    // The last known position of the player
    lastPlayerPos: Vec2;

    // The return object for this state
    retObj: Record<string, any>;

    constructor(parent: EnemyAI, owner: AnimatedSprite){
        super(parent, owner);

        this.exitTimer = new Timer(1000);
    }

    onEnter(options: Record<string, any>): void {
        this.lastPlayerPos = this.parent.getPlayerPosition();

        // Reset the return object
        this.retObj = {};
    }

    handleInput(event: GameEvent): void {}

    update(deltaT: number): void {
        if (!this.owner.active) {
            return;
        }
        this.playerPos = this.parent.getPlayerPosition();

        if(this.playerPos !== null){
            // If we see a new player position, update the last position
            this.lastPlayerPos = this.playerPos;
        }

        if(this.playerPos !== null){
            // Player is visible, restart the exitTimer
            this.exitTimer.start();

            // Fire at player
            const dir = this.owner.position.dirTo(this.playerPos);
            this.parent.rotation = Vec2.UP.angleToCCW(dir);
            this.parent.moveWithRotation(deltaT);
            this.parent.setMovingAnimation();
        }

        if(this.exitTimer.isStopped()){
            // We haven't seen the player in a while, go check out where we last saw them, if possible
            if(this.lastPlayerPos !== null){
                this.retObj = {target: this.lastPlayerPos}
                this.finished(EnemyStates.ALERT);
            } else {
                this.finished(EnemyStates.DEFAULT);
            }
        }
    }

    onExit(): Record<string, any> {
        return this.retObj;
    }

}