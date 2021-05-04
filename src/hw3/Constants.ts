export enum Names {
    NAVMESH = "navmesh"
}

export enum Events {
    SHOT_FIRED = "SHOT_FIRED",
    HEALTHPACK_SPAWN = "HEALTHPACK_SPAWN",
    PLAYER_COLLIDES_ENEMY = "PLAYERS_COLLIDES_ENEMY",
    ENEMY_COLLIDES_PLAYER = "ENEMY_COLLIDES_PLAYER",
    PLAYER_COLLIDES_ITEM = "PLAYER_COLLIDES_ENEMY",
    PLAYER_COLLIDES_PLAYER = "PLAYER_COLLIDES_PLAYER",
    PLAYER_COLLIDES_GROUND = "PLAYER_COLLIDES_GROUND",
    PLAYER_COLLIDES_RESCUE = "PLAYER_COLLIDES_RESCUE",
    PLAYER_ROTATE = "PLAYER_ROTATE",
    PLAYER_HIT_COIN = "PlayerHitCoin",
    PLAYER_LEVEL_END = "PLAYER_LEVEL_END",
    DROP_WEAPON = "DROP_WEAPON",
    CHARACTER_DEATH = "CHARACTER_DEATH",
    DROP_COIN = "DROP_COIN",
    PROJECTILE_COLLIDES_PLAYER = "PROJECTILE_COLLIDES_PLAYER",
    PROJECTILE_COLLIDES_ENEMY = "PROJECTILE_COLLIDES_ENEMY",
    PROJECTILE_COLLIDES_GROUND = "PROJECTILE_COLLIDES_GROUND",
    PLAYER_HIT_SIGN = "PlayerHitSign",
    PLAYER_LEAVE_SIGN = "PlayerLeaveSign"
}

// Important: Enemy must be the third option (because it's used for projectiles. a bit hacky i know)
export const LEVEL_OPTIONS = {
    physics: {
        groupNames: ["ground", "player", "enemy", "item", "coin", "rescue", "player_projectile", "enemy_projectile", "sign"],
        collisions:
        [
            [0, 1, 1, 0, 0, 0, 1, 1, 0],
            [1, 1, 1, 0, 1, 1, 0, 1, 1],
            [1, 1, 1, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0],
            [1, 0, 1, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0]
        ]
    }
}
      
export const TUTORIAL_TEXT = [
    "You've been asleep for quite some time warrior. Do you remember where you are? This is the Cookout Kingdom! Well, the remains of it anyways.\n The kingdom has been attacked by the Fast Food Dynasty. Those bastard! Not many have survived their seige on us, but we won't back down\n Get on your feet! Find the others! Avenge the Kingdom! Your determination forces you to march without halting.\n Stop reading this sign and press ESC to find the controls. You've only got one shot at this!",
    "Looks like you've found three lost strays. Walk across them and they will join your squad automatically. \n\
     Once they have joined your squad, open your inventory with E. See the characters and their equipment slot, you'll need them later",
    "Let's test out your controls cat! Maneuver through these obstacles with your newfound squad!",
    "There are three weapons ahead of you. Walk across them to pick them up. Then open your inventory. \n\
    Since you are controlling your squad, it's best you leave the shooting and stabbing to them. \n\
    However, if you're the last one alive, you can always pick up the damn ketchup bottle yourself and fire away! \n\
    Just up ahead are some troublemaking strays, slaught the bastards",
    "Good work kitties! But you aren't finished yet, this is just the beginning. Just up ahead is the exit. \n\
    Go on ahead and Avenge the Kingdom!"
];

export const LEVEL_NAMES = ["1-1 Awaken", "1-2 Emerging Ruins", "1-3 Untitled", "1-4 Untitled", "1-5 Untitled", "1-6 Untitled"];

export const CONTROLS_TEXT = ["WASD to move", "E to open inventory", "ESC or P to pause", "Left Mouse to use weapon", "1-6 Skip Level", "9 to increase max hp", "0 for toggle speed hack"]