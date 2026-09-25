
"use strict";

/*
========================================================
ZELDA PIXEL ADVENTURE
ENTITIES ENGINE — BETA 3

ARQUIVO: entities.js

SISTEMAS:

1. Entidades básicas
2. Atributos e movimento
3. NPCs
4. Diálogos
5. Comerciantes
6. Lojas
7. Compra e venda
8. Inimigos
9. Inteligência artificial
10. Perseguição
11. Patrulha
12. Combate
13. Chefes
14. Fases de combate
15. Ataques especiais
16. Animais
17. Recompensas
18. Gerenciamento de entidades
19. Renderização pixelada
20. Persistência

========================================================
*/


// =====================================================
// CONFIGURAÇÕES
// =====================================================

const ENTITY_CONFIG = Object.freeze({

    MAX_ENTITIES: 300,

    ACTIVE_DISTANCE: 550,

    VISIBLE_MARGIN: 60,

    NPC_INTERACTION_DISTANCE: 38,

    ENEMY_DETECTION_DISTANCE: 145,

    ENEMY_LOSE_DISTANCE: 235,

    BOSS_DETECTION_DISTANCE: 190,

    PLAYER_ATTACK_RANGE: 33,

    PLAYER_ATTACK_ARC: Math.PI * 0.75,

    MAX_DELTA_TIME: 0.05,

    SAVE_VERSION: 1

});


// =====================================================
// TIPOS DE ENTIDADES
// =====================================================

const ENTITY_TYPES = Object.freeze({

    NPC: "NPC",

    SHOPKEEPER: "SHOPKEEPER",

    ENEMY: "ENEMY",

    BOSS: "BOSS",

    ANIMAL: "ANIMAL"

});


// =====================================================
// ESTADOS DA INTELIGÊNCIA ARTIFICIAL
// =====================================================

const AI_STATES = Object.freeze({

    IDLE: "IDLE",

    PATROL: "PATROL",

    ALERT: "ALERT",

    CHASE: "CHASE",

    ATTACK: "ATTACK",

    RETREAT: "RETREAT",

    RETURN: "RETURN",

    FLEE: "FLEE",

    DEAD: "DEAD"

});


// =====================================================
// TIPOS DE INIMIGOS
// =====================================================

const ENEMY_TYPES = Object.freeze({

    FOREST_SCOUT: "FOREST_SCOUT",

    STONE_GUARD: "STONE_GUARD",

    DESERT_RAIDER: "DESERT_RAIDER",

    ICE_HUNTER: "ICE_HUNTER",

    RUIN_SENTINEL: "RUIN_SENTINEL"

});


// =====================================================
// TIPOS DE CHEFES
// =====================================================

const BOSS_TYPES = Object.freeze({

    FOREST_GUARDIAN: "FOREST_GUARDIAN",

    ANCIENT_COLOSSUS: "ANCIENT_COLOSSUS",

    DESERT_WARDEN: "DESERT_WARDEN",

    FROST_BEHEMOTH: "FROST_BEHEMOTH"

});


// =====================================================
// FUNÇÕES MATEMÁTICAS
// =====================================================

function entityClamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}


function entityDistance(
    x1,
    y1,
    x2,
    y2
) {

    return Math.hypot(
        x2 - x1,
        y2 - y1
    );

}


function entityRandom(min, max) {

    return min +
        Math.random() * (max - min);

}


function entityNormalize(dx, dy) {

    const length = Math.hypot(
        dx,
        dy
    );

    if (length < 0.00001) {

        return {
            x: 0,
            y: 0
        };

    }

    return {

        x: dx / length,

        y: dy / length

    };

}


function entityRectOverlap(a, b) {

    return (

        a.x < b.x + b.w &&

        a.x + a.w > b.x &&

        a.y < b.y + b.h &&

        a.y + a.h > b.y

    );

}


// =====================================================
// CONVERTER DIREÇÃO EM VETOR
// =====================================================

function entityDirectionVector(direction) {

    switch (direction) {

        case "up":

            return {
                x: 0,
                y: -1
            };

        case "down":

            return {
                x: 0,
                y: 1
            };

        case "left":

            return {
                x: -1,
                y: 0
            };

        case "right":

            return {
                x: 1,
                y: 0
            };

        default:

            return {
                x: 0,
                y: 1
            };

    }

}


// =====================================================
// GERENCIAMENTO DE IDENTIFICADORES
// =====================================================

let nextEntityId = 1;


function generateEntityId() {

    return nextEntityId++;

}


// =====================================================
// CLASSE BASE DE ENTIDADE
// =====================================================

class Entity {

    constructor(options = {}) {

        this.id =
            options.id || generateEntityId();

        this.type =
            options.type || ENTITY_TYPES.NPC;

        this.name =
            options.name || "Entidade";

        // -----------------------------------------
        // POSIÇÃO
        // -----------------------------------------

        this.x =
            options.x ?? 0;

        this.y =
            options.y ?? 0;

        this.width =
            options.width ?? 16;

        this.height =
            options.height ?? 22;

        // -----------------------------------------
        // MOVIMENTO
        // -----------------------------------------

        this.speed =
            options.speed ?? 35;

        this.direction = "down";

        this.moving = false;

        this.animationTime = 0;

        // -----------------------------------------
        // VIDA
        // -----------------------------------------

        this.maxHealth =
            options.health ?? 100;

        this.health =
            this.maxHealth;

        this.alive = true;

        // -----------------------------------------
        // COMBATE
        // -----------------------------------------

        this.damage =
            options.damage ?? 0;

        this.defense =
            options.defense ?? 0;

        this.attackRange =
            options.attackRange ?? 22;

        this.attackCooldown =
            options.attackCooldown ?? 1;

        this.attackTimer = 0;

        this.invulnerabilityTimer = 0;

        this.hitFlash = 0;

        // -----------------------------------------
        // INTELIGÊNCIA ARTIFICIAL
        // -----------------------------------------

        this.state =
            AI_STATES.IDLE;

        this.homeX = this.x;

        this.homeY = this.y;

        // -----------------------------------------
        // VISUAL
        // -----------------------------------------

        this.color =
            options.color || "#659a65";

        this.secondaryColor =
            options.secondaryColor || "#d8bd91";

        // -----------------------------------------
        // PERSISTÊNCIA
        // -----------------------------------------

        this.persistent =
            options.persistent ?? true;

    }


    // =================================================
    // CENTRO DA ENTIDADE
    // =================================================

    get centerX() {

        return this.x + this.width / 2;

    }


    get centerY() {

        return this.y + this.height / 2;

    }


    // =================================================
    // RETÂNGULO DE COLISÃO
    // =================================================

    getBounds() {

        return {

            x: this.x,

            y: this.y,

            w: this.width,

            h: this.height

        };

    }


    // =================================================
    // DISTÂNCIA ATÉ UM PONTO
    // =================================================

    distanceTo(x, y) {

        return entityDistance(

            this.centerX,

            this.centerY,

            x,

            y

        );

    }


    // =================================================
    // DISTÂNCIA ATÉ OUTRA ENTIDADE
    // =================================================

    distanceToEntity(entity) {

        return this.distanceTo(

            entity.centerX,

            entity.centerY

        );

    }


    // =================================================
    // VERIFICAR SE ESTÁ VIVA
    // =================================================

    isAlive() {

        return this.alive &&
            this.health > 0;

    }


    // =================================================
    // ATUALIZAR TEMPORIZADORES
    // =================================================

    updateTimers(dt) {

        this.attackTimer = Math.max(

            0,

            this.attackTimer - dt

        );

        this.invulnerabilityTimer = Math.max(

            0,

            this.invulnerabilityTimer - dt

        );

        this.hitFlash = Math.max(

            0,

            this.hitFlash - dt

        );

        if (this.moving) {

            this.animationTime += dt;

        }

    }


    // =================================================
    // ATUALIZAR DIREÇÃO
    // =================================================

    updateDirection(dx, dy) {

        if (
            Math.abs(dx) >
            Math.abs(dy)
        ) {

            this.direction =
                dx >= 0
                    ? "right"
                    : "left";

        } else if (dy !== 0) {

            this.direction =
                dy >= 0
                    ? "down"
                    : "up";

        }

    }


    // =================================================
    // MOVIMENTO COM COLISÃO
    // =================================================

    move(dx, dy, world, dt) {

        if (!this.isAlive()) {

            return false;

        }

        const direction =
            entityNormalize(dx, dy);

        const movementX =
            direction.x * this.speed * dt;

        const movementY =
            direction.y * this.speed * dt;

        if (
            movementX === 0 &&
            movementY === 0
        ) {

            this.moving = false;

            return false;

        }

        this.updateDirection(
            movementX,
            movementY
        );

        const oldX = this.x;

        const oldY = this.y;

        // -----------------------------------------
        // MOVIMENTO HORIZONTAL
        // -----------------------------------------

        const nextX =
            this.x + movementX;

        if (
            world.canMove({

                x: nextX,

                y: this.y,

                w: this.width,

                h: this.height

            })
        ) {

            this.x = nextX;

        }

        // -----------------------------------------
        // MOVIMENTO VERTICAL
        // -----------------------------------------

        const nextY =
            this.y + movementY;

        if (
            world.canMove({

                x: this.x,

                y: nextY,

                w: this.width,

                h: this.height

            })
        ) {

            this.y = nextY;

        }

        this.moving =

            this.x !== oldX ||

            this.y !== oldY;

        return this.moving;

    }


