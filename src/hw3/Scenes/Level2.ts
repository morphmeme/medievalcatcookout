import GameLevel from "./GameLevel";
export default class Level2 extends GameLevel {
    public static nextLevel = Level2;

    loadScene(){
        // Load the player and enemy spritesheets
        this.load.spritesheet("player", "mcc_assets/spritesheets/player/player-cat-sheet.json");
        this.load.spritesheet("enemy", "mcc_assets/spritesheets/enemy/enemy1-cat-sheet.json");
        this.load.spritesheet("slice", "hw3_assets/spritesheets/slice.json");
        this.load.spritesheet("stab", "hw3_assets/spritesheets/stab.json");
        this.load.spritesheet("coin", "mcc_assets/sprites/Sprites/animated-coin.json");
        // Load the tilemap
        this.load.tilemap("level", "hw3_assets/tilemaps/testmap.json");

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
        this.load.image("pistol", "hw3_assets/sprites/pistol.png");
        this.load.image("ketchupbottle", "hw3_assets/sprites/ketchup.png");
        this.load.image("mustardbottle", "hw3_assets/sprites/mustard.png");
        this.load.image("saltgun", "hw3_assets/sprites/salt.png");
        
        this.load.image("coin", "hw3_assets/sprites/coin.png");
    }

    unloadScene(){
        // TODO Keep resources - this is up to you
    }

    startScene(): void {
        super.startScene();
    }

    updateScene(deltaT: number): void {
        super.updateScene(deltaT);
    }
}