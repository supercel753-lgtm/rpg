
"use strict";

/*
========================================================
ZELDA PIXEL ADVENTURE
WORLD ENGINE — BETA 3

BLOCO 1 — NÚCLEO DO MUNDO

Sistemas:
- Mundo de 5.000 x 5.000 unidades
- Geração procedural determinística
- Setores e indexação espacial
- Biomas
- Objetos sólidos
- Colisões
- Pontes
- Monumentos
- Baús
- Consulta de objetos
- Posicionamento inicial
- Movimento com colisão
- Linha de visão
- Navegação básica

Compatibilidade:
- main.js
- player.js
- renderer.js
- combat.js
- inventory.js
- save.js

========================================================
*/

// =====================================================
// CONFIGURAÇÕES GERAIS
// =====================================================

export const WIDTH = 5000;

export const HEIGHT = 5000;

export const TILE = 16;

export const WORLD_SEED = 12345;

export const SECTOR_COUNT = 16;

export const TOTAL_SECTORS =
    SECTOR_COUNT * SECTOR_COUNT;

export const SECTOR_WIDTH =
    WIDTH / SECTOR_COUNT;

export const SECTOR_HEIGHT =
    HEIGHT / SECTOR_COUNT;


// =====================================================
// TIPOS DE OBJETOS
// =====================================================

export const TYPES = Object.freeze({

    TREE: "TREE",

    ROCK: "ROCK",

    WALL: "WALL",

    WATER: "WATER",

    TEMPLE: "TEMPLE",

    TOWER: "TOWER",

    SHRINE: "SHRINE",

    BRIDGE: "BRIDGE",

    HOUSE: "HOUSE",

    CHEST: "CHEST"

});


// =====================================================
// REGIÕES
// =====================================================

export const REGIONS = Object.freeze({

    PLAINS: "Pradarias",

    FOREST: "Floresta",

    MOUNTAINS: "Montanhas",

    LAKE: "Lago",

    DESERT: "Deserto",

    SNOW: "Neve",

    RUINS: "Ruínas"

});


// =====================================================
// CONFIGURAÇÕES DOS BIOMAS
// =====================================================

export const BIOME_DATA = Object.freeze({

    [REGIONS.PLAINS]: {

        name: "Pradarias",

        color: "#73b05a",

        vegetation: 0.55,

        difficulty: 1,

        temperature: 22,

        humidity: 0.65

    },

    [REGIONS.FOREST]: {

        name: "Floresta",

        color: "#47834a",

        vegetation: 0.90,

        difficulty: 2,

        temperature: 19,

        humidity: 0.85

    },

    [REGIONS.MOUNTAINS]: {

        name: "Montanhas",

        color: "#898f8c",

        vegetation: 0.20,

        difficulty: 3,

        temperature: 10,

        humidity: 0.35

    },

    [REGIONS.LAKE]: {

        name: "Lago",

        color: "#8cba80",

        vegetation: 0.65,

        difficulty: 2,

        temperature: 20,

        humidity: 0.95

    },

    [REGIONS.DESERT]: {

        name: "Deserto",

        color: "#d9bd73",

        vegetation: 0.08,

        difficulty: 4,

        temperature: 38,

        humidity: 0.10

    },

    [REGIONS.SNOW]: {

        name: "Neve",

        color: "#dfebea",

        vegetation: 0.15,

        difficulty: 4,

        temperature: -8,

        humidity: 0.45

    },

    [REGIONS.RUINS]: {

        name: "Ruínas",

        color: "#a49e85",

        vegetation: 0.30,

        difficulty: 3,

        temperature: 18,

        humidity: 0.40

    }

});


// =====================================================
// FUNÇÕES MATEMÁTICAS
// =====================================================

function clamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}

function distance(x1, y1, x2, y2) {

    return Math.hypot(
        x2 - x1,
        y2 - y1
    );

}

function overlaps(a, b) {

    return (
        a.x < b.x + b.w &&

        a.x + a.w > b.x &&

        a.y < b.y + b.h &&

        a.y + a.h > b.y
    );

}

function pointInside(x, y, rect) {

    return (
        x >= rect.x &&

        y >= rect.y &&

        x < rect.x + rect.w &&

        y < rect.y + rect.h
    );

}

function isValidRectangle(rect) {

    return (
        rect !== null &&

        typeof rect === "object" &&

        Number.isFinite(rect.x) &&

        Number.isFinite(rect.y) &&

        Number.isFinite(rect.w) &&

        Number.isFinite(rect.h) &&

        rect.w > 0 &&

        rect.h > 0
    );

}


// =====================================================
// GERADOR DE NÚMEROS ALEATÓRIOS
// =====================================================

function rng(seed = WORLD_SEED) {

    let state = seed >>> 0;

    return function () {

        state = (
            Math.imul(
                state,
                1664525
            ) + 1013904223
        ) >>> 0;

        return state / 4294967296;

    };

}


// =====================================================
// HASH DETERMINÍSTICO
// =====================================================

function hash2D(x, y, seed = WORLD_SEED) {

    let h = seed >>> 0;

    h ^= Math.imul(
        x | 0,
        374761393
    );

    h ^= Math.imul(
        y | 0,
        668265263
    );

    h = Math.imul(
        h ^ (h >>> 13),
        1274126177
    );

    return (
        (h ^ (h >>> 16)) >>> 0
    );

}


// =====================================================
// CLASSE PRINCIPAL DO MUNDO
// =====================================================

export class World {

    // =================================================
    // CONSTRUTOR
    // =================================================

    constructor(options = {}) {

        this.width = WIDTH;

        this.height = HEIGHT;

        this.tileSize = TILE;

        this.seed = Number.isInteger(
            options.seed
        )
            ? options.seed
            : WORLD_SEED;

        this.rand = rng(this.seed);

        // ---------------------------------------------
        // OBJETOS
        // ---------------------------------------------

        this.objects = [];

        this.landmarks = [];

        // ---------------------------------------------
        // INDEXAÇÃO ESPACIAL
        // ---------------------------------------------

        this.cellSize = 128;

        this.byCell = new Map();

        // ---------------------------------------------
        // SETORES
        // ---------------------------------------------

        this.sectors = new Map();

        this.sectorSize = SECTOR_WIDTH;

        // ---------------------------------------------
        // CÂMERA
        // ---------------------------------------------

        this.cameraX = 0;

        this.cameraY = 0;

        // ---------------------------------------------
        // ESTADO DO MUNDO
        // ---------------------------------------------

        this.generated = false;

        this.tick = 0;

        this.time = 0;

        this.dayLength = 1200;

        // ---------------------------------------------
        // GERAÇÃO
        // ---------------------------------------------

        this.generate();

    }


    // =================================================
    // REINICIAR MUNDO
    // =================================================

    reset() {

        this.objects = [];

        this.landmarks = [];

        this.byCell.clear();

        this.sectors.clear();

        this.rand = rng(this.seed);

        this.generated = false;

        this.tick = 0;

        this.time = 0;

        this.generate();

    }


    // =================================================
    // REGIÃO DO MAPA
    // =================================================

    region(x, y) {

        if (y > 4000) {

            return REGIONS.SNOW;

        }

        if (
            x < 1200 &&
            y < 1500
        ) {

            return REGIONS.FOREST;

        }

        if (
            x > 3500 &&
            y < 1800
        ) {

            return REGIONS.MOUNTAINS;

        }

        if (
            x > 3000 &&
            y > 3000
        ) {

            return REGIONS.DESERT;

        }

        if (
            x > 1800 &&
            x < 3100 &&
            y > 1600 &&
            y < 2700
        ) {

            return REGIONS.LAKE;

        }

        if (
            x > 1000 &&
            x < 2200 &&
            y > 2500
        ) {

            return REGIONS.RUINS;

        }

        return REGIONS.PLAINS;

    }


    // =================================================
    // DADOS DO BIOMA
    // =================================================

    getBiomeData(x, y) {

        const name = this.region(x, y);

        return BIOME_DATA[name];

    }


    // =================================================
    // VERIFICAR LIMITES
    // =================================================

    isInsideWorld(x, y) {

        return (
            Number.isFinite(x) &&

            Number.isFinite(y) &&

            x >= 0 &&

            y >= 0 &&

            x < this.width &&

            y < this.height
        );

    }


    // =================================================
    // ÍNDICE DE UMA CÉLULA ESPACIAL
    // =================================================

    cellKey(cx, cy) {

        return `${cx},${cy}`;

    }


    // =================================================
    // IDENTIFICAR SETOR
    // =================================================

    getSectorCoordinates(x, y) {

        if (!this.isInsideWorld(x, y)) {

            return null;

        }

        return {

            x: clamp(
                Math.floor(x / SECTOR_WIDTH),
                0,
                SECTOR_COUNT - 1
            ),

            y: clamp(
                Math.floor(y / SECTOR_HEIGHT),
                0,
                SECTOR_COUNT - 1
            )

        };

    }


    // =================================================
    // OBTER SETOR
    // =================================================

    getSector(x, y) {

        const coordinates =
            this.getSectorCoordinates(x, y);

        if (!coordinates) {

            return null;

        }

        const key =
            `${coordinates.x},${coordinates.y}`;

        return this.sectors.get(key) || null;

    }


    // =================================================
    // CRIAR SETORES
    // =================================================

    generateSectors() {

        this.sectors.clear();

        for (
            let sy = 0;
            sy < SECTOR_COUNT;
            sy++
        ) {

            for (
                let sx = 0;
                sx < SECTOR_COUNT;
                sx++
            ) {

                const x = sx * SECTOR_WIDTH;

                const y = sy * SECTOR_HEIGHT;

                const sector = {

                    id: sy * SECTOR_COUNT + sx,

                    sx,

                    sy,

                    x,

                    y,

                    w: SECTOR_WIDTH,

                    h: SECTOR_HEIGHT,

                    region: this.region(
                        x + SECTOR_WIDTH / 2,
                        y + SECTOR_HEIGHT / 2
                    ),

                    discovered: false

                };

                this.sectors.set(
                    `${sx},${sy}`,
                    sector
                );

            }

        }

    }


    // =================================================
    // REGISTRAR OBJETO NO ÍNDICE ESPACIAL
    // =================================================

    indexObject(object) {

        const size = this.cellSize;

        const startX =
            Math.floor(object.x / size);

        const startY =
            Math.floor(object.y / size);

        const endX =
            Math.floor(
                (object.x + object.w - 1) / size
            );

        const endY =
            Math.floor(
                (object.y + object.h - 1) / size
            );

        for (
            let cy = startY;
            cy <= endY;
            cy++
        ) {

            for (
                let cx = startX;
                cx <= endX;
                cx++
            ) {

                const key = this.cellKey(
                    cx,
                    cy
                );

                if (!this.byCell.has(key)) {

                    this.byCell.set(
                        key,
                        []
                    );

                }

                this.byCell.get(key).push(
                    object
                );

            }

        }

    }


    // =================================================
    // ADICIONAR OBJETO
    // =================================================

    add(
        type,
        x,
        y,
        w,
        h,
        solid = true,
        extra = {}
    ) {

        const rectangle = {
            x,
            y,
            w,
            h
        };

        if (!isValidRectangle(rectangle)) {

            return null;

        }

        if (
            x < 0 ||
            y < 0 ||
            x + w > this.width ||
            y + h > this.height
        ) {

            return null;

        }

        if (!Object.values(TYPES).includes(type)) {

            return null;

        }

        const object = {

            ...extra,

            type,

            x,

            y,

            w,

            h,

            solid: Boolean(solid),

            id: this.objects.length

        };

        this.objects.push(object);

        this.indexObject(object);

        return object;

    }


    // =================================================
    // CONSULTAR OBJETOS EM UMA ÁREA
    // =================================================

    query(rect) {

        if (!isValidRectangle(rect)) {

            return [];

        }

        const result = [];

        const seen = new Set();

        const size = this.cellSize;

        const startX = clamp(
            Math.floor(rect.x / size),
            0,
            Math.ceil(this.width / size)
        );

        const startY = clamp(
            Math.floor(rect.y / size),
            0,
            Math.ceil(this.height / size)
        );

        const endX = clamp(
            Math.floor(
                (rect.x + rect.w) / size
            ),
            0,
            Math.ceil(this.width / size)
        );

        const endY = clamp(
            Math.floor(
                (rect.y + rect.h) / size
            ),
            0,
            Math.ceil(this.height / size)
        );

        for (
            let cy = startY;
            cy <= endY;
            cy++
        ) {

            for (
                let cx = startX;
                cx <= endX;
                cx++
            ) {

                const key = this.cellKey(
                    cx,
                    cy
                );

                const cell =
                    this.byCell.get(key);

                if (!cell) {

                    continue;

                }

                for (const object of cell) {

                    if (seen.has(object.id)) {

                        continue;

                    }

                    seen.add(object.id);

                    if (overlaps(rect, object)) {

                        result.push(object);

                    }

                }

            }

        }

        return result;

    }


    // =================================================
    // VERIFICAR SE UM RETÂNGULO ESTÁ SOBRE UMA PONTE
    // =================================================

    isFullyOnBridge(rect, objects = null) {

        if (!isValidRectangle(rect)) {

            return false;

        }

        const nearby = objects || this.query(rect);

        return nearby.some(object => {

            if (object.type !== TYPES.BRIDGE) {

                return false;

            }

            return (
                rect.x >= object.x &&

                rect.y >= object.y &&

                rect.x + rect.w <=
                    object.x + object.w &&

                rect.y + rect.h <=
                    object.y + object.h
            );

        });

    }


    // =================================================
    // VERIFICAR COLISÃO
    // =================================================

    canMove(rect) {

        if (!isValidRectangle(rect)) {

            return false;

        }

        if (
            rect.x < 0 ||
            rect.y < 0 ||
            rect.x + rect.w > this.width ||
            rect.y + rect.h > this.height
        ) {

            return false;

        }

        const nearby = this.query(rect);

        const onBridge =
            this.isFullyOnBridge(rect, nearby);

        for (const object of nearby) {

            if (!object.solid) {

                continue;

            }

            if (object.type === TYPES.BRIDGE) {

                continue;

            }

            if (
                object.type === TYPES.WATER &&
                onBridge
            ) {

                continue;

            }

            return false;

        }

        return true;

    }


    // =================================================
    // MOVIMENTO COM COLISÃO POR EIXO
    // =================================================

    moveRect(rect, dx, dy) {

        const result = {

            x: rect.x,

            y: rect.y,

            w: rect.w,

            h: rect.h

        };

        if (!isValidRectangle(result)) {

            return result;

        }

        if (
            !Number.isFinite(dx) ||
            !Number.isFinite(dy)
        ) {

            return result;

        }

        const steps = Math.max(
            1,
            Math.ceil(
                Math.max(
                    Math.abs(dx),
                    Math.abs(dy)
                ) / 8
            )
        );

        const stepX = dx / steps;

        const stepY = dy / steps;

        for (let i = 0; i < steps; i++) {

            const horizontal = {

                ...result,

                x: result.x + stepX

            };

            if (this.canMove(horizontal)) {

                result.x = horizontal.x;

            }

            const vertical = {

                ...result,

                y: result.y + stepY

            };

            if (this.canMove(vertical)) {

                result.y = vertical.y;

            }

        }

        return result;

    }


    // =================================================
    // CONSULTAR OBJETOS PRÓXIMOS
    // =================================================

    near(
        x,
        y,
        range = 45,
        types = null
    ) {

        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !Number.isFinite(range) ||
            range <= 0
        ) {

            return [];

        }

        const rect = {

            x: x - range,

            y: y - range,

            w: range * 2,

            h: range * 2

        };

