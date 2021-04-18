import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import CharacterController from "../CharacterController";
import CharacterState from "./CharacterState";

// TODO force collide physics & animations
export default class Rescue extends CharacterState {
    constructor(parent: CharacterController, owner: AnimatedSprite){
        super(parent, owner);
    }
    
    // Do damage
    onEnter(options: Record<string, any>): void {
    }

    handleInput(event: GameEvent): void {
    }

    update(deltaT: number): void {

    }

    onExit(): Record<string, any> {
        return {};
    }

}