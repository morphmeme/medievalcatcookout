import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import WeaponType from "../GameSystems/items/WeaponTypes/WeaponType";

// Only weapons for now
type ShopItem = {
    item: WeaponType,
    quantity: number,
    gold: number,
}

const shopItemRectWidthRatio = 0.4;
const shopItemRectHeightRatio = 0.1;
export default class Shop extends Scene {
    private shopItems: ShopItem[] = [];
    private viewPortWidth: number;
    private viewPortHeight: number;
    
    loadScene() {

    }

    drawShopItems() {
        const itemPosition = new Vec2(16, 16);
        const shopItemRectWidth = shopItemRectWidthRatio * this.viewPortWidth;
        const shopItemRectHeight = shopItemRectHeightRatio * this.viewPortHeight;
        for (const {item, quantity, gold} of this.shopItems) {
            const name = item.displayName;
            const rectSize = new Vec2(shopItemRectWidth, shopItemRectHeight);
            const clickableRect = <Rect>this.add.graphic(GraphicType.RECT, "click", {position: itemPosition.clone(), size: rectSize});
            itemPosition.inc(0, shopItemRectHeight);
        }
    }

    startScene() {
        this.viewport.setZoomLevel(1);
        const bgLayer = this.addUILayer("background");
        bgLayer.setDepth(100)
        const primaryLayer = this.addUILayer("primary");
        primaryLayer.setDepth(101);
        const clickLayer = this.addUILayer("click");
        clickLayer.setDepth(102);

        // Draw background
        const viewPort = this.getViewport()
        const viewPortCenter = viewPort.getCenter();
        const viewPortHalfSize = viewPort.getHalfSize();
        this.viewPortHeight = viewPortCenter.y + viewPortHalfSize.y;
        this.viewPortWidth = viewPortCenter.x + viewPortHalfSize.x;
        const bgRect = <Rect>this.add.graphic(GraphicType.RECT, "background", {position: viewPortCenter, size: viewPortHalfSize.scaled(2)});
        bgRect.color = Color.BLACK;

        
        this.drawShopItems();
    }
}