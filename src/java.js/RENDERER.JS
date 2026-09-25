
"use strict";

/*
========================================================
ZELDA PIXEL ADVENTURE
GRAPHICS ENGINE — BETA 3

ARQUIVO: renderer.js

BLOCO 1 — NÚCLEO GRÁFICO

SISTEMAS:

01. Configuração do renderizador
02. Resolução virtual
03. Pixel perfect rendering
04. Gerenciamento de Canvas
05. Câmera
06. Escala da câmera
07. Conversão de coordenadas
08. Gerenciamento de imagens
09. Carregamento de sprites
10. Spritesheets
11. Animações
12. Desenho de primitivas
13. Gerenciamento de camadas
14. Controle de viewport
15. Interpolação
16. Tratamento de erros gráficos
17. Compatibilidade com a engine do mundo

========================================================
*/


// =====================================================
// CONFIGURAÇÕES GERAIS
// =====================================================

export const RENDER_CONFIG = Object.freeze({

    VIRTUAL_WIDTH: 320,

    VIRTUAL_HEIGHT: 180,

    DEFAULT_SCALE: 4,

    TARGET_FPS: 60,

    MAX_DELTA_TIME: 0.05,

    PIXEL_PERFECT: true,

    IMAGE_SMOOTHING: false,

    CAMERA_SMOOTHING: 0.15,

    CAMERA_DEADZONE_X: 24,

    CAMERA_DEADZONE_Y: 16,

    CAMERA_LOOKAHEAD: 12,

    CAMERA_MAX_SHAKE: 12,

    MAX_RENDER_COMMANDS: 15000,

    MAX_IMAGES: 512,

    MAX_ANIMATIONS: 2048,

    MAX_LAYERS: 32,

    DEFAULT_LAYER: 10,

    DEFAULT_TILE_SIZE: 16,

    DEFAULT_SPRITE_SIZE: 16,

    DEFAULT_FONT_SIZE: 8,

    DEBUG_COLOR: "#ff4444",

    BACKGROUND_COLOR: "#101810",

    FALLBACK_COLOR: "#ff00ff",

    TRANSPARENT_COLOR: "rgba(0,0,0,0)"

});


// =====================================================
// CAMADAS GRÁFICAS
// =====================================================

export const RENDER_LAYERS = Object.freeze({

    BACKGROUND: 0,

    TERRAIN: 10,

    TERRAIN_DETAILS: 20,

    WATER: 30,

    GROUND_OBJECTS: 40,

    SHADOWS: 50,

    ENTITIES: 60,

    FOREGROUND_OBJECTS: 70,

    PARTICLES: 80,

    LIGHTING: 90,

    WEATHER: 100,

    HUD: 110,

    MENUS: 120,

    TOOLTIP: 130,

    DEBUG: 140

});


// =====================================================
// MODOS DE MISTURA
// =====================================================

export const BLEND_MODES = Object.freeze({

    NORMAL: "source-over",

    ADD: "lighter",

    MULTIPLY: "multiply",

    SCREEN: "screen",

    OVERLAY: "overlay",

    DESTINATION_OVER: "destination-over",

    DESTINATION_IN: "destination-in",

    DESTINATION_OUT: "destination-out"

});


// =====================================================
// FUNÇÕES MATEMÁTICAS
// =====================================================

function renderClamp(value, min, max) {

    return Math.max(

        min,

        Math.min(max, value)

    );

}


function renderLerp(a, b, t) {

    return a + (b - a) * t;

}


function renderInverseLerp(a, b, value) {

    if (a === b) {

        return 0;

    }

    return renderClamp(

        (value - a) / (b - a),

        0,

        1

    );

}


function renderSmoothstep(a, b, value) {

    const t = renderInverseLerp(

        a,

        b,

        value

    );

    return t * t * (3 - 2 * t);

}


function renderDistance(x1, y1, x2, y2) {

    return Math.hypot(

        x2 - x1,

        y2 - y1

    );

}


function renderRound(value) {

    return Math.round(value);

}


function renderFloor(value) {

    return Math.floor(value);

}


function renderIsFinite(value) {

    return Number.isFinite(value);

}


function renderNormalizeAngle(angle) {

    const fullRotation = Math.PI * 2;

    return (

        (
            angle % fullRotation
        ) + fullRotation

    ) % fullRotation;

}


function renderAngleDifference(a, b) {

    return Math.atan2(

        Math.sin(b - a),

        Math.cos(b - a)

    );

}


// =====================================================
// INTERPOLAÇÃO DE ÂNGULOS
// =====================================================

function renderLerpAngle(a, b, t) {

    const difference =
        renderAngleDifference(a, b);

    return a + difference * t;

}


// =====================================================
// VERIFICAR RETÂNGULO
// =====================================================

function renderValidRectangle(rect) {

    return Boolean(

        rect &&

        renderIsFinite(rect.x) &&

        renderIsFinite(rect.y) &&

        renderIsFinite(rect.w) &&

        renderIsFinite(rect.h) &&

        rect.w > 0 &&

        rect.h > 0

    );

}


// =====================================================
// INTERSEÇÃO ENTRE RETÂNGULOS
// =====================================================

function renderRectOverlap(a, b) {

    if (

        !renderValidRectangle(a) ||

        !renderValidRectangle(b)

    ) {

        return false;

    }

    return (

        a.x < b.x + b.w &&

        a.x + a.w > b.x &&

        a.y < b.y + b.h &&

        a.y + a.h > b.y

    );

}


// =====================================================
// CONTER PONTO EM RETÂNGULO
// =====================================================

function renderPointInRect(x, y, rect) {

    return (

        x >= rect.x &&

        y >= rect.y &&

        x < rect.x + rect.w &&

        y < rect.y + rect.h

    );

}


// =====================================================
// CRIAR RETÂNGULO
// =====================================================

function renderRect(x, y, w, h) {

    return {

        x,

        y,

        w,

        h

    };

}


// =====================================================
// CRIAR VETOR
// =====================================================

function renderVector(x = 0, y = 0) {

    return {

        x,

        y

    };

}


// =====================================================
// COPIAR VETOR
// =====================================================

function renderCopyVector(vector) {

    return {

        x: vector.x,

        y: vector.y

    };

}


// =====================================================
// NORMALIZAR VETOR
// =====================================================

function renderNormalizeVector(x, y) {

    const length = Math.hypot(x, y);

    if (length <= 0.000001) {

        return {

            x: 0,

            y: 0

        };

    }

    return {

        x: x / length,

        y: y / length

    };

}


// =====================================================
// MULTIPLICAR VETOR
// =====================================================

function renderScaleVector(vector, scale) {

    return {

        x: vector.x * scale,

        y: vector.y * scale

    };

}


// =====================================================
// SOMAR VETORES
// =====================================================

function renderAddVectors(a, b) {

    return {

        x: a.x + b.x,

        y: a.y + b.y

    };

}


// =====================================================
// GERAR HASH VISUAL
// =====================================================

