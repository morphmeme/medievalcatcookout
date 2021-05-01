import Level2 from "./Level2";
import Shop from "./Shop";

export default class Shop1 extends Shop {
    loadScene() {
        super.loadScene();
        // Load weapons
        this.load.image("spatula", "hw3_assets/sprites/spatula.png");
        this.load.image("lasergun", "hw3_assets/sprites/lasergun.png");
        this.load.image("pistol", "hw3_assets/sprites/pistol.png");
        this.load.image("ketchupbottle", "hw3_assets/sprites/ketchup.png");
        this.load.image("mustardbottle", "hw3_assets/sprites/mustard.png");
        this.load.image("saltgun", "hw3_assets/sprites/salt.png");
        this.load.image("projectile", "hw3_assets/sprites/projectile.png");

        this.shopItems = [{
            itemName: "ketchup_bottle",
            spriteKey: "ketchupbottle",
            displayName: "Ketchup Bottle",
            quantity: 2,
            gold: 0,
        }, {
            itemName: "ketchup_bottle",
            spriteKey: "ketchupbottle",
            displayName: "Ketchup Bottle",
            quantity: 2,
            gold: 100,
        }];

        this.nextLevel = Level2;
    }
}