    // =================================================
    // MOVIMENTAR EM DIREÇÃO A UM PONTO
    // =================================================

    moveTowards(x, y, world, dt) {

        const dx =
            x - this.centerX;

        const dy =
            y - this.centerY;

        return this.move(

            dx,

            dy,

            world,

            dt

        );

    }


    // =================================================
    // SOFRER DANO
    // =================================================

    takeDamage(amount, source = null) {

        if (!this.isAlive()) {

            return 0;

        }

        if (
            this.invulnerabilityTimer > 0
        ) {

            return 0;

        }

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return 0;

        }

        const damage = Math.max(

            1,

            Math.round(
                amount - this.defense
            )

        );

        this.health = Math.max(

            0,

            this.health - damage

        );

        this.hitFlash = 0.15;

        this.invulnerabilityTimer = 0.25;

        if (this.health <= 0) {

            this.die(source);

        }

        return damage;

    }


    // =================================================
    // RECUPERAR VIDA
    // =================================================

    heal(amount) {

        if (!this.isAlive()) {

            return false;

        }

        this.health = Math.min(

            this.maxHealth,

            this.health +
                Math.max(0, amount)

        );

        return true;

    }


    // =================================================
    // MORTE
    // =================================================

    die(source = null) {

        this.alive = false;

        this.health = 0;

        this.state =
            AI_STATES.DEAD;

        this.moving = false;

    }


    // =================================================
    // ATUALIZAÇÃO BASE
    // =================================================

    update(dt, world, player, manager) {

        this.updateTimers(dt);

    }


    // =================================================
    // DESENHAR ENTIDADE
    // =================================================

    draw(ctx) {

        if (!this.isAlive()) {

            return;

        }

        drawEntitySprite(
            ctx,
            this
        );

    }


    // =================================================
    // EXPORTAR ESTADO
    // =================================================

    exportState() {

        return {

            id: this.id,

            type: this.type,

            x: this.x,

            y: this.y,

            health: this.health,

            alive: this.alive,

            direction: this.direction

        };

    }


    // =================================================
    // IMPORTAR ESTADO
    // =================================================

    importState(state) {

        if (!state) {

            return false;

        }

        if (
            Number.isFinite(state.x)
        ) {

            this.x = state.x;

        }

        if (
            Number.isFinite(state.y)
        ) {

            this.y = state.y;

        }

        if (
            Number.isFinite(state.health)
        ) {

            this.health =
                entityClamp(

                    state.health,

                    0,

                    this.maxHealth

                );

        }

        if (
            typeof state.alive ===
            "boolean"
        ) {

            this.alive = state.alive;

        }

        if (
            typeof state.direction ===
            "string"
        ) {

            this.direction =
                state.direction;

        }

        if (this.health <= 0) {

            this.alive = false;

        }

        return true;

    }

}


// =====================================================
// CONFIGURAÇÕES DOS NPCS
// =====================================================

const NPC_PERSONALITIES = Object.freeze({

    FRIENDLY: "FRIENDLY",

    NEUTRAL: "NEUTRAL",

    SHY: "SHY",

    GUARD: "GUARD",

    MERCHANT: "MERCHANT",

    WANDERER: "WANDERER"

});


// =====================================================
// CLASSE NPC
// =====================================================

class NPC extends Entity {

    constructor(options = {}) {

        super({

            ...options,

            type: ENTITY_TYPES.NPC,

            health:
                options.health ?? 100,

            damage: 0

        });

        this.personality =
            options.personality ||
            NPC_PERSONALITIES.FRIENDLY;

        this.dialogues =
            options.dialogues || [

                "Olá, viajante!"

            ];

        this.dialogueIndex = 0;

        this.wanderRadius =
            options.wanderRadius ?? 75;

        this.wanderTimer = 0;

        this.wanderTarget = null;

        this.speed =
            options.speed ?? 14;

        this.interactionRadius =
            ENTITY_CONFIG.NPC_INTERACTION_DISTANCE;

        this.canWander =
            options.canWander ?? true;

    }


    // =================================================
    // ESCOLHER DESTINO
    // =================================================

    chooseWanderTarget(world) {

        for (
            let attempt = 0;
            attempt < 12;
            attempt++
        ) {

            const angle =
                entityRandom(
                    0,
                    Math.PI * 2
                );

            const radius =
                entityRandom(

                    8,

                    this.wanderRadius

                );

            const targetX =

                this.homeX +

                Math.cos(angle) * radius;

            const targetY =

                this.homeY +

                Math.sin(angle) * radius;

            if (
                world.canMove({

                    x: targetX,

                    y: targetY,

                    w: this.width,

                    h: this.height

                })
            ) {

                this.wanderTarget = {

                    x: targetX,

                    y: targetY

                };

                return;

            }

        }

        this.wanderTarget = null;

    }


    // =================================================
    // ATUALIZAR NPC
    // =================================================

    update(dt, world, player, manager) {

        super.update(
            dt,
            world,
            player,
            manager
        );

        if (!this.isAlive()) {

            return;

        }

        if (!this.canWander) {

            this.moving = false;

            return;

        }

        // -----------------------------------------
        // NPC EM DIÁLOGO
        // -----------------------------------------

        if (
            manager.activeDialogue &&
            manager.activeDialogue.entity === this
        ) {

            this.moving = false;

            return;

        }

        this.wanderTimer -= dt;

        // -----------------------------------------
        // ESCOLHER NOVO DESTINO
        // -----------------------------------------

        if (
            this.wanderTimer <= 0
        ) {

            this.wanderTimer =
                entityRandom(2, 5);

            this.chooseWanderTarget(world);

        }

        if (!this.wanderTarget) {

            this.moving = false;

            return;

        }

        // -----------------------------------------
        // VERIFICAR CHEGADA
        // -----------------------------------------

        const targetDistance =
            this.distanceTo(

                this.wanderTarget.x,

                this.wanderTarget.y

            );

        if (targetDistance < 6) {

            this.wanderTarget = null;

            this.moving = false;

            return;

        }

        // -----------------------------------------
        // MOVIMENTAR
        // -----------------------------------------

        const moved = this.moveTowards(

            this.wanderTarget.x,

            this.wanderTarget.y,

            world,

            dt

        );

        if (!moved) {

            this.wanderTarget = null;

        }

    }


    // =================================================
    // OBTER FALA
    // =================================================

    getDialogue() {

        if (this.dialogues.length === 0) {

            return "...";

        }

        const text =
            this.dialogues[
                this.dialogueIndex
            ];

        this.dialogueIndex =

            (
                this.dialogueIndex + 1
            ) % this.dialogues.length;

        return text;

    }


    // =================================================
    // INTERAGIR COM NPC
    // =================================================

    interact(player, manager) {

        if (!this.isAlive()) {

            return false;

        }

        manager.openDialogue(

            this,

            this.getDialogue()

        );

        return true;

    }

}


// =====================================================
// CATÁLOGO DE PRODUTOS
// =====================================================

const SHOP_PRODUCTS = Object.freeze({

    APPLE: {

        id: "apple",

        name: "Maca",

        type: "food",

        price: 5,

        sellPrice: 2,

        heal: 10

    },

    HEALTH_POTION: {

        id: "health_potion",

        name: "Pocao de Vida",

        type: "potion",

        price: 25,

        sellPrice: 12,

        heal: 30

    },

    STAMINA_POTION: {

        id: "stamina_potion",

        name: "Pocao de Stamina",

        type: "potion",

        price: 20,

        sellPrice: 10,

        stamina: 30

    },

    MEAT: {

        id: "meat",

        name: "Carne Assada",

        type: "food",

        price: 12,

        sellPrice: 6,

        heal: 20

    },

    ARROW: {

        id: "arrow",

        name: "Flecha",

        type: "ammo",

        price: 3,

        sellPrice: 1

    },

    RARE_ORE: {

        id: "rare_ore",

        name: "Minerio Raro",

        type: "material",

        price: 80,

        sellPrice: 35

    }

});


// =====================================================
// CLASSE COMERCIANTE
// =====================================================

class Shopkeeper extends NPC {

    constructor(options = {}) {

        super({

            ...options,

            personality:
                NPC_PERSONALITIES.MERCHANT,

            canWander: false

        });

        this.type =
            ENTITY_TYPES.SHOPKEEPER;

        this.shopName =
            options.shopName ||
            "Loja do Viajante";

        this.stock =
            (options.stock || [

                {
                    product: "APPLE",
                    quantity: 12
                },

                {
                    product: "HEALTH_POTION",
                    quantity: 5
                },

                {
                    product: "ARROW",
                    quantity: 20
                }

            ]).map(item => ({

                product: item.product,

                quantity: item.quantity

            }));

        this.dialogues =
            options.dialogues || [

                "Bem-vindo à minha loja!",

                "Tenho mercadorias para sua jornada.",

                "Volte sempre, viajante!"

            ];

    }


    // =================================================
    // CATÁLOGO DA LOJA
    // =================================================

    getCatalog() {

        return this.stock.map(item => {

            const product =
                SHOP_PRODUCTS[item.product];

            if (!product) {

                return null;

            }

            return {

                ...product,

                quantity: item.quantity

            };

        }).filter(Boolean);

    }


    // =================================================
    // COMPRAR PRODUTO
    // =================================================