function renderHash(x, y, seed = 12345) {

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
// NÚMERO PROCEDURAL DETERMINÍSTICO
// =====================================================

function renderRandom2D(x, y, seed = 12345) {

    return renderHash(

        x,

        y,

        seed

    ) / 4294967295;

}


// =====================================================
// GERENCIADOR DE CORES
// =====================================================

export class RenderColor {

    static clampChannel(value) {

        return Math.round(

            renderClamp(

                value,

                0,

                255

            )

        );

    }


    static rgb(r, g, b) {

        return `rgb(${this.clampChannel(r)},${this.clampChannel(g)},${this.clampChannel(b)})`;

    }


    static rgba(r, g, b, a = 1) {

        return `rgba(${this.clampChannel(r)},${this.clampChannel(g)},${this.clampChannel(b)},${renderClamp(a, 0, 1)})`;

    }


    static hex(r, g, b) {

        const red =
            this.clampChannel(r);

        const green =
            this.clampChannel(g);

        const blue =
            this.clampChannel(b);

        return "#" +

            red.toString(16).padStart(2, "0") +

            green.toString(16).padStart(2, "0") +

            blue.toString(16).padStart(2, "0");

    }


    static parseHex(color) {

        if (
            typeof color !== "string"
        ) {

            return null;

        }

        let value =
            color.trim().replace("#", "");

        if (value.length === 3) {

            value = value

                .split("")

                .map(
                    character =>
                        character + character
                )

                .join("");

        }

        if (
            value.length !== 6 ||
            !/^[0-9a-f]{6}$/i.test(value)
        ) {

            return null;

        }

        return {

            r: parseInt(
                value.slice(0, 2),
                16
            ),

            g: parseInt(
                value.slice(2, 4),
                16
            ),

            b: parseInt(
                value.slice(4, 6),
                16
            )

        };

    }


    static lerp(a, b, t) {

        const colorA =
            this.parseHex(a);

        const colorB =
            this.parseHex(b);

        if (
            !colorA ||
            !colorB
        ) {

            return a;

        }

        return this.hex(

            renderLerp(
                colorA.r,
                colorB.r,
                t
            ),

            renderLerp(
                colorA.g,
                colorB.g,
                t
            ),

            renderLerp(
                colorA.b,
                colorB.b,
                t
            )

        );

    }


    static multiply(color, factor) {

        const parsed =
            this.parseHex(color);

        if (!parsed) {

            return color;

        }

        return this.hex(

            parsed.r * factor,

            parsed.g * factor,

            parsed.b * factor

        );

    }


    static brighten(color, amount) {

        const parsed =
            this.parseHex(color);

        if (!parsed) {

            return color;

        }

        return this.hex(

            parsed.r + amount,

            parsed.g + amount,

            parsed.b + amount

        );

    }


    static darken(color, amount) {

        return this.brighten(

            color,

            -amount

        );

    }

}


// =====================================================
// CLASSE DE CÂMERA
// =====================================================

export class PixelCamera {

    constructor(options = {}) {

        this.x =
            options.x ?? 0;

        this.y =
            options.y ?? 0;

        this.targetX = this.x;

        this.targetY = this.y;

        this.width =
            options.width ??
            RENDER_CONFIG.VIRTUAL_WIDTH;

        this.height =
            options.height ??
            RENDER_CONFIG.VIRTUAL_HEIGHT;

        this.worldWidth =
            options.worldWidth ?? 5000;

        this.worldHeight =
            options.worldHeight ?? 5000;

        this.zoom =
            options.zoom ?? 1;

        this.minZoom =
            options.minZoom ?? 0.5;

        this.maxZoom =
            options.maxZoom ?? 4;

        this.smoothing =
            options.smoothing ??
            RENDER_CONFIG.CAMERA_SMOOTHING;

        this.deadzoneX =
            options.deadzoneX ??
            RENDER_CONFIG.CAMERA_DEADZONE_X;

        this.deadzoneY =
            options.deadzoneY ??
            RENDER_CONFIG.CAMERA_DEADZONE_Y;

        this.followTarget = null;

        this.lookaheadX = 0;

        this.lookaheadY = 0;

        this.shakeTime = 0;

        this.shakeDuration = 0;

        this.shakeStrength = 0;

        this.shakeX = 0;

        this.shakeY = 0;

        this.shakeSeed = 0;

        this.pixelPerfect = true;

        this.enabled = true;

    }


    // =================================================
    // OBTER LARGURA VISÍVEL
    // =================================================

    get visibleWidth() {

        return this.width / this.zoom;

    }


    // =================================================
    // OBTER ALTURA VISÍVEL
    // =================================================

    get visibleHeight() {

        return this.height / this.zoom;

    }


    // =================================================
    // DEFINIR DIMENSÕES DO MUNDO
    // =================================================

    setWorldSize(width, height) {

        if (
            !renderIsFinite(width) ||
            !renderIsFinite(height)
        ) {

            return;

        }

        this.worldWidth =
            Math.max(1, width);

        this.worldHeight =
            Math.max(1, height);

        this.clampPosition();

    }


    // =================================================
    // DEFINIR TAMANHO DA TELA
    // =================================================

    setViewportSize(width, height) {

        if (
            !renderIsFinite(width) ||
            !renderIsFinite(height)
        ) {

            return;

        }

        this.width =
            Math.max(1, width);

        this.height =
            Math.max(1, height);

        this.clampPosition();

    }


    // =================================================
    // DEFINIR ZOOM
    // =================================================

    setZoom(value) {

        if (!renderIsFinite(value)) {

            return;

        }

        this.zoom = renderClamp(

            value,

            this.minZoom,

            this.maxZoom

        );

        this.clampPosition();

    }


    // =================================================
    // AUMENTAR ZOOM
    // =================================================

    zoomIn(amount = 0.25) {

        this.setZoom(

            this.zoom + amount

        );

    }


    // =================================================
    // DIMINUIR ZOOM
    // =================================================

    zoomOut(amount = 0.25) {

        this.setZoom(

            this.zoom - amount

        );

    }


    // =================================================
    // RESTAURAR ZOOM
    // =================================================

    resetZoom() {

        this.setZoom(1);

    }


    // =================================================
    // ASSOCIAR ALVO
    // =================================================

    follow(target) {

        this.followTarget =
            target || null;

    }


    // =================================================
    // REMOVER ALVO
    // =================================================

    stopFollowing() {

        this.followTarget = null;

    }


    // =================================================
    // CENTRALIZAR EM UM PONTO
    // =================================================

    centerOn(x, y) {

        this.x =
            x - this.visibleWidth / 2;

        this.y =
            y - this.visibleHeight / 2;

        this.targetX = this.x;

        this.targetY = this.y;

        this.clampPosition();

    }


    // =================================================
    // DEFINIR POSIÇÃO IMEDIATA
    // =================================================

    setPosition(x, y) {

        if (
            !renderIsFinite(x) ||
            !renderIsFinite(y)
        ) {

            return;

        }

        this.x = x;

        this.y = y;

        this.targetX = x;

        this.targetY = y;

        this.clampPosition();

    }


    // =================================================
    // DEFINIR ALVO DE MOVIMENTAÇÃO
    // =================================================

    moveTo(x, y) {

        if (
            !renderIsFinite(x) ||
            !renderIsFinite(y)
        ) {

            return;

        }

        this.targetX = x;

        this.targetY = y;

    }


    // =================================================
    // LIMITAR CÂMERA AO MUNDO
    // =================================================

    clampPosition() {

        const maximumX = Math.max(

            0,

            this.worldWidth -
            this.visibleWidth

        );

        const maximumY = Math.max(

            0,

            this.worldHeight -
            this.visibleHeight

        );

        this.x = renderClamp(

            this.x,

            0,

            maximumX

        );

        this.y = renderClamp(

            this.y,

            0,

            maximumY

        );

        this.targetX = renderClamp(

            this.targetX,

            0,

            maximumX

        );

        this.targetY = renderClamp(

            this.targetY,

            0,

            maximumY

        );

    }


    // =================================================
    // CALCULAR POSIÇÃO DO ALVO
    // =================================================

    calculateFollowTarget() {

        const target =
            this.followTarget;

        if (!target) {

            return;

        }

        const centerX =

            target.x +

            (target.width || 0) / 2;

        const centerY =

            target.y +

            (target.height || 0) / 2;

        const velocityX =
            target.velocityX || 0;

        const velocityY =
            target.velocityY || 0;

        this.lookaheadX =
            velocityX *
            RENDER_CONFIG.CAMERA_LOOKAHEAD;

        this.lookaheadY =
            velocityY *
            RENDER_CONFIG.CAMERA_LOOKAHEAD;

        this.targetX =

            centerX +

            this.lookaheadX -

            this.visibleWidth / 2;

        this.targetY =

            centerY +

            this.lookaheadY -

            this.visibleHeight / 2;

    }


    // =================================================
    // ATUALIZAR CÂMERA
    // =================================================

    update(deltaTime) {

        if (!this.enabled) {

            return;

        }

        if (
            !renderIsFinite(deltaTime) ||
            deltaTime <= 0
        ) {

            return;

        }

        const dt = Math.min(

            deltaTime,

            RENDER_CONFIG.MAX_DELTA_TIME

        );

        this.calculateFollowTarget();

        const factor =

            1 -

            Math.pow(

                1 - this.smoothing,

                dt * 60

            );

        this.x = renderLerp(

            this.x,

            this.targetX,

            factor

        );

        this.y = renderLerp(

            this.y,

            this.targetY,

            factor

        );

        this.clampPosition();

        this.updateShake(dt);

    }


    // =================================================
    // INICIAR TREMORES DE CÂMERA
    // =================================================

    shake(
        strength = 3,
        duration = 0.2
    ) {

        if (
            strength <= 0 ||
            duration <= 0
        ) {

            return;

        }

        this.shakeStrength = Math.min(

            strength,

            RENDER_CONFIG.CAMERA_MAX_SHAKE

        );

        this.shakeDuration = duration;

        this.shakeTime = duration;

        this.shakeSeed++;

    }


    // =================================================
    // ATUALIZAR TREMORES
    // =================================================

    updateShake(deltaTime) {

        if (
            this.shakeTime <= 0
        ) {

            this.shakeX = 0;

            this.shakeY = 0;

            return;

        }

        this.shakeTime = Math.max(

            0,

            this.shakeTime - deltaTime

        );

        const progress =

            this.shakeDuration > 0

                ? this.shakeTime /
                  this.shakeDuration

                : 0;

        const strength =

            this.shakeStrength *
            progress;

        const frame =

            Math.floor(

                this.shakeTime * 120

            );

        this.shakeX =

            (
                renderRandom2D(

                    frame,

                    this.shakeSeed,

                    9271

                ) * 2 - 1

            ) * strength;

        this.shakeY =

            (
                renderRandom2D(

                    this.shakeSeed,

                    frame,

                    4921

                ) * 2 - 1

            ) * strength;

    }


    // =================================================
    // OBTER POSIÇÃO DE DESENHO
    // =================================================

    getRenderPosition() {

        return {

            x: this.pixelPerfect

                ? renderRound(
                    this.x - this.shakeX
                )

                : this.x - this.shakeX,

            y: this.pixelPerfect

                ? renderRound(
                    this.y - this.shakeY
                )

                : this.y - this.shakeY

        };

    }


    // =================================================
    // CONVERTER MUNDO PARA TELA
    // =================================================

    worldToScreen(x, y) {

        const position =
            this.getRenderPosition();

        return {

            x:
                (x - position.x) *
                this.zoom,

            y:
                (y - position.y) *
                this.zoom

        };

    }


    // =================================================
    // CONVERTER TELA PARA MUNDO
    // =================================================

    screenToWorld(x, y) {

        const position =
            this.getRenderPosition();

        return {

            x:
                x / this.zoom +
                position.x,

            y:
                y / this.zoom +
                position.y

        };

    }


    // =================================================
    // OBTER ÁREA VISÍVEL
    // =================================================

    getVisibleBounds(margin = 0) {

        return {

            x: this.x - margin,

            y: this.y - margin,

            w:
                this.visibleWidth +
                margin * 2,

            h:
                this.visibleHeight +
                margin * 2

        };

    }


    // =================================================
    // VERIFICAR VISIBILIDADE
    // =================================================

    isVisible(rect, margin = 0) {

        return renderRectOverlap(

            rect,

            this.getVisibleBounds(
                margin
            )

        );

    }


    // =================================================
    // APLICAR TRANSFORMAÇÃO
    // =================================================

    apply(ctx) {

        const position =
            this.getRenderPosition();

        ctx.save();

        ctx.scale(

            this.zoom,

            this.zoom

        );

        ctx.translate(

            -position.x,

            -position.y

        );

    }


    // =================================================
    // RESTAURAR TRANSFORMAÇÃO
    // =================================================

    restore(ctx) {

        ctx.restore();

    }


    // =================================================
    // EXPORTAR ESTADO
    // =================================================

    exportState() {

        return {

            x: this.x,

            y: this.y,

            zoom: this.zoom,

            smoothing:
                this.smoothing

        };

    }


    // =================================================
    // IMPORTAR ESTADO
    // =================================================

    importState(state) {

        if (!state) {

            return false;

        }

        if (
            renderIsFinite(state.zoom)
        ) {

            this.setZoom(
                state.zoom
            );

        }

        if (
            renderIsFinite(state.smoothing)
        ) {

            this.smoothing = renderClamp(

                state.smoothing,

                0,

                1

            );

        }

        if (

            renderIsFinite(state.x) &&

            renderIsFinite(state.y)

        ) {

            this.setPosition(

                state.x,

                state.y

            );

        }

        return true;

    }

}


// =====================================================
// GERENCIADOR DE IMAGENS
// =====================================================

export class ImageManager {

    constructor(options = {}) {

        this.images = new Map();

        this.pending = new Map();

        this.errors = new Map();

        this.maximumImages =
            options.maximumImages ??
            RENDER_CONFIG.MAX_IMAGES;

    }


    // =================================================
    // CARREGAR IMAGEM
    // =================================================

    load(id, source) {

        if (

            typeof id !== "string" ||

            typeof source !== "string" ||

            !id ||

            !source

        ) {

            return Promise.reject(

                new Error(
                    "Identificador ou caminho inválido."
                )

            );

        }

        if (
            this.images.has(id)
        ) {

            return Promise.resolve(

                this.images.get(id)

            );

        }

        if (
            this.pending.has(id)
        ) {

            return this.pending.get(id);

        }

        if (
            this.images.size >=
            this.maximumImages
        ) {

            return Promise.reject(

                new Error(
                    "Limite de imagens atingido."
                )

            );

        }

        const promise =
            new Promise(

                (resolve, reject) => {

                    const image =
                        new Image();

                    image.onload = () => {

                        this.images.set(

                            id,

                            image

                        );

                        this.pending.delete(
                            id
                        );

                        this.errors.delete(
                            id
                        );

                        resolve(image);

                    };

                    image.onerror = () => {

                        const error =
                            new Error(

                                "Falha ao carregar imagem: " +
                                source

                            );

                        this.pending.delete(
                            id
                        );

                        this.errors.set(

                            id,

                            error

                        );

                        reject(error);

                    };

                    image.src = source;

                }

            );

        this.pending.set(

            id,

            promise

        );

        return promise;

    }


    // =================================================
    // CARREGAR VÁRIAS IMAGENS
    // =================================================

    async loadMany(manifest) {

        if (
            !manifest ||
            typeof manifest !== "object"
        ) {

            return {

                loaded: [],

                failed: []

            };

        }

        const entries =
            Object.entries(manifest);

        const results =
            await Promise.allSettled(

                entries.map(

                    ([id, source]) =>

                        this.load(

                            id,

                            source

                        )

                )

            );

        const loaded = [];

        const failed = [];

        for (
            let i = 0;
            i < results.length;
            i++
        ) {

            const result =
                results[i];

            const id =
                entries[i][0];

            if (
                result.status ===
                "fulfilled"
            ) {

                loaded.push(id);

            } else {

                failed.push({

                    id,

                    error: result.reason

                });

            }

        }

        return {

            loaded,

            failed

        };

    }


    // =================================================
    // REGISTRAR IMAGEM EXISTENTE
    // =================================================

    register(id, image) {

        if (
            typeof id !== "string" ||
            !image
        ) {

            return false;

        }

        this.images.set(

            id,

            image

        );

        return true;

    }


    // =================================================
    // OBTER IMAGEM
    // =================================================

    get(id) {

        return this.images.get(id) || null;

    }


    // =================================================
    // VERIFICAR SE FOI CARREGADA
    // =================================================

    has(id) {

        return this.images.has(id);

    }


    // =================================================
    // VERIFICAR CARREGAMENTO PENDENTE
    // =================================================

    isLoading(id) {

        return this.pending.has(id);

    }


    // =================================================
    // OBTER ERRO
    // =================================================

    getError(id) {

        return this.errors.get(id) || null;

    }


    // =================================================
    // REMOVER IMAGEM
    // =================================================

    remove(id) {

        const removed =
            this.images.delete(id);

        this.errors.delete(id);

        return removed;

    }


    // =================================================
    // LIMPAR IMAGENS
    // =================================================

    clear() {

        this.images.clear();

        this.errors.clear();

    }


    // =================================================
    // OBTER ESTATÍSTICAS
    // =================================================

    getStatistics() {

        return {

            loaded:
                this.images.size,

            pending:
                this.pending.size,

            errors:
                this.errors.size,

            maximum:
                this.maximumImages

        };

    }

}


/*
========================================================
ZELDA PIXEL ADVENTURE
GRAPHICS ENGINE — BETA 3

ARQUIVO: renderer.js

BLOCO 2 — SISTEMA AVANÇADO DE RENDERIZAÇÃO

FUNCIONALIDADES:

01. Definição de sprites
02. Spritesheets
03. Recorte de spritesheets
04. Animações direcionais
05. Estados de animação
06. Reprodução de animações
07. Controle de velocidade
08. Animações em loop
09. Animações de execução única
10. Espelhamento horizontal
11. Espelhamento vertical
12. Rotação de sprites
13. Transparência
14. Escala individual de sprites
15. Origem de transformação
16. Filas de renderização
17. Ordenação por camadas
18. Ordenação por profundidade
19. Renderização em coordenadas do mundo
20. Renderização em coordenadas da tela
21. Desenho de imagens
22. Desenho de sprites animados
23. Desenho de formas geométricas
24. Controle de opacidade
25. Controle de composição gráfica
26. Desenho de textos
27. Recorte de áreas
28. Integração com PixelCamera
29. Gerenciamento de erros gráficos
30. Estatísticas de renderização

========================================================
*/


// =====================================================
// CONFIGURAÇÕES DE SPRITES
// =====================================================

export const SPRITE_CONFIG = Object.freeze({

    DEFAULT_WIDTH: 16,

    DEFAULT_HEIGHT: 16,

    DEFAULT_FRAME_DURATION: 0.12,

    DEFAULT_ANCHOR_X: 0.5,

    DEFAULT_ANCHOR_Y: 1,

    DEFAULT_ALPHA: 1,

    DEFAULT_SCALE: 1,

    MINIMUM_SCALE: 0.01,

    MAXIMUM_SCALE: 16,

    MINIMUM_FRAME_DURATION: 0.001,

    MAXIMUM_FRAME_DURATION: 10,

    MAXIMUM_FRAMES: 512,

    MAXIMUM_SPRITESHEETS: 512,

    MAXIMUM_SPRITE_DIMENSION: 4096

});


// =====================================================
// DIREÇÕES DE ANIMAÇÃO
// =====================================================

export const SPRITE_DIRECTIONS = Object.freeze({

    DOWN: "down",

    UP: "up",

    LEFT: "left",

    RIGHT: "right"

});


// =====================================================
// ESTADOS DE ANIMAÇÃO
// =====================================================

export const ANIMATION_STATES = Object.freeze({

    IDLE: "idle",

    WALK: "walk",

    RUN: "run",

    ATTACK: "attack",

    BLOCK: "block",

    DODGE: "dodge",

    CAST: "cast",

    HIT: "hit",

    DEATH: "death",

    INTERACT: "interact",

    SPECIAL: "special"

});


// =====================================================
// FUNÇÕES AUXILIARES DE SPRITES
// =====================================================

function spriteFinite(value, fallback = 0) {

    return Number.isFinite(value)
        ? value
        : fallback;

}


function spritePositive(value, fallback = 1) {

    return Number.isFinite(value) &&
        value > 0
            ? value
            : fallback;

}


function spriteClamp(value, min, max) {

    return Math.max(

        min,

        Math.min(max, value)

    );

}


function spriteDirectionValid(direction) {

    return Object.values(
        SPRITE_DIRECTIONS
    ).includes(direction);

}


function spriteStateValid(state) {

    return Object.values(
        ANIMATION_STATES
    ).includes(state);

}


function spriteImageReady(image) {

    if (!image) {

        return false;

    }

    const width =
        image.naturalWidth ??
        image.width ??
        0;

    const height =
        image.naturalHeight ??
        image.height ??
        0;

    if (width <= 0 || height <= 0) {

        return false;

    }

    if (
        typeof image.complete === "boolean" &&
        !image.complete
    ) {

        return false;

    }

    return true;

}


// =====================================================
// VERIFICAR REGIÃO DE UMA IMAGEM
// =====================================================

function spriteValidRegion(
    image,
    x,
    y,
    width,
    height
) {

    if (!spriteImageReady(image)) {

        return false;

    }

    if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(width) ||
        !Number.isFinite(height)
    ) {

        return false;

    }

    if (
        x < 0 ||
        y < 0 ||
        width <= 0 ||
        height <= 0
    ) {

        return false;

    }

    const imageWidth =
        image.naturalWidth ??
        image.width;

    const imageHeight =
        image.naturalHeight ??
        image.height;

    return (

        x + width <= imageWidth &&

        y + height <= imageHeight

    );

}


