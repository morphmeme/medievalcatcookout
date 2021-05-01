import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import InventoryManager from "../GameSystems/InventoryManager";
import GameLevel from "./GameLevel";
import Level2 from "./Level2";
export default class Level1 extends GameLevel {
    public static nextLevel = Level2;
    public static spawnPos = new Vec2(28*32, 155*32);

    unloadScene(){
        // TODO Keep resources - this is up to you
    }
    loadScene(){
        super.loadScene();
        this.load.tilemap("level", "hw3_assets/tilemaps/level2.json");
        // Load weapon data
            this.load.object("weaponData", "hw3_assets/levels_data/level2/weaponData.json");
            // Load enemy nav mesh
            this.load.object("navmesh", "hw3_assets/levels_data/level2/navmesh.json");

            // Load in the enemy info
            this.load.object("enemyData", "hw3_assets/levels_data/level2/enemy.json");

            // Load in item info
            this.load.object("itemData", "hw3_assets/levels_data/level2/items.json");
    }
    startScene(): void {
        super.startScene();
        this.addLevelEnd(new Vec2(20, 0), new Vec2(12,1));
        this.nextLevel = Level2;
    }
    initializePlayer(inventory: InventoryManager): void{
        super.initializePlayer(inventory, Level2.spawnPos.x, Level2.spawnPos.y);
    }
    reinitializeAllies(allies: Array<AnimatedSprite>, position: Vec2) {
        super.reinitializeAllies(allies, Level2.spawnPos);;
    }
    initializeRescues(inventory: InventoryManager, rescuePositions: number[][]): void{
        let pos = [[34*32, 142*32], [36*32, 142*32], [38*32, 142*32]];
        super.initializeRescues(inventory, pos);
    }
    updateScene(deltaT: number): void {
        super.updateScene(deltaT);
    }
}