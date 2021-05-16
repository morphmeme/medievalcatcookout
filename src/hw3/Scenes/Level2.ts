import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import { LEVEL2_TEXT, LEVEL_NAMES } from "../Constants";
import InventoryManager from "../GameSystems/InventoryManager";
import GameLevel from "./GameLevel";
import AudioManager from "../../Wolfie2D/Sound/AudioManager";
export default class Level2 extends GameLevel {
    public static nextLevel = Level2;
    public static spawnPos = new Vec2(29.5*32, 156*32);

    unloadScene(){
        // TODO Keep resources - this is up to you
    }
    loadScene(){
        //change music
        this.load.audio("level2music", "mcc_assets/music/level2music.mp3");
        this.levelName = LEVEL_NAMES[1];
        super.loadScene();
        //load tilemap
        this.load.tilemap("level", "hw3_assets/tilemaps/level2.json");
        
        // Load enemy nav mesh
        this.load.object("navmesh", "hw3_assets/levels_data/level2/navmesh.json");

        // Load in the enemy info
        this.load.object("enemyData", "hw3_assets/levels_data/level2/enemy.json");

        // Load in item info
        this.load.object("itemData", "hw3_assets/levels_data/level2/items.json");
    }
    startScene(): void {
        super.startScene();
        if (!AudioManager.getInstance().isPlaying("gameplay"))
            this.emitter.fireEvent("play_sound", {key: "level2music", loop: true, holdReference: true});
        this.addLevelEnd(new Vec2(1025, 0), new Vec2(12,1));
        this.nextLevel = Level2.nextLevel;
    }
    initializePlayer(inventory: InventoryManager): void{
        super.initializePlayer(inventory, Level2.spawnPos.x, Level2.spawnPos.y);
    }
    reinitializeAllies(allies: Array<AnimatedSprite>, position: Vec2) {
        super.reinitializeAllies(allies, Level2.spawnPos);;
    }
    initializeRescues(inventory: InventoryManager, rescuePositions: number[][]): void{
        let pos = [[34*32, 142*32], [36*32, 142*32], [38*32, 142*32], [33*32, 121*32], [54*32, 98*32], [3*32, 113*32],
                [3*32, 99*32], [25*32, 101*32], [31*32, 105*32], [51*32, 65*32], [51*32, 60*32], [56*32, 51*32], [6*32, 52*32],
                [6*32, 8*32], [42*32, 31*32], [53*32, 23*32], [57*32, 8*32]];
        super.initializeRescues(inventory, pos);
    }
    protected editSignUI(index: number): void{
        this.signLabel.text = LEVEL2_TEXT[index];
        this.signLabel.update(1)
    }
    initializeChests(positions: Vec2[]) {
        super.initializeChests([new Vec2(2*32, 117*32), new Vec2(61*32, 117*32), new Vec2(61*32, 116*32), new Vec2(60*32, 116*32),
            new Vec2(2*32, 69*32), new Vec2(58*32, 7*32), new Vec2(58*32, 7*32), new Vec2(30*32, 98*32), new Vec2(4*32, 71*32), new Vec2(4*32, 70*32),
            new Vec2(4*32, 69*32), new Vec2(4*32, 68*32), new Vec2(58*32, 7*32)]);
    }
    updateScene(deltaT: number): void {
        super.updateScene(deltaT);
    }
}