    buy(
        productId,
        inventory,
        quantity = 1
    ) {

        if (
            !inventory ||
            typeof inventory.addItem !== "function"
        ) {

            return {

                success: false,

                reason: "INVALID_INVENTORY"

            };

        }

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            return {

                success: false,

                reason: "INVALID_QUANTITY"

            };

        }

        const item = this.stock.find(

            entry => {

                const product =
                    SHOP_PRODUCTS[entry.product];

                return product &&
                    product.id === productId;

            }

        );

        if (!item) {

            return {

                success: false,

                reason: "PRODUCT_NOT_FOUND"

            };

        }

        const product =
            SHOP_PRODUCTS[item.product];

        if (
            item.quantity < quantity
        ) {

            return {

                success: false,

                reason: "OUT_OF_STOCK"

            };

        }

        const totalPrice =
            product.price * quantity;

        const coins =
            getInventoryCoins(inventory);

        if (
            coins < totalPrice
        ) {

            return {

                success: false,

                reason: "INSUFFICIENT_COINS"

            };

        }

        // -----------------------------------------
        // COBRAR
        // -----------------------------------------

        if (
            !removeInventoryCoins(
                inventory,
                totalPrice
            )
        ) {

            return {

                success: false,

                reason: "PAYMENT_FAILED"

            };

        }

        // -----------------------------------------
        // ENTREGAR PRODUTO
        // -----------------------------------------

        inventory.addItem({

            id: product.id,

            name: product.name,

            type: product.type,

            quantity,

            heal: product.heal || 0,

            stamina: product.stamina || 0

        });

        item.quantity -= quantity;

        return {

            success: true,

            product: product.name,

            quantity,

            totalPrice

        };

    }


    // =================================================
    // VENDER PRODUTO
    // =================================================

    sell(
        productId,
        inventory,
        quantity = 1
    ) {

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            return false;

        }

        const product =
            Object.values(
                SHOP_PRODUCTS
            ).find(

                item =>
                    item.id === productId

            );

        if (!product) {

            return false;

        }

        if (
            !removeInventoryItem(

                inventory,

                product.name,

                quantity

            )
        ) {

            return false;

        }

        inventory.addItem({

            id: "coins",

            name: "Moedas",

            type: "currency",

            quantity:
                product.sellPrice *
                quantity

        });

        return true;

    }


    // =================================================
    // INTERAGIR COM COMERCIANTE
    // =================================================

    interact(player, manager) {

        manager.openShop(this);

        return true;

    }

}


// =====================================================
// FUNÇÕES DE INVENTÁRIO
// =====================================================

function getInventoryItems(inventory) {

    if (!inventory) {

        return [];

    }

    if (
        Array.isArray(inventory.items)
    ) {

        return inventory.items;

    }

    return [];

}


function getInventoryCoins(inventory) {

    const coins =
        getInventoryItems(inventory).find(

            item =>
                item.id === "coins" ||
                item.name === "Moedas"

        );

    return coins
        ? Math.max(0, coins.quantity || 0)
        : 0;

}


function removeInventoryItem(
    inventory,
    name,
    quantity
) {

    if (
        !inventory ||
        !Number.isInteger(quantity) ||
        quantity <= 0
    ) {

        return false;

    }

    const items =
        getInventoryItems(inventory);

    const item = items.find(

        entry =>
            entry.name === name

    );

    if (
        !item ||
        item.quantity < quantity
    ) {

        return false;

    }

    item.quantity -= quantity;

    return true;

}


function removeInventoryCoins(
    inventory,
    quantity
) {

    return removeInventoryItem(

        inventory,

        "Moedas",

        quantity

    );

}


// =====================================================
// CONFIGURAÇÕES DOS INIMIGOS
// =====================================================

const ENEMY_DATA = Object.freeze({

    [ENEMY_TYPES.FOREST_SCOUT]: {

        name: "Batedor da Floresta",

        health: 45,

        damage: 7,

        defense: 1,

        speed: 27,

        attackRange: 24,

        attackCooldown: 1.5,

        detectionRange: 130,

        color: "#8c623f",

        secondaryColor: "#c48d54",

        coins: 5

    },

    [ENEMY_TYPES.STONE_GUARD]: {

        name: "Guarda de Pedra",

        health: 100,

        damage: 14,

        defense: 5,

        speed: 16,

        attackRange: 27,

        attackCooldown: 2.2,

        detectionRange: 115,

        color: "#777d82",

        secondaryColor: "#b5b8bc",

        coins: 12

    },

    [ENEMY_TYPES.DESERT_RAIDER]: {

        name: "Saqueador do Deserto",

        health: 65,

        damage: 11,

        defense: 2,

        speed: 38,

        attackRange: 25,

        attackCooldown: 1.3,

        detectionRange: 150,

        color: "#ad8150",

        secondaryColor: "#e3be77",

        coins: 10

    },

    [ENEMY_TYPES.ICE_HUNTER]: {

        name: "Caçador do Gelo",

        health: 75,

        damage: 12,

        defense: 3,

        speed: 31,

        attackRange: 27,

        attackCooldown: 1.7,

        detectionRange: 155,

        color: "#729da9",

        secondaryColor: "#d5eff0",

        coins: 13

    },

    [ENEMY_TYPES.RUIN_SENTINEL]: {

        name: "Sentinela Antiga",

        health: 120,

        damage: 17,

        defense: 6,

        speed: 20,

        attackRange: 31,

        attackCooldown: 2.5,

        detectionRange: 180,

        color: "#86765c",

        secondaryColor: "#65cbb8",

        coins: 22

    }

});


// =====================================================
// CLASSE INIMIGO
// =====================================================

class Enemy extends Entity {

    constructor(
        enemyType,
        x,
        y,
        options = {}
    ) {

        const data =
            ENEMY_DATA[enemyType] ||
            ENEMY_DATA[
                ENEMY_TYPES.FOREST_SCOUT
            ];

        super({

            ...data,

            ...options,

            x,

            y,

            type: ENTITY_TYPES.ENEMY,

            width:
                options.width ?? 18,

            height:
                options.height ?? 24

        });

        this.enemyType = enemyType;

        this.detectionRange =
            data.detectionRange;

        this.loseRange =
            ENTITY_CONFIG.ENEMY_LOSE_DISTANCE;

        this.patrolRadius = 90;

        this.patrolTimer = 0;

        this.patrolTarget = null;

        this.repathTimer = 0;

        this.path = [];

        this.pathIndex = 0;

        this.attackWindup = 0;

        this.attackTarget = null;

        this.lootCoins =
            data.coins;

        this.rewardClaimed = false;

        this.state =
            AI_STATES.PATROL;

    }


    // =================================================
    // DETECTAR JOGADOR
    // =================================================

    canDetectPlayer(
        player,
        world
    ) {

        if (
            !player ||
            player.health <= 0
        ) {

            return false;

        }

        const playerX =
            player.x +
            player.width / 2;

        const playerY =
            player.y +
            player.height / 2;

        const playerDistance =
            this.distanceTo(

                playerX,

                playerY

            );

        if (
            playerDistance >
            this.detectionRange
        ) {

            return false;

        }

        if (
            typeof world.hasLineOfSight ===
            "function"
        ) {

            return world.hasLineOfSight(

                this.centerX,

                this.centerY,

                playerX,

                playerY

            );

        }

        return true;

    }


    // =================================================
    // ESCOLHER DESTINO DE PATRULHA
    // =================================================

    choosePatrolTarget(world) {

        for (
            let attempt = 0;
            attempt < 10;
            attempt++
        ) {

            const angle =
                entityRandom(

                    0,

                    Math.PI * 2

                );

            const radius =
                entityRandom(

                    15,

                    this.patrolRadius

                );

            const x =

                this.homeX +

                Math.cos(angle) * radius;

            const y =

                this.homeY +

                Math.sin(angle) * radius;

            if (
                world.canMove({

                    x,

                    y,

                    w: this.width,

                    h: this.height

                })
            ) {

                this.patrolTarget = {

                    x,

                    y

                };

                return;

            }

        }

        this.patrolTarget = null;

    }


    // =================================================
    // PATRULHAR
    // =================================================

    updatePatrol(dt, world) {

        this.patrolTimer -= dt;

        if (
            !this.patrolTarget ||
            this.patrolTimer <= 0
        ) {

            this.patrolTimer =
                entityRandom(2, 5);

            this.choosePatrolTarget(
                world
            );

        }

        if (!this.patrolTarget) {

            this.moving = false;

            return;

        }

        const targetDistance =
            this.distanceTo(

                this.patrolTarget.x,

                this.patrolTarget.y

            );

        if (
            targetDistance < 8
        ) {

            this.patrolTarget = null;

            this.moving = false;

            return;

        }

        const moved = this.moveTowards(

            this.patrolTarget.x,

            this.patrolTarget.y,

            world,

            dt

        );

        if (!moved) {

            this.patrolTarget = null;

        }

    }


    // =================================================
    // PERSEGUIR JOGADOR
    // =================================================

