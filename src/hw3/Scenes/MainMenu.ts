import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Layer from "../../Wolfie2D/Scene/Layer";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import Level1 from "./Level1";
import RenderingManager from "../../Wolfie2D/Rendering/RenderingManager";
import SceneManager from "../../Wolfie2D/Scene/SceneManager";
import Viewport from "../../Wolfie2D/SceneGraph/Viewport";
import { CONTROLS_TEXT, LEVEL_NAMES, LEVEL_OPTIONS } from "../Constants";
import Level2 from "./Level2";
import GameLevel from "./GameLevel";
import AudioManager from "../../Wolfie2D/Sound/AudioManager";
import Shop from "./Shop";
import Emitter from "../../Wolfie2D/Events/Emitter";


export default class MainMenu extends Scene {
    // Layers, for multiple main menu screens
    private mainMenu: Layer;
    private about: Layer;
    private controls: Layer;
    private levelSelect: Layer;
    private levels: Array<[string, Vec2, new (viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) => Scene]>

    loadScene(){
        this.load.audio("gameplay", "mcc_assets/music/mainmenumusic.mp3");
        this.load.image("logo", "hw3_assets/static_images/logo.png")
        this.load.audio("click", "mcc_assets/sounds/click.wav");
    }

    startScene(){
        if (!AudioManager.getInstance().isPlaying("gameplay"))
            this.emitter.fireEvent("play_sound", {key: "gameplay", loop: true, holdReference: true});
        //this.emitter.fireEvent("stop_sound", {key: "gameplay"});
        GameLevel.allies = undefined;
        GameLevel.inventory = undefined;
        GameLevel.coinCount = 0;
        const center = this.viewport.getCenter();

        this.levels = [
            [LEVEL_NAMES[0], new Vec2(1.5 * center.x / 3, center.y), Level1],
            [LEVEL_NAMES[1], new Vec2(3 * center.x / 3, center.y), Level2],
            [LEVEL_NAMES[2], new Vec2(4.5 * center.x / 3, center.y), null],
            [LEVEL_NAMES[3], new Vec2(1.5 * center.x / 3, center.y + 100), null],
            [LEVEL_NAMES[4], new Vec2(3 * center.x / 3, center.y + 100), null],
            [LEVEL_NAMES[5], new Vec2(4.5 * center.x / 3, center.y + 100), null],
        ];

        // The main menu
        this.mainMenu = this.addUILayer("mainMenu");

        // Add logo
        const logo = this.add.sprite("logo", "mainMenu");
        logo.position.set(1280 / 2, 720 /4);
        logo.scale = new Vec2(0.15, 0.15);

        // Add play button, and give it an event to emit on press
        const play = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {position: new Vec2(center.x, center.y), text: "Play"});
        play.size.set(200, 50);
        play.borderWidth = 2;
        play.borderColor = Color.WHITE;
        play.backgroundColor = Color.TRANSPARENT;
        play.onClickEventId = "play";

