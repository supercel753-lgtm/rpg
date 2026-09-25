
"use strict";

/*
========================================================
ZELDA PIXEL ADVENTURE
LIGHTING ENGINE — BETA 3

ARQUIVO: lighting.js

SISTEMAS:

- Iluminação ambiental
- Dia e noite
- Luzes dinâmicas
- Tochas
- Fogueiras
- Magias luminosas
- Relâmpagos
- Transições
- Luzes pulsantes
- Máscaras de iluminação
- Câmera
- Sobreposição ambiental

========================================================
*/


// =====================================================
// CONFIGURAÇÕES
// =====================================================

export const LIGHTING_CONFIG = Object.freeze({

    MAX_LIGHTS: 128,

    DEFAULT_RADIUS: 70,

    DEFAULT_INTENSITY: 1,

    NIGHT_DARKNESS: 0.72,

    DUSK_DARKNESS: 0.35,

    DAWN_DARKNESS: 0.35,

    MAX_DELTA_TIME: 0.05,

    FLASH_DECAY: 4

});


// =====================================================
// UTILITÁRIOS
// =====================================================

function lightClamp(value, min, max) {

    return Math.max(

        min,

        Math.min(max, value)

    );

}


// =====================================================
// CLASSE DE LUZ
// =====================================================

export class LightSource {

    constructor(options = {}) {

        this.id =
            options.id || null;

        this.x =
            options.x ?? 0;

        this.y =
            options.y ?? 0;

        this.radius =
            options.radius ??
            LIGHTING_CONFIG.DEFAULT_RADIUS;

        this.intensity =
            options.intensity ??
            LIGHTING_CONFIG.DEFAULT_INTENSITY;

        this.color =
            options.color ||
            "#fff0b3";

        this.enabled =
            options.enabled !== false;

        this.flicker =
            options.flicker ?? false;

        this.flickerSpeed =
            options.flickerSpeed ?? 6;

        this.flickerAmount =
            options.flickerAmount ?? 0.12;

        this.pulse =
            options.pulse ?? false;

        this.pulseSpeed =
            options.pulseSpeed ?? 2;

        this.pulseAmount =
            options.pulseAmount ?? 0.10;

        this.time = 0;

        this.currentRadius =
            this.radius;

        this.currentIntensity =
            this.intensity;

    }


    // =================================================
    // ATUALIZAR LUZ
    // =================================================

    update(dt) {

        if (!this.enabled) {

            return;

        }

        this.time += dt;

        this.currentRadius =
            this.radius;

        this.currentIntensity =
            this.intensity;

        // -----------------------------------------
        // TREMULAÇÃO DE CHAMAS
        // -----------------------------------------

        if (this.flicker) {

            const variation =

                Math.sin(
                    this.time *
                    this.flickerSpeed
                ) *

                Math.cos(
                    this.time *
                    this.flickerSpeed * 1.73
                );

            this.currentRadius *=

                1 +

                variation *
                this.flickerAmount;

            this.currentIntensity *=

                1 +

                variation *
                this.flickerAmount;

        }

        // -----------------------------------------
        // PULSAÇÃO
        // -----------------------------------------

        if (this.pulse) {

            const wave =

                Math.sin(

                    this.time *
                    this.pulseSpeed

                );

            this.currentRadius *=

                1 +

                wave *
                this.pulseAmount;

        }

        this.currentIntensity =
            lightClamp(

                this.currentIntensity,

                0,

                2

            );

    }

}


// =====================================================
// SISTEMA PRINCIPAL DE ILUMINAÇÃO
// =====================================================

export class LightingSystem {

    constructor(
        width = 320,
        height = 180
    ) {

        this.width = width;

        this.height = height;

        this.lights =
            new Map();

        this.nextLightId = 1;

        // -----------------------------------------
        // CAMADA DE ILUMINAÇÃO
        // -----------------------------------------

        this.canvas =
            document.createElement("canvas");

        this.canvas.width = width;

        this.canvas.height = height;

        this.ctx =
            this.canvas.getContext("2d");

        // -----------------------------------------
        // ILUMINAÇÃO AMBIENTAL
        // -----------------------------------------

        this.ambientDarkness = 0;

        this.targetDarkness = 0;

        this.ambientColor =
            "#09152b";

        // -----------------------------------------
        // RELÂMPAGOS
        // -----------------------------------------

        this.flashIntensity = 0;

        this.flashColor =
            "#e8f0ff";

        // -----------------------------------------
        // ESTADO
        // -----------------------------------------

        this.enabled = true;

        this.time = 0;

        this.lightCount = 0;

    }


