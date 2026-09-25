
"use strict";

/*
========================================================
ZELDA PIXEL ADVENTURE
PARTICLE ENGINE — BETA 3

ARQUIVO: particles.js

SISTEMAS:

- Partículas de combate
- Golpes
- Magia
- Fogo
- Gelo
- Eletricidade
- Cura
- Poeira
- Recompensas
- Morte de inimigos
- Efeitos de chefes
- Gravidade
- Movimento
- Transparência
- Tempo de vida
- Renderização otimizada

========================================================
*/


// =====================================================
// CONFIGURAÇÕES
// =====================================================

export const PARTICLE_CONFIG = Object.freeze({

    MAX_PARTICLES: 1200,

    MAX_DELTA_TIME: 0.05,

    GRAVITY: 100,

    DEFAULT_LIFETIME: 0.5,

    DEFAULT_SIZE: 2,

    DEFAULT_SPEED: 40

});


// =====================================================
// TIPOS
// =====================================================

export const PARTICLE_TYPES = Object.freeze({

    HIT: "hit",

    BLOODLESS_HIT: "bloodless_hit",

    FIRE: "fire",

    ICE: "ice",

    LIGHTNING: "lightning",

    HEAL: "heal",

    MAGIC: "magic",

    DUST: "dust",

    SPARK: "spark",

    DEATH: "death",

    LOOT: "loot",

    SMOKE: "smoke"

});


// =====================================================
// PALETAS
// =====================================================

export const PARTICLE_COLORS = Object.freeze({

    hit: [
        "#ffffff",
        "#f4d88c",
        "#ffae62"
    ],

    bloodless_hit: [
        "#ffffff",
        "#d8d8d8",
        "#f3c56d"
    ],

    fire: [
        "#fff1a0",
        "#ffc45c",
        "#ef743c",
        "#b63b31"
    ],

    ice: [
        "#ffffff",
        "#b8e9ff",
        "#65b9e8",
        "#3484ba"
    ],

    lightning: [
        "#ffffff",
        "#e9f7ff",
        "#9ecfff",
        "#6b8ff2"
    ],

    heal: [
        "#e9ffc8",
        "#b1e68a",
        "#65c977",
        "#329a66"
    ],

    magic: [
        "#f7ddff",
        "#d1a8f5",
        "#9576d9",
        "#6446a3"
    ],

    dust: [
        "#c9b58e",
        "#a48b6b",
        "#806c56"
    ],

    spark: [
        "#fff3bb",
        "#f5d27e",
        "#e4a24b"
    ],

    death: [
        "#d8d9d7",
        "#a5a8a5",
        "#686e69"
    ],

    loot: [
        "#fff8c4",
        "#f5dc79",
        "#d7a94c"
    ],

    smoke: [
        "#777c81",
        "#53585f",
        "#343941"
    ]

});


// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function particleRandom(min, max) {

    return min +
        Math.random() *
        (max - min);

}


function particleClamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}


// =====================================================
// CLASSE PARTÍCULA
// =====================================================

export class Particle {

    constructor(options = {}) {

        this.x =
            options.x ?? 0;

        this.y =
            options.y ?? 0;

        this.previousX = this.x;

        this.previousY = this.y;

        // -----------------------------------------
        // VELOCIDADE
        // -----------------------------------------

        this.vx =
            options.vx ?? 0;

        this.vy =
            options.vy ?? 0;

        this.ax =
            options.ax ?? 0;

        this.ay =
            options.ay ?? 0;

        this.gravity =
            options.gravity ?? 0;

        this.drag =
            options.drag ?? 0;

        // -----------------------------------------
        // VIDA
        // -----------------------------------------

        this.life =
            options.life ??
            PARTICLE_CONFIG.DEFAULT_LIFETIME;

        this.maxLife =
            this.life;

        this.dead = false;

        // -----------------------------------------
        // VISUAL
        // -----------------------------------------

        this.size =
            options.size ??
            PARTICLE_CONFIG.DEFAULT_SIZE;

        this.startSize =
            this.size;

        this.endSize =
            options.endSize ?? 0;

        this.color =
            options.color || "#ffffff";

        this.alpha =
            options.alpha ?? 1;

        this.rotation =
            options.rotation ?? 0;

        this.rotationSpeed =
            options.rotationSpeed ?? 0;

        // -----------------------------------------
        // COMPORTAMENTO
        // -----------------------------------------

        this.fade =
            options.fade !== false;

        this.shrink =
            options.shrink !== false;

        this.glow =
            options.glow ?? false;

        this.screenSpace =
            options.screenSpace ?? false;

    }


    // =================================================
    // ATUALIZAR
    // =================================================