        return this.query(rect).filter(object => {

            if (
                types &&
                !types.includes(object.type)
            ) {

                return false;

            }

            const nearestX = clamp(
                x,
                object.x,
                object.x + object.w
            );

            const nearestY = clamp(
                y,
                object.y,
                object.y + object.h
            );

            return distance(
                x,
                y,
                nearestX,
                nearestY
            ) < range;

        });

    }


    // =================================================
    // CONSULTAR OBJETOS VISÍVEIS
    // =================================================

    getVisibleObjects(
        cameraX,
        cameraY,
        screenWidth,
        screenHeight,
        margin = 32
    ) {

        return this.query({

            x: cameraX - margin,

            y: cameraY - margin,

            w: screenWidth + margin * 2,

            h: screenHeight + margin * 2

        });

    }


    // =================================================
    // VERIFICAR ÁGUA
    // =================================================

    isWater(rect) {

        if (!isValidRectangle(rect)) {

            return false;

        }

        return this.query(rect).some(
            object =>
                object.type === TYPES.WATER
        );

    }


    // =================================================
    // BUSCAR OBJETO POR ID
    // =================================================

    getObjectById(id) {

        if (!Number.isInteger(id)) {

            return null;

        }

        return this.objects[id] || null;

    }


    // =================================================
    // BUSCAR OBJETOS POR TIPO
    // =================================================

    getObjectsByType(type) {

        return this.objects.filter(
            object => object.type === type
        );

    }


    // =================================================
    // ENCONTRAR MONUMENTO MAIS PRÓXIMO
    // =================================================

    getNearestLandmark(x, y) {

        let nearest = null;

        let bestDistance = Infinity;

        for (const landmark of this.landmarks) {

            const cx =
                landmark.x + landmark.w / 2;

            const cy =
                landmark.y + landmark.h / 2;

            const currentDistance = distance(
                x,
                y,
                cx,
                cy
            );

            if (currentDistance < bestDistance) {

                bestDistance = currentDistance;

                nearest = landmark;

            }

        }

        return nearest;

    }


    // =================================================
    // GERAR LAGO
    // =================================================

    generateLake() {

        this.add(
            TYPES.WATER,
            2050,
            1800,
            900,
            700,
            true
        );

    }


    // =================================================
    // GERAR RIOS
    // =================================================

    generateRivers() {

        this.add(
            TYPES.WATER,
            0,
            3700,
            this.width,
            180,
            true
        );

        this.add(
            TYPES.WATER,
            3300,
            0,
            180,
            this.height,
            true
        );

    }


    // =================================================
    // GERAR PAREDES
    // =================================================

    generateWalls() {

        const walls = [

            [500, 500, 800, 40],

            [500, 900, 800, 40],

            [500, 500, 40, 440],

            [1260, 500, 40, 440]

        ];

        for (const wall of walls) {

            this.add(
                TYPES.WALL,
                wall[0],
                wall[1],
                wall[2],
                wall[3],
                true
            );

        }

    }


    // =================================================
    // GERAR MONUMENTOS
    // =================================================

    generateStructures() {

        const structures = [

            [
                TYPES.TEMPLE,
                1000,
                1500,
                240,
                180,
                "Templo Antigo"
            ],

            [
                TYPES.TOWER,
                3800,
                800,
                100,
                100,
                "Torre da Montanha"
            ],

            [
                TYPES.SHRINE,
                4200,
                3500,
                100,
                100,
                "Santuário do Deserto"
            ],

            [
                TYPES.HOUSE,
                700,
                3000,
                160,
                120,
                "Casa do Viajante"
            ]

        ];

        for (const structure of structures) {

            const [
                type,
                x,
                y,
                w,
                h,
                name
            ] = structure;

            const object = this.add(

                type,

                x,

                y,

                w,

                h,

                true,

                {

                    name,

                    discovered: false

                }

            );

            if (object) {

                this.landmarks.push(object);

            }

        }

    }


    // =================================================
    // GERAR PONTES
    // =================================================

    generateBridges() {

        this.add(
            TYPES.BRIDGE,
            2350,
            2050,
            300,
            80,
            false
        );

        this.add(
            TYPES.BRIDGE,
            3350,
            1900,
            80,
            300,
            false
        );

    }


    // =================================================
    // POSICIONAR OBJETOS ALEATÓRIOS
    // =================================================

    placeRandom(
        type,
        count,
        w,
        h,
        predicate = () => true
    ) {

        for (let i = 0; i < count; i++) {

            for (let attempt = 0; attempt < 24; attempt++) {

                const x = Math.floor(
                    this.rand() *
                    (this.width - w)
                );

                const y = Math.floor(
                    this.rand() *
                    (this.height - h)
                );

                const rect = {
                    x,
                    y,
                    w,
                    h
                };

                if (!predicate(x, y)) {

                    continue;

                }

                if (
                    this.query(rect).some(
                        object => object.solid
                    )
                ) {

                    continue;

                }

                this.add(
                    type,
                    x,
                    y,
                    w,
                    h,
                    true
                );

                break;

            }

        }

    }


    // =================================================
    // GERAR CONTEÚDO DOS SETORES
    // =================================================

    generateSectorObjects() {

        for (
            let sy = 0;
            sy < SECTOR_COUNT;
            sy++
        ) {

            for (
                let sx = 0;
                sx < SECTOR_COUNT;
                sx++
            ) {

                const minX =
                    sx * 312 + 10;

                const minY =
                    sy * 312 + 10;

                // -------------------------------------
                // ÁRVORES E PEDRAS
                // -------------------------------------

                for (let i = 0; i < 12; i++) {

                    const x =
                        minX +
                        Math.floor(
                            this.rand() * 270
                        );

                    const y =
                        minY +
                        Math.floor(
                            this.rand() * 270
                        );

                    const type =
                        this.rand() < 0.68
                            ? TYPES.TREE
                            : TYPES.ROCK;

                    const w =
                        type === TYPES.TREE
                            ? 26
                            : 20;

                    const h =
                        type === TYPES.TREE
                            ? 30
                            : 17;

                    const rect = {

                        x,

                        y,

                        w,

                        h

                    };

                    if (
                        this.query(rect).some(
                            object => object.solid
                        )
                    ) {

                        continue;

                    }

                    // Manter a área inicial livre.

                    if (
                        distance(
                            x,
                            y,
                            2500,
                            2500
                        ) < 150
                    ) {

                        continue;

                    }

                    this.add(
                        type,
                        x,
                        y,
                        w,
                        h,
                        true
                    );

                }

                // -------------------------------------
                // BAÚS
                // -------------------------------------

                if (this.rand() < 0.28) {

                    const x = minX + 140;

                    const y = minY + 140;

                    const rect = {

                        x,

                        y,

                        w: 20,

                        h: 16

                    };

                    if (
                        !this.query(rect).some(
                            object => object.solid
                        )
                    ) {

                        this.add(
                            TYPES.CHEST,
                            x,
                            y,
                            20,
                            16,
                            false,
                            {
                                opened: false
                            }
                        );

                    }

                }

            }

        }

    }


    // =================================================
    // GERAÇÃO COMPLETA DO MUNDO
    // =================================================

    generate() {

        if (this.generated) {

            return;

        }

        this.generateSectors();

        this.generateLake();

        this.generateRivers();

        this.generateWalls();

        this.generateStructures();

        this.generateBridges();

        this.generateSectorObjects();

        this.placeRandom(

            TYPES.TREE,

            150,

            26,

            30,

            (x, y) => {

                return distance(
                    x,
                    y,
                    2500,
                    2500
                ) > 150;

            }

        );

        this.placeRandom(

            TYPES.ROCK,

            100,

            20,

            17,

            (x, y) => {

                return distance(
                    x,
                    y,
                    2500,
                    2500
                ) > 150;

            }

        );

        this.generated = true;

    }


    // =================================================
    // ENCONTRAR POSIÇÃO INICIAL
    // =================================================

    findSpawn() {

        const centerX = 2500;

        const centerY = 2500;

        for (
            let radius = 0;
            radius < 1000;
            radius += 16
        ) {

            for (
                let i = 0;
                i < 32;
                i++
            ) {

                const angle =
                    i * Math.PI / 16;

                const x = Math.floor(

                    centerX +
                    Math.cos(angle) * radius

                );

                const y = Math.floor(

                    centerY +
                    Math.sin(angle) * radius

                );

                if (
                    this.canMove({

                        x,

                        y,

                        w: 12,

                        h: 10

                    })
                ) {

                    return {
                        x,
                        y
                    };

                }

            }

        }

        // Busca adicional caso o centro esteja
        // completamente bloqueado.

        for (
            let y = 32;
            y < this.height - 32;
            y += 32
        ) {

            for (
                let x = 32;
                x < this.width - 32;
                x += 32
            ) {

                if (
                    this.canMove({

                        x,

                        y,

                        w: 12,

                        h: 10

                    })
                ) {

                    return {
                        x,
                        y
                    };

                }

            }

        }

        throw new Error(
            "Não foi encontrada uma posição inicial livre."
        );

    }


    // =================================================
    // ATUALIZAR ESTADO DO MUNDO
    // =================================================

    update(dt = 1 / 60) {

        if (
            !Number.isFinite(dt) ||
            dt <= 0
        ) {

            return;

        }

        this.tick++;

        this.time += dt;

        if (this.time >= this.dayLength) {

            this.time %= this.dayLength;

        }

    }


    // =================================================
    // VERIFICAR SE UM SEGMENTO ATRAVESSA UM OBJETO
    // =================================================

    segmentIntersectsObject(
        x1,
        y1,
        x2,
        y2,
        object
    ) {

        const dx = x2 - x1;

        const dy = y2 - y1;

        let tMin = 0;

        let tMax = 1;

        const axes = [

            [
                x1,
                dx,
                object.x,
                object.x + object.w
            ],

            [
                y1,
                dy,
                object.y,
                object.y + object.h
            ]

        ];

        for (const axis of axes) {

            const [
                origin,
                direction,
                minimum,
                maximum
            ] = axis;

            if (Math.abs(direction) < 1e-9) {

                if (
                    origin < minimum ||
                    origin > maximum
                ) {

                    return false;

                }

                continue;

            }

            let t1 =
                (minimum - origin) / direction;

            let t2 =
                (maximum - origin) / direction;

            if (t1 > t2) {

                const temporary = t1;

                t1 = t2;

                t2 = temporary;

            }

            tMin = Math.max(
                tMin,
                t1
            );

            tMax = Math.min(
                tMax,
                t2
            );

            if (tMin > tMax) {

                return false;

            }

        }

        return true;

    }


    // =================================================
    // LINHA DE VISÃO
    // =================================================

    hasLineOfSight(
        x1,
        y1,
        x2,
        y2
    ) {

        if (
            !this.isInsideWorld(x1, y1) ||
            !this.isInsideWorld(x2, y2)
        ) {

            return false;

        }

        const rect = {

            x: Math.min(x1, x2),

            y: Math.min(y1, y2),

            w: Math.max(
                0.001,
                Math.abs(x2 - x1)
            ),

            h: Math.max(
                0.001,
                Math.abs(y2 - y1)
            )

        };

        const nearby = this.query(rect);

        for (const object of nearby) {

            if (!object.solid) {

                continue;

            }

            // Água não bloqueia a visão.

            if (
                object.type === TYPES.WATER
            ) {

                continue;

            }

            if (
                this.segmentIntersectsObject(
                    x1,
                    y1,
                    x2,
                    y2,
                    object
                )
            ) {

                return false;

            }

        }

        return true;

    }


    // =================================================
    // ENCONTRAR POSIÇÃO LIVRE PRÓXIMA
    // =================================================

    findNearestWalkable(
        x,
        y,
        w = 12,
        h = 10,
        maxRadius = 256
    ) {

        if (
            this.canMove({
                x,
                y,
                w,
                h
            })
        ) {

            return {
                x,
                y
            };

        }

        for (
            let radius = 8;
            radius <= maxRadius;
            radius += 8
        ) {

            for (
                let angle = 0;
                angle < 16;
                angle++
            ) {

                const radians =
                    angle * Math.PI / 8;

                const candidateX =
                    x + Math.cos(radians) * radius;

                const candidateY =
                    y + Math.sin(radians) * radius;

                if (
                    this.canMove({

                        x: candidateX,

                        y: candidateY,

                        w,

                        h

                    })
                ) {

                    return {

                        x: candidateX,

                        y: candidateY

                    };

                }

            }

        }

        return null;

    }


    // =================================================
    // OBTER OBJETOS INTERATIVOS
    // =================================================

    getInteractables(
        x,
        y,
        radius = 45
    ) {

        const types = [

            TYPES.CHEST,

            TYPES.HOUSE,

            TYPES.TEMPLE,

            TYPES.TOWER,

            TYPES.SHRINE

        ];

        return this.near(
            x,
            y,
            radius,
            types
        );

    }


    // =================================================
    // MARCAR SETOR COMO DESCOBERTO
    // =================================================

    discoverSector(x, y) {

        const sector =
            this.getSector(x, y);

        if (!sector) {

            return false;

        }

        if (sector.discovered) {

            return false;

        }

        sector.discovered = true;

        return true;

    }


    // =================================================
    // CONTAR SETORES DESCOBERTOS
    // =================================================

    getDiscoveredSectorCount() {

        let count = 0;

        for (
            const sector of this.sectors.values()
        ) {

            if (sector.discovered) {

                count++;

            }

        }

        return count;

    }


    // =================================================
    // ESTATÍSTICAS DO MUNDO
    // =================================================

    getStatistics() {

        const typeCount = {};

        for (const type of Object.values(TYPES)) {

            typeCount[type] = 0;

        }

        for (const object of this.objects) {

            typeCount[object.type]++;

        }

        return {

            width: this.width,

            height: this.height,

            totalSectors: TOTAL_SECTORS,

            discoveredSectors:
                this.getDiscoveredSectorCount(),

            totalObjects:
                this.objects.length,

            totalLandmarks:
                this.landmarks.length,

            discoveredLandmarks:
                this.landmarks.filter(
                    object => object.discovered
                ).length,

            objectsByType: typeCount,

            worldTime: this.time,

            worldSeed: this.seed

        };

    }

}


/*
========================================================
ZELDA PIXEL ADVENTURE
WORLD ENGINE — BETA 3

BLOCO 2 — RENDERIZAÇÃO DO MUNDO

Sistemas:
- Renderização 2D pixelada
- Paleta de cores por bioma
- Texturas procedurais
- Câmera com interpolação
- Água animada
- Árvores detalhadas
- Rochas e montanhas
- Construções
- Pontes
- Baús
- Ordenação visual por profundidade
- Desenho exclusivo da área visível
- Efeitos ambientais

========================================================
*/


// =====================================================
// PALETA DE CORES
// =====================================================

export const WORLD_PALETTE = Object.freeze({

    grass: {

        base: "#6eac59",

        light: "#88c76b",

        dark: "#4c8545",

        shadow: "#386d39",

        flower: "#f6e49c"

    },

    forest: {

        base: "#427b43",

        light: "#59994f",

        dark: "#285e34",

        shadow: "#1c482b",

        flower: "#e6ce85"

    },

    desert: {

        base: "#d9bd73",

        light: "#eed18a",

        dark: "#b99a59",

        shadow: "#947849"

    },

    snow: {

        base: "#e0ebeb",

        light: "#ffffff",

        dark: "#b9ced7",

        shadow: "#91aebf"

    },

    mountain: {

        base: "#8a9192",

        light: "#b2b8b7",

        dark: "#626d70",

        shadow: "#495359"

    },

    ruins: {

        base: "#a59e83",

        light: "#bcb69b",

        dark: "#807b67",

        shadow: "#625d51"

    },

    water: {

        deep: "#245c99",

        base: "#347cba",

        light: "#51a5cf",

        foam: "#a5ddef",

        shadow: "#1b497f"

    },

    tree: {

        trunk: "#765137",

        trunkLight: "#a16d45",

        trunkDark: "#493425",

        leaves: "#367c3e",

        leavesLight: "#5fac52",

        leavesDark: "#225c34",

        outline: "#19472c"

    },

    stone: {

        base: "#888b90",

        light: "#b9bdbe",

        dark: "#626971",

        shadow: "#414b55"

    },

    wood: {

        base: "#98613e",

        light: "#bd8655",

        dark: "#613c28",

        shadow: "#39291e"

    },

    architecture: {

        wall: "#b29c79",

        wallLight: "#d2bd96",

        wallDark: "#827153",

        roof: "#ae594b",

        roofLight: "#d1755a",

        roofDark: "#753b37",

        door: "#593d2c",

        window: "#75a8bf"

    }

});


// =====================================================
// UTILITÁRIOS VISUAIS
// =====================================================

function worldPixel(ctx, x, y, w, h, color) {

    if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(w) ||
        !Number.isFinite(h)
    ) {

        return;

    }

    if (w <= 0 || h <= 0) {

        return;

    }

    ctx.fillStyle = color;

    ctx.fillRect(

        Math.round(x),

        Math.round(y),

        Math.max(1, Math.round(w)),

        Math.max(1, Math.round(h))

    );

}


// =====================================================
// CONFIGURAR RENDERIZAÇÃO PIXELADA
// =====================================================

function configureWorldCanvas(ctx) {

    ctx.imageSmoothingEnabled = false;

}


// =====================================================
// OBTER PALETA DE UMA REGIÃO
// =====================================================

World.prototype.getRegionPalette = function (
    x,
    y
) {

    const region = this.region(x, y);

    switch (region) {

        case REGIONS.FOREST:

            return WORLD_PALETTE.forest;

        case REGIONS.MOUNTAINS:

            return WORLD_PALETTE.mountain;

        case REGIONS.DESERT:

            return WORLD_PALETTE.desert;

        case REGIONS.SNOW:

            return WORLD_PALETTE.snow;

        case REGIONS.RUINS:

            return WORLD_PALETTE.ruins;

        default:

            return WORLD_PALETTE.grass;

    }

};


// =====================================================
// GERAR VARIAÇÃO VISUAL DO TERRENO
// =====================================================

World.prototype.getTerrainVariation = function (
    tileX,
    tileY
) {

    const value = hash2D(

        tileX,

        tileY,

        this.seed

    );

    return value % 100;

};


// =====================================================
// OBTER COR DE UM TILE
// =====================================================

World.prototype.getTileColor = function (
    tileX,
    tileY
) {

    const worldX = tileX * this.tileSize;

    const worldY = tileY * this.tileSize;

    const palette = this.getRegionPalette(

        worldX,

        worldY

    );

    const variation = this.getTerrainVariation(

        tileX,

        tileY

    );

    if (variation < 15) {

        return palette.light;

    }

    if (variation < 35) {

        return palette.dark;

    }

    return palette.base;

};


// =====================================================
// DESENHAR DETALHES DO SOLO
// =====================================================

World.prototype.drawTerrainDetails = function (
    ctx,
    x,
    y,
    tileX,
    tileY
) {

    const variation = this.getTerrainVariation(

        tileX,

        tileY

    );

    const palette = this.getRegionPalette(

        x,

        y

    );

    const region = this.region(x, y);

    // ---------------------------------------------
    // GRAMA
    // ---------------------------------------------

    if (
        region === REGIONS.PLAINS ||
        region === REGIONS.FOREST ||
        region === REGIONS.LAKE
    ) {

        if (variation < 25) {

            worldPixel(

                ctx,

                x + 4,

                y + 7,

                1,

                3,

                palette.dark

            );

            worldPixel(

                ctx,

                x + 6,

                y + 6,

                1,

                4,

                palette.light

            );

            worldPixel(

                ctx,

                x + 8,

                y + 7,

                1,

                2,

                palette.dark

            );

        }

        // Flores decorativas.

        if (variation > 95) {

            worldPixel(

                ctx,

                x + 7,

                y + 6,

                2,

                2,

                "#f4e8b0"

            );

            worldPixel(

                ctx,

                x + 7,

                y + 8,

                1,

                2,

                "#3e793a"

            );

        }

    }

    // ---------------------------------------------
    // DESERTO
    // ---------------------------------------------

    if (region === REGIONS.DESERT) {

        if (variation < 35) {

            worldPixel(

                ctx,

                x + 3,

                y + 8,

                8,

                1,

                palette.dark

            );

            worldPixel(

                ctx,

                x + 7,

                y + 10,

                5,

                1,

                palette.light

            );

        }

    }

    // ---------------------------------------------
    // NEVE
    // ---------------------------------------------

    if (region === REGIONS.SNOW) {

        if (variation < 30) {

            worldPixel(

                ctx,

                x + 4,

                y + 7,

                2,

                1,

                palette.dark

            );

            worldPixel(

                ctx,

                x + 9,

                y + 4,

                1,

                2,

                palette.light

            );

        }

    }

    // ---------------------------------------------
    // MONTANHAS E RUÍNAS
    // ---------------------------------------------

    if (
        region === REGIONS.MOUNTAINS ||
        region === REGIONS.RUINS
    ) {

        if (variation < 40) {

            worldPixel(

                ctx,

                x + 3,

                y + 10,

                5,

                2,

                palette.dark

            );

            worldPixel(

                ctx,

                x + 5,

                y + 9,

                3,

                1,

                palette.light

            );

        }

    }

};


// =====================================================
// DESENHAR TERRENO VISÍVEL
// =====================================================

World.prototype.drawTerrain = function (
    ctx,
    screenWidth,
    screenHeight
) {

    configureWorldCanvas(ctx);

    const tileSize = this.tileSize;

    const startX = Math.max(

        0,

        Math.floor(
            this.cameraX / tileSize
        )

    );

    const startY = Math.max(

        0,

        Math.floor(
            this.cameraY / tileSize
        )

    );

    const endX = Math.min(

        Math.ceil(
            this.width / tileSize
        ),

        Math.ceil(
            (this.cameraX + screenWidth) / tileSize
        ) + 1

    );

    const endY = Math.min(

        Math.ceil(
            this.height / tileSize
        ),

        Math.ceil(
            (this.cameraY + screenHeight) / tileSize
        ) + 1

    );

    for (
        let tileY = startY;
        tileY < endY;
        tileY++
    ) {

        for (
            let tileX = startX;
            tileX < endX;
            tileX++
        ) {

            const x = tileX * tileSize;

            const y = tileY * tileSize;

            const color = this.getTileColor(

                tileX,

                tileY

            );

            worldPixel(

                ctx,

                x,

                y,

                tileSize,

                tileSize,

                color

            );

            this.drawTerrainDetails(

                ctx,

                x,

                y,

                tileX,

                tileY

            );

        }

    }

};


// =====================================================
// CÂMERA
// =====================================================

World.prototype.updateCamera = function (
    player,
    screenWidth,
    screenHeight,
    smoothing = 0.15
) {

    if (!player) {

        return;

    }

    const targetX = clamp(

        player.x + player.width / 2
            - screenWidth / 2,

        0,

        Math.max(
            0,
            this.width - screenWidth
        )

    );

    const targetY = clamp(

        player.y + player.height / 2
            - screenHeight / 2,

        0,

        Math.max(
            0,
            this.height - screenHeight
        )

    );

    const factor = clamp(

        smoothing,

        0,

        1

    );

    this.cameraX +=
        (targetX - this.cameraX) * factor;

    this.cameraY +=
        (targetY - this.cameraY) * factor;

};


// =====================================================
// CENTRALIZAR CÂMERA IMEDIATAMENTE
// =====================================================

World.prototype.snapCamera = function (
    x,
    y,
    screenWidth,
    screenHeight
) {

    this.cameraX = clamp(

        x - screenWidth / 2,

        0,

        Math.max(
            0,
            this.width - screenWidth
        )

    );

    this.cameraY = clamp(

        y - screenHeight / 2,

        0,

        Math.max(
            0,
            this.height - screenHeight
        )

    );

};


// =====================================================
// VERIFICAR VISIBILIDADE
// =====================================================

World.prototype.isVisible = function (
    object,
    screenWidth,
    screenHeight,
    margin = 32
) {

    return (

        object.x + object.w >=
            this.cameraX - margin &&

        object.x <=
            this.cameraX + screenWidth + margin &&

        object.y + object.h >=
            this.cameraY - margin &&

        object.y <=
            this.cameraY + screenHeight + margin

    );

};


// =====================================================
// DESENHAR SOMBRA DE UM OBJETO
// =====================================================

World.prototype.drawObjectShadow = function (
    ctx,
    object
) {

    ctx.fillStyle = "rgba(20,25,20,0.25)";

    ctx.beginPath();

    ctx.ellipse(

        Math.round(
            object.x + object.w / 2
        ),

        Math.round(
            object.y + object.h - 2
        ),

        Math.max(
            3,
            object.w * 0.45
        ),

        Math.max(
            2,
            object.h * 0.08
        ),

        0,

        0,

        Math.PI * 2

    );

    ctx.fill();

};


// =====================================================
// DESENHAR ÁRVORE
// =====================================================

World.prototype.drawTree = function (
    ctx,
    object
) {

    const x = Math.round(object.x);

    const y = Math.round(object.y);

    const w = object.w;

    const h = object.h;

    const colors = WORLD_PALETTE.tree;

    this.drawObjectShadow(ctx, object);

    // ---------------------------------------------
    // TRONCO
    // ---------------------------------------------

    worldPixel(

        ctx,

        x + w / 2 - 3,

        y + h / 2,

        6,

        h / 2,

        colors.trunkDark

    );

    worldPixel(

        ctx,

        x + w / 2 - 2,

        y + h / 2,

        4,

        h / 2 - 1,

        colors.trunk

    );

    worldPixel(

        ctx,

        x + w / 2 - 2,

        y + h / 2 + 2,

        1,

        h / 3,

        colors.trunkLight

    );

    // ---------------------------------------------
    // CONTORNO DA COPA
    // ---------------------------------------------

    worldPixel(

        ctx,

        x + 5,

        y + 5,

        w - 10,

        h / 2 + 7,

        colors.outline

    );

    worldPixel(

        ctx,

        x + 2,

        y + 12,

        w - 4,

        h / 2 - 4,

        colors.outline

    );

    // ---------------------------------------------
    // COPA
    // ---------------------------------------------

    worldPixel(

        ctx,

        x + 4,

        y + 13,

        w - 8,

        h / 2 - 5,

        colors.leavesDark

    );

    worldPixel(

        ctx,

        x + 6,

        y + 6,

        w - 12,

        h / 2 + 2,

        colors.leaves

    );

    worldPixel(

        ctx,

        x + 9,

        y + 3,

        w - 18,

        h / 3,

        colors.leavesLight

    );

    // ---------------------------------------------
    // ILUMINAÇÃO DAS FOLHAS
    // ---------------------------------------------

    worldPixel(

        ctx,

        x + 7,

        y + 11,

        5,

        2,

        colors.leavesLight

    );

    worldPixel(

        ctx,

        x + w - 13,

        y + 15,

        4,

        3,

        colors.leavesLight

    );

    worldPixel(

        ctx,

        x + w / 2,

        y + 7,

        4,

        2,

        "#83c56b"

    );

};


