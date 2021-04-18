import GameNode from "../../Wolfie2D/Nodes/GameNode";
import BattlerAI from "../AI/BattlerAI";
import Weapon from "./items/Weapon";

export default class BattleManager {
    allies: Array<BattlerAI>;

    enemies: Array<BattlerAI>;

    handleInteraction(attackerType: string, weapon: Weapon){
        if(attackerType === "player"){
            // Check for collisions with enemies
            for(let enemy of this.enemies){
                if(weapon.hits(enemy.owner)){
                    enemy.damage(weapon.type.damage);
                }
            }
        } else {
            // Check for collision with allies
            this.allies.forEach(ally => {
                if(weapon.hits(ally.owner)){
                    ally.damage(weapon.type.damage);
                }
            })
        }
    }

    setAllies(allies: Array<BattlerAI>): void {
        this.allies = allies;
    }

    setEnemies(enemies: Array<BattlerAI>): void {
        this.enemies = enemies;
    }
}