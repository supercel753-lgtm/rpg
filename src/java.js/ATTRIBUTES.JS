
"use strict";

/*
===============================================
ZELDA RPG ENGINE
ATTRIBUTES.JS
===============================================
*/

export const ATTRIBUTES = Object.freeze({

    STR: "strength",

    DEX: "dexterity",

    CON: "constitution",

    INT: "intelligence",

    WIS: "wisdom",

    CHA: "charisma"

});

export const ATTRIBUTE_NAMES = {

    strength: "Força",

    dexterity: "Destreza",

    constitution: "Constituição",

    intelligence: "Inteligência",

    wisdom: "Sabedoria",

    charisma: "Carisma"

};

export const BASE_ATTRIBUTES = Object.freeze({

    strength: 8,

    dexterity: 8,

    constitution: 8,

    intelligence: 8,

    wisdom: 8,

    charisma: 8

});


// ==============================================
// MODIFICADOR DE ATRIBUTO
// ==============================================

export function modifier(score) {

    return Math.floor(
        (score - 10) / 2
    );

}


// ==============================================
// CLASSE DE ATRIBUTOS
// ==============================================

export class AttributeSystem {

    constructor(initial = {}) {

        this.base = {

            ...BASE_ATTRIBUTES,

            ...initial

        };

        this.bonuses = {};

        this.availablePoints = 27;

    }


    // ==========================================
    // CONSULTAR VALOR
    // ==========================================

    get(attribute) {

        return (

            this.base[attribute] || 0

        ) + (

            this.bonuses[attribute] || 0

        );

    }


    // ==========================================
    // CONSULTAR MODIFICADOR
    // ==========================================

    getModifier(attribute) {

        return modifier(
            this.get(attribute)
        );

    }


    // ==========================================
    // DISTRIBUIR PONTOS
    // ==========================================

    increase(attribute, amount = 1) {

        if (!(attribute in this.base)) {

            return false;

        }

        if (
            !Number.isInteger(amount) ||
            amount <= 0 ||
            this.availablePoints < amount
        ) {

            return false;

        }

        if (
            this.base[attribute] + amount > 15
        ) {

            return false;

        }

        this.base[attribute] += amount;

        this.availablePoints -= amount;

        return true;

    }


    // ==========================================
    // BÔNUS DE EQUIPAMENTO
    // ==========================================

    setEquipmentBonuses(bonuses = {}) {

        this.bonuses = {

            ...bonuses

        };

    }


    // ==========================================
    // CALCULAR ATRIBUTOS DERIVADOS
    // ==========================================

    calculateStats(level = 1) {

        const con =
            this.getModifier(
                ATTRIBUTES.CON
            );

        const dex =
            this.getModifier(
                ATTRIBUTES.DEX
            );

        const intelligence =
            this.getModifier(
                ATTRIBUTES.INT
            );

        const wisdom =
            this.getModifier(
                ATTRIBUTES.WIS
            );

        return {

            maxHealth: Math.max(

                20,

                90 + con * 12 + level * 5

            ),

            maxStamina: Math.max(

                30,

                90 + con * 4 + dex * 5

            ),

            maxMana: Math.max(

                0,

                30 +
                intelligence * 12 +
                wisdom * 5

            ),

            physicalDamageBonus:
                this.getModifier(
                    ATTRIBUTES.STR
                ),

            rangedDamageBonus: dex,

            spellDamageBonus: intelligence,

            defenseBonus: Math.max(
                0,
                dex
            ),

            criticalChance: Math.min(

                0.35,

                Math.max(
                    0.02,
                    0.05 + dex * 0.01
                )

            )

        };

    }


    // ==========================================
    // EXPORTAR
    // ==========================================

    exportState() {

        return {

            base: {

                ...this.base

            },

            availablePoints:
                this.availablePoints

        };

    }


    // ==========================================
    // IMPORTAR
    // ==========================================

    importState(state) {

        if (
            !state ||
            !state.base
        ) {

            return false;

        }

        for (
            const attribute of
            Object.keys(BASE_ATTRIBUTES)
        ) {

            const value =
                state.base[attribute];

            if (
                Number.isFinite(value) &&
                value >= 1 &&
                value <= 30
            ) {

                this.base[attribute] =
                    value;

            }

        }

        if (
            Number.isInteger(
                state.availablePoints
            )
        ) {

            this.availablePoints =
                Math.max(
                    0,
                    state.availablePoints
                );

        }

        return true;

    }

}