// =====================================================
// CLASSE DE DEFINIÇÃO DE SPRITE
// =====================================================

export class SpriteDefinition {

    constructor(options = {}) {

        this.id =
            options.id || null;

        this.imageId =
            options.imageId || null;

        this.x =
            spriteFinite(options.x);

        this.y =
            spriteFinite(options.y);

        this.width =
            spritePositive(

                options.width,

                SPRITE_CONFIG.DEFAULT_WIDTH

            );

        this.height =
            spritePositive(

                options.height,

                SPRITE_CONFIG.DEFAULT_HEIGHT

            );

        this.anchorX =
            spriteClamp(

                spriteFinite(
                    options.anchorX,
                    SPRITE_CONFIG.DEFAULT_ANCHOR_X
                ),

                0,

                1

            );

        this.anchorY =
            spriteClamp(

                spriteFinite(
                    options.anchorY,
                    SPRITE_CONFIG.DEFAULT_ANCHOR_Y
                ),

                0,

                1

            );

        this.offsetX =
            spriteFinite(options.offsetX);

        this.offsetY =
            spriteFinite(options.offsetY);

        this.scaleX =
            spritePositive(

                options.scaleX,

                1

            );

        this.scaleY =
            spritePositive(

                options.scaleY,

                1

            );

        this.flipX =
            Boolean(options.flipX);

        this.flipY =
            Boolean(options.flipY);

        this.rotation =
            spriteFinite(options.rotation);

        this.alpha =
            spriteClamp(

                spriteFinite(
                    options.alpha,
                    1
                ),

                0,

                1

            );

    }