    updateChase(
        dt,
        world,
        player
    ) {

        const playerX =
            player.x +
            player.width / 2;

        const playerY =
            player.y +
            player.height / 2;

        const targetDistance =
            this.distanceTo(

                playerX,

                playerY

            );

        if (
            targetDistance <=
            this.attackRange
        ) {

            this.state =
                AI_STATES.ATTACK;

            this.moving = false;

            return;

        }

        this.repathTimer -= dt;

        // -----------------------------------------
        // CALCULAR ROTA PERIODICAMENTE
        // -----------------------------------------

        if (
            this.repathTimer <= 0
        ) {

            this.repathTimer = 0.7;

            if (
                typeof world.findPath ===
                "function"
            ) {

                this.path =
                    world.findPath(

                        this.x,

                        this.y,

                        player.x,

                        player.y,

                        {

                            width: this.width,

                            height: this.height,

                            maxIterations: 350

                        }

                    );

                this.pathIndex = 0;

            }

        }

        // -----------------------------------------
        // SEGUIR CAMINHO
        // -----------------------------------------

        if (
            this.path.length > 0 &&
            this.pathIndex <
                this.path.length
        ) {

            const waypoint =
                this.path[this.pathIndex];

            const waypointDistance =
                entityDistance(

                    this.x,

                    this.y,

                    waypoint.x,

                    waypoint.y

                );

            if (
                waypointDistance < 6
            ) {

                this.pathIndex++;

            } else {

                this.moveTowards(

                    waypoint.x +
                        this.width / 2,

                    waypoint.y +
                        this.height / 2,

                    world,

                    dt

                );

                return;

            }

        }

        // -----------------------------------------
        // MOVIMENTO DIRETO
        // -----------------------------------------

        this.moveTowards(

            playerX,

            playerY,

            world,

            dt

        );

    }


    // =================================================
    // PREPARAR ATAQUE
    // =================================================

    beginAttack(player) {

        if (
            this.attackTimer > 0 ||
            this.attackWindup > 0
        ) {

            return false;

        }

        this.attackWindup = 0.35;

        this.attackTarget = player;

        this.moving = false;

        return true;

    }


    // =================================================
    // EXECUTAR ATAQUE
    // =================================================

    executeAttack(player, manager) {

        if (
            !player ||
            player.health <= 0
        ) {

            return false;

        }

        const playerX =
            player.x +
            player.width / 2;

        const playerY =
            player.y +
            player.height / 2;

        const attackDistance =
            this.distanceTo(

                playerX,

                playerY

            );

        if (
            attackDistance >
            this.attackRange + 10
        ) {

            return false;

        }

        this.attackTimer =
            this.attackCooldown;

        return manager.damagePlayer(

            player,

            this.damage,

            this

        );

    }


    // =================================================
    // ATUALIZAÇÃO PRINCIPAL DO INIMIGO
    // =================================================

    update(dt, world, player, manager) {

        super.update(

            dt,

            world,

            player,

            manager

        );

        if (!this.isAlive()) {

            return;

        }

        // -----------------------------------------
        // PROCESSAR PREPARAÇÃO DE ATAQUE
        // -----------------------------------------

        if (
            this.attackWindup > 0
        ) {

            this.attackWindup -= dt;

            this.moving = false;

            if (
                this.attackWindup <= 0
            ) {

                this.attackWindup = 0;

                this.executeAttack(

                    player,

                    manager

                );

                this.state =
                    AI_STATES.CHASE;

            }

            return;

        }

        // -----------------------------------------
        // DETECTAR JOGADOR
        // -----------------------------------------

        if (
            this.canDetectPlayer(

                player,

                world

            )
        ) {

            this.state =
                AI_STATES.CHASE;

        }

        // -----------------------------------------
        // DISTÂNCIA ATÉ O JOGADOR
        // -----------------------------------------

        const playerDistance =
            player
                ? this.distanceTo(

                    player.x +
                        player.width / 2,

                    player.y +
                        player.height / 2

                )
                : Infinity;

        // -----------------------------------------
        // PERDER O ALVO
        // -----------------------------------------

        if (
            playerDistance >
            this.loseRange
        ) {

            if (
                this.state ===
                    AI_STATES.CHASE ||
                this.state ===
                    AI_STATES.ATTACK
            ) {

                this.state =
                    AI_STATES.RETURN;

            }

        }

        // -----------------------------------------
        // COMPORTAMENTO
        // -----------------------------------------

        switch (this.state) {

            case AI_STATES.PATROL:

                this.updatePatrol(

                    dt,

                    world

                );

                break;

            case AI_STATES.CHASE:

                this.updateChase(

                    dt,

                    world,

                    player

                );

                break;

            case AI_STATES.ATTACK:

                this.beginAttack(
                    player
                );

                break;

            case AI_STATES.RETURN:

                this.moveTowards(

                    this.homeX +
                        this.width / 2,

                    this.homeY +
                        this.height / 2,

                    world,

                    dt

                );

                if (
                    this.distanceTo(

                        this.homeX +
                            this.width / 2,

                        this.homeY +
                            this.height / 2

                    ) < 8
                ) {

                    this.state =
                        AI_STATES.PATROL;

                }

                break;

            default:

                this.state =
                    AI_STATES.PATROL;

                break;

        }

    }


    // =================================================
    // MORTE DO INIMIGO
    // =================================================

    die(source = null) {

        super.die(source);

        this.attackWindup = 0;

        this.path = [];

    }

}


// =====================================================
// CONFIGURAÇÕES DOS CHEFES
// =====================================================

const BOSS_DATA = Object.freeze({

    [BOSS_TYPES.FOREST_GUARDIAN]: {

        name: "Guardião das Raízes",

        health: 450,

        damage: 17,

        defense: 5,

        speed: 22,

        attackRange: 40,

        attackCooldown: 2.3,

        color: "#315a37",

        secondaryColor: "#88b65c",

        rewardCoins: 150

    },

    [BOSS_TYPES.ANCIENT_COLOSSUS]: {

        name: "Colosso Esquecido",

        health: 700,

        damage: 24,

        defense: 9,

        speed: 14,

        attackRange: 48,

        attackCooldown: 3,

        color: "#777a74",

        secondaryColor: "#69c5b8",

        rewardCoins: 250

    },

    [BOSS_TYPES.DESERT_WARDEN]: {

        name: "Sentinela das Dunas",

        health: 520,

        damage: 20,

        defense: 6,

        speed: 30,

        attackRange: 43,

        attackCooldown: 2,

        color: "#b58b50",

        secondaryColor: "#e4bd77",

        rewardCoins: 200

    },

    [BOSS_TYPES.FROST_BEHEMOTH]: {

        name: "Titã da Geada",

        health: 600,

        damage: 22,

        defense: 7,

        speed: 20,

        attackRange: 45,

        attackCooldown: 2.6,

        color: "#779ca9",

        secondaryColor: "#cceef5",

        rewardCoins: 220

    }

});


// =====================================================
// CLASSE CHEFE
// =====================================================

class Boss extends Enemy {

    constructor(
        bossType,
        x,
        y
    ) {

        const data =
            BOSS_DATA[bossType];

        if (!data) {

            throw new Error(
                "Tipo de chefe inválido."
            );

        }

        super(

            ENEMY_TYPES.STONE_GUARD,

            x,

            y,

            {

                ...data,

                width: 38,

                height: 45

            }

        );

        this.type =
            ENTITY_TYPES.BOSS;

        this.bossType = bossType;

        this.name = data.name;

        this.color = data.color;

        this.secondaryColor =
            data.secondaryColor;

        this.damage = data.damage;

        this.defense = data.defense;

        this.maxHealth = data.health;

        this.health = data.health;

        this.speed = data.speed;

        this.attackRange =
            data.attackRange;

        this.attackCooldown =
            data.attackCooldown;

        this.rewardCoins =
            data.rewardCoins;

        // -----------------------------------------
        // FASES
        // -----------------------------------------

        this.phase = 1;

        this.maximumPhase = 3;

        this.bossActive = false;

        // -----------------------------------------
        // ATAQUES ESPECIAIS
        // -----------------------------------------

        this.specialAttackTimer = 3;

        this.specialWindup = 0;

        this.specialRadius = 0;

        this.specialDamage = 0;

        this.specialTargetX = 0;

        this.specialTargetY = 0;

        // -----------------------------------------
        // ARENA
        // -----------------------------------------

        this.arenaX = x;

        this.arenaY = y;

        this.arenaRadius = 210;

        this.detectionRange =
            ENTITY_CONFIG.BOSS_DETECTION_DISTANCE;

        this.loseRange = 320;

        this.patrolRadius = 35;

    }


    // =================================================
    // DETERMINAR FASE
    // =================================================

    updatePhase() {

        const percentage =

            this.health /
            this.maxHealth;

        let nextPhase = 1;

        if (
            percentage <= 0.30
        ) {

            nextPhase = 3;

        } else if (
            percentage <= 0.65
        ) {

            nextPhase = 2;

        }

        if (
            nextPhase <= this.phase
        ) {

            return;

        }

        this.phase = nextPhase;

        if (
            this.phase === 2
        ) {

            this.speed *= 1.18;

            this.attackCooldown *= 0.85;

        }

        if (
            this.phase === 3
        ) {

            this.speed *= 1.15;

            this.attackCooldown *= 0.80;

        }

    }


    // =================================================
    // INICIAR ATAQUE ESPECIAL
    // =================================================

