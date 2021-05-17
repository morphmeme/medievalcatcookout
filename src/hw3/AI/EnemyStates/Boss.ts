import AABB from "../../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import GameEvent from "../../../Wolfie2D/Events/GameEvent";
import CanvasNode from "../../../Wolfie2D/Nodes/CanvasNode";
import GameNode from "../../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import OrthogonalTilemap from "../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import RegistryManager from "../../../Wolfie2D/Registry/RegistryManager";
import Timer from "../../../Wolfie2D/Timing/Timer";
import RandUtils from "../../../Wolfie2D/Utils/RandUtils";
import { Events } from "../../Constants";
import Weapon from "../../GameSystems/items/Weapon";
import WeaponType from "../../GameSystems/items/WeaponTypes/WeaponType";
import EnemyAI, { EnemyStates } from "../EnemyAI";
import ProjectileAI from "../ProjectileAI";
import EnemyState from "./EnemyState";

const henchmans = [{
    "mode": "guard",
    "health": 5,
    "attack": "attack",
    "weapon": "mustard_bottle",
    "speed": 30
},{
    "mode": "guard",
    "health": 5,
    "attack": "charge",
    "speed": 100
},{
    "mode": "guard",
    "health": 5,
    "attack": "charge",
    "spriteKey": "long-cat",
    "speed": 150
},]

export default class Boss extends EnemyState {
    private weaponTypeMap: Map<string, any> = new Map();

    exitTimer: Timer;

    // The current known position of the player
    playerPos: Vec2;

    // The last known position of the player
    lastPlayerPos: Vec2;

    // The return object for this state
    retObj: Record<string, any>;

    private aoeProjectileTimer: Timer;
    private aoeProjectileRotation: number = 0;
    private laserTimer: Timer;
    private henchmanTimer: Timer;
    private psychicTimer: Timer;

    private psychicProjectiles: AnimatedSprite[] = [];

    constructor(parent: EnemyAI, owner: AnimatedSprite){
        super(parent, owner);
        this.aoeProjectileTimer = new Timer(1000);
        this.laserTimer = new Timer(100);
        this.henchmanTimer = new Timer(30000);
        this.psychicTimer = new Timer(200);
    }

    onEnter(options: Record<string, any>): void {
        this.loadWeaponTypeMap();
        this.lastPlayerPos = this.parent.getPlayerPosition();

        // Reset the return object
        this.retObj = {};
    }

    handleInput(event: GameEvent): void {}

    // copy pasted from Projectile.ts (too lazy)
    spawnProjectile(shooter: CanvasNode, type: string, direction: Vec2, damage: number, speed: number, rotateCCW: number) {
        const projectile = this.owner.getScene().add.animatedSprite(type, "primary");
        const normDirection = direction.normalized();
        const shooterBoundary = shooter.boundary;
        const boundaryHalfSize = shooterBoundary?.halfSize;
        const projectilePosition = boundaryHalfSize 
            ? new Vec2(shooter.position.x + normDirection.x * boundaryHalfSize.x, shooter.position.y + normDirection.y * boundaryHalfSize.y)
            : new Vec2(shooter.position.x, shooter.position.y);
        projectile.position.set(projectilePosition.x, projectilePosition.y);
        const hitBox = new Vec2(4,4);
        projectile.addPhysics(new AABB(Vec2.ZERO, hitBox));
        projectile.addAI(ProjectileAI,
            {
                direction,
                dmg: damage,
                speed: speed,
            });
        projectile.animation.play("flying");
        projectile.rotation = Vec2.UP.angleToCCW(direction.rotateCCW(rotateCCW));
        if(type == "peppergunprojectile")
            this.owner.getScene().emitter.fireEvent("play_sound", {key: "cannon", loop: false, holdReference: false});
        else
            this.owner.getScene().emitter.fireEvent("play_sound", {key: "squirt", loop: false, holdReference: false});
        projectile.setGroup("enemy_projectile");
        projectile.setTrigger("player", Events.PROJECTILE_COLLIDES_PLAYER, null);
        projectile.setTrigger("ground", Events.PROJECTILE_COLLIDES_GROUND, null);
        return projectile;
    }

    loadWeaponTypeMap() {
        let weaponData = this.owner.getScene().load.getObject("weaponData");
        for (const weapon of weaponData.weapons) {
            let constr = RegistryManager.getRegistry("weaponTemplates").get(weapon.weaponType);
            this.weaponTypeMap.set(weapon.name, [constr, weapon]);
        }
    }

    createWeapon(name: string): Weapon {
        const [constr, data] = this.weaponTypeMap.get(name);
        let weaponType = <WeaponType> new constr();
        weaponType.initialize(data);
        let sprite = this.owner.getScene().add.sprite(weaponType.spriteKey, "primary");
        sprite.position.copy(new Vec2(-32, -32));
        const weapon = new Weapon(sprite, weaponType);
        return weapon;
    }

