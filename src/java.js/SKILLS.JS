
"use strict";


export const SKILL_DATA = {

    powerStrike: {

        name: "Golpe Poderoso",

        type: "damage",

        resource: "stamina",

        cost: 15,

        damage: 32,

        range: 38,

        cooldown: 5

    },

    battleCry: {

        name: "Grito de Batalha",

        type: "restoreStamina",

        resource: "mana",

        cost: 5,

        amount: 25,

        cooldown: 20

    },

    firebolt: {

        name: "Projétil de Fogo",

        type: "damage",

        resource: "mana",

        cost: 12,

        damage: 28,

        range: 125,

        cooldown: 2

    },

    arcaneShield: {

        name: "Escudo Arcano",

        type: "heal",

        resource: "mana",

        cost: 18,

        amount: 15,

        cooldown: 12

    },

    quickStrike: {

        name: "Golpe Rápido",

        type: "damage",

        resource: "stamina",

        cost: 8,

        damage: 19,

        range: 28,

        cooldown: 1.5

    },

    shadowStep: {

        name: "Passo das Sombras",

        type: "restoreStamina",

        resource: "mana",

        cost: 8,

        amount: 20,

        cooldown: 8

    },

    preciseShot: {

        name: "Disparo Preciso",

        type: "damage",

        resource: "stamina",

        cost: 12,

        damage: 27,

        range: 155,

        cooldown: 4

    },

    hunterFocus: {

        name: "Concentração do Caçador",

        type: "restoreStamina",

        resource: "mana",

        cost: 5,

        amount: 35,

        cooldown: 16

    },

    holyStrike: {

        name: "Golpe Sagrado",

        type: "damage",

        resource: "mana",

        cost: 15,

        damage: 35,

        range: 38,

        cooldown: 5

    },

    healingLight: {

        name: "Luz Curativa",

        type: "heal",

        resource: "mana",

        cost: 18,

        amount: 35,

        cooldown: 8

    },

    natureBolt: {

        name: "Projétil Natural",

        type: "damage",

        resource: "mana",

        cost: 10,

        damage: 23,

        range: 105,

        cooldown: 2.5

    },

    healingTouch: {

        name: "Toque Curativo",

        type: "heal",

        resource: "mana",

        cost: 15,

        amount: 30,

        cooldown: 7

    }

};


// ==============================================
// SISTEMA DE HABILIDADES
// ==============================================

export class SkillSystem {

    constructor(rpg) {

        this.rpg = rpg;

        this.cooldowns = new Map();

    }


    // ==========================================
    // CONSULTAR HABILIDADES DESBLOQUEADAS
    // ==========================================

    getAvailableSkills() {

        const result = [];

        for (
            const id of
            this.rpg.characterClass.unlockedSkills
        ) {

            if (SKILL_DATA[id]) {

                result.push({

                    id,

                    ...SKILL_DATA[id]

                });

            }

        }

        return result;

    }


    // ==========================================
    // ATUALIZAR RECARGAS
    // ==========================================

    update(dt) {

        for (
            const [id, remaining] of
            this.cooldowns
        ) {

            this.cooldowns.set(

                id,

                Math.max(
                    0,
                    remaining - dt
                )

            );

        }

    }


    // ==========================================
    // CONSULTAR RECARGA
    // ==========================================

    getCooldown(id) {

        return this.cooldowns.get(id) || 0;

    }


    // ==========================================
    // UTILIZAR HABILIDADE
    // ==========================================

    use(
        id,
        player,
        entityManager = null
    ) {

        const skill =
            SKILL_DATA[id];

        if (
            !skill ||
            !this.rpg.characterClass.hasSkill(id)
        ) {

            return false;

        }

        if (
            this.getCooldown(id) > 0 ||
            player.health <= 0
        ) {

            return false;

        }

        // --------------------------------------
        // VERIFICAR RECURSOS
        // --------------------------------------

        if (
            skill.resource === "mana" &&
            this.rpg.mana < skill.cost
        ) {

            return false;

        }

        if (
            skill.resource === "stamina" &&
            player.stamina < skill.cost
        ) {

            return false;

        }

        // --------------------------------------
        // IDENTIFICAR ALVO
        // --------------------------------------

        let target = null;

        if (
            skill.type === "damage"
        ) {

            if (!entityManager) {

                return false;

            }

            let nearestDistance =
                Infinity;

            for (
                const entity of
                entityManager.entities
            ) {

                if (
                    !entity.isAlive() ||
                    !["ENEMY", "BOSS"].includes(
                        entity.type
                    )
                ) {

                    continue;

                }

                const distance =
                    Math.hypot(

                        entity.centerX -
                            player.centerX,

                        entity.centerY -
                            player.centerY

                    );

                if (
                    distance <= skill.range &&
                    distance < nearestDistance
                ) {

                    nearestDistance =
                        distance;

                    target = entity;

                }

            }

            if (!target) {

                return false;

            }

        }

        // --------------------------------------
        // CONSUMIR RECURSOS
        // --------------------------------------

        if (
            skill.resource === "mana"
        ) {

            this.rpg.mana -= skill.cost;

        } else {

            player.consumeStamina(
                skill.cost
            );

        }

        // --------------------------------------
        // APLICAR EFEITOS
        // --------------------------------------

        if (
            skill.type === "damage"
        ) {

            const damage =
                this.calculateSkillDamage(
                    skill
                );

            const applied =
                target.takeDamage(

                    damage,

                    player

                );

            if (
                applied > 0 &&
                !target.isAlive()
            ) {

                entityManager.onEntityDefeated(

                    target,

                    player

                );

            }

        }

        if (
            skill.type === "heal"
        ) {

            player.heal(
                skill.amount
            );

        }

        if (
            skill.type === "restoreStamina"
        ) {

            player.recoverStamina(
                skill.amount
            );

        }

        this.cooldowns.set(

            id,

            skill.cooldown

        );

        return true;

    }


    // ==========================================
    // CALCULAR DANO MÁGICO
    // ==========================================

    calculateSkillDamage(skill) {

        const stats =
            this.rpg.attributes.calculateStats(

                this.rpg.level

            );

        return Math.max(

            1,

            Math.round(

                skill.damage +

                stats.spellDamageBonus

            )

        );

    }

}
