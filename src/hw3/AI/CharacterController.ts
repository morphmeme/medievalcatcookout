import StateMachineAI from "../../Wolfie2D/AI/StateMachineAI";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import GameNode from "../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import { Events } from "../Constants";
import InventoryManager from "../GameSystems/InventoryManager";
import Item from "../GameSystems/items/Item";
import BattlerAI from "./BattlerAI";
import Ally from "./CharacterStates/Ally";
import Player from "./CharacterStates/Player";
import Rescue from "./CharacterStates/Rescue";
import Timer from "../../Wolfie2D/Timing/Timer";

export default class CharacterController extends StateMachineAI implements BattlerAI {
    dead: boolean;

    invulnerable: boolean;
    // Fields from BattlerAI
    health: number;
    maxHealth: number;

    // The actual player sprite
    owner: AnimatedSprite;

    enemies: Array<GameNode>

    allies: Array<GameNode>

    // The inventory of the player
    inventory: InventoryManager;

    following: CharacterController;
    followingDistance: number;

    rescue: boolean;

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
    public slowed: number;
    private viewport: Viewport;
    public rotation: number = 0;
    protected invulTimer: Timer;

    destroy() {
        // Get rid of our reference to the owner
        delete this.owner;
    }

    addToInventory(item: Item) {
        this.inventory.addItem(item);
    }


    initializeAI(owner: AnimatedSprite, options: Record<string, any>): void {
        this.owner = owner;
        this.health = options.health || 25;
        this.invulnerable = false;
        this.maxHealth = options.maxHealth || 25;
        this.inventory = options.inventory;
        this.allies = options.allies;
        this.viewport = options.viewport;
        this.direction = Vec2.ZERO;
        this.speed = options.speed || 0;
        this.slowed = 1;
        this.following = options.following;
        this.enemies = [];
        this.rescue = options.rescue;
        this.followingDistance = options.followingDistance;

        this.invulTimer = new Timer(300, ()=> {
            this.invulnerable = false;
        })

        this.receiver.subscribe(Events.PLAYER_ROTATE);

        this.addState(CharacterStates.ALLY, new Ally(this, owner, options.followingDistance));
        this.addState(CharacterStates.PLAYER, new Player(this, owner));
        this.addState(CharacterStates.RESCUE, new Rescue(this, owner));
        if (options.following) {
            this.initialize(CharacterStates.ALLY);
        } else if (this.rescue) {
            this.initialize(CharacterStates.RESCUE);
        } else {
            this.initialize(CharacterStates.PLAYER);
        }
    }

    rescued(following: CharacterController, followingDistance: number) {
        this.followingDistance = followingDistance;
        this.rescue = false;
        this.following = following;
        this.owner.setGroup("player");
        this.owner.setTrigger("player", Events.PLAYER_COLLIDES_PLAYER, null);
        // Copy ally's rotations
        if (following.currentState instanceof Ally) {
            const destinationPos = (following.currentState as Ally).destinationPos.clone();
            const destinationRot = (following.currentState as Ally).destinationRot.clone();
            this.addState(CharacterStates.ALLY, new Ally(this, this.owner, followingDistance, destinationPos, destinationRot));
        } else {
            this.addState(CharacterStates.ALLY, new Ally(this, this.owner, followingDistance));
        }
        
        this.changeState(CharacterStates.ALLY);
    }

    damage(damage: number): void {
        if(this.invulnerable){
            return;
        }
        this.emitter.fireEvent("play_sound", {key: "cathurt", loop: false, holdReference: false})
        this.health -= damage;
        this.invulnerable = true;
        this.invulTimer.start();
        this.health = Math.max(this.health, 0);
        if (this.health === 0) {
            // If it's not part of the snake
            if (this.rescue) {
                this.owner.setAIActive(false, {});
                this.owner.isCollidable = false;
                this.owner.visible = false;
                this.owner.disablePhysics();
                this.owner.destroy();
                return;
            }
            const indexOfCharacter = this.allies.indexOf(this.owner);
            if (indexOfCharacter === 0) {
                if (this.allies.length > 1) {
                    (this.allies[1].ai as CharacterController).changeState(CharacterStates.PLAYER);
                    this.viewport.follow(this.allies[1]);
                }
            } else {
                if (this.allies[indexOfCharacter-1]?.ai && this.allies[indexOfCharacter+1]?.ai)
                    (this.allies[indexOfCharacter+1].ai as CharacterController).following = (this.allies[indexOfCharacter-1].ai as CharacterController);
            }
            this.dead = true;
            this.owner.disablePhysics();
            this.owner.isCollidable = false;
            this.inventory.deleteCharacter(this.owner);
            this.owner.setAIActive(false, {});
            this.allies.splice(indexOfCharacter, 1);
            this.owner.animation.override("DOWNED", false, undefined, () => {
                this.owner.visible = false;
                this.owner.animation.stop();
                this.owner.destroy();
            });
        }
    }

    public setEnemies(enemies: Array<GameNode>) {
        this.enemies = enemies;
    }

    public nearestEnemy() {
        let minDist = Number.MAX_VALUE;
        let minEnemy = null;
        for (const enemy of this.enemies) {
            const dist = this.owner.position.distanceSqTo(enemy.position);
            if (enemy.ai && dist < minDist) {
                minDist = dist;
                minEnemy = enemy;
            }
        }
        const walls = <OrthogonalTilemap> this.owner.getScene().getLayer("Wall").getItems()[0];
        if (minEnemy && MathUtils.visibleBetweenPos(this.owner.position, minEnemy.position, walls, this.allies.filter(ally => ally !== this.owner)))
            return minEnemy;
        return null;
    }
}

export enum CharacterStates {
    ALLY = "ally",
    PLAYER = "player",
    RESCUE = "rescue",
}