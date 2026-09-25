
"use strict";

import {

    isEquipment

} from "./items.js";


export const EQUIPMENT_SLOTS = Object.freeze({

    MAIN_HAND: "mainHand",

    OFF_HAND: "offHand",

    HEAD: "head",

    CHEST: "chest",

    GLOVES: "gloves",

    BOOTS: "boots",

    AMULET: "amulet",

    RING_1: "ring1",

    RING_2: "ring2"

});


export class EquipmentSystem {

    constructor(
        inventory,
        classSystem,
        attributes
    ) {

        this.inventory = inventory;

        this.classSystem = classSystem;

        this.attributes = attributes;

        this.slots = {

            mainHand: null,

            offHand: null,

            head: null,

            chest: null,

            gloves: null,

            boots: null,

            amulet: null,

            ring1: null,

            ring2: null

        };

    }


    // ==========================================
    // DEFINIR ESPAÇO
    // ==========================================

    resolveSlot(item) {

        if (
            item.slot === "ring"
        ) {

            return this.slots.ring1
                ? "ring2"
                : "ring1";

        }

        return item.slot;

    }


    // ==========================================
    // VERIFICAR PROFICIÊNCIA
    // ==========================================

    canEquip(item) {

        if (!isEquipment(item)) {

            return false;

        }

        if (
            item.proficiency &&
            !this.classSystem.hasProficiency(
                item.proficiency
            )
        ) {

            return false;

        }

        if (
            item.durability != null &&
            item.durability <= 0
        ) {

            return false;

        }

        return true;

    }


    // ==========================================
    // EQUIPAR ITEM
    // ==========================================

    equip(uid, targetSlot = null) {

        const item =
            this.inventory.getInstance(uid);

        if (
            !item ||
            !this.canEquip(item)
        ) {

            return false;

        }

        const slot =
            targetSlot ||
            this.resolveSlot(item);

        if (!(slot in this.slots)) {

            return false;

        }

        if (
            item.slot === "ring"
        ) {

            if (
                slot !== "ring1" &&
                slot !== "ring2"
            ) {

                return false;

            }

        } else if (
            item.slot !== slot
        ) {

            return false;

        }

        const previous =
            this.slots[slot];

        // --------------------------------------
        // VERIFICAR ESPAÇO PARA A TROCA
        // --------------------------------------

        if (previous) {

            if (
                !this.inventory.addItem(previous)
            ) {

                return false;

            }

        }

        const extracted =
            this.inventory.extractInstance(uid);

        if (!extracted) {

            if (previous) {

                this.inventory.extractInstance(
                    previous.uid
                );

            }

            return false;

        }

        this.slots[slot] = extracted;

        this.refreshBonuses();

        return true;

    }


    // ==========================================
    // DESEQUIPAR
    // ==========================================

    unequip(slot) {

        if (!(slot in this.slots)) {

            return false;

        }

        const item =
            this.slots[slot];

        if (!item) {

            return false;

        }

        if (
            !this.inventory.addItem(item)
        ) {

            return false;

        }

        this.slots[slot] = null;

        this.refreshBonuses();

        return true;

    }


    // ==========================================
    // OBTER EQUIPAMENTO
    // ==========================================

    get(slot) {

        return this.slots[slot] || null;

    }


    // ==========================================
    // CALCULAR BÔNUS
    // ==========================================

    getBonuses() {

        const bonuses = {};

        for (
            const item of
            Object.values(this.slots)
        ) {

            if (!item) {

                continue;

            }

            for (
                const [attribute, bonus] of
                Object.entries(
                    item.bonuses || {}
                )
            ) {

                bonuses[attribute] =

                    (bonuses[attribute] || 0) +

                    bonus;

            }

        }

        return bonuses;

    }


    // ==========================================
    // DEFESA TOTAL
    // ==========================================

    getDefense() {

        return Object.values(
            this.slots
        ).reduce(

            (total, item) =>

                total +
                (item?.defense || 0),

            0

        );

    }


    // ==========================================
    // ARMA EQUIPADA
    // ==========================================

    getWeapon() {

        return this.slots.mainHand;

    }


    // ==========================================
    // DANO DA ARMA
    // ==========================================

    getWeaponDamage() {

        const weapon =
            this.getWeapon();

        return weapon
            ? weapon.damage || 0
            : 1;

    }


    // ==========================================
    // ATUALIZAR ATRIBUTOS
    // ==========================================

    refreshBonuses() {

        this.attributes.setEquipmentBonuses(

            this.getBonuses()

        );

    }


    // ==========================================
    // SALVAR
    // ==========================================

    exportState() {

        return {

            slots: Object.fromEntries(

                Object.entries(this.slots).map(

                    ([slot, item]) => [

                        slot,

                        item
                            ? {
                                ...item
                            }
                            : null

                    ]

                )

            )

        };

    }


    // ==========================================
    // CARREGAR
    // ==========================================

    importState(state) {

        if (
            !state ||
            !state.slots
        ) {

            return false;

        }

        for (
            const slot of
            Object.keys(this.slots)
        ) {

            const item =
                state.slots[slot];

            this.slots[slot] =
                item
                    ? {
                        ...item
                    }
                    : null;

        }

        this.refreshBonuses();

        return true;

    }

}
