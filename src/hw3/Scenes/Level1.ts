import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import InventoryManager from "../GameSystems/InventoryManager";
import GameLevel from "./GameLevel";
export default class Level2 extends GameLevel {
    public static nextLevel = Level2;

    unloadScene(){
        // TODO Keep resources - this is up to you
    }
    loadScene(){
        super.loadScene();
        this.load.tilemap("level", "hw3_assets/tilemaps/level1.json");
        this.load.object("weaponData", "hw3_assets/levels_data/level2/weaponData.json");
        // Load enemy nav mesh
        this.load.object("navmesh", "hw3_assets/levels_data/level2/navmesh.json");
        // Load in the enemy info
        this.load.object("enemyData", "hw3_assets/levels_data/level1/enemy.json");

        // Load in item info
        this.load.object("itemData", "hw3_assets/levels_data/level1/items.json");
    }
    startScene(): void {
        super.startScene();
        this.addLevelEnd(new Vec2(15, 0), new Vec2(3,1));
        this.nextLevel = Level2;
    }
    initializePlayer(inventory: InventoryManager): void{
        super.initializePlayer(inventory, 16*32, 95*32);
    }
    initializeRescues(inventory: InventoryManager, rescuePositions: number[][]): void{
        let pos = [[13.5*32, 76*32], [16.5*32, 76*32],[19.5*32, 76*32] ]
        super.initializeRescues(inventory, pos);
    }
    updateScene(deltaT: number): void {
        super.updateScene(deltaT);
    }
}