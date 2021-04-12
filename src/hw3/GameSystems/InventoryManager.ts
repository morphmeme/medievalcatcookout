import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Item from "./items/Item";

const LayerNames = {
    SLOT_LAYER: "slots",
    ITEM_LAYER: "items",
}

export default class InventoryManager {

    private position: Vec2;
    private items: Array<Item>;
    private inventorySlots: Array<Sprite>;
    private slotSize: Vec2;
    private padding: number;
    private lastSlot: number;
    private selectedSlot: Rect;
    private selectedSlotIdx: number;

    constructor(scene: Scene, size: number, inventorySlot: string, position: Vec2, padding: number){
        this.items = new Array(size);
        this.inventorySlots = new Array(size);
        this.padding = padding;
        this.position = position;
        this.lastSlot = 0;
        this.selectedSlotIdx = 0;

        // Add layers
        const slotLayer = scene.addUILayer(LayerNames.SLOT_LAYER);
        slotLayer.setDepth(100)
        slotLayer.setHidden(true);
        const itemLayer = scene.addUILayer(LayerNames.ITEM_LAYER);
        itemLayer.setDepth(101)
        itemLayer.setHidden(true);

        // Create the inventory slots
        for(let i = 0; i < size; i++){
            this.inventorySlots[i] = scene.add.sprite(inventorySlot, LayerNames.SLOT_LAYER);
        }

        this.slotSize = this.inventorySlots[0].size.clone();

        // Position the inventory slots
        for(let i = 0; i < size; i++){
            this.inventorySlots[i].position.set(position.x + i*(this.slotSize.x + this.padding), position.y);
        }

        // Add a rect for the selected slot
        this.selectedSlot = <Rect>scene.add.graphic(GraphicType.RECT, "slots", {position: this.position.clone(), size: this.slotSize.clone().inc(-2)});
        this.selectedSlot.color = Color.WHITE;
        this.selectedSlot.color.a = 0.2;
    }

    getItem(): Item {
        return this.items[this.selectedSlotIdx];
    }

    /**
     * Changes the currently selected slot
     */
    changeSlot(slot: number): void {
        this.selectedSlotIdx = slot;
        this.selectedSlot.position.copy(this.inventorySlots[slot].position);
    }

    /**
     * Gets the currently selected slot
     */
    getSlot(): number {
        return this.selectedSlotIdx;
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
        item.moveSprite(new Vec2(this.position.x + this.lastSlot*(this.slotSize.x + this.padding), this.position.y), LayerNames.ITEM_LAYER);

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
}