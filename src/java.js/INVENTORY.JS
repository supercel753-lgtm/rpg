
"use strict";

import {

    ITEMS,

    createItem,

    getItemDefinition

} from "./items.js";


export class Inventory {

    constructor(maxSlots = 50) {

        this.maxSlots = maxSlots;

        this.items = [];

        this.open = false;

        this.selectedIndex = 0;

        this.addItem({

            ...ITEMS.coins,

            quantity: 30

        });

        this.addItem({

            ...ITEMS.apple,

            quantity: 3

        });

        this.addItem({

            ...ITEMS.health_potion,

            quantity: 2

        });

    }


    // ==========================================
    // ADICIONAR ITEM
    // ==========================================

    addItem(item) {

        if (!item) {

            return false;

        }

        const quantity =
            item.quantity ?? 1;

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            return false;

        }

        const definition =
            getItemDefinition(item.id);

        const stackable =
            item.stackable ??
            definition?.stackable ??
            item.category !== "equipment";

        // --------------------------------------
        // EMPILHAR
        // --------------------------------------

        if (stackable) {

            const existing =
                this.items.find(

                    entry =>
                        entry.id === item.id &&
                        entry.stackable

                );

            if (existing) {

                existing.quantity += quantity;

                return true;

            }

        }

        // --------------------------------------
        // VERIFICAR CAPACIDADE
        // --------------------------------------

        const requiredSlots =
            stackable ? 1 : quantity;

        if (
            this.items.length + requiredSlots >
            this.maxSlots
        ) {

            return false;

        }

        // --------------------------------------
        // CRIAR INSTÂNCIAS
        // --------------------------------------

        const count =
            stackable ? 1 : quantity;

        for (let i = 0; i < count; i++) {

            const instance =
                definition
                    ? createItem(
                        item.id,
                        stackable ? quantity : 1
                    )
                    : {

                        ...item,

                        quantity:
                            stackable ? quantity : 1

                    };

            if (!instance) {

                return false;

            }

            // Preservar durabilidade e UID de
            // equipamentos já existentes.

            if (!stackable) {

                if (
                    item.uid != null &&
                    quantity === 1
                ) {

                    instance.uid = item.uid;

                }

                if (
                    item.durability != null
                ) {

                    instance.durability =
                        item.durability;

                }

            }

            this.items.push(instance);

        }

        return true;

    }


    // ==========================================
    // OBTER ITEM
    // ==========================================

    getItem(id) {

        return this.items.find(

            item => item.id === id

        ) || null;

    }


    // ==========================================
    // OBTER INSTÂNCIA INDIVIDUAL
    // ==========================================

    getInstance(uid) {

        return this.items.find(

            item => item.uid === uid

        ) || null;

    }


    // ==========================================
    // OBTER QUANTIDADE
    // ==========================================

    getQuantity(id) {

        return this.items

            .filter(item => item.id === id)

            .reduce(

                (total, item) =>
                    total + item.quantity,

                0

            );

    }


    // ==========================================
    // VERIFICAR ITEM
    // ==========================================

    hasItem(id, quantity = 1) {

        return this.getQuantity(id) >= quantity;

    }


    // ==========================================
    // REMOVER QUANTIDADE
    // ==========================================

    removeItem(id, quantity = 1) {

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0 ||
            !this.hasItem(id, quantity)
        ) {

            return false;

        }

        let remaining = quantity;

        for (
            let i = this.items.length - 1;
            i >= 0 && remaining > 0;
            i--
        ) {

            const item =
                this.items[i];

            if (item.id !== id) {

                continue;

            }

            const removed = Math.min(

                item.quantity,

                remaining

            );

            item.quantity -= removed;

            remaining -= removed;

            if (item.quantity <= 0) {

                this.items.splice(i, 1);

            }

        }

        return true;

    }


    // ==========================================
    // RETIRAR EQUIPAMENTO INDIVIDUAL
    // ==========================================

    extractInstance(uid) {

        const index =
            this.items.findIndex(

                item => item.uid === uid

            );

        if (index === -1) {

            return null;

        }

        const item =
            this.items[index];

        if (
            item.category !== "equipment"
        ) {

            return null;

        }

        this.items.splice(index, 1);

        return item;

    }


    // ==========================================
    // USAR CONSUMÍVEL
    // ==========================================

    useItem(id, player, rpg = null) {

        const item =
            this.getItem(id);

        if (
            !item ||
            item.category !== "consumable"
        ) {

            return false;

        }

        let applied = false;

        if (
            item.heal &&
            player.health < player.maxHealth &&
            player.health > 0
        ) {

            player.heal(item.heal);

            applied = true;

        }

        if (
            item.stamina &&
            player.stamina < player.maxStamina
        ) {

            player.stamina = Math.min(

                player.maxStamina,

                player.stamina + item.stamina

            );

            applied = true;

        }

        if (
            item.mana &&
            rpg &&
            rpg.mana < rpg.maxMana
        ) {

            rpg.restoreMana(item.mana);

            applied = true;

        }

        if (!applied) {

            return false;

        }

        return this.removeItem(id, 1);

    }


    // ==========================================
    // MOEDAS
    // ==========================================

    getCoins() {

        return this.getQuantity("coins");

    }


    addCoins(amount) {

        return this.addItem({

            ...ITEMS.coins,

            quantity: amount

        });

    }


    spendCoins(amount) {

        return this.removeItem(
            "coins",
            amount
        );

    }


    // ==========================================
    // CATEGORIAS
    // ==========================================

    getByCategory(category) {

        return this.items.filter(

            item =>
                item.category === category

        );

    }


    // ==========================================
    // INVENTÁRIO ABERTO
    // ==========================================

    toggle() {

        this.open = !this.open;

        return this.open;

    }


    // ==========================================
    // SALVAR
    // ==========================================

    exportState() {

        return {

            version: 2,

            maxSlots: this.maxSlots,

            items: this.items.map(

                item => ({

                    ...item,

                    bonuses: {

                        ...(item.bonuses || {})

                    }

                })

            )

        };

    }


    // ==========================================
    // CARREGAR
    // ==========================================

    importState(state) {

        if (
            !state ||
            !Array.isArray(state.items)
        ) {

            return false;

        }

        this.maxSlots =
            Math.max(
                1,
                state.maxSlots || 50
            );

        this.items = [];

        for (const item of state.items) {

            if (
                item &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
            ) {

                this.addItem(item);

            }

        }

        return true;

    }

}
