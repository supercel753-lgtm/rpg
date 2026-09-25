
"use strict";


export class ProgressionSystem {

    constructor(rpg) {

        this.rpg = rpg;

        this.level = 1;

        this.experience = 0;

        this.maxLevel = 20;

        this.attributePoints = 0;

        this.skillPoints = 0;

    }


    // ==========================================
    // EXPERIÊNCIA NECESSÁRIA
    // ==========================================

    requiredExperience(level = this.level) {

        return Math.floor(

            100 * Math.pow(
                level,
                1.55
            )

        );

    }


    // ==========================================
    // RECEBER EXPERIÊNCIA
    // ==========================================

    gainExperience(amount) {

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return false;

        }

        if (
            this.level >= this.maxLevel
        ) {

            return false;

        }

        this.experience += amount;

        // --------------------------------------
        // SUBIR DE NÍVEL
        // --------------------------------------

        while (

            this.level < this.maxLevel &&

            this.experience >=
                this.requiredExperience()

        ) {

            this.experience -=
                this.requiredExperience();

            this.levelUp();

        }

        return true;

    }


    // ==========================================
    // SUBIR DE NÍVEL
    // ==========================================

    levelUp() {

        this.level++;

        this.attributePoints += 2;

        this.skillPoints++;

        this.rpg.characterClass.setLevel(
            this.level
        );

        this.rpg.level =
            this.level;

        this.rpg.refreshStats();

        this.rpg.player.health =
            this.rpg.player.maxHealth;

        this.rpg.player.stamina =
            this.rpg.player.maxStamina;

        this.rpg.mana =
            this.rpg.maxMana;

    }


    // ==========================================
    // AUMENTAR ATRIBUTO
    // ==========================================

    increaseAttribute(attribute) {

        if (
            this.attributePoints <= 0
        ) {

            return false;

        }

        if (
            !(attribute in
                this.rpg.attributes.base)
        ) {

            return false;

        }

        this.rpg.attributes.base[
            attribute
        ]++;

        this.attributePoints--;

        this.rpg.refreshStats();

        return true;

    }


    // ==========================================
    // EXPORTAR
    // ==========================================

    exportState() {

        return {

            level: this.level,

            experience: this.experience,

            attributePoints:
                this.attributePoints,

            skillPoints:
                this.skillPoints

        };

    }


    // ==========================================
    // IMPORTAR
    // ==========================================

    importState(state) {

        if (!state) {

            return false;

        }

        this.level =
            Math.max(
                1,
                state.level || 1
            );

        this.experience =
            Math.max(
                0,
                state.experience || 0
            );

        this.attributePoints =
            Math.max(
                0,
                state.attributePoints || 0
            );

        this.skillPoints =
            Math.max(
                0,
                state.skillPoints || 0
            );

        this.rpg.level =
            this.level;

        this.rpg.characterClass.setLevel(
            this.level
        );

        return true;

    }

}
