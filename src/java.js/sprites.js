
"use strict";

/*
========================================================
ZELDA PIXEL ADVENTURE
SPRITE ENGINE — BETA 3

ARQUIVO: sprites.js

FUNCIONALIDADES:

- Sprites procedurais
- Spritesheets externos
- Personagens direcionais
- Animações de caminhada
- Animações de ataque
- Animações de defesa
- Animações de magia
- Animações de dano
- NPCs
- Comerciantes
- Inimigos
- Chefes
- Animais
- Equipamentos visuais
- Cache de sprites
- Renderização pixel perfect

========================================================
*/


// =====================================================
// CONFIGURAÇÕES
// =====================================================

export const SPRITES_CONFIG = Object.freeze({

    WIDTH: 24,

    HEIGHT: 32,

    FRAMES: 4,

    WALK_SPEED: 7,

    RUN_SPEED: 11,

    IDLE_SPEED: 1.5,

    MAX_CACHE: 256

});


// =====================================================
// DIREÇÕES
// =====================================================

export const SPRITE_DIRECTIONS = Object.freeze({

    DOWN: "down",

    LEFT: "left",

    RIGHT: "right",

    UP: "up"

});


// =====================================================
// ESTADOS
// =====================================================

export const SPRITE_STATES = Object.freeze({

    IDLE: "idle",

    WALK: "walk",

    RUN: "run",

    ATTACK: "attack",

    BLOCK: "block",

    CAST: "cast",

    HIT: "hit",

    DEAD: "dead"

});


// =====================================================
// PALETAS DE PERSONAGENS
// =====================================================

export const CHARACTER_PALETTES = Object.freeze({

    warrior: {

        skin: "#e9bc91",

        hair: "#795032",

        body: "#667b91",

        armor: "#a1abb5",

        legs: "#454d58",

        boots: "#332c2c",

        accent: "#e2bb71"

    },

    mage: {

        skin: "#e7ba96",

        hair: "#b7a6d1",

        body: "#65528c",

        armor: "#a69ac8",

        legs: "#443b64",

        boots: "#352d48",

        accent: "#8bd9ed"

    },

    rogue: {

        skin: "#dfab83",

        hair: "#362a29",

        body: "#41494c",

        armor: "#697173",

        legs: "#33383c",

        boots: "#28292c",

        accent: "#7cb294"

    },

    ranger: {

        skin: "#e3b48a",

        hair: "#845b36",

        body: "#426c46",

        armor: "#769759",

        legs: "#514d37",

        boots: "#493628",

        accent: "#a3c66b"

    },

    paladin: {

        skin: "#edc49b",

        hair: "#927746",

        body: "#c3b783",

        armor: "#e1dbbc",

        legs: "#7b786e",

        boots: "#554b3c",

        accent: "#f5d77e"

    },

    druid: {

        skin: "#d9a878",

        hair: "#7c5939",

        body: "#6b7847",

        armor: "#a1ae79",

        legs: "#555b3c",

        boots: "#45382c",

        accent: "#a4d68b"

    },

    enemy: {

        skin: "#b28d62",

        hair: "#40372e",

        body: "#835c45",

        armor: "#ad7855",

        legs: "#554538",

        boots: "#332c29",

        accent: "#d6ac6c"

    },

    boss: {

        skin: "#747b79",

        hair: "#494d4e",

        body: "#586563",

        armor: "#9ba6a0",

        legs: "#464d4a",

        boots: "#343b38",

        accent: "#f2a64d"

    }

});


// =====================================================
// UTILITÁRIOS
// =====================================================

function spriteClamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}


function spritePixel(
    ctx,
    x,
    y,
    width,
    height,
    color
) {

    if (
        width <= 0 ||
        height <= 0
    ) {

        return;

    }

    ctx.fillStyle = color;

    ctx.fillRect(

        Math.round(x),

        Math.round(y),

        Math.round(width),

        Math.round(height)

    );

}


