import Level3 from "./Level3";
import Shop from "./Shop";
export default class Shop2 extends Shop {
    loadScene() {
        super.loadScene();
        // Load weapons
        this.load.image("spatula", "hw3_assets/sprites/spatula.png");
        this.load.image("lasergun", "hw3_assets/sprites/lasergun.png");
        this.load.image("pistol", "hw3_assets/sprites/pistol.png");
        this.load.image("ketchupbottle", "hw3_assets/sprites/ketchup.png");
        this.load.image("mustardbottle", "hw3_assets/sprites/mustard.png");
        this.load.image("saltgun", "hw3_assets/sprites/salt.png");
        this.load.image("peppergun", "hw3_assets/sprites/pepper.png");

        this.hpBuffCost = 5;
        this.hpBuffRatio = 1.1;
        this.speedBuffCost = 5;
        this.speedRatio = 1.1;
        this.partyHealCost = 3;
        this.shopItems = [{
            itemName: "ketchup_bottle",
            spriteKey: "ketchupbottle",
            displayName: "Ketchup Bottle",
            quantity: 3,
            gold: 1,
        }, {
            itemName: "spatula",
            spriteKey: "spatula",
            displayName: "Spatula",
            quantity: 3,
            gold: 1,
        }, {
            itemName: "mustard_bottle",
            spriteKey: "mustardbottle",
            displayName: "Mustard Bottle",
            quantity: 3,
            gold: 2,
        }, {
            itemName: "salt_gun",
            spriteKey: "saltgun",
            displayName: "Salt Gun",
            quantity: 3,
            gold: 2,
        }, {
            itemName: "pepper_gun",
            spriteKey: "peppergun",
            displayName: "Pepper Gun",
            quantity: 3,
            gold: 5,
        }];

        this.nextLevel = Level3;
    }
    startScene(){
        super.startScene();
    }
}