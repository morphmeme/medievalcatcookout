import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Emitter from "../../../Wolfie2D/Events/Emitter";
import GameNode from "../../../Wolfie2D/Nodes/GameNode";
import Sprite from "../../../Wolfie2D/Nodes/Sprites/Sprite";
import Timer from "../../../Wolfie2D/Timing/Timer";
import CharacterController from "../../AI/CharacterController";
import { Events } from "../../Constants";
import BattleManager from "../BattleManager";
import Item from "./Item";
import WeaponType from "./WeaponTypes/WeaponType";

export default class Weapon extends Item {
    /** The type of this weapon */
    type: WeaponType;

    /** An event emitter to hook into the EventQueue */
    emitter: Emitter

    /** The battle manager */
    battleManager: BattleManager;

    /** The cooldown timer for this weapon's use */
    cooldownTimer: Timer;

    constructor(sprite: Sprite, type: WeaponType, battleManager?: BattleManager){
        super(sprite);

        // Set the weapon type
        this.type = type;

        // Keep a reference to the sprite of this weapon
        this.sprite = sprite;

        // Create an event emitter
        this.emitter = new Emitter();

        // Save a reference to the battler manager
        this.battleManager = battleManager;

        // Create the cooldown timer
        this.cooldownTimer = new Timer(type.cooldown);
    }

    // @override
    /**
     * Uses this weapon in the specified direction.
     * This only works if the cooldown timer has ended
     */
    use(user: GameNode, userType: string, direction: Vec2): boolean {
        // If the cooldown timer is still running, we can't use the weapon
        if(!this.cooldownTimer.isStopped()){
            return false;
        }
        if (this.type.playerSpecial)
            this.type.playerSpecial(user, userType);

        // Do a type specific weapon animation
        this.type.doAnimation(this.sprite.getScene(), user, direction);

        // Apply damage
        this.battleManager?.handleInteraction(userType, this);

        // Send out an event to alert enemies
        this.emitter.fireEvent(Events.SHOT_FIRED, {position: user.position.clone(), volume: this.type.useVolume});
    
        // Reset the cooldown timer
        this.cooldownTimer.start();

        return true;
    }

    /**
     * A check for whether or not this weapon hit a node
     */
    hits(node: GameNode): boolean {
        return this.type.hits(node);
    }
}