// =====================================================
// DESENHAR SILHUETA DO PERSONAGEM
// =====================================================

function drawCharacterBody(
    ctx,
    palette,
    direction,
    frame,
    state
) {

    const moving =

        state === SPRITE_STATES.WALK ||

        state === SPRITE_STATES.RUN;

    const step = moving
        ? [0, 2, 0, -2][frame % 4]
        : 0;

    const attack =
        state === SPRITE_STATES.ATTACK;

    const casting =
        state === SPRITE_STATES.CAST;

    // ---------------------------------------------
    // SOMBRA
    // ---------------------------------------------

    spritePixel(

        ctx,

        6,

        28,

        12,

        3,

        "rgba(0,0,0,0.25)"

    );

    // ---------------------------------------------
    // PERNAS
    // ---------------------------------------------

    spritePixel(

        ctx,

        7,

        21 + Math.max(0, step),

        4,

        8 - Math.max(0, step),

        palette.legs

    );

    spritePixel(

        ctx,

        14,

        21 + Math.max(0, -step),

        4,

        8 - Math.max(0, -step),

        palette.legs

    );

    // ---------------------------------------------
    // BOTAS
    // ---------------------------------------------

    spritePixel(

        ctx,

        6,

        26 + Math.min(0, step),

        5,

        3,

        palette.boots

    );

    spritePixel(

        ctx,

        14,

        26 + Math.min(0, -step),

        5,

        3,

        palette.boots

    );

    // ---------------------------------------------
    // CORPO
    // ---------------------------------------------

    spritePixel(

        ctx,

        6,

        12,

        12,

        12,

        palette.body

    );

    // ---------------------------------------------
    // ARMADURA
    // ---------------------------------------------

    spritePixel(

        ctx,

        8,

        13,

        8,

        7,

        palette.armor

    );

    spritePixel(

        ctx,

        11,

        13,

        2,

        7,

        palette.accent

    );

    // ---------------------------------------------
    // CINTO
    // ---------------------------------------------

    spritePixel(

        ctx,

        6,

        21,

        12,

        2,

        palette.boots

    );

    spritePixel(

        ctx,

        11,

        21,

        2,

        2,

        palette.accent

    );

    // ---------------------------------------------
    // BRAÇOS
    // ---------------------------------------------

    const leftArmY =
        casting ? 5 : attack ? 10 : 13;

    const rightArmY =
        attack ? 5 : casting ? 10 : 13;

    spritePixel(

        ctx,

        3,

        leftArmY,

        4,

        9,

        palette.body

    );

    spritePixel(

        ctx,

        17,

        rightArmY,

        4,

        9,

        palette.body

    );

    spritePixel(

        ctx,

        3,

        leftArmY + 6,

        4,

        3,

        palette.skin

    );

    spritePixel(

        ctx,

        17,

        rightArmY + 6,

        4,

        3,

        palette.skin

    );

    // ---------------------------------------------
    // CABEÇA
    // ---------------------------------------------

    spritePixel(

        ctx,

        7,

        4,

        10,

        10,

        palette.skin

    );

    // ---------------------------------------------
    // CABELO
    // ---------------------------------------------

    spritePixel(

        ctx,

        6,

        3,

        12,

        4,

        palette.hair

    );

    spritePixel(

        ctx,

        6,

        6,

        2,

        5,

        palette.hair

    );

    spritePixel(

        ctx,

        16,

        6,

        2,

        5,

        palette.hair

    );

    // ---------------------------------------------
    // ROSTO
    // ---------------------------------------------

    if (
        direction === "down"
    ) {

        spritePixel(
            ctx,
            9,
            9,
            1,
            2,
            "#342820"
        );

        spritePixel(
            ctx,
            14,
            9,
            1,
            2,
            "#342820"
        );

    }

    if (
        direction === "left"
    ) {

        spritePixel(
            ctx,
            8,
            9,
            1,
            2,
            "#342820"
        );

    }

    if (
        direction === "right"
    ) {

        spritePixel(
            ctx,
            15,
            9,
            1,
            2,
            "#342820"
        );

    }

    // ---------------------------------------------
    // CAPUZ OU DETALHE POSTERIOR
    // ---------------------------------------------

    if (
        direction === "up"
    ) {

        spritePixel(

            ctx,

            7,

            5,

            10,

            8,

            palette.hair

        );

    }

}


