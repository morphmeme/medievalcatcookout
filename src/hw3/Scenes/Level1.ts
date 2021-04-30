import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import GameLevel from "./GameLevel";
import Level2 from "./Level2";
export default class Level1 extends GameLevel {
    public static nextLevel = Level2;

    unloadScene(){
        // TODO Keep resources - this is up to you
    }

    startScene(): void {
        super.startScene();

        this.addLevelEnd(new Vec2(20, 0), new Vec2(12,1));
        this.nextLevel = Level2;
    }

    updateScene(deltaT: number): void {
        super.updateScene(deltaT);
    }
}