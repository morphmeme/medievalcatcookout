import GameLevel from "./GameLevel";
import Level2 from "./Level2";
export default class Level1 extends GameLevel {
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