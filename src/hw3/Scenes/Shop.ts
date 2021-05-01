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
import { LEVEL_OPTIONS } from "../Constants";
import Weapon from "../GameSystems/items/Weapon";
import WeaponType from "../GameSystems/items/WeaponTypes/WeaponType";
import GameLevel from "./GameLevel";
import Level2 from "./Level2";

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
export default class Shop extends Scene {
    private weaponTypeMap: Map<string, any> = new Map();
    protected shopItems: ShopItem[] = [];
    protected nextLevel: new (...args: any) => Scene;
    private viewPortWidth: number;
    private viewPortHeight: number;
    
    loadScene() {
        this.load.object("weaponData", "hw3_assets/data/weaponData.json");
        this.load.spritesheet("coin", "mcc_assets/sprites/Sprites/animated-coin.json");
        this.load.image("coin", "hw3_assets/sprites/coin.png");
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
            clickableRect.setHAlign(HAlign.LEFT);
            clickableRect.onClick = () => {
                if (shopItem.quantity > 0 && GameLevel.coinCount >= gold) {
                    GameLevel.inventory?.addItem(this.createWeapon(itemName), true);
                    shopItem.quantity -= 1;
                    GameLevel.coinCount = Math.max(0, GameLevel.coinCount - gold);
                    clickableRect.setText(`     ${displayName} (${shopItem.quantity})`);
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
        nextLevel.backgroundColor = Color.TRANSPARENT;
        nextLevel.onClick = () => {
            this.sceneManager.changeToScene(this.nextLevel, {}, LEVEL_OPTIONS);;
        }
    }

    startScene() {
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
        const bgRect = <Rect>this.add.graphic(GraphicType.RECT, "background", {position: viewPortCenter, size: viewPortHalfSize.scaled(2)});
        bgRect.color = Color.BLACK;
        
        this.drawShopItems();
        this.drawNextLevelButton();
    }
}