// =====================================================
// DESENHAR ROCHA
// =====================================================

World.prototype.drawRock = function (
    ctx,
    object
) {

    const x = Math.round(object.x);

    const y = Math.round(object.y);

    const w = object.w;

    const h = object.h;

    const colors = WORLD_PALETTE.stone;

    this.drawObjectShadow(ctx, object);

    worldPixel(

        ctx,

        x + 2,

        y + 3,

        w - 4,

        h - 3,

        colors.shadow

    );

    worldPixel(

        ctx,

        x + 3,

        y + 2,

        w - 6,

        h - 6,

        colors.dark

    );

    worldPixel(

        ctx,

        x + 5,

        y,

        w - 10,

        h - 8,

        colors.base

    );

    worldPixel(

        ctx,

        x + 6,

        y + 2,

        w / 3,

        3,

        colors.light

    );

    worldPixel(

        ctx,

        x + w / 2,

        y + h / 2,

        4,

        1,

        colors.shadow

    );

};


// =====================================================
// DESENHAR PAREDE
// =====================================================

World.prototype.drawWall = function (
    ctx,
    object
) {

    const x = object.x;

    const y = object.y;

    const w = object.w;

    const h = object.h;

    const colors = WORLD_PALETTE.stone;

    worldPixel(

        ctx,

        x,

        y,

        w,

        h,

        colors.dark

    );

    worldPixel(

        ctx,

        x,

        y,

        w,

        3,

        colors.light

    );

    const startX = Math.max(

        x,

        Math.floor(this.cameraX / 8) * 8

    );

    const startY = Math.max(

        y,

        Math.floor(this.cameraY / 8) * 8

    );

    const endX = Math.min(

        x + w,

        this.cameraX + ctx.canvas.width + 8

    );

    const endY = Math.min(

        y + h,

        this.cameraY + ctx.canvas.height + 8

    );

    for (
        let py = startY;
        py < endY;
        py += 8
    ) {

        for (
            let px = startX;
            px < endX;
            px += 16
        ) {

            worldPixel(

                ctx,

                px,

                py + 7,

                13,

                1,

                colors.shadow

            );

            worldPixel(

                ctx,

                px + 7,

                py,

                1,

                7,

                colors.shadow

            );

        }

    }

};


// =====================================================
// DESENHAR ÁGUA ANIMADA
// =====================================================

World.prototype.drawWater = function (
    ctx,
    object
) {

    const x = object.x;

    const y = object.y;

    const w = object.w;

    const h = object.h;

    const colors = WORLD_PALETTE.water;

    worldPixel(

        ctx,

        x,

        y,

        w,

        h,

        colors.deep

    );

    worldPixel(

        ctx,

        x + 2,

        y + 2,

        Math.max(1, w - 4),

        Math.max(1, h - 4),

        colors.base

    );

    const waveOffset = Math.floor(

        this.time * 6

    ) % 16;

    const startX = Math.max(

        x,

        Math.floor(
            this.cameraX / 16
        ) * 16

    );

    const startY = Math.max(

        y,

        Math.floor(
            this.cameraY / 12
        ) * 12

    );

    const endX = Math.min(

        x + w,

        this.cameraX + ctx.canvas.width + 16

    );

    const endY = Math.min(

        y + h,

        this.cameraY + ctx.canvas.height + 12

    );

    for (
        let py = startY;
        py < endY;
        py += 12
    ) {

        for (
            let px = startX;
            px < endX;
            px += 16
        ) {

            const offset = (

                Math.floor(py / 12) % 2

            ) * 8;

            const waveX = px + offset + waveOffset;

            worldPixel(

                ctx,

                waveX,

                py + 4,

                6,

                1,

                colors.light

            );

            worldPixel(

                ctx,

                waveX + 3,

                py + 7,

                4,

                1,

                colors.foam

            );

        }

    }

};


// =====================================================
// DESENHAR PONTE
// =====================================================

World.prototype.drawBridge = function (
    ctx,
    object
) {

    const x = object.x;

    const y = object.y;

    const w = object.w;

    const h = object.h;

    const colors = WORLD_PALETTE.wood;

    worldPixel(

        ctx,

        x,

        y,

        w,

        h,

        colors.dark

    );

    worldPixel(

        ctx,

        x + 3,

        y + 3,

        w - 6,

        h - 6,

        colors.base

    );

    // ---------------------------------------------
    // PONTE HORIZONTAL
    // ---------------------------------------------

    if (w >= h) {

        const startX = Math.max(

            x,

            Math.floor(
                this.cameraX / 10
            ) * 10

        );

        const endX = Math.min(

            x + w,

            this.cameraX + ctx.canvas.width + 10

        );

        for (
            let px = startX;
            px < endX;
            px += 10
        ) {

            worldPixel(

                ctx,

                px,

                y + 5,

                1,

                h - 10,

                colors.dark

            );

            worldPixel(

                ctx,

                px + 2,

                y + 7,

                5,

                1,

                colors.light

            );

        }

        worldPixel(

            ctx,

            x,

            y + 3,

            w,

            3,

            colors.shadow

        );

        worldPixel(

            ctx,

            x,

            y + h - 6,

            w,

            3,

            colors.shadow

        );

    }

    // ---------------------------------------------
    // PONTE VERTICAL
    // ---------------------------------------------

    else {

        const startY = Math.max(

            y,

            Math.floor(
                this.cameraY / 10
            ) * 10

        );

        const endY = Math.min(

            y + h,

            this.cameraY + ctx.canvas.height + 10

        );

        for (
            let py = startY;
            py < endY;
            py += 10
        ) {

            worldPixel(

                ctx,

                x + 5,

                py,

                w - 10,

                1,

                colors.dark

            );

            worldPixel(

                ctx,

                x + 7,

                py + 2,

                1,

                5,

                colors.light

            );

        }

        worldPixel(

            ctx,

            x + 3,

            y,

            3,

            h,

            colors.shadow

        );

        worldPixel(

            ctx,

            x + w - 6,

            y,

            3,

            h,

            colors.shadow

        );

    }

};


// =====================================================
// DESENHAR CONSTRUÇÃO
// =====================================================

World.prototype.drawHouse = function (
    ctx,
    object
) {

    const x = object.x;

    const y = object.y;

    const w = object.w;

    const h = object.h;

    const colors = WORLD_PALETTE.architecture;

    this.drawObjectShadow(ctx, object);

    // ---------------------------------------------
    // PAREDES
    // ---------------------------------------------

    worldPixel(

        ctx,

        x + 4,

        y + h / 3,

        w - 8,

        h * 2 / 3,

        colors.wallDark

    );

    worldPixel(

        ctx,

        x + 7,

        y + h / 3 + 3,

        w - 14,

        h * 2 / 3 - 6,

        colors.wall

    );

    worldPixel(

        ctx,

        x + 10,

        y + h / 3 + 5,

        w - 20,

        3,

        colors.wallLight

    );

    // ---------------------------------------------
    // TELHADO
    // ---------------------------------------------

    worldPixel(

        ctx,

        x,

        y + 15,

        w,

        h / 4,

        colors.roofDark

    );

    worldPixel(

        ctx,

        x + 5,

        y + 8,

        w - 10,

        14,

        colors.roof

    );

    worldPixel(

        ctx,

        x + 13,

        y + 2,

        w - 26,

        12,

        colors.roofLight

    );

    // ---------------------------------------------
    // PORTA
    // ---------------------------------------------

    worldPixel(

        ctx,

        x + w / 2 - 10,

        y + h - 30,

        20,

        30,

        colors.door

    );

    worldPixel(

        ctx,

        x + w / 2 + 5,

        y + h - 16,

        2,

        2,

        "#edc57a"

    );

    // ---------------------------------------------
    // JANELAS
    // ---------------------------------------------

    worldPixel(

        ctx,

        x + 15,

        y + h / 2,

        18,

        15,

        colors.door

    );

    worldPixel(

        ctx,

        x + 17,

        y + h / 2 + 2,

        14,

        11,

        colors.window

    );

    worldPixel(

        ctx,

        x + w - 33,

        y + h / 2,

        18,

        15,

        colors.door

    );

    worldPixel(

        ctx,

        x + w - 31,

        y + h / 2 + 2,

        14,

        11,

        colors.window

    );

};


// =====================================================
// DESENHAR TEMPLO
// =====================================================

World.prototype.drawTemple = function (
    ctx,
    object
) {

    const x = object.x;

    const y = object.y;

    const w = object.w;

    const h = object.h;

    const colors = WORLD_PALETTE.architecture;

    this.drawObjectShadow(ctx, object);

    worldPixel(

        ctx,

        x,

        y + 20,

        w,

        h - 20,

        colors.wallDark

    );

    worldPixel(

        ctx,

        x + 8,

        y + 30,

        w - 16,

        h - 38,

        colors.wall

    );

    worldPixel(

        ctx,

        x + 15,

        y + 14,

        w - 30,

        15,

        colors.wallLight

    );

    worldPixel(

        ctx,

        x + 25,

        y + 4,

        w - 50,

        12,

        colors.wall

    );

    for (
        let px = x + 25;
        px < x + w - 25;
        px += 30
    ) {

        worldPixel(

            ctx,

            px,

            y + 40,

            10,

            h - 55,

            colors.wallDark

        );

        worldPixel(

            ctx,

            px + 2,

            y + 42,

            6,

            h - 59,

            colors.wallLight

        );

    }

    worldPixel(

        ctx,

        x + w / 2 - 16,

        y + h - 42,

        32,

        42,

        colors.door

    );

};


// =====================================================
// DESENHAR TORRE
// =====================================================

World.prototype.drawTower = function (
    ctx,
    object
) {

    const x = object.x;

    const y = object.y;

    const w = object.w;

    const h = object.h;

    const colors = WORLD_PALETTE.stone;

    this.drawObjectShadow(ctx, object);

    worldPixel(

        ctx,

        x + 10,

        y + 18,

        w - 20,

        h - 18,

        colors.dark

    );

    worldPixel(

        ctx,

        x + 15,

        y + 20,

        w - 30,

        h - 25,

        colors.base

    );

    for (
        let px = x + 8;
        px < x + w - 8;
        px += 15
    ) {

        worldPixel(

            ctx,

            px,

            y + 7,

            10,

            15,

            colors.light

        );

    }

    worldPixel(

        ctx,

        x + w / 2 - 10,

        y + h - 27,

        20,

        27,

        colors.shadow

    );

    worldPixel(

        ctx,

        x + w / 2 - 6,

        y + 35,

        12,

        18,

        colors.shadow

    );

};


// =====================================================
// DESENHAR SANTUÁRIO
// =====================================================

World.prototype.drawShrine = function (
    ctx,
    object
) {

    const x = object.x;

    const y = object.y;

    const w = object.w;

    const h = object.h;

    this.drawObjectShadow(ctx, object);

    worldPixel(

        ctx,

        x + 8,

        y + 20,

        w - 16,

        h - 20,

        "#9e8d76"

    );

    worldPixel(

        ctx,

        x + 4,

        y + 12,

        w - 8,

        14,

        "#c2aa80"

    );

    worldPixel(

        ctx,

        x + 15,

        y + 4,

        w - 30,

        10,

        "#e0c99d"

    );

    worldPixel(

        ctx,

        x + w / 2 - 12,

        y + h - 34,

        24,

        34,

        "#534936"

    );

    worldPixel(

        ctx,

        x + w / 2 - 4,

        y + 32,

        8,

        8,

        "#75d0c5"

    );

};


// =====================================================
// DESENHAR BAÚ
// =====================================================

World.prototype.drawChest = function (
    ctx,
    object
) {

    const x = object.x;

    const y = object.y;

    const w = object.w;

    const h = object.h;

    const colors = WORLD_PALETTE.wood;

    this.drawObjectShadow(ctx, object);

    worldPixel(

        ctx,

        x,

        y + 5,

        w,

        h - 5,

        colors.shadow

    );

    worldPixel(

        ctx,

        x + 2,

        y + 7,

        w - 4,

        h - 9,

        colors.base

    );

    // ---------------------------------------------
    // TAMPA
    // ---------------------------------------------

    if (object.opened) {

        worldPixel(

            ctx,

            x,

            y,

            w,

            4,

            colors.dark

        );

        worldPixel(

            ctx,

            x + 3,

            y + 1,

            w - 6,

            2,

            colors.light

        );

    } else {

        worldPixel(

            ctx,

            x,

            y + 2,

            w,

            6,

            colors.dark

        );

        worldPixel(

            ctx,

            x + 2,

            y + 3,

            w - 4,

            3,

            colors.light

        );

    }

    // ---------------------------------------------
    // FECHADURA
    // ---------------------------------------------

    worldPixel(

        ctx,

        x + w / 2 - 2,

        y + 7,

        4,

        5,

        object.opened
            ? "#777777"
            : "#f0d06b"

    );

};


// =====================================================
// DESENHAR OBJETO POR TIPO
// =====================================================

World.prototype.drawObject = function (
    ctx,
    object
) {

    if (!object) {

        return;

    }

    switch (object.type) {

        case TYPES.TREE:

            this.drawTree(ctx, object);

            break;

        case TYPES.ROCK:

            this.drawRock(ctx, object);

            break;

        case TYPES.WALL:

            this.drawWall(ctx, object);

            break;

        case TYPES.WATER:

            this.drawWater(ctx, object);

            break;

        case TYPES.BRIDGE:

            this.drawBridge(ctx, object);

            break;

        case TYPES.HOUSE:

            this.drawHouse(ctx, object);

            break;

        case TYPES.TEMPLE:

            this.drawTemple(ctx, object);

            break;

        case TYPES.TOWER:

            this.drawTower(ctx, object);

            break;

        case TYPES.SHRINE:

            this.drawShrine(ctx, object);

            break;

        case TYPES.CHEST:

            this.drawChest(ctx, object);

            break;

        default:

            break;

    }

};


// =====================================================
// OBTER PROFUNDIDADE VISUAL
// =====================================================

World.prototype.getObjectDepth = function (
    object
) {

    if (object.type === TYPES.WATER) {

        return -1000000;

    }

    if (object.type === TYPES.BRIDGE) {

        return -999999;

    }

    return object.y + object.h;

};


// =====================================================
// OBTER OBJETOS ORDENADOS PARA RENDERIZAÇÃO
// =====================================================

World.prototype.getDrawableObjects = function (
    screenWidth,
    screenHeight
) {

    const visible = this.getVisibleObjects(

        this.cameraX,

        this.cameraY,

        screenWidth,

        screenHeight,

        48

    );

    return visible.sort(

        (a, b) => {

            return this.getObjectDepth(a)
                - this.getObjectDepth(b);

        }

    );

};


// =====================================================
// DESENHAR OBJETOS VISÍVEIS
// =====================================================

World.prototype.drawObjects = function (
    ctx,
    screenWidth,
    screenHeight
) {

    configureWorldCanvas(ctx);

    const visible = this.getDrawableObjects(

        screenWidth,

        screenHeight

    );

    for (const object of visible) {

        this.drawObject(

            ctx,

            object

        );

    }

};


// =====================================================
// DESENHAR MUNDO COMPLETO
// =====================================================

World.prototype.draw = function (
    ctx,
    screenWidth,
    screenHeight,
    player = null
) {

    if (!ctx) {

        return;

    }

    ctx.save();

    configureWorldCanvas(ctx);

    // ---------------------------------------------
    // LIMPAR A TELA
    // ---------------------------------------------

    ctx.clearRect(

        0,

        0,

        screenWidth,

        screenHeight

    );

    // ---------------------------------------------
    // APLICAR CÂMERA
    // ---------------------------------------------

    ctx.translate(

        -Math.round(this.cameraX),

        -Math.round(this.cameraY)

    );

    // ---------------------------------------------
    // DESENHAR TERRENO
    // ---------------------------------------------

    this.drawTerrain(

        ctx,

        screenWidth,

        screenHeight

    );

    // ---------------------------------------------
    // OBTER OBJETOS
    // ---------------------------------------------

    const visible = this.getDrawableObjects(

        screenWidth,

        screenHeight

    );

    // ---------------------------------------------
    // DESENHAR OBJETOS ATRÁS DO PERSONAGEM
    // ---------------------------------------------

    const playerDepth = player
        ? player.y + player.height
        : Infinity;

    for (const object of visible) {

        if (
            this.getObjectDepth(object)
            <= playerDepth
        ) {

            this.drawObject(
                ctx,
                object
            );

        }

    }

    // ---------------------------------------------
    // DESENHAR PERSONAGEM
    // ---------------------------------------------

    if (
        player &&
        typeof player.draw === "function"
    ) {

        player.draw(ctx);

    }

    // ---------------------------------------------
    // DESENHAR OBJETOS À FRENTE
    // ---------------------------------------------

    if (player) {

        for (const object of visible) {

            if (
                this.getObjectDepth(object)
                > playerDepth
            ) {

                this.drawObject(
                    ctx,
                    object
                );

            }

        }

    }

    ctx.restore();

};


/*
========================================================
ZELDA PIXEL ADVENTURE
WORLD ENGINE — BETA 3

BLOCO 3 — EXPLORAÇÃO E SISTEMAS INTERATIVOS

Sistemas:
- Baús interativos
- Recompensas
- Descoberta de regiões
- Descoberta de monumentos
- Sistema de eventos
- Navegação A*
- Atualização de objetos
- Persistência
- Salvamento
- Recuperação do mundo
- Interações com o cenário

========================================================
*/


// =====================================================
// CONFIGURAÇÕES DE EXPLORAÇÃO
// =====================================================

const WORLD_EXPLORATION_CONFIG = Object.freeze({

    interactionRadius: 40,

    discoveryRadius: 80,

    chestOpenRadius: 32,

    pathGridSize: 16,

    pathMaxIterations: 2500,

    maximumEvents: 100,

    maximumNotifications: 12,

    saveVersion: 3

});


// =====================================================
// TIPOS DE EVENTOS
// =====================================================

const WORLD_EVENTS = Object.freeze({

    CHEST_OPENED: "CHEST_OPENED",

    REGION_DISCOVERED: "REGION_DISCOVERED",

    LANDMARK_DISCOVERED: "LANDMARK_DISCOVERED",

    OBJECT_INTERACTED: "OBJECT_INTERACTED",

    WORLD_SAVED: "WORLD_SAVED",

    WORLD_LOADED: "WORLD_LOADED"

});


// =====================================================
// SISTEMA DE EVENTOS DO MUNDO
// =====================================================

World.prototype.initializeEventSystem = function () {

    if (!this.eventListeners) {

        this.eventListeners = new Map();

    }

    if (!this.eventHistory) {

        this.eventHistory = [];

    }

    if (!this.notifications) {

        this.notifications = [];

    }

};


// =====================================================
// REGISTRAR EVENTO
// =====================================================

World.prototype.on = function (
    eventName,
    callback
) {

    this.initializeEventSystem();

    if (
        typeof callback !== "function"
    ) {

        return () => {};

    }

    if (!this.eventListeners.has(eventName)) {

        this.eventListeners.set(
            eventName,
            new Set()
        );

    }

    const listeners =
        this.eventListeners.get(eventName);

    listeners.add(callback);

    // Permite cancelar a inscrição.

    return () => {

        listeners.delete(callback);

    };

};


// =====================================================
// DISPARAR EVENTO
// =====================================================

World.prototype.emit = function (
    eventName,
    data = {}
) {

    this.initializeEventSystem();

    const event = {

        type: eventName,

        data,

        time: this.time,

        tick: this.tick

    };

    this.eventHistory.push(event);

    const maximum =
        WORLD_EXPLORATION_CONFIG.maximumEvents;

    if (
        this.eventHistory.length > maximum
    ) {

        this.eventHistory.splice(

            0,

            this.eventHistory.length - maximum

        );

    }

    const listeners =
        this.eventListeners.get(eventName);

    if (!listeners) {

        return event;

    }

    for (const callback of listeners) {

        try {

            callback(event);

        } catch (error) {

            console.error(

                "Erro ao executar evento:",

                eventName,

                error

            );

        }

    }

    return event;

};


