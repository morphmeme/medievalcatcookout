import StateMachineAI from "../../../Wolfie2D/AI/StateMachineAI";
import State from "../../../Wolfie2D/DataTypes/State/State";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import CanvasNode from "../../../Wolfie2D/Nodes/CanvasNode";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Timer from "../../../Wolfie2D/Timing/Timer";


const COLLISION_DURATION_MS = 50;
const COLLISION_SPEED = 50;

// TODO force collide physics & animations
export default class Collision extends State {
    private durationTimer: Timer;
    private previousState: string;

    constructor(parent: StateMachineAI, private owner: CanvasNode, private direction: Vec2){
        super(parent);
    }
    
    // Do damage
    onEnter(options: Record<string, any>): void {
        this.durationTimer = new Timer(COLLISION_DURATION_MS);
        this.durationTimer.start();
        this.previousState = options.previousState;
    }

    handleInput(event: GameEvent): void {

    }

    /**
     * Apply a constant force in the collision direction
     */
    update(deltaT: number): void {
        if (this.durationTimer.isStopped()) {
            this.finished(this.previousState);
        } else {
            this.owner.move(this.direction.normalized().scale(COLLISION_SPEED * deltaT));
        }
    }

    onExit(): Record<string, any> {
        return {};
    }
}