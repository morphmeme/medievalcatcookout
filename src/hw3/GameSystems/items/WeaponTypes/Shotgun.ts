import AABB from "../../../../Wolfie2D/DataTypes/Shapes/AABB";
import Vec2 from "../../../../Wolfie2D/DataTypes/Vec2";
import GameNode, { TweenableProperties } from "../../../../Wolfie2D/Nodes/GameNode";
import Graphic from "../../../../Wolfie2D/Nodes/Graphic";
import { GraphicType } from "../../../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import Line from "../../../../Wolfie2D/Nodes/Graphics/Line";
import OrthogonalTilemap from "../../../../Wolfie2D/Nodes/Tilemaps/OrthogonalTilemap";
import Scene from "../../../../Wolfie2D/Scene/Scene";
import Color from "../../../../Wolfie2D/Utils/Color";
import { EaseFunctionType } from "../../../../Wolfie2D/Utils/EaseFunctions";
import WeaponType from "./WeaponType";

export default class Shotgun extends WeaponType {
    line1: Line = null;
    line2: Line = null;
    line3: Line = null;
    lines: Line[] = [this.line1, this.line2, this.line3];
    color: Color;

    initialize(options: Record<string, any>): void {
        this.damage = options.damage;
        this.cooldown = options.cooldown;
        this.color = Color.fromStringHex(options.color);
        this.displayName = options.displayName;
        this.spriteKey = options.spriteKey;
        this.useVolume = options.useVolume;
    }

    doAnimation(scene: Scene, shooter: GameNode, direction: Vec2): void {
        let start = shooter.position.clone();
        let r1 = Math.random()*0.4 - 0.2;
        let r2 = Math.random()*0.4 - 0.2;
        let r3 = Math.random()*0.4 - 0.2;
        let end1 = shooter.position.clone().add(direction.scaled(900).rotateCCW(r1));
        let end2 = shooter.position.clone().add(direction.scaled(900).rotateCCW(r2));
        let end3 = shooter.position.clone().add(direction.scaled(900).rotateCCW(r3));
        let ends: Vec2[] = [end1, end2, end3];        
        for(let i = 0; i < ends.length; i++){
            let end = ends[i];
            let delta = ends[i].clone().sub(start);

            // Iterate through the tilemap region until we find a collision
            let minX = Math.min(start.x, end.x);
            let maxX = Math.max(start.x, end.x);
            let minY = Math.min(start.y, end.y);
            let maxY = Math.max(start.y, end.y);

            // Get the wall tilemap
            let walls = <OrthogonalTilemap>shooter.getScene().getLayer("Wall").getItems()[0];

            let minIndex = walls.getColRowAt(new Vec2(minX, minY));
            let maxIndex = walls.getColRowAt(new Vec2(maxX, maxY));

            let tileSize = walls.getTileSize();

            for(let col = minIndex.x; col <= maxIndex.x; col++){
                for(let row = minIndex.y; row <= maxIndex.y; row++){
                    if(walls.isTileCollidable(col, row)){
                        // Get the position of this tile
                        let tilePos = new Vec2(col * tileSize.x + tileSize.x/2, row * tileSize.y + tileSize.y/2);

                        // Create a collider for this tile
                        let collider = new AABB(tilePos, tileSize.scaled(1/2));

                        let hit = collider.intersectSegment(start, delta, Vec2.ZERO);

                        if(hit !== null && start.distanceSqTo(hit.pos) < start.distanceSqTo(end)){
                            end = hit.pos;
                        }
                    }
                }
            }
            if (this.lines[i]) {
                this.lines[i].destroy();
            }
            this.lines[i] = <Line> scene.add.graphic(GraphicType.LINE, "primary", {start, end});

            this.lines[i].color = this.color;
            this.lines[i].tweens.add("fade", {
                startDelay: 0,
                duration: 300,
                effects: [
                    {
                        property: TweenableProperties.alpha,
                        start: 1,
                        end: 0,
                        ease: EaseFunctionType.OUT_SINE
                    }
                ]
            });
            this.lines[i].start = start;
            this.lines[i].end = end;
            this.lines[i].tweens.play("fade");
        }
        console.log(this.lines[0]);
        console.log(this.lines[1]);
        console.log(this.lines[2]);
    }

    hits(node: GameNode): boolean {
        if (!node) {
            return false;
        }
        return node.collisionShape.getBoundingRect().intersectSegment(this.lines[0].start, this.lines[0].end.clone().sub(this.lines[0].start)) !== null || 
        node.collisionShape.getBoundingRect().intersectSegment(this.lines[1].start, this.lines[1].end.clone().sub(this.lines[1].start)) !== null ||
        node.collisionShape.getBoundingRect().intersectSegment(this.lines[2].start, this.lines[2].end.clone().sub(this.lines[2].start)) !== null; 
    }
}