// =====================================================
// NOTIFICAÇÕES
// =====================================================

World.prototype.notify = function (
    text,
    duration = 3
) {

    this.initializeEventSystem();

    if (
        typeof text !== "string" ||
        text.length === 0
    ) {

        return;

    }

    this.notifications.push({

        text,

        remaining: Math.max(
            0.1,
            duration
        )

    });

    const maximum =
        WORLD_EXPLORATION_CONFIG.maximumNotifications;

    if (
        this.notifications.length > maximum
    ) {

        this.notifications.splice(

            0,

            this.notifications.length - maximum

        );

    }

};


// =====================================================
// ATUALIZAR NOTIFICAÇÕES
// =====================================================

World.prototype.updateNotifications = function (
    deltaTime
) {

    if (!this.notifications) {

        return;

    }

    for (const notification of this.notifications) {

        notification.remaining -= deltaTime;

    }

    this.notifications =
        this.notifications.filter(

            notification =>
                notification.remaining > 0

        );

};


// =====================================================
// OBTER NOTIFICAÇÕES ATIVAS
// =====================================================

World.prototype.getNotifications = function () {

    this.initializeEventSystem();

    return this.notifications.map(

        notification => ({
            ...notification
        })

    );

};


// =====================================================
// DESCOBERTA DE REGIÕES
// =====================================================

World.prototype.initializeExploration = function () {

    if (!this.discoveredRegions) {

        this.discoveredRegions = new Set();

    }

    if (!this.discoveredLandmarks) {

        this.discoveredLandmarks = new Set();

    }

    if (!this.openedChests) {

        this.openedChests = new Set();

    }

    this.initializeEventSystem();

};


// =====================================================
// DESCOBRIR REGIÃO
// =====================================================

World.prototype.discoverRegion = function (
    x,
    y
) {

    this.initializeExploration();

    if (!this.isInsideWorld(x, y)) {

        return false;

    }

    const region = this.region(x, y);

    if (
        this.discoveredRegions.has(region)
    ) {

        return false;

    }

    this.discoveredRegions.add(region);

    this.notify(

        "Região descoberta: " + region,

        4

    );

    this.emit(

        WORLD_EVENTS.REGION_DISCOVERED,

        {
            region,
            x,
            y
        }

    );

    return true;

};


// =====================================================
// DESCOBRIR MONUMENTO
// =====================================================

World.prototype.discoverLandmark = function (
    landmark
) {

    this.initializeExploration();

    if (!landmark) {

        return false;

    }

    if (
        !this.landmarks.includes(landmark)
    ) {

        return false;

    }

    if (
        this.discoveredLandmarks.has(
            landmark.id
        )
    ) {

        return false;

    }

    this.discoveredLandmarks.add(
        landmark.id
    );

    landmark.discovered = true;

    this.notify(

        "Local descoberto: " +
        (
            landmark.name ||
            "Monumento"
        ),

        4

    );

    this.emit(

        WORLD_EVENTS.LANDMARK_DISCOVERED,

        {
            id: landmark.id,

            name: landmark.name,

            x: landmark.x,

            y: landmark.y

        }

    );

    return true;

};


// =====================================================
// ATUALIZAR EXPLORAÇÃO
// =====================================================

World.prototype.updateExploration = function (
    player
) {

    this.initializeExploration();

    if (!player) {

        return;

    }

    if (
        !Number.isFinite(player.x) ||
        !Number.isFinite(player.y)
    ) {

        return;

    }

    const centerX =
        player.x +
        (player.width || 0) / 2;

    const centerY =
        player.y +
        (player.height || 0) / 2;

    // ---------------------------------------------
    // DESCOBRIR SETOR
    // ---------------------------------------------

    this.discoverSector(

        centerX,

        centerY

    );

    // ---------------------------------------------
    // DESCOBRIR REGIÃO
    // ---------------------------------------------

    this.discoverRegion(

        centerX,

        centerY

    );

    // ---------------------------------------------
    // DESCOBRIR MONUMENTOS PRÓXIMOS
    // ---------------------------------------------

    const nearby = this.near(

        centerX,

        centerY,

        WORLD_EXPLORATION_CONFIG.discoveryRadius

    );

    for (const object of nearby) {

        if (
            this.landmarks.includes(object)
        ) {

            this.discoverLandmark(object);

        }

    }

};


// =====================================================
// GERADOR DE RECOMPENSAS
// =====================================================

World.prototype.generateChestLoot = function (
    chest
) {

    if (
        !chest ||
        chest.type !== TYPES.CHEST
    ) {

        return [];

    }

    const value = hash2D(

        Math.floor(chest.x),

        Math.floor(chest.y),

        this.seed

    );

    const rewards = [];

    // ---------------------------------------------
    // MOEDAS
    // ---------------------------------------------

    const coins =
        5 + (value % 46);

    rewards.push({

        id: "coins",

        name: "Moedas",

        quantity: coins,

        type: "currency"

    });

    // ---------------------------------------------
    // CONSUMÍVEL
    // ---------------------------------------------

    if (value % 3 === 0) {

        rewards.push({

            id: "apple",

            name: "Maca",

            quantity: 1,

            type: "food",

            heal: 10

        });

    }

    // ---------------------------------------------
    // POÇÃO
    // ---------------------------------------------

    if (value % 5 === 0) {

        rewards.push({

            id: "health_potion",

            name: "Pocao de Vida",

            quantity: 1,

            type: "potion",

            heal: 30

        });

    }

    // ---------------------------------------------
    // RECOMPENSA RARA
    // ---------------------------------------------

    if (value % 17 === 0) {

        rewards.push({

            id: "ancient_fragment",

            name: "Fragmento Antigo",

            quantity: 1,

            type: "material",

            rarity: "rare"

        });

    }

    return rewards;

};


// =====================================================
// VERIFICAR DISTÂNCIA ATÉ UM OBJETO
// =====================================================

World.prototype.distanceToObject = function (
    x,
    y,
    object
) {

    if (!object) {

        return Infinity;

    }

    const nearestX = clamp(

        x,

        object.x,

        object.x + object.w

    );

    const nearestY = clamp(

        y,

        object.y,

        object.y + object.h

    );

    return distance(

        x,

        y,

        nearestX,

        nearestY

    );

};


// =====================================================
// ABRIR BAÚ
// =====================================================

World.prototype.openChest = function (
    chest,
    player = null
) {

    this.initializeExploration();

    if (
        !chest ||
        chest.type !== TYPES.CHEST
    ) {

        return {

            success: false,

            reason: "INVALID_CHEST",

            loot: []

        };

    }

    if (
        chest.opened ||
        this.openedChests.has(chest.id)
    ) {

        return {

            success: false,

            reason: "ALREADY_OPENED",

            loot: []

        };

    }

    // ---------------------------------------------
    // VERIFICAR DISTÂNCIA
    // ---------------------------------------------

    if (player) {

        const playerX =
            player.x +
            (player.width || 0) / 2;

        const playerY =
            player.y +
            (player.height || 0) / 2;

        const chestDistance =
            this.distanceToObject(

                playerX,

                playerY,

                chest

            );

        if (
            chestDistance >
            WORLD_EXPLORATION_CONFIG.chestOpenRadius
        ) {

            return {

                success: false,

                reason: "TOO_FAR",

                loot: []

            };

        }

    }

    // ---------------------------------------------
    // GERAR RECOMPENSA
    // ---------------------------------------------

    const loot =
        this.generateChestLoot(chest);

    chest.opened = true;

    this.openedChests.add(
        chest.id
    );

    // ---------------------------------------------
    // NOTIFICAÇÃO
    // ---------------------------------------------

    this.notify(

        "Baú aberto!",

        3

    );

    // ---------------------------------------------
    // EVENTO
    // ---------------------------------------------

    this.emit(

        WORLD_EVENTS.CHEST_OPENED,

        {

            chestId: chest.id,

            x: chest.x,

            y: chest.y,

            loot

        }

    );

    return {

        success: true,

        reason: "OPENED",

        loot

    };

};


// =====================================================
// TRANSFERIR RECOMPENSAS AO INVENTÁRIO
// =====================================================

World.prototype.collectChestLoot = function (
    chest,
    player,
    inventory
) {

    if (
        !inventory ||
        typeof inventory.addItem !== "function"
    ) {

        return {

            success: false,

            reason: "INVALID_INVENTORY",

            loot: []

        };

    }

    const result = this.openChest(

        chest,

        player

    );

    if (!result.success) {

        return result;

    }

    // ---------------------------------------------
    // ADICIONAR RECOMPENSAS
    // ---------------------------------------------

    for (const reward of result.loot) {

        inventory.addItem({

            ...reward

        });

    }

    return result;

};


// =====================================================
// INTERAGIR COM OBJETO
// =====================================================

World.prototype.interact = function (
    player,
    inventory = null
) {

    if (!player) {

        return {

            success: false,

            reason: "INVALID_PLAYER"

        };

    }

    const centerX =
        player.x +
        (player.width || 0) / 2;

    const centerY =
        player.y +
        (player.height || 0) / 2;

    // ---------------------------------------------
    // PROCURAR OBJETOS INTERATIVOS
    // ---------------------------------------------

    const nearby = this.getInteractables(

        centerX,

        centerY,

        WORLD_EXPLORATION_CONFIG.interactionRadius

    );

    if (nearby.length === 0) {

        return {

            success: false,

            reason: "NOTHING_NEARBY"

        };

    }

    // ---------------------------------------------
    // PRIORIZAR O OBJETO MAIS PRÓXIMO
    // ---------------------------------------------

    nearby.sort(

        (a, b) => {

            return (

                this.distanceToObject(
                    centerX,
                    centerY,
                    a
                ) -

                this.distanceToObject(
                    centerX,
                    centerY,
                    b
                )

            );

        }

    );

    const object = nearby[0];

    // ---------------------------------------------
    // INTERAÇÃO COM BAÚ
    // ---------------------------------------------

    if (
        object.type === TYPES.CHEST
    ) {

        if (inventory) {

            return this.collectChestLoot(

                object,

                player,

                inventory

            );

        }

        return this.openChest(

            object,

            player

        );

    }

    // ---------------------------------------------
    // INTERAÇÃO COM MONUMENTOS
    // ---------------------------------------------

    if (
        this.landmarks.includes(object)
    ) {

        this.discoverLandmark(
            object
        );

        this.emit(

            WORLD_EVENTS.OBJECT_INTERACTED,

            {

                objectId: object.id,

                type: object.type,

                name: object.name

            }

        );

        this.notify(

            object.name ||
            "Local misterioso",

            3

        );

        return {

            success: true,

            reason: "LANDMARK",

            object

        };

    }

    return {

        success: false,

        reason: "NOT_INTERACTIVE"

    };

};


// =====================================================
// NAVEGAÇÃO — CONFIGURAÇÕES
// =====================================================

World.prototype.getNavigationConfig = function () {

    return {

        gridSize:
            WORLD_EXPLORATION_CONFIG.pathGridSize,

        maxIterations:
            WORLD_EXPLORATION_CONFIG.pathMaxIterations

    };

};


// =====================================================
// CONVERTER POSIÇÃO PARA NÓ DE NAVEGAÇÃO
// =====================================================

World.prototype.worldToNode = function (
    x,
    y,
    gridSize
) {

    return {

        x: Math.floor(
            x / gridSize
        ),

        y: Math.floor(
            y / gridSize
        )

    };

};


// =====================================================
// CONVERTER NÓ PARA POSIÇÃO DO MUNDO
// =====================================================

World.prototype.nodeToWorld = function (
    node,
    gridSize
) {

    return {

        x: node.x * gridSize,

        y: node.y * gridSize

    };

};


// =====================================================
// IDENTIFICAR NÓ
// =====================================================

World.prototype.getNodeKey = function (
    x,
    y
) {

    return `${x},${y}`;

};


// =====================================================
// DISTÂNCIA HEURÍSTICA
// =====================================================

World.prototype.pathHeuristic = function (
    a,
    b
) {

    const dx = Math.abs(
        a.x - b.x
    );

    const dy = Math.abs(
        a.y - b.y
    );

    // Distância octil para movimentação
    // horizontal, vertical e diagonal.

    const diagonal = Math.min(
        dx,
        dy
    );

    const straight = Math.max(
        dx,
        dy
    ) - diagonal;

    return (

        diagonal * Math.SQRT2 +

        straight

    );

};


// =====================================================
// VERIFICAR SE NÓ É TRANSITÁVEL
// =====================================================

World.prototype.isNodeWalkable = function (
    node,
    gridSize,
    width = 12,
    height = 10
) {

    const position =
        this.nodeToWorld(

            node,

            gridSize

        );

    return this.canMove({

        x: position.x,

        y: position.y,

        w: width,

        h: height

    });

};


// =====================================================
// OBTER VIZINHOS DE UM NÓ
// =====================================================

World.prototype.getNodeNeighbors = function (
    node,
    gridSize,
    width,
    height
) {

    const neighbors = [];

    const directions = [

        [0, -1],

        [1, 0],

        [0, 1],

        [-1, 0],

        [1, -1],

        [1, 1],

        [-1, 1],

        [-1, -1]

    ];

    for (const direction of directions) {

        const dx = direction[0];

        const dy = direction[1];

        const next = {

            x: node.x + dx,

            y: node.y + dy

        };

        if (
            !this.isNodeWalkable(

                next,

                gridSize,

                width,

                height

            )
        ) {

            continue;

        }

        // ---------------------------------------------
        // IMPEDIR ATRAVESSAR CANTOS NA DIAGONAL
        // ---------------------------------------------

        if (
            dx !== 0 &&
            dy !== 0
        ) {

            const horizontal = {

                x: node.x + dx,

                y: node.y

            };

            const vertical = {

                x: node.x,

                y: node.y + dy

            };

            if (

                !this.isNodeWalkable(

                    horizontal,

                    gridSize,

                    width,

                    height

                ) ||

                !this.isNodeWalkable(

                    vertical,

                    gridSize,

                    width,

                    height

                )

            ) {

                continue;

            }

        }

        neighbors.push({

            ...next,

            cost:
                dx !== 0 && dy !== 0
                    ? Math.SQRT2
                    : 1

        });

    }

    return neighbors;

};


// =====================================================
// RECONSTRUIR CAMINHO
// =====================================================

World.prototype.reconstructPath = function (
    finalNode,
    nodeMap,
    gridSize
) {

    const path = [];

    let current = finalNode;

    const visited = new Set();

    while (current) {

        const key =
            this.getNodeKey(

                current.x,

                current.y

            );

        if (visited.has(key)) {

            break;

        }

        visited.add(key);

        path.push(

            this.nodeToWorld(

                current,

                gridSize

            )

        );

        if (!current.parent) {

            break;

        }

        current = nodeMap.get(
            current.parent
        );

    }

    path.reverse();

    return path;

};


// =====================================================
// ALGORITMO A* — BUSCA DE CAMINHO
// =====================================================

World.prototype.findPath = function (
    startX,
    startY,
    targetX,
    targetY,
    options = {}
) {

    const config =
        this.getNavigationConfig();

    const gridSize =
        options.gridSize ||
        config.gridSize;

    const maxIterations =
        options.maxIterations ||
        config.maxIterations;

    const entityWidth =
        options.width || 12;

    const entityHeight =
        options.height || 10;

    // ---------------------------------------------
    // VALIDAR PARÂMETROS
    // ---------------------------------------------

    if (

        !Number.isFinite(startX) ||

        !Number.isFinite(startY) ||

        !Number.isFinite(targetX) ||

        !Number.isFinite(targetY) ||

        !Number.isFinite(gridSize) ||

        gridSize <= 0 ||

        !Number.isFinite(entityWidth) ||

        !Number.isFinite(entityHeight) ||

        entityWidth <= 0 ||

        entityHeight <= 0 ||

        !Number.isInteger(maxIterations) ||

        maxIterations <= 0

    ) {

        return [];

    }

    // ---------------------------------------------
    // ENCONTRAR NÓS INICIAIS
    // ---------------------------------------------

    const start = this.worldToNode(

        startX,

        startY,

        gridSize

    );

    const target = this.worldToNode(

        targetX,

        targetY,

        gridSize

    );

    // ---------------------------------------------
    // VERIFICAR PONTOS DE PARTIDA E DESTINO
    // ---------------------------------------------

    if (

        !this.isNodeWalkable(

            start,

            gridSize,

            entityWidth,

            entityHeight

        ) ||

        !this.isNodeWalkable(

            target,

            gridSize,

            entityWidth,

            entityHeight

        )

    ) {

        return [];

    }

    // ---------------------------------------------
    // INICIALIZAR ESTRUTURAS
    // ---------------------------------------------

    const open = [];

    const openMap = new Map();

    const closed = new Set();

    const nodeMap = new Map();

    const startKey = this.getNodeKey(

        start.x,

        start.y

    );

    const targetKey = this.getNodeKey(

        target.x,

        target.y

    );

    const startNode = {

        x: start.x,

        y: start.y,

        g: 0,

        h: this.pathHeuristic(

            start,

            target

        ),

        parent: null

    };

    startNode.f =
        startNode.g + startNode.h;

    open.push(startNode);

    openMap.set(
        startKey,
        startNode
    );

    nodeMap.set(
        startKey,
        startNode
    );

    let iterations = 0;

    // ---------------------------------------------
    // PROCESSAR NÓS
    // ---------------------------------------------

    while (

        open.length > 0 &&

        iterations < maxIterations

    ) {

        iterations++;

        // Selecionar o nó com menor custo estimado.

        let bestIndex = 0;

        for (
            let i = 1;
            i < open.length;
            i++
        ) {

            if (

                open[i].f <

                open[bestIndex].f

            ) {

                bestIndex = i;

            }

        }

        const current = open.splice(

            bestIndex,

            1

        )[0];

        const currentKey =
            this.getNodeKey(

                current.x,

                current.y

            );

        openMap.delete(
            currentKey
        );

        // -----------------------------------------
        // DESTINO ENCONTRADO
        // -----------------------------------------

        if (
            currentKey === targetKey
        ) {

            return this.reconstructPath(

                current,

                nodeMap,

                gridSize

            );

        }

        closed.add(
            currentKey
        );

        // -----------------------------------------
        // PROCESSAR VIZINHOS
        // -----------------------------------------

        const neighbors =
            this.getNodeNeighbors(

                current,

                gridSize,

                entityWidth,

                entityHeight

            );

        for (const neighbor of neighbors) {

            const key =
                this.getNodeKey(

                    neighbor.x,

                    neighbor.y

                );

            if (closed.has(key)) {

                continue;

            }

            const tentativeG =

                current.g +

                neighbor.cost;

            const existing =
                openMap.get(key);

            if (

                existing &&

                tentativeG >= existing.g

            ) {

                continue;

            }

            const next = {

                x: neighbor.x,

                y: neighbor.y,

                g: tentativeG,

                h: this.pathHeuristic(

                    neighbor,

                    target

                ),

                parent: currentKey

            };

            next.f =
                next.g + next.h;

            // -------------------------------------
            // ATUALIZAR NÓ EXISTENTE
            // -------------------------------------

            if (existing) {

                existing.g = next.g;

                existing.h = next.h;

                existing.f = next.f;

                existing.parent =
                    next.parent;

                nodeMap.set(

                    key,

                    existing

                );

            }

            // -------------------------------------
            // ADICIONAR NOVO NÓ
            // -------------------------------------

            else {

                open.push(next);

                openMap.set(

                    key,

                    next

                );

                nodeMap.set(

                    key,

                    next

                );

            }

        }

    }

    // Nenhum caminho encontrado dentro do
    // limite de processamento.

    return [];

};


// =====================================================
// VERIFICAR SE MOVIMENTO DIRETO É POSSÍVEL
// =====================================================

World.prototype.canTravelDirectly = function (
    x1,
    y1,
    x2,
    y2,
    width = 12,
    height = 10
) {

    if (

        !Number.isFinite(x1) ||

        !Number.isFinite(y1) ||

        !Number.isFinite(x2) ||

        !Number.isFinite(y2)

    ) {

        return false;

    }

    const totalDistance =
        distance(

            x1,

            y1,

            x2,

            y2

        );

    const steps = Math.max(

        1,

        Math.ceil(

            totalDistance / 4

        )

    );

    for (
        let i = 0;
        i <= steps;
        i++
    ) {

        const factor =
            i / steps;

        const x =
            x1 + (x2 - x1) * factor;

        const y =
            y1 + (y2 - y1) * factor;

        if (

            !this.canMove({

                x,

                y,

                w: width,

                h: height

            })

        ) {

            return false;

        }

    }

    return true;

};


// =====================================================
// SIMPLIFICAR CAMINHO
// =====================================================

