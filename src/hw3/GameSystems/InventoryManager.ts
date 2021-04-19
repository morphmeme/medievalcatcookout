import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Input from "../../Wolfie2D/Input/Input";
import GameNode from "../../Wolfie2D/Nodes/GameNode";
import Graphic from "../../Wolfie2D/Nodes/Graphic";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import UILayer from "../../Wolfie2D/Scene/Layers/UILayer";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import BattlerAI from "../AI/BattlerAI";
import CharacterController from "../AI/CharacterController";
import { Events } from "../Constants";
import { drawProgressBar } from "../Util";
import Item from "./items/Item";

const LayerNames = {
    SLOT_LAYER: "slots",
    PORTRAIT_LAYER: "inv_portrait",
    ITEM_LAYER: "items",
    CLICK_LAYER: "inv_click",
    BACKGROUND_LAYER: "inv_bg",
}

type CharacterInfo = {
    slotIdxStart: number,
    hpBars: Graphic[],
    character: AnimatedSprite,
}

export default class InventoryManager {
    private position: Vec2;
    private items: Array<Item>;
    private inventorySlots: Array<Sprite>;
    private inventoryClickSlots: Array<Sprite>;
    private slotPositions: Map<number, Vec2>;

    private slotSize: Vec2;
    private padding: number;
    private viewPortWidth: number;
    private margin: number;
    private slotsCount: number;
    private portraitLayer: UILayer;

    private currentlyMoving: [Item, number];
    private inventoryStart: number;
    // Partitions some slots for characters
    private characterToInfo: Map<number, CharacterInfo>;

    constructor(private scene: Scene, size: number, private inventorySlot: string, position: Vec2, padding: number, private zoomLevel: number){
        this.items = new Array(size);
        this.inventorySlots = new Array(size);
        this.inventoryClickSlots = new Array(size);
        this.padding = padding;
        this.position = position;
        this.margin = 120;
        this.currentlyMoving = null;
        this.inventoryStart = 0;
        this.characterToInfo = new Map();
        this.slotPositions = new Map();
        this.slotsCount = size;
        
        // Add layers
        const bgLayer = scene.addUILayer(LayerNames.BACKGROUND_LAYER);
        bgLayer.setDepth(100)
        bgLayer.setHidden(true);
        this.portraitLayer = scene.addUILayer(LayerNames.PORTRAIT_LAYER);
        this.portraitLayer.setDepth(101)
        this.portraitLayer.setHidden(true);
        const slotLayer = scene.addUILayer(LayerNames.SLOT_LAYER);
        slotLayer.setDepth(102)
        slotLayer.setHidden(true);
        const itemLayer = scene.addUILayer(LayerNames.ITEM_LAYER);
        itemLayer.setDepth(103)
        itemLayer.setHidden(true);
        const clickLayer = scene.addLayer(LayerNames.CLICK_LAYER);
        clickLayer.setDepth(104)
        clickLayer.setHidden(true);

        // Draw background
        const viewPort = scene.getViewport()
        const viewPortCenter = viewPort.getCenter();
        const viewPortHalfSize = viewPort.getHalfSize();
        this.viewPortWidth = viewPortCenter.x + viewPortHalfSize.x;
        const bgRect = <Rect>scene.add.graphic(GraphicType.RECT, LayerNames.BACKGROUND_LAYER, {position: viewPortCenter, size: viewPortHalfSize.scaled(2)});
        bgRect.color = Color.BLACK;

        // Create the inventory slots
        this.createInventorySlots(0, size);
    }

