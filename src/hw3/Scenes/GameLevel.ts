import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Scene from "../../Wolfie2D/Scene/Scene";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import PositionGraph from "../../Wolfie2D/DataTypes/Graphs/PositionGraph";
import Navmesh from "../../Wolfie2D/Pathfinding/Navmesh";
import {CONTROLS_TEXT, Events, LEVEL_OPTIONS, Names} from "../Constants";
import EnemyAI from "../AI/EnemyAI";
import WeaponType from "../GameSystems/items/WeaponTypes/WeaponType";
import RegistryManager from "../../Wolfie2D/Registry/RegistryManager";
import Weapon from "../GameSystems/items/Weapon";
import Healthpack from "../GameSystems/items/Healthpack";
import InventoryManager from "../GameSystems/InventoryManager";
import Item from "../GameSystems/items/Item";
import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import BattleManager from "../GameSystems/BattleManager";
import BattlerAI from "../AI/BattlerAI";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Color from "../../Wolfie2D/Utils/Color";
import Input from "../../Wolfie2D/Input/Input";
import GameOver from "./GameOver";
import MathUtils from "../../Wolfie2D/Utils/MathUtils";
import CanvasNode from "../../Wolfie2D/Nodes/CanvasNode";
import CharacterController from "../AI/CharacterController";
import Graphic from "../../Wolfie2D/Nodes/Graphic";
import Timer from "../../Wolfie2D/Timing/Timer";
import { drawProgressBar } from "../Util";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import Graph from "../../Wolfie2D/DataTypes/Graphs/Graph";
import {TweenableProperties} from "../../Wolfie2D/Nodes/GameNode";
import { EaseFunctionType } from "../../Wolfie2D/Utils/EaseFunctions";
import MainMenu from "./MainMenu";
import Level1 from "./Level1";
import ProjectileAI from "../AI/ProjectileAI";

type HpBarData = {
    lastHp: number,
    bars: Graphic[],
    character: AnimatedSprite,
}

export default class GameLevel extends Scene {
    private static partySpeed = 100;
    private static initialPartyHp = 25;
    // The players
    private static allies: Array<AnimatedSprite>;
    
    // A list of enemies
    private enemies: Array<AnimatedSprite>;

    // The wall layer of the tilemap to use for bullet visualization
    private walls: OrthogonalTilemap;

    // The position graph for the navmesh
    private graph: PositionGraph;

    // A list of items in the scene
    private items: Map<CanvasNode, Item>;

    // The battle manager for the scene
    private battleManager: BattleManager;

    // Characters healths
    private hpBars: Map<number, HpBarData>;
    private weaponTypeMap: Map<string, any>;

    private zoomLevel: number;
    private static inventory: InventoryManager;

    // end of level position
    private levelEndArea: Rect;
    private levelEndLabel: Label;
    // coins
    protected static coinCount: number = 0;
    protected coinCountLabel: Label;

    // timer
    protected timer: number = 0;
    protected timerLabel: Label;
    protected timerStopped: boolean = false;

    protected nextLevel: new (...args: any) => GameLevel;;

    loadScene(){
        // Load the player and enemy spritesheets
        this.load.spritesheet("player", "mcc_assets/spritesheets/player/player-cat-sheet.json");
        this.load.spritesheet("enemy", "mcc_assets/spritesheets/enemy/enemy1-cat-sheet.json");
        this.load.spritesheet("slice", "hw3_assets/spritesheets/slice.json");
        this.load.spritesheet("stab", "hw3_assets/spritesheets/stab.json");
        this.load.spritesheet("coin", "mcc_assets/sprites/Sprites/animated-coin.json");
        // Load the tilemap
        this.load.tilemap("level", "hw3_assets/tilemaps/testmap.json");

        // Load the scene info
        this.load.object("weaponData", "hw3_assets/data/weaponData.json");

        // Load the nav mesh
        this.load.object("navmesh", "hw3_assets/data/navmesh.json");

        // Load in the enemy info
        this.load.object("enemyData", "hw3_assets/data/enemy.json");

        // Load in item info
        this.load.object("itemData", "hw3_assets/data/items.json");

        // Load the healthpack sprite
        this.load.image("healthpack", "hw3_assets/sprites/healthpack.png");
        this.load.image("inventorySlot", "hw3_assets/sprites/inventory.png");
        this.load.image("spatula", "hw3_assets/sprites/spatula.png");
        this.load.image("lasergun", "hw3_assets/sprites/lasergun.png");
        this.load.image("pistol", "hw3_assets/sprites/pistol.png");
        this.load.image("ketchupbottle", "hw3_assets/sprites/ketchup.png");
        this.load.image("mustardbottle", "hw3_assets/sprites/mustard.png");
        this.load.image("saltgun", "hw3_assets/sprites/salt.png");
        this.load.image("projectile", "hw3_assets/sprites/projectile.png");
        
        this.load.image("coin", "hw3_assets/sprites/coin.png");
    }