    // =================================================
    // OBTER REGIÃO DE ORIGEM
    // =================================================

    getSourceRect() {

        return {

            x: this.x,

            y: this.y,

            w: this.width,

            h: this.height

        };

    }


    // =================================================
    // OBTER DIMENSÕES DE DESENHO
    // =================================================

    getDrawSize(scale = 1) {

        return {

            width:

                this.width *

                this.scaleX *

                scale,

            height:

                this.height *

                this.scaleY *

                scale

        };

    }


    // =================================================
    // CRIAR CÓPIA
    // =================================================

    clone(overrides = {}) {

        return new SpriteDefinition({

            ...this.toJSON(),

            ...overrides

        });

    }


    // =================================================
    // EXPORTAR DEFINIÇÃO
    // =================================================

    toJSON() {

        return {

            id: this.id,

            imageId: this.imageId,

            x: this.x,

            y: this.y,

            width: this.width,

            height: this.height,

            anchorX: this.anchorX,

            anchorY: this.anchorY,

            offsetX: this.offsetX,

            offsetY: this.offsetY,

            scaleX: this.scaleX,

            scaleY: this.scaleY,

            flipX: this.flipX,

            flipY: this.flipY,

            rotation: this.rotation,

            alpha: this.alpha

        };

    }

}


// =====================================================
// CLASSE DE SPRITESHEET
// =====================================================

export class SpriteSheet {

    constructor(
        imageId,
        imageManager,
        options = {}
    ) {

        if (
            !imageId ||
            !imageManager
        ) {

            throw new Error(

                "Spritesheet requer imagem e gerenciador."

            );

        }

        this.imageId = imageId;

        this.images = imageManager;

        this.frameWidth =
            spritePositive(

                options.frameWidth,

                16

            );

        this.frameHeight =
            spritePositive(

                options.frameHeight,

                16

            );

        this.margin =
            Math.max(

                0,

                spriteFinite(
                    options.margin
                )

            );

        this.spacing =
            Math.max(

                0,

                spriteFinite(
                    options.spacing
                )

            );

        this.columns =
            options.columns ?? null;

        this.rows =
            options.rows ?? null;

        this.sprites = new Map();

        this.animations = new Map();

    }


    // =================================================
    // OBTER IMAGEM
    // =================================================

    getImage() {

        return this.images.get(
            this.imageId
        );

    }


    // =================================================
    // VERIFICAR DISPONIBILIDADE
    // =================================================

    isReady() {

        return spriteImageReady(
            this.getImage()
        );

    }


    // =================================================
    // CALCULAR QUANTIDADE DE COLUNAS
    // =================================================

    getColumnCount() {

        if (
            Number.isInteger(this.columns) &&
            this.columns > 0
        ) {

            return this.columns;

        }

        const image =
            this.getImage();

        if (!this.isReady()) {

            return 0;

        }

        const imageWidth =
            image.naturalWidth ??
            image.width;

        return Math.max(

            0,

            Math.floor(

                (
                    imageWidth -
                    this.margin * 2 +
                    this.spacing
                ) /

                (
                    this.frameWidth +
                    this.spacing
                )

            )

        );

    }


    // =================================================
    // CALCULAR QUANTIDADE DE LINHAS
    // =================================================

    getRowCount() {

        if (
            Number.isInteger(this.rows) &&
            this.rows > 0
        ) {

            return this.rows;

        }

        const image =
            this.getImage();

        if (!this.isReady()) {

            return 0;

        }

        const imageHeight =
            image.naturalHeight ??
            image.height;

        return Math.max(

            0,

            Math.floor(

                (
                    imageHeight -
                    this.margin * 2 +
                    this.spacing
                ) /

                (
                    this.frameHeight +
                    this.spacing
                )

            )

        );

    }


    // =================================================
    // OBTER QUANTIDADE DE QUADROS
    // =================================================

    getFrameCount() {

        return (

            this.getColumnCount() *

            this.getRowCount()

        );

    }


    // =================================================
    // OBTER QUADRO POR COLUNA E LINHA
    // =================================================

    getFrameAt(column, row) {

        if (
            !Number.isInteger(column) ||
            !Number.isInteger(row)
        ) {

            return null;

        }

        if (
            column < 0 ||
            row < 0 ||
            column >= this.getColumnCount() ||
            row >= this.getRowCount()
        ) {

            return null;

        }

        const x =

            this.margin +

            column *

            (
                this.frameWidth +
                this.spacing
            );

        const y =

            this.margin +

            row *

            (
                this.frameHeight +
                this.spacing
            );

        return new SpriteDefinition({

            imageId: this.imageId,

            x,

            y,

            width: this.frameWidth,

            height: this.frameHeight

        });

    }


    // =================================================
    // OBTER QUADRO POR ÍNDICE
    // =================================================

    getFrame(index) {

        if (
            !Number.isInteger(index) ||
            index < 0
        ) {

            return null;

        }

        const columns =
            this.getColumnCount();

        if (columns <= 0) {

            return null;

        }

        const column =
            index % columns;

        const row =
            Math.floor(
                index / columns
            );

        return this.getFrameAt(

            column,

            row

        );

    }


