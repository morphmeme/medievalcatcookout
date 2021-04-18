import State from "../../../Wolfie2D/DataTypes/State/State";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
import CharacterController from "../CharacterController";

export default abstract class CharacterState extends State {
    protected parent: CharacterController;
    protected owner: AnimatedSprite;

    constructor(parent: CharacterController, owner: AnimatedSprite){
      super(parent);
      this.owner = owner;
    }
}