    beginSpecialAttack(player) {

        if (
            this.specialWindup > 0 ||
            !player
        ) {

            return;

        }

        this.specialTargetX =
            player.x +
            player.width / 2;

        this.specialTargetY =
            player.y +
            player.height / 2;

        this.specialRadius =

            this.phase === 1
                ? 33
                : this.phase === 2
                    ? 42
                    : 52;

        this.specialDamage =

            this.damage *
            (
                this.phase === 3
                    ? 1.6
                    : 1.25
            );

        // Tempo de preparação para permitir
        // que o jogador desvie do ataque.

        this.specialWindup =

            this.phase === 3
                ? 0.65
                : 1.1;

        this.state =
            AI_STATES.ATTACK;

        this.moving = false;

    }


    // =================================================
    // EXECUTAR ATAQUE ESPECIAL
    // =================================================

    executeSpecialAttack(
        player,
        manager
    ) {

        if (!player) {

            return;

        }

        const playerX =
            player.x +
            player.width / 2;

        const playerY =
            player.y +
            player.height / 2;

        const attackDistance =
            entityDistance(

                playerX,

                playerY,

                this.specialTargetX,

                this.specialTargetY

            );

        if (
            attackDistance <=
            this.specialRadius
        ) {

            manager.damagePlayer(

                player,

                this.specialDamage,

                this

            );

        }

        this.specialAttackTimer =

            this.phase === 3
                ? 3.2
                : 4.5;

        this.attackTimer = 0.6;

        this.state =
            AI_STATES.CHASE;

    }


    // =================================================
    // ATUALIZAÇÃO DO CHEFE
    // =================================================

    update(dt, world, player, manager) {

        if (!this.isAlive()) {

            return;

        }

        this.updatePhase();

        // -----------------------------------------
        // ATAQUE ESPECIAL EM PREPARAÇÃO
        // -----------------------------------------

        if (
            this.specialWindup > 0
        ) {

            this.updateTimers(dt);

            this.specialWindup -= dt;

            this.moving = false;

            if (
                this.specialWindup <= 0
            ) {

                this.specialWindup = 0;

                this.executeSpecialAttack(

                    player,

                    manager

                );

            }

            return;

        }

        // -----------------------------------------
        // ATIVAR CHEFE
        // -----------------------------------------

        if (
            player &&
            this.distanceTo(

                player.x +
                    player.width / 2,

                player.y +
                    player.height / 2

            ) <= this.detectionRange
        ) {

            this.bossActive = true;

        }

        // -----------------------------------------
        // ATUALIZAÇÃO NORMAL
        // -----------------------------------------

        super.update(

            dt,

            world,

            player,

            manager

        );

        if (!this.bossActive) {

            return;

        }

        // -----------------------------------------
        // ATAQUE ESPECIAL
        // -----------------------------------------

        this.specialAttackTimer -= dt;

        if (
            this.specialAttackTimer <= 0 &&
            this.attackWindup <= 0 &&
            this.specialWindup <= 0 &&
            player &&
            player.health > 0
        ) {

            this.beginSpecialAttack(
                player
            );

        }

        // -----------------------------------------
        // LIMITAR ÁREA DE COMBATE
        // -----------------------------------------

        const homeDistance =
            entityDistance(

                this.x,

                this.y,

                this.arenaX,

                this.arenaY

            );

        if (
            homeDistance >
            this.arenaRadius
        ) {

            this.state =
                AI_STATES.RETURN;

            this.specialAttackTimer = 3;

        }

    }


    // =================================================
    // RENDERIZAR AVISO DE ATAQUE ESPECIAL
    // =================================================

    draw(ctx) {

        if (!this.isAlive()) {

            return;

        }

        // -----------------------------------------
        // ÁREA DE IMPACTO
        // -----------------------------------------

        if (
            this.specialWindup > 0
        ) {

            ctx.save();

            ctx.fillStyle =
                "rgba(220, 55, 45, 0.20)";

            ctx.beginPath();

            ctx.arc(

                this.specialTargetX,

                this.specialTargetY,

                this.specialRadius,

                0,

                Math.PI * 2

            );

            ctx.fill();

            ctx.strokeStyle = "#ff654e";

            ctx.lineWidth = 2;

            ctx.stroke();

            ctx.restore();

        }

        drawBossSprite(
            ctx,
            this
        );

    }


    // =================================================
    // MORTE DO CHEFE
    // =================================================

    die(source = null) {

        super.die(source);

        this.bossActive = false;

        this.specialWindup = 0;

    }


    // =================================================
    // EXPORTAR ESTADO DO CHEFE
    // =================================================

    exportState() {

        return {

            ...super.exportState(),

            phase: this.phase,

            bossActive: this.bossActive

        };

    }

}


// =====================================================
// CLASSE ANIMAL
// =====================================================

class Animal extends Entity {

    constructor(options = {}) {

        super({

            ...options,

            type: ENTITY_TYPES.ANIMAL,

            health:
                options.health ?? 20,

            speed:
                options.speed ?? 25,

            width:
                options.width ?? 12,

            height:
                options.height ?? 12,

            color:
                options.color || "#b58b65"

        });

        this.species =
            options.species || "Coelho";

        this.fearRadius =
            options.fearRadius ?? 55;

        this.wanderRadius = 80;

        this.wanderTimer = 0;

        this.wanderTarget = null;

    }


    // =================================================
    // ATUALIZAR ANIMAL
    // =================================================

    update(dt, world, player, manager) {

        super.update(

            dt,

            world,

            player,

            manager

        );

        if (!this.isAlive()) {

            return;

        }

        const playerX =
            player.x +
            player.width / 2;

        const playerY =
            player.y +
            player.height / 2;

        const playerDistance =
            this.distanceTo(

                playerX,

                playerY

            );

        // -----------------------------------------
        // FUGIR DO JOGADOR
        // -----------------------------------------

        if (
            playerDistance <
            this.fearRadius
        ) {

            this.state =
                AI_STATES.FLEE;

            const dx =
                this.centerX - playerX;

            const dy =
                this.centerY - playerY;

            this.move(

                dx,

                dy,

                world,

                dt

            );

            return;

        }

        this.state =
            AI_STATES.PATROL;

        // -----------------------------------------
        // MOVIMENTAÇÃO NATURAL
        // -----------------------------------------

        this.wanderTimer -= dt;

        if (
            this.wanderTimer <= 0
        ) {

            this.wanderTimer =
                entityRandom(2, 5);

            const angle =
                entityRandom(

                    0,

                    Math.PI * 2

                );

            const radius =
                entityRandom(

                    10,

                    this.wanderRadius

                );

            this.wanderTarget = {

                x:
                    this.homeX +
                    Math.cos(angle) *
                    radius,

                y:
                    this.homeY +
                    Math.sin(angle) *
                    radius

            };

        }

        if (!this.wanderTarget) {

            this.moving = false;

            return;

        }

        if (
            this.distanceTo(

                this.wanderTarget.x,

                this.wanderTarget.y

            ) < 5
        ) {

            this.wanderTarget = null;

            this.moving = false;

            return;

        }

        this.moveTowards(

            this.wanderTarget.x,

            this.wanderTarget.y,

            world,

            dt

        );

    }

}


// =====================================================
// RENDERIZAÇÃO PIXELADA
// =====================================================

function entityPixel(
    ctx,
    x,
    y,
    w,
    h,
    color
) {

    ctx.fillStyle = color;

    ctx.fillRect(

        Math.round(x),

        Math.round(y),

        Math.max(1, Math.round(w)),

        Math.max(1, Math.round(h))

    );

}


// =====================================================
// DESENHAR PERSONAGEM
// =====================================================

function drawEntitySprite(
    ctx,
    entity
) {

    const x =
        Math.round(entity.x);

    const y =
        Math.round(entity.y);

    const w =
        entity.width;

    const h =
        entity.height;

    const scale =
        entity.type === ENTITY_TYPES.ANIMAL
            ? 0.65
            : 1;

    ctx.save();

    // -----------------------------------------
    // SOMBRA
    // -----------------------------------------

    ctx.fillStyle =
        "rgba(0,0,0,0.28)";

    ctx.fillRect(

        x + 3,

        y + h - 3,

        Math.max(5, w - 6),

        3

    );

    // -----------------------------------------
    // PERNAS
    // -----------------------------------------

    entityPixel(

        ctx,

        x + w * 0.25,

        y + h * 0.72,

        w * 0.2,

        h * 0.25,

        "#49382c"

    );

    entityPixel(

        ctx,

        x + w * 0.60,

        y + h * 0.72,

        w * 0.2,

        h * 0.25,

        "#49382c"

    );

    // -----------------------------------------
    // CORPO
    // -----------------------------------------

    entityPixel(

        ctx,

        x + w * 0.15,

        y + h * 0.35,

        w * 0.70,

        h * 0.42,

        entity.color

    );

    // -----------------------------------------
    // DETALHE DO CORPO
    // -----------------------------------------

    entityPixel(

        ctx,

        x + w * 0.25,

        y + h * 0.40,

        w * 0.18,

        h * 0.25,

        entity.secondaryColor

    );

    // -----------------------------------------
    // CABEÇA
    // -----------------------------------------

    entityPixel(

        ctx,

        x + w * 0.23,

        y + h * 0.10,

        w * 0.54,

        h * 0.30,

        entity.secondaryColor

    );

    // -----------------------------------------
    // OLHOS
    // -----------------------------------------

    if (
        entity.direction !== "up"
    ) {

        entityPixel(

            ctx,

            x + w * 0.38,

            y + h * 0.23,

            1,

            1,

            "#242424"

        );

        entityPixel(

            ctx,

            x + w * 0.63,

            y + h * 0.23,

            1,

            1,

            "#242424"

        );

    }

    // -----------------------------------------
    // INDICADOR DE DANO
    // -----------------------------------------

    if (
        entity.hitFlash > 0
    ) {

        ctx.fillStyle =
            "rgba(255,255,255,0.55)";

        ctx.fillRect(

            x,

            y,

            w,

            h

        );

    }

    ctx.restore();

}


