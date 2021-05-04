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
import MainMenu from "./MainMenu";

export default class Splash extends Scene {
    // Layers, for multiple main menu screens
    private splashLayer: Layer;
    private about: Layer;
    private controls: Layer;
    private levelSelect: Layer;
    private levels: Array<[string, Vec2, new (viewport: Viewport, sceneManager: SceneManager, renderingManager: RenderingManager, options: Record<string, any>) => Scene]>

    loadScene(){
        this.load.image("splash", "mcc_assets/static_images/catsplash.png")
    }

    startScene(){
        const center = this.viewport.getCenter();
        this.splashLayer = this.addUILayer("splash");
        // Add logo
        const logo = this.add.sprite("splash", "splash");
        logo.position.set(center.x, center.y);
        logo.scale = new Vec2(2/3, 2/3);

        const play = this.add.uiElement(UIElementType.BUTTON, "splash", {position: new Vec2(center.x, center.y), text: ""});
        play.size.set(1280, 720);
        play.borderColor = Color.TRANSPARENT;
        play.backgroundColor = Color.TRANSPARENT;
        play.alpha = 0.0;
        play.onClickEventId = "splash_next";

        this.receiver.subscribe("splash_next");
    }

    updateScene(){
        while(this.receiver.hasNextEvent()){
            let event = this.receiver.getNextEvent();


            if(event.type === "splash_next"){
                this.sceneManager.changeToScene(MainMenu, {});
            }
        }
    }
}