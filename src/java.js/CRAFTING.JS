
"use strict";

import {

    ITEMS

} from "./items.js";


export const RECIPES = {

    healthPotion: {

        name: "Poção de Vida",

        result: "health_potion",

        quantity: 1,

        ingredients: {

            herb: 3,

            apple: 1

        }

    },

    staminaPotion: {

        name: "Poção de Stamina",

        result: "stamina_potion",

        quantity: 1,

        ingredients: {

            herb: 2,

            mushroomSoup: 1

        }

    },

    ironSword: {

        name: "Espada de Ferro",

        result: "ironSword",

        quantity: 1,

        ingredients: {

            ironOre: 5,

            wood: 2

        }

    },

    ironShield: {

        name: "Escudo de Ferro",

        result: "ironShield",

        quantity: 1,

        ingredients: {

            ironOre: 6,

            wood: 2

        }

    },

    ironArmor: {

        name: "Armadura de Ferro",

        result: "ironArmor",

        quantity: 1,

        ingredients: {

            ironOre: 12,

            leatherArmor: 1

        }

    },

    arcaneStaff: {

        name: "Cajado Arcano",

        result: "arcaneStaff",

        quantity: 1,

        ingredients: {

            wood: 4,

            crystal: 3,

            ancient_fragment: 1

        }

    }

};


export class CraftingSystem {

    constructor(inventory) {

        this.inventory = inventory;

    }


    // ==========================================
    // CONSULTAR RECEITAS
    // ==========================================

    getRecipes() {

        return Object.entries(
            RECIPES
        ).map(

            ([id, recipe]) => ({

                id,

                ...recipe

            })

        );

    }


    // ==========================================
    // VERIFICAR MATERIAIS
    // ==========================================

    canCraft(recipeId) {

        const recipe =
            RECIPES[recipeId];

        if (!recipe) {

            return false;

        }

        for (
            const [itemId, quantity] of
            Object.entries(
                recipe.ingredients
            )
        ) {

            if (
                !this.inventory.hasItem(
                    itemId,
                    quantity
                )
            ) {

                return false;

            }

        }

        return true;

    }


    // ==========================================
    // FABRICAR
    // ==========================================

    craft(recipeId) {

        const recipe =
            RECIPES[recipeId];

        if (
            !recipe ||
            !this.canCraft(recipeId)
        ) {

            return false;

        }

        const resultDefinition =
            ITEMS[recipe.result];

        if (!resultDefinition) {

            return false;

        }

        // --------------------------------------
        // RESERVAR ESPAÇO NO INVENTÁRIO
        // --------------------------------------

        const existing =
            this.inventory.getItem(
                recipe.result
            );

        const needsSlot =

            !resultDefinition.stackable ||

            !existing;

        const consumedSlots =
            Object.entries(
                recipe.ingredients
            ).filter(

                ([id, quantity]) => {

                    const item =
                        this.inventory.getItem(id);

                    return item &&
                        item.quantity === quantity;

                }

            ).length;

        const availableSlots =

            this.inventory.maxSlots -

            this.inventory.items.length +

            consumedSlots;

        if (
            needsSlot &&
            availableSlots <
                recipe.quantity
        ) {

            return false;

        }

        // --------------------------------------
        // CONSUMIR MATERIAIS
        // --------------------------------------

        for (
            const [itemId, quantity] of
            Object.entries(
                recipe.ingredients
            )
        ) {

            this.inventory.removeItem(

                itemId,

                quantity

            );

        }

        // --------------------------------------
        // ENTREGAR RESULTADO
        // --------------------------------------

        return this.inventory.addItem({

            ...resultDefinition,

            quantity:
                recipe.quantity

        });

    }

}
