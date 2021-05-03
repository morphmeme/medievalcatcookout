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
import Timer from "../../Wolfie2D/Timing/Timer";

export default class EnemyAI extends StateMachineAI implements BattlerAI {
    dead: boolean;
    /** The owner of this AI */
    owner: AnimatedSprite;

    invulnerable: boolean;
    /** The amount of health this entity has */
    health: number;
    maxHealth: number;

    /** The default movement speed of this AI */
    speed: number;

    /** The weapon this AI has */
    weapon: Weapon;

    /** A reference to the player object */
    allies: Array<GameNode>;
    attack: string;

    rotation: number = 0;

    protected invulTimer: Timer;

    initializeAI(owner: AnimatedSprite, options: Record<string, any>): void {
        this.owner = owner;
        this.attack = options.attack;
        this.speed = options.speed || 20;

        this.invulTimer = new Timer(300, ()=> {
            this.invulnerable = false;
        })

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
        if(this.invulnerable){
            return;
        }
        this.health -= damage;
        this.invulnerable = true;
        this.invulTimer.start();
        this.owner.animation.override("HURT", false);
    
        if(this.health <= 0){
            // Drop weapon
            // if (Math.random() < 0.5) {
            //     this.emitter.fireEvent(Events.DROP_WEAPON, {weapon: this.weapon, position: this.owner.position});
            // } else {
            //     this.emitter.fireEvent(Events.DROP_COIN, {position: this.owner.position});
            // }
            this.dead = true;
            this.emitter.fireEvent(Events.DROP_COIN, {position: this.owner.position});
            
            this.owner.isCollidable = false;
            this.owner.disablePhysics();
            this.owner.setAIActive(false, {});
            
            this.owner.animation.override("DOWNED", false, undefined, () => {
                this.owner.visible = false;
                this.owner.animation.stop();
                this.owner.destroy();
            });
            // this.owner.animation.forcePlay("DOWNED", false, Events.CHARACTER_DEATH);
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

    moveWithRotation(deltaT: number) {
        const cardinal = MathUtils.radiansToCardinal(this.rotation);
        const dir = MathUtils.cardinalToVec2(cardinal);
        this.owner.move(dir.normalized().scale(this.speed * deltaT));
    }

    setMovingAnimation() {
        const direction = MathUtils.radiansToCardinal(this.rotation);
        if (direction === 0)
            this.owner.animation.playIfNotAlready("WALK_BACK", true);
        else if (direction === 2) {
            this.owner.animation.playIfNotAlready("WALK_FRONT", true);
        } else if (direction === 1) {
            this.owner.animation.playIfNotAlready("WALK_LEFT", true);
        } else if (direction === 3) {
            this.owner.animation.playIfNotAlready("WALK_RIGHT", true);
        }
    }
}

export enum EnemyStates {
    DEFAULT = "default",
    ALERT = "alert",
    ATTACKING = "attacking",
    PREVIOUS = "previous",
    CHARGING = "charging",
}

export enum Attacks {
    charge = "charge",
    attack = "attack",
}