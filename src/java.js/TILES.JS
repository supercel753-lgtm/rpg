
"use strict";

/*
========================================================
ZELDA PIXEL ADVENTURE
TILE ENGINE — BETA 3

ARQUIVO: tiles.js

SISTEMAS:

- Texturas de terreno
- Tiles procedurais
- Biomas
- Grama
- Terra
- Areia
- Neve
- Pedra
- Ruínas
- Flores
- Pequenas rochas
- Variações visuais
- Cache de texturas
- Renderização otimizada

========================================================
*/


// =====================================================
// CONFIGURAÇÕES
// =====================================================

export const TILE_CONFIG = Object.freeze({

    SIZE: 16,

    VARIATIONS: 8,

    SEED: 12345,

    MAX_CACHE: 128,

    DETAIL_DENSITY: 0.40

});


// =====================================================
// TIPOS DE TERRENO
// =====================================================

export const TILE_TYPES = Object.freeze({

    GRASS: "grass",

    FOREST: "forest",

    DIRT: "dirt",

    SAND: "sand",

    SNOW: "snow",

    STONE: "stone",

    RUINS: "ruins",

    WATER_EDGE: "water_edge"

});


// =====================================================
// PALETAS
// =====================================================

export const TILE_PALETTES = Object.freeze({

    grass: {

        base: "#6ea653",

        light: "#88c268",

        dark: "#4f8846",

        detail: "#3c723b",

        accent: "#eddf94"

    },

    forest: {

        base: "#477d43",

        light: "#619b50",

        dark: "#2e6137",

        detail: "#254e30",

        accent: "#b8bb77"

    },

    dirt: {

        base: "#a18059",

        light: "#bd9a6e",

        dark: "#856742",

        detail: "#694f36",

        accent: "#d5b58b"

    },

    sand: {

        base: "#d9ba75",

        light: "#efd18b",

        dark: "#b99b5e",

        detail: "#a98a50",

        accent: "#f4dfa8"

    },

    snow: {

        base: "#e1eaea",

        light: "#ffffff",

        dark: "#bed0d8",

        detail: "#a5bac8",

        accent: "#f7ffff"

    },

    stone: {

        base: "#858d8e",

        light: "#aeb8b8",

        dark: "#646d70",

        detail: "#4f585b",

        accent: "#c9cecb"

    },

    ruins: {

        base: "#a29a80",

        light: "#bdb59a",

        dark: "#817965",

        detail: "#675f50",

        accent: "#d4c9a9"

    },

    water_edge: {

        base: "#5098ae",

        light: "#7cc4c7",

        dark: "#377b9b",

        detail: "#255e87",

        accent: "#b0e0db"

    }

});


// =====================================================
// HASH DETERMINÍSTICO
// =====================================================

function tileHash(x, y, seed = 12345) {

    let value = seed | 0;

    value ^= Math.imul(

        x | 0,

        374761393

    );

    value ^= Math.imul(

        y | 0,

        668265263

    );

    value = Math.imul(

        value ^ (value >>> 13),

        1274126177

    );

    return (

        value ^ (value >>> 16)

    ) >>> 0;

}


// =====================================================
// GERADOR DE NÚMEROS
// =====================================================

function tileRandom(seed) {

    let state = seed >>> 0;

    return function () {

        state =

            (
                Math.imul(
                    state,
                    1664525
                ) +

                1013904223

            ) >>> 0;

        return state / 4294967296;

    };

}


// =====================================================
// DESENHAR PIXEL
// =====================================================

function tilePixel(
    ctx,
    x,
    y,
    width,
    height,
    color
) {

    ctx.fillStyle = color;

    ctx.fillRect(

        Math.round(x),

        Math.round(y),

        Math.max(1, Math.round(width)),

        Math.max(1, Math.round(height))

    );

}


// =====================================================
// CRIAR TILE DE GRAMA
// =====================================================

function drawGrassTile(
    ctx,
    palette,
    random
) {

    for (let i = 0; i < 8; i++) {

        const x =
            Math.floor(random() * 15);

        const y =
            Math.floor(random() * 13);

        const color =

            random() > 0.5
                ? palette.light
                : palette.dark;

        tilePixel(

            ctx,

            x,

            y,

            2,

            3,

            color

        );

        tilePixel(

            ctx,

            x + 1,

            y - 1,

            1,

            2,

            palette.detail

        );

    }

}


// =====================================================
// CRIAR TILE DE FLORES
// =====================================================

function drawFlowerTile(
    ctx,
    palette,
    random
) {

    const x =
        3 + Math.floor(random() * 10);

    const y =
        3 + Math.floor(random() * 9);

    tilePixel(

        ctx,

        x,

        y,

        1,

        4,

        palette.detail

    );

    tilePixel(

        ctx,

        x - 1,

        y,

        3,

        2,

        palette.accent

    );

    tilePixel(

        ctx,

        x,

        y,

        1,

        1,

        "#e6a357"

    );

}