    // =================================================
    // REGISTRAR SPRITE NOMEADO
    // =================================================

    defineSprite(
        name,
        column,
        row,
        options = {}
    ) {

        if (
            typeof name !== "string" ||
            !name
        ) {

            return null;

        }

        const frame =
            this.getFrameAt(

                column,

                row

            );

        if (!frame) {

            return null;

        }

        const sprite =
            frame.clone({

                ...options,

                id: name

            });

        this.sprites.set(

            name,

            sprite

        );

        return sprite;

    }


    // =================================================
    // OBTER SPRITE NOMEADO
    // =================================================

    getSprite(name) {

        return this.sprites.get(name) ||
            null;

    }


    // =================================================
    // DEFINIR ANIMAÇÃO
    // =================================================

    defineAnimation(
        name,
        frameIndices,
        options = {}
    ) {

        if (
            typeof name !== "string" ||
            !name ||
            !Array.isArray(frameIndices)
        ) {

            return null;

        }

        const frames = [];

        for (const index of frameIndices) {

            const frame =
                this.getFrame(index);

            if (frame) {

                frames.push(frame);

            }

        }

        if (frames.length === 0) {

            return null;

        }

        const animation =
            new AnimationClip({

                id: name,

                frames,

                ...options

            });

        this.animations.set(

            name,

            animation

        );

        return animation;

    }


    // =================================================
    // OBTER ANIMAÇÃO
    // =================================================

    getAnimation(name) {

        return this.animations.get(name) ||
            null;

    }


    // =================================================
    // OBTER ESTATÍSTICAS
    // =================================================

    getStatistics() {

        return {

            imageId: this.imageId,

            ready: this.isReady(),

            columns:
                this.getColumnCount(),

            rows:
                this.getRowCount(),

            frames:
                this.getFrameCount(),

            namedSprites:
                this.sprites.size,

            animations:
                this.animations.size

        };

    }

}


// =====================================================
// CLASSE DE CLIPE DE ANIMAÇÃO
// =====================================================

export class AnimationClip {

    constructor(options = {}) {

        if (
            !Array.isArray(options.frames) ||
            options.frames.length === 0
        ) {

            throw new Error(

                "A animação precisa conter quadros."

            );

        }

        this.id =
            options.id || "animation";

        this.frames =
            options.frames.slice(

                0,

                SPRITE_CONFIG.MAXIMUM_FRAMES

            );

        this.frameDuration =
            spriteClamp(

                spritePositive(

                    options.frameDuration,

                    SPRITE_CONFIG.DEFAULT_FRAME_DURATION

                ),

                SPRITE_CONFIG.MINIMUM_FRAME_DURATION,

                SPRITE_CONFIG.MAXIMUM_FRAME_DURATION

            );

        this.loop =
            options.loop !== false;

        this.speed =
            spritePositive(

                options.speed,

                1

            );

        this.direction =
            options.direction ||
            SPRITE_DIRECTIONS.DOWN;

        this.state =
            options.state ||
            ANIMATION_STATES.IDLE;

        this.nextAnimation =
            options.nextAnimation || null;

    }


    // =================================================
    // QUANTIDADE DE QUADROS
    // =================================================

    get length() {

        return this.frames.length;

    }


    // =================================================
    // DURAÇÃO TOTAL
    // =================================================

    get duration() {

        return (

            this.frames.length *

            this.frameDuration /

            this.speed

        );

    }


    // =================================================
    // OBTER QUADRO
    // =================================================

    getFrame(index) {

        if (
            !Number.isInteger(index)
        ) {

            return null;

        }

        if (
            index < 0 ||
            index >= this.frames.length
        ) {

            return null;

        }

        return this.frames[index];

    }


    // =================================================
    // OBTER QUADRO EM DETERMINADO TEMPO
    // =================================================

    getFrameAtTime(time) {

        if (
            !Number.isFinite(time)
        ) {

            return this.frames[0];

        }

        const effectiveTime =
            Math.max(
                0,
                time * this.speed
            );

        let index =
            Math.floor(

                effectiveTime /

                this.frameDuration

            );

        if (this.loop) {

            index %=
                this.frames.length;

        } else {

            index = Math.min(

                index,

                this.frames.length - 1

            );

        }

        return this.frames[index];

    }


    // =================================================
    // CRIAR CÓPIA
    // =================================================

    clone(overrides = {}) {

        return new AnimationClip({

            id: this.id,

            frames: this.frames,

            frameDuration:
                this.frameDuration,

            loop: this.loop,

            speed: this.speed,

            direction: this.direction,

            state: this.state,

            nextAnimation:
                this.nextAnimation,

            ...overrides

        });

    }

}


// =====================================================
// CONTROLADOR DE ANIMAÇÕES
// =====================================================

export class SpriteAnimator {

    constructor(options = {}) {

        this.animations = new Map();

        this.currentAnimation = null;

        this.currentName = null;

        this.currentTime = 0;

        this.currentFrame = 0;

        this.playing = false;

        this.paused = false;

        this.finished = false;

        this.speed =
            spritePositive(

                options.speed,

                1

            );

        this.direction =
            options.direction ||
            SPRITE_DIRECTIONS.DOWN;

        this.state =
            options.state ||
            ANIMATION_STATES.IDLE;

        this.onAnimationEnd = null;

        this.onFrameChanged = null;

    }


    // =================================================
    // ADICIONAR ANIMAÇÃO
    // =================================================

    add(
        name,
        animation
    ) {

        if (
            typeof name !== "string" ||
            !name ||
            !(animation instanceof AnimationClip)
        ) {

            return false;

        }

        this.animations.set(

            name,

            animation

        );

        return true;

    }


    // =================================================
    // ADICIONAR CONJUNTO DE ANIMAÇÕES
    // =================================================

    addMany(animations) {

        if (!animations) {

            return;

        }

        for (
            const [name, animation] of
            Object.entries(animations)
        ) {

            this.add(

                name,

                animation

            );

        }

    }


    // =================================================
    // VERIFICAR SE POSSUI ANIMAÇÃO
    // =================================================

    has(name) {

        return this.animations.has(name);

    }


    // =================================================
    // OBTER ANIMAÇÃO
    // =================================================

    get(name) {

        return this.animations.get(name) ||
            null;

    }


    // =================================================
    // INICIAR ANIMAÇÃO
    // =================================================

    play(
        name,
        restart = false
    ) {

        const animation =
            this.animations.get(name);

        if (!animation) {

            return false;

        }

        if (
            !restart &&
            this.currentName === name &&
            this.playing
        ) {

            return true;

        }

        this.currentAnimation =
            animation;

        this.currentName =
            name;

        this.currentTime = 0;

        this.currentFrame = 0;

        this.playing = true;

        this.paused = false;

        this.finished = false;

        this.direction =
            animation.direction;

        this.state =
            animation.state;

        return true;

    }


    // =================================================
    // INTERROMPER ANIMAÇÃO
    // =================================================

    stop() {

        this.playing = false;

        this.paused = false;

        this.currentTime = 0;

        this.currentFrame = 0;

    }


    // =================================================
    // PAUSAR ANIMAÇÃO
    // =================================================

    pause() {

        this.paused = true;

    }


    // =================================================
    // CONTINUAR ANIMAÇÃO
    // =================================================

    resume() {

        if (
            this.currentAnimation &&
            !this.finished
        ) {

            this.paused = false;

            this.playing = true;

        }

    }


    // =================================================
    // REINICIAR ANIMAÇÃO
    // =================================================

    restart() {

        if (!this.currentName) {

            return false;

        }

        return this.play(

            this.currentName,

            true

        );

    }


    // =================================================
    // DEFINIR VELOCIDADE
    // =================================================

    setSpeed(value) {

        this.speed =
            spritePositive(

                value,

                1

            );

    }


    // =================================================
    // DEFINIR DIREÇÃO
    // =================================================

    setDirection(direction) {

        if (
            !spriteDirectionValid(direction)
        ) {

            return false;

        }

        this.direction = direction;

        return true;

    }


    // =================================================
    // DEFINIR ESTADO
    // =================================================

    setState(state) {

        if (
            !spriteStateValid(state)
        ) {

            return false;

        }

        this.state = state;

        return true;

    }


    // =================================================
    // ATUALIZAR ANIMAÇÃO
    // =================================================

