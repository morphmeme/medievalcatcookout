import Vec2 from "../Wolfie2D/DataTypes/Vec2";
import { GraphicType } from "../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Scene from "../Wolfie2D/Scene/Scene";
import Color from "../Wolfie2D/Utils/Color";

// TODO: This will crash the game after awhile (not long enough to care)
// because too many IDs are being generated for each node. Need to reuse IDs or use UUID.
// Also a very expensive operation
export function drawProgressBar(scene: Scene, progress: number, maxProgress: number, width: number, pos: Vec2, layer: string) {
    const workBar = scene.add.graphic(GraphicType.RECT, layer, {position: pos.clone(), size: new Vec2(width, 1)});
    workBar.color = Color.RED;
    const progressBar = scene.add.graphic(
        GraphicType.RECT,
        layer, 
        {
            position: pos.clone().inc(-(width - width * (progress/maxProgress)) / 2, 0),
            size: new Vec2(width * (progress/maxProgress), 1)
        }
        );
    progressBar.color = Color.GREEN;
    return [progressBar, workBar];
}