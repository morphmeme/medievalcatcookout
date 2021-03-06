import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import GameNode from "../../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import NavigationPath from "../../../Wolfie2D/Pathfinding/NavigationPath";
import { Events, Names } from "../../Constants";
import EnemyAI, { Attacks, EnemyStates } from "../EnemyAI";
import EnemyState from "./EnemyState";

export default class Guard extends EnemyState {
    private guardPosition: Vec2;

    private awayFromGuardPosition: boolean;

    private route: NavigationPath;

    private retObj: Record<string, any>;
    
    constructor(parent: EnemyAI, owner: AnimatedSprite, guardPosition: Vec2){
        super(parent, owner);

        this.guardPosition = guardPosition;
    }

    onEnter(options: Record<string, any>): void {
        // Go to the guard position if not already there
        if(!(this.owner.position.distanceSqTo(this.guardPosition) < 8*8)){
            // We need a new route
            this.awayFromGuardPosition = true;
            this.owner.pathfinding = true;
            this.route = this.owner.getScene().getNavigationManager().getPath(Names.NAVMESH, this.owner.position, this.guardPosition);
        } else {
            this.awayFromGuardPosition = false;
            this.owner.pathfinding = false;
        }
    }

    handleInput(event: GameEvent): void {
        // if(event.type === Events.SHOT_FIRED){
        //     // Shot was fired. Go check it out if it was close to us
        //     if(this.owner.position.distanceTo(event.data.get("position")) < event.data.get("volume")){
        //         this.retObj = {target: event.data.get("position")};
        //         this.finished(EnemyStates.ALERT);
        //     }
        // }
    }

    update(deltaT: number): void {
        if (!this.owner.active) {
            return;
        }
        if(this.awayFromGuardPosition){
            // Navigate back home
            if(this.route.isDone()){
                this.awayFromGuardPosition = false;
                this.owner.pathfinding = false;
            } else {
                this.owner.moveOnPath(this.parent.speed * deltaT, this.route);
                this.parent.rotation = Vec2.UP.angleToCCW(this.route.getMoveDirection(this.owner));
                this.parent.moveWithRotation(deltaT);
                this.parent.setMovingAnimation();

            }
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
        return this.retObj;
    }

}