    update(deltaTime) {

        if (
            !this.playing ||
            this.paused ||
            this.finished ||
            !this.currentAnimation
        ) {

            return;

        }

        if (
            !Number.isFinite(deltaTime) ||
            deltaTime <= 0
        ) {

            return;

        }

        const animation =
            this.currentAnimation;

        const previousFrame =
            this.currentFrame;

        this.currentTime +=

            deltaTime *

            this.speed;

        const totalDuration =
            animation.duration;

        // -----------------------------------------
        // ANIMAÇÃO EM LOOP
        // -----------------------------------------

        if (animation.loop) {

            if (totalDuration > 0) {

                this.currentTime %= totalDuration;

            }

        }

        // -----------------------------------------
        // ANIMAÇÃO DE EXECUÇÃO ÚNICA
        // -----------------------------------------

        else if (
            this.currentTime >= totalDuration
        ) {

            this.currentTime =
                totalDuration;

            this.currentFrame =
                animation.length - 1;

            this.finished = true;

            this.playing = false;

            if (
                typeof this.onAnimationEnd ===
                "function"
            ) {

                this.onAnimationEnd(

                    this.currentName,

                    animation

                );

            }

            return;

        }

        const frameTime =

            this.currentTime *

            animation.speed;

        this.currentFrame =
            Math.min(

                animation.length - 1,

                Math.floor(

                    frameTime /

                    animation.frameDuration

                )

            );

        if (
            this.currentFrame !==
            previousFrame
        ) {

            if (
                typeof this.onFrameChanged ===
                "function"
            ) {

                this.onFrameChanged(

                    this.currentFrame,

                    animation.getFrame(
                        this.currentFrame
                    )

                );

            }

        }

    }


    // =================================================
    // OBTER SPRITE ATUAL
    // =================================================

    getCurrentSprite() {

        if (!this.currentAnimation) {

            return null;

        }

        return this.currentAnimation.getFrame(

            this.currentFrame

        );

    }


    // =================================================
    // OBTER PROGRESSO
    // =================================================

    getProgress() {

        if (!this.currentAnimation) {

            return 0;

        }

        if (
            this.currentAnimation.duration <= 0
        ) {

            return 1;

        }

        return spriteClamp(

            this.currentTime /

            this.currentAnimation.duration,

            0,

            1

        );

    }


    // =================================================
    // VERIFICAR SE ESTÁ REPRODUZINDO
    // =================================================

    isPlaying(name = null) {

        if (!this.playing) {

            return false;

        }

        if (name === null) {

            return true;

        }

        return this.currentName === name;

    }


    // =================================================
    // EXPORTAR ESTADO
    // =================================================

    exportState() {

        return {

            currentName:
                this.currentName,

            currentTime:
                this.currentTime,

            currentFrame:
                this.currentFrame,

            direction:
                this.direction,

            state:
                this.state,

            speed:
                this.speed,

            playing:
                this.playing,

            paused:
                this.paused

        };

    }

}


// =====================================================
// REGISTRO DE SPRITES
// =====================================================

export class SpriteRegistry {

    constructor(imageManager) {

        this.images = imageManager;

        this.sheets = new Map();

        this.sprites = new Map();

        this.animations = new Map();

    }


    // =================================================
    // REGISTRAR SPRITESHEET
    // =================================================

    registerSheet(
        id,
        imageId,
        options = {}
    ) {

        if (
            this.sheets.size >=
            SPRITE_CONFIG.MAXIMUM_SPRITESHEETS
        ) {

            return null;

        }

        const sheet =
            new SpriteSheet(

                imageId,

                this.images,

                options

            );

        this.sheets.set(

            id,

            sheet

        );

        return sheet;

    }


    // =================================================
    // OBTER SPRITESHEET
    // =================================================

    getSheet(id) {

        return this.sheets.get(id) ||
            null;

    }


    // =================================================
    // REGISTRAR SPRITE
    // =================================================

    registerSprite(
        id,
        sprite
    ) {

        if (
            typeof id !== "string" ||
            !(sprite instanceof SpriteDefinition)
        ) {

            return false;

        }

        this.sprites.set(

            id,

            sprite

        );

        return true;

    }


    // =================================================
    // OBTER SPRITE
    // =================================================

    getSprite(id) {

        return this.sprites.get(id) ||
            null;

    }


    // =================================================
    // REGISTRAR ANIMAÇÃO
    // =================================================

    registerAnimation(
        id,
        clip
    ) {

        if (
            typeof id !== "string" ||
            !(clip instanceof AnimationClip)
        ) {

            return false;

        }

        this.animations.set(

            id,

            clip

        );

        return true;

    }


    // =================================================
    // OBTER ANIMAÇÃO
    // =================================================

    getAnimation(id) {

        return this.animations.get(id) ||
            null;

    }


    // =================================================
    // CRIAR ANIMADOR
    // =================================================

    createAnimator(
        animationNames = []
    ) {

        const animator =
            new SpriteAnimator();

        for (const name of animationNames) {

            const clip =
                this.getAnimation(name);

            if (clip) {

                animator.add(

                    name,

                    clip

                );

            }

        }

        return animator;

    }


    // =================================================
    // LIMPAR REGISTROS
    // =================================================

    clear() {

        this.sheets.clear();

        this.sprites.clear();

        this.animations.clear();

    }

}


// =====================================================
// TIPOS DE COMANDOS DE RENDERIZAÇÃO
// =====================================================

export const RENDER_COMMAND_TYPES =
Object.freeze({

    RECT: "RECT",

    STROKE_RECT: "STROKE_RECT",

    LINE: "LINE",

    CIRCLE: "CIRCLE",

    TEXT: "TEXT",

    IMAGE: "IMAGE",

    SPRITE: "SPRITE",

    CUSTOM: "CUSTOM"

});


// =====================================================
// FILA DE RENDERIZAÇÃO
// =====================================================

export class RenderQueue {

    constructor(options = {}) {

        this.commands = [];

        this.maximumCommands =
            options.maximumCommands ??
            RENDER_CONFIG.MAX_RENDER_COMMANDS;

        this.sequence = 0;

        this.droppedCommands = 0;

        this.sorted = false;

    }


    // =================================================
    // ADICIONAR COMANDO
    // =================================================

    add(command) {

        if (
            !command ||
            typeof command !== "object"
        ) {

            return false;

        }

        if (
            this.commands.length >=
            this.maximumCommands
        ) {

            this.droppedCommands++;

            return false;

        }

        const normalized = {

            ...command,

            layer:
                Number.isFinite(command.layer)
                    ? command.layer
                    : RENDER_CONFIG.DEFAULT_LAYER,

            depth:
                Number.isFinite(command.depth)
                    ? command.depth
                    : 0,

            space:
                command.space === "screen"
                    ? "screen"
                    : "world",

            sequence:
                this.sequence++

        };

        this.commands.push(
            normalized
        );

        this.sorted = false;

        return true;

    }


    // =================================================
    // ADICIONAR RETÂNGULO
    // =================================================

    rect(
        x,
        y,
        width,
        height,
        color,
        options = {}
    ) {

        return this.add({

            type:
                RENDER_COMMAND_TYPES.RECT,

            x,

            y,

            width,

            height,

            color,

            ...options

        });

    }


    // =================================================
    // ADICIONAR CONTORNO DE RETÂNGULO
    // =================================================

    strokeRect(
        x,
        y,
        width,
        height,
        color,
        options = {}
    ) {

        return this.add({

            type:
                RENDER_COMMAND_TYPES.STROKE_RECT,

            x,

            y,

            width,

            height,

            color,

            ...options

        });

    }


    // =================================================
    // ADICIONAR LINHA
    // =================================================

    line(
        x1,
        y1,
        x2,
        y2,
        color,
        options = {}
    ) {

        return this.add({

            type:
                RENDER_COMMAND_TYPES.LINE,

            x1,

            y1,

            x2,

            y2,

            color,

            ...options

        });

    }


    // =================================================
    // ADICIONAR CÍRCULO
    // =================================================

    circle(
        x,
        y,
        radius,
        color,
        options = {}
    ) {

        return this.add({

            type:
                RENDER_COMMAND_TYPES.CIRCLE,

            x,

            y,

            radius,

            color,

            ...options

        });

    }


    // =================================================
    // ADICIONAR TEXTO
    // =================================================

    text(
        text,
        x,
        y,
        options = {}
    ) {

        return this.add({

            type:
                RENDER_COMMAND_TYPES.TEXT,

            text,

            x,

            y,

            ...options

        });

    }


    // =================================================
    // ADICIONAR IMAGEM
    // =================================================

    image(
        imageId,
        x,
        y,
        width,
        height,
        options = {}
    ) {

        return this.add({

            type:
                RENDER_COMMAND_TYPES.IMAGE,

            imageId,

            x,

            y,

            width,

            height,

            ...options

        });

    }


    // =================================================
    // ADICIONAR SPRITE
    // =================================================

    sprite(
        sprite,
        x,
        y,
        options = {}
    ) {

        return this.add({

            type:
                RENDER_COMMAND_TYPES.SPRITE,

            sprite,

            x,

            y,

            ...options

        });

    }


    // =================================================
    // ADICIONAR COMANDO PERSONALIZADO
    // =================================================

    custom(callback, options = {}) {

        if (
            typeof callback !== "function"
        ) {

            return false;

        }

        return this.add({

            type:
                RENDER_COMMAND_TYPES.CUSTOM,

            callback,

            ...options

        });

    }


    // =================================================
    // ORDENAR POR CAMADA E PROFUNDIDADE
    // =================================================