    /**
     * Handles all subscriptions to events
     */
     protected subscribeToEvents() {
        this.receiver.subscribe([
            Events.HEALTHPACK_SPAWN,
            Events.PLAYER_COLLIDES_ENEMY,
            Events.ENEMY_COLLIDES_PLAYER,
            Events.PLAYER_COLLIDES_ITEM,
            Events.PLAYER_COLLIDES_PLAYER,
            Events.PLAYER_COLLIDES_GROUND,
            Events.PLAYER_COLLIDES_RESCUE,
            Events.PLAYER_HIT_COIN,
            Events.PLAYER_LEVEL_END,
            Events.DROP_WEAPON,
            Events.CHARACTER_DEATH,
            Events.DROP_COIN,
            Events.PROJECTILE_COLLIDES_ENEMY,
            Events.PROJECTILE_COLLIDES_PLAYER,
            Events.PROJECTILE_COLLIDES_GROUND,
        ]);
    }

    private displayHp() {
        for (const [id, data] of this.hpBars.entries()) {
            if (!data?.character?.ai) {
                data.bars.forEach(bar => {
                    bar.destroy();
                })
                this.hpBars.delete(id);
            }
        }
        return [...GameLevel.allies, ...this.enemies].map(character => {
            if (character?.ai && this.viewport.includes(character)) {
                const { health, maxHealth } = (character.ai as BattlerAI);
                if (this.hpBars.has(character.id)) {
                    const existingHpBarData = this.hpBars.get(character.id);
                    if (existingHpBarData.lastHp != health) {
                        const bars = drawProgressBar(this, health, maxHealth, 12, character.position.clone().inc(0, -20), "health");
                        existingHpBarData.bars.forEach(bar => {
                            bar.destroy();
                        })
                        this.hpBars.set(character.id, {
                            lastHp: health,
                            bars,
                            character,
                        })
                    } else {
                        // Move bars instead of redrawing
                        existingHpBarData.bars[1].position.copy(character.position.clone().inc(0, -20));
                        existingHpBarData.bars[0].position.copy(character.position.clone().inc(0, -20)
                                                                                       .inc(-(12 - 12 * (health/maxHealth)) / 2, 0));
                        existingHpBarData.bars[0].size.copy(new Vec2(12 * (health/maxHealth), 1));
                    }
                } else {
                    const bars = drawProgressBar(this, health, maxHealth, 12, character.position.clone().inc(0, -20), "health");
                    this.hpBars.set(character.id, {
                        lastHp: health,
                        bars,
                        character,
                    })
                }
                
            }
            return {id: null, bars: null};
        });
    }

    protected handleProjectileCollision(projectile: AnimatedSprite, other: AnimatedSprite) {
        // If either gets deleted.
        if (!projectile?.ai || !other?.ai) {
            return;
        }
        (other.ai as BattlerAI).damage((projectile.ai as ProjectileAI).dmg);
        (projectile.ai as ProjectileAI).damage(1);
        other.animation.override("HURT");
    }

    protected handleCharacterCollision(character0: AnimatedSprite, character1: AnimatedSprite) {
        // If either character gets deleted.
        if (!character0 || !character1) {
            return;
        }
        const direction_0to1 = character0.position.dirTo(character1.position);
        const cardinalRad0 = MathUtils.radiansToCardinal((character0.ai as BattlerAI).rotation);
        const cardinalRad1 = MathUtils.radiansToCardinal((character1.ai as BattlerAI).rotation);
        const up_0to1 = direction_0to1.dot(Vec2.DOWN) > 0.5;
        const down_0to1 = direction_0to1.dot(Vec2.UP) > 0.5;
        const left_0to1 = direction_0to1.dot(Vec2.RIGHT) > 0.5;
        const right_0to1 = direction_0to1.dot(Vec2.LEFT) > 0.5;
        if (cardinalRad0 == 2 && cardinalRad1 == 0 ||
            cardinalRad0 == 3 && cardinalRad1 == 1) {
            (character1.ai as BattlerAI).damage(1);
            (character0.ai as BattlerAI).damage(1);
            character0.animation.override("HURT");
            character1.animation.override("HURT");
        } else if (up_0to1 && cardinalRad0 == 2 ||
            down_0to1 && cardinalRad0 == 0 ||
            left_0to1 && cardinalRad0 == 3 ||
            right_0to1 && cardinalRad0 == 1) {
            (character1.ai as BattlerAI).damage(1);
            character1.animation.override("HURT");
        } else {
            (character0.ai as BattlerAI).damage(1);
            character0.animation.override("HURT");
        }
    }

