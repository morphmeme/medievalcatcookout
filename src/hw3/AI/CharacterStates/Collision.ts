import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import GameNode from "../../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import NavigationPath from "../../../Wolfie2D/Pathfinding/NavigationPath";
import Timer from "../../../Wolfie2D/Timing/Timer";
import { Names } from "../../Constants";
import CharacterController from "../CharacterController";
import EnemyAI, { EnemyStates } from "../EnemyAI";
import CharacterState from "./CharacterState";

// TODO force collide physics & animations
export default class Collision extends CharacterState {
    constructor(parent: CharacterController, owner: AnimatedSprite){
        super(parent, owner);
    }
    
    // Do damage
    onEnter(options: Record<string, any>): void {
    }

    handleInput(event: GameEvent): void {

    }

    /**
     * Apply a constant force in the collision direction
     * 
     */
    update(deltaT: number): void {

    }

    onExit(): Record<string, any> {
        return {};
    }

}