World.prototype.simplifyPath = function (
    path,
    width = 12,
    height = 10
) {

    if (
        !Array.isArray(path) ||
        path.length <= 2
    ) {

        return Array.isArray(path)
            ? path
            : [];

    }

    const simplified = [

        path[0]

    ];

    let currentIndex = 0;

    while (
        currentIndex < path.length - 1
    ) {

        let nextIndex =
            currentIndex + 1;

        // Encontrar o ponto mais distante
        // alcançável em linha reta.

        for (

            let i = path.length - 1;

            i > currentIndex + 1;

            i--

        ) {

            if (

                this.canTravelDirectly(

                    path[currentIndex].x,

                    path[currentIndex].y,

                    path[i].x,

                    path[i].y,

                    width,

                    height

                )

            ) {

                nextIndex = i;

                break;

            }

        }

        simplified.push(
            path[nextIndex]
        );

        currentIndex =
            nextIndex;

    }

    return simplified;

};


// =====================================================
// RECONSTRUIR ÍNDICE ESPACIAL
// =====================================================

World.prototype.rebuildSpatialIndex = function () {

    this.byCell.clear();

    for (const object of this.objects) {

        this.indexObject(
            object
        );

    }

};


// =====================================================
// ATUALIZAR OBJETO DO MUNDO
// =====================================================

World.prototype.updateObject = function (
    id,
    changes
) {

    if (
        !Number.isInteger(id) ||
        !changes ||
        typeof changes !== "object"
    ) {

        return false;

    }

    const object =
        this.getObjectById(id);

    if (!object) {

        return false;

    }

    // ---------------------------------------------
    // ALTERAÇÕES PERMITIDAS
    // ---------------------------------------------

    const allowedFields = [

        "x",

        "y",

        "w",

        "h",

        "solid",

        "opened",

        "discovered",

        "name"

    ];

    const next = {

        ...object

    };

    for (const field of allowedFields) {

        if (
            Object.prototype.hasOwnProperty.call(
                changes,
                field
            )
        ) {

            next[field] =
                changes[field];

        }

    }

    // ---------------------------------------------
    // VALIDAR GEOMETRIA
    // ---------------------------------------------

    if (

        !isValidRectangle(next) ||

        next.x < 0 ||

        next.y < 0 ||

        next.x + next.w >
            this.width ||

        next.y + next.h >
            this.height

    ) {

        return false;

    }

    // ---------------------------------------------
    // APLICAR ALTERAÇÕES
    // ---------------------------------------------

    Object.assign(

        object,

        next

    );

    // ---------------------------------------------
    // RECONSTRUIR ÍNDICE
    // ---------------------------------------------

    this.rebuildSpatialIndex();

    return true;

};


// =====================================================
// REMOVER OBJETO DO MUNDO
// =====================================================

World.prototype.removeObject = function (
    id
) {

    if (!Number.isInteger(id)) {

        return false;

    }

    const index =
        this.objects.findIndex(

            object =>
                object.id === id

        );

    if (index === -1) {

        return false;

    }

    const object =
        this.objects[index];

    this.objects.splice(

        index,

        1

    );

    // ---------------------------------------------
    // REMOVER MONUMENTO
    // ---------------------------------------------

    const landmarkIndex =
        this.landmarks.indexOf(
            object
        );

    if (landmarkIndex !== -1) {

        this.landmarks.splice(

            landmarkIndex,

            1

        );

    }

    // ---------------------------------------------
    // ATUALIZAR ÍNDICE ESPACIAL
    // ---------------------------------------------

    this.rebuildSpatialIndex();

    return true;

};


// =====================================================
// SALVAMENTO — EXPORTAR ESTADO
// =====================================================

World.prototype.exportState = function () {

    this.initializeExploration();

    const discoveredSectors = [];

    for (
        const sector of this.sectors.values()
    ) {

        if (sector.discovered) {

            discoveredSectors.push(

                sector.id

            );

        }

    }

    return {

        version:
            WORLD_EXPLORATION_CONFIG.saveVersion,

        seed: this.seed,

        time: this.time,

        tick: this.tick,

        camera: {

            x: this.cameraX,

            y: this.cameraY

        },

        discoveredRegions: [

            ...this.discoveredRegions

        ],

        discoveredLandmarks: [

            ...this.discoveredLandmarks

        ],

        openedChests: [

            ...this.openedChests

        ],

        discoveredSectors,

        objectStates: this.objects

            .filter(

                object =>

                    object.opened === true ||

                    object.discovered === true

            )

            .map(

                object => ({

                    id: object.id,

                    opened:
                        object.opened === true,

                    discovered:
                        object.discovered === true

                })

            )

    };

};


// =====================================================
// SALVAMENTO — IMPORTAR ESTADO
// =====================================================

World.prototype.importState = function (
    state
) {

    this.initializeExploration();

    if (
        !state ||
        typeof state !== "object"
    ) {

        return false;

    }

    // ---------------------------------------------
    // VERIFICAR VERSÃO
    // ---------------------------------------------

    if (
        state.version !==
        WORLD_EXPLORATION_CONFIG.saveVersion
    ) {

        return false;

    }

    // ---------------------------------------------
    // VERIFICAR SEED
    // ---------------------------------------------

    if (
        state.seed !== this.seed
    ) {

        return false;

    }

    // ---------------------------------------------
    // RECUPERAR TEMPO
    // ---------------------------------------------

    if (
        Number.isFinite(state.time)
    ) {

        this.time = clamp(

            state.time,

            0,

            this.dayLength

        );

    }

    if (
        Number.isInteger(state.tick) &&
        state.tick >= 0
    ) {

        this.tick = state.tick;

    }

    // ---------------------------------------------
    // RECUPERAR CÂMERA
    // ---------------------------------------------

    if (state.camera) {

        if (
            Number.isFinite(
                state.camera.x
            )
        ) {

            this.cameraX = clamp(

                state.camera.x,

                0,

                this.width

            );

        }

        if (
            Number.isFinite(
                state.camera.y
            )
        ) {

            this.cameraY = clamp(

                state.camera.y,

                0,

                this.height

            );

        }

    }

    // ---------------------------------------------
    // RECUPERAR REGIÕES DESCOBERTAS
    // ---------------------------------------------

    if (
        Array.isArray(
            state.discoveredRegions
        )
    ) {

        const validRegions =
            Object.values(REGIONS);

        this.discoveredRegions = new Set(

            state.discoveredRegions.filter(

                region =>
                    validRegions.includes(region)

            )

        );

    }

    // ---------------------------------------------
    // RECUPERAR MONUMENTOS
    // ---------------------------------------------

    if (
        Array.isArray(
            state.discoveredLandmarks
        )
    ) {

        this.discoveredLandmarks =
            new Set(

                state.discoveredLandmarks.filter(

                    id =>
                        Number.isInteger(id)

                )

            );

    }

    // ---------------------------------------------
    // RECUPERAR BAÚS
    // ---------------------------------------------

    if (
        Array.isArray(
            state.openedChests
        )
    ) {

        this.openedChests =
            new Set(

                state.openedChests.filter(

                    id =>
                        Number.isInteger(id)

                )

            );

    }

    // ---------------------------------------------
    // RECUPERAR SETORES
    // ---------------------------------------------

    if (
        Array.isArray(
            state.discoveredSectors
        )
    ) {

        const discovered =
            new Set(

                state.discoveredSectors

            );

        for (
            const sector of
            this.sectors.values()
        ) {

            sector.discovered =
                discovered.has(
                    sector.id
                );

        }

    }

    // ---------------------------------------------
    // RECUPERAR ESTADOS DOS OBJETOS
    // ---------------------------------------------

    if (
        Array.isArray(
            state.objectStates
        )
    ) {

        for (
            const savedObject of
            state.objectStates
        ) {

            if (
                !savedObject ||
                !Number.isInteger(
                    savedObject.id
                )
            ) {

                continue;

            }

            const object =
                this.getObjectById(

                    savedObject.id

                );

            if (!object) {

                continue;

            }

            if (
                typeof savedObject.opened ===
                "boolean"
            ) {

                object.opened =
                    savedObject.opened;

            }

            if (
                typeof savedObject.discovered ===
                "boolean"
            ) {

                object.discovered =
                    savedObject.discovered;

            }

        }

    }

    // ---------------------------------------------
    // SINCRONIZAR BAÚS
    // ---------------------------------------------

    for (const object of this.objects) {

        if (
            object.type === TYPES.CHEST
        ) {

            object.opened =
                this.openedChests.has(
                    object.id
                );

        }

        if (
            this.discoveredLandmarks.has(
                object.id
            )
        ) {

            object.discovered = true;

        }

    }

    this.emit(

        WORLD_EVENTS.WORLD_LOADED,

        {
            seed: this.seed
        }

    );

    return true;

};


// =====================================================
// SALVAR ESTADO NO NAVEGADOR
// =====================================================

World.prototype.saveToLocalStorage = function (
    key = "zelda_world_beta3"
) {

    if (
        typeof localStorage ===
        "undefined"
    ) {

        return false;

    }

    try {

        const state =
            this.exportState();

        const serialized =
            JSON.stringify(state);

        localStorage.setItem(

            key,

            serialized

        );

        this.emit(

            WORLD_EVENTS.WORLD_SAVED,

            {
                key
            }

        );

        return true;

    } catch (error) {

        console.error(

            "Erro ao salvar mundo:",

            error

        );

        return false;

    }

};


// =====================================================
// CARREGAR ESTADO DO NAVEGADOR
// =====================================================

World.prototype.loadFromLocalStorage = function (
    key = "zelda_world_beta3"
) {

    if (
        typeof localStorage ===
        "undefined"
    ) {

        return false;

    }

    try {

        const serialized =
            localStorage.getItem(key);

        if (!serialized) {

            return false;

        }

        const state =
            JSON.parse(serialized);

        return this.importState(
            state
        );

    } catch (error) {

        console.error(

            "Erro ao carregar mundo:",

            error

        );

        return false;

    }

};


/*
========================================================
ZELDA PIXEL ADVENTURE
WORLD ENGINE — BETA 3

BLOCO 4

SISTEMA AMBIENTAL

- Ciclo de dia e noite
- Relógio do mundo
- Amanhecer
- Entardecer
- Iluminação noturna
- Variação climática
- Chuva
- Tempestade
- Neve
- Neblina
- Vento
- Partículas ambientais
- Transições de iluminação
- Estados climáticos por bioma
- Indicadores ambientais

========================================================
*/


// =====================================================
// TIPOS DE CLIMA
// =====================================================

const WEATHER_TYPES = Object.freeze({

    CLEAR: "CLEAR",

    CLOUDY: "CLOUDY",

    RAIN: "RAIN",

    STORM: "STORM",

    SNOW: "SNOW",

    FOG: "FOG",

    WIND: "WIND"

});


// =====================================================
// CONFIGURAÇÕES AMBIENTAIS
// =====================================================

const ENVIRONMENT_CONFIG = Object.freeze({

    dayLength: 1200,

    weatherDuration: 45,

    weatherTransitionSpeed: 0.35,

    maximumRainParticles: 85,

    maximumSnowParticles: 65,

    maximumWindParticles: 45,

    minimumAmbientLight: 0.25,

    maximumAmbientLight: 1,

    lightningDuration: 0.15,

    lightningChance: 0.0015

});


// =====================================================
// INICIALIZAR SISTEMA AMBIENTAL
// =====================================================

World.prototype.initializeEnvironment = function () {

    if (this.environmentInitialized) {

        return;

    }

    this.environmentInitialized = true;

    this.dayLength =
        ENVIRONMENT_CONFIG.dayLength;

    this.currentWeather =
        WEATHER_TYPES.CLEAR;

    this.previousWeather =
        WEATHER_TYPES.CLEAR;

    this.weatherBlend = 1;

    this.weatherTimer = 0;

    this.weatherSlot = -1;

    this.weatherRegion = null;

    this.environmentTime = 0;

    this.lightningTimer = 0;

    this.windStrength = 0;

    this.windDirection = 1;

    this.ambientLight = 1;

    this.environmentPlayerX =
        this.width / 2;

    this.environmentPlayerY =
        this.height / 2;

};


// =====================================================
// OBTER HORA DO MUNDO
// =====================================================

World.prototype.getWorldHour = function () {

    this.initializeEnvironment();

    const progress =

        (
            this.time %
            this.dayLength
        ) / this.dayLength;

    return progress * 24;

};


// =====================================================
// OBTER HORÁRIO FORMATADO
// =====================================================

World.prototype.getFormattedTime = function () {

    const hour =
        this.getWorldHour();

    const totalMinutes =
        Math.floor(hour * 60);

    const hours =
        Math.floor(totalMinutes / 60) % 24;

    const minutes =
        totalMinutes % 60;

    return (

        String(hours).padStart(2, "0") +

        ":" +

        String(minutes).padStart(2, "0")

    );

};


// =====================================================
// IDENTIFICAR PERÍODO DO DIA
// =====================================================

World.prototype.getDayPhase = function () {

    const hour =
        this.getWorldHour();

    if (
        hour >= 5 &&
        hour < 7
    ) {

        return "DAWN";

    }

    if (
        hour >= 7 &&
        hour < 17
    ) {

        return "DAY";

    }

    if (
        hour >= 17 &&
        hour < 19
    ) {

        return "DUSK";

    }

    return "NIGHT";

};


// =====================================================
// CALCULAR INTENSIDADE DA LUZ
// =====================================================

World.prototype.calculateAmbientLight = function () {

    const hour =
        this.getWorldHour();

    let light = 1;

    // ---------------------------------------------
    // AMANHECER
    // ---------------------------------------------

    if (
        hour >= 5 &&
        hour < 7
    ) {

        const progress =
            (hour - 5) / 2;

        light =
            0.30 + progress * 0.70;

    }

    // ---------------------------------------------
    // DIA
    // ---------------------------------------------

    else if (
        hour >= 7 &&
        hour < 17
    ) {

        light = 1;

    }

    // ---------------------------------------------
    // ENTARDECER
    // ---------------------------------------------

    else if (
        hour >= 17 &&
        hour < 19
    ) {

        const progress =
            (hour - 17) / 2;

        light =
            1 - progress * 0.70;

    }

    // ---------------------------------------------
    // NOITE
    // ---------------------------------------------

    else {

        light = 0.30;

    }

    // ---------------------------------------------
    // INFLUÊNCIA DO CLIMA
    // ---------------------------------------------

    switch (this.currentWeather) {

        case WEATHER_TYPES.CLOUDY:

            light *= 0.85;

            break;

        case WEATHER_TYPES.RAIN:

            light *= 0.78;

            break;

        case WEATHER_TYPES.STORM:

            light *= 0.55;

            break;

        case WEATHER_TYPES.FOG:

            light *= 0.90;

            break;

        default:

            break;

    }

    return clamp(

        light,

        ENVIRONMENT_CONFIG.minimumAmbientLight,

        ENVIRONMENT_CONFIG.maximumAmbientLight

    );

};


// =====================================================
// OBTER DISTRIBUIÇÃO CLIMÁTICA POR REGIÃO
// =====================================================

World.prototype.getWeatherDistribution = function (
    region
) {

    switch (region) {

        case REGIONS.FOREST:

            return [

                [WEATHER_TYPES.CLEAR, 30],

                [WEATHER_TYPES.CLOUDY, 20],

                [WEATHER_TYPES.RAIN, 25],

                [WEATHER_TYPES.STORM, 10],

                [WEATHER_TYPES.FOG, 10],

                [WEATHER_TYPES.WIND, 5]

            ];

        case REGIONS.MOUNTAINS:

            return [

                [WEATHER_TYPES.CLEAR, 35],

                [WEATHER_TYPES.CLOUDY, 25],

                [WEATHER_TYPES.RAIN, 10],

                [WEATHER_TYPES.SNOW, 10],

                [WEATHER_TYPES.FOG, 10],

                [WEATHER_TYPES.WIND, 10]

            ];

        case REGIONS.DESERT:

            return [

                [WEATHER_TYPES.CLEAR, 65],

                [WEATHER_TYPES.CLOUDY, 10],

                [WEATHER_TYPES.WIND, 20],

                [WEATHER_TYPES.FOG, 5]

            ];

        case REGIONS.SNOW:

            return [

                [WEATHER_TYPES.CLEAR, 25],

                [WEATHER_TYPES.CLOUDY, 20],

                [WEATHER_TYPES.SNOW, 40],

                [WEATHER_TYPES.FOG, 10],

                [WEATHER_TYPES.WIND, 5]

            ];

        case REGIONS.LAKE:

            return [

                [WEATHER_TYPES.CLEAR, 30],

                [WEATHER_TYPES.CLOUDY, 15],

                [WEATHER_TYPES.RAIN, 30],

                [WEATHER_TYPES.STORM, 10],

                [WEATHER_TYPES.FOG, 15]

            ];

        default:

            return [

                [WEATHER_TYPES.CLEAR, 45],

                [WEATHER_TYPES.CLOUDY, 20],

                [WEATHER_TYPES.RAIN, 15],

                [WEATHER_TYPES.STORM, 5],

                [WEATHER_TYPES.FOG, 5],

                [WEATHER_TYPES.WIND, 10]

            ];

    }

};


// =====================================================
// SELECIONAR CLIMA
// =====================================================

World.prototype.selectWeather = function (
    region,
    slot
) {

    const distribution =
        this.getWeatherDistribution(region);

    const regionCode =
        Object.values(REGIONS).indexOf(
            region
        );

    const hash = hash2D(

        slot,

        regionCode,

        this.seed

    );

    const roll =
        hash % 100;

    let cumulative = 0;

    for (const entry of distribution) {

        const type = entry[0];

        const probability = entry[1];

        cumulative += probability;

        if (roll < cumulative) {

            return type;

        }

    }

    return WEATHER_TYPES.CLEAR;

};


// =====================================================
// ATUALIZAR CLIMA
// =====================================================

World.prototype.updateWeather = function (
    deltaTime,
    playerX,
    playerY
) {

    this.initializeEnvironment();

    const region =
        this.region(
            playerX,
            playerY
        );

    const slot = Math.floor(

        this.environmentTime /

        ENVIRONMENT_CONFIG.weatherDuration

    );

    if (

        slot !== this.weatherSlot ||

        region !== this.weatherRegion

    ) {

        const nextWeather =
            this.selectWeather(

                region,

                slot

            );

        if (
            nextWeather !==
            this.currentWeather
        ) {

            this.previousWeather =
                this.currentWeather;

            this.currentWeather =
                nextWeather;

            this.weatherBlend = 0;

        }

        this.weatherSlot = slot;

        this.weatherRegion = region;

    }

    this.weatherBlend = Math.min(

        1,

        this.weatherBlend +

        deltaTime *

        ENVIRONMENT_CONFIG.weatherTransitionSpeed

    );

};


// =====================================================
// ATUALIZAR VENTO
// =====================================================

World.prototype.updateWind = function (
    deltaTime
) {

    const phase =

        this.environmentTime * 0.17 +

        this.seed * 0.001;

    const naturalWind =
        Math.sin(phase);

    const secondaryWind =
        Math.sin(phase * 0.37);

    this.windStrength =

        (
            Math.abs(naturalWind) * 0.65 +

            Math.abs(secondaryWind) * 0.35

        );

    if (
        this.currentWeather ===
        WEATHER_TYPES.WIND
    ) {

        this.windStrength =
            Math.max(
                0.65,
                this.windStrength
            );

    }

    if (
        this.currentWeather ===
        WEATHER_TYPES.STORM
    ) {

        this.windStrength =
            Math.max(
                0.80,
                this.windStrength
            );

    }

    this.windDirection =
        naturalWind >= 0 ? 1 : -1;

};


// =====================================================
// ATUALIZAR RELÂMPAGOS
// =====================================================

World.prototype.updateLightning = function (
    deltaTime
) {

    if (this.lightningTimer > 0) {

        this.lightningTimer = Math.max(

            0,

            this.lightningTimer - deltaTime

        );

    }

    if (
        this.currentWeather !==
        WEATHER_TYPES.STORM
    ) {

        return;

    }

    const second =
        Math.floor(
            this.environmentTime * 10
        );

    const value = hash2D(

        second,

        7331,

        this.seed

    );

    if (

        this.lightningTimer <= 0 &&

        value % 1000 < 3 &&

        second !== this.lastLightningSlot

    ) {

        this.lastLightningSlot = second;

        this.lightningTimer =
            ENVIRONMENT_CONFIG.lightningDuration;

    }

};


// =====================================================
// ATUALIZAR SISTEMA AMBIENTAL
// =====================================================

World.prototype.updateEnvironment = function (
    deltaTime,
    playerX,
    playerY
) {

    this.initializeEnvironment();

    if (

        !Number.isFinite(deltaTime) ||

        deltaTime <= 0

    ) {

        return;

    }

    const dt = Math.min(

        deltaTime,

        0.25

    );

    if (
        Number.isFinite(playerX) &&
        Number.isFinite(playerY)
    ) {

        this.environmentPlayerX =
            playerX;

        this.environmentPlayerY =
            playerY;

    }

    this.environmentTime += dt;

    this.updateWeather(

        dt,

        this.environmentPlayerX,

        this.environmentPlayerY

    );

    this.updateWind(dt);

    this.updateLightning(dt);

    this.ambientLight =
        this.calculateAmbientLight();

};


