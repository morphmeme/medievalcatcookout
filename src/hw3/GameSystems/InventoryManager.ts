import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import CharacterController from "../AI/CharacterController";
import Item from "./items/Item";

const LayerNames = {
    SLOT_LAYER: "slots",
    ITEM_LAYER: "items",
    BACKGROUND_LAYER: "inv_bg",
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
    private viewPortWidth: number;
    private margin: number;

    private weapons: Map<number, [Item, Vec2]>;
    private selectedEquipment: Item;
    private selectedCharacter: number;

    constructor(private scene: Scene, size: number, private inventorySlot: string, position: Vec2, padding: number){
        this.items = new Array(size);
        this.inventorySlots = new Array(size);
        this.weapons = new Map();
        this.padding = padding;
        this.position = position;
        this.lastSlot = 0;
        this.selectedSlotIdx = 0;
        this.margin = 100;

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
            slot.onClick = () => {
                this.changeSlot(i);
                // If we've previously selected an equipment slot
                if (this.selectedEquipment) {
                    // Move sprite from equipment to inventory
                    this.moveItemSprite(this.selectedEquipment, this.getSlotPosition(i));
                    const weaponSlotPos = this.weapons.get(this.selectedCharacter)[1];
                    if (!this.items[i]) {
                        // Delete item from weapon slot
                        this.weapons.set(this.selectedCharacter, [null, weaponSlotPos])
                    } else {
                        // Swap instead of deleting
                        this.moveItemSprite(this.items[i], weaponSlotPos);
                        this.weapons.set(this.selectedCharacter, [this.items[i], weaponSlotPos])
                    } 
                    // Add item to inventory
                    this.items[i] = this.selectedEquipment;
                }
                this.selectedEquipment = null;
                this.selectedCharacter = null;
            }
            this.inventorySlots[i] = slot;
        }

        this.slotSize = this.inventorySlots[0].size.clone();

        // Position the inventory slots
        for(let i = 0; i < size; i++){
            const slotPos = this.getSlotPosition(i);
            this.inventorySlots[i].position.set(slotPos.x, slotPos.y);
        }

        // Add a rect for the selected slot
        this.selectedSlot = <Rect>scene.add.graphic(GraphicType.RECT, LayerNames.SLOT_LAYER, {position: this.position.clone().inc(0, this.margin), size: this.slotSize.clone().inc(-2)});
        this.selectedSlot.color = Color.WHITE;
        this.selectedSlot.color.a = 0.2;
    }

    addCharacter(character: AnimatedSprite) {
        const i = this.weapons.size;
        const weaponSlotPos = new Vec2(this.position.x + i * this.slotSize.x, this.position.y);
        const weaponSlot = this.scene.add.sprite(this.inventorySlot, LayerNames.SLOT_LAYER);
        weaponSlot.position.set(weaponSlotPos.x, weaponSlotPos.y);
        weaponSlot.onClick = () => {
            const item = this.getItem();
            // Get existing weapon
            const [weapon, pos] = this.weapons.get(character.id);
            // If there is an item in selected slot and an equipment slot wasn't selected before
            if (item && !this.selectedEquipment) {
                // Move item sprite from inventory
                this.moveItemSprite(item, weaponSlotPos);
                // Move item from inventory to equipment
                this.weapons.set(character.id, [item, weaponSlotPos]);
                if (!weapon) {
                    // Delete item from inventory
                    this.items[this.selectedSlotIdx] = null;
                } else {
                    this.moveItemSprite(weapon, this.getSlotPosition(this.selectedSlotIdx));
                    this.items[this.selectedSlotIdx] = weapon;
                }
            }
            this.selectedEquipment = weapon;
            this.selectedSlot.position.copy(weaponSlotPos);
            this.selectedCharacter = character.id;
        }
        this.weapons.set(character.id, [null, weaponSlotPos]);
    }

    getWeapon(character: AnimatedSprite) {
        return this.weapons.get(character.id)[0];
    }

    getSlotPosition(i: number) {
        const posX = this.position.x + i*(this.slotSize.x + this.padding);
        const zoom = 4;
        const posXZoomed = posX * zoom;
        const posXWrapped = (posXZoomed % this.viewPortWidth) / zoom;
        const rowNum = Math.floor(posXZoomed / this.viewPortWidth);
        return new Vec2(posXWrapped, rowNum * 16 + this.position.y + this.margin);
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