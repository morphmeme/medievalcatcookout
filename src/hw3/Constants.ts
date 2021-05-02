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

export const LEVEL_OPTIONS = {
    physics: {
        groupNames: ["ground", "player", "enemy", "item", "coin", "rescue", "projectile", "sign"],
        collisions:
        [
            [0, 1, 1, 0, 0, 0, 1, 0],
            [1, 1, 1, 0, 1, 1, 1, 0],
            [1, 1, 1, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 1]
        ]
    }
}

export const CONTROLS_TEXT = ["WASD to move", "E to open inventory", "ESC or P to pause", "Left Mouse to use weapon", "1-6 Skip Level", "9 to increase max hp", "0 for toggle speed hack"]

export const TUTORIAL_TEXT = [
    "1",
    "2",
    "3",
    "4",
    "5"
];