import AABB from "../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Input from "../../Wolfie2D/Input/Input";
import CanvasNode from "../../Wolfie2D/Nodes/CanvasNode";
import GameNode from "../../Wolfie2D/Nodes/GameNode";
import Graphic from "../../Wolfie2D/Nodes/Graphic";
import { GraphicType } from "../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Rect from "../../Wolfie2D/Nodes/Graphics/Rect";
import AnimatedSprite from "../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import Sprite from "../../Wolfie2D/Nodes/Sprites/Sprite";
import Button from "../../Wolfie2D/Nodes/UIElements/Button";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import UILayer from "../../Wolfie2D/Scene/Layers/UILayer";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import BattlerAI from "../AI/BattlerAI";
import CharacterController from "../AI/CharacterController";
import { Events } from "../Constants";
import { drawProgressBar } from "../Util";
import BattleManager from "./BattleManager";
import Item from "./items/Item";
import Weapon from "./items/Weapon";

const LayerNames = {
    SLOT_LAYER: "slots",
    PORTRAIT_LAYER: "inv_portrait",
    ITEM_LAYER: "items",
    CLICK_LAYER: "inv_click",
    BACKGROUND_LAYER: "inv_bg",
}

type CharacterInfo = {
    id: number,
    slotIdxStart: number,
    hpBars: Graphic[],
    character: AnimatedSprite,
    portrait: CanvasNode[],
    hpText: Label,
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
    private viewPortHeight: number;
    private margin: number;
    private slotsCount: number;
    private portraitLayer: UILayer;

    private currentlyMoving: [Item, number];
    private inventoryStart: number;
    // Partitions some slots for characters
    private characterToInfo: CharacterInfo[];
    private numPages: number = 0;
    private currentPage: number = 0;

    constructor(private scene: Scene, size: number, private inventorySlot: string, position: Vec2, padding: number, private zoomLevel: number, items?: Array<Item>, allies?: AnimatedSprite[]){
        size = items?.length || size;
        this.items = items || new Array(size);
        this.inventorySlots = new Array(size);
        this.inventoryClickSlots = new Array(size);
        this.padding = padding;
        this.position = position;
        this.margin = 120;
        this.currentlyMoving = null;
        this.inventoryStart = 0;
        this.characterToInfo = [];
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
        this.viewPortHeight = viewPortCenter.y + viewPortHalfSize.y;
        const bgRect = <Rect>scene.add.graphic(GraphicType.RECT, LayerNames.BACKGROUND_LAYER, {position: viewPortCenter.scaled(zoomLevel), size: viewPortHalfSize.scaled(2 * zoomLevel)});
        bgRect.color = Color.BLACK;

        // Create the inventory slots
        this.createInventorySlots(0, size);

        if (allies) {
            allies.forEach(ally => {
                this.addCharacter(ally, true);
            })
            this.updateItemPositions();
        }

        const previousPage = <Button> scene.add.uiElement(UIElementType.BUTTON, LayerNames.PORTRAIT_LAYER, {position: new Vec2(this.viewPortWidth * 0.4, this.viewPortHeight * 0.60), text: "Previous Cats"});
        previousPage.size.set(200, 50);
        previousPage.borderWidth = 2;
        previousPage.borderColor = Color.WHITE;
        previousPage.onClick = () => {
            const newPage = this.currentPage === 0 ? this.numPages - 1 : this.currentPage - 1;
            if (this.currentPage !== newPage) {
                this.setPageVisiblity(newPage);
            }
            this.currentPage = newPage;
        }

        const nextPage = <Button> scene.add.uiElement(UIElementType.BUTTON, LayerNames.PORTRAIT_LAYER, {position: new Vec2(this.viewPortWidth * 0.6, this.viewPortHeight * 0.60), text: "Next Cats"});
        nextPage.size.set(200, 50);
        nextPage.borderWidth = 2;
        nextPage.borderColor = Color.WHITE;
        nextPage.onClick = () => {
            const newPage = (this.currentPage + 1) % this.numPages;
            if (this.currentPage !== newPage) {
                this.setPageVisiblity(newPage);
            }
            this.currentPage = newPage;
        }
    }

    updateItemPositions() {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i])
                this.items[i].moveSprite(this.getSlotPosition(i), LayerNames.ITEM_LAYER);
        }
    }

    getWeaponsWithNewScene(scene: Scene, battleManager: BattleManager) {
        const newItems = [];
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (item instanceof Weapon) {
                let weaponType = item.type;
                weaponType
                let sprite = scene.add.sprite(weaponType.spriteKey, "primary");
                const weapon = new Weapon(sprite, weaponType, battleManager);
                weapon.sprite.addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)));
                weapon.sprite.setGroup("item");
                weapon.sprite.setTrigger("player", Events.PLAYER_COLLIDES_ITEM, null);
                newItems.push(weapon);
            } else {
                newItems.push(null);
            }
        }
        return newItems;
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
            slotClick.addPhysics(new AABB(Vec2.ZERO, new Vec2(5, 5)))
            slotClick.setGroup("item");
            slotClick.onClick = () => {
                this.slotOnClick(slotClick.position);
            }
            this.inventoryClickSlots[i] = slotClick;
        }
    }

    // Called by player update
    update() {
        this.currentlyMoving?.[0]?.moveSprite(Input.getMousePosition(), LayerNames.ITEM_LAYER);
    }

    undoCurrentlyMoving() {
        if (this.currentlyMoving === null || this.currentlyMoving[0] === null) {
            return;
        }
        this.items[this.currentlyMoving[1]] = this.currentlyMoving[0];
        this.currentlyMoving[0]?.moveSprite(this.getSlotPosition(this.currentlyMoving[1]));
        this.currentlyMoving = null;
    }

    slotOnClick(pos: Vec2) {
        const i = Array.from(this.slotPositions.values()).findIndex((otherPos, j) => {
            return (j >= this.characterToInfo.length || Math.floor(j / 4) === this.currentPage) && otherPos.equals(pos) 
        });
        if (i === -1) {
            return;
        }
        // If item is currently selected
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

    addCharacter(character: AnimatedSprite, dontMove?: boolean) {
        // TODO edit player
        this.drawCharacterPortrait(this.inventoryStart, character, "player", dontMove);
        this.inventoryStart += 1;
        this.numPages = Math.floor((this.characterToInfo.length-1) / 4) + 1;
    }

    deleteCharacter(character: AnimatedSprite) {
        const idx = this.characterToInfo.findIndex((info) => info.id === character.id);
        if (idx >= 0) {
            this.characterToInfo.forEach((characterInfo, i) => {
                if (i > idx) {
                    characterInfo.slotIdxStart -= 1;
                    const prevSlotPos = this.getSlotPosition(i-1);
                    this.inventorySlots[i].position.copy(prevSlotPos);
                    this.inventoryClickSlots[i].position.copy(prevSlotPos);
                    this.items[i]?.moveSprite(prevSlotPos);
                    
                }
            })
            for (let i = this.characterToInfo.length - 1; i < this.inventorySlots.length; i++) {
                this.setSlotPosition(i, this.getSlotPosition(i+1));
            }
            this.slotPositions.delete(this.inventorySlots.length);
            // delete dead cats's portrait
            this.characterToInfo[idx].hpBars?.forEach((hpBar) => hpBar.destroy());
            if (this.characterToInfo[idx].hpText)
                this.characterToInfo[idx].hpText.destroy();
            this.characterToInfo[idx].portrait.forEach(node => {
                node.destroy();
            });
            
            // delete slot and item
            this.inventorySlots[idx].destroy();
            this.inventoryClickSlots[idx].destroy();
            this.items[idx]?.sprite.destroy();

            // delete from array
            this.inventorySlots.splice(idx, 1);
            this.inventoryClickSlots.splice(idx, 1);
            this.characterToInfo.splice(idx, 1);
            this.items.splice(idx, 1);
            this.inventoryStart -= 1;
            this.slotsCount -= 1;
            this.numPages = Math.floor((this.characterToInfo.length-1) / 4) + 1;
            this.currentPage = this.currentPage % this.numPages;

            
            // now delete and redraw
            this.redrawPortraits();
        }
    }

    redrawPortraits() {
        this.characterToInfo.forEach((characterInfo) => {
            // destroy all portraits
            characterInfo.hpBars?.forEach((hpBar) => hpBar.destroy());
            if (characterInfo.hpText)
                characterInfo.hpText.destroy();
            characterInfo.portrait.forEach(node => {
                node.destroy();
            });
            //redraw
            this.drawCharacterPortrait(characterInfo.slotIdxStart, characterInfo.character, "player", true, true);
        })
    }

    moveSlotSprites(i: number, pos: Vec2) {
        this.inventorySlots[i].position.copy(pos);
        this.inventoryClickSlots[i].position.copy(pos);
        this.setSlotPosition(i, pos);
    }

    moveTailSlots(startIdx: number, dontMove?: boolean) {
        for (let i = this.slotsCount-1; i >= startIdx+1; i--) {
            this.moveSlotSprites(i, this.getSlotPosition(i-1));
            if (!dontMove) {
                this.items[i] = this.items[i-1];
                this.items[i-1] = null;
            }
        }
    }

    private updateHpBar(character: GameNode, pos: Vec2) {
        const hpBars = character.ai ?
            drawProgressBar(this.scene, (character.ai as BattlerAI).health, (character.ai as BattlerAI).maxHealth, 50, pos, LayerNames.PORTRAIT_LAYER, 4)
            : drawProgressBar(this.scene, 0, 1, 50, pos, LayerNames.PORTRAIT_LAYER, 4)
        ;
        const characterInfo = this.characterToInfo.find((info) => info.id === character.id)
        characterInfo.hpBars = hpBars;

        const hpTextDisplay = <Label> this.scene.add.uiElement(UIElementType.LABEL,
            LayerNames.PORTRAIT_LAYER,
            {
                position: pos.clone().scaled(this.zoomLevel),
                text: `${(character.ai as BattlerAI).health} / ${(character.ai as BattlerAI).maxHealth}`
            });
        hpTextDisplay.fontSize = 15;
        characterInfo.hpText = hpTextDisplay;
    }

    updateHpBars() {
        for (const {hpBars, character, hpText} of this.characterToInfo) {
            if (hpBars) {
                const pos = hpBars[1].position.clone();
                const [prevGreenBar, prevRedBar] = hpBars;
                if (prevGreenBar.tweens)
                    prevGreenBar.destroy();
                if (prevRedBar.tweens)
                    prevRedBar.destroy();
                if (hpText)
                    hpText.destroy();
                this.updateHpBar(character, pos);
            }
            
        }
        this.setPageVisiblity(this.currentPage);
    }

    setPageVisiblity(page: number) {
        this.characterToInfo.forEach((info, i) => {
            if (Math.floor(i / 4) !== page) {
                info.hpBars?.forEach(node => {
                    node.visible = false;
                })
                if (info.hpText)
                    info.hpText.visible = false;
                info.portrait.forEach(node => {
                    node.visible = false;
                })
                this.inventorySlots[i].visible = false;
                this.inventoryClickSlots[i].visible = false;
                if (this.items[i])
                    this.items[i].sprite.visible = false;
            } else {
                info.hpBars?.forEach(node => {
                    node.visible = true;
                })
                if (info.hpText)
                    info.hpText.visible = true;
                info.portrait.forEach(node => {
                    node.visible = true;
                })
                this.inventorySlots[i].visible = true;
                this.inventoryClickSlots[i].visible = true;
                if (this.items[i])
                    this.items[i].sprite.visible = true;
            }
        })
    }

    drawCharacterPortrait(i: number, character: AnimatedSprite, spriteImageId: string, dontMove?: boolean, deleting?: boolean) {
        const centerOfPortait = this.position.clone().add(new Vec2((i % 4) * (this.viewPortWidth / (4*this.zoomLevel)) + 7 * this.padding, 10 * this.padding));
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
        
        const characterName = this.scene.add.uiElement(UIElementType.LABEL,
            LayerNames.PORTRAIT_LAYER,
            {
                position: new Vec2(centerOfPortait.x * this.zoomLevel, (centerOfPortait.y - height / 3) * this.zoomLevel),
                text: `${i === 0 ? "Player Cat" : `Ally Cat ${i}`}`
            });
        
        // Save data
        if (!deleting) {
            this.characterToInfo.push({id: character.id, character, slotIdxStart: this.inventoryStart, hpBars: null, hpText: null, portrait: [border, characterImg, characterName]});
        } else {
            const characterInfo = this.characterToInfo.find((info) => info.id === character.id);
            characterInfo.portrait = [border, characterImg, characterName];
        }
            
        // Character hp
        this.updateHpBar(character, centerOfPortait.clone().inc(0, -20));

        // Updates inventory slot positions an add new ones for those that were taken by characters
        if (!dontMove) {
            this.createInventorySlots(this.slotsCount, this.slotsCount+1);
            this.slotsCount += 1;
        }

        if (!deleting) {
            this.moveTailSlots(i, dontMove);
            // Move to portrait
            this.moveSlotSprites(i, centerOfPortait.clone().inc(10, 0));
        }

        this.setPageVisiblity(this.currentPage);
    }

    getWeapon(character: AnimatedSprite): any {
        const characterInfo = this.characterToInfo.find((info) => info.id === character.id);
        const slotIdx = characterInfo.slotIdxStart;
        return this.items[slotIdx];
    }

    calculateInvSlotPosition(i: number) {
        const posX = this.position.x + i*(this.slotSize.x + this.padding);
        const posXZoomed = posX * this.zoomLevel;
        const posXWrapped = (posXZoomed % this.viewPortWidth) / this.zoomLevel;
        const rowNum = Math.floor(posXZoomed / this.viewPortWidth);
        const slotPos = new Vec2(posXWrapped, rowNum * 16 + this.position.y + this.margin);
        this.slotPositions.set(i, slotPos);
        return slotPos;
    }

    getSlotPosition(i: number) {
        if (this.slotPositions.has(i)) {
            return this.slotPositions.get(i);
        } else {
            return this.calculateInvSlotPosition(i);
        }
    }

    setSlotPosition(i: number, pos: Vec2) {
        this.slotPositions.set(i, pos);
    }

    /**
     * Adds an item to the currently selected slot
     */
    addItem(item: Item, dontUpdateItemLayer?: boolean): boolean {
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
        if (!dontUpdateItemLayer)
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