import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Input from "../../Wolfie2D/Input/Input";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import Label, { HAlign } from "../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import RegistryManager from "../../Wolfie2D/Registry/RegistryManager";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import BattlerAI from "../AI/BattlerAI";
import CharacterController from "../AI/CharacterController";
import { LEVEL_OPTIONS } from "../Constants";
import Weapon from "../GameSystems/items/Weapon";
import WeaponType from "../GameSystems/items/WeaponTypes/WeaponType";
import GameLevel from "./GameLevel";
import Level2 from "./Level2";
import AudioManager from "../../Wolfie2D/Sound/AudioManager";

// Only weapons for now
export type ShopItem = {
    itemName: string,
    quantity: number,
    spriteKey: string,
    displayName: string,
    gold: number,
}

const shopItemRectWidthRatio = 0.4;
const shopItemRectHeightRatio = 0.05;
const buffWidthRatio = 0.4;
const buffHeightRatio = 0.25;
const buttonBgColor = new Color(32, 32, 32);
export default class Shop extends Scene {
    private weaponTypeMap: Map<string, any> = new Map();
    protected shopItems: ShopItem[] = [];
    private hpBuffBought = false;
    protected hpBuffCost = 10;
    protected hpBuffRatio = 1.1;
    protected speedBuffCost = 10;
    protected speedRatio = 1.1;
    private speedBuffBought = false;
    protected partyHealCost = 10;
    private partyHealBought = false;
    protected nextLevel: new (...args: any) => Scene;
    private viewPortWidth: number;
    private viewPortHeight: number;
    
    loadScene() {
        this.load.audio("shopmusic", "mcc_assets/music/shopmusic.mp3");
        this.load.object("weaponData", "hw3_assets/data/weaponData.json");
        this.load.spritesheet("coin", "mcc_assets/sprites/Sprites/animated-coin.json");
        this.load.image("coin", "hw3_assets/sprites/coin.png");
        this.load.audio("purchase", "mcc_assets/sounds/purchase.mp3");
        this.load.image("shop-bg", "mcc_assets/static_images/shop_bg.png")
    }

    loadWeaponTypeMap() {
        let weaponData = this.load.getObject("weaponData");
        for (const weapon of weaponData.weapons) {
            let constr = RegistryManager.getRegistry("weaponTemplates").get(weapon.weaponType);
            this.weaponTypeMap.set(weapon.name, [constr, weapon]);
        }
    }

    pad(value: string, length: number): string {
        return (value.toString().length < length) ? this.pad(" "+value, length):value;
    }

    createWeapon(name: string): Weapon {
        const [constr, data] = this.weaponTypeMap.get(name);
        let weaponType = <WeaponType> new constr();
        weaponType.initialize(data);
        let sprite = this.add.sprite(weaponType.spriteKey, "primary");
        sprite.position.copy(new Vec2(-32, -32));
        const weapon = new Weapon(sprite, weaponType);
        return weapon;
    }

