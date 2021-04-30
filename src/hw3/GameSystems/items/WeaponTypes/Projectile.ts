import AABB from "../../../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import CanvasNode from "../../../../Wolfie2D/Nodes/CanvasNode";
import GameNode, { TweenableProperties } from "../../../../Wolfie2D/Nodes/GameNode";
import Scene from "../../../../Wolfie2D/Scene/Scene";
import MathUtils from "../../../../Wolfie2D/Utils/MathUtils";
import ProjectileAI from "../../../AI/ProjectileAI";
import { Events } from "../../../Constants";
import WeaponType from "./WeaponType";

export default class Projectile extends WeaponType {
    private speed: number;
    initialize(options: Record<string, any>): void {
        this.damage = options.damage;
        this.cooldown = options.cooldown;
        this.displayName = options.displayName;
        this.spriteKey = options.spriteKey;
        this.useVolume = options.useVolume;
        this.speed = options.speed || 100;
    }

    doAnimation(scene: Scene, shooter: GameNode, direction: Vec2): void {
        const projectile = scene.add.animatedSprite("player", "primary");
        const normDirection = direction.normalized();
        const shooterBoundary = (shooter as CanvasNode).boundary;
        const boundaryHalfSize = shooterBoundary?.halfSize;
        const projectilePosition = boundaryHalfSize 
            ? new Vec2(shooter.position.x + normDirection.x * boundaryHalfSize.x, shooter.position.y + normDirection.y * boundaryHalfSize.y)
            : new Vec2(shooter.position.x, shooter.position.y);
        projectile.position.set(projectilePosition.x, projectilePosition.y);
        //TODO hitbox size
        projectile.addPhysics(new AABB(Vec2.ZERO, new Vec2(4, 4)));
        projectile.addAI(ProjectileAI,
            {
                direction,
                dmg: this.damage,
                speed: this.speed,
            });
        projectile.animation.play("IDLE");
        projectile.setGroup("projectile");
        projectile.setTrigger("enemy", Events.PROJECTILE_COLLIDES_ENEMY, null);
        projectile.setTrigger("player", Events.PROJECTILE_COLLIDES_PLAYER, null);
        projectile.setTrigger("ground", Events.PROJECTILE_COLLIDES_GROUND, null);
    }

    hits(node: GameNode): boolean {
        return false;
    }
}