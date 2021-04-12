import AI from "../../Wolfie2D/DataTypes/Interfaces/AI";
import GameNode from "../../Wolfie2D/Nodes/GameNode";

export default interface BattlerAI extends AI {
    owner: GameNode;

    health: number;

    maxHealth: number;

    damage: (damage: number) => void;
}