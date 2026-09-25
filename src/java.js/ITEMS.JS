
"use strict";

/*
===============================================
ZELDA RPG ENGINE
ITEMS.JS
===============================================
*/

export const ITEM_RARITY = {

    COMMON: "common",

    UNCOMMON: "uncommon",

    RARE: "rare",

    EPIC: "epic",

    LEGENDARY: "legendary"

};


// ==============================================
// CATÁLOGO DE ITENS
// ==============================================

export const ITEMS = {

    // ==========================================
    // MOEDAS
    // ==========================================

    coins: {

        id: "coins",

        name: "Moedas",

        category: "currency",

        rarity: "common",

        stackable: true,

        value: 1

    },


    // ==========================================
    // ALIMENTOS
    // ==========================================

    apple: {

        id: "apple",

        name: "Maca",

        category: "consumable",

        rarity: "common",

        stackable: true,

        heal: 10,

        value: 5

    },

    meat: {

        id: "meat",

        name: "Carne Assada",

        category: "consumable",

        rarity: "common",

        stackable: true,

        heal: 20,

        value: 12

    },

    bread: {

        id: "bread",

        name: "Pão",

        category: "consumable",

        rarity: "common",

        stackable: true,

        heal: 12,

        value: 6

    },

    mushroomSoup: {

        id: "mushroomSoup",

        name: "Sopa de Cogumelos",

        category: "consumable",

        rarity: "uncommon",

        stackable: true,

        heal: 35,

        stamina: 15,

        value: 25

    },


    // ==========================================
    // POÇÕES
    // ==========================================

    health_potion: {

        id: "health_potion",

        name: "Pocao de Vida",

        category: "consumable",

        rarity: "common",

        stackable: true,

        heal: 30,

        value: 25

    },

    stamina_potion: {

        id: "stamina_potion",

        name: "Pocao de Stamina",

        category: "consumable",

        rarity: "common",

        stackable: true,

        stamina: 30,

        value: 20

    },

    manaPotion: {

        id: "manaPotion",

        name: "Poção de Mana",

        category: "consumable",

        rarity: "uncommon",

        stackable: true,

        mana: 35,

        value: 30

    },

    greaterHealingPotion: {

        id: "greaterHealingPotion",

        name: "Poção Superior de Vida",

        category: "consumable",

        rarity: "rare",

        stackable: true,

        heal: 80,

        value: 75

    },


    // ==========================================
    // MATERIAIS
    // ==========================================

    wood: {

        id: "wood",

        name: "Madeira",

        category: "material",

        stackable: true,

        value: 3

    },

    stone: {

        id: "stone",

        name: "Pedra",

        category: "material",

        stackable: true,

        value: 2

    },

    ironOre: {

        id: "ironOre",

        name: "Minério de Ferro",

        category: "material",

        stackable: true,

        value: 8

    },

    rare_ore: {

        id: "rare_ore",

        name: "Minerio Raro",

        category: "material",

        stackable: true,

        value: 35

    },

    ancient_fragment: {

        id: "ancient_fragment",

        name: "Fragmento Antigo",

        category: "material",

        rarity: "rare",

        stackable: true,

        value: 80

    },

    herb: {

        id: "herb",

        name: "Erva Medicinal",

        category: "material",

        stackable: true,

        value: 5

    },

    crystal: {

        id: "crystal",

        name: "Cristal Arcano",

        category: "material",

        rarity: "rare",

        stackable: true,

        value: 45

    },


    // ==========================================
    // MUNIÇÃO
    // ==========================================

    arrow: {

        id: "arrow",

        name: "Flecha",

        category: "ammo",

        stackable: true,

        value: 3

    },


    // ==========================================
    // ARMAS
    // ==========================================

    ironSword: {

        id: "ironSword",

        name: "Espada de Ferro",

        category: "equipment",

        slot: "mainHand",

        proficiency: "sword",

        rarity: "common",

        damage: 12,

        bonuses: {

            strength: 1

        },

        maxDurability: 100,

        value: 80

    },

    steelSword: {

        id: "steelSword",

        name: "Espada de Aço",

        category: "equipment",

        slot: "mainHand",

        proficiency: "sword",

        rarity: "uncommon",

        damage: 18,

        bonuses: {

            strength: 2

        },

        maxDurability: 150,

        value: 160

    },

    ancientSword: {

        id: "ancientSword",

        name: "Lâmina do Guardião Antigo",

        category: "equipment",

        slot: "mainHand",

        proficiency: "sword",

        rarity: "legendary",

        damage: 42,

        bonuses: {

            strength: 3,

            dexterity: 2

        },

        maxDurability: 240,

        value: 1500

    },

    ironGreatsword: {

        id: "ironGreatsword",

        name: "Espada Pesada de Ferro",

        category: "equipment",

        slot: "mainHand",

        proficiency: "greatsword",

        rarity: "common",

        damage: 23,

        bonuses: {

            strength: 2

        },

        maxDurability: 100,

        value: 145

    },

    huntersBow: {

        id: "huntersBow",

        name: "Arco do Caçador",

        category: "equipment",

        slot: "mainHand",

        proficiency: "bow",

        rarity: "uncommon",

        damage: 16,

        bonuses: {

            dexterity: 2

        },

        maxDurability: 110,

        value: 150

    },

    arcaneStaff: {

        id: "arcaneStaff",

        name: "Cajado Arcano",

        category: "equipment",

        slot: "mainHand",

        proficiency: "staff",

        rarity: "rare",

        damage: 8,

        bonuses: {

            intelligence: 3

        },

        maxDurability: 130,

        value: 330

    },

    ironDagger: {

        id: "ironDagger",

        name: "Adaga de Ferro",

        category: "equipment",

        slot: "mainHand",

        proficiency: "dagger",

        rarity: "common",

        damage: 9,

        bonuses: {

            dexterity: 1

        },

        maxDurability: 95,

        value: 60

    },

    ironHammer: {

        id: "ironHammer",

        name: "Martelo de Ferro",

        category: "equipment",

        slot: "mainHand",

        proficiency: "hammer",

        rarity: "common",

        damage: 27,

        bonuses: {

            strength: 2

        },

        maxDurability: 130,

        value: 180

    },


    // ==========================================
    // ESCUDOS
    // ==========================================

    woodenShield: {

        id: "woodenShield",

        name: "Escudo de Madeira",

        category: "equipment",

        slot: "offHand",

        proficiency: "shield",

        rarity: "common",

        defense: 3,

        maxDurability: 80,

        value: 45

    },

    ironShield: {

        id: "ironShield",

        name: "Escudo de Ferro",

        category: "equipment",

        slot: "offHand",

        proficiency: "shield",

        rarity: "uncommon",

        defense: 7,

        maxDurability: 150,

        value: 140

    },


    // ==========================================
    // ARMADURAS
    // ==========================================

    leatherArmor: {

        id: "leatherArmor",

        name: "Armadura de Couro",

        category: "equipment",

        slot: "chest",

        proficiency: "lightArmor",

        rarity: "common",

        defense: 4,

        bonuses: {

            dexterity: 1

        },

        value: 90

    },

    ironArmor: {

        id: "ironArmor",

        name: "Armadura de Ferro",

        category: "equipment",

        slot: "chest",

        proficiency: "heavyArmor",

        rarity: "uncommon",

        defense: 11,

        bonuses: {

            constitution: 2

        },

        value: 280

    },

    mageRobe: {

        id: "mageRobe",

        name: "Manto Arcano",

        category: "equipment",

        slot: "chest",

        proficiency: "lightArmor",

        rarity: "rare",

        defense: 3,

        bonuses: {

            intelligence: 3,

            wisdom: 1

        },

        value: 340

    },

    leatherHelmet: {

        id: "leatherHelmet",

        name: "Capacete de Couro",

        category: "equipment",

        slot: "head",

        proficiency: "lightArmor",

        defense: 2,

        value: 40

    },

    ironHelmet: {

        id: "ironHelmet",

        name: "Elmo de Ferro",

        category: "equipment",

        slot: "head",

        proficiency: "heavyArmor",

        defense: 5,

        value: 100

    },

    leatherGloves: {

        id: "leatherGloves",

        name: "Luvas de Couro",

        category: "equipment",

        slot: "gloves",

        proficiency: "lightArmor",

        defense: 1,

        bonuses: {

            dexterity: 1

        },

        value: 35

    },

    leatherBoots: {

        id: "leatherBoots",

        name: "Botas de Couro",

        category: "equipment",

        slot: "boots",

        proficiency: "lightArmor",

        defense: 1,

        value: 40

    },


    // ==========================================
    // ACESSÓRIOS
    // ==========================================

    ringOfStrength: {

        id: "ringOfStrength",

        name: "Anel da Força",

        category: "equipment",

        slot: "ring",

        rarity: "rare",

        bonuses: {

            strength: 2

        },

        value: 300

    },

    ringOfWisdom: {

        id: "ringOfWisdom",

        name: "Anel da Sabedoria",

        category: "equipment",

        slot: "ring",

        rarity: "rare",

        bonuses: {

            wisdom: 2

        },

        value: 300

    },

    ancientAmulet: {

        id: "ancientAmulet",

        name: "Amuleto dos Antigos",

        category: "equipment",

        slot: "amulet",

        rarity: "legendary",

        bonuses: {

            intelligence: 2,

            constitution: 2

        },

        defense: 2,

        value: 1100

    }

};


// ==============================================
// INSTÂNCIAS DE ITENS
// ==============================================

let nextItemUID = 1;


// ==============================================
// CRIAR ITEM
// ==============================================

export function createItem(
    id,
    quantity = 1
) {

    const definition =
        ITEMS[id];

    if (!definition) {

        return null;

    }

    return {

        ...definition,

        bonuses: {

            ...(definition.bonuses || {})

        },

        uid: nextItemUID++,

        quantity:

            definition.stackable
                ? quantity
                : 1,

        durability:
            definition.maxDurability ?? null

    };

}


// ==============================================
// OBTER DEFINIÇÃO
// ==============================================

export function getItemDefinition(id) {

    return ITEMS[id] || null;

}


// ==============================================
// VERIFICAR EQUIPAMENTO
// ==============================================

export function isEquipment(item) {

    return Boolean(

        item &&

        item.category === "equipment"

    );

}


// ==============================================
// CONSULTAR RARIDADE
// ==============================================

export function getRarityColor(rarity) {

    const colors = {

        common: "#dddddd",

        uncommon: "#65c878",

        rare: "#6699ee",

        epic: "#bb77dd",

        legendary: "#e4b954"

    };

    return colors[rarity] || colors.common;

}