// =====================================================
// EQUIPAMENTOS VISUAIS
// =====================================================

function drawSpriteEquipment(
    ctx,
    direction,
    state,
    equipment
) {

    if (!equipment) {

        return;

    }

    const attacking =
        state === "attack";

    const blocking =
        state === "block";

    // ---------------------------------------------
    // ARMA
    // ---------------------------------------------

    if (equipment.weapon) {

        const sword =
            equipment.weapon;

        const bladeColor =
            sword.color || "#dbe4e7";

        if (
            direction === "right"
        ) {

            spritePixel(

                ctx,

                attacking ? 21 : 19,

                attacking ? 8 : 15,

                3,

                attacking ? 14 : 9,

                bladeColor

            );

        }

        if (
            direction === "left"
        ) {

            spritePixel(

                ctx,

                attacking ? 0 : 3,

                attacking ? 8 : 15,

                3,

                attacking ? 14 : 9,

                bladeColor

            );

        }

        if (
            direction === "down"
        ) {

            spritePixel(

                ctx,

                19,

                attacking ? 17 : 12,

                3,

                attacking ? 15 : 9,

                bladeColor

            );

        }

        if (
            direction === "up"
        ) {

            spritePixel(

                ctx,

                19,

                attacking ? 0 : 8,

                3,

                attacking ? 14 : 9,

                bladeColor

            );

        }

    }

    // ---------------------------------------------
    // ESCUDO
    // ---------------------------------------------

    if (equipment.shield) {

        const shieldColor =
            equipment.shield.color ||
            "#6c899b";

        const shieldX =
            blocking ? 7 : 2;

        const shieldY =
            blocking ? 13 : 16;

        spritePixel(

            ctx,

            shieldX,

            shieldY,

            7,

            10,

            "#273d4a"

        );

        spritePixel(

            ctx,

            shieldX + 1,

            shieldY + 1,

            5,

            7,

            shieldColor

        );

        spritePixel(

            ctx,

            shieldX + 3,

            shieldY + 2,

            1,

            4,

            "#d8bd70"

        );

    }

}


// =====================================================
// CRIAR SPRITESHEET PROCEDURAL
// =====================================================

export function createCharacterSpriteSheet(
    paletteName = "warrior",
    options = {}
) {

    const palette =

        options.palette ||

        CHARACTER_PALETTES[paletteName] ||

        CHARACTER_PALETTES.warrior;

    const states = options.states || [

        "idle",

        "walk",

        "run",

        "attack",

        "block",

        "cast"

    ];

    const directions = [

        "down",

        "left",

        "right",

        "up"

    ];

    const frameWidth =
        SPRITES_CONFIG.WIDTH;

    const frameHeight =
        SPRITES_CONFIG.HEIGHT;

    const canvas =
        document.createElement("canvas");

    canvas.width =
        frameWidth *
        SPRITES_CONFIG.FRAMES;

    canvas.height =
        frameHeight *
        directions.length *
        states.length;

    const ctx =
        canvas.getContext("2d");

    ctx.imageSmoothingEnabled =
        false;

    const animations = {};

    let row = 0;

    for (const state of states) {

        for (const direction of directions) {

            animations[
                `${state}_${direction}`
            ] = {

                row,

                frames:
                    SPRITES_CONFIG.FRAMES,

                speed:

                    state === "run"
                        ? SPRITES_CONFIG.RUN_SPEED
                        : state === "walk"
                            ? SPRITES_CONFIG.WALK_SPEED
                            : SPRITES_CONFIG.IDLE_SPEED

            };

            for (
                let frame = 0;
                frame < SPRITES_CONFIG.FRAMES;
                frame++
            ) {

                ctx.save();

                ctx.translate(

                    frame * frameWidth,

                    row * frameHeight

                );

                drawCharacterBody(

                    ctx,

                    palette,

                    direction,

                    frame,

                    state

                );

                ctx.restore();

            }

            row++;

        }

    }

    return {

        canvas,

        frameWidth,

        frameHeight,

        animations

    };

}


