
"use strict";

/*
=====================================================
ZELDA PIXEL ADVENTURE
ASSET LOADER — BETA 3

ARQUIVO: assets.js

Carrega:
- Personagens
- Inimigos
- Chefes
- Terrenos

Converte spritesheets para o formato esperado
pelo SpriteSystem.

=====================================================
*/


// ===================================================
// CONFIGURAÇÕES
// ===================================================

const CHARACTER_ASSETS = Object.freeze({

    warrior:
        "./assets/characters/warrior.png",

    mage:
        "./assets/characters/mage.png",

    rogue:
        "./assets/characters/rogue.png",

    ranger:
        "./assets/characters/ranger.png",

    paladin:
        "./assets/characters/paladin.png",

    druid:
        "./assets/characters/druid.png",

    enemy:
        "./assets/enemies/enemy.png",

    boss:
        "./assets/enemies/boss.png"

});


const TERRAIN_ASSET =
    "./assets/tilesets/terrain.png";


const STATES = Object.freeze([

    "idle",

    "walk",

    "run",

    "attack",

    "block",

    "cast"

]);


const DIRECTIONS = Object.freeze([

    "down",

    "left",

    "right",

    "up"

]);


const TERRAIN_TYPES = Object.freeze([

    "grass",

    "forest",

    "dirt",

    "sand",

    "snow",

    "stone",

    "ruins",

    "water_edge"

]);


// ===================================================
// CARREGAMENTO DE IMAGEM
// ===================================================

function loadImage(path) {

    return new Promise((resolve, reject) => {

        const image = new Image();

        image.onload = () => resolve(image);

        image.onerror = () => reject(
            new Error(
                "Erro ao carregar imagem: " + path
            )
        );

        image.src = path;

    });

}


// ===================================================
// CRIAR CANVAS
// ===================================================

function createCanvas(width, height) {

    const canvas =
        document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    return canvas;

}


// ===================================================
// CONVERTER FUNDO ROSA EM TRANSPARÊNCIA
// ===================================================

function removeMagenta(canvas) {

    const ctx =
        canvas.getContext("2d", {
            willReadFrequently: true
        });

    const image = ctx.getImageData(

        0,
        0,
        canvas.width,
        canvas.height

    );

    const data = image.data;

    for (let i = 0; i < data.length; i += 4) {

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Identifica a cor rosa do fundo.
        // A tolerância considera pequenas variações
        // de cor presentes nas imagens geradas.

        if (
            r > 175 &&
            b > 145 &&
            g < 125 &&
            r > g * 1.6 &&
            b > g * 1.4
        ) {

            data[i + 3] = 0;

        }

    }

    ctx.putImageData(image, 0, 0);

    return canvas;

}


// ===================================================
// REORGANIZAR SPRITESHEET
// ===================================================

function prepareCharacterSheet(image) {

    /*
    ARQUIVO ORIGINAL:

    3 blocos horizontais
    2 blocos verticais

    Cada bloco:
    4 quadros horizontais
    4 direções verticais

    RESULTADO:

    4 colunas
    24 linhas

    Ordem:
    idle
    walk
    run
    attack
    block
    cast

    Cada estado possui quatro direções.
    */

    const frameWidth = 48;
    const frameHeight = 64;

    const output = createCanvas(

        frameWidth * 4,

        frameHeight * 24

    );

    const ctx =
        output.getContext("2d");

    ctx.imageSmoothingEnabled = false;

    // Dimensões das células da imagem original.

    const sourceWidth =
        image.width / 12;

    const sourceHeight =
        image.height / 8;

    for (let state = 0; state < 6; state++) {

        const blockX = state % 3;

        const blockY =
            Math.floor(state / 3);

        for (let direction = 0; direction < 4; direction++) {

            const outputRow =
                state * 4 + direction;

            for (let frame = 0; frame < 4; frame++) {

                const sourceX =

                    blockX * 4 + frame;

                const sourceY =

                    blockY * 4 + direction;

                ctx.drawImage(

                    image,

                    sourceX * sourceWidth + 2,

                    sourceY * sourceHeight + 2,

                    sourceWidth - 4,

                    sourceHeight - 4,

                    frame * frameWidth,

                    outputRow * frameHeight,

                    frameWidth,

                    frameHeight

                );

            }

        }

    }

    removeMagenta(output);

    return {

        canvas: output,

        frameWidth,

        frameHeight

    };

}