    createInventorySlots(start: number, end: number) {
        for(let i = start; i < end; i++){
            const slot = this.scene.add.sprite(this.inventorySlot, LayerNames.SLOT_LAYER);
            this.inventorySlots[i] = slot;
        }

        this.slotSize = this.inventorySlots[0].size.clone();
        // Position the inventory slots
        for(let i = start; i < end; i++){
            const slotPos = this.getSlotPosition(i);
            this.inventorySlots[i].position.set(slotPos.x, slotPos.y);
            // create clickable rect
            const slotClick = this.scene.add.sprite(this.inventorySlot, LayerNames.CLICK_LAYER);
            slotClick.position.set(slotPos.x, slotPos.y);
            slotClick.visible = false;
            slotClick.addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)))
            slotClick.setGroup("item");
            slotClick.onClick = () => {
                this.slotOnClick(i);
            }
            this.inventoryClickSlots[i]= slotClick;
        }
    }

    // Called by player update
    update() {
        this.currentlyMoving?.[0]?.moveSprite(Input.getMousePosition(), LayerNames.ITEM_LAYER);
    }

    slotOnClick(i: number) {
        // If item is currently selected
        console.log(this.items);
        if (this.currentlyMoving?.[0]) {
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

    addCharacter(character: GameNode) {
        this.characterToInfo.set(character.id, {character, slotIdxStart: this.inventoryStart, ...this.characterToInfo.get(character.id)});
        // TODO edit player
        this.drawCharacterPortrait(this.inventoryStart, character, "player");
        this.inventoryStart += 1;
    }

    // TODO later
    deleteCharacter(character: AnimatedSprite) {
    }

    moveSlotSprites(i: number, pos: Vec2) {
        this.inventorySlots[i].position.copy(pos);
        this.inventoryClickSlots[i].position.copy(pos);
        this.setSlotPosition(i, pos);
    }

    moveTailSlots(startIdx: number) {
        for (let i = this.slotsCount-1; i >= startIdx+1; i--) {
            this.moveSlotSprites(i, this.getSlotPosition(i-1));
            this.items[i] = this.items[i-1];
            this.items[i-1] = null;
        }
    }

    private updateHpBar(character: GameNode, pos: Vec2) {
        const hpBars = character.ai ?
            drawProgressBar(this.scene, (character.ai as BattlerAI).health, (character.ai as BattlerAI).maxHealth, 50, pos, LayerNames.PORTRAIT_LAYER)
            : drawProgressBar(this.scene, 0, 1, 50, pos, LayerNames.PORTRAIT_LAYER)
        ;
        this.characterToInfo.set(character.id, {hpBars, ...this.characterToInfo.get(character.id)});
    }

    updateHpBars() {
        for (const {hpBars, character} of this.characterToInfo.values()) {
            if (hpBars) {
                const pos = hpBars[0].position.clone();
                const [prevGreenBar, prevRedBar] = hpBars;
                if (prevGreenBar.tweens)
                    prevGreenBar.destroy();
                if (prevRedBar.tweens)
                    prevRedBar.destroy();
                this.updateHpBar(character, pos);
            }
        }
    }

    drawCharacterPortrait(i: number, character: GameNode, spriteImageId: string) {
        const centerOfPortait = this.position.clone().add(new Vec2(i * (this.viewPortWidth / (4*this.zoomLevel)) + 7 * this.padding, 10 * this.padding));
        const width = 60;
        const height = 90;
        let options = {
            size: new Vec2(width, height),
            position: centerOfPortait,
        }
        const border = this.scene.add.graphic(GraphicType.RECT, LayerNames.PORTRAIT_LAYER, options);
        border.color = Color.WHITE;
        const characterImg = this.scene.add.animatedSprite(spriteImageId, LayerNames.PORTRAIT_LAYER);
        characterImg.animation.play("IDLE");
        characterImg.position.set(centerOfPortait.x - width / 4, centerOfPortait.y);
        
        // Character hp
        this.updateHpBar(character, centerOfPortait.clone().inc(0, -10));

        // Character Name
        this.scene.add.uiElement(UIElementType.LABEL, LayerNames.PORTRAIT_LAYER, {position: new Vec2(centerOfPortait.x * this.zoomLevel, (centerOfPortait.y - height / 3) * this.zoomLevel), text: `Character ${i+1}`});

        // Updates inventory slot positions an add new ones for those that were taken by characters
        this.createInventorySlots(this.slotsCount, this.slotsCount+1);
        this.slotsCount += 1;
        this.moveTailSlots(i);
        this.moveSlotSprites(i, centerOfPortait);
    }

    getWeapon(character: AnimatedSprite): any {
        const slotIdx = this.characterToInfo.get(character.id).slotIdxStart;
        return this.items[slotIdx];
    }

    getSlotPosition(i: number) {
        if (this.slotPositions.has(i)) {
            return this.slotPositions.get(i);
        } else {
            const posX = this.position.x + i*(this.slotSize.x + this.padding);
            const posXZoomed = posX * this.zoomLevel;
            const posXWrapped = (posXZoomed % this.viewPortWidth) / this.zoomLevel;
            const rowNum = Math.floor(posXZoomed / this.viewPortWidth);
            const slotPos = new Vec2(posXWrapped, rowNum * 16 + this.position.y + this.margin);
            this.slotPositions.set(i, slotPos);
            return slotPos;
        }
    }

    setSlotPosition(i: number, pos: Vec2) {
        this.slotPositions.set(i, pos);
    }

    /**
     * Adds an item to the currently selected slot
     */
    addItem(item: Item): boolean {
        // addItem might happen twice in a row? TODO: better way to fix this
        for (const other of this.items) {
            if (other && other.sprite.id == item.sprite.id) {
                return;
            }
        }
        let firstSlotAvailable = this.items.length-1;
        for (let i = this.inventoryStart; i < this.items.length; i++) {
            if (!this.items[i]) {
                firstSlotAvailable = i;
                break;
            }
        }
        if (this.items[firstSlotAvailable]) {
            this.removeItem(firstSlotAvailable);
        }
        this.items[firstSlotAvailable] = item;
            
        // Update the gui
        item.moveSprite(this.getSlotPosition(firstSlotAvailable), LayerNames.ITEM_LAYER);

        return true;
    }

    /**
     * Removes and returns an item from the the currently selected slot, if possible
     */
    removeItem(i: number): Item {
        let item = this.items[i];

        this.items[i] = null;

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