// =====================================================
// DESENHAR CHEFE
// =====================================================

function drawBossSprite(
    ctx,
    boss
) {

    const x =
        Math.round(boss.x);

    const y =
        Math.round(boss.y);

    const w =
        boss.width;

    const h =
        boss.height;

    ctx.save();

    // -----------------------------------------
    // SOMBRA
    // -----------------------------------------

    entityPixel(

        ctx,

        x + 3,

        y + h - 4,

        w - 6,

        5,

        "rgba(0,0,0,0.35)"

    );

    // -----------------------------------------
    // PERNAS
    // -----------------------------------------

    entityPixel(

        ctx,

        x + 5,

        y + h - 14,

        10,

        13,

        boss.color

    );

    entityPixel(

        ctx,

        x + w - 15,

        y + h - 14,

        10,

        13,

        boss.color

    );

    // -----------------------------------------
    // CORPO
    // -----------------------------------------

    entityPixel(

        ctx,

        x + 4,

        y + 13,

        w - 8,

        h - 25,

        boss.color

    );

    // -----------------------------------------
    // ARMADURA
    // -----------------------------------------

    entityPixel(

        ctx,

        x + 8,

        y + 17,

        w - 16,

        h * 0.32,

        boss.secondaryColor

    );

    // -----------------------------------------
    // CABEÇA
    // -----------------------------------------

    entityPixel(

        ctx,

        x + 8,

        y + 4,

        w - 16,

        15,

        boss.color

    );

    // -----------------------------------------
    // OLHOS
    // -----------------------------------------

    entityPixel(

        ctx,

        x + 13,

        y + 11,

        4,

        2,

        "#ffcd65"

    );

    entityPixel(

        ctx,

        x + w - 17,

        y + 11,

        4,

        2,

        "#ffcd65"

    );

    // -----------------------------------------
    // INDICADOR DE FASE
    // -----------------------------------------

    if (
        boss.phase >= 2
    ) {

        entityPixel(

            ctx,

            x + w / 2 - 2,

            y,

            4,

            4,

            "#f29b45"

        );

    }

    if (
        boss.phase === 3
    ) {

        entityPixel(

            ctx,

            x + 3,

            y + 4,

            4,

            5,

            "#f05245"

        );

        entityPixel(

            ctx,

            x + w - 7,

            y + 4,

            4,

            5,

            "#f05245"

        );

    }

    if (
        boss.hitFlash > 0
    ) {

        ctx.fillStyle =
            "rgba(255,255,255,0.55)";

        ctx.fillRect(

            x,

            y,

            w,

            h

        );

    }

    ctx.restore();

}


// =====================================================
// CLASSE GERENCIADORA DE ENTIDADES
// =====================================================

class EntityManager {

    constructor(world) {

        this.world = world;

        this.entities = [];

        this.activeDialogue = null;

        this.activeShop = null;

        this.shopSelection = 0;

        this.playerDamageCooldown = 0;

        this.messages = [];

        this.activeBoss = null;

        this.spawned = false;

    }


    // =================================================
    // ADICIONAR ENTIDADE
    // =================================================

    add(entity) {

        if (!entity) {

            return false;

        }

        if (
            this.entities.length >=
            ENTITY_CONFIG.MAX_ENTITIES
        ) {

            return false;

        }

        this.entities.push(
            entity
        );

        return true;

    }


    // =================================================
    // REMOVER ENTIDADE
    // =================================================

    remove(id) {

        const index =
            this.entities.findIndex(

                entity =>
                    entity.id === id

            );

        if (index < 0) {

            return false;

        }

        this.entities.splice(
            index,
            1
        );

        return true;

    }


    // =================================================
    // CONSULTAR ENTIDADE
    // =================================================

    getById(id) {

        return this.entities.find(

            entity =>
                entity.id === id

        ) || null;

    }


    // =================================================
    // CONSULTAR ENTIDADES POR TIPO
    // =================================================

    getByType(type) {

        return this.entities.filter(

            entity =>
                entity.type === type

        );

    }


    // =================================================
    // ENCONTRAR POSIÇÃO LIVRE
    // =================================================

    findFreePosition(
        x,
        y,
        width = 18,
        height = 24
    ) {

        if (
            this.world.canMove({

                x,

                y,

                w: width,

                h: height

            })
        ) {

            return {
                x,
                y
            };

        }

        if (
            typeof this.world.findNearestWalkable ===
            "function"
        ) {

            return this.world.findNearestWalkable(

                x,

                y,

                width,

                height,

                150

            );

        }

        return null;

    }


    // =================================================
    // CRIAR NPC
    // =================================================

    spawnNPC(options) {

        const position =
            this.findFreePosition(

                options.x,

                options.y

            );

        if (!position) {

            return null;

        }

        const npc = new NPC({

            ...options,

            x: position.x,

            y: position.y

        });

        this.add(npc);

        return npc;

    }


    // =================================================
    // CRIAR COMERCIANTE
    // =================================================

    spawnShopkeeper(options) {

        const position =
            this.findFreePosition(

                options.x,

                options.y

            );

        if (!position) {

            return null;

        }

        const merchant =
            new Shopkeeper({

                ...options,

                x: position.x,

                y: position.y

            });

        this.add(merchant);

        return merchant;

    }


    // =================================================
    // CRIAR INIMIGO
    // =================================================

    spawnEnemy(
        enemyType,
        x,
        y
    ) {

        const position =
            this.findFreePosition(

                x,

                y

            );

        if (!position) {

            return null;

        }

        const enemy = new Enemy(

            enemyType,

            position.x,

            position.y

        );

        this.add(enemy);

        return enemy;

    }


    // =================================================
    // CRIAR CHEFE
    // =================================================

    spawnBoss(
        bossType,
        x,
        y
    ) {

        const position =
            this.findFreePosition(

                x,

                y,

                38,

                45

            );

        if (!position) {

            return null;

        }

        const boss = new Boss(

            bossType,

            position.x,

            position.y

        );

        this.add(boss);

        return boss;

    }


    // =================================================
    // CRIAR ANIMAL
    // =================================================

    spawnAnimal(options) {

        const position =
            this.findFreePosition(

                options.x,

                options.y,

                12,

                12

            );

        if (!position) {

            return null;

        }

        const animal =
            new Animal({

                ...options,

                x: position.x,

                y: position.y

            });

        this.add(animal);

        return animal;

    }


    // =================================================
    // CRIAR POPULAÇÃO INICIAL
    // =================================================

    spawnInitialPopulation(player = null) {

        if (this.spawned) {

            return;

        }

        this.spawned = true;

        // -----------------------------------------
        // COMERCIANTE INICIAL
        // -----------------------------------------

        const centerX =
            player
                ? player.x
                : 2500;

        const centerY =
            player
                ? player.y
                : 2500;

        this.spawnShopkeeper({

            name: "Borin",

            shopName:
                "Empório do Viajante",

            x: centerX + 55,

            y: centerY + 30,

            color: "#6b5a91",

            secondaryColor: "#e5bd8b",

            dialogues: [

                "Saudações, viajante!",

                "Tenho suprimentos para sua jornada.",

                "As ruínas escondem segredos antigos."

            ],

            stock: [

                {
                    product: "APPLE",
                    quantity: 15
                },

                {
                    product: "HEALTH_POTION",
                    quantity: 8
                },

                {
                    product: "STAMINA_POTION",
                    quantity: 7
                },

                {
                    product: "ARROW",
                    quantity: 30
                }

            ]

        });

        // -----------------------------------------
        // NPCS
        // -----------------------------------------

        this.spawnNPC({

            name: "Lina",

            x: centerX - 50,

            y: centerY + 45,

            personality:
                NPC_PERSONALITIES.FRIENDLY,

            color: "#9b625b",

            secondaryColor: "#edc9a2",

            dialogues: [

                "Você parece novo por aqui.",

                "Existe um antigo templo a oeste.",

                "Dizem que criaturas poderosas guardam as montanhas."

            ]

        });

        this.spawnNPC({

            name: "Darin",

            x: centerX + 35,

            y: centerY - 60,

            personality:
                NPC_PERSONALITIES.GUARD,

            color: "#5b7598",

            secondaryColor: "#d2b08c",

            dialogues: [

                "Mantenha sua espada preparada.",

                "As estradas ficam perigosas durante a noite.",

                "Procure suprimentos antes de explorar as ruínas."

            ]

        });

        // -----------------------------------------
        // INIMIGOS DA FLORESTA
        // -----------------------------------------

        for (let i = 0; i < 18; i++) {

            this.spawnEnemy(

                ENEMY_TYPES.FOREST_SCOUT,

                180 + i * 45,

                220 + (i % 5) * 70

            );

        }

        // -----------------------------------------
        // INIMIGOS DAS MONTANHAS
        // -----------------------------------------

        for (let i = 0; i < 12; i++) {

            this.spawnEnemy(

                ENEMY_TYPES.STONE_GUARD,

                3600 + (i % 6) * 80,

                350 + Math.floor(i / 6) * 120

            );

        }

        // -----------------------------------------
        // INIMIGOS DO DESERTO
        // -----------------------------------------

        for (let i = 0; i < 15; i++) {

            this.spawnEnemy(

                ENEMY_TYPES.DESERT_RAIDER,

                3650 + (i % 5) * 100,

                3250 + Math.floor(i / 5) * 100

            );

        }

        // -----------------------------------------
        // INIMIGOS DA NEVE
        // -----------------------------------------

        for (let i = 0; i < 12; i++) {

            this.spawnEnemy(

                ENEMY_TYPES.ICE_HUNTER,

                450 + (i % 6) * 160,

                4250 + Math.floor(i / 6) * 140

            );

        }

        // -----------------------------------------
        // SENTINELAS DAS RUÍNAS
        // -----------------------------------------

        for (let i = 0; i < 10; i++) {

            this.spawnEnemy(

                ENEMY_TYPES.RUIN_SENTINEL,

                1350 + (i % 5) * 120,

                2950 + Math.floor(i / 5) * 150

            );

        }

        // -----------------------------------------
        // CHEFES
        // -----------------------------------------

        this.spawnBoss(

            BOSS_TYPES.FOREST_GUARDIAN,

            750,

            1100

        );

        this.spawnBoss(

            BOSS_TYPES.ANCIENT_COLOSSUS,

            3850,

            1050

        );

        this.spawnBoss(

            BOSS_TYPES.DESERT_WARDEN,

            4250,

            3650

        );

        this.spawnBoss(

            BOSS_TYPES.FROST_BEHEMOTH,

            2500,

            4500

        );

        // -----------------------------------------
        // ANIMAIS
        // -----------------------------------------

        for (let i = 0; i < 24; i++) {

            this.spawnAnimal({

                name: "Coelho Selvagem",

                species: "Coelho",

                x: 400 + (i % 8) * 120,

                y: 1700 + Math.floor(i / 8) * 130,

                color: "#b78d65",

                secondaryColor: "#e8d7b4"

            });

        }

    }


