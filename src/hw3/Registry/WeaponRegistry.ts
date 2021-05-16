import Registry from "../../Wolfie2D/Registry/Registries/Registry";
import ResourceManager from "../../Wolfie2D/ResourceManager/ResourceManager";
import LaserGun from "../GameSystems/items/WeaponTypes/LaserGun";
import Projectile from "../GameSystems/items/WeaponTypes/Projectile";
import SemiAutoGun from "../GameSystems/items/WeaponTypes/SemiAutoGun";
import Shotgun from "../GameSystems/items/WeaponTypes/Shotgun";
import Stab from "../GameSystems/items/WeaponTypes/Stab";
import WeaponType from "../GameSystems/items/WeaponTypes/WeaponType";
import Cannon from "../GameSystems/items/WeaponTypes/Cannon";
export default class WeaponTemplateRegistry extends Registry<WeaponConstructor> {
    
    public preload(): void {
        const rm = ResourceManager.getInstance();

        // Load sprites
        rm.image("ketchupbottle", "hw3_assets/sprites/ketchup.png");
        rm.image("spatula", "hw3_assets/sprites/spatula.png");
        rm.image("lasergun", "hw3_assets/sprites/lasergun.png");
        rm.image("mustardbottle", "hw3_assets/sprites/mustard.png");
        rm.image("saltgun", "hw3_assets/sprites/salt.png");
        rm.image("peppergun", "hw3_assets/sprites/pepper.png");
        // Load spritesheets
        rm.spritesheet("stab", "hw3_assets/spritesheets/stab.json");
        // Register default types
        this.registerItem("stab", Stab);
        this.registerItem("semiAutoGun", SemiAutoGun);
        this.registerItem("laserGun", LaserGun);
        this.registerItem("shotGun", Shotgun);
        this.registerItem("projectile", Projectile);
        this.registerItem("cannon", Cannon);
        
    }

    // We don't need this for this assignment
    public registerAndPreloadItem(key: string): void {}

    public registerItem(key: string, constr: WeaponConstructor): void {
        this.add(key, constr);
    }
}

type WeaponConstructor = new (...args: any) => WeaponType;