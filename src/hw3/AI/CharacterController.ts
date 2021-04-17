import StateMachineAI from "../../Wolfie2D/AI/StateMachineAI";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import GameNode from "../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import { Events } from "../Constants";
import InventoryManager from "../GameSystems/InventoryManager";
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

    enemies: Array<GameNode>

    allies: Array<GameNode>

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
        this.allies = options.allies;
        this.direction = Vec2.ZERO;
        this.speed = options.speed || 0;
        this.enemies = [];

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

    public setEnemies(enemies: Array<GameNode>) {
        this.enemies = enemies;
    }

    public nearestEnemy() {
        let minDist = Number.MAX_VALUE;
        let minEnemy = null;
        for (const enemy of this.enemies) {
            const dist = this.owner.position.distanceSqTo(enemy.position);
            if (dist < minDist) {
                minDist = dist;
                minEnemy = enemy;
            }
        }
        const walls = <OrthogonalTilemap> this.owner.getScene().getLayer("Wall").getItems()[0];
        console.log(this.allies.filter(ally => ally !== this.owner).length);
        if (minEnemy && MathUtils.visibleBetweenPos(this.owner.position, minEnemy.position, walls, this.allies.filter(ally => ally !== this.owner)))
            return minEnemy;
        return null;
    }
}

export enum CharacterStates {
    DEFAULT = "default",
}