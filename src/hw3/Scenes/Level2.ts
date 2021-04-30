import GameLevel from "./GameLevel";
export default class Level2 extends GameLevel {
    public static nextLevel = Level2;

    unloadScene(){
        // TODO Keep resources - this is up to you
    }

    startScene(): void {
        super.startScene();
    }

    updateScene(deltaT: number): void {
        super.updateScene(deltaT);
    }
}