import Queue from "../../../Wolfie2D/DataTypes/Queue";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Timer from "../../../Wolfie2D/Timing/Timer";
import { Events } from "../../Constants";
import CharacterController from "../CharacterController";
import CharacterState from "./CharacterState";

export default class Ally extends CharacterState {
    private destinationPos: Queue<Vec2>;
    private destinationRot: Queue<number>;
    private pollTimer: Timer;

    constructor(parent: CharacterController, owner: AnimatedSprite, private followingDistance: number){
        super(parent, owner);

        this.pollTimer = new Timer(100);
    }
    
    onEnter(options: Record<string, any>): void {
        this.forceFollowPosition();
        this.destinationPos = new Queue(100000);
        this.destinationRot = new Queue(100000);
    }

    handleInput(event: GameEvent): void {
        if (event.type === Events.PLAYER_ROTATE) {
            const rot = event.data.get("rotation");
            const pos = event.data.get("position");
            this.destinationRot.enqueue(rot);
            this.destinationPos.enqueue(pos);
        }
    }

    private forceFollowPosition() {
        if (this.parent.following.owner.rotation === 0) {
            this.owner.position.set(this.parent.following.owner.position.x,
                this.parent.following.owner.position.y + this.followingDistance);
        } else if (this.parent.following.owner.rotation === Math.PI) {
            this.owner.position.set(this.parent.following.owner.position.x,
                this.parent.following.owner.position.y - this.followingDistance);
        } else if (this.parent.following.owner.rotation === Math.PI/2) {
            this.owner.position.set(this.parent.following.owner.position.x + this.followingDistance,
                this.parent.following.owner.position.y);
        } else if (this.parent.following.owner.rotation === 3*Math.PI/2) {
            this.owner.position.set(this.parent.following.owner.position.x - this.followingDistance,
                this.parent.following.owner.position.y);
        }
        this.owner.rotation = this.parent.following.owner.rotation;
    }

    private crossInflection(rot: number, pos: Vec2, currentPos: Vec2) {
        return rot === 0 && currentPos.y <= pos.y ||
               rot === Math.PI && currentPos.y >= pos.y ||
               rot === Math.PI/2 && currentPos.x <= pos.x ||
               rot === 3*Math.PI/2 && currentPos.x >= pos.x;
    }

    update(deltaT: number): void {
        // Using weapon
        if(this.pollTimer.isStopped()){
            this.pollTimer.start();
            const enemyPos = this.parent.nearestEnemy()?.position;
            if(enemyPos){
                let dir = enemyPos.clone().sub(this.owner.position).normalize();
                const weapon = this.parent.inventory.getWeapon(this.owner);
                weapon?.use(this.owner, "player", dir)
            }
        }


        this.parent.speed = this.parent.following.speed;
        this.parent.direction = this.parent.following.direction;
        const distToFollower = this.owner.position.distanceTo(this.parent.following.owner.position);
        // Speed up if left behind
        if (distToFollower - this.followingDistance >= 1) {
            const catchUpFactor = this.parent.speed + (distToFollower - this.followingDistance) ** 1.5;
            this.parent.speed = catchUpFactor;
        }

        // If player has rotated, move to that point of rotation (inflection)
        if (this.destinationRot.hasItems()) {
            const pos = this.destinationPos.peekNext();
            const rot = this.destinationRot.peekNext();
            let dist = this.owner.position.dirTo(pos).normalized().scale(this.parent.speed * deltaT);
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
        } else if (!this.parent.direction.isZero()
            ) {
            this.owner.move(this.owner.position.dirTo(this.parent.following.owner.position).normalized().scale(this.parent.speed * deltaT));
            this.owner.animation.playIfNotAlready("WALK", true);
        } else {
            this.owner.animation.playIfNotAlready("IDLE", true);
        }
    }

    onExit(): Record<string, any> {
        return {};
    }

}