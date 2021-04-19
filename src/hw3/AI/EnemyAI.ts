import StateMachineAI from "../../Wolfie2D/AI/StateMachineAI";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import GameNode from "../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Weapon from "../GameSystems/items/Weapon";
import { Events } from "../Constants";
import BattlerAI from "./BattlerAI";
import Alert from "./EnemyStates/Alert";
import Attack from "./EnemyStates/Attack";
import Guard from "./EnemyStates/Guard";
import Patrol from "./EnemyStates/Patrol";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import Charge from "./EnemyStates/Charge";

export default class EnemyAI extends StateMachineAI implements BattlerAI {
    /** The owner of this AI */
    owner: AnimatedSprite;

    /** The amount of health this entity has */
    health: number;
    maxHealth: number;

    /** The default movement speed of this AI */
    speed: number = 20;

    /** The weapon this AI has */
    weapon: Weapon;

    /** A reference to the player object */
    allies: Array<GameNode>;
    charging: boolean;

    initializeAI(owner: AnimatedSprite, options: Record<string, any>): void {
        this.owner = owner;
        this.charging = options.charging;

        if(options.defaultMode === "guard"){
            // Guard mode
            this.addState(EnemyStates.DEFAULT, new Guard(this, owner, options.guardPosition));
        } else {
            // Patrol mode
            this.addState(EnemyStates.DEFAULT, new Patrol(this, owner, options.patrolRoute));
        }

        this.addState(EnemyStates.ALERT, new Alert(this, owner));
        this.addState(EnemyStates.CHARGING, new Charge(this, owner));
        this.addState(EnemyStates.ATTACKING, new Attack(this, owner));

        this.health = options.health;
        this.maxHealth = options.health;

        this.weapon = options.weapon;

        this.allies = options.allies;

        // Subscribe to events
        this.receiver.subscribe(Events.SHOT_FIRED);

        // Initialize to the default state
        this.initialize(EnemyStates.DEFAULT);

        this.getPlayerPosition();
    }

    activate(options: Record<string, any>): void {
    }

    damage(damage: number): void {
        console.log("Took damage");
        this.health -= damage;
    
        if(this.health <= 0){
            this.owner.setAIActive(false, {});
            this.owner.isCollidable = false;
            this.owner.visible = false;
            this.owner.disablePhysics();
            
            if(Math.random() < 0.2){
                // Spawn a healthpack
                this.emitter.fireEvent(Events.HEALTHPACK_SPAWN, {position: this.owner.position});
            }
            this.owner.destroy();
        }
    }

    getClosestAlly() {
        let closest = null;
        let closestDistance = Number.MAX_VALUE;
        for (const ally of this.allies) {
            const dist = ally.position.distanceSqTo(this.owner.position);
            if (dist < closestDistance) {
                closest = ally;
                closestDistance = dist;
            }
        }
        return closest;
    }


    getPlayerPosition(): Vec2 {
        const attacking = this.getClosestAlly();
        if (attacking === null) {
            return null;
        }
        let pos = attacking.position;
        let start = this.owner.position.clone();

        let walls = <OrthogonalTilemap> this.owner.getScene().getLayer("Wall").getItems()[0];
        if (MathUtils.visibleBetweenPos(start, pos, walls))
            return pos;
        return null;
    }
}

export enum EnemyStates {
    DEFAULT = "default",
    ALERT = "alert",
    ATTACKING = "attacking",
    PREVIOUS = "previous",
    CHARGING = "charging",
}