    // =================================================
    // CAUSAR DANO AO JOGADOR
    // =================================================

    damagePlayer(
        player,
        damage,
        source = null
    ) {

        if (
            !player ||
            player.health <= 0
        ) {

            return false;

        }

        if (
            this.playerDamageCooldown > 0
        ) {

            return false;

        }

        if (
            typeof player.takeDamage !==
            "function"
        ) {

            return false;

        }

        player.takeDamage(

            Math.max(
                1,
                Math.round(damage)
            )

        );

        this.playerDamageCooldown = 0.45;

        return true;

    }


    // =================================================
    // ATAQUE DO JOGADOR CONTRA ENTIDADES
    // =================================================

    playerAttack(
        player,
        damage = 15,
        range = ENTITY_CONFIG.PLAYER_ATTACK_RANGE
    ) {

        if (!player) {

            return 0;

        }

        const direction =
            entityDirectionVector(

                player.direction

            );

        const playerX =
            player.x +
            player.width / 2;

        const playerY =
            player.y +
            player.height / 2;

        let hits = 0;

        for (const entity of this.entities) {

            if (!entity.isAlive()) {

                continue;

            }

            if (
                entity.type !== ENTITY_TYPES.ENEMY &&
                entity.type !== ENTITY_TYPES.BOSS &&
                entity.type !== ENTITY_TYPES.ANIMAL
            ) {

                continue;

            }

            const dx =
                entity.centerX - playerX;

            const dy =
                entity.centerY - playerY;

            const targetDistance =
                Math.hypot(dx, dy);

            if (
                targetDistance > range +
                    entity.width / 2
            ) {

                continue;

            }

            const normalized =
                entityNormalize(dx, dy);

            const dot =

                normalized.x * direction.x +

                normalized.y * direction.y;

            const minimumDot =
                Math.cos(

                    ENTITY_CONFIG.PLAYER_ATTACK_ARC / 2

                );

            if (
                dot < minimumDot
            ) {

                continue;

            }

            const appliedDamage =
                entity.takeDamage(

                    damage,

                    player

                );

            if (
                appliedDamage > 0
            ) {

                hits++;

                if (
                    !entity.isAlive()
                ) {

                    this.onEntityDefeated(

                        entity,

                        player

                    );

                }

            }

        }

        return hits;

    }


    // =================================================
    // RECOMPENSA POR DERROTAR ENTIDADE
    // =================================================

    onEntityDefeated(
        entity,
        player
    ) {

        if (
            entity.rewardClaimed
        ) {

            return;

        }

        entity.rewardClaimed = true;

        const inventory =
            player.inventory;

        if (
            !inventory ||
            typeof inventory.addItem !==
                "function"
        ) {

            return;

        }

        let coins = 0;

        if (
            entity.type === ENTITY_TYPES.ENEMY
        ) {

            coins =
                entity.lootCoins || 5;

        }

        if (
            entity.type === ENTITY_TYPES.BOSS
        ) {

            coins =
                entity.rewardCoins || 150;

        }

        if (coins > 0) {

            inventory.addItem({

                id: "coins",

                name: "Moedas",

                type: "currency",

                quantity: coins

            });

        }

        if (
            entity.type === ENTITY_TYPES.BOSS
        ) {

            inventory.addItem({

                id: "boss_fragment",

                name: "Fragmento de Guardião",

                type: "material",

                quantity: 1

            });

            this.showMessage(

                entity.name +
                " foi derrotado!"

            );

        }

    }


    // =================================================
    // ABRIR DIÁLOGO
    // =================================================

    openDialogue(
        entity,
        text
    ) {

        this.activeShop = null;

        this.activeDialogue = {

            entity,

            text

        };

    }


    // =================================================
    // FECHAR DIÁLOGO
    // =================================================

    closeDialogue() {

        this.activeDialogue = null;

    }


    // =================================================
    // ABRIR LOJA
    // =================================================

    openShop(shopkeeper) {

        this.activeDialogue = null;

        this.activeShop = shopkeeper;

        this.shopSelection = 0;

    }


    // =================================================
    // FECHAR LOJA
    // =================================================

    closeShop() {

        this.activeShop = null;

    }


    // =================================================
    // VERIFICAR SE INTERFACE ESTÁ ABERTA
    // =================================================

    isInteracting() {

        return Boolean(

            this.activeDialogue ||
            this.activeShop

        );

    }


    // =================================================
    // BUSCAR NPC PRÓXIMO
    // =================================================

    getNearestInteractable(player) {

        if (!player) {

            return null;

        }

        let nearest = null;

        let bestDistance =
            ENTITY_CONFIG.NPC_INTERACTION_DISTANCE;

        const playerX =
            player.x +
            player.width / 2;

        const playerY =
            player.y +
            player.height / 2;

        for (const entity of this.entities) {

            if (!entity.isAlive()) {

                continue;

            }

            if (
                entity.type !== ENTITY_TYPES.NPC &&
                entity.type !== ENTITY_TYPES.SHOPKEEPER
            ) {

                continue;

            }

            const currentDistance =
                entity.distanceTo(

                    playerX,

                    playerY

                );

            if (
                currentDistance < bestDistance
            ) {

                bestDistance =
                    currentDistance;

                nearest = entity;

            }

        }

        return nearest;

    }


    // =================================================
    // INTERAGIR
    // =================================================

    interact(player) {

        if (
            this.activeShop
        ) {

            this.closeShop();

            return true;

        }

        if (
            this.activeDialogue
        ) {

            this.closeDialogue();

            return true;

        }

        const entity =
            this.getNearestInteractable(
                player
            );

        if (!entity) {

            return false;

        }

        return entity.interact(

            player,

            this

        );

    }


    // =================================================
    // COMPRAR ITEM DA LOJA
    // =================================================

    buySelectedItem(
        player,
        inventory = null
    ) {

        if (!this.activeShop) {

            return false;

        }

        const targetInventory =
            inventory || player.inventory;

        const catalog =
            this.activeShop.getCatalog();

        const product =
            catalog[this.shopSelection];

        if (!product) {

            return false;

        }

        const result =
            this.activeShop.buy(

                product.id,

                targetInventory,

                1

            );

        if (result.success) {

            this.showMessage(

                "Comprado: " +
                product.name

            );

        } else {

            this.showMessage(

                "Compra não realizada: " +
                result.reason

            );

        }

        return result.success;

    }


    // =================================================
    // MOSTRAR MENSAGEM
    // =================================================

    showMessage(text) {

        this.messages.push({

            text,

            remaining: 3

        });

        if (
            this.messages.length > 6
        ) {

            this.messages.shift();

        }

    }


    // =================================================
    // ATUALIZAR SISTEMA DE ENTIDADES
    // =================================================

    update(
        dt,
        player,
        world = this.world
    ) {

        if (
            !Number.isFinite(dt) ||
            dt <= 0 ||
            !player
        ) {

            return;

        }

        dt = Math.min(

            dt,

            ENTITY_CONFIG.MAX_DELTA_TIME

        );

        this.playerDamageCooldown =
            Math.max(

                0,

                this.playerDamageCooldown - dt

            );

        // -----------------------------------------
        // ATUALIZAR MENSAGENS
        // -----------------------------------------

        for (const message of this.messages) {

            message.remaining -= dt;

        }

        this.messages =
            this.messages.filter(

                message =>
                    message.remaining > 0

            );

        // -----------------------------------------
        // ATUALIZAR ENTIDADES PRÓXIMAS
        // -----------------------------------------

        this.activeBoss = null;

        for (const entity of this.entities) {

            if (!entity.isAlive()) {

                continue;

            }

            const playerDistance =
                entity.distanceTo(

                    player.x +
                        player.width / 2,

                    player.y +
                        player.height / 2

                );

            if (
                playerDistance >
                ENTITY_CONFIG.ACTIVE_DISTANCE
            ) {

                continue;

            }

            entity.update(

                dt,

                world,

                player,

                this

            );

            if (
                entity.type === ENTITY_TYPES.BOSS &&
                entity.bossActive
            ) {

                this.activeBoss = entity;

            }

        }

    }


