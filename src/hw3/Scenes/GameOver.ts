import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import Input from "../../Wolfie2D/Input/Input";
import Label from "../../Wolfie2D/Nodes/UIElements/Label";
import { UIElementType } from "../../Wolfie2D/Nodes/UIElements/UIElementTypes";
import Scene from "../../Wolfie2D/Scene/Scene";
import Color from "../../Wolfie2D/Utils/Color";
import MainMenu from "./MainMenu";

export default class GameOver extends Scene {

    startScene() {
        const viewPort = this.getViewport()
        this.viewport.setZoomLevel(1);
        const viewPortCenter = viewPort.getCenter();
        const viewPortHalfSize = viewPort.getHalfSize();
        const viewPortHeight = viewPortCenter.y + viewPortHalfSize.y;
        const viewPortWidth = viewPortCenter.x + viewPortHalfSize.x;

        this.addUILayer("primary");

        const gameOver = <Label>this.add.uiElement(UIElementType.LABEL, "primary", {position: new Vec2(640, 120), text: "Game Over"});
        gameOver.textColor = Color.WHITE;

        const mainMenuButton = this.add.uiElement(UIElementType.BUTTON, "primary", {position: new Vec2(640, 550), text: "Main Menu"});
        mainMenuButton.size.set(200, 50);
        mainMenuButton.borderWidth = 2;
        mainMenuButton.borderColor = Color.WHITE;
        mainMenuButton.backgroundColor = Color.TRANSPARENT;
        mainMenuButton.onClick = () => {
            this.sceneManager.changeToScene(MainMenu, {});;
        }
    }
}