// ===================================================
// REGISTRAR PERSONAGEM NO SPRITES.JS
// ===================================================

function registerCharacterSheet(
    spriteSystem,
    id,
    image
) {

    const prepared =
        prepareCharacterSheet(image);

    const animations = {};

    for (let state = 0; state < STATES.length; state++) {

        for (let direction = 0; direction < DIRECTIONS.length; direction++) {

            const stateName =
                STATES[state];

            const directionName =
                DIRECTIONS[direction];

            const row =
                state * 4 + direction;

            animations[
                `${stateName}_${directionName}`
            ] = {

                row,

                frames: 4,

                speed:

                    stateName === "run"
                        ? 11
                        : stateName === "walk"
                            ? 7
                            : stateName === "attack"
                                ? 12
                                : 4

            };

        }

    }

    spriteSystem.externalSheets.set(

        id,

        {

            canvas:
                prepared.canvas,

            frameWidth:
                prepared.frameWidth,

            frameHeight:
                prepared.frameHeight,

            animations

        }

    );

}


// ===================================================
// PREPARAR TILESET DE TERRENOS
// ===================================================

function registerTerrain(
    tileSystem,
    image
) {

    const sourceWidth =
        image.width / 8;

    const sourceHeight =
        image.height / 8;

    const size =
        tileSystem.tileSize;

    for (let row = 0; row < 8; row++) {

        const type =
            TERRAIN_TYPES[row];

        for (let column = 0; column < 8; column++) {

            const canvas =
                createCanvas(size, size);

            const ctx =
                canvas.getContext("2d");

            ctx.imageSmoothingEnabled = false;

            // Pequena margem para evitar
            // as linhas divisórias do atlas.

            ctx.drawImage(

                image,

                column * sourceWidth + 3,

                row * sourceHeight + 3,

                sourceWidth - 6,

                sourceHeight - 6,

                0,

                0,

                size,

                size

            );

            tileSystem.cache.set(

                `${type}:${column}`,

                canvas

            );

        }

    }

}


// ===================================================
// CARREGAR TODOS OS GRÁFICOS
// ===================================================

export async function loadGameArt(
    spriteSystem,
    tileSystem
) {

    if (!spriteSystem || !tileSystem) {

        throw new Error(
            "Sistemas gráficos não inicializados."
        );

    }

    const loaded = [];
    const failed = [];

    // -----------------------------------------------
    // PERSONAGENS E INIMIGOS
    // -----------------------------------------------

    for (const [id, path] of Object.entries(
        CHARACTER_ASSETS
    )) {

        try {

            const image =
                await loadImage(path);

            registerCharacterSheet(

                spriteSystem,

                id,

                image

            );

            loaded.push(id);

        } catch (error) {

            console.error(error);

            failed.push(id);

        }

    }

    // -----------------------------------------------
    // TERRENOS
    // -----------------------------------------------

    try {

        const terrain =
            await loadImage(TERRAIN_ASSET);

        registerTerrain(

            tileSystem,

            terrain

        );

        loaded.push("terrain");

    } catch (error) {

        console.error(error);

        failed.push("terrain");

    }

    console.log(

        "Gráficos carregados:",

        loaded

    );

    if (failed.length > 0) {

        console.warn(

            "Gráficos não carregados:",

            failed

        );

    }

    return {

        loaded,

        failed

    };

}
