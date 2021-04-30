import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import InventoryManager from "../GameSystems/InventoryManager";
import GameLevel from "./GameLevel";
import Level2 from "./Level2";
export default class Level1 extends GameLevel {
    public static nextLevel = Level2;

    unloadScene(){
        // TODO Keep resources - this is up to you
    }
    loadScene(){
        this.load.tilemap("level", "hw3_assets/tilemaps/level2.json");
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
        const player = this.add.animatedSprite("player", "primary");
        player.position.set(28*32, 155*32);
        super.initializePlayer(inventory);
    }
    updateScene(deltaT: number): void {
        super.updateScene(deltaT);
    }
}