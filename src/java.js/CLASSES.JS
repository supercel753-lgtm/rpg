
"use strict";

/*
===============================================
ZELDA RPG ENGINE
CLASSES.JS
===============================================
*/

export const CLASS_DATA = {

    warrior: {

        id: "warrior",

        name: "Guerreiro",

        primaryAttribute: "strength",

        healthBonus: 25,

        manaBonus: 0,

        staminaBonus: 20,

        proficiencies: [

            "sword",
            "greatsword",
            "axe",
            "hammer",
            "shield",
            "heavyArmor",
            "mediumArmor",
            "lightArmor"

        ],

        startingSkills: [

            "powerStrike",
            "battleCry"

        ],

        subclasses: {

            knight: {

                name: "Cavaleiro",

                skills: [
                    "shieldBash",
                    "ironDefense"
                ]

            },

            berserker: {

                name: "Berserker",

                skills: [
                    "rage",
                    "whirlwind"
                ]

            },

            weaponMaster: {

                name: "Mestre de Armas",

                skills: [
                    "precisionStrike",
                    "counterAttack"
                ]

            }

        }

    },


    mage: {

        id: "mage",

        name: "Mago",

        primaryAttribute: "intelligence",

        healthBonus: 0,

        manaBonus: 70,

        staminaBonus: 0,

        proficiencies: [

            "staff",
            "dagger",
            "lightArmor"

        ],

        startingSkills: [

            "firebolt",
            "arcaneShield"
        ],

        subclasses: {

            elemental: {

                name: "Elementalista",

                skills: [
                    "iceNova",
                    "thunderStrike"
                ]

            },

            arcanist: {

                name: "Arcanista",

                skills: [
                    "arcaneBlast",
                    "blink"
                ]

            },

            necromancer: {

                name: "Necromante",

                skills: [
                    "lifeDrain",
                    "shadowNova"
                ]

            }

        }

    },


    rogue: {

        id: "rogue",

        name: "Ladino",

        primaryAttribute: "dexterity",

        healthBonus: 5,

        manaBonus: 10,

        staminaBonus: 25,

        proficiencies: [

            "dagger",
            "sword",
            "bow",
            "lightArmor"

        ],

        startingSkills: [

            "quickStrike",
            "shadowStep"
        ],

        subclasses: {

            assassin: {

                name: "Assassino",

                skills: [
                    "backstab",
                    "poisonBlade"
                ]

            },

            thief: {

                name: "Ladrão",

                skills: [
                    "evasion",
                    "rapidHands"
                ]

            },

            arcaneTrickster: {

                name: "Trapaceiro Arcano",

                skills: [
                    "illusion",
                    "arcaneDagger"
                ]

            }

        }

    },


    ranger: {

        id: "ranger",

        name: "Patrulheiro",

        primaryAttribute: "dexterity",

        healthBonus: 10,

        manaBonus: 20,

        staminaBonus: 20,

        proficiencies: [

            "bow",
            "spear",
            "dagger",
            "sword",
            "lightArmor",
            "mediumArmor"

        ],

        startingSkills: [

            "preciseShot",
            "hunterFocus"
        ],

        subclasses: {

            hunter: {

                name: "Caçador",

                skills: [
                    "multishot",
                    "markedTarget"
                ]

            },

            beastmaster: {

                name: "Domador de Feras",

                skills: [
                    "animalBond",
                    "beastCommand"
                ]

            },

            natureGuardian: {

                name: "Guardião da Natureza",

                skills: [
                    "natureHealing",
                    "rootTrap"
                ]

            }

        }

    },


    paladin: {

        id: "paladin",

        name: "Paladino",

        primaryAttribute: "strength",

        healthBonus: 20,

        manaBonus: 35,

        staminaBonus: 10,

        proficiencies: [

            "sword",
            "greatsword",
            "hammer",
            "shield",
            "heavyArmor",
            "mediumArmor",
            "lightArmor"

        ],

        startingSkills: [

            "holyStrike",
            "healingLight"
        ],

        subclasses: {

            guardian: {

                name: "Guardião",

                skills: [
                    "divineBarrier",
                    "guardianAura"
                ]

            },

            lightbound: {

                name: "Juramentado da Luz",

                skills: [
                    "radiantBlade",
                    "purification"
                ]

            },

            avenger: {

                name: "Vingador",

                skills: [
                    "judgment",
                    "righteousFury"
                ]

            }

        }

    },


    druid: {

        id: "druid",

        name: "Druida",

        primaryAttribute: "wisdom",

        healthBonus: 10,

        manaBonus: 55,

        staminaBonus: 15,

        proficiencies: [

            "staff",
            "spear",
            "dagger",
            "lightArmor",
            "mediumArmor"

        ],

        startingSkills: [

            "natureBolt",
            "healingTouch"
        ],

        subclasses: {

            shapeshifter: {

                name: "Metamorfo",

                skills: [
                    "wolfForm",
                    "bearForm"
                ]

            },

            wildGuardian: {

                name: "Guardião Selvagem",

                skills: [
                    "thornArmor",
                    "wildRegeneration"
                ]

            },

            elementCircle: {

                name: "Círculo dos Elementos",

                skills: [
                    "earthSpike",
                    "stormCall"
                ]

            }

        }

    }

};