    sort() {

        if (this.sorted) {

            return;

        }

        this.commands.sort(

            (a, b) => {

                if (
                    a.layer !== b.layer
                ) {

                    return a.layer - b.layer;

                }

                if (
                    a.depth !== b.depth
                ) {

                    return a.depth - b.depth;

                }

                return (
                    a.sequence - b.sequence
                );

            }

        );

        this.sorted = true;

    }


    // =================================================
    // OBTER COMANDOS ORDENADOS
    // =================================================

    getSortedCommands() {

        this.sort();

        return this.commands;

    }


    // =================================================
    // LIMPAR FILA
    // =================================================

    clear() {

        this.commands.length = 0;

        this.sequence = 0;

        this.droppedCommands = 0;

        this.sorted = false;

    }


    // =================================================
    // QUANTIDADE DE COMANDOS
    // =================================================

    get length() {

        return this.commands.length;

    }


    // =================================================
    // OBTER ESTATÍSTICAS
    // =================================================

    getStatistics() {

        return {

            commands:
                this.commands.length,

            maximumCommands:
                this.maximumCommands,

            droppedCommands:
                this.droppedCommands,

            sorted:
                this.sorted

        };

    }

}


// =====================================================
// CLASSE PRINCIPAL DE RENDERIZAÇÃO
// =====================================================

export class PixelRenderer {

    constructor(
        canvas,
        options = {}
    ) {

        if (
            !canvas ||
            typeof canvas.getContext !==
                "function"
        ) {

            throw new Error(

                "O renderizador precisa de um Canvas válido."

            );

        }

        this.canvas = canvas;

        this.ctx =
            canvas.getContext(

                "2d",

                {
                    alpha: false
                }

            );

        if (!this.ctx) {

            throw new Error(

                "Não foi possível inicializar o Canvas 2D."

            );

        }

        // -----------------------------------------
        // RESOLUÇÃO VIRTUAL
        // -----------------------------------------

        this.width =
            options.width ??
            RENDER_CONFIG.VIRTUAL_WIDTH;

        this.height =
            options.height ??
            RENDER_CONFIG.VIRTUAL_HEIGHT;

        this.canvas.width =
            this.width;

        this.canvas.height =
            this.height;

        this.ctx.imageSmoothingEnabled =
            false;

        // -----------------------------------------
        // SISTEMA DE IMAGENS
        // -----------------------------------------

        this.images =
            options.images ||
            new ImageManager();

        // -----------------------------------------
        // REGISTRO DE SPRITES
        // -----------------------------------------

        this.sprites =
            new SpriteRegistry(
                this.images
            );

        // -----------------------------------------
        // CÂMERA
        // -----------------------------------------

        this.camera =
            options.camera ||
            new PixelCamera({

                width: this.width,

                height: this.height,

                worldWidth:
                    options.worldWidth ?? 5000,

                worldHeight:
                    options.worldHeight ?? 5000

            });

        // -----------------------------------------
        // FILA DE COMANDOS
        // -----------------------------------------

        this.queue =
            new RenderQueue();

        // -----------------------------------------
        // CONFIGURAÇÕES VISUAIS
        // -----------------------------------------

        this.backgroundColor =
            options.backgroundColor ||
            RENDER_CONFIG.BACKGROUND_COLOR;

        this.pixelPerfect =
            options.pixelPerfect !== false;

        this.showDebug =
            Boolean(options.showDebug);

        // -----------------------------------------
        // CONTADORES
        // -----------------------------------------

        this.frameNumber = 0;

        this.drawCalls = 0;

        this.failedDrawCalls = 0;

        this.lastFrameDrawCalls = 0;

        this.lastFrameFailures = 0;

        this.frameActive = false;

    }


    // =================================================
    // INICIAR QUADRO
    // =================================================

    beginFrame() {

        this.queue.clear();

        this.drawCalls = 0;

        this.failedDrawCalls = 0;

        this.frameActive = true;

        this.ctx.setTransform(

            1,

            0,

            0,

            1,

            0,

            0

        );

        this.ctx.imageSmoothingEnabled =
            false;

        this.ctx.globalAlpha = 1;

        this.ctx.globalCompositeOperation =
            BLEND_MODES.NORMAL;

        this.ctx.fillStyle =
            this.backgroundColor;

        this.ctx.fillRect(

            0,

            0,

            this.width,

            this.height

        );

    }


    // =================================================
    // FINALIZAR QUADRO
    // =================================================

    endFrame() {

        if (!this.frameActive) {

            return;

        }

        this.flush();

        this.lastFrameDrawCalls =
            this.drawCalls;

        this.lastFrameFailures =
            this.failedDrawCalls;

        this.frameNumber++;

        this.frameActive = false;

    }


    // =================================================
    // ADICIONAR COMANDO
    // =================================================

    submit(command) {

        return this.queue.add(
            command
        );

    }


    // =================================================
    // DESENHAR RETÂNGULO
    // =================================================

    drawRect(
        x,
        y,
        width,
        height,
        color,
        options = {}
    ) {

        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !Number.isFinite(width) ||
            !Number.isFinite(height) ||
            width <= 0 ||
            height <= 0
        ) {

            return false;

        }

