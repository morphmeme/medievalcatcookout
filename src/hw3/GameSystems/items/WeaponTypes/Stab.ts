import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameNode from "../../../../Wolfie2D/Nodes/GameNode";
import Graphic from "../../../../Wolfie2D/Nodes/Graphic";
import AnimatedSprite from "../../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../../../Wolfie2D/Scene/Scene";
import WeaponType from "./WeaponType";

export default class Stab extends WeaponType {
    private stab: AnimatedSprite;
    initialize(options: Record<string, any>): void {
        this.damage = options.damage;
        this.cooldown = options.cooldown;
        this.displayName = options.displayName;
        this.spriteKey = options.spriteKey;
        this.useVolume = options.useVolume;
    }

    doAnimation(scene: Scene, attacker: GameNode, direction: Vec2): void {
        this.stab = scene.add.animatedSprite("stab", "primary");
        this.stab.animation.play("NORMAL", true);

        // Rotate this with the game node
        this.stab.rotation = attacker.rotation;

        // Move the slice out from the player
        this.stab.position = attacker.position.clone().add(direction.scaled(16));
        
        // Play the slice animation w/o loop, but queue the normal animation
        this.stab.animation.play("STAB");
        this.stab.animation.queue("NORMAL", true);
    }

    hits(node: GameNode): boolean {
        if (!node) {
            return false;
        }
        return this.stab.boundary.overlaps(node.collisionShape);
    }
}