    drawShopBuffs() {
        const buffWidth = buffWidthRatio * this.viewPortWidth;
        const buffHeight = buffHeightRatio * this.viewPortHeight;
        const rectSize = new Vec2(buffWidth, buffHeight);
        const hpBuffPosition = new Vec2(this.viewPortWidth * 0.75, buffHeight - 64);
        const hpBuffRect = <Button> this.add.uiElement(UIElementType.BUTTON, "click", {position: hpBuffPosition.clone(), text: `Increase Max HP By ${this.hpBuffRatio}x`});
        hpBuffRect.size.copy(rectSize);
        hpBuffRect.borderColor = Color.WHITE;
        hpBuffRect.setBackgroundColor(Color.fromStringHex(buttonBgColor.toString()));
        hpBuffRect.onClick = () => {
            if (!this.hpBuffBought && GameLevel.coinCount >= this.hpBuffCost) {
                GameLevel.coinCount = Math.max(0, GameLevel.coinCount - this.hpBuffCost);
                GameLevel.allies.forEach(ally => {
                    const newHp = Math.ceil((ally?.ai as BattlerAI).maxHealth * 1.1);
                    GameLevel.initialPartyHp = newHp;
                    (ally?.ai as BattlerAI).maxHealth = newHp; 
                })
                hpBuffRect.backgroundColor.a = 0.5;
                this.hpBuffBought = true;
                this.emitter.fireEvent("play_sound", {key: "purchase", loop: false, holdReference: false});
            }
        }

        let goldTextPosition = hpBuffPosition.clone().inc(0, 36);
        let goldText = <Label>this.add.uiElement(UIElementType.LABEL, "click", {position: goldTextPosition, text: this.pad(`${this.hpBuffCost}`, 3)});
        goldText.textColor = Color.WHITE;
        goldText.setHAlign(HAlign.RIGHT);

        let goldPosition = hpBuffPosition.clone().inc(36,34);
        let coin = this.add.animatedSprite("coin", "primary");
        coin.position.copy(goldPosition);
        coin.animation.play("spinning");

        const speedBuffPosition = new Vec2(this.viewPortWidth * 0.75, 2 * buffHeight - 64);
        const speedBuffRect = <Button> this.add.uiElement(UIElementType.BUTTON, "click", {position: speedBuffPosition.clone(), text: `Increase Speed By ${this.speedRatio}x`});
        speedBuffRect.size.copy(rectSize);
        speedBuffRect.borderColor = Color.WHITE;
        speedBuffRect.setBackgroundColor(Color.fromStringHex(buttonBgColor.toString()));
        speedBuffRect.onClick = () => {
            if (!this.speedBuffBought && GameLevel.coinCount >= this.speedBuffCost) {
                GameLevel.coinCount = Math.max(0, GameLevel.coinCount - this.speedBuffCost);
                GameLevel.partySpeed *= 1.1;
                speedBuffRect.backgroundColor.a = 0.5;
                this.speedBuffBought = true;
                this.emitter.fireEvent("play_sound", {key: "purchase", loop: false, holdReference: false});
            }
        }

        goldTextPosition = speedBuffPosition.clone().inc(0, 36);
        goldText = <Label>this.add.uiElement(UIElementType.LABEL, "click", {position: goldTextPosition, text: this.pad(`${this.speedBuffCost}`, 3)});
        goldText.textColor = Color.WHITE;
        goldText.setHAlign(HAlign.RIGHT);

        goldPosition = speedBuffPosition.clone().inc(36,34);
        coin = this.add.animatedSprite("coin", "primary");
        coin.position.copy(goldPosition);
        coin.animation.play("spinning");

        const partyHealPosition = new Vec2(this.viewPortWidth * 0.75, 3 * buffHeight - 64);
        const partyHealRect = <Button> this.add.uiElement(UIElementType.BUTTON, "click", {position: partyHealPosition.clone(), text: "Party Heal"});
        partyHealRect.size.copy(rectSize);
        partyHealRect.borderColor = Color.WHITE;
        partyHealRect.setBackgroundColor(Color.fromStringHex(buttonBgColor.toString()));
        partyHealRect.onClick = () => {
            if (!this.partyHealBought && GameLevel.coinCount >= this.partyHealCost) {
                GameLevel.coinCount = Math.max(0, GameLevel.coinCount - this.partyHealCost);
                GameLevel.allies.forEach(ally => {
                    (ally?.ai as CharacterController).health = (ally?.ai as CharacterController).maxHealth;
                })
                partyHealRect.backgroundColor.a = 0.5;
                this.partyHealBought = true;
                this.emitter.fireEvent("play_sound", {key: "purchase", loop: false, holdReference: false});
            }
        }

        goldTextPosition = partyHealPosition.clone().inc(0, 36);
        goldText = <Label>this.add.uiElement(UIElementType.LABEL, "click", {position: goldTextPosition, text: this.pad(`${this.partyHealCost}`, 3)});
        goldText.textColor = Color.WHITE;
        goldText.setHAlign(HAlign.RIGHT);

        goldPosition = partyHealPosition.clone().inc(36,34);
        coin = this.add.animatedSprite("coin", "primary");
        coin.position.copy(goldPosition);
        coin.animation.play("spinning");

    }