        return this.queue.rect(

            x,

            y,

            width,

            height,

            color,

            options

        );

    }


    // =================================================
    // DESENHAR LINHA
    // =================================================

    drawLine(
        x1,
        y1,
        x2,
        y2,
        color,
        options = {}
    ) {

        return this.queue.line(

            x1,

            y1,

            x2,

            y2,

            color,

            options

        );

    }


    // =================================================
    // DESENHAR CÍRCULO
    // =================================================

    drawCircle(
        x,
        y,
        radius,
        color,
        options = {}
    ) {

        return this.queue.circle(

            x,

            y,

            radius,

            color,

            options

        );

    }


    // =================================================
    // DESENHAR TEXTO
    // =================================================

    drawText(
        text,
        x,
        y,
        options = {}
    ) {

        return this.queue.text(

            text,

            x,

            y,

            options

        );

    }


    // =================================================
    // DESENHAR IMAGEM
    // =================================================

    drawImage(
        imageId,
        x,
        y,
        width,
        height,
        options = {}
    ) {

        return this.queue.image(

            imageId,

            x,

            y,

            width,

            height,

            options

        );

    }


    // =================================================
    // DESENHAR SPRITE
    // =================================================

    drawSprite(
        sprite,
        x,
        y,
        options = {}
    ) {

        return this.queue.sprite(

            sprite,

            x,

            y,

            options

        );

    }


    // =================================================
    // RESOLVER SPRITE
    // =================================================

    resolveSprite(value) {

        if (
            value instanceof SpriteDefinition
        ) {

            return value;

        }

        if (
            typeof value === "string"
        ) {

            return this.sprites.getSprite(
                value
            );

        }

        return null;

    }


    // =================================================
    // DESENHAR SPRITE IMEDIATAMENTE
    // =================================================

    drawSpriteImmediate(
        spriteValue,
        x,
        y,
        options = {}
    ) {

        const sprite =
            this.resolveSprite(
                spriteValue
            );

        if (!sprite) {

            this.failedDrawCalls++;

            return false;

        }

        const image =
            this.images.get(
                sprite.imageId
            );

        if (
            !spriteValidRegion(

                image,

                sprite.x,

                sprite.y,

                sprite.width,

                sprite.height

            )
        ) {

            this.failedDrawCalls++;

            return false;

        }

        const scaleX =
            spritePositive(

                options.scaleX,

                sprite.scaleX

            );

        const scaleY =
            spritePositive(

                options.scaleY,

                sprite.scaleY

            );

        const width =
            sprite.width * scaleX;

        const height =
            sprite.height * scaleY;

        const anchorX =
            options.anchorX ??
            sprite.anchorX;

        const anchorY =
            options.anchorY ??
            sprite.anchorY;

        const rotation =
            options.rotation ??
            sprite.rotation;

        const flipX =
            options.flipX ??
            sprite.flipX;

        const flipY =
            options.flipY ??
            sprite.flipY;

        const alpha =
            spriteClamp(

                options.alpha ??
                sprite.alpha,

                0,

                1

            );

        const offsetX =
            sprite.offsetX +
            spriteFinite(options.offsetX);

        const offsetY =
            sprite.offsetY +
            spriteFinite(options.offsetY);

        const ctx =
            this.ctx;

        ctx.save();

        ctx.globalAlpha *=
            alpha;

        ctx.globalCompositeOperation =

            options.blendMode ||
            BLEND_MODES.NORMAL;

        ctx.imageSmoothingEnabled =
            false;

        // -----------------------------------------
        // POSICIONAMENTO
        // -----------------------------------------

        ctx.translate(

            Math.round(x + offsetX),

            Math.round(y + offsetY)

        );

        // -----------------------------------------
        // ROTAÇÃO
        // -----------------------------------------

        if (rotation !== 0) {

            ctx.rotate(rotation);

        }

        // -----------------------------------------
        // ESPELHAMENTO
        // -----------------------------------------

        ctx.scale(

            flipX ? -1 : 1,

            flipY ? -1 : 1

        );

        // -----------------------------------------
        // DESENHO
        // -----------------------------------------

        const drawX =
            Math.round(
                -width * anchorX
            );

        const drawY =
            Math.round(
                -height * anchorY
            );

        ctx.drawImage(

            image,

            sprite.x,

            sprite.y,

            sprite.width,

            sprite.height,

            drawX,

            drawY,

            Math.max(
                1,
                Math.round(width)
            ),

            Math.max(
                1,
                Math.round(height)
            )

        );

        ctx.restore();

        this.drawCalls++;

        return true;

    }


    // =================================================
    // DESENHAR ANIMAÇÃO
    // =================================================

    drawAnimation(
        animator,
        x,
        y,
        options = {}
    ) {

        if (
            !(animator instanceof SpriteAnimator)
        ) {

            return false;

        }

        const sprite =
            animator.getCurrentSprite();

        if (!sprite) {

            return false;

        }

        return this.drawSprite(

            sprite,

            x,

            y,

            options

        );

    }


    // =================================================
    // DESENHAR RETÂNGULO IMEDIATAMENTE
    // =================================================

    drawRectImmediate(command) {

        const ctx =
            this.ctx;

        const x =
            Number(command.x);

        const y =
            Number(command.y);

        const width =
            Number(command.width);

        const height =
            Number(command.height);

        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !Number.isFinite(width) ||
            !Number.isFinite(height) ||
            width <= 0 ||
            height <= 0
        ) {

            return false;

        }

        ctx.fillStyle =
            command.color || "#ffffff";

        ctx.fillRect(

            Math.round(x),

            Math.round(y),

            Math.round(width),

            Math.round(height)

        );

        this.drawCalls++;

        return true;

    }


    // =================================================
    // DESENHAR LINHA IMEDIATAMENTE
    // =================================================

    drawLineImmediate(command) {

        const ctx =
            this.ctx;

        ctx.strokeStyle =
            command.color || "#ffffff";

        ctx.lineWidth =
            spritePositive(

                command.lineWidth,

                1

            );

        ctx.beginPath();

        ctx.moveTo(

            command.x1,

            command.y1

        );

        ctx.lineTo(

            command.x2,

            command.y2

        );

        ctx.stroke();

        this.drawCalls++;

        return true;

    }


    // =================================================
    // DESENHAR CÍRCULO IMEDIATAMENTE
    // =================================================

    drawCircleImmediate(command) {

        const ctx =
            this.ctx;

        const radius =
            spritePositive(

                command.radius,

                1

            );

        ctx.beginPath();

        ctx.arc(

            command.x,

            command.y,

            radius,

            0,

            Math.PI * 2

        );

        if (command.stroke) {

            ctx.strokeStyle =
                command.color || "#ffffff";

            ctx.lineWidth =
                spritePositive(

                    command.lineWidth,

                    1

                );

            ctx.stroke();

        } else {

            ctx.fillStyle =
                command.color || "#ffffff";

            ctx.fill();

        }

        this.drawCalls++;

        return true;

    }


    // =================================================
    // DESENHAR TEXTO IMEDIATAMENTE
    // =================================================

    drawTextImmediate(command) {

        const ctx =
            this.ctx;

        ctx.font =

            command.font ||

            `${RENDER_CONFIG.DEFAULT_FONT_SIZE}px monospace`;

        ctx.fillStyle =
            command.color || "#ffffff";

        ctx.textAlign =
            command.align || "left";

        ctx.textBaseline =
            command.baseline || "alphabetic";

        ctx.fillText(

            String(command.text ?? ""),

            command.x,

            command.y,

            command.maxWidth

        );

        this.drawCalls++;

        return true;

    }


    // =================================================
    // DESENHAR IMAGEM IMEDIATAMENTE
    // =================================================

    drawImageImmediate(command) {

        const image =
            this.images.get(
                command.imageId
            );

        if (!spriteImageReady(image)) {

            this.failedDrawCalls++;

            return false;

        }

        const width =
            command.width ??
            image.width;

        const height =
            command.height ??
            image.height;

        if (
            !Number.isFinite(width) ||
            !Number.isFinite(height) ||
            width <= 0 ||
            height <= 0
        ) {

            return false;

        }

        const ctx =
            this.ctx;

        ctx.drawImage(

            image,

            Math.round(command.x),

            Math.round(command.y),

            Math.round(width),

            Math.round(height)

        );

        this.drawCalls++;

        return true;

    }


    // =================================================
    // EXECUTAR COMANDO GRÁFICO
    // =================================================

    executeCommand(command) {

        if (!command) {

            return false;

        }

        switch (command.type) {

            case RENDER_COMMAND_TYPES.RECT:

                return this.drawRectImmediate(
                    command
                );

            case RENDER_COMMAND_TYPES.STROKE_RECT:

                this.ctx.strokeStyle =
                    command.color || "#ffffff";

                this.ctx.lineWidth =
                    command.lineWidth || 1;

                this.ctx.strokeRect(

                    command.x,

                    command.y,

                    command.width,

                    command.height

                );

                this.drawCalls++;

                return true;

            case RENDER_COMMAND_TYPES.LINE:

                return this.drawLineImmediate(
                    command
                );

            case RENDER_COMMAND_TYPES.CIRCLE:

                return this.drawCircleImmediate(
                    command
                );

            case RENDER_COMMAND_TYPES.TEXT:

                return this.drawTextImmediate(
                    command
                );

            case RENDER_COMMAND_TYPES.IMAGE:

                return this.drawImageImmediate(
                    command
                );

            case RENDER_COMMAND_TYPES.SPRITE:

                return this.drawSpriteImmediate(

                    command.sprite,

                    command.x,

                    command.y,

                    command

                );

            case RENDER_COMMAND_TYPES.CUSTOM:

                if (
                    typeof command.callback ===
                    "function"
                ) {

                    command.callback(

                        this.ctx,

                        this

                    );

                    this.drawCalls++;

                    return true;

                }

                return false;

            default:

                return false;

        }

    }


    // =================================================
    // EXECUTAR FILA DE RENDERIZAÇÃO
    // =================================================

    flush() {

        const commands =
            this.queue.getSortedCommands();

        const ctx =
            this.ctx;

        let currentSpace = null;

        try {

            for (const command of commands) {

                // -------------------------------------
                // ALTERNAR ENTRE MUNDO E TELA
                // -------------------------------------

                if (
                    currentSpace !==
                    command.space
                ) {

                    if (
                        currentSpace === "world"
                    ) {

                        this.camera.restore(ctx);

                    }

                    currentSpace =
                        command.space;

                    if (
                        currentSpace === "world"
                    ) {

                        this.camera.apply(ctx);

                    }

                }

                // -------------------------------------
                // EXECUTAR COMANDO
                // -------------------------------------

                ctx.save();

                try {

                    const alpha =
                        spriteClamp(

                            command.alpha ?? 1,

                            0,

                            1

                        );

                    ctx.globalAlpha *=
                        alpha;

                    if (command.blendMode) {

                        ctx.globalCompositeOperation =
                            command.blendMode;

                    }

                    this.executeCommand(
                        command
                    );

                } catch (error) {

                    this.failedDrawCalls++;

                    console.error(

                        "Erro de renderização:",

                        error

                    );

                } finally {

                    ctx.restore();

                }

            }

        } finally {

            if (
                currentSpace === "world"
            ) {

                this.camera.restore(ctx);

            }

            this.queue.clear();

        }

    }


    // =================================================
    // CONFIGURAR TAMANHO VIRTUAL
    // =================================================

    setVirtualSize(width, height) {

        if (
            !Number.isInteger(width) ||
            !Number.isInteger(height) ||
            width <= 0 ||
            height <= 0
        ) {

            return false;

        }

        this.width = width;

        this.height = height;

        this.canvas.width = width;

        this.canvas.height = height;

        this.ctx.imageSmoothingEnabled =
            false;

        this.camera.setViewportSize(

            width,

            height

        );

        return true;

    }


    // =================================================
    // ATUALIZAR CÂMERA
    // =================================================

    update(deltaTime) {

        this.camera.update(
            deltaTime
        );

    }


    // =================================================
    // ATIVAR DEPURAÇÃO
    // =================================================

    setDebug(enabled) {

        this.showDebug =
            Boolean(enabled);

    }


    // =================================================
    // OBTER ESTATÍSTICAS
    // =================================================

    getStatistics() {

        return {

            frameNumber:
                this.frameNumber,

            drawCalls:
                this.lastFrameDrawCalls,

            failedDrawCalls:
                this.lastFrameFailures,

            width:
                this.width,

            height:
                this.height,

            cameraX:
                this.camera.x,

            cameraY:
                this.camera.y,

            cameraZoom:
                this.camera.zoom,

            images:
                this.images.getStatistics(),

            queue:
                this.queue.getStatistics()

        };

    }

}

