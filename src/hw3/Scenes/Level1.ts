import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Scene from "../../Wolfie2D/Scene/Scene";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import OrthogonalTilemap from "../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import PositionGraph from "../../Wolfie2D/DataTypes/Graphs/PositionGraph";
import Navmesh from "../../Wolfie2D/Pathfinding/Navmesh";
import {Events, Names} from "../Constants";
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

export default class Level1 extends Scene {
    // The players
    private allies: Array<AnimatedSprite>;
    
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
    private hpBars: Array<Graphic>;
    private hpBarUpdateTimer: Timer;
    private weaponTypeMap: Map<string, any>;

    private zoomLevel: number;
    private inventory: InventoryManager;

    loadScene(){
        // Load the player and enemy spritesheets
        this.load.spritesheet("player", "hw3_assets/spritesheets/player.json");
        this.load.spritesheet("enemy", "hw3_assets/spritesheets/enemy.json");
        this.load.spritesheet("slice", "hw3_assets/spritesheets/stab.json");
        this.load.spritesheet("stab", "hw3_assets/spritesheets/stab.json");

        // Load the tilemap
        this.load.tilemap("level", "hw3_assets/tilemaps/alex-feng-hw3.json");

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
        this.load.image("pistol", "hw3_assets/sprites/ketchup.png");
        this.load.image("ketchupbottle", "hw3_assets/sprites/ketchup.png");
        this.load.image("mustardbottle", "hw3_assets/sprites/mustard.png");
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
            Events.PLAYER_COLLIDES_GROUND
        ]);
    }

    private displayHp() {
        return [...this.allies, ...this.enemies].map(character => {
            if (character?.ai && this.viewport.includes(character)) {
                const { health, maxHealth } = (character.ai as BattlerAI);
                return drawProgressBar(this, health, maxHealth, 12, character.position.clone().inc(0, -10), "health");
            }
            return [];
        }).flat();
    }

    protected handleCharacterCollision(character0: AnimatedSprite, character1: AnimatedSprite) {
        // If either character gets deleted.
        if (!character0 || !character1) {
            return;
        }
        const direction_0to1 = character0.position.dirTo(character1.position);
        const cardinalRad0 = MathUtils.radiansToCardinal(character0.rotation);
        const cardinalRad1 = MathUtils.radiansToCardinal(character1.rotation);
        const up_0to1 = direction_0to1.dot(Vec2.DOWN) > 0.5;
        const down_0to1 = direction_0to1.dot(Vec2.UP) > 0.5;
        const left_0to1 = direction_0to1.dot(Vec2.RIGHT) > 0.5;
        const right_0to1 = direction_0to1.dot(Vec2.LEFT) > 0.5;
        if (cardinalRad0 == 2 && cardinalRad1 == 0 ||
            cardinalRad0 == 3 && cardinalRad1 == 1) {
            (character1.ai as BattlerAI).damage(1);
            (character0.ai as BattlerAI).damage(1);
        } else if (up_0to1 && cardinalRad0 == 2 ||
            down_0to1 && cardinalRad0 == 0 ||
            left_0to1 && cardinalRad0 == 3 ||
            right_0to1 && cardinalRad0 == 1) {
            (character1.ai as BattlerAI).damage(1);
        } else {
            (character0.ai as BattlerAI).damage(1);
        }
    }

    startScene(){
        this.zoomLevel = 4;
        this.hpBarUpdateTimer = new Timer(10);
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

        this.inventory = new InventoryManager(this, 60, "inventorySlot", new Vec2(8, 8), 4, this.zoomLevel);

        this.allies = new Array();
        // Create the player
        this.initializePlayer(this.inventory);

        // Create allies
        this.initializeAllies(this.inventory)

        // Make the viewport follow the player
        this.viewport.follow(this.allies[0]);

        // Zoom in to a reasonable level
        this.viewport.enableZoom();
        this.viewport.setZoomLevel(this.zoomLevel);

        // Create the navmesh
        this.createNavmesh();

        // Initialize all enemies
        this.initializeEnemies();

        // Send the player and enemies to the battle manager
        this.battleManager.setAllies(this.allies.map(ally => <BattlerAI>ally._ai));
        this.battleManager.setEnemies(this.enemies.map(enemy => <BattlerAI>enemy._ai));

        // Subscribe to relevant events
        this.subscribeToEvents();

        // Spawn items into the world
        this.spawnItems();

        // Add a UI for health
        this.addLayer("health", 200);
    }

    updateScene(deltaT: number): void {
        if (this.allies.length === 0) {
            this.sceneManager.changeToScene(GameOver);
        }
        while(this.receiver.hasNextEvent()){
            let event = this.receiver.getNextEvent();

            switch(event.type){
                case Events.HEALTHPACK_SPAWN: {
                    this.createHealthpack(event.data.get("position"));
                    break;
                }
                case Events.PLAYER_COLLIDES_ENEMY:
                case Events.ENEMY_COLLIDES_PLAYER:
                case Events.PLAYER_COLLIDES_PLAYER: {
                    let node = this.sceneGraph.getNode(event.data.get("node"));
                    let other = this.sceneGraph.getNode(event.data.get("other"));
                    this.handleCharacterCollision(<AnimatedSprite>node, <AnimatedSprite>other);
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
                }
                default: {

                }
            }
        }
        if (this.hpBarUpdateTimer.isStopped()) {
            this.hpBarUpdateTimer.start();
            if (this.hpBars) {
                this.hpBars.forEach(hpBar => hpBar?.destroy());
            }
            this.hpBars = this.displayHp();
        }

        // Debug mode graph
        // if(Input.isKeyJustPressed("g")){
        //     this.getLayer("graph").setHidden(!this.getLayer("graph").isHidden());
        // }
        if(Input.isJustPressed("inventory")){
            this.togglePause();
            this.inventory.updateHpBars();
        }
    }

    togglePause() {
        this.getLayer("slots").setHidden(!this.getLayer("slots").isHidden())
        this.getLayer("items").setHidden(!this.getLayer("items").isHidden())
        this.getLayer("inv_click").setHidden(!this.getLayer("inv_click").isHidden())
        this.getLayer("inv_bg").setHidden(!this.getLayer("inv_portrait").isHidden())
        this.getLayer("inv_portrait").setHidden(!this.getLayer("inv_portrait").isHidden())
        
        this.getLayer("primary").toggle();
        this.getLayer("health").toggle();
        this.allies.forEach(ally => ally.togglePhysics());
        this.enemies.forEach(enemy => enemy.togglePhysics());
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
        player.position.set(2*16, 62*16);
        player.addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)));
        player.addAI(CharacterController,
            {
                speed: 100,
                inventory,
                allies: this.allies,
                viewport: this.viewport,
            });
        player.animation.play("IDLE");
        player.setGroup("player");
        player.setTrigger("enemy", Events.ENEMY_COLLIDES_PLAYER, null);
        player.setTrigger("player", Events.PLAYER_COLLIDES_PLAYER, null);
        player.setTrigger("ground", Events.PLAYER_COLLIDES_GROUND, null);
        inventory.addCharacter(player);
        this.allies.push(player);
    }

    initializeAllies(inventory: InventoryManager): void {
        for (const i of [0,1,2]) {
            const allySprite = this.add.animatedSprite("player", "primary");
            allySprite.addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)));
            allySprite.addAI(CharacterController,
                {
                    speed: 100,
                    inventory,
                    following: this.allies[this.allies.length-1].ai,
                    followingDistance: 22,
                    allies: this.allies,
                    viewport: this.viewport,
                });
            allySprite.animation.play("IDLE");
            allySprite.setGroup("player");
            allySprite.setTrigger("enemy", Events.ENEMY_COLLIDES_PLAYER, null);
            allySprite.setTrigger("player", Events.PLAYER_COLLIDES_PLAYER, null);
            allySprite.setTrigger("ground", Events.PLAYER_COLLIDES_GROUND, null);
            inventory.addCharacter(allySprite);
            this.allies.push(allySprite);
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
                allies: this.allies,
                weapon: this.createWeapon("weak_pistol")
            }

            this.enemies[i].addAI(EnemyAI, enemyOptions);
            this.enemies[i].setGroup("enemy");
            this.enemies[i].setTrigger("player", Events.PLAYER_COLLIDES_ENEMY, null);
        }

        this.allies.forEach(character => {
            (character.ai as CharacterController).setEnemies(this.enemies);
        })
    }
}