    drawShopItems() {
        const shopItemRectWidth = shopItemRectWidthRatio * this.viewPortWidth;
        const shopItemRectHeight = shopItemRectHeightRatio * this.viewPortHeight;
        const itemPosition = new Vec2(shopItemRectWidth * 0.5 + 16, 64);
        for (const shopItem of this.shopItems) {
            const {itemName, spriteKey, displayName, quantity, gold} = shopItem;
            const rectSize = new Vec2(shopItemRectWidth, shopItemRectHeight);
            const clickableRect = <Button> this.add.uiElement(UIElementType.BUTTON, "click", {position: itemPosition.clone(), text: `     ${displayName} (${quantity})`});
            clickableRect.size.copy(rectSize);
            clickableRect.borderColor = Color.WHITE;
            clickableRect.setBackgroundColor(Color.fromStringHex(buttonBgColor.toString()));
            clickableRect.setHAlign(HAlign.LEFT);
            clickableRect.onClick = () => {
                if (shopItem.quantity > 0 && GameLevel.coinCount >= gold) {
                    GameLevel.inventory?.addItem(this.createWeapon(itemName), true);
                    shopItem.quantity -= 1;
                    GameLevel.coinCount = Math.max(0, GameLevel.coinCount - gold);
                    clickableRect.setText(`     ${displayName} (${shopItem.quantity})`);
                    this.emitter.fireEvent("play_sound", {key: "purchase", loop: false, holdReference: false});
                }
            }

            // Sprite Icon
            const sprite = this.add.sprite(spriteKey, "primary");
            const iconPosition = itemPosition.clone().inc(-shopItemRectWidth * 0.5 + 25,0);
            sprite.position.copy(iconPosition);

            const goldTextPosition = itemPosition.clone().inc(shopItemRectWidth * 0.5 - 64, 0);
            const goldText = <Label>this.add.uiElement(UIElementType.LABEL, "click", {position: goldTextPosition, text: this.pad(`${gold}`, 3)});
            goldText.textColor = Color.WHITE;
            goldText.setHAlign(HAlign.RIGHT);

            const goldPosition = itemPosition.clone().inc(shopItemRectWidth * 0.5 - 16, 0);
            const coin = this.add.animatedSprite("coin", "primary");
            coin.position.copy(goldPosition);
            coin.animation.play("spinning");

            itemPosition.inc(0, shopItemRectHeight);
        }
    }

    drawNextLevelButton() {
        const nextLevel = this.add.uiElement(UIElementType.BUTTON, "click", {position: new Vec2(this.viewPortWidth * 0.5, this.viewPortHeight * 0.9), text: "Next Level"});
        nextLevel.size.set(200, 50);
        nextLevel.borderWidth = 2;
        nextLevel.borderColor = Color.WHITE;
        nextLevel.backgroundColor = Color.fromStringHex("#0275d8");
        nextLevel.onClick = () => {
            this.sceneManager.changeToScene(this.nextLevel, {}, LEVEL_OPTIONS);
            if (AudioManager.getInstance().isPlaying("shopmusic"))
                this.emitter.fireEvent("stop_sound", {key: "shopmusic", loop: true, holdReference: true});
        }
    }

    startScene() {
        this.emitter.fireEvent("stop_all_sounds");
        if (!AudioManager.getInstance().isPlaying("shopmusic"))
            this.emitter.fireEvent("play_sound", {key: "shopmusic", loop: true, holdReference: true});
        this.viewport.setZoomLevel(1);
        this.loadWeaponTypeMap();
        const bgLayer = this.addUILayer("background");
        bgLayer.setDepth(100)
        const primaryLayer = this.addUILayer("primary");
        primaryLayer.setDepth(102);
        const clickLayer = this.addUILayer("click");
        clickLayer.setDepth(101);

        // Draw background
        const viewPort = this.getViewport()
        const viewPortCenter = viewPort.getCenter();
        const viewPortHalfSize = viewPort.getHalfSize();
        this.viewPortHeight = viewPortCenter.y + viewPortHalfSize.y;
        this.viewPortWidth = viewPortCenter.x + viewPortHalfSize.x;
        const bg = this.add.sprite("shop-bg", "background");
        bg.position.copy(viewPortCenter);
        // const bgRect = <Rect>this.add.graphic(GraphicType.RECT, "background", {position: viewPortCenter, size: viewPortHalfSize.scaled(2)});
        // bgRect.color = Color.BLACK;
        
        this.drawShopItems();
        this.drawNextLevelButton();
        this.drawShopBuffs();
    }
}