// ==============================================
// SISTEMA DE CLASSES
// ==============================================

export class ClassSystem {

    constructor(classId = "warrior") {

        if (!CLASS_DATA[classId]) {

            throw new Error(
                "Classe inválida: " + classId
            );

        }

        this.classId = classId;

        this.subclassId = null;

        this.level = 1;

        this.unlockedSkills = new Set(

            CLASS_DATA[classId].startingSkills

        );

    }


    // ==========================================
    // CONSULTAR CLASSE
    // ==========================================

    getClass() {

        return CLASS_DATA[
            this.classId
        ];

    }


    // ==========================================
    // ESCOLHER SUBCLASSE
    // ==========================================

    chooseSubclass(subclassId) {

        if (this.level < 3) {

            return false;

        }

        if (this.subclassId) {

            return false;

        }

        const subclass =
            this.getClass()
                .subclasses[subclassId];

        if (!subclass) {

            return false;

        }

        this.subclassId = subclassId;

        for (
            const skill of subclass.skills
        ) {

            this.unlockedSkills.add(skill);

        }

        return true;

    }


    // ==========================================
    // VERIFICAR PROFICIÊNCIA
    // ==========================================

    hasProficiency(type) {

        return this.getClass()
            .proficiencies.includes(type);

    }


    // ==========================================
    // VERIFICAR HABILIDADE
    // ==========================================

    hasSkill(skillId) {

        return this.unlockedSkills.has(
            skillId
        );

    }


    // ==========================================
    // ATUALIZAR NÍVEL
    // ==========================================

    setLevel(level) {

        if (
            !Number.isInteger(level) ||
            level < 1
        ) {

            return false;

        }

        this.level = level;

        return true;

    }


    // ==========================================
    // CONSULTAR SUBCLASSE
    // ==========================================

    getSubclass() {

        if (!this.subclassId) {

            return null;

        }

        return this.getClass()
            .subclasses[this.subclassId];

    }


    // ==========================================
    // SALVAR
    // ==========================================

    exportState() {

        return {

            classId: this.classId,

            subclassId:
                this.subclassId,

            level: this.level,

            unlockedSkills: [

                ...this.unlockedSkills

            ]

        };

    }


    // ==========================================
    // CARREGAR
    // ==========================================

    importState(state) {

        if (
            !state ||
            !CLASS_DATA[state.classId]
        ) {

            return false;

        }

        this.classId = state.classId;

        this.level =
            Math.max(
                1,
                state.level || 1
            );

        this.subclassId = null;

        if (
            state.subclassId &&
            this.level >= 3 &&
            CLASS_DATA[
                this.classId
            ].subclasses[state.subclassId]
        ) {

            this.subclassId =
                state.subclassId;

        }

        this.unlockedSkills = new Set(

            CLASS_DATA[
                this.classId
            ].startingSkills

        );

        const validSkills = new Set(

            this.subclassId

                ? [

                    ...CLASS_DATA[
                        this.classId
                    ].startingSkills,

                    ...CLASS_DATA[
                        this.classId
                    ].subclasses[
                        this.subclassId
                    ].skills

                ]

                : CLASS_DATA[
                    this.classId
                ].startingSkills

        );

        for (
            const skill of
            state.unlockedSkills || []
        ) {

            if (validSkills.has(skill)) {

                this.unlockedSkills.add(
                    skill
                );

            }

        }

        return true;

    }

}
