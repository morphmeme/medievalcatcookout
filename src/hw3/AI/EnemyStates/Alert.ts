import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import GameNode from "../../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import NavigationPath from "../../../Wolfie2D/Pathfinding/NavigationPath";
import Timer from "../../../Wolfie2D/Timing/Timer";
import { Names } from "../../Constants";
import EnemyAI, { Attacks, EnemyStates } from "../EnemyAI";
import EnemyState from "./EnemyState";

/** When an enemy hears a gunshot, it will rush to the location of the gunshot */
export default class Alert extends EnemyState {
    /** The path to move towards the alert position on */
    private path: NavigationPath;

    /** A timer to tell us how long to be alerted for */
    private alertTimer: Timer;

    constructor(parent: EnemyAI, owner: AnimatedSprite){
        super(parent, owner);

        this.alertTimer = new Timer(10000);
    }
    
    // Receives options.target
    onEnter(options: Record<string, any>): void {
        this.path = this.owner.getScene().getNavigationManager().getPath(Names.NAVMESH, this.owner.position, options.target);
        this.alertTimer.start();
    }

    handleInput(event: GameEvent): void {

    }

    /**
     * While in the alert state, an enemy should move towards the target position received in onEnter.
     * 
     * Your job is to make sure that for the duration of the alert state, the enemy moves towards this
     * target position.
     */
    update(deltaT: number): void {
        if(this.alertTimer.isStopped()){
            // The timer is up, return to the default state
            this.finished(EnemyStates.DEFAULT);
            return;
        }
        if(!this.path.isDone()){
            this.owner.moveOnPath(this.parent.speed * deltaT, this.path);
            this.parent.rotation = Vec2.UP.angleToCCW(this.path.getMoveDirection(this.owner));
            this.parent.setMovingAnimation();
        }

        if(this.parent.getPlayerPosition() !== null){
            if (this.parent.attack === Attacks.charge) {
                this.finished(EnemyStates.CHARGING);
            } else {
                this.finished(EnemyStates.ATTACKING);
            }
        }
    }

    onExit(): Record<string, any> {
        return {};
    }

}