// =====================================================
// CRIAR TILE DE TERRA
// =====================================================

function drawDirtTile(
    ctx,
    palette,
    random
) {

    for (let i = 0; i < 10; i++) {

        const x =
            Math.floor(random() * 15);

        const y =
            Math.floor(random() * 15);

        tilePixel(

            ctx,

            x,

            y,

            random() > 0.7 ? 3 : 1,

            1,

            random() > 0.5
                ? palette.dark
                : palette.light

        );

    }

}


// =====================================================
// CRIAR TILE DE AREIA
// =====================================================

function drawSandTile(
    ctx,
    palette,
    random
) {

    for (let i = 0; i < 5; i++) {

        const x =
            Math.floor(random() * 12);

        const y =
            Math.floor(random() * 14);

        tilePixel(

            ctx,

            x,

            y,

            4,

            1,

            palette.dark

        );

        tilePixel(

            ctx,

            x + 1,

            y + 2,

            2,

            1,

            palette.light

        );

    }

}


// =====================================================
// CRIAR TILE DE NEVE
// =====================================================

function drawSnowTile(
    ctx,
    palette,
    random
) {

    for (let i = 0; i < 5; i++) {

        const x =
            Math.floor(random() * 14);

        const y =
            Math.floor(random() * 14);

        tilePixel(

            ctx,

            x,

            y,

            2,

            1,

            palette.dark

        );

        tilePixel(

            ctx,

            x + 1,

            y + 1,

            2,

            1,

            palette.light

        );

    }

}


// =====================================================
// CRIAR TILE DE PEDRA
// =====================================================

function drawStoneTile(
    ctx,
    palette,
    random
) {

    for (let i = 0; i < 4; i++) {

        const x =
            Math.floor(random() * 12);

        const y =
            Math.floor(random() * 12);

        tilePixel(

            ctx,

            x,

            y,

            4,

            3,

            palette.dark

        );

        tilePixel(

            ctx,

            x,

            y,

            3,

            1,

            palette.light

        );

    }

}


// =====================================================
// CRIAR TILE DE RUÍNAS
// =====================================================

function drawRuinsTile(
    ctx,
    palette,
    random
) {

    const offset =
        Math.floor(random() * 5);

    tilePixel(

        ctx,

        0,

        7,

        16,

        1,

        palette.dark

    );

    tilePixel(

        ctx,

        6 + offset,

        0,

        1,

        7,

        palette.dark

    );

    tilePixel(

        ctx,

        2,

        8,

        1,

        8,

        palette.dark

    );

    tilePixel(

        ctx,

        10,

        9,

        5,

        1,

        palette.light

    );

}


// =====================================================
// CLASSE PRINCIPAL
// =====================================================

export class TileRenderer {

    constructor(options = {}) {

        this.tileSize =
            options.tileSize ||
            TILE_CONFIG.SIZE;

        this.seed =
            options.seed ??
            TILE_CONFIG.SEED;

        this.cache =
            new Map();

        this.cacheLimit =
            TILE_CONFIG.MAX_CACHE;

        this.frame = 0;

        this.drawCalls = 0;

    }


    // =================================================
    // OBTER TIPO POR BIOMA
    // =================================================

    getTileType(region) {

        switch (region) {

            case "Floresta":

                return TILE_TYPES.FOREST;

            case "Montanhas":

                return TILE_TYPES.STONE;

            case "Deserto":

                return TILE_TYPES.SAND;

            case "Neve":

                return TILE_TYPES.SNOW;

            case "Ruínas":

                return TILE_TYPES.RUINS;

            case "Lago":

                return TILE_TYPES.GRASS;

            default:

                return TILE_TYPES.GRASS;

        }

    }


    // =================================================
    // GERAR TILE
    // =================================================

