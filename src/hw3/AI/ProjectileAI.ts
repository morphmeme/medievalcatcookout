import StateMachineAI from "../../Wolfie2D/AI/StateMachineAI";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Straight from "./ProjectileStates/Straight";

export default class ProjectileAI extends StateMachineAI {
    health: number = 1;
    maxHealth: number = 1;
    direction: Vec2;
    owner: AnimatedSprite;
    speed: number;
    dmg: number;

    damage(damage: number) {
        this.health -= damage;
        if (this.health <= 0) {
            this.owner.setAIActive(false, {});
            this.owner.isCollidable = false;
            this.owner.visible = false;
            this.owner.disablePhysics();
            this.owner.destroy();
        }
    }
    initializeAI(owner: AnimatedSprite, options: Record<string, any>): void {
        this.owner = owner;
        this.direction = options.direction;
        this.dmg = options.dmg;
        this.speed = options.speed;

        this.addState(ProjectileStates.STRAIGHT, new Straight(this, owner));
        switch (options.type) {
            default:
                this.initialize(ProjectileStates.STRAIGHT);
        }
    }
}

export enum ProjectileStates {
    STRAIGHT = "STRAIGHT",
}