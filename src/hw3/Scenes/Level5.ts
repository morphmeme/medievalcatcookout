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
        this.addLevelEnd(new Vec2(50.5*32, 0), new Vec2(18,1));
        this.nextLevel = Level5.nextLevel;
    }
    initializePlayer(inventory: InventoryManager): void{
        super.initializePlayer(inventory, Level5.spawnPos.x, Level5.spawnPos.y);
    }
    reinitializeAllies(allies: Array<AnimatedSprite>, position: Vec2) {
        super.reinitializeAllies(allies, Level5.spawnPos);;
    }
    initializeRescues(inventory: InventoryManager, rescuePositions: number[][]): void{
        let pos = [[20*32, 28*32], [4*32, 8*32], [78*32, 28*32], [93*32, 5*32]];
        super.initializeRescues(inventory, pos);
    }
    initializeChests(positions: Vec2[]) {
        super.initializeChests([new Vec2(21*32, 74*32), new Vec2(28*32, 74*32),
            new Vec2(22*32, 66*32), new Vec2(43*32, 63*32), new Vec2(53*32, 89*32),
            new Vec2(93*32, 97*32), new Vec2(95*32, 97*32), new Vec2(97*32, 97*32),
            new Vec2(41*32, 28*32), new Vec2(16*32, 16*32), new Vec2(83*32, 16*32)]);
    }
    updateScene(deltaT: number): void {
        super.updateScene(deltaT);
    }
}