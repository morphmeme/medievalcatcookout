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
import PlayerController from "./PlayerController";

export default class AllyController extends StateMachineAI implements BattlerAI {
    // Fields from BattlerAI
    health: number;

    // The actual player sprite
    owner: AnimatedSprite;

    // The inventory of the player
    private inventory: InventoryManager;

    // Movement
    private following: PlayerController;
    private followingDistance: number;

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

    private destinationPos: Queue<Vec2>;
    private destinationRot: Queue<number>;

    destroy() {
        // Get rid of our reference to the owner
        delete this.owner;
    }

    addToInventory(item: Item) {
        this.inventory.addItem(item);
    }

    forceFollowPosition() {
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
        this.receiver.subscribe(Events.PLAYER_ROTATE);
        this.following = options.following;
        this.followingDistance = options.followingDistance;
        this.forceFollowPosition();
        this.destinationPos = new Queue(1000000);
        this.destinationRot = new Queue(1000000);
    }

    activate(options: Record<string, any>): void {}

    handleEvent(event: GameEvent): void {}

    crossInflection(rot: number, pos: Vec2, currentPos: Vec2) {
        return rot === 0 && currentPos.y <= pos.y ||
               rot === Math.PI && currentPos.y >= pos.y ||
               rot === Math.PI/2 && currentPos.x <= pos.x ||
               rot === 3*Math.PI/2 && currentPos.x >= pos.x;
    }

    update(deltaT: number): void {
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

    damage(damage: number): void {
        this.health -= damage;

        if(this.health <= 0){
            console.log("Game Over");
        }
    }
}