import StateMachineAI from "../../Wolfie2D/AI/StateMachineAI";
import Queue from "../../Wolfie2D/DataTypes/Queue";
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

export default class CharacterController extends StateMachineAI implements BattlerAI {
    // Fields from BattlerAI
    health: number;

    // The actual player sprite
    owner: AnimatedSprite;

    // The inventory of the player
    private inventory: InventoryManager;

    // Ally attributes
    private following: CharacterController;
    private followingDistance: number;
    private destinationPos: Queue<Vec2>;
    private destinationRot: Queue<number>;
    private lookDirection: Vec2;

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

    

    destroy() {
        // Get rid of our reference to the owner
        delete this.owner;
    }

    addToInventory(item: Item) {
        this.inventory.addItem(item);
    }

    private forceFollowPosition() {
        if (this.owner.rotation === 0)
            this.owner.position.set(this.following.owner.position.x,
                                    this.following.owner.position.y + this.followingDistance);
        else if (this.owner.rotation === Math.PI)
            this.owner.position.set(this.following.owner.position.x,
                                    this.following.owner.position.y - this.followingDistance);
        else if (this.owner.rotation === Math.PI/2)
            this.owner.position.set(this.following.owner.position.x - this.followingDistance,
                                    this.following.owner.position.y);
        else if (this.owner.rotation === 3*Math.PI/2)
            this.owner.position.set(this.following.owner.position.x + this.followingDistance,
                                    this.following.owner.position.y);
    }

    initializeAI(owner: AnimatedSprite, options: Record<string, any>): void {
        this.owner = owner;
        this.health = 5;
        this.inventory = options.inventory;
        this.direction = Vec2.ZERO;
        this.speed = options.speed;
        this.lookDirection = Vec2.ZERO;
        this.receiver.subscribe(Events.PLAYER_ROTATE);
        this.following = options.following;
        this.followingDistance = options.followingDistance;
        if (this.following)
            this.forceFollowPosition();
        this.destinationPos = new Queue(1000000);
        this.destinationRot = new Queue(1000000);
    }

    private crossInflection(rot: number, pos: Vec2, currentPos: Vec2) {
        return rot === 0 && currentPos.y <= pos.y ||
               rot === Math.PI && currentPos.y >= pos.y ||
               rot === Math.PI/2 && currentPos.x <= pos.x ||
               rot === 3*Math.PI/2 && currentPos.x >= pos.x;
    }

    private allyUpdate(deltaT: number): void {
        this.speed = this.following.speed;
        this.direction = this.following.direction;
        const distToFollower = this.owner.position.distanceTo(this.following.owner.position);
        // Speed up if left behind
        if (distToFollower - this.followingDistance >= 1) {
            const catchUpFactor = this.speed + (distToFollower - this.followingDistance) ** 1.5;
            this.speed = catchUpFactor;
        }

        // If player has rotated, move to that point of rotation (inflection)
        if (this.destinationRot.hasItems()) {
            const pos = this.destinationPos.peekNext();
            const rot = this.destinationRot.peekNext();
            let dist = this.owner.position.dirTo(pos).normalized().scale(this.speed * deltaT);
            const futurePos = this.owner.position.clone().add(dist);
            // If the future position would cross the inflection point, then move at a lower speed to reach exactly at the point
            if (this.crossInflection(this.owner.rotation, pos, futurePos)) {
                dist = pos.clone().sub(this.owner.position);
                this.destinationPos.dequeue();
                const rot = this.destinationRot.dequeue();
                this.owner.rotation = rot;
            }
            this.owner.move(dist)
            this.owner.animation.playIfNotAlready("WALK", true);
        } else if (!this.direction.isZero()
            ) {
            this.owner.move(this.owner.position.dirTo(this.following.owner.position).normalized().scale(this.speed * deltaT));
            this.owner.animation.playIfNotAlready("WALK", true);
        } else {
            this.owner.animation.playIfNotAlready("IDLE", true);
        }
        
        if (this.receiver.hasNextEvent()) {
            let event = this.receiver.getNextEvent();
            if (event.type === Events.PLAYER_ROTATE) {
                const rot = event.data.get("rotation");
                const pos = event.data.get("position");
                this.destinationRot.enqueue(rot);
                this.destinationPos.enqueue(pos);
            }
        }
    }

    private playerUpdate(deltaT: number) {
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

    update(deltaT: number): void {
        if (this.following) {
            this.allyUpdate(deltaT);
        } else {
            this.playerUpdate(deltaT);
        }
    }

    damage(damage: number): void {
        this.health -= damage;
    }
}