    startScene(){
        this.zoomLevel = 2;
        this.hpBars = new Map();
        
        // Add in the tilemap
        let tilemapLayers = this.add.tilemap("level");

        // Get the wall layer
        this.walls = <OrthogonalTilemap>tilemapLayers[1].getItems()[0];

        // Set the viewport bounds to the tilemap
        let tilemapSize: Vec2 = this.walls.size; 
        this.viewport.setBounds(0, 0, tilemapSize.x, tilemapSize.y);

        this.addLayer("primary", 10);

        // Create the battle manager
        this.battleManager = new BattleManager();

        this.initializeWeapons();

        // Initialize the items array - this represents items that are in the game world
        this.items = new Map();

        // If no allies and no inventory (usually because it's level 1)
        if (GameLevel.allies === undefined && GameLevel.inventory === undefined) {
            GameLevel.allies = new Array();
            GameLevel.inventory = new InventoryManager(this, 48, "inventorySlot", new Vec2(8, 8), 4, 4);
            this.initializePlayer(GameLevel.inventory);
        } else {
            this.reinitializeAllies(GameLevel.allies, new Vec2(28*32, 155*32));
            const newItems = GameLevel.inventory.getWeaponsWithNewScene(this, this.battleManager);
            GameLevel.inventory = new InventoryManager(this, newItems.length, "inventorySlot", new Vec2(8, 8), 4, 4, newItems, GameLevel.allies);
            GameLevel.allies.forEach(ally => {
                (ally.ai as CharacterController).inventory = GameLevel.inventory;
            })
        }
        
        // this.initializeAllies(GameLevel.inventory);
        this.initializeRescues(GameLevel.inventory);

        // Make the viewport follow the player
        this.viewport.follow(GameLevel.allies[0]);

        // Zoom in to a reasonable level
        // this.viewport.enableZoom();
        this.viewport.setZoomLevel(this.zoomLevel);

        // Create the navmesh
        this.createNavmesh();

        // Initialize all enemies
        this.initializeEnemies();

        // Send the player and enemies to the battle manager
        this.battleManager.setAllies(GameLevel.allies.map(ally => <BattlerAI>ally._ai));
        this.battleManager.setEnemies(this.enemies.map(enemy => <BattlerAI>enemy._ai));

        // Subscribe to relevant events
        this.subscribeToEvents();

        // Spawn items into the world
        this.spawnItems();

        // Add a UI for health
        this.addLayer("health", 200);

        // Add a UI for pause
        const pauseLayer = this.addUILayer("pauseLayer");
        pauseLayer.setHidden(true);
        this.drawControlScreen();
        this.drawPauseLayer();

        // UI layer
        this.addUILayer("UI");
        const viewportHalfSize = this.viewport.getHalfSize();
        const width = viewportHalfSize.x * 2 * this.zoomLevel;
        const height = viewportHalfSize.y * 2 * this.zoomLevel;
        // coin label TODO coin image
        this.coinCountLabel = <Label>this.add.uiElement(UIElementType.LABEL, "UI", {position: new Vec2(width / 8, height / 20), text: `Coins: ${GameLevel.coinCount}`});
        this.coinCountLabel.textColor = Color.WHITE
        this.coinCountLabel.font = "PixelSimple";

        // timer label
        this.timerLabel = <Label>this.add.uiElement(UIElementType.LABEL, "UI", {position: new Vec2(width / 2, height / 20), text: `00:00:00`});
        this.timerLabel.textColor = Color.WHITE
        this.timerLabel.font = "PixelSimple";

        // Placeholder for image
        const stageNameLabel = <Label>this.add.uiElement(UIElementType.LABEL, "UI", {position: new Vec2(7 * width / 8, height / 20), text: `STAGE 1-1 Burger Kat`});
        stageNameLabel.textColor = Color.WHITE
        stageNameLabel.font = "PixelSimple";

        // level end
        this.addUI();
        
    }

