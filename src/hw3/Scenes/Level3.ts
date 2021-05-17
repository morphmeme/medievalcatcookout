import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { LEVEL_NAMES } from "../Constants";
import InventoryManager from "../GameSystems/InventoryManager";
import GameLevel from "./GameLevel";
import AudioManager from "../../Wolfie2D/Sound/AudioManager";
import Shop3 from "./Shop3";
export default class Level3 extends GameLevel {
    public static nextLevel = Shop3;
    public static spawnPos = new Vec2(11*32, 63*32);

    unloadScene(){
        // TODO Keep resources - this is up to you
    }
    loadScene(){
        this.levelName = LEVEL_NAMES[2];
        super.loadScene();
        this.load.audio("level3music", "mcc_assets/music/level3music.mp3");

        this.load.tilemap("level", "hw3_assets/tilemaps/level3.json");
        // Load weapon data
        // Load enemy nav mesh
        this.load.object("navmesh", "hw3_assets/levels_data/level5/navmesh.json");

        // // Load in the enemy info
        this.load.object("enemyData", "hw3_assets/levels_data/level3/enemy.json");

        // // Load in item info
        this.load.object("itemData", "hw3_assets/levels_data/level3/items.json");
    }
    startScene(): void {
        super.startScene();
        if (!AudioManager.getInstance().isPlaying("level3music"))
            this.emitter.fireEvent("play_sound", {key: "level3music", loop: true, holdReference: true});
        this.addLevelEnd(new Vec2(0*32, 18*32), new Vec2(1,10));
        this.nextLevel = Level3.nextLevel;
    }
    initializePlayer(inventory: InventoryManager): void{
        super.initializePlayer(inventory, Level3.spawnPos.x, Level3.spawnPos.y);
    }
    reinitializeAllies(allies: Array<AnimatedSprite>, position: Vec2) {
        super.reinitializeAllies(allies, Level3.spawnPos);;
    }
    initializeRescues(inventory: InventoryManager, rescuePositions: number[][]): void{
        let pos = [[51*32, 62*32], [58*32, 43*32], [23*32, 25*32]];
        super.initializeRescues(inventory, pos);
    }
    initializeChests(positions: Vec2[]) {
        super.initializeChests([new Vec2(61*32, 59*32), new Vec2(11*32, 44*32), new Vec2(27*32, 44*32), 
            new Vec2(61*32, 43*32), new Vec2(60*32, 43*32), new Vec2(54*32, 2*32), new Vec2(24*32, 25*32), 
            new Vec2(31*32, 3*32), new Vec2(51*32, 61*32)]);
    }
    updateScene(deltaT: number): void {
        super.updateScene(deltaT);
    }
}