    // =================================================
    // REDIMENSIONAR
    // =================================================

    resize(width, height) {

        if (
            !Number.isInteger(width) ||
            !Number.isInteger(height) ||
            width <= 0 ||
            height <= 0
        ) {

            return false;

        }

        if (
            this.width === width &&
            this.height === height
        ) {

            return true;

        }

        this.width = width;

        this.height = height;

        this.canvas.width = width;

        this.canvas.height = height;

        return true;

    }


    // =================================================
    // ADICIONAR LUZ
    // =================================================

    addLight(options = {}) {

        if (
            this.lights.size >=
            LIGHTING_CONFIG.MAX_LIGHTS
        ) {

            return null;

        }

        const light =
            new LightSource(options);

        if (!light.id) {

            light.id =
                this.nextLightId++;

        }

        this.lights.set(

            light.id,

            light

        );

        return light;

    }


    // =================================================
    // OBTER LUZ
    // =================================================

    getLight(id) {

        return this.lights.get(id) ||
            null;

    }


    // =================================================
    // REMOVER LUZ
    // =================================================

    removeLight(id) {

        return this.lights.delete(id);

    }


    // =================================================
    // CRIAR TOCHA
    // =================================================

    createTorch(x, y) {

        return this.addLight({

            x,

            y,

            radius: 65,

            intensity: 0.95,

            color: "#ffb365",

            flicker: true,

            flickerSpeed: 9,

            flickerAmount: 0.13

        });

    }


    // =================================================
    // CRIAR FOGUEIRA
    // =================================================

    createCampfire(x, y) {

        return this.addLight({

            x,

            y,

            radius: 110,

            intensity: 1.15,

            color: "#ff9a49",

            flicker: true,

            flickerSpeed: 7,

            flickerAmount: 0.18

        });

    }


    // =================================================
    // CRIAR LUZ MÁGICA
    // =================================================

    createMagicLight(
        x,
        y,
        color = "#83c9ff"
    ) {

        return this.addLight({

            x,

            y,

            radius: 90,

            intensity: 1,

            color,

            pulse: true,

            pulseSpeed: 3,

            pulseAmount: 0.15

        });

    }


    // =================================================
    // ATUALIZAR ILUMINAÇÃO AMBIENTAL
    // =================================================

    updateAmbient(world, dt) {

        if (!world) {

            return;

        }

        const phase =
            world.getDayPhase?.() ||
            "DAY";

        switch (phase) {

            case "NIGHT":

                this.targetDarkness =
                    LIGHTING_CONFIG.NIGHT_DARKNESS;

                this.ambientColor =
                    "#09152b";

                break;

            case "DUSK":

                this.targetDarkness =
                    LIGHTING_CONFIG.DUSK_DARKNESS;

                this.ambientColor =
                    "#30233a";

                break;

            case "DAWN":

                this.targetDarkness =
                    LIGHTING_CONFIG.DAWN_DARKNESS;

                this.ambientColor =
                    "#302f48";

                break;

            default:

                this.targetDarkness = 0;

                this.ambientColor =
                    "#09152b";

                break;

        }

        // -----------------------------------------
        // INFLUÊNCIA DO CLIMA
        // -----------------------------------------

        if (
            world.currentWeather ===
            "STORM"
        ) {

            this.targetDarkness += 0.20;

        }

        if (
            world.currentWeather ===
            "RAIN"
        ) {

            this.targetDarkness += 0.08;

        }

        // -----------------------------------------
        // TRANSIÇÃO
        // -----------------------------------------

        const factor =

            1 -

            Math.exp(
                -3 * dt
            );

        this.ambientDarkness +=

            (
                this.targetDarkness -
                this.ambientDarkness
            ) * factor;

        this.ambientDarkness =
            lightClamp(

                this.ambientDarkness,

                0,

                0.90

            );

    }


    // =================================================
    // DISPARAR RELÂMPAGO
    // =================================================

    flash(
        intensity = 1,
        color = "#e8f0ff"
    ) {

        this.flashIntensity =
            lightClamp(

                intensity,

                0,

                1

            );

        this.flashColor = color;

    }


    // =================================================
    // ATUALIZAR
    // =================================================

