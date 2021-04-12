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
import Ally from "./CharacterStates/Ally";
import Player from "./CharacterStates/Player";

export default class CharacterController extends StateMachineAI implements BattlerAI {
    // Fields from BattlerAI
    health: number;
    maxHealth: number;

    // The actual player sprite
    owner: AnimatedSprite;

    // The inventory of the player
    inventory: InventoryManager;

    _direction: Vec2;
    get direction() {
        return this._direction;
    }
    set direction(x: Vec2) {
        this._direction = x;
    }

    _speed: number;
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


    initializeAI(owner: AnimatedSprite, options: Record<string, any>): void {
        this.owner = owner;
        this.health = 25;
        this.maxHealth = this.health;
        this.inventory = options.inventory;
        this.direction = Vec2.ZERO;
        this.speed = options.speed;

        this.receiver.subscribe(Events.PLAYER_ROTATE);

        if (options.following) {
            this.addState(CharacterStates.DEFAULT, new Ally(this, owner, options.following, options.followingDistance));
        } else {
            this.addState(CharacterStates.DEFAULT, new Player(this, owner));
        }
        this.initialize(CharacterStates.DEFAULT);
    }

    damage(damage: number): void {
        this.health -= damage;
        this.health = Math.max(this.health, 0);
    }
}

export enum CharacterStates {
    DEFAULT = "default",
}