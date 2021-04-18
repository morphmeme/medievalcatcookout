import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import Input from "../../../Wolfie2D/Input/Input";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { Events } from "../../Constants";
import Healthpack from "../../GameSystems/items/Healthpack";
import CharacterController from "../CharacterController";
import CharacterState from "./CharacterState";

export default class Player extends CharacterState {
    constructor(parent: CharacterController, owner: AnimatedSprite){
        super(parent, owner);
    }
    
    onEnter(options: Record<string, any>): void {
    }

    handleInput(event: GameEvent): void {
    }

    update(deltaT: number): void {
        this.parent.inventory.update();
        // Get the movement direction
        if (Input.isPressed("forward") && this.owner.rotation !== Math.PI) {
            this.parent.direction.y = -1;
            this.parent.direction.x = 0;
            const newRotation = 0;
            if (this.owner.rotation !== newRotation)
                this.emitter.fireEvent(Events.PLAYER_ROTATE, {position: this.owner.position.clone(), rotation: newRotation});
            this.owner.rotation = newRotation;
        } else if (Input.isPressed("backward") && this.owner.rotation !== 0) {
            this.parent.direction.y = 1;
            this.parent.direction.x = 0;
            const newRotation = Math.PI;
            if (this.owner.rotation !== Math.PI)
                this.emitter.fireEvent(Events.PLAYER_ROTATE, {position: this.owner.position.clone(), rotation: newRotation});
            this.owner.rotation = newRotation;
        } else if (Input.isPressed("left") && this.owner.rotation !== 3*Math.PI/2) {
            this.parent.direction.x = -1;
            this.parent.direction.y = 0;
            const newRotation = Math.PI/2;
            if (this.owner.rotation !== newRotation)
                this.emitter.fireEvent(Events.PLAYER_ROTATE, {position: this.owner.position.clone(), rotation: newRotation});
            this.owner.rotation = newRotation;
        } else if (Input.isPressed("right") && this.owner.rotation !== Math.PI/2) {
            this.parent.direction.x = 1;
            this.parent.direction.y = 0;
            const newRotation = 3*Math.PI/2;
            if (this.owner.rotation !== newRotation)
                this.emitter.fireEvent(Events.PLAYER_ROTATE, {position: this.owner.position.clone(), rotation: newRotation});
            this.owner.rotation = newRotation;
        }

        if(!this.parent.direction.isZero()){
            // Move the player
            this.owner.move(this.parent.direction.normalized().scale(this.parent.speed * deltaT));
            this.owner.animation.playIfNotAlready("WALK", true);
        } else {
            // Player is idle
            this.owner.animation.playIfNotAlready("IDLE", true);
        }

        const lookDirection = new Vec2(Math.cos(this.owner.rotation + Math.PI/2), Math.sin(this.owner.rotation - Math.PI/2));

        // Shoot a bullet
        if(Input.isMouseJustPressed()){
            // Get the current item
            let item = this.parent.inventory.getWeapon(this.owner);
            
            // If there is an item in the current slot, use it
            if(item){
                item?.use(this.owner, "player", lookDirection);

                if(item instanceof Healthpack){
                    // Destroy the used healthpack
                    this.parent.inventory.removeItem();
                }
            }
        }
    }

    onExit(): Record<string, any> {
        return {};
    }

}