// =====================================================
// DESENHAR ILUMINAÇÃO
// =====================================================

World.prototype.drawAmbientLighting = function (
    ctx,
    screenWidth,
    screenHeight
) {

    this.initializeEnvironment();

    const light =
        this.ambientLight;

    const darkness =

        (1 - light) * 0.72;

    if (darkness <= 0.001) {

        return;

    }

    ctx.save();

    ctx.fillStyle =

        `rgba(8, 16, 39, ${darkness})`;

    ctx.fillRect(

        0,

        0,

        screenWidth,

        screenHeight

    );

    ctx.restore();

};


// =====================================================
// DESENHAR TONALIDADE DO AMANHECER
// =====================================================

World.prototype.drawDawnTint = function (
    ctx,
    screenWidth,
    screenHeight
) {

    const phase =
        this.getDayPhase();

    if (phase !== "DAWN") {

        return;

    }

    const hour =
        this.getWorldHour();

    const progress =
        (hour - 5) / 2;

    const intensity =

        (1 - progress) * 0.18;

    ctx.save();

    ctx.fillStyle =

        `rgba(255, 155, 95, ${intensity})`;

    ctx.fillRect(

        0,

        0,

        screenWidth,

        screenHeight

    );

    ctx.restore();

};


// =====================================================
// DESENHAR TONALIDADE DO ENTARDECER
// =====================================================

World.prototype.drawDuskTint = function (
    ctx,
    screenWidth,
    screenHeight
) {

    if (
        this.getDayPhase() !== "DUSK"
    ) {

        return;

    }

    const hour =
        this.getWorldHour();

    const progress =
        (hour - 17) / 2;

    const intensity =

        progress * 0.24;

    ctx.save();

    ctx.fillStyle =

        `rgba(212, 107, 65, ${intensity})`;

    ctx.fillRect(

        0,

        0,

        screenWidth,

        screenHeight

    );

    ctx.restore();

};


// =====================================================
// PARTÍCULAS DE CHUVA
// =====================================================

World.prototype.drawRain = function (
    ctx,
    screenWidth,
    screenHeight,
    intensity = 1
) {

    const count = Math.floor(

        ENVIRONMENT_CONFIG.maximumRainParticles *

        intensity

    );

    const time =
        this.environmentTime;

    const wind =
        this.windDirection *
        this.windStrength;

    ctx.save();

    ctx.strokeStyle =
        "rgba(170, 215, 255, 0.70)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    for (let i = 0; i < count; i++) {

        const seed = hash2D(

            i,

            1001,

            this.seed

        );

        const startX =
            seed % screenWidth;

        const startY =
            (seed >>> 8) % screenHeight;

        const speed =
            80 + (seed % 60);

        const x = (

            startX +

            time * wind * 25 +

            screenWidth * 100

        ) % screenWidth;

        const y = (

            startY +

            time * speed

        ) % screenHeight;

        ctx.moveTo(

            Math.floor(x),

            Math.floor(y)

        );

        ctx.lineTo(

            Math.floor(x + wind * 3),

            Math.floor(y + 5)

        );

    }

    ctx.stroke();

    ctx.restore();

};


// =====================================================
// PARTÍCULAS DE NEVE
// =====================================================

World.prototype.drawSnow = function (
    ctx,
    screenWidth,
    screenHeight,
    intensity = 1
) {

    const count = Math.floor(

        ENVIRONMENT_CONFIG.maximumSnowParticles *

        intensity

    );

    const time =
        this.environmentTime;

    ctx.save();

    ctx.fillStyle =
        "rgba(245, 250, 255, 0.90)";

    for (let i = 0; i < count; i++) {

        const seed = hash2D(

            i,

            2002,

            this.seed

        );

        const startX =
            seed % screenWidth;

        const startY =
            (seed >>> 8) % screenHeight;

        const speed =
            12 + seed % 18;

        const drift =

            Math.sin(
                time + i * 0.7
            ) * 5;

        const x = (

            startX +

            drift +

            time *

            this.windDirection *

            this.windStrength * 8 +

            screenWidth * 100

        ) % screenWidth;

        const y = (

            startY +

            time * speed

        ) % screenHeight;

        const size =
            seed % 6 === 0 ? 2 : 1;

        ctx.fillRect(

            Math.floor(x),

            Math.floor(y),

            size,

            size

        );

    }

    ctx.restore();

};


// =====================================================
// DESENHAR NEBLINA
// =====================================================

World.prototype.drawFog = function (
    ctx,
    screenWidth,
    screenHeight,
    intensity = 1
) {

    const time =
        this.environmentTime;

    ctx.save();

    ctx.fillStyle =

        `rgba(205, 215, 210, ${0.12 * intensity})`;

    ctx.fillRect(

        0,

        0,

        screenWidth,

        screenHeight

    );

    for (let i = 0; i < 7; i++) {

        const offset = (

            time * (2 + i) +

            i * 53

        ) % (screenWidth + 100);

        const x =
            offset - 50;

        const y =
            15 + i * 26;

        ctx.fillStyle =

            `rgba(220, 230, 220, ${0.025 * intensity})`;

        ctx.fillRect(

            x,

            y,

            90,

            18

        );

    }

    ctx.restore();

};


// =====================================================
// DESENHAR PARTÍCULAS DE VENTO
// =====================================================

World.prototype.drawWind = function (
    ctx,
    screenWidth,
    screenHeight,
    intensity = 1
) {

    const count = Math.floor(

        ENVIRONMENT_CONFIG.maximumWindParticles *

        intensity

    );

    const time =
        this.environmentTime;

    ctx.save();

    ctx.strokeStyle =
        "rgba(225, 235, 195, 0.45)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    for (let i = 0; i < count; i++) {

        const seed = hash2D(

            i,

            3003,

            this.seed

        );

        const startX =
            seed % screenWidth;

        const startY =
            (seed >>> 8) % screenHeight;

        const speed =
            15 + seed % 25;

        const x = (

            startX +

            time * speed *

            this.windDirection +

            screenWidth * 100

        ) % screenWidth;

        const y = startY;

        ctx.moveTo(

            Math.floor(x),

            Math.floor(y)

        );

        ctx.lineTo(

            Math.floor(

                x + this.windDirection * 6

            ),

            Math.floor(y)

        );

    }

    ctx.stroke();

    ctx.restore();

};


// =====================================================
// DESENHAR RELÂMPAGO
// =====================================================

World.prototype.drawLightning = function (
    ctx,
    screenWidth,
    screenHeight
) {

    if (
        this.lightningTimer <= 0
    ) {

        return;

    }

    const intensity = clamp(

        this.lightningTimer /

        ENVIRONMENT_CONFIG.lightningDuration,

        0,

        1

    );

    ctx.save();

    ctx.fillStyle =

        `rgba(230, 240, 255, ${intensity * 0.65})`;

    ctx.fillRect(

        0,

        0,

        screenWidth,

        screenHeight

    );

    ctx.restore();

};


// =====================================================
// DESENHAR CLIMA ATUAL
// =====================================================

World.prototype.drawWeather = function (
    ctx,
    screenWidth,
    screenHeight
) {

    this.initializeEnvironment();

    const intensity =
        this.weatherBlend;

    switch (this.currentWeather) {

        case WEATHER_TYPES.RAIN:

            this.drawRain(

                ctx,

                screenWidth,

                screenHeight,

                intensity

            );

            break;

        case WEATHER_TYPES.STORM:

            this.drawRain(

                ctx,

                screenWidth,

                screenHeight,

                intensity

            );

            this.drawFog(

                ctx,

                screenWidth,

                screenHeight,

                0.35

            );

            this.drawLightning(

                ctx,

                screenWidth,

                screenHeight

            );

            break;

        case WEATHER_TYPES.SNOW:

            this.drawSnow(

                ctx,

                screenWidth,

                screenHeight,

                intensity

            );

            break;

        case WEATHER_TYPES.FOG:

            this.drawFog(

                ctx,

                screenWidth,

                screenHeight,

                intensity

            );

            break;

        case WEATHER_TYPES.WIND:

            this.drawWind(

                ctx,

                screenWidth,

                screenHeight,

                intensity

            );

            break;

        case WEATHER_TYPES.CLOUDY:

            this.drawFog(

                ctx,

                screenWidth,

                screenHeight,

                0.20

            );

            break;

        default:

            break;

    }

};


// =====================================================
// RENDERIZAR SISTEMA AMBIENTAL COMPLETO
// =====================================================

World.prototype.drawEnvironment = function (
    ctx,
    screenWidth,
    screenHeight
) {

    this.initializeEnvironment();

    ctx.save();

    // ---------------------------------------------
    // ILUMINAÇÃO
    // ---------------------------------------------

    this.drawAmbientLighting(

        ctx,

        screenWidth,

        screenHeight

    );

    // ---------------------------------------------
    // AMANHECER
    // ---------------------------------------------

    this.drawDawnTint(

        ctx,

        screenWidth,

        screenHeight

    );

    // ---------------------------------------------
    // ENTARDECER
    // ---------------------------------------------

    this.drawDuskTint(

        ctx,

        screenWidth,

        screenHeight

    );

    // ---------------------------------------------
    // CLIMA
    // ---------------------------------------------

    this.drawWeather(

        ctx,

        screenWidth,

        screenHeight

    );

    ctx.restore();

};


// =====================================================
// OBTENÇÃO DE DADOS AMBIENTAIS
// =====================================================

World.prototype.getEnvironmentState = function () {

    this.initializeEnvironment();

    return {

        time: this.time,

        formattedTime:
            this.getFormattedTime(),

        dayPhase:
            this.getDayPhase(),

        weather:
            this.currentWeather,

        previousWeather:
            this.previousWeather,

        windStrength:
            this.windStrength,

        windDirection:
            this.windDirection,

        ambientLight:
            this.ambientLight,

        region:
            this.weatherRegion

    };

};


/*
========================================================
ZELDA PIXEL ADVENTURE
WORLD ENGINE — BETA 3

BLOCO 5 — MAPA E NAVEGAÇÃO

Sistemas:

- Minimapa
- Mapa ampliado
- Regiões descobertas
- Monumentos
- Localização do jogador
- Objetivos de exploração
- Indicadores de direção
- Informações do bioma
- Relógio
- Condições climáticas
- Interface pixelada

========================================================
*/


// =====================================================
// CONFIGURAÇÕES DO MAPA
// =====================================================

const WORLD_MAP_CONFIG = Object.freeze({

    minimapWidth: 72,

    minimapHeight: 58,

    minimapMargin: 5,

    expandedMargin: 8,

    expandedPadding: 8,

    playerMarkerSize: 3,

    landmarkMarkerSize: 2,

    mapBackground: "#17251d",

    mapBorder: "#d8bf79",

    mapShadow: "#101810",

    undiscoveredColor: "#101710",

    objectiveColor: "#f4dc65",

    playerColor: "#ffffff"

});


// =====================================================
// INICIALIZAR SISTEMA DE MAPA
// =====================================================

World.prototype.initializeMapSystem = function () {

    if (this.mapInitialized) {

        return;

    }

    this.mapInitialized = true;

    this.mapOpen = false;

    this.mapPlayerX =
        this.width / 2;

    this.mapPlayerY =
        this.height / 2;

    this.mapObjective = null;

    this.mapVisible = true;

};


// =====================================================
// DEFINIR POSIÇÃO DO JOGADOR NO MAPA
// =====================================================

World.prototype.setMapPlayerPosition = function (
    x,
    y
) {

    this.initializeMapSystem();

    if (
        !Number.isFinite(x) ||
        !Number.isFinite(y)
    ) {

        return;

    }

    this.mapPlayerX = clamp(

        x,

        0,

        this.width

    );

    this.mapPlayerY = clamp(

        y,

        0,

        this.height

    );

};


// =====================================================
// ABRIR OU FECHAR MAPA
// =====================================================

World.prototype.toggleMap = function () {

    this.initializeMapSystem();

    this.mapOpen =
        !this.mapOpen;

    return this.mapOpen;

};


// =====================================================
// DEFINIR ESTADO DO MAPA
// =====================================================

World.prototype.setMapOpen = function (
    open
) {

    this.initializeMapSystem();

    this.mapOpen =
        Boolean(open);

};


// =====================================================
// DEFINIR OBJETIVO
// =====================================================

World.prototype.setMapObjective = function (
    x,
    y,
    name = "Objetivo"
) {

    this.initializeMapSystem();

    if (
        !Number.isFinite(x) ||
        !Number.isFinite(y)
    ) {

        return false;

    }

    if (
        !this.isInsideWorld(x, y)
    ) {

        return false;

    }

    this.mapObjective = {

        x,

        y,

        name

    };

    return true;

};


// =====================================================
// REMOVER OBJETIVO
// =====================================================

World.prototype.clearMapObjective = function () {

    this.initializeMapSystem();

    this.mapObjective = null;

};


// =====================================================
// OBJETIVO MAIS PRÓXIMO
// =====================================================

World.prototype.findExplorationObjective = function (
    playerX,
    playerY
) {

    this.initializeExploration();

    let nearest = null;

    let bestDistance = Infinity;

    // ---------------------------------------------
    // MONUMENTOS NÃO DESCOBERTOS
    // ---------------------------------------------

    for (const landmark of this.landmarks) {

        if (landmark.discovered) {

            continue;

        }

        const x =
            landmark.x + landmark.w / 2;

        const y =
            landmark.y + landmark.h / 2;

        const currentDistance = distance(

            playerX,

            playerY,

            x,

            y

        );

        if (
            currentDistance < bestDistance
        ) {

            bestDistance =
                currentDistance;

            nearest = {

                x,

                y,

                name:
                    landmark.name ||
                    "Monumento"

            };

        }

    }

    // ---------------------------------------------
    // BAÚS NÃO ABERTOS
    // ---------------------------------------------

    for (
        const chest of
        this.getObjectsByType(TYPES.CHEST)
    ) {

        if (chest.opened) {

            continue;

        }

        const x =
            chest.x + chest.w / 2;

        const y =
            chest.y + chest.h / 2;

        const currentDistance = distance(

            playerX,

            playerY,

            x,

            y

        );

        if (
            currentDistance < bestDistance
        ) {

            bestDistance =
                currentDistance;

            nearest = {

                x,

                y,

                name: "Baú"

            };

        }

    }

    return nearest;

};


// =====================================================
// DEFINIR OBJETIVO AUTOMÁTICO
// =====================================================

World.prototype.updateMapObjective = function () {

    this.initializeMapSystem();

    if (this.mapObjective) {

        const currentDistance = distance(

            this.mapPlayerX,

            this.mapPlayerY,

            this.mapObjective.x,

            this.mapObjective.y

        );

        if (
            currentDistance > 20
        ) {

            return;

        }

    }

    this.mapObjective =
        this.findExplorationObjective(

            this.mapPlayerX,

            this.mapPlayerY

        );

};


// =====================================================
// CONVERTER COORDENADAS DO MUNDO PARA MAPA
// =====================================================

World.prototype.worldToMap = function (
    worldX,
    worldY,
    mapX,
    mapY,
    mapWidth,
    mapHeight
) {

    return {

        x: mapX +
            worldX / this.width *
            mapWidth,

        y: mapY +
            worldY / this.height *
            mapHeight

    };

};


// =====================================================
// OBTER COR DE UMA REGIÃO NO MAPA
// =====================================================

World.prototype.getMapRegionColor = function (
    worldX,
    worldY
) {

    const region = this.region(

        worldX,

        worldY

    );

    const data =
        BIOME_DATA[region];

    return data
        ? data.color
        : "#6c9b55";

};


// =====================================================
// DESENHAR FUNDO DO MAPA
// =====================================================

World.prototype.drawMapBackground = function (
    ctx,
    x,
    y,
    width,
    height
) {

    ctx.fillStyle =
        WORLD_MAP_CONFIG.mapShadow;

    ctx.fillRect(

        x + 2,

        y + 2,

        width,

        height

    );

    ctx.fillStyle =
        WORLD_MAP_CONFIG.mapBackground;

    ctx.fillRect(

        x,

        y,

        width,

        height

    );

    ctx.strokeStyle =
        WORLD_MAP_CONFIG.mapBorder;

    ctx.lineWidth = 1;

    ctx.strokeRect(

        x + 0.5,

        y + 0.5,

        width - 1,

        height - 1

    );

};


// =====================================================
// DESENHAR REGIÕES NO MAPA
// =====================================================

World.prototype.drawMapRegions = function (
    ctx,
    x,
    y,
    width,
    height,
    revealAll = false
) {

    const stepX =
        width / SECTOR_COUNT;

    const stepY =
        height / SECTOR_COUNT;

    for (
        let sy = 0;
        sy < SECTOR_COUNT;
        sy++
    ) {

        for (
            let sx = 0;
            sx < SECTOR_COUNT;
            sx++
        ) {

            const worldX =

                (
                    sx + 0.5
                ) * SECTOR_WIDTH;

            const worldY =

                (
                    sy + 0.5
                ) * SECTOR_HEIGHT;

            const sector =
                this.getSector(

                    worldX,

                    worldY

                );

            const discovered =

                revealAll ||

                (
                    sector &&
                    sector.discovered
                );

            ctx.fillStyle =
                discovered

                    ? this.getMapRegionColor(

                        worldX,

                        worldY

                    )

                    : WORLD_MAP_CONFIG
                        .undiscoveredColor;

            ctx.fillRect(

                Math.floor(
                    x + sx * stepX
                ),

                Math.floor(
                    y + sy * stepY
                ),

                Math.ceil(stepX),

                Math.ceil(stepY)

            );

        }

    }

};


// =====================================================
// DESENHAR MARCADOR DO JOGADOR
// =====================================================

World.prototype.drawMapPlayer = function (
    ctx,
    x,
    y,
    width,
    height,
    size = 3
) {

    const position =
        this.worldToMap(

            this.mapPlayerX,

            this.mapPlayerY,

            x,

            y,

            width,

            height

        );

    const px =
        Math.round(position.x);

    const py =
        Math.round(position.y);

    // ---------------------------------------------
    // CONTORNO
    // ---------------------------------------------

    ctx.fillStyle = "#183026";

    ctx.fillRect(

        px - size,

        py - size,

        size * 2 + 1,

        size * 2 + 1

    );

    // ---------------------------------------------
    // MARCADOR
    // ---------------------------------------------

    ctx.fillStyle =
        WORLD_MAP_CONFIG.playerColor;

    ctx.fillRect(

        px - size + 1,

        py - size + 1,

        size * 2 - 1,

        size * 2 - 1

    );

    // ---------------------------------------------
    // CENTRO
    // ---------------------------------------------

    ctx.fillStyle = "#e64a42";

    ctx.fillRect(

        px,

        py,

        1,

        1

    );

};


// =====================================================
// DESENHAR MARCADORES DE MONUMENTOS
// =====================================================

World.prototype.drawMapLandmarks = function (
    ctx,
    x,
    y,
    width,
    height
) {

    this.initializeExploration();

    for (const landmark of this.landmarks) {

        if (!landmark.discovered) {

            continue;

        }

        const worldX =
            landmark.x + landmark.w / 2;

        const worldY =
            landmark.y + landmark.h / 2;

        const position =
            this.worldToMap(

                worldX,

                worldY,

                x,

                y,

                width,

                height

            );

        const px =
            Math.round(position.x);

        const py =
            Math.round(position.y);

        ctx.fillStyle = "#312d25";

        ctx.fillRect(

            px - 2,

            py - 2,

            5,

            5

        );

        ctx.fillStyle = "#f4dc65";

        ctx.fillRect(

            px - 1,

            py - 1,

            3,

            3

        );

    }

};


// =====================================================
// DESENHAR MARCADOR DE OBJETIVO
// =====================================================

World.prototype.drawMapObjective = function (
    ctx,
    x,
    y,
    width,
    height
) {

    if (!this.mapObjective) {

        return;

    }

    const position =
        this.worldToMap(

            this.mapObjective.x,

            this.mapObjective.y,

            x,

            y,

            width,

            height

        );

    const px =
        Math.round(position.x);

    const py =
        Math.round(position.y);

    const pulse =

        Math.floor(
            this.environmentTime * 3
        ) % 2;

    const size =
        pulse === 0 ? 2 : 3;

    ctx.strokeStyle =
        WORLD_MAP_CONFIG.objectiveColor;

    ctx.strokeRect(

        px - size + 0.5,

        py - size + 0.5,

        size * 2,

        size * 2

    );

};


// =====================================================
// DESENHAR MINIMAPA
// =====================================================