    spawnEnemy(data: any) {
        const spriteKey = data.spriteKey ?? "enemy";
        const enemy = this.owner.getScene().add.animatedSprite(spriteKey, "primary");
        enemy.position.copy(data.position);
        enemy.animation.play("IDLE");

        enemy.addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)));

        let enemyOptions = {
            defaultMode: data.mode,
            patrolRoute: data.route,            // This only matters if they're a patroller
            guardPosition: data.guardPosition,  // This only matters if the're a guard
            health: data.health,
            allies: this.parent.allies,
            weapon: data.weapon ? this.createWeapon(data.weapon) : null,
            attack: data.attack,
            speed: data.speed,
            spriteKey: data.spriteKey,
        }

        enemy.addAI(EnemyAI, enemyOptions);
        enemy.setGroup("enemy");
        enemy.setTrigger("player", Events.PLAYER_COLLIDES_ENEMY, null);
        enemy.setTrigger("player_projectile", Events.PROJECTILE_COLLIDES_ENEMY, null);
        this.parent.enemies.push(enemy);
    }

    aoeProjectileAttack() {
        if(this.aoeProjectileTimer.isStopped()){
            // const rotationDelta = new Vec2(Math.cos(this.aoeProjectileRotation + Math.PI/2), Math.sin(this.aoeProjectileRotation - Math.PI/2));
            const directions = [Vec2.UP, Vec2.LEFT, Vec2.DOWN, Vec2.RIGHT,
                Vec2.UP.add(Vec2.LEFT), Vec2.UP.add(Vec2.RIGHT), Vec2.DOWN.add(Vec2.LEFT), Vec2.DOWN.add(Vec2.RIGHT)]
                .map(direction => {
                    const newX = Math.cos(this.aoeProjectileRotation) * direction.x - Math.sin(this.aoeProjectileRotation) * direction.y;
                    const newY = Math.sin(this.aoeProjectileRotation) * direction.x + Math.cos(this.aoeProjectileRotation) * direction.y;
                    return new Vec2(newX, newY);
                });
            for (const direction of directions) {
                this.spawnProjectile(this.owner, "mustardbottleprojectile", direction, 2, 20, 0);
            }
            this.aoeProjectileTimer.start();
            const rotationDeg = 10;
            this.aoeProjectileRotation = ((this.aoeProjectileRotation + (rotationDeg * Math.PI / 180)) % (2 * Math.PI));
        }
    }

    laserAttack() {
        if (this.laserTimer.isStopped() && this.playerPos) {
            let dir = this.playerPos.clone().sub(this.owner.position).normalize();
            this.spawnProjectile(this.owner, "ketchupbottleprojectile", dir, 2, 150, Math.PI / 8);
            this.spawnProjectile(this.owner, "ketchupbottleprojectile", dir, 2, 150, 0);
            this.spawnProjectile(this.owner, "ketchupbottleprojectile", dir, 2, 150, -Math.PI / 8);
            this.laserTimer.start();
            this.parent.rotation = Vec2.UP.angleToCCW(dir);
            this.parent.setMovingAnimation();
        }
    }

    psychicAttack() {
        if (!this.playerPos) {
            return;
        }
        let dir = this.playerPos.clone().sub(this.owner.position).normalize();
        this.parent.rotation = Vec2.UP.angleToCCW(dir);
        this.parent.setMovingAnimation();
        const projectileUntrackFlag = this.psychicProjectiles.map(_ => false);
        this.psychicProjectiles.forEach((projectile, i) => {
            if (projectile.ai && this.playerPos.distanceTo(projectile.position) > 32) {
                (projectile.ai as ProjectileAI).direction = this.playerPos.clone().sub(projectile.position).normalize();
                projectile.rotation = Vec2.UP.angleToCCW(dir);
            } else {
                projectileUntrackFlag[i] = true;
            }
        })
        if (this.psychicTimer.isStopped()) {
            this.psychicProjectiles.push(
                this.spawnProjectile(this.owner, "peppergunprojectile", dir, 5, 200, 0)
            );
            this.psychicTimer.start();
        }
        this.psychicProjectiles = this.psychicProjectiles.filter((projectile, i) => projectile.ai && !projectileUntrackFlag[i]);
    }

    chargeAttack(deltaT: number) {
        if (!this.playerPos) {
            return;
        }
        const dir = this.owner.position.dirTo(this.playerPos);
        this.parent.rotation = Vec2.UP.angleToCCW(dir);
        this.parent.moveWithRotation(deltaT);
        this.parent.setMovingAnimation();
    }

    spawnHenchman() {
        if (this.henchmanTimer.isStopped()) {
            const randomLocations = [new Vec2(RandUtils.randInt(7, 14) * 32, RandUtils.randInt(10, 14) * 32),
                new Vec2(RandUtils.randInt(19, 14) * 32, RandUtils.randInt(22, 14) * 32)];
           const randomLocation = randomLocations[RandUtils.randInt(0, randomLocations.length)]
           this.spawnEnemy({
               position: randomLocation.clone(),
               guardPosition: randomLocation.clone(),
               ...henchmans[RandUtils.randInt(0, henchmans.length)]
           })
           this.henchmanTimer.start();
        }
    }

    phase1Attack(deltaT: number) {
        if (this.playerPos && this.playerPos.distanceTo(this.owner.position) >= 6*32) {
            this.chargeAttack(deltaT);
        } else {
            this.laserAttack();
        }
    }

    phase3Attack(deltaT: number) {
        if (this.playerPos && this.playerPos.distanceTo(this.owner.position) >= 6*32) {
            this.chargeAttack(deltaT);
        } else {
            this.psychicAttack();
        }
    }

    update(deltaT: number): void {
        if (!this.owner.active) {
            return;
        }
        this.playerPos = this.parent.getPlayerPosition();
        if (this.parent.health > 0.5 * this.parent.maxHealth) {
            this.phase1Attack(deltaT);
        } else if (this.parent.health > 0.10 * this.parent.maxHealth) {
            this.aoeProjectileAttack()
        } else {
            this.phase3Attack(deltaT);
        }
        
        this.spawnHenchman();
    }

    onExit(): Record<string, any> {
        return this.retObj;
    }

}