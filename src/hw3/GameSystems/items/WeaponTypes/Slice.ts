import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameNode from "../../../../Wolfie2D/Nodes/GameNode";
import Graphic from "../../../../Wolfie2D/Nodes/Graphic";
import AnimatedSprite from "../../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../../../Wolfie2D/Scene/Scene";
import WeaponType from "./WeaponType";

export default class Slice extends WeaponType {
    private slice: AnimatedSprite;
    initialize(options: Record<string, any>): void {
        this.damage = options.damage;
        this.cooldown = options.cooldown;
        this.displayName = options.displayName;
        this.spriteKey = options.spriteKey;
        this.useVolume = options.useVolume;
    }

    doAnimation(scene: Scene, attacker: GameNode, direction: Vec2): void {
        this.slice = scene.add.animatedSprite("slice", "primary");
        this.slice.animation.play("NORMAL", true);

        // Rotate this with the game node
        this.slice.rotation = attacker.rotation;

        // Move the slice out from the player
        this.slice.position = attacker.position.clone().add(direction.scaled(16));
        
        // Play the slice animation w/o loop, but queue the normal animation
        this.slice.animation.play("SLICE");
        this.slice.animation.queue("NORMAL", true);
    }

    hits(node: GameNode): boolean {
        if (!node) {
            return false;
        }
        return this.slice.boundary.overlaps(node.collisionShape);
    }
}