World.prototype.drawMinimap = function (
    ctx,
    screenWidth,
    screenHeight
) {

    this.initializeMapSystem();

    if (!this.mapVisible) {

        return;

    }

    const width =
        WORLD_MAP_CONFIG.minimapWidth;

    const height =
        WORLD_MAP_CONFIG.minimapHeight;

    const margin =
        WORLD_MAP_CONFIG.minimapMargin;

    const x =
        screenWidth - width - margin;

    const y =
        screenHeight - height - margin;

    // ---------------------------------------------
    // FUNDO
    // ---------------------------------------------

    this.drawMapBackground(

        ctx,

        x,

        y,

        width,

        height

    );

    // ---------------------------------------------
    // ÁREA INTERNA
    // ---------------------------------------------

    const innerX = x + 4;

    const innerY = y + 4;

    const innerWidth = width - 8;

    const innerHeight = height - 8;

    ctx.save();

    ctx.beginPath();

    ctx.rect(

        innerX,

        innerY,

        innerWidth,

        innerHeight

    );

    ctx.clip();

    // ---------------------------------------------
    // REGIÕES
    // ---------------------------------------------

    this.drawMapRegions(

        ctx,

        innerX,

        innerY,

        innerWidth,

        innerHeight

    );

    // ---------------------------------------------
    // MONUMENTOS
    // ---------------------------------------------

    this.drawMapLandmarks(

        ctx,

        innerX,

        innerY,

        innerWidth,

        innerHeight

    );

    // ---------------------------------------------
    // OBJETIVO
    // ---------------------------------------------

    this.drawMapObjective(

        ctx,

        innerX,

        innerY,

        innerWidth,

        innerHeight

    );

    // ---------------------------------------------
    // JOGADOR
    // ---------------------------------------------

    this.drawMapPlayer(

        ctx,

        innerX,

        innerY,

        innerWidth,

        innerHeight

    );

    ctx.restore();

};


// =====================================================
// DESENHAR MAPA AMPLIADO
// =====================================================

World.prototype.drawExpandedMap = function (
    ctx,
    screenWidth,
    screenHeight
) {

    this.initializeMapSystem();

    if (!this.mapOpen) {

        return;

    }

    ctx.save();

    // ---------------------------------------------
    // ESCURECER CENÁRIO
    // ---------------------------------------------

    ctx.fillStyle =
        "rgba(0, 0, 0, 0.85)";

    ctx.fillRect(

        0,

        0,

        screenWidth,

        screenHeight

    );

    // ---------------------------------------------
    // DIMENSÕES
    // ---------------------------------------------

    const margin =
        WORLD_MAP_CONFIG.expandedMargin;

    const x = margin;

    const y = margin;

    const width =
        screenWidth - margin * 2;

    const height =
        screenHeight - margin * 2;

    // ---------------------------------------------
    // PAINEL
    // ---------------------------------------------

    this.drawMapBackground(

        ctx,

        x,

        y,

        width,

        height

    );

    // ---------------------------------------------
    // TÍTULO
    // ---------------------------------------------

    ctx.fillStyle = "#f4e4af";

    ctx.font = "8px monospace";

    ctx.fillText(

        "MAPA DO MUNDO",

        x + 10,

        y + 12

    );

    // ---------------------------------------------
    // ÁREA DO MAPA
    // ---------------------------------------------

    const mapX = x + 10;

    const mapY = y + 20;

    const mapWidth =

        Math.max(
            20,
            width - 115
        );

    const mapHeight =

        Math.max(
            20,
            height - 30
        );

    ctx.save();

    ctx.beginPath();

    ctx.rect(

        mapX,

        mapY,

        mapWidth,

        mapHeight

    );

    ctx.clip();

    // ---------------------------------------------
    // REGIÕES
    // ---------------------------------------------

    this.drawMapRegions(

        ctx,

        mapX,

        mapY,

        mapWidth,

        mapHeight

    );

    // ---------------------------------------------
    // MONUMENTOS
    // ---------------------------------------------

    this.drawMapLandmarks(

        ctx,

        mapX,

        mapY,

        mapWidth,

        mapHeight

    );

    // ---------------------------------------------
    // OBJETIVO
    // ---------------------------------------------

    this.drawMapObjective(

        ctx,

        mapX,

        mapY,

        mapWidth,

        mapHeight

    );

    // ---------------------------------------------
    // JOGADOR
    // ---------------------------------------------

    this.drawMapPlayer(

        ctx,

        mapX,

        mapY,

        mapWidth,

        mapHeight,

        3

    );

    ctx.restore();

    // ---------------------------------------------
    // INFORMAÇÕES DO JOGADOR
    // ---------------------------------------------

    const infoX =
        mapX + mapWidth + 8;

    const infoY =
        mapY + 5;

    ctx.fillStyle = "#f4e4af";

    ctx.font = "7px monospace";

    ctx.fillText(

        "REGIAO:",

        infoX,

        infoY

    );

    ctx.fillText(

        this.region(

            this.mapPlayerX,

            this.mapPlayerY

        ),

        infoX,

        infoY + 11

    );

    ctx.fillText(

        "HORA:",

        infoX,

        infoY + 29

    );

    ctx.fillText(

        this.getFormattedTime(),

        infoX,

        infoY + 40

    );

    ctx.fillText(

        "CLIMA:",

        infoX,

        infoY + 58

    );

    ctx.fillText(

        this.currentWeather ||
            WEATHER_TYPES.CLEAR,

        infoX,

        infoY + 69

    );

    // ---------------------------------------------
    // PROGRESSO DE EXPLORAÇÃO
    // ---------------------------------------------

    const discovered =
        this.getDiscoveredSectorCount();

    const percentage = Math.floor(

        discovered /

        TOTAL_SECTORS * 100

    );

    ctx.fillText(

        "EXPLORADO:",

        infoX,

        infoY + 87

    );

    ctx.fillText(

        percentage + "%",

        infoX,

        infoY + 98

    );

    ctx.restore();

};


// =====================================================
// INDICADOR DE DIREÇÃO DO OBJETIVO
// =====================================================

World.prototype.drawObjectiveIndicator = function (
    ctx,
    screenWidth,
    screenHeight
) {

    if (!this.mapObjective) {

        return;

    }

    const dx =

        this.mapObjective.x -

        this.mapPlayerX;

    const dy =

        this.mapObjective.y -

        this.mapPlayerY;

    const objectiveDistance =
        Math.hypot(

            dx,

            dy

        );

    if (objectiveDistance < 20) {

        return;

    }

    const angle =
        Math.atan2(

            dy,

            dx

        );

    // ---------------------------------------------
    // POSIÇÃO DO INDICADOR
    // ---------------------------------------------

    const centerX =
        screenWidth / 2;

    const centerY =
        screenHeight / 2;

    const radius = Math.min(

        screenWidth,

        screenHeight

    ) * 0.32;

    const x =

        centerX +

        Math.cos(angle) * radius;

    const y =

        centerY +

        Math.sin(angle) * radius;

    // ---------------------------------------------
    // DESENHAR SETA
    // ---------------------------------------------

    ctx.save();

    ctx.translate(

        x,

        y

    );

    ctx.rotate(
        angle
    );

    ctx.fillStyle = "#f4dc65";

    ctx.beginPath();

    ctx.moveTo(
        6,
        0
    );

    ctx.lineTo(
        -4,
        -4
    );

    ctx.lineTo(
        -4,
        4
    );

    ctx.closePath();

    ctx.fill();

    ctx.restore();

};


// =====================================================
// DESENHAR INFORMAÇÕES AMBIENTAIS
// =====================================================

World.prototype.drawEnvironmentHUD = function (
    ctx,
    screenWidth,
    screenHeight
) {

    this.initializeEnvironment();

    const x = 6;

    const y = screenHeight - 25;

    // ---------------------------------------------
    // PAINEL
    // ---------------------------------------------

    ctx.fillStyle =
        "rgba(18, 32, 24, 0.85)";

    ctx.fillRect(

        x,

        y,

        112,

        19

    );

    ctx.strokeStyle = "#d8bf79";

    ctx.strokeRect(

        x + 0.5,

        y + 0.5,

        111,

        18

    );

    ctx.fillStyle = "#f4e4af";

    ctx.font = "7px monospace";

    // ---------------------------------------------
    // HORÁRIO
    // ---------------------------------------------

    ctx.fillText(

        this.getFormattedTime(),

        x + 5,

        y + 8

    );

    // ---------------------------------------------
    // CLIMA
    // ---------------------------------------------

    ctx.fillText(

        this.currentWeather,

        x + 39,

        y + 8

    );

    // ---------------------------------------------
    // REGIÃO
    // ---------------------------------------------

    ctx.fillText(

        this.region(

            this.mapPlayerX,

            this.mapPlayerY

        ),

        x + 5,

        y + 16

    );

};


// =====================================================
// ATUALIZAR SISTEMA DE MAPA
// =====================================================

World.prototype.updateMap = function (
    player
) {

    if (!player) {

        return;

    }

    this.initializeMapSystem();

    const playerX =

        player.x +

        (player.width || 0) / 2;

    const playerY =

        player.y +

        (player.height || 0) / 2;

    // ---------------------------------------------
    // POSIÇÃO NO MAPA
    // ---------------------------------------------

    this.setMapPlayerPosition(

        playerX,

        playerY

    );

    // ---------------------------------------------
    // EXPLORAÇÃO
    // ---------------------------------------------

    this.updateExploration(
        player
    );

    // ---------------------------------------------
    // OBJETIVO
    // ---------------------------------------------

    this.updateMapObjective();

};


// =====================================================
// RENDERIZAR INTERFACE DE EXPLORAÇÃO
// =====================================================

World.prototype.drawExplorationUI = function (
    ctx,
    screenWidth,
    screenHeight
) {

    this.initializeMapSystem();

    // ---------------------------------------------
    // MINIMAPA
    // ---------------------------------------------

    if (!this.mapOpen) {

        this.drawMinimap(

            ctx,

            screenWidth,

            screenHeight

        );

        // -----------------------------------------
        // OBJETIVO
        // -----------------------------------------

        this.drawObjectiveIndicator(

            ctx,

            screenWidth,

            screenHeight

        );

        // -----------------------------------------
        // INFORMAÇÕES AMBIENTAIS
        // -----------------------------------------

        this.drawEnvironmentHUD(

            ctx,

            screenWidth,

            screenHeight

        );

    }

    // ---------------------------------------------
    // MAPA AMPLIADO
    // ---------------------------------------------

    else {

        this.drawExpandedMap(

            ctx,

            screenWidth,

            screenHeight

        );

    }

};


/*
========================================================
ZELDA PIXEL ADVENTURE
WORLD ENGINE — BETA 3

BLOCO 6 — SISTEMAS FINAIS DO MUNDO

FUNCIONALIDADES:

- Gerenciamento de missões de exploração
- Objetivos e recompensas
- Pontos de interesse
- Interação com monumentos
- Descoberta de locais
- Efeitos ambientais por bioma
- Consulta de objetos sólidos
- Detecção de obstáculos
- Posicionamento seguro
- Gerenciamento de estados do mundo
- Salvamento complementar
- Diagnóstico e depuração
- Atualização unificada
- Renderização unificada
- Inicialização final da engine

========================================================
*/


// =====================================================
// CONFIGURAÇÕES FINAIS
// =====================================================

const WORLD_FINAL_CONFIG = Object.freeze({

    version: "3.0.0-beta",

    questLimit: 100,

    interactionRadius: 45,

    safeSpawnRadius: 1024,

    collisionProbeDistance: 128,

    debugGridSize: 32,

    notificationDuration: 4

});


// =====================================================
// TIPOS DE MISSÃO
// =====================================================

const WORLD_QUEST_TYPES = Object.freeze({

    DISCOVER_REGION: "DISCOVER_REGION",

    DISCOVER_LANDMARK: "DISCOVER_LANDMARK",

    OPEN_CHEST: "OPEN_CHEST",

    EXPLORE_SECTORS: "EXPLORE_SECTORS",

    REACH_LOCATION: "REACH_LOCATION"

});


// =====================================================
// ESTADOS DAS MISSÕES
// =====================================================

const WORLD_QUEST_STATES = Object.freeze({

    LOCKED: "LOCKED",

    AVAILABLE: "AVAILABLE",

    ACTIVE: "ACTIVE",

    COMPLETED: "COMPLETED",

    REWARDED: "REWARDED"

});


// =====================================================
// SISTEMA DE MISSÕES
// =====================================================

World.prototype.initializeQuestSystem = function () {

    if (this.questSystemInitialized) {

        return;

    }

    this.questSystemInitialized = true;

    this.quests = new Map();

    this.activeQuestId = null;

    this.completedQuests = new Set();

    this.questFlags = new Map();

    this.initializeExploration();

};


// =====================================================
// REGISTRAR MISSÃO
// =====================================================

World.prototype.registerQuest = function (
    definition
) {

    this.initializeQuestSystem();

    if (
        !definition ||
        typeof definition.id !== "string" ||
        definition.id.length === 0
    ) {

        return false;

    }

    if (
        this.quests.has(definition.id)
    ) {

        return false;

    }

    if (
        this.quests.size >=
        WORLD_FINAL_CONFIG.questLimit
    ) {

        return false;

    }

    const quest = {

        id: definition.id,

        title:
            definition.title ||
            "Missão desconhecida",

        description:
            definition.description ||
            "",

        type:
            definition.type ||
            WORLD_QUEST_TYPES.REACH_LOCATION,

        target:
            definition.target || null,

        required:
            Math.max(
                1,
                definition.required || 1
            ),

        progress: 0,

        state:
            WORLD_QUEST_STATES.AVAILABLE,

        reward:
            definition.reward || null

    };

    this.quests.set(
        quest.id,
        quest
    );

    return true;

};


// =====================================================
// INICIAR MISSÃO
// =====================================================

World.prototype.startQuest = function (
    questId
) {

    this.initializeQuestSystem();

    const quest =
        this.quests.get(questId);

    if (!quest) {

        return false;

    }

    if (
        quest.state !==
        WORLD_QUEST_STATES.AVAILABLE
    ) {

        return false;

    }

    quest.state =
        WORLD_QUEST_STATES.ACTIVE;

    this.activeQuestId =
        quest.id;

    this.notify(

        "Nova missão: " + quest.title,

        WORLD_FINAL_CONFIG.notificationDuration

    );

    return true;

};


// =====================================================
// CONSULTAR MISSÃO
// =====================================================

World.prototype.getQuest = function (
    questId
) {

    this.initializeQuestSystem();

    return this.quests.get(questId) || null;

};


// =====================================================
// OBTER MISSÃO ATIVA
// =====================================================

World.prototype.getActiveQuest = function () {

    this.initializeQuestSystem();

    if (!this.activeQuestId) {

        return null;

    }

    return this.getQuest(
        this.activeQuestId
    );

};


// =====================================================
// ATUALIZAR PROGRESSO
// =====================================================

World.prototype.addQuestProgress = function (
    questId,
    amount = 1
) {

    const quest =
        this.getQuest(questId);

    if (!quest) {

        return false;

    }

    if (
        quest.state !==
        WORLD_QUEST_STATES.ACTIVE
    ) {

        return false;

    }

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        return false;

    }

    quest.progress = Math.min(

        quest.required,

        quest.progress + amount

    );

    if (
        quest.progress >= quest.required
    ) {

        this.completeQuest(
            questId
        );

    }

    return true;

};


// =====================================================
// CONCLUIR MISSÃO
// =====================================================

World.prototype.completeQuest = function (
    questId
) {

    const quest =
        this.getQuest(questId);

    if (!quest) {

        return false;

    }

    if (
        quest.state !==
        WORLD_QUEST_STATES.ACTIVE
    ) {

        return false;

    }

    quest.progress =
        quest.required;

    quest.state =
        WORLD_QUEST_STATES.COMPLETED;

    this.completedQuests.add(
        quest.id
    );

    if (
        this.activeQuestId === quest.id
    ) {

        this.activeQuestId = null;

    }

    this.notify(

        "Missão concluída: " +
        quest.title,

        5

    );

    return true;

};


// =====================================================
// RECEBER RECOMPENSA
// =====================================================

World.prototype.claimQuestReward = function (
    questId,
    inventory = null
) {

    const quest =
        this.getQuest(questId);

    if (!quest) {

        return false;

    }

    if (
        quest.state !==
        WORLD_QUEST_STATES.COMPLETED
    ) {

        return false;

    }

    if (
        quest.reward &&
        (
            !inventory ||
            typeof inventory.addItem !== "function"
        )
    ) {

        return false;

    }

    if (quest.reward) {

        inventory.addItem({

            ...quest.reward

        });

    }

    quest.state =
        WORLD_QUEST_STATES.REWARDED;

    this.notify(

        "Recompensa recebida!",

        3

    );

    return true;

};


// =====================================================
// LISTAR MISSÕES
// =====================================================

World.prototype.getQuestList = function (
    state = null
) {

    this.initializeQuestSystem();

    const quests = [

        ...this.quests.values()

    ];

    if (!state) {

        return quests;

    }

    return quests.filter(

        quest => quest.state === state

    );

};


// =====================================================
// GERAR MISSÕES DE EXPLORAÇÃO
// =====================================================

World.prototype.generateExplorationQuests =
function () {

    this.initializeQuestSystem();

    // ---------------------------------------------
    // MISSÃO INICIAL
    // ---------------------------------------------

    this.registerQuest({

        id: "explore_first_region",

        title: "Primeiros Passos",

        description:
            "Descubra uma região do mundo.",

        type:
            WORLD_QUEST_TYPES.DISCOVER_REGION,

        required: 1,

        reward: {

            id: "exploration_coins",

            name: "Moedas",

            type: "currency",

            quantity: 20

        }

    });

    // ---------------------------------------------
    // EXPLORAÇÃO DE SETORES
    // ---------------------------------------------

    this.registerQuest({

        id: "explore_ten_sectors",

        title: "Cartógrafo Iniciante",

        description:
            "Explore dez setores do mapa.",

        type:
            WORLD_QUEST_TYPES.EXPLORE_SECTORS,

        required: 10,

        reward: {

            id: "cartographer_reward",

            name: "Moedas",

            type: "currency",

            quantity: 100

        }

    });

    // ---------------------------------------------
    // DESCOBERTA DE MONUMENTOS
    // ---------------------------------------------

    this.registerQuest({

        id: "discover_three_landmarks",

        title: "Segredos Antigos",

        description:
            "Descubra três monumentos.",

        type:
            WORLD_QUEST_TYPES.DISCOVER_LANDMARK,

        required: 3,

        reward: {

            id: "ancient_fragment",

            name: "Fragmento Antigo",

            type: "material",

            quantity: 1

        }

    });

    // ---------------------------------------------
    // ABRIR BAÚS
    // ---------------------------------------------

    this.registerQuest({

        id: "open_five_chests",

        title: "Caçador de Tesouros",

        description:
            "Encontre e abra cinco baús.",

        type:
            WORLD_QUEST_TYPES.OPEN_CHEST,

        required: 5,

        reward: {

            id: "treasure_reward",

            name: "Moedas",

            type: "currency",

            quantity: 150

        }

    });

};


// =====================================================
// CONTAR PROGRESSO DAS MISSÕES
// =====================================================

World.prototype.getQuestProgress = function (
    quest
) {

    if (!quest) {

        return 0;

    }

    this.initializeExploration();

    switch (quest.type) {

        case WORLD_QUEST_TYPES.DISCOVER_REGION:

            return this.discoveredRegions.size;

        case WORLD_QUEST_TYPES.DISCOVER_LANDMARK:

            return this.discoveredLandmarks.size;

        case WORLD_QUEST_TYPES.OPEN_CHEST:

            return this.openedChests.size;

        case WORLD_QUEST_TYPES.EXPLORE_SECTORS:

            return this.getDiscoveredSectorCount();

        case WORLD_QUEST_TYPES.REACH_LOCATION:

            if (!quest.target) {

                return 0;

            }

            return distance(

                this.mapPlayerX,

                this.mapPlayerY,

                quest.target.x,

                quest.target.y

            ) <= (
                quest.target.radius || 30
            )
                ? quest.required
                : 0;

        default:

            return quest.progress;

    }

};


// =====================================================
// ATUALIZAR MISSÕES
// =====================================================

World.prototype.updateQuests = function () {

    this.initializeQuestSystem();

    for (
        const quest of
        this.quests.values()
    ) {

        if (
            quest.state !==
            WORLD_QUEST_STATES.ACTIVE
        ) {

            continue;

        }

        const progress =
            this.getQuestProgress(quest);

        quest.progress = clamp(

            progress,

            0,

            quest.required

        );

        if (
            quest.progress >=
            quest.required
        ) {

            this.completeQuest(
                quest.id
            );

        }

    }

};


// =====================================================
// SISTEMA DE BANDEIRAS DO MUNDO
// =====================================================

