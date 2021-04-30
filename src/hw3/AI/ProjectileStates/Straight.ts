import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import ProjectileAI from "../ProjectileAI";
import ProjectileState from "./ProjectileState";


export default class Straight extends ProjectileState {
    constructor(parent: ProjectileAI, owner: AnimatedSprite){
        super(parent, owner);
    }

    onEnter(options: Record<string, any>): void {
    }
    handleInput(event: GameEvent): void {}
    update(deltaT: number): void {
        this.owner.move(this.parent.direction.normalized().scale(this.parent.speed * deltaT));
    }
    onExit(): Record<string, any> { return {} }

}