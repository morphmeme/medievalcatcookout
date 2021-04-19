import State from "../../../Wolfie2D/DataTypes/State/State";
import GameNode from "../../../Wolfie2D/Nodes/GameNode";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import EnemyAI from "../EnemyAI";

export default abstract class EnemyState extends State {
    protected parent: EnemyAI;
    protected owner: AnimatedSprite;

    constructor(parent: EnemyAI, owner: AnimatedSprite){
      super(parent);
      this.owner = owner;
    }
}