    // =================================================
    // RENDERIZAR ENTIDADES VISÍVEIS
    // =================================================

    draw(
        ctx,
        cameraX,
        cameraY,
        screenWidth,
        screenHeight
    ) {

        const visible = [];

        const margin =
            ENTITY_CONFIG.VISIBLE_MARGIN;

        for (const entity of this.entities) {

            if (!entity.isAlive()) {

                continue;

            }

            if (

                entity.x + entity.width <
                    cameraX - margin ||

                entity.x >
                    cameraX + screenWidth + margin ||

                entity.y + entity.height <
                    cameraY - margin ||

                entity.y >
                    cameraY + screenHeight + margin

            ) {

                continue;

            }

            visible.push(entity);

        }

        // -----------------------------------------
        // ORDENAR POR PROFUNDIDADE
        // -----------------------------------------

        visible.sort(

            (a, b) =>

                (
                    a.y + a.height
                ) -

                (
                    b.y + b.height
                )

        );

        // -----------------------------------------
        // DESENHAR
        // -----------------------------------------

        for (const entity of visible) {

            entity.draw(ctx);

        }

    }


    // =================================================
    // DESENHAR INTERFACE DE DIÁLOGO
    // =================================================

    drawDialogue(
        ctx,
        screenWidth,
        screenHeight
    ) {

        if (!this.activeDialogue) {

            return;

        }

        const boxX = 12;

        const boxY =
            screenHeight - 58;

        const boxW =
            screenWidth - 24;

        const boxH = 48;

        ctx.fillStyle =
            "rgba(23, 31, 24, 0.95)";

        ctx.fillRect(

            boxX,

            boxY,

            boxW,

            boxH

        );

        ctx.strokeStyle = "#d5bb76";

        ctx.strokeRect(

            boxX,

            boxY,

            boxW,

            boxH

        );

        ctx.fillStyle = "#f0dc9b";

        ctx.font = "8px monospace";

        ctx.fillText(

            this.activeDialogue.entity.name,

            boxX + 8,

            boxY + 12

        );

        ctx.fillStyle = "#ffffff";

        ctx.font = "7px monospace";

        ctx.fillText(

            this.activeDialogue.text,

            boxX + 8,

            boxY + 27

        );

        ctx.fillStyle = "#c6d6be";

        ctx.fillText(

            "F - CONTINUAR",

            boxX + 8,

            boxY + 40

        );

    }


    // =================================================
    // DESENHAR INTERFACE DA LOJA
    // =================================================

    drawShop(
        ctx,
        screenWidth,
        screenHeight,
        player
    ) {

        if (!this.activeShop) {

            return;

        }

        const catalog =
            this.activeShop.getCatalog();

        const x = 35;

        const y = 14;

        const w =
            screenWidth - 70;

        const h =
            screenHeight - 28;

        ctx.fillStyle =
            "rgba(24, 32, 25, 0.97)";

        ctx.fillRect(
            x,
            y,
            w,
            h
        );

        ctx.strokeStyle = "#d5bb76";

        ctx.strokeRect(
            x,
            y,
            w,
            h
        );

        ctx.font = "8px monospace";

        ctx.fillStyle = "#f0dc9b";

        ctx.fillText(

            this.activeShop.shopName,

            x + 10,

            y + 14

        );

        ctx.font = "7px monospace";

        for (
            let i = 0;
            i < catalog.length;
            i++
        ) {

            const product =
                catalog[i];

            const itemY =
                y + 30 + i * 14;

            if (
                i === this.shopSelection
            ) {

                ctx.fillStyle = "#6b5930";

                ctx.fillRect(

                    x + 7,

                    itemY - 8,

                    w - 14,

                    12

                );

            }

            ctx.fillStyle = "#ffffff";

            ctx.fillText(

                product.name,

                x + 12,

                itemY

            );

            ctx.fillText(

                product.price + " M",

                x + w - 55,

                itemY

            );

            ctx.fillText(

                "x" + product.quantity,

                x + w - 25,

                itemY

            );

        }

        const coins =
            getInventoryCoins(

                player.inventory

            );

        ctx.fillStyle = "#f0dc9b";

        ctx.fillText(

            "Moedas: " + coins,

            x + 10,

            y + h - 23

        );

        ctx.fillText(

            "1-6 escolher | ENTER comprar",

            x + 10,

            y + h - 13

        );

        ctx.fillText(

            "F fechar",

            x + 10,

            y + h - 4

        );

    }


    // =================================================
    // DESENHAR BARRA DE VIDA DO CHEFE
    // =================================================

    drawBossHUD(
        ctx,
        screenWidth
    ) {

        const boss =
            this.activeBoss;

        if (
            !boss ||
            !boss.isAlive()
        ) {

            return;

        }

        const barWidth =
            Math.min(
                220,
                screenWidth - 40
            );

        const x =
            (screenWidth - barWidth) / 2;

        const y = 8;

        ctx.fillStyle =
            "rgba(0,0,0,0.82)";

        ctx.fillRect(

            x - 5,

            y - 5,

            barWidth + 10,

            26

        );

        ctx.strokeStyle = "#d5bb76";

        ctx.strokeRect(

            x - 5,

            y - 5,

            barWidth + 10,

            26

        );

        ctx.fillStyle = "#ffffff";

        ctx.font = "8px monospace";

        ctx.fillText(

            boss.name,

            x + 3,

            y + 4

        );

        ctx.fillStyle = "#43262b";

        ctx.fillRect(

            x,

            y + 9,

            barWidth,

            6

        );

        const healthPercentage =

            boss.health /

            boss.maxHealth;

        ctx.fillStyle =

            boss.phase === 3
                ? "#e34a48"
                : boss.phase === 2
                    ? "#e58c45"
                    : "#b7585b";

        ctx.fillRect(

            x,

            y + 9,

            barWidth *
                healthPercentage,

            6

        );

    }


    // =================================================
    // RENDERIZAR INTERFACE DAS ENTIDADES
    // =================================================

    drawUI(
        ctx,
        screenWidth,
        screenHeight,
        player
    ) {

        this.drawBossHUD(

            ctx,

            screenWidth

        );

        this.drawDialogue(

            ctx,

            screenWidth,

            screenHeight

        );

        this.drawShop(

            ctx,

            screenWidth,

            screenHeight,

            player

        );

        // -----------------------------------------
        // MENSAGENS
        // -----------------------------------------

        ctx.font = "7px monospace";

        for (
            let i = 0;
            i < this.messages.length;
            i++
        ) {

            ctx.fillStyle =
                "rgba(0,0,0,0.75)";

            ctx.fillRect(

                75,

                55 + i * 12,

                170,

                11

            );

            ctx.fillStyle = "#ffffff";

            ctx.fillText(

                this.messages[i].text,

                80,

                63 + i * 12

            );

        }

    }


    // =================================================
    // EXPORTAR ESTADO DAS ENTIDADES
    // =================================================

    exportState() {

        return {

            version:
                ENTITY_CONFIG.SAVE_VERSION,

            entities: this.entities

                .filter(
                    entity => entity.persistent
                )

                .map(
                    entity => entity.exportState()
                ),

            shops: this.entities

                .filter(
                    entity =>
                        entity.type ===
                        ENTITY_TYPES.SHOPKEEPER
                )

                .map(
                    shop => ({

                        id: shop.id,

                        stock: shop.stock.map(

                            item => ({
                                ...item
                            })

                        )

                    })

                )

        };

    }


    // =================================================
    // IMPORTAR ESTADO DAS ENTIDADES
    // =================================================

    importState(state) {

        if (
            !state ||
            state.version !==
                ENTITY_CONFIG.SAVE_VERSION
        ) {

            return false;

        }

        if (
            !Array.isArray(state.entities)
        ) {

            return false;

        }

        // -----------------------------------------
        // RECUPERAR ENTIDADES
        // -----------------------------------------

        for (
            const savedEntity of state.entities
        ) {

            const entity =
                this.getById(
                    savedEntity.id
                );

            if (!entity) {

                continue;

            }

            entity.importState(
                savedEntity
            );

        }

        // -----------------------------------------
        // RECUPERAR ESTOQUES
        // -----------------------------------------

        if (
            Array.isArray(state.shops)
        ) {

            for (
                const savedShop of state.shops
            ) {

                const shop =
                    this.getById(
                        savedShop.id
                    );

                if (
                    !shop ||
                    shop.type !==
                        ENTITY_TYPES.SHOPKEEPER
                ) {

                    continue;

                }

                if (
                    Array.isArray(
                        savedShop.stock
                    )
                ) {

                    shop.stock =
                        savedShop.stock.map(

                            item => ({
                                ...item
                            })

                        );

                }

            }

        }

        return true;

    }

}