    dropWeapon(weapon: Weapon, position: Vec2) {
        if (weapon && position) {
            weapon.moveSprite(position);
            weapon.sprite.addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)));
            weapon.sprite.setGroup("item");
            weapon.sprite.setTrigger("player", Events.PLAYER_COLLIDES_ITEM, null);
            this.items.set(weapon.sprite, weapon);
        }
    }

    dropCoin(position: Vec2) {
        const coin = this.add.animatedSprite("coin", "primary");
        coin.position.copy(position);
        coin.animation.play("spinning");
        coin.addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)));
        coin.setGroup("coin");
        coin.setTrigger("player", Events.PLAYER_HIT_COIN, null);
    }

    updateScene(deltaT: number): void {
        if (GameLevel.allies.length === 0) {
            this.sceneManager.changeToScene(GameOver);
        }
        while(this.receiver.hasNextEvent()){
            let event = this.receiver.getNextEvent();

            switch(event.type){
                case Events.DROP_COIN: {
                    this.dropCoin(event.data.get("position"));
                }
                case Events.DROP_WEAPON: {
                    this.dropWeapon(event.data.get("weapon"), event.data.get("position"));
                    break;
                }
                case Events.HEALTHPACK_SPAWN: {
                    // this.createHealthpack(event.data.get("position"));
                    break;
                }
                case Events.PLAYER_COLLIDES_RESCUE: {
                    if (GameLevel.allies.length < 4) {
                        let node = this.sceneGraph.getNode(event.data.get("other"));
                        (node?.ai as CharacterController).rescued(GameLevel.allies[GameLevel.allies.length - 1].ai as CharacterController, 22);
                        (node?.ai as CharacterController).setEnemies(this.enemies);
                        GameLevel.inventory.addCharacter(node);
                        GameLevel.allies.push(node as AnimatedSprite);
                    }
                    
                    break;
                }
                case Events.PLAYER_COLLIDES_ENEMY:
                case Events.ENEMY_COLLIDES_PLAYER:
                case Events.PLAYER_COLLIDES_PLAYER: {
                    let node = this.sceneGraph.getNode(event.data.get("node"));
                    let other = this.sceneGraph.getNode(event.data.get("other"));
                    this.handleCharacterCollision(node as AnimatedSprite, other as AnimatedSprite);
                    break;
                }
                case Events.PLAYER_COLLIDES_GROUND: {
                    let node = this.sceneGraph.getNode(event.data.get("node"));
                    (node?.ai as BattlerAI)?.damage(1);
                    break;
                }
                case Events.PLAYER_COLLIDES_ITEM: {
                    let node = this.sceneGraph.getNode(event.data.get("node"));
                    let other = this.sceneGraph.getNode(event.data.get("other"));
                    const item = this.items.get(other);
                    (node?.ai as CharacterController)?.addToInventory(item);
                    break;
                }
                case Events.PROJECTILE_COLLIDES_PLAYER:
                case Events.PROJECTILE_COLLIDES_ENEMY: {
                    let projectile = this.sceneGraph.getNode(event.data.get("node"));
                    let other = this.sceneGraph.getNode(event.data.get("other"));
                    if (projectile?.ai instanceof ProjectileAI)
                        this.handleProjectileCollision(projectile as AnimatedSprite, other as AnimatedSprite);
                    else
                        this.handleProjectileCollision(other as AnimatedSprite, projectile as AnimatedSprite);
                    break;
                }
                case Events.PROJECTILE_COLLIDES_GROUND: {
                    let projectile = this.sceneGraph.getNode(event.data.get("node"));
                    (projectile?.ai as ProjectileAI)?.damage(1);
                    break;
                }
                case Events.CHARACTER_DEATH:{
                    let node = this.sceneGraph.getNode(event.data.get("node"));
                    node.setAIActive(false, {});
                    node.visible = false;
                    node.disablePhysics();
                    node.destroy();
                    break;
                }
                case Events.PLAYER_HIT_COIN:
                {
                    // Hit a coin
                    let coin = this.sceneGraph.getNode(event.data.get("other"));
                    // Remove coin
                    if (coin) {
                        coin.destroy();

                        // Increment our number of coins
                        this.incPlayerCoins(1);
                    }
                    

                    // Play a coin sound
                    // this.emitter.fireEvent(GameEventType.PLAY_SOUND, {key: "coin", loop: false, holdReference: false});
                    break;
                }
                case Events.PLAYER_LEVEL_END:
                {
                    this.levelEndLabel.tweens.play("slideIn");
                    this.changeLevel(this.nextLevel);
                }
                default: {

                }
            }
        }
        // Update hp bars every x time.
        this.displayHp();

        if (Math.floor(this.timer) !== Math.floor(this.timer + deltaT) && this.timerStopped == false) {
            this.updateTimerLabel(deltaT);
        }
        this.timer += deltaT;
        
        // Debug mode graph
        // if(Input.isKeyJustPressed("g")){
        //     this.getLayer("graph").setHidden(!this.getLayer("graph").isHidden());
        // }
        if(Input.isJustPressed("inventory")){
            GameLevel.inventory.undoCurrentlyMoving();
            this.toggleInventory();
            this.togglePause();
            GameLevel.inventory.updateHpBars();
        } else if (Input.isJustPressed("pauseMenu")) {
            this.togglePause();
        } else if (Input.isKeyJustPressed("1")) {
            this.changeLevel(Level1);
        } else if (Input.isKeyJustPressed("2")) {
            this.changeLevel(Level1.nextLevel);
        } else if (Input.isKeyJustPressed("9")) {
            GameLevel.allies.forEach(ally => {
                (ally.ai as CharacterController).health = 100000;
                (ally.ai as CharacterController).maxHealth = 100000;
            } )
        } else if (Input.isKeyJustPressed("0")) {
            GameLevel.allies.forEach(ally => {
                const speed = (ally.ai as CharacterController).speed;
                if (speed === 501)
                    (ally.ai as CharacterController).speed = GameLevel.partySpeed;
                else
                    (ally.ai as CharacterController).speed = 501
            } )
        }
    }

    changeLevel(level: new (...args: any) => GameLevel) {
        if(level){
            this.updateTimerLabel(0);
            this.timerStopped = true;
            GameLevel.allies.forEach(ally => ally.keepForNextScene = true);
            this.viewport.setZoomLevel(1);    
            this.sceneManager.changeToScene(level, {}, LEVEL_OPTIONS);
        }
    }

    drawControlScreen() {
        /* ########## CONTROLS SCREEN ########## */
        const center = this.viewport.getCenter();
        const vpHalfSize = this.viewport.getHalfSize();
        const controls = this.addUILayer("controls");
        controls.setHidden(true);

        const pauseBg = <Rect> this.add.graphic(GraphicType.RECT, "controls", {position: center.scaled(1/this.zoomLevel), size: vpHalfSize.scaled(1, 1.75)});
        pauseBg.color = Color.BLACK;

        const controlsHeader = <Label>this.add.uiElement(UIElementType.LABEL, "controls", {position: new Vec2(center.x, center.y - 250), text: "Controls"});
        controlsHeader.textColor = Color.WHITE;

        let controlMargin = [-200, -150, -100, -50, 0, 50, 100];
        CONTROLS_TEXT.forEach((text, i) => {
            const controlLine = <Label>this.add.uiElement(UIElementType.LABEL, "controls", {position: new Vec2(center.x, center.y + controlMargin[i]), text});
            controlLine.textColor = Color.WHITE;
        })


        const controlsBack = this.add.uiElement(UIElementType.BUTTON, "controls", {position: new Vec2(center.x, center.y + 150), text: "Back"});
        controlsBack.size.set(200, 50);
        controlsBack.borderWidth = 2;
        controlsBack.borderColor = Color.WHITE;
        controlsBack.backgroundColor = Color.TRANSPARENT;
        controlsBack.onClick = () => {
            this.getLayer("pauseLayer").setHidden(!this.getLayer("pauseLayer").isHidden())
            this.getLayer("controls").setHidden(!this.getLayer("controls").isHidden())
        }
    }

    drawPauseLayer() {
        const center = this.viewport.getCenter();
        const vpHalfSize = this.viewport.getHalfSize();
        const pauseBg = <Rect> this.add.graphic(GraphicType.RECT, "pauseLayer", {position: center.scaled(1/this.zoomLevel), size: vpHalfSize.scaled(1, 1.5)});
        pauseBg.color = Color.BLACK;

        const play = this.add.uiElement(UIElementType.BUTTON, "pauseLayer", {position: new Vec2(center.x, center.y - 100), text: "Resume"});
        play.size.set(200, 50);
        play.borderWidth = 2;
        play.borderColor = Color.WHITE;
        play.backgroundColor = Color.TRANSPARENT;
        play.onClick = () => {
            this.togglePause();
        }

        // Add control button
        const controls = this.add.uiElement(UIElementType.BUTTON, "pauseLayer", {position: new Vec2(center.x, center.y), text: "Controls"});
        controls.size.set(200, 50);
        controls.borderWidth = 2;
        controls.borderColor = Color.WHITE;
        controls.backgroundColor = Color.TRANSPARENT;
        controls.onClick = () => {
            this.getLayer("pauseLayer").setHidden(!this.getLayer("pauseLayer").isHidden())
            this.getLayer("controls").setHidden(!this.getLayer("controls").isHidden())
        }
        
        // Add control button
        const endGame = this.add.uiElement(UIElementType.BUTTON, "pauseLayer", {position: new Vec2(center.x, center.y + 100), text: "Main Menu"});
        endGame.size.set(200, 50);
        endGame.borderWidth = 2;
        endGame.borderColor = Color.WHITE;
        endGame.backgroundColor = Color.TRANSPARENT;
        endGame.onClick = () => {
            this.viewport.setZoomLevel(1);
            this.sceneManager.changeToScene(MainMenu);
        }
    }

    togglePause() {
        this.getLayer("primary").toggle();
        this.getLayer("health").toggle();
        this.getLayer("pauseLayer").setHidden(!this.getLayer("pauseLayer").isHidden())
        GameLevel.allies.forEach(ally => ally.togglePhysics());
        this.enemies.forEach(enemy => enemy.togglePhysics());
        
    }

    toggleInventory() {
        this.getLayer("slots").setHidden(!this.getLayer("slots").isHidden())
        this.getLayer("items").setHidden(!this.getLayer("items").isHidden())
        this.getLayer("inv_click").setHidden(!this.getLayer("inv_click").isHidden())
        this.getLayer("inv_bg").setHidden(!this.getLayer("inv_portrait").isHidden())
        this.getLayer("inv_portrait").setHidden(!this.getLayer("inv_portrait").isHidden())
        // Zoom level 4 for inventory
        if (this.viewport.getZoomLevel() !== 4) {
            this.zoomLevel = this.viewport.getZoomLevel();
            this.viewport.setZoomLevel(4);
        } else {
            this.viewport.setZoomLevel(this.zoomLevel);
        }
    }

    /**
     * This function spawns in all of the items in "items.json"
     * 
     * You shouldn't have to put any new code here, however, you will have to modify items.json.
     * 
     * Make sure you are spawning in 5 pistols and 5 laser guns somewhere (accessible) in your world.
     * 
     * You'll notice that right now, some healthpacks are also spawning in. These also drop from guards.
     * Feel free to spawn some healthpacks if you want, or you can just let the player suffer >:)
     */
    spawnItems(): void {
        // Get the item data
        let itemData = this.load.getObject("itemData");
        for(let itemDatum of itemData.items){
            let item: Item = null;
            if(itemDatum.type === "healthpack"){
                // Create a healthpack
                item = this.createHealthpack();
            } else {
                item = this.createWeapon(itemDatum.weaponType);
            }
            item.moveSprite(new Vec2(itemDatum.position[0], itemDatum.position[1]));
        }        
    }

    createWeapon(name: string): Weapon {
        const [constr, data] = this.weaponTypeMap.get(name);
        let weaponType = <WeaponType> new constr();
        weaponType.initialize(data);
        let sprite = this.add.sprite(weaponType.spriteKey, "primary");
        const weapon = new Weapon(sprite, weaponType, this.battleManager);
        weapon.sprite.addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)));
        weapon.sprite.setGroup("item");
        weapon.sprite.setTrigger("player", Events.PLAYER_COLLIDES_ITEM, null);
        this.items.set(weapon.sprite, weapon);
        return weapon;
    }

    /**
     * Creates a healthpack at a certain position in the world
     * @param position 
     */
    createHealthpack(position?: Vec2): Item {
        let sprite = this.add.sprite("healthpack", "primary");
        let healthpack = new Healthpack(sprite)
        if (position)
            healthpack.moveSprite(position);
        healthpack.sprite.addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)));
        healthpack.sprite.setGroup("item");
        healthpack.sprite.setTrigger("player", Events.PLAYER_COLLIDES_ITEM, null);
        this.items.set(healthpack.sprite, healthpack);
        return healthpack;
    }

    /**
     * You'll want to have a new weapon type available in your program - a laser gun.
     * Carefully look through the code for how the other weapon types (knife and pistol)
     * are created. They're based of the templates Slice and SemiAutoGun. You should use
     * the SemiAutoGun template for your laser gun.
     * 
     * The laser gun should have a green beam, and should be considerably more powerful than
     * a pistol. You can decide just how powerful it is.
     * 
     * Look in weaponData.json for some insight on what to do here.
     * 
     * Loads in all weapons from file
     */
    initializeWeapons(): void{
        let weaponData = this.load.getObject("weaponData");
        this.weaponTypeMap = new Map();
        for(let i = 0; i < weaponData.numWeapons; i++){
            let weapon = weaponData.weapons[i];
            // Get the constructor of the prototype
            let constr = RegistryManager.getRegistry("weaponTemplates").get(weapon.weaponType);
            this.weaponTypeMap.set(weapon.name, [constr, weapon]);
            // Create a weapon type
            // let weaponType = new constr();

            // Initialize the weapon type
            // weaponType.initialize(weapon);
            

            // Register the weapon type
            // RegistryManager.getRegistry("weaponTypes").registerItem(weapon.name, weaponType)
        }
    }

    initializePlayer(inventory: InventoryManager): void {
        // Create the player
        const player = this.add.animatedSprite("player", "primary");
        player.position.set(28*32, 155*32);
        player.addPhysics(new AABB(Vec2.ZERO, new Vec2(4, 4)));
        player.addAI(CharacterController,
            {
                health: GameLevel.initialPartyHp,
                maxHealth: GameLevel.initialPartyHp,
                speed: GameLevel.partySpeed,
                inventory,
                allies: GameLevel.allies,
                viewport: this.viewport,
            });
        player.animation.play("IDLE");
        player.setGroup("player");
        player.setTrigger("enemy", Events.ENEMY_COLLIDES_PLAYER, null);
        player.setTrigger("player", Events.PLAYER_COLLIDES_PLAYER, null);
        player.setTrigger("ground", Events.PLAYER_COLLIDES_GROUND, null);
        player.setTrigger("coin", Events.PLAYER_HIT_COIN, null);
        player.setTrigger("projectile", Events.PROJECTILE_COLLIDES_PLAYER, null);
        inventory.addCharacter(player);
        GameLevel.allies.push(player);
    }

    // for next level
    reinitializeAllies(allies: Array<AnimatedSprite>, position: Vec2) {
        const newAllies: Array<AnimatedSprite> = [];
        for (let i = 0; i < allies.length; i++) {
            const ally = allies[i];
            const allySprite = this.add.animatedSprite("player", "primary");
            allySprite.position.set(position.x, position.y);
            allySprite.addPhysics(ally.collisionShape);
            allySprite.addAI(CharacterController,
                {
                    health: (ally.ai as CharacterController).health,
                    maxHealth: (ally.ai as CharacterController).maxHealth,
                    speed: (ally.ai as CharacterController).speed,
                    inventory: GameLevel.inventory,
                    allies: newAllies,
                    viewport: this.viewport,
                    following: i == 0 ? undefined : newAllies[newAllies.length-1].ai,
                    followingDistance: i == 0 ? undefined : 22,
                });
            allySprite.animation.play("IDLE");
            allySprite.setGroup("player");
            allySprite.setTrigger("enemy", Events.ENEMY_COLLIDES_PLAYER, null);
            allySprite.setTrigger("player", Events.PLAYER_COLLIDES_PLAYER, null);
            allySprite.setTrigger("ground", Events.PLAYER_COLLIDES_GROUND, null);
            allySprite.setTrigger("coin", Events.PLAYER_HIT_COIN, null);
            allySprite.setTrigger("projectile", Events.PROJECTILE_COLLIDES_PLAYER, null);
            newAllies.push(allySprite);
            // GameLevel.inventory.addCharacter(player);
            // ally.destroy();
        }
        GameLevel.allies = newAllies;
    }

    initializeRescues(inventory: InventoryManager): void {
        for (const [posX, posY] of [[34*32, 142*32], [36*32, 142*32], [38*32, 142*32]]) {
            const allySprite = this.add.animatedSprite("player", "primary");
            allySprite.position.set(posX, posY);
            allySprite.addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)));
            allySprite.addAI(CharacterController,
                {
                    health: GameLevel.initialPartyHp,
                    maxHealth: GameLevel.initialPartyHp,
                    speed: GameLevel.partySpeed,
                    inventory,
                    allies: GameLevel.allies,
                    viewport: this.viewport,
                    rescue: true,
                });
            allySprite.animation.play("HELP");
            allySprite.setGroup("rescue");
            allySprite.setTrigger("enemy", Events.ENEMY_COLLIDES_PLAYER, null);
            allySprite.setTrigger("ground", Events.PLAYER_COLLIDES_GROUND, null);
            allySprite.setTrigger("player", Events.PLAYER_COLLIDES_RESCUE, null);
        }
    }

    /**
     * This function creates the navmesh for the game world.
     * 
     * It reads in information in the navmesh.json file.
     * The format of the navmesh.json file is as follows
     * 
     * {
     *  // An array of positions on the tilemap. You can see the position of your mouse in [row, col]
     *  // while editing a map in Tiled, and can just multiply those values by the tile size, 16x16
     *      "nodes": [[100, 200], [50, 400], ...]
     * 
     *  // An array of edges between nodes. The numbers here correspond to indices in the "nodes" array above.
     *  // Note that edges are not directed here. An edge [0, 1] foes in both directions.
     *      "edges": [[0, 1], [2, 4], ...]
     * }
     * 
     * Your job here is to make a new graph to serve as the navmesh. Your graph should be designed
     * for your tilemap, and no edges should go through walls.
     */
    createNavmesh(): void {
        // Add a layer to display the graph
        let gLayer = this.addLayer("graph");
        gLayer.setHidden(true);

        let navmeshData = this.load.getObject("navmesh");

         // Create the graph
        this.graph = new PositionGraph();

        // Add all nodes to our graph
        for(let node of navmeshData.nodes){
            this.graph.addPositionedNode(new Vec2(node[0], node[1]));
            this.add.graphic(GraphicType.POINT, "graph", {position: new Vec2(node[0], node[1])})
        }

        // Add all edges to our graph
        for(let edge of navmeshData.edges){
            this.graph.addEdge(edge[0], edge[1]);
            this.add.graphic(GraphicType.LINE, "graph", {start: this.graph.getNodePosition(edge[0]), end: this.graph.getNodePosition(edge[1])})
        }

        // Set this graph as a navigable entity
        let navmesh = new Navmesh(this.graph);
        this.navManager.addNavigableEntity(Names.NAVMESH, navmesh);
    }

    /**
     * This function creates all enemies from the enemy.json file.
     * You shouldn't have to modify any code here, but you should edit enemy.json to
     * make sure more enemies are spawned into the world.
     * 
     * Patrolling enemies are given patrol routes corresponding to the navmesh. The numbers in their route correspond
     * to indices in the navmesh.
     */
    initializeEnemies(){
        // Get the enemy data
        const enemyData = this.load.getObject("enemyData");

        // Create an enemies array
        this.enemies = new Array(enemyData.numEnemies);

        // Initialize the enemies
        for(let i = 0; i < enemyData.numEnemies; i++){
            let data = enemyData.enemies[i];

            // Create an enemy
            this.enemies[i] = this.add.animatedSprite("enemy", "primary");
            this.enemies[i].position.set(data.position[0], data.position[1]);
            this.enemies[i].animation.play("IDLE");

            // Activate physics
            this.enemies[i].addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)));

            if(data.route){
                data.route = data.route.map((index: number) => this.graph.getNodePosition(index));                
            }

            if(data.guardPosition){
                data.guardPosition = new Vec2(data.guardPosition[0], data.guardPosition[1]);
            }

            let enemyOptions = {
                defaultMode: data.mode,
                patrolRoute: data.route,            // This only matters if they're a patroller
                guardPosition: data.guardPosition,  // This only matters if the're a guard
                health: data.health,
                allies: GameLevel.allies,
                weapon: data.weapon ? this.createWeapon(data.weapon) : null,
                attack: data.attack,
                speed: data.speed,
            }

            this.enemies[i].addAI(EnemyAI, enemyOptions);
            this.enemies[i].setGroup("enemy");
            this.enemies[i].setTrigger("player", Events.PLAYER_COLLIDES_ENEMY, null);
            this.enemies[i].setTrigger("projectile", Events.PROJECTILE_COLLIDES_ENEMY, null);
        }

        GameLevel.allies.forEach(character => {
            (character.ai as CharacterController).setEnemies(this.enemies);
        })
    }

    /**
     * Increments the number of coins the player has
     * @param amt The amount to add the the number of coins
     */
    protected incPlayerCoins(amt: number): void {
        GameLevel.coinCount += amt;
        this.coinCountLabel.text = "Coins: " + GameLevel.coinCount;
    }

    protected updateTimerLabel(deltaT: number) {
        const time_ms = Math.floor(this.timer + deltaT);
        const date = new Date(0);
        date.setSeconds(time_ms);
        this.timerLabel.text = `${date.toISOString().substr(11, 8)}`;
    }

    protected addUI(){
        this.levelEndLabel = <Label>this.add.uiElement(UIElementType.LABEL, "UI", {position: new Vec2(-700, 200), text: "Level Complete"});
        this.levelEndLabel.size.set(1400, 60);
        this.levelEndLabel.borderRadius = 0;
        this.levelEndLabel.backgroundColor = new Color(34, 32, 52);
        this.levelEndLabel.textColor = Color.WHITE;
        this.levelEndLabel.fontSize = 48;
        this.levelEndLabel.font = "PixelSimple";

        this.levelEndLabel.tweens.add("slideIn", {
            startDelay: 0,
            duration: 1000,
            effects: [
                {
                    property: TweenableProperties.posX,
                    start: -700,
                    end: 650,
                    ease: EaseFunctionType.OUT_SINE
                }
            ]
        });
    }

    protected addLevelEnd(Tile: Vec2, size: Vec2): void{
        this.levelEndArea= <Rect>this.add.graphic(GraphicType.RECT, "primary", {position: Tile.add(size.scale(1.0)).scaled(32), size: size.scale(16)});
        this.levelEndArea.addPhysics(undefined, undefined, false, true);
        this.levelEndArea.setTrigger("player", Events.PLAYER_LEVEL_END, null);
        this.levelEndArea.color = new Color(255,0,0,1);
    }
}