import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameNode from "../../../../Wolfie2D/Nodes/GameNode";
import Graphic from "../../../../Wolfie2D/Nodes/Graphic";
import AnimatedSprite from "../../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Sprite from "../../../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../../../Wolfie2D/Scene/Scene";
import CharacterController from "../../../AI/CharacterController";
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
        this.stab.rotation = Vec2.DOWN.angleToCCW(direction)- Math.PI/2;
        console.log(this.stab.size);
        console.log(this.stab.size.scaled(2,1));
        // Move the slice out from the player
        this.stab.position = attacker.position.clone().add(direction.scaled(32));
        scene.emitter.fireEvent("play_sound", {key: "slash", loop:false, holdReferemce: false});
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

    playerSpecial(user: GameNode) {
        // speed up speed by 10x
        (user.ai as CharacterController).slowed = 10;
    }
    
}