    generateTile(
        type,
        variation = 0
    ) {

        const palette =

            TILE_PALETTES[type] ||

            TILE_PALETTES.grass;

        const canvas =
            document.createElement("canvas");

        canvas.width =
            this.tileSize;

        canvas.height =
            this.tileSize;

        const ctx =
            canvas.getContext("2d");

        ctx.imageSmoothingEnabled =
            false;

        const random =
            tileRandom(

                tileHash(

                    variation,

                    type.length,

                    this.seed

                )

            );

        // -----------------------------------------
        // COR BASE
        // -----------------------------------------

        ctx.fillStyle =
            palette.base;

        ctx.fillRect(

            0,

            0,

            this.tileSize,

            this.tileSize

        );

        // -----------------------------------------
        // VARIAÇÃO DO SOLO
        // -----------------------------------------

        for (let i = 0; i < 12; i++) {

            const x =
                Math.floor(
                    random() * this.tileSize
                );

            const y =
                Math.floor(
                    random() * this.tileSize
                );

            tilePixel(

                ctx,

                x,

                y,

                1,

                1,

                random() > 0.5
                    ? palette.light
                    : palette.dark

            );

        }

        // -----------------------------------------
        // DETALHES DO BIOMA
        // -----------------------------------------

        switch (type) {

            case TILE_TYPES.GRASS:

            case TILE_TYPES.FOREST:

                drawGrassTile(
                    ctx,
                    palette,
                    random
                );

                if (random() > 0.78) {

                    drawFlowerTile(
                        ctx,
                        palette,
                        random
                    );

                }

                break;

            case TILE_TYPES.DIRT:

                drawDirtTile(
                    ctx,
                    palette,
                    random
                );

                break;

            case TILE_TYPES.SAND:

                drawSandTile(
                    ctx,
                    palette,
                    random
                );

                break;

            case TILE_TYPES.SNOW:

                drawSnowTile(
                    ctx,
                    palette,
                    random
                );

                break;

            case TILE_TYPES.STONE:

                drawStoneTile(
                    ctx,
                    palette,
                    random
                );

                break;

            case TILE_TYPES.RUINS:

                drawRuinsTile(
                    ctx,
                    palette,
                    random
                );

                break;

            default:

                drawDirtTile(
                    ctx,
                    palette,
                    random
                );

                break;

        }

        return canvas;

    }


    // =================================================
    // OBTER TILE DO CACHE
    // =================================================

    getTile(
        type,
        variation = 0
    ) {

        const key =
            `${type}:${variation}`;

        if (
            this.cache.has(key)
        ) {

            return this.cache.get(key);

        }

        const tile =
            this.generateTile(

                type,

                variation

            );

        if (
            this.cache.size >=
            this.cacheLimit
        ) {

            const oldest =
                this.cache.keys().next().value;

            this.cache.delete(oldest);

        }

        this.cache.set(

            key,

            tile

        );

        return tile;

    }


    // =================================================
    // OBTER VARIAÇÃO DO TERRENO
    // =================================================

    getVariation(
        tileX,
        tileY
    ) {

        return tileHash(

            tileX,

            tileY,

            this.seed

        ) % TILE_CONFIG.VARIATIONS;

    }


    // =================================================
    // DESENHAR TILE
    // =================================================

    drawTile(
        ctx,
        type,
        x,
        y,
        variation = 0
    ) {

        const tile =
            this.getTile(

                type,

                variation

            );

        ctx.drawImage(

            tile,

            Math.round(x),

            Math.round(y),

            this.tileSize,

            this.tileSize

        );

        this.drawCalls++;

    }


    // =================================================
    // RENDERIZAR TERRENO DO MUNDO
    // =================================================

    drawWorld(
        ctx,
        world,
        cameraX,
        cameraY,
        screenWidth,
        screenHeight
    ) {

        if (
            !ctx ||
            !world
        ) {

            return;

        }

        const size =
            this.tileSize;

        const startX = Math.max(

            0,

            Math.floor(
                cameraX / size
            )

        );

        const startY = Math.max(

            0,

            Math.floor(
                cameraY / size
            )

        );

        const endX = Math.min(

            Math.ceil(
                world.width / size
            ),

            Math.ceil(
                (cameraX + screenWidth) / size
            ) + 1

        );

        const endY = Math.min(

            Math.ceil(
                world.height / size
            ),

            Math.ceil(
                (cameraY + screenHeight) / size
            ) + 1

        );

        this.drawCalls = 0;

        ctx.save();

        ctx.imageSmoothingEnabled =
            false;

        for (
            let ty = startY;
            ty < endY;
            ty++
        ) {

            for (
                let tx = startX;
                tx < endX;
                tx++
            ) {

                const x =
                    tx * size;

                const y =
                    ty * size;

                const region =
                    world.region(

                        x + size / 2,

                        y + size / 2

                    );

                const type =
                    this.getTileType(region);

                const variation =
                    this.getVariation(
                        tx,
                        ty
                    );

                this.drawTile(

                    ctx,

                    type,

                    x,

                    y,

                    variation

                );

            }

        }

        ctx.restore();

        this.frame++;

    }


    // =================================================
    // CONECTAR AO WORLD.JS
    // =================================================

    install(world) {

        if (
            !world ||
            typeof world.drawTerrain !==
                "function"
        ) {

            return false;

        }

        const tileRenderer =
            this;

        world.drawTerrain = function (
            ctx,
            screenWidth,
            screenHeight
        ) {

            tileRenderer.drawWorld(

                ctx,

                world,

                world.cameraX,

                world.cameraY,

                screenWidth,

                screenHeight

            );

        };

        return true;

    }


    // =================================================
    // ESTATÍSTICAS
    // =================================================

    getStatistics() {

        return {

            cachedTiles:
                this.cache.size,

            drawCalls:
                this.drawCalls,

            frame:
                this.frame

        };

    }

}


// =====================================================
// INSTÂNCIA COMPARTILHADA
// =====================================================

export const tiles =
    new TileRenderer();


// =====================================================
// FIM DO TILES.JS
// =====================================================
