import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { LEVEL_NAMES } from "../Constants";
import InventoryManager from "../GameSystems/InventoryManager";
import GameLevel from "./GameLevel";
import Level5 from "./Level5";
import AudioManager from "../../Wolfie2D/Sound/AudioManager";
import Shop4 from "./Shop4";
export default class Level4 extends GameLevel {
    public static nextLevel = Shop4;
    public static spawnPos = new Vec2(63*32, 58*32);

    unloadScene(){
        // TODO Keep resources - this is up to you
    }
    loadScene(){
        this.levelName = LEVEL_NAMES[3];
        super.loadScene();
        this.load.audio("level4music", "mcc_assets/music/level4music.mp3");

        this.load.tilemap("level", "hw3_assets/tilemaps/level4.json");
        // Load weapon data
        // Load enemy nav mesh
        this.load.object("navmesh", "hw3_assets/levels_data/level5/navmesh.json");

        // // Load in the enemy info
        this.load.object("enemyData", "hw3_assets/levels_data/level4/enemy.json");

        // // Load in item info
        this.load.object("itemData", "hw3_assets/levels_data/level4/items.json");
    }
    startScene(): void {
        super.startScene();
        if (!AudioManager.getInstance().isPlaying("level4music"))
            this.emitter.fireEvent("play_sound", {key: "level4music", loop: true, holdReference: true});
        this.addLevelEnd(new Vec2(33.5*32, 0), new Vec2(10,1));
        this.nextLevel = Level4.nextLevel;
    }
    initializePlayer(inventory: InventoryManager): void{
        super.initializePlayer(inventory, Level4.spawnPos.x, Level4.spawnPos.y);
    }
    reinitializeAllies(allies: Array<AnimatedSprite>, position: Vec2) {
        super.reinitializeAllies(allies, Level4.spawnPos);;
    }
    initializeRescues(inventory: InventoryManager, rescuePositions: number[][]): void{
        let pos = [[26*32, 47*32], [1*32, 2*32], [1*32, 62*32]];
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