// =====================================================
// GERENCIADOR DE SPRITES
// =====================================================

export class SpriteSystem {

    constructor() {

        this.sheets =
            new Map();

        this.externalSheets =
            new Map();

        this.animationTimes =
            new Map();

        this.initializeDefaults();

    }


    // =================================================
    // CRIAR SPRITES INICIAIS
    // =================================================

    initializeDefaults() {

        for (
            const paletteName of
            Object.keys(CHARACTER_PALETTES)
        ) {

            this.sheets.set(

                paletteName,

                createCharacterSpriteSheet(
                    paletteName
                )

            );

        }

    }


    // =================================================
    // REGISTRAR SPRITESHEET EXTERNO
    // =================================================

    async loadExternalSheet(
        id,
        imagePath,
        config
    ) {

        const image =
            new Image();

        await new Promise(
            (resolve, reject) => {

                image.onload = resolve;

                image.onerror = reject;

                image.src = imagePath;

            }
        );

        this.externalSheets.set(

            id,

            {

                canvas: image,

                frameWidth:
                    config.frameWidth,

                frameHeight:
                    config.frameHeight,

                animations:
                    config.animations

            }

        );

        return true;

    }


    // =================================================
    // OBTER SPRITESHEET
    // =================================================

    getSheet(id) {

        return (

            this.externalSheets.get(id) ||

            this.sheets.get(id) ||

            this.sheets.get("warrior")

        );

    }


    // =================================================
    // ATUALIZAR ANIMAÇÃO
    // =================================================

    update(
        entityId,
        deltaTime,
        speed = 1
    ) {

        const current =
            this.animationTimes.get(
                entityId
            ) || 0;

        this.animationTimes.set(

            entityId,

            current +
            deltaTime * speed

        );

    }


    // =================================================
    // DEFINIR TEMPO DE ANIMAÇÃO
    // =================================================

    setAnimationTime(
        entityId,
        time
    ) {

        this.animationTimes.set(

            entityId,

            Math.max(0, time)

        );

    }


    // =================================================
    // DESENHAR SPRITE
    // =================================================

