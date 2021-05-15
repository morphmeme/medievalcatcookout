import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { LEVEL_NAMES } from "../Constants";
import InventoryManager from "../GameSystems/InventoryManager";
import GameLevel from "./GameLevel";
export default class Level5 extends GameLevel {
    public static nextLevel = Level5;
    public static spawnPos = new Vec2(50*32, 95*32);

    unloadScene(){
        // TODO Keep resources - this is up to you
    }
    loadScene(){
        this.levelName = LEVEL_NAMES[1];
        super.loadScene();
        this.load.tilemap("level", "hw3_assets/tilemaps/level5.json");
        // Load weapon data
        // Load enemy nav mesh
        this.load.object("navmesh", "hw3_assets/levels_data/level5/navmesh.json");

        // // Load in the enemy info
        this.load.object("enemyData", "hw3_assets/levels_data/level5/enemy.json");

        // // Load in item info
        this.load.object("itemData", "hw3_assets/levels_data/level5/items.json");
    }
    startScene(): void {
        super.startScene();
        // this.addLevelEnd(new Vec2(1025, 0), new Vec2(12,1));
        this.nextLevel = Level5.nextLevel;
    }
    initializePlayer(inventory: InventoryManager): void{
        super.initializePlayer(inventory, Level5.spawnPos.x, Level5.spawnPos.y);
    }
    reinitializeAllies(allies: Array<AnimatedSprite>, position: Vec2) {
        super.reinitializeAllies(allies, Level5.spawnPos);;
    }
    initializeRescues(inventory: InventoryManager, rescuePositions: number[][]): void{
        // let pos = [[34*32, 142*32], [36*32, 142*32], [38*32, 142*32]];
        // super.initializeRescues(inventory, pos);
    }
    initializeChests(positions: Vec2[]) {
        // super.initializeChests([new Vec2(2*32, 117*32), new Vec2(61*32, 117*32),
        //     new Vec2(2*32, 69*32), new Vec2(58*32, 7*32),]);
    }
    updateScene(deltaT: number): void {
        super.updateScene(deltaT);
    }
}