    update(dt) {

        if (this.dead) {

            return;

        }

        this.previousX = this.x;

        this.previousY = this.y;

        this.life -= dt;

        if (this.life <= 0) {

            this.life = 0;

            this.dead = true;

            return;

        }

        // -----------------------------------------
        // ACELERAÇÃO
        // -----------------------------------------

        this.vx += this.ax * dt;

        this.vy += (

            this.ay +
            this.gravity

        ) * dt;

        // -----------------------------------------
        // RESISTÊNCIA DO AR
        // -----------------------------------------

        if (this.drag > 0) {

            const factor =
                Math.exp(
                    -this.drag * dt
                );

            this.vx *= factor;

            this.vy *= factor;

        }

        // -----------------------------------------
        // MOVIMENTO
        // -----------------------------------------

        this.x += this.vx * dt;

        this.y += this.vy * dt;

        this.rotation +=
            this.rotationSpeed * dt;

        // -----------------------------------------
        // TAMANHO
        // -----------------------------------------

        if (this.shrink) {

            const progress =

                1 -
                this.life / this.maxLife;

            this.size =

                this.startSize +

                (
                    this.endSize -
                    this.startSize
                ) * progress;

        }

        // -----------------------------------------
        // TRANSPARÊNCIA
        // -----------------------------------------

        if (this.fade) {

            this.alpha =

                particleClamp(

                    this.life /
                    this.maxLife,

                    0,

                    1

                );

        }

    }


    // =================================================
    // DESENHAR
    // =================================================

    draw(ctx) {

        if (
            this.dead ||
            this.size <= 0
        ) {

            return;

        }

        ctx.save();

        ctx.globalAlpha *=
            this.alpha;

        if (this.glow) {

            ctx.globalCompositeOperation =
                "lighter";

        }

        ctx.translate(

            Math.round(this.x),

            Math.round(this.y)

        );

        if (this.rotation !== 0) {

            ctx.rotate(
                this.rotation
            );

        }

        ctx.fillStyle =
            this.color;

        const size =
            Math.max(
                1,
                Math.round(this.size)
            );

        ctx.fillRect(

            -Math.floor(size / 2),

            -Math.floor(size / 2),

            size,

            size

        );

        ctx.restore();

    }

}


// =====================================================
// GERENCIADOR DE PARTÍCULAS
// =====================================================

export class ParticleSystem {

    constructor(options = {}) {

        this.particles = [];

        this.maximum =
            options.maximum ??
            PARTICLE_CONFIG.MAX_PARTICLES;

        this.enabled = true;

        this.emitted = 0;

        this.dropped = 0;

    }


    // =================================================
    // ADICIONAR PARTÍCULA
    // =================================================

    add(options = {}) {

        if (!this.enabled) {

            return null;

        }

        if (
            this.particles.length >=
            this.maximum
        ) {

            this.dropped++;

            return null;

        }

        const particle =
            new Particle(options);

        this.particles.push(
            particle
        );

        this.emitted++;

        return particle;

    }


    // =================================================
    // GERAR EXPLOSÃO DE PARTÍCULAS
    // =================================================

    burst(
        type,
        x,
        y,
        options = {}
    ) {

        const colors =

            PARTICLE_COLORS[type] ||

            PARTICLE_COLORS.magic;

        const count =
            Math.max(
                1,
                Math.floor(
                    options.count ?? 12
                )
            );

        const speed =
            options.speed ??
            PARTICLE_CONFIG.DEFAULT_SPEED;

        const life =
            options.life ??
            PARTICLE_CONFIG.DEFAULT_LIFETIME;

        const size =
            options.size ??
            PARTICLE_CONFIG.DEFAULT_SIZE;

        const spread =
            options.spread ??
            Math.PI * 2;

        const direction =
            options.direction ?? 0;

        const particles = [];

        for (
            let i = 0;
            i < count;
            i++
        ) {

            const angle =

                direction +

                particleRandom(
                    -spread / 2,
                    spread / 2
                );

            const velocity =
                particleRandom(

                    speed * 0.35,

                    speed

                );

            const color =
                colors[
                    Math.floor(
                        Math.random() *
                        colors.length
                    )
                ];

            const particle =
                this.add({

                    x,

                    y,

                    vx:
                        Math.cos(angle) *
                        velocity,

                    vy:
                        Math.sin(angle) *
                        velocity,

                    life:
                        particleRandom(
                            life * 0.6,
                            life * 1.2
                        ),

                    size:
                        particleRandom(
                            size * 0.5,
                            size * 1.5
                        ),

                    color,

                    gravity:
                        options.gravity ?? 0,

                    drag:
                        options.drag ?? 0,

                    glow:
                        options.glow ?? false

                });

            if (particle) {

                particles.push(particle);

            }

        }

        return particles;

    }


    // =================================================
    // EFEITO DE ATAQUE
    // =================================================

    hit(x, y, damage = 10) {

        return this.burst(

            PARTICLE_TYPES.HIT,

            x,

            y,

            {

                count:
                    Math.min(
                        30,
                        8 + Math.floor(
                            damage / 3
                        )
                    ),

                speed: 55,

                life: 0.25,

                size: 2,

                gravity: 65

            }

        );

    }


    // =================================================
    // EFEITO DE FOGO
    // =================================================

    fire(x, y, intensity = 1) {

        return this.burst(

            PARTICLE_TYPES.FIRE,

            x,

            y,

            {

                count:
                    Math.floor(
                        18 * intensity
                    ),

                speed: 35,

                life: 0.65,

                size: 3,

                direction:
                    -Math.PI / 2,

                spread:
                    Math.PI * 0.7,

                gravity: -25,

                glow: true

            }

        );

    }


    // =================================================
    // EFEITO DE GELO
    // =================================================

    ice(x, y) {

        return this.burst(

            PARTICLE_TYPES.ICE,

            x,

            y,

            {

                count: 22,

                speed: 50,

                life: 0.55,

                size: 2,

                gravity: 35,

                glow: true

            }

        );

    }


    // =================================================
    // EFEITO DE ELETRICIDADE
    // =================================================

    lightning(x, y) {

        return this.burst(

            PARTICLE_TYPES.LIGHTNING,

            x,

            y,

            {

                count: 25,

                speed: 85,

                life: 0.20,

                size: 2,

                glow: true

            }

        );

    }


    // =================================================
    // EFEITO DE CURA
    // =================================================

    heal(x, y) {

        return this.burst(

            PARTICLE_TYPES.HEAL,

            x,

            y,

            {

                count: 18,

                speed: 24,

                life: 0.85,

                size: 2,

                direction:
                    -Math.PI / 2,

                spread:
                    Math.PI,

                gravity: -10,

                glow: true

            }

        );

    }


    // =================================================
    // EFEITO DE MAGIA
    // =================================================

    magic(x, y) {

        return this.burst(

            PARTICLE_TYPES.MAGIC,

            x,

            y,

            {

                count: 20,

                speed: 45,

                life: 0.65,

                size: 2,

                glow: true

            }

        );

    }


    // =================================================
    // EFEITO DE POEIRA
    // =================================================

    dust(x, y) {

        return this.burst(

            PARTICLE_TYPES.DUST,

            x,

            y,

            {

                count: 6,

                speed: 15,

                life: 0.35,

                size: 2,

                gravity: -5

            }

        );

    }


    // =================================================
    // EFEITO DE MORTE
    // =================================================

    death(x, y) {

        return this.burst(

            PARTICLE_TYPES.DEATH,

            x,

            y,

            {

                count: 35,

                speed: 55,

                life: 0.85,

                size: 3,

                gravity: -8

            }

        );

    }


    // =================================================
    // EFEITO DE RECOMPENSA
    // =================================================

    loot(x, y) {

        return this.burst(

            PARTICLE_TYPES.LOOT,

            x,

            y,

            {

                count: 18,

                speed: 35,

                life: 0.8,

                size: 2,

                gravity: -12,

                glow: true

            }

        );

    }


    // =================================================
    // ATUALIZAR PARTÍCULAS
    // =================================================

    update(dt) {

        if (
            !this.enabled ||
            !Number.isFinite(dt) ||
            dt <= 0
        ) {

            return;

        }

        dt = Math.min(

            dt,

            PARTICLE_CONFIG.MAX_DELTA_TIME

        );

        for (
            let i =
                this.particles.length - 1;
            i >= 0;
            i--
        ) {

            const particle =
                this.particles[i];

            particle.update(dt);

            if (particle.dead) {

                this.particles[i] =
                    this.particles[
                        this.particles.length - 1
                    ];

                this.particles.pop();

            }

        }

    }


    // =================================================
    // DESENHAR PARTÍCULAS DO MUNDO
    // =================================================

    draw(
        ctx,
        cameraX = 0,
        cameraY = 0
    ) {

        if (
            !this.enabled ||
            !ctx
        ) {

            return;

        }

        ctx.save();

        ctx.imageSmoothingEnabled =
            false;

        for (const particle of this.particles) {

            if (particle.screenSpace) {

                continue;

            }

            ctx.save();

            ctx.translate(

                -Math.round(cameraX),

                -Math.round(cameraY)

            );

            particle.draw(ctx);

            ctx.restore();

        }

        ctx.restore();

    }


    // =================================================
    // DESENHAR PARTÍCULAS DA INTERFACE
    // =================================================

    drawScreen(ctx) {

        if (!ctx) {

            return;

        }

        for (const particle of this.particles) {

            if (particle.screenSpace) {

                particle.draw(ctx);

            }

        }

    }


    // =================================================
    // LIMPAR SISTEMA
    // =================================================

    clear() {

        this.particles.length = 0;

    }


    // =================================================
    // ESTATÍSTICAS
    // =================================================

    getStatistics() {

        return {

            active:
                this.particles.length,

            maximum:
                this.maximum,

            emitted:
                this.emitted,

            dropped:
                this.dropped

        };

    }

}


// =====================================================
// INSTÂNCIA COMPARTILHADA
// =====================================================

export const particles =
    new ParticleSystem();


// =====================================================
// FIM DO PARTICLES.JS
// =====================================================