    draw(
        ctx,
        entity,
        options = {}
    ) {

        if (
            !ctx ||
            !entity
        ) {

            return false;

        }

        const sheetId =

            options.sheetId ||

            entity.spriteId ||

            entity.characterClass ||

            entity.type?.toLowerCase() ||

            "warrior";

        const sheet =
            this.getSheet(sheetId);

        const direction =
            entity.direction || "down";

        let state =
            options.state || "idle";

        if (
            entity.attacking
        ) {

            state = "attack";

        } else if (
            entity.blocking
        ) {

            state = "block";

        } else if (
            entity.running
        ) {

            state = "run";

        } else if (
            entity.moving
        ) {

            state = "walk";

        }

        const animation =

            sheet.animations[
                `${state}_${direction}`
            ] ||

            sheet.animations[
                `idle_${direction}`
            ];

        if (!animation) {

            return false;

        }

        const time =

            this.animationTimes.get(
                entity.id || "player"
            ) ||

            entity.animationTime ||

            0;

        const frame =

            Math.floor(

                time * animation.speed

            ) % animation.frames;

        const x =

            options.x ??
            entity.x;

        const y =

            options.y ??
            entity.y;

        const scale =
            options.scale || 1;

        const width =
            sheet.frameWidth * scale;

        const height =
            sheet.frameHeight * scale;

        ctx.save();

        ctx.imageSmoothingEnabled =
            false;

        if (
            options.alpha !== undefined
        ) {

            ctx.globalAlpha *=
                spriteClamp(
                    options.alpha,
                    0,
                    1
                );

        }

        // -----------------------------------------
        // DESENHAR QUADRO
        // -----------------------------------------

        ctx.drawImage(

            sheet.canvas,

            frame *
                sheet.frameWidth,

            animation.row *
                sheet.frameHeight,

            sheet.frameWidth,

            sheet.frameHeight,

            Math.round(x),

            Math.round(y),

            Math.round(width),

            Math.round(height)

        );

        // -----------------------------------------
        // EQUIPAMENTOS
        // -----------------------------------------

        if (options.equipment) {

            ctx.save();

            ctx.translate(

                Math.round(x),

                Math.round(y)

            );

            ctx.scale(
                scale,
                scale
            );

            drawSpriteEquipment(

                ctx,

                direction,

                state,

                options.equipment

            );

            ctx.restore();

        }

        // -----------------------------------------
        // EFEITO DE DANO
        // -----------------------------------------

        if (
            entity.hitFlash > 0 ||
            entity.damageFlash > 0
        ) {

            ctx.fillStyle =
                "rgba(255,255,255,0.35)";

            ctx.fillRect(

                Math.round(x + 3),

                Math.round(y + 3),

                Math.round(width - 6),

                Math.round(height - 6)

            );

        }

        ctx.restore();

        return true;

    }


    // =================================================
    // DESENHAR JOGADOR
    // =================================================

    drawPlayer(
        ctx,
        player,
        character
    ) {

        const classId =

            character?.characterClass?.id ||

            player.character?.characterClass?.id ||

            "warrior";

        const slots =

            character?.equipment?.slots ||

            {};

        const weapon =
            slots.main_hand;

        const shield =
            slots.off_hand;

        return this.draw(

            ctx,

            player,

            {

                sheetId: classId,

                x: player.x - 4,

                y: player.y - 7,

                equipment: {

                    weapon:
                        weapon
                            ? {
                                color:
                                    weapon.spriteColor ||
                                    "#dbe4e7"
                            }
                            : null,

                    shield:
                        shield
                            ? {
                                color:
                                    shield.spriteColor ||
                                    "#6c899b"
                            }
                            : null

                }

            }

        );

    }


    // =================================================
    // DESENHAR NPC
    // =================================================

    drawNPC(ctx, npc) {

        return this.draw(

            ctx,

            npc,

            {

                sheetId:

                    npc.type === "SHOPKEEPER"
                        ? "paladin"
                        : npc.spriteId ||
                          "ranger",

                x: npc.x - 4,

                y: npc.y - 7

            }

        );

    }


    // =================================================
    // DESENHAR INIMIGO
    // =================================================

    drawEnemy(ctx, enemy) {

        return this.draw(

            ctx,

            enemy,

            {

                sheetId: "enemy",

                x: enemy.x - 3,

                y: enemy.y - 5

            }

        );

    }


    // =================================================
    // DESENHAR CHEFE
    // =================================================

    drawBoss(ctx, boss) {

        const scale =

            Math.max(

                1,

                Math.min(

                    boss.width / 24,

                    boss.height / 32

                )

            );

        return this.draw(

            ctx,

            boss,

            {

                sheetId: "boss",

                x: boss.x,

                y: boss.y,

                scale

            }

        );

    }

}


// =====================================================
// INSTÂNCIA COMPARTILHADA
// =====================================================

export const sprites =
    new SpriteSystem();


// =====================================================
// FIM DO SPRITES.JS
// =====================================================