    update(dt, world = null) {

        if (
            !this.enabled ||
            !Number.isFinite(dt) ||
            dt <= 0
        ) {

            return;

        }

        dt = Math.min(

            dt,

            LIGHTING_CONFIG.MAX_DELTA_TIME

        );

        this.time += dt;

        // -----------------------------------------
        // AMBIENTE
        // -----------------------------------------

        this.updateAmbient(
            world,
            dt
        );

        // -----------------------------------------
        // LUZES
        // -----------------------------------------

        for (
            const light of
            this.lights.values()
        ) {

            light.update(dt);

        }

        // -----------------------------------------
        // RELÂMPAGO
        // -----------------------------------------

        this.flashIntensity = Math.max(

            0,

            this.flashIntensity -
            LIGHTING_CONFIG.FLASH_DECAY * dt

        );

    }


    // =================================================
    // DESENHAR MÁSCARA DE LUZ
    // =================================================

    drawLightMask(
        ctx,
        x,
        y,
        radius,
        intensity
    ) {

        if (
            radius <= 0 ||
            intensity <= 0
        ) {

            return;

        }

        const gradient =
            ctx.createRadialGradient(

                x,

                y,

                0,

                x,

                y,

                radius

            );

        gradient.addColorStop(

            0,

            `rgba(0,0,0,${lightClamp(
                intensity,
                0,
                1
            )})`

        );

        gradient.addColorStop(

            0.5,

            `rgba(0,0,0,${lightClamp(
                intensity * 0.65,
                0,
                1
            )})`

        );

        gradient.addColorStop(

            1,

            "rgba(0,0,0,0)"

        );

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.arc(

            x,

            y,

            radius,

            0,

            Math.PI * 2

        );

        ctx.fill();

    }


    // =================================================
    // RENDERIZAR ILUMINAÇÃO
    // =================================================

    draw(
        targetCtx,
        cameraX = 0,
        cameraY = 0
    ) {

        if (
            !this.enabled ||
            !targetCtx
        ) {

            return;

        }

        const ctx =
            this.ctx;

        ctx.save();

        ctx.setTransform(
            1,
            0,
            0,
            1,
            0,
            0
        );

        ctx.clearRect(

            0,

            0,

            this.width,

            this.height

        );

        // -----------------------------------------
        // ESCURIDÃO AMBIENTAL
        // -----------------------------------------

        ctx.globalCompositeOperation =
            "source-over";

        ctx.globalAlpha =
            this.ambientDarkness;

        ctx.fillStyle =
            this.ambientColor;

        ctx.fillRect(

            0,

            0,

            this.width,

            this.height

        );

        ctx.globalAlpha = 1;

        // -----------------------------------------
        // ABRIR ÁREAS ILUMINADAS
        // -----------------------------------------

        ctx.globalCompositeOperation =
            "destination-out";

        this.lightCount = 0;

        for (
            const light of
            this.lights.values()
        ) {

            if (!light.enabled) {

                continue;

            }

            const x =

                light.x - cameraX;

            const y =

                light.y - cameraY;

            const radius =
                light.currentRadius;

            // -------------------------------------
            // IGNORAR LUZES FORA DA TELA
            // -------------------------------------

            if (

                x + radius < 0 ||

                y + radius < 0 ||

                x - radius > this.width ||

                y - radius > this.height

            ) {

                continue;

            }

            this.drawLightMask(

                ctx,

                x,

                y,

                radius,

                light.currentIntensity

            );

            this.lightCount++;

        }

        ctx.restore();

        // -----------------------------------------
        // APLICAR SOMBRA NO CENÁRIO
        // -----------------------------------------

        targetCtx.save();

        targetCtx.setTransform(
            1,
            0,
            0,
            1,
            0,
            0
        );

        targetCtx.drawImage(

            this.canvas,

            0,

            0

        );

        // -----------------------------------------
        // RELÂMPAGO
        // -----------------------------------------

        if (
            this.flashIntensity > 0
        ) {

            targetCtx.globalAlpha =
                this.flashIntensity * 0.65;

            targetCtx.fillStyle =
                this.flashColor;

            targetCtx.fillRect(

                0,

                0,

                this.width,

                this.height

            );

        }

        targetCtx.restore();

    }


    // =================================================
    // LIMPAR LUZES
    // =================================================

    clear() {

        this.lights.clear();

    }


    // =================================================
    // ESTATÍSTICAS
    // =================================================

    getStatistics() {

        return {

            registeredLights:
                this.lights.size,

            visibleLights:
                this.lightCount,

            ambientDarkness:
                this.ambientDarkness,

            flashIntensity:
                this.flashIntensity

        };

    }

}


// =====================================================
// INSTÂNCIA COMPARTILHADA
// =====================================================

export const lighting =
    new LightingSystem();


// =====================================================
// FIM DO LIGHTING.JS
// =====================================================