World.prototype.setWorldFlag = function (
    key,
    value
) {

    this.initializeQuestSystem();

    if (
        typeof key !== "string" ||
        key.length === 0
    ) {

        return false;

    }

    const allowed = [

        "string",

        "number",

        "boolean"

    ];

    if (
        value !== null &&
        !allowed.includes(typeof value)
    ) {

        return false;

    }

    if (
        typeof value === "number" &&
        !Number.isFinite(value)
    ) {

        return false;

    }

    this.questFlags.set(
        key,
        value
    );

    return true;

};


// =====================================================
// CONSULTAR BANDEIRA
// =====================================================

World.prototype.getWorldFlag = function (
    key,
    defaultValue = null
) {

    this.initializeQuestSystem();

    if (
        !this.questFlags.has(key)
    ) {

        return defaultValue;

    }

    return this.questFlags.get(key);

};


// =====================================================
// VERIFICAR BANDEIRA
// =====================================================

World.prototype.hasWorldFlag = function (
    key
) {

    this.initializeQuestSystem();

    return this.questFlags.has(
        key
    );

};


// =====================================================
// REMOVER BANDEIRA
// =====================================================

World.prototype.removeWorldFlag = function (
    key
) {

    this.initializeQuestSystem();

    return this.questFlags.delete(
        key
    );

};


// =====================================================
// CONDIÇÕES AMBIENTAIS DO PERSONAGEM
// =====================================================

World.prototype.getEnvironmentalModifiers =
function (
    x,
    y
) {

    const region =
        this.region(x, y);

    this.initializeEnvironment();

    const weather =
        this.currentWeather;

    const modifiers = {

        movementSpeed: 1,

        staminaRegeneration: 1,

        visibility: 1,

        temperature: 20,

        humidity: 0.5

    };

    const biome =
        BIOME_DATA[region];

    if (biome) {

        modifiers.temperature =
            biome.temperature;

        modifiers.humidity =
            biome.humidity;

    }

    // ---------------------------------------------
    // EFEITOS DAS REGIÕES
    // ---------------------------------------------

    switch (region) {

        case REGIONS.MOUNTAINS:

            modifiers.movementSpeed *= 0.85;

            modifiers.staminaRegeneration *= 0.9;

            break;

        case REGIONS.DESERT:

            modifiers.staminaRegeneration *= 0.75;

            break;

        case REGIONS.SNOW:

            modifiers.movementSpeed *= 0.80;

            modifiers.staminaRegeneration *= 0.80;

            break;

        case REGIONS.FOREST:

            modifiers.visibility *= 0.85;

            break;

        default:

            break;

    }

    // ---------------------------------------------
    // EFEITOS DO CLIMA
    // ---------------------------------------------

    switch (weather) {

        case WEATHER_TYPES.RAIN:

            modifiers.movementSpeed *= 0.95;

            modifiers.visibility *= 0.90;

            break;

        case WEATHER_TYPES.STORM:

            modifiers.movementSpeed *= 0.85;

            modifiers.visibility *= 0.60;

            break;

        case WEATHER_TYPES.SNOW:

            modifiers.movementSpeed *= 0.90;

            modifiers.visibility *= 0.80;

            break;

        case WEATHER_TYPES.FOG:

            modifiers.visibility *= 0.45;

            break;

        default:

            break;

    }

    // ---------------------------------------------
    // EFEITOS DO PERÍODO NOTURNO
    // ---------------------------------------------

    if (
        this.getDayPhase() === "NIGHT"
    ) {

        modifiers.visibility *= 0.65;

    }

    return modifiers;

};


// =====================================================
// DETECTAR OBSTÁCULOS PRÓXIMOS
// =====================================================

World.prototype.getNearbyObstacles = function (
    x,
    y,
    radius = 64
) {

    if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(radius) ||
        radius <= 0
    ) {

        return [];

    }

    return this.near(

        x,

        y,

        radius

    ).filter(

        object => object.solid

    );

};


// =====================================================
// CONSULTAR DIREÇÕES LIVRES
// =====================================================

World.prototype.getFreeDirections = function (
    x,
    y,
    width = 12,
    height = 10,
    step = 16
) {

    const directions = {

        up: false,

        down: false,

        left: false,

        right: false

    };

    directions.up =
        this.canMove({

            x,

            y: y - step,

            w: width,

            h: height

        });

    directions.down =
        this.canMove({

            x,

            y: y + step,

            w: width,

            h: height

        });

    directions.left =
        this.canMove({

            x: x - step,

            y,

            w: width,

            h: height

        });

    directions.right =
        this.canMove({

            x: x + step,

            y,

            w: width,

            h: height

        });

    return directions;

};


// =====================================================
// ENCONTRAR POSIÇÃO SEGURA
// =====================================================

World.prototype.findSafePosition = function (
    x,
    y,
    width = 12,
    height = 10
) {

    if (
        this.canMove({

            x,

            y,

            w: width,

            h: height

        })
    ) {

        return {
            x,
            y
        };

    }

    return this.findNearestWalkable(

        x,

        y,

        width,

        height,

        WORLD_FINAL_CONFIG.safeSpawnRadius

    );

};


// =====================================================
// POSICIONAMENTO DO JOGADOR
// =====================================================

World.prototype.placePlayerSafely = function (
    player,
    preferredX = 2500,
    preferredY = 2500
) {

    if (!player) {

        return false;

    }

    const width =
        player.width || 12;

    const height =
        player.height || 10;

    const position =
        this.findSafePosition(

            preferredX,

            preferredY,

            width,

            height

        );

    if (!position) {

        return false;

    }

    player.x = position.x;

    player.y = position.y;

    return true;

};


// =====================================================
// CONSULTAR OBJETOS POR ID
// =====================================================

World.prototype.getObjectById = function (
    id
) {

    if (!Number.isInteger(id)) {

        return null;

    }

    // A busca por identificador continua válida
    // mesmo depois de remover objetos do array.

    return this.objects.find(

        object => object.id === id

    ) || null;

};


// =====================================================
// CRIAR IDENTIFICADOR ÚNICO
// =====================================================

World.prototype.getNextObjectId = function () {

    let maximum = -1;

    for (const object of this.objects) {

        if (
            Number.isInteger(object.id) &&
            object.id > maximum
        ) {

            maximum = object.id;

        }

    }

    return maximum + 1;

};


// =====================================================
// ADICIONAR OBJETO DINÂMICO
// =====================================================

World.prototype.addDynamicObject = function (
    type,
    x,
    y,
    width,
    height,
    solid = true,
    properties = {}
) {

    const object = this.add(

        type,

        x,

        y,

        width,

        height,

        solid,

        properties

    );

    if (!object) {

        return null;

    }

    // Corrigir identificador caso o mundo
    // tenha recebido remoções anteriormente.

    const originalId = object.id;

    if (
        this.objects.some(

            other =>
                other !== object &&
                other.id === originalId

        )
    ) {

        object.id =
            this.getNextObjectId();

    }

    return object;

};


// =====================================================
// ATUALIZAR OBJETOS ANIMADOS
// =====================================================

World.prototype.updateAnimatedObjects = function (
    deltaTime
) {

    if (
        !Number.isFinite(deltaTime) ||
        deltaTime <= 0
    ) {

        return;

    }

    // Atualizar apenas objetos próximos à câmera.

    const visible =
        this.getVisibleObjects(

            this.cameraX,

            this.cameraY,

            320,

            180,

            64

        );

    for (const object of visible) {

        if (
            !object.animated
        ) {

            continue;

        }

        if (
            !Number.isFinite(
                object.animationTime
            )
        ) {

            object.animationTime = 0;

        }

        object.animationTime +=
            deltaTime;

        const frameDuration =
            object.frameDuration || 0.15;

        const frameCount =
            object.frameCount || 1;

        object.animationFrame =

            Math.floor(

                object.animationTime /
                frameDuration

            ) % frameCount;

    }

};


// =====================================================
// CONSULTAR ESTADO DE EXPLORAÇÃO
// =====================================================

World.prototype.getExplorationState = function () {

    this.initializeExploration();

    return {

        regions: [

            ...this.discoveredRegions

        ],

        landmarks: [

            ...this.discoveredLandmarks

        ],

        chests: [

            ...this.openedChests

        ],

        sectors:
            this.getDiscoveredSectorCount(),

        totalSectors:
            TOTAL_SECTORS,

        percentage: Math.floor(

            this.getDiscoveredSectorCount() /

            TOTAL_SECTORS * 100

        )

    };

};


// =====================================================
// ESTATÍSTICAS DE MISSÕES
// =====================================================

World.prototype.getQuestStatistics = function () {

    this.initializeQuestSystem();

    const result = {

        total: 0,

        available: 0,

        active: 0,

        completed: 0,

        rewarded: 0

    };

    for (
        const quest of this.quests.values()
    ) {

        result.total++;

        switch (quest.state) {

            case WORLD_QUEST_STATES.AVAILABLE:

                result.available++;

                break;

            case WORLD_QUEST_STATES.ACTIVE:

                result.active++;

                break;

            case WORLD_QUEST_STATES.COMPLETED:

                result.completed++;

                break;

            case WORLD_QUEST_STATES.REWARDED:

                result.rewarded++;

                break;

        }

    }

    return result;

};


// =====================================================
// SALVAMENTO COMPLEMENTAR DAS MISSÕES
// =====================================================

const originalWorldExportState =
    World.prototype.exportState;

World.prototype.exportState = function () {

    const state =
        originalWorldExportState.call(this);

    this.initializeQuestSystem();

    return {

        ...state,

        quests: [

            ...this.quests.values()

        ].map(

            quest => ({

                id: quest.id,

                state: quest.state,

                progress: quest.progress

            })

        ),

        activeQuestId:
            this.activeQuestId,

        worldFlags: [

            ...this.questFlags.entries()

        ],

        mapObjective:
            this.mapObjective
                ? {
                    ...this.mapObjective
                }
                : null

    };

};


// =====================================================
// RECUPERAÇÃO COMPLEMENTAR DAS MISSÕES
// =====================================================

const originalWorldImportState =
    World.prototype.importState;

World.prototype.importState = function (
    state
) {

    const success =
        originalWorldImportState.call(

            this,

            state

        );

    if (!success) {

        return false;

    }

    this.initializeQuestSystem();

    // ---------------------------------------------
    // RECUPERAR MISSÕES
    // ---------------------------------------------

    if (
        Array.isArray(state.quests)
    ) {

        for (
            const savedQuest of state.quests
        ) {

            const quest =
                this.quests.get(
                    savedQuest.id
                );

            if (!quest) {

                continue;

            }

            const validStates =
                Object.values(
                    WORLD_QUEST_STATES
                );

            if (
                validStates.includes(
                    savedQuest.state
                )
            ) {

                quest.state =
                    savedQuest.state;

            }

            if (
                Number.isFinite(
                    savedQuest.progress
                )
            ) {

                quest.progress = clamp(

                    savedQuest.progress,

                    0,

                    quest.required

                );

            }

        }

    }

    // ---------------------------------------------
    // RECUPERAR MISSÃO ATIVA
    // ---------------------------------------------

    if (
        typeof state.activeQuestId ===
        "string"
    ) {

        const active =
            this.quests.get(
                state.activeQuestId
            );

        if (
            active &&
            active.state ===
                WORLD_QUEST_STATES.ACTIVE
        ) {

            this.activeQuestId =
                active.id;

        }

    }

    // ---------------------------------------------
    // RECUPERAR BANDEIRAS
    // ---------------------------------------------

    if (
        Array.isArray(
            state.worldFlags
        )
    ) {

        this.questFlags = new Map();

        for (
            const entry of state.worldFlags
        ) {

            if (
                Array.isArray(entry) &&
                entry.length === 2
            ) {

                this.setWorldFlag(

                    entry[0],

                    entry[1]

                );

            }

        }

    }

    // ---------------------------------------------
    // RECUPERAR OBJETIVO DO MAPA
    // ---------------------------------------------

    if (
        state.mapObjective &&
        Number.isFinite(
            state.mapObjective.x
        ) &&
        Number.isFinite(
            state.mapObjective.y
        )
    ) {

        this.setMapObjective(

            state.mapObjective.x,

            state.mapObjective.y,

            state.mapObjective.name ||
                "Objetivo"

        );

    }

    return true;

};


// =====================================================
// DESENHAR NOTIFICAÇÕES
// =====================================================

World.prototype.drawNotifications = function (
    ctx,
    screenWidth,
    screenHeight
) {

    this.initializeEventSystem();

    if (
        this.notifications.length === 0
    ) {

        return;

    }

    ctx.save();

    ctx.font = "7px monospace";

    ctx.textAlign = "center";

    const maximumVisible = 3;

    const visible =
        this.notifications.slice(

            -maximumVisible

        );

    for (
        let i = 0;
        i < visible.length;
        i++
    ) {

        const notification =
            visible[i];

        const x =
            screenWidth / 2;

        const y =
            48 + i * 15;

        const alpha = clamp(

            notification.remaining,

            0,

            1

        );

        ctx.globalAlpha = alpha;

        const text =
            notification.text;

        const width = Math.min(

            screenWidth - 16,

            ctx.measureText(text).width + 12

        );

        ctx.fillStyle =
            "rgba(20, 30, 22, 0.85)";

        ctx.fillRect(

            x - width / 2,

            y - 9,

            width,

            13

        );

        ctx.strokeStyle =
            "#d8bf79";

        ctx.strokeRect(

            x - width / 2,

            y - 9,

            width,

            13

        );

        ctx.fillStyle =
            "#fff3cb";

        ctx.fillText(

            text,

            x,

            y

        );

    }

    ctx.restore();

};


// =====================================================
// DESENHAR DEPURAÇÃO
// =====================================================

World.prototype.drawDebug = function (
    ctx,
    screenWidth,
    screenHeight,
    player = null
) {

    if (!this.debugEnabled) {

        return;

    }

    ctx.save();

    ctx.font = "7px monospace";

    ctx.textAlign = "left";

    ctx.fillStyle =
        "rgba(0,0,0,0.80)";

    ctx.fillRect(

        4,

        50,

        150,

        58

    );

    ctx.fillStyle =
        "#88ff88";

    const lines = [

        "WORLD DEBUG",

        "OBJ: " + this.objects.length,

        "SECTORS: " + this.sectors.size,

        "CAM: " +
            Math.floor(this.cameraX) +
            "," +
            Math.floor(this.cameraY),

        "PLAYER: " +
            (
                player
                    ? Math.floor(player.x) +
                      "," +
                      Math.floor(player.y)
                    : "NONE"
            ),

        "REGION: " +
            (
                player
                    ? this.region(
                        player.x,
                        player.y
                    )
                    : "NONE"
            )

    ];

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        ctx.fillText(

            lines[i],

            8,

            59 + i * 9

        );

    }

    ctx.restore();

};


// =====================================================
// ATIVAR OU DESATIVAR DEPURAÇÃO
// =====================================================

World.prototype.toggleDebug = function () {

    this.debugEnabled =
        !this.debugEnabled;

    return this.debugEnabled;

};


// =====================================================
// VALIDAÇÃO DO MUNDO
// =====================================================

World.prototype.validateWorld = function () {

    const errors = [];

    const identifiers = new Set();

    // ---------------------------------------------
    // VALIDAR OBJETOS
    // ---------------------------------------------

    for (const object of this.objects) {

        if (!isValidRectangle(object)) {

            errors.push(

                "Geometria inválida: " +
                object.id

            );

            continue;

        }

        if (
            identifiers.has(object.id)
        ) {

            errors.push(

                "Identificador duplicado: " +
                object.id

            );

        }

        identifiers.add(
            object.id
        );

        if (

            object.x < 0 ||

            object.y < 0 ||

            object.x + object.w >
                this.width ||

            object.y + object.h >
                this.height

        ) {

            errors.push(

                "Objeto fora do mapa: " +
                object.id

            );

        }

    }

    // ---------------------------------------------
    // VALIDAR SETORES
    // ---------------------------------------------

    if (
        this.sectors.size !==
        TOTAL_SECTORS
    ) {

        errors.push(

            "Quantidade incorreta de setores."

        );

    }

    // ---------------------------------------------
    // VALIDAR POSIÇÃO INICIAL
    // ---------------------------------------------

    try {

        const spawn =
            this.findSpawn();

        if (!spawn) {

            errors.push(

                "Posição inicial não encontrada."

            );

        }

    } catch (error) {

        errors.push(

            error.message

        );

    }

    return {

        valid:
            errors.length === 0,

        errors,

        objectCount:
            this.objects.length,

        sectorCount:
            this.sectors.size

    };

};


// =====================================================
// ATUALIZAÇÃO UNIFICADA DA ENGINE
// =====================================================

World.prototype.updateSystems = function (
    deltaTime,
    player = null
) {

    if (
        !Number.isFinite(deltaTime) ||
        deltaTime <= 0
    ) {

        return;

    }

    const dt = Math.min(

        deltaTime,

        0.25

    );

    // ---------------------------------------------
    // RELÓGIO
    // ---------------------------------------------

    this.update(dt);

    // ---------------------------------------------
    // POSIÇÃO DO JOGADOR
    // ---------------------------------------------

    const playerX = player
        ? player.x
        : this.environmentPlayerX || 2500;

    const playerY = player
        ? player.y
        : this.environmentPlayerY || 2500;

    // ---------------------------------------------
    // AMBIENTE
    // ---------------------------------------------

    this.updateEnvironment(

        dt,

        playerX,

        playerY

    );

    // ---------------------------------------------
    // EXPLORAÇÃO
    // ---------------------------------------------

    if (player) {

        this.updateMap(
            player
        );

    }

    // ---------------------------------------------
    // MISSÕES
    // ---------------------------------------------

    this.updateQuests();

    // ---------------------------------------------
    // OBJETOS ANIMADOS
    // ---------------------------------------------

    this.updateAnimatedObjects(
        dt
    );

    // ---------------------------------------------
    // NOTIFICAÇÕES
    // ---------------------------------------------

    this.updateNotifications(
        dt
    );

};


// =====================================================
// RENDERIZAÇÃO UNIFICADA DA ENGINE
// =====================================================

World.prototype.renderSystems = function (
    ctx,
    screenWidth,
    screenHeight,
    player = null
) {

    if (!ctx) {

        return;

    }

    // ---------------------------------------------
    // MUNDO E PERSONAGEM
    // ---------------------------------------------

    this.draw(

        ctx,

        screenWidth,

        screenHeight,

        player

    );

    // ---------------------------------------------
    // AMBIENTE
    // ---------------------------------------------

    this.drawEnvironment(

        ctx,

        screenWidth,

        screenHeight

    );

    // ---------------------------------------------
    // INTERFACE DE EXPLORAÇÃO
    // ---------------------------------------------

    this.drawExplorationUI(

        ctx,

        screenWidth,

        screenHeight

    );

    // ---------------------------------------------
    // NOTIFICAÇÕES
    // ---------------------------------------------

    this.drawNotifications(

        ctx,

        screenWidth,

        screenHeight

    );

    // ---------------------------------------------
    // DEPURAÇÃO
    // ---------------------------------------------

    this.drawDebug(

        ctx,

        screenWidth,

        screenHeight,

        player

    );

};


// =====================================================
// INICIALIZAÇÃO FINAL DO MUNDO
// =====================================================

World.prototype.initializeWorldSystems =
function () {

    if (this.worldSystemsInitialized) {

        return;

    }

    // ---------------------------------------------
    // AMBIENTE
    // ---------------------------------------------

    this.initializeEnvironment();

    // ---------------------------------------------
    // EXPLORAÇÃO
    // ---------------------------------------------

    this.initializeExploration();

    // ---------------------------------------------
    // MAPA
    // ---------------------------------------------

    this.initializeMapSystem();

    // ---------------------------------------------
    // MISSÕES
    // ---------------------------------------------

    this.initializeQuestSystem();

    // ---------------------------------------------
    // MISSÕES INICIAIS
    // ---------------------------------------------

    this.generateExplorationQuests();

    // ---------------------------------------------
    // DEPURAÇÃO
    // ---------------------------------------------

    this.debugEnabled = false;

    // ---------------------------------------------
    // VALIDAÇÃO
    // ---------------------------------------------

    this.initialValidation =
        this.validateWorld();

    if (
        !this.initialValidation.valid
    ) {

        console.warn(

            "Problemas encontrados no mundo:",

            this.initialValidation.errors

        );

    }

    this.worldSystemsInitialized = true;

};


// =====================================================
// CONSULTAR INFORMAÇÕES DA ENGINE
// =====================================================

World.prototype.getEngineInfo = function () {

    this.initializeWorldSystems();

    return {

        name:
            "Zelda Pixel Adventure",

        version:
            WORLD_FINAL_CONFIG.version,

        engine:
            "JavaScript Canvas 2D",

        worldWidth:
            this.width,

        worldHeight:
            this.height,

        sectors:
            this.sectors.size,

        objects:
            this.objects.length,

        regions:
            Object.values(REGIONS),

        quests:
            this.quests.size,

        validated:
            this.initialValidation.valid

    };

};