        // Add level select button
        const levelSelect = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {position: new Vec2(center.x, center.y + 100), text: "Level Select"});
        levelSelect.size.set(200, 50);
        levelSelect.borderWidth = 2;
        levelSelect.borderColor = Color.WHITE;
        levelSelect.backgroundColor = Color.TRANSPARENT;
        levelSelect.onClickEventId = "level_select";

        // Add control button
        const controls = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {position: new Vec2(center.x, center.y + 200), text: "Controls"});
        controls.size.set(200, 50);
        controls.borderWidth = 2;
        controls.borderColor = Color.WHITE;
        controls.backgroundColor = Color.TRANSPARENT;
        controls.onClickEventId = "controls";

        // Add event button
        const about = this.add.uiElement(UIElementType.BUTTON, "mainMenu", {position: new Vec2(center.x, center.y + 300), text: "About"});
        about.size.set(200, 50);
        about.borderWidth = 2;
        about.borderColor = Color.WHITE;
        about.backgroundColor = Color.TRANSPARENT;
        about.onClickEventId = "about";

        /* ########## CONTROLS SCREEN ########## */
        this.controls = this.addUILayer("controls");
        this.controls.setHidden(true);

        const controlsHeader = <Label>this.add.uiElement(UIElementType.LABEL, "controls", {position: new Vec2(center.x, center.y - 250), text: "Controls"});
        controlsHeader.textColor = Color.WHITE;


        let controlMargin = [-200, -150, -100, -50, 0, 50, 100];
        CONTROLS_TEXT.forEach((text, i) => {
            const controlLine = <Label>this.add.uiElement(UIElementType.LABEL, "controls", {position: new Vec2(center.x, center.y + controlMargin[i]), text});
            controlLine.textColor = Color.WHITE;
        })

        const controlsBack = this.add.uiElement(UIElementType.BUTTON, "controls", {position: new Vec2(center.x, center.y + 250), text: "Back"});
        controlsBack.size.set(200, 50);
        controlsBack.borderWidth = 2;
        controlsBack.borderColor = Color.WHITE;
        controlsBack.backgroundColor = Color.TRANSPARENT;
        controlsBack.onClickEventId = "menu";

        /* ########## ABOUT SCREEN ########## */
        this.about = this.addUILayer("about");
        this.about.setHidden(true);

        const aboutHeader = <Label>this.add.uiElement(UIElementType.LABEL, "about", {position: new Vec2(center.x, center.y - 250), text: "About"});
        aboutHeader.textColor = Color.WHITE;

        const text1 = "This game was created by Alex Feng, Alex Lau & Dmitri Santiago";
        const text2 = "using the Wolfie2D game engine, a TypeScript game engine created by";
        const text3 = "Joe Weaver and Richard McKenna.";

        const line1 = <Label>this.add.uiElement(UIElementType.LABEL, "about", {position: new Vec2(center.x, center.y - 50), text: text1});
        const line2 = <Label>this.add.uiElement(UIElementType.LABEL, "about", {position: new Vec2(center.x, center.y), text: text2});
        const line3 = <Label>this.add.uiElement(UIElementType.LABEL, "about", {position: new Vec2(center.x, center.y + 50), text: text3});

        line1.textColor = Color.WHITE;
        line2.textColor = Color.WHITE;
        line3.textColor = Color.WHITE;

        const aboutBack = this.add.uiElement(UIElementType.BUTTON, "about", {position: new Vec2(center.x, center.y + 250), text: "Back"});
        aboutBack.size.set(200, 50);
        aboutBack.borderWidth = 2;
        aboutBack.borderColor = Color.WHITE;
        aboutBack.backgroundColor = Color.TRANSPARENT;
        aboutBack.onClickEventId = "menu";

        this.initializeLevelSelect();

        // Subscribe to the button events
        this.receiver.subscribe("play");
        this.receiver.subscribe("about");
        this.receiver.subscribe("level_select");
        this.receiver.subscribe("menu");
        this.receiver.subscribe("controls");

        this.levels.forEach(levelData => {
            this.receiver.subscribe(levelData[0]);
        })
    }

    createLevelButton(levelName: string, position: Vec2)  {
        const controlsBack = this.add.uiElement(UIElementType.BUTTON, "levelSelect", {position: position, text: levelName});
        controlsBack.size.set(200, 50);
        controlsBack.borderWidth = 2;
        controlsBack.borderColor = Color.WHITE;
        controlsBack.backgroundColor = Color.TRANSPARENT;
        controlsBack.onClickEventId = levelName;
    }

    initializeLevelSelect() {
        const center = this.viewport.getCenter();
        /* ########## LEVEL SELECT SCREEN ########## */
        this.levelSelect = this.addUILayer("levelSelect");
        this.levelSelect.setHidden(true);

        const levelSelectHeader = <Label>this.add.uiElement(UIElementType.LABEL, "levelSelect", {position: new Vec2(center.x, center.y - 250), text: "Level Selector"});
        levelSelectHeader.textColor = Color.WHITE;

        
        for (const [levelName, position] of this.levels) {
            this.createLevelButton(levelName, position);
        }
      

        const levelSelectBack = this.add.uiElement(UIElementType.BUTTON, "levelSelect", {position: new Vec2(center.x, center.y + 250), text: "Back"});
        levelSelectBack.size.set(200, 50);
        levelSelectBack.borderWidth = 2;
        levelSelectBack.borderColor = Color.WHITE;
        levelSelectBack.backgroundColor = Color.TRANSPARENT;
        levelSelectBack.onClickEventId = "menu";
    }

    updateScene(){
        while(this.receiver.hasNextEvent()){
            let event = this.receiver.getNextEvent();

            if(event.type === "play"){
                this.sceneManager.changeToScene(Level1, {}, LEVEL_OPTIONS);
                if (AudioManager.getInstance().isPlaying("gameplay"))
                    this.emitter.fireEvent("stop_sound", {key: "gameplay", loop: true, holdReference: true});
            }

            if(event.type === "level_select"){
                this.levelSelect.setHidden(false);
                this.mainMenu.setHidden(true);
            }

            if(event.type === "controls"){
                this.controls.setHidden(false);
                this.mainMenu.setHidden(true);
            }

            if(event.type === "about"){
                this.about.setHidden(false);
                this.mainMenu.setHidden(true);
            }

            if(event.type === "menu"){
                this.mainMenu.setHidden(false);
                this.about.setHidden(true);
                this.levelSelect.setHidden(true);
                this.controls.setHidden(true);
            }

            const levelSelected = this.levels.find(levelInfo => levelInfo[0] === event.type);
            if (levelSelected && levelSelected[2]) {
                this.sceneManager.changeToScene(levelSelected[2], {}, LEVEL_OPTIONS);
            }
        }
    }
}