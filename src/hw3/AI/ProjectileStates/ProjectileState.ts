import State from "../../../Wolfie2D/DataTypes/State/State";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import ProjectileAI from "../ProjectileAI";

export default abstract class ProjectileState extends State {
    protected parent: ProjectileAI;
    protected owner: AnimatedSprite;

    constructor(parent: ProjectileAI, owner: AnimatedSprite){
      super(parent);
      this.owner = owner;
    }
}