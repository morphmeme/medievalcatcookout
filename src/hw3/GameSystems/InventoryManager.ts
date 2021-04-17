import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Input from "../../Wolfie2D/Input/Input";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import CharacterController from "../AI/CharacterController";
import { Events } from "../Constants";
import Item from "./items/Item";

const LayerNames = {
    SLOT_LAYER: "slots",
    ITEM_LAYER: "items",
    CLICK_LAYER: "inv_click",
    BACKGROUND_LAYER: "inv_bg",
}

export default class InventoryManager {
    private position: Vec2;
    private items: Array<Item>;
    private inventorySlots: Array<Sprite>;
    private inventoryClickSlots: Array<Sprite>;
    private slotSize: Vec2;
    private padding: number;
    private lastSlot: number;
    private viewPortWidth: number;
    private margin: number;

    private currentlyMoving: [Item, number];
    private inventoryStart: number;
    private characterToIdx: Map<number, number>;

    constructor(private scene: Scene, size: number, private inventorySlot: string, position: Vec2, padding: number){
        this.items = new Array(size);
        this.inventorySlots = new Array(size);
        this.inventoryClickSlots = new Array(size);
        this.padding = padding;
        this.position = position;
        this.lastSlot = 0;
        this.margin = 100;
        this.currentlyMoving = null;
        this.inventoryStart = 0;
        this.characterToIdx = new Map();

        // Add layers
        const bgLayer = scene.addUILayer(LayerNames.BACKGROUND_LAYER);
        bgLayer.setDepth(100)
        bgLayer.setHidden(true);
        const slotLayer = scene.addUILayer(LayerNames.SLOT_LAYER);
        slotLayer.setDepth(101)
        slotLayer.setHidden(true);
        const itemLayer = scene.addUILayer(LayerNames.ITEM_LAYER);
        itemLayer.setDepth(102)
        itemLayer.setHidden(true);
        const clickLayer = scene.addLayer(LayerNames.CLICK_LAYER);
        clickLayer.setDepth(103)
        clickLayer.setHidden(true);

        // Draw background
        const viewPort = scene.getViewport()
        const viewPortCenter = viewPort.getCenter();
        const viewPortHalfSize = viewPort.getHalfSize();
        this.viewPortWidth = viewPortCenter.x + viewPortHalfSize.x;
        const bgRect = <Rect>scene.add.graphic(GraphicType.RECT, LayerNames.SLOT_LAYER, {position: viewPortCenter, size: viewPortHalfSize.scaled(2)});
        bgRect.color = Color.BLACK;

        // Create the inventory slots
        for(let i = 0; i < size; i++){
            const slot = scene.add.sprite(inventorySlot, LayerNames.SLOT_LAYER);
            this.inventorySlots[i] = slot;
        }

        this.slotSize = this.inventorySlots[0].size.clone();
        // Position the inventory slots
        for(let i = 0; i < size; i++){
            const slotPos = this.getSlotPosition(i);
            this.inventorySlots[i].position.set(slotPos.x, slotPos.y);
            // create clickable rect
            const slotClick = scene.add.sprite(inventorySlot, LayerNames.CLICK_LAYER);
            slotClick.position.set(slotPos.x, slotPos.y);
            slotClick.visible = false;
            slotClick.addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)))
            slotClick.setGroup("item");
            slotClick.setTrigger("player", Events.PLAYER_COLLIDES_ITEM, null);
            slotClick.onClick = () => {
                this.slotOnClick(i);
            }
            this.inventoryClickSlots[i]= slotClick;
        }
    }

    update() {
        this.currentlyMoving?.[0].moveSprite(Input.getMousePosition(), LayerNames.ITEM_LAYER)
    }

    slotOnClick(i: number) {
        // If item is currently selected
        if (this.currentlyMoving) {
            // If there already exists an item on this slot
            if (this.items[i]) {
                // Set new to old place
                this.items[this.currentlyMoving[1]] = this.items[i];
                // Move new to old
                this.items[i].moveSprite(this.getSlotPosition(this.currentlyMoving[1]));
                // Update new slot
                this.items[i] = this.currentlyMoving[0];
                
                const slotPos = this.getSlotPosition(i);
                this.currentlyMoving[0].moveSprite(slotPos);
                this.currentlyMoving = null;
            } else {
                this.items[i] = this.currentlyMoving[0];
                const slotPos = this.getSlotPosition(i);
                this.currentlyMoving[0].moveSprite(slotPos);
                this.currentlyMoving = null;
            } 
        } else {
            this.currentlyMoving = [this.items[i], i];
            this.items[i] = null;
        }
    }

    addCharacter(character: AnimatedSprite) {
        this.characterToIdx.set(character.id, this.inventoryStart);
        this.inventoryStart += 1;

    }

    moveSlotSprites(i: number, pos: Vec2) {
        this.inventorySlots[i].position.copy(pos);
        this.inventoryClickSlots[i].position.copy(pos);
    }

    getWeapon(character: AnimatedSprite): any {
        const slotIdx = this.characterToIdx.get(character.id);
        return this.items[slotIdx];
    }

    getSlotPosition(i: number) {
        const posX = this.position.x + i*(this.slotSize.x + this.padding);
        const zoom = 4;
        const posXZoomed = posX * zoom;
        const posXWrapped = (posXZoomed % this.viewPortWidth) / zoom;
        const rowNum = Math.floor(posXZoomed / this.viewPortWidth);
        return new Vec2(posXWrapped, rowNum * 16 + this.position.y + this.margin);
    }

    /**
     * Adds an item to the currently selected slot
     */
    addItem(item: Item): boolean {
        if (this.items[this.lastSlot]) {
            this.removeItem();
        }
        this.items[this.lastSlot] = item;
            
        // Update the gui
        item.moveSprite(this.getSlotPosition(this.lastSlot), LayerNames.ITEM_LAYER);

        this.lastSlot = Math.min(this.items.length - 1, this.lastSlot + 1);
        return true;
    }

    /**
     * Removes and returns an item from the the currently selected slot, if possible
     */
    removeItem(): Item {
        let item = this.items[this.lastSlot];

        this.items[this.lastSlot] = null;

        if(item){
            item.sprite.destroy();
            return item;
        } else {
            return null;
        }
    }

    moveItemSprite(item: Item, pos: Vec2) {
        item?.moveSprite(pos, LayerNames.ITEM_LAYER);
        return item;
    }
}