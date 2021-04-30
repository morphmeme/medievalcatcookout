import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import InventoryManager from "../GameSystems/InventoryManager";
import GameLevel from "./GameLevel";
export default class Level2 extends GameLevel {
    public static nextLevel = Level2;

    unloadScene(){
        // TODO Keep resources - this is up to you
    }
    loadScene(){
        this.load.tilemap("level", "hw3_assets/tilemaps/level1.json");
    }
    startScene(): void {
        super.startScene();
        this.addLevelEnd(new Vec2(15, 0), new Vec2(3,1));
        this.nextLevel = Level2;
    }
    initializePlayer(inventory: InventoryManager): void{
        const player = this.add.animatedSprite("player", "primary");
        player.position.set(16*32, 95*32);
        super.initializePlayer(inventory);
    }
    updateScene(deltaT: number): void {
        super.updateScene(deltaT);
    }
}