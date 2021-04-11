import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Emitter from "../../Wolfie2D/Events/Emitter";
import GameEvent from "../../Wolfie2D/Events/GameEvent";
import Input from "../../Wolfie2D/Input/Input";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { Events } from "../Constants";
import InventoryManager from "../GameSystems/InventoryManager";
import Healthpack from "../GameSystems/items/Healthpack";
import Item from "../GameSystems/items/Item";
import BattlerAI from "./BattlerAI";

export default class PlayerController implements BattlerAI {
    // Fields from BattlerAI
    health: number;

    // The actual player sprite
    owner: AnimatedSprite;

    // The inventory of the player
    private inventory: InventoryManager;

    // Movement
    private _direction: Vec2;
    get direction() {
        return this._direction;
    }
    set direction(x: Vec2) {
        this._direction = x;
    }

    private _speed: number;
    get speed() {
        return this._speed;
    }
    set speed(x: number) {
        this._speed = x;
    }

    // Attacking
    private lookDirection: Vec2;
    private emitter: Emitter;

    destroy() {
        // Get rid of our reference to the owner
        delete this.owner;
    }

    addToInventory(item: Item) {
        this.inventory.addItem(item);
    }

    initializeAI(owner: AnimatedSprite, options: Record<string, any>): void {
        this.owner = owner;
        this.direction = Vec2.ZERO;
        this.lookDirection = Vec2.ZERO;
        this.speed = options.speed;
        this.health = 5;
        this.inventory = options.inventory;
        this.emitter = new Emitter();
    }

    activate(options: Record<string, any>): void {}

    handleEvent(event: GameEvent): void {}

    update(deltaT: number): void {
        // Get the movement direction
        if (Input.isPressed("forward") && this.owner.rotation !== Math.PI) {
            this.direction.y = -1;
            this.direction.x = 0;
            const newRotation = 0;
            if (this.owner.rotation !== newRotation)
                this.emitter.fireEvent(Events.PLAYER_ROTATE, {position: this.owner.position.clone(), rotation: newRotation});
            this.owner.rotation = newRotation;
        } else if (Input.isPressed("backward") && this.owner.rotation !== 0) {
            this.direction.y = 1;
            this.direction.x = 0;
            const newRotation = Math.PI;
            if (this.owner.rotation !== Math.PI)
                this.emitter.fireEvent(Events.PLAYER_ROTATE, {position: this.owner.position.clone(), rotation: newRotation});
            this.owner.rotation = newRotation;
        } else if (Input.isPressed("left") && this.owner.rotation !== 3*Math.PI/2) {
            this.direction.x = -1;
            this.direction.y = 0;
            const newRotation = Math.PI/2;
            if (this.owner.rotation !== newRotation)
                this.emitter.fireEvent(Events.PLAYER_ROTATE, {position: this.owner.position.clone(), rotation: newRotation});
            this.owner.rotation = newRotation;
        } else if (Input.isPressed("right") && this.owner.rotation !== Math.PI/2) {
            this.direction.x = 1;
            this.direction.y = 0;
            const newRotation = 3*Math.PI/2;
            if (this.owner.rotation !== newRotation)
                this.emitter.fireEvent(Events.PLAYER_ROTATE, {position: this.owner.position.clone(), rotation: newRotation});
            this.owner.rotation = newRotation;
        }

        if(!this.direction.isZero()){
            // Move the player
            this.owner.move(this.direction.normalized().scale(this.speed * deltaT));
            this.owner.animation.playIfNotAlready("WALK", true);
        } else {
            // Player is idle
            this.owner.animation.playIfNotAlready("IDLE", true);
        }

        this.lookDirection = new Vec2(Math.cos(this.owner.rotation + Math.PI/2), Math.sin(this.owner.rotation - Math.PI/2));

        // Shoot a bullet
        if(Input.isMouseJustPressed()){
            // Get the current item
            let item = this.inventory.getItem();

            // If there is an item in the current slot, use it
            if(item){
                item.use(this.owner, "player", this.lookDirection);

                if(item instanceof Healthpack){
                    // Destroy the used healthpack
                    this.inventory.removeItem();
                }
            }
        }

        // Check for slot change
        if(Input.isJustPressed("slot1")){
            this.inventory.changeSlot(0);
        } else if(Input.isJustPressed("slot2")){
            this.inventory.changeSlot(1);
        }
    }

    damage(damage: number): void {
        this.health -= damage;

        if(this.health <= 0){
            console.log("Game Over");
        }
    }
}