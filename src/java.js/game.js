
"use strict";

/*
========================================================
ZELDA PIXEL ADVENTURE
GAME ENGINE — BETA 3

ARQUIVO: GAME.JS

RESPONSABILIDADES:

01. Inicializar o mundo.
02. Criar o personagem.
03. Carregar atributos.
04. Carregar classes.
05. Criar o inventário.
06. Inicializar equipamentos.
07. Inicializar habilidades.
08. Inicializar progressão.
09. Inicializar fabricação de itens.
10. Criar NPCs.
11. Criar comerciantes.
12. Criar inimigos.
13. Criar chefes.
14. Gerenciar o combate.
15. Controlar a câmera.
16. Gerenciar as interfaces.
17. Controlar a movimentação.
18. Gerenciar os itens.
19. Processar interações.
20. Salvar e recuperar o progresso.

========================================================
*/

import {
    installGameIntegration
} from "./integration.js";


// =====================================================
// IMPORTAÇÕES DO MUNDO
// =====================================================

import {
    World
} from "./world.js";


// =====================================================
// IMPORTAÇÕES DAS ENTIDADES
// =====================================================

import {
    EntityManager
} from "./entities.js";


// =====================================================
// IMPORTAÇÕES DO RPG
// =====================================================

import {
    AttributeSet
} from "./ATTRIBUTES.JS";

import {
    CharacterClass
} from "./CLASSES.JS";

import {
    Inventory
} from "./INVENTORY.JS";

import {
    Equipment
} from "./EQUIPMENT.JS";

import {
    SkillBook
} from "./SKILLS.JS";

import {
    Progression
} from "./PROGRESSION.JS";

import {
    CraftingSystem
} from "./CRAFTING.JS";


// =====================================================
// CONFIGURAÇÕES DA ENGINE
// =====================================================

const GAME_CONFIG = Object.freeze({

    WIDTH: 320,

    HEIGHT: 180,

    FPS: 60,

    WALK_SPEED: 65,

    RUN_SPEED: 105,

    MAX_DELTA_TIME: 0.05,

    PLAYER_WIDTH: 16,

    PLAYER_HEIGHT: 24,

    INTERACTION_KEY: "f",

    ATTACK_KEY: "j",

    INVENTORY_KEY: "i",

    CHARACTER_KEY: "c",

    EQUIPMENT_KEY: "e",

    SKILLS_KEY: "k",

    MAP_KEY: "m",

    SAVE_KEY: "p",

    STORAGE_KEY: "zelda_beta3_game"

});


// =====================================================
// UTILITÁRIOS
// =====================================================

function clampGame(value, min, max) {

    return Math.max(

        min,

        Math.min(max, value)

    );

}


function normalizeGameVector(x, y) {

    const length = Math.hypot(x, y);

    if (length === 0) {

        return {
            x: 0,
            y: 0
        };

    }

    return {

        x: x / length,

        y: y / length

    };

}


// =====================================================
// CLASSES DISPONÍVEIS
// =====================================================

const STARTING_CLASSES = [

    "warrior",

    "mage",

    "rogue",

    "ranger",

    "paladin",

    "druid"

];


// =====================================================
// ATRIBUTOS INICIAIS POR CLASSE
// =====================================================

const STARTING_ATTRIBUTES = {

    warrior: {

        strength: 15,

        dexterity: 11,

        constitution: 14,

        intelligence: 8,

        wisdom: 10,

        charisma: 10

    },

    mage: {

        strength: 8,

        dexterity: 12,

        constitution: 11,

        intelligence: 15,

        wisdom: 14,

        charisma: 10

    },

    rogue: {

        strength: 10,

        dexterity: 15,

        constitution: 11,

        intelligence: 12,

        wisdom: 10,

        charisma: 14

    },

    ranger: {

        strength: 11,

        dexterity: 15,

        constitution: 12,

        intelligence: 10,

        wisdom: 14,

        charisma: 8

    },

    paladin: {

        strength: 15,

        dexterity: 8,

        constitution: 14,

        intelligence: 10,

        wisdom: 10,

        charisma: 13

    },

    druid: {

        strength: 10,

        dexterity: 11,

        constitution: 13,

        intelligence: 12,

        wisdom: 15,

        charisma: 8

    }

};


// =====================================================
// PERSONAGEM JOGÁVEL
// =====================================================

class GamePlayer {

    constructor(
        x,
        y,
        character
    ) {

        this.x = x;

        this.y = y;

        this.width =
            GAME_CONFIG.PLAYER_WIDTH;

        this.height =
            GAME_CONFIG.PLAYER_HEIGHT;

        this.direction = "down";

        this.moving = false;

        this.running = false;

        this.blocking = false;

        this.attacking = false;

        this.animationTime = 0;

        this.attackTimer = 0;

        this.attackCooldown = 0;

        this.invulnerabilityTimer = 0;

        this.character = character;

        this.inventory =
            character.inventory;

        this.maxHealth =
            character.maxHealth;

        this.health =
            character.health;

        this.maxStamina =
            character.maxStamina;

        this.stamina =
            character.stamina;

        this.maxMana =
            character.maxMana;

        this.mana =
            character.mana;

    }


    // =================================================
    // CENTRO
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
    // ATUALIZAR DIREÇÃO
    // =================================================

    updateDirection(dx, dy) {

        if (
            Math.abs(dx) >
            Math.abs(dy)
        ) {

            this.direction =
                dx > 0
                    ? "right"
                    : "left";

        } else if (dy !== 0) {

            this.direction =
                dy > 0
                    ? "down"
                    : "up";

        }

    }


    // =================================================
    // RECEBER DANO
    // =================================================

    takeDamage(amount) {

        if (
            this.invulnerabilityTimer > 0 ||
            this.health <= 0
        ) {

            return 0;

        }

        let damage = Math.max(

            1,

            Math.round(amount)

        );

        const armor =
            this.character.equipment.getArmor();

        damage = Math.max(

            1,

            damage - armor

        );

        if (
            this.blocking &&
            this.stamina > 0
        ) {

            damage = Math.max(

                1,

                Math.ceil(damage * 0.35)

            );

            this.stamina = Math.max(

                0,

                this.stamina - 8

            );

        }

        this.health = Math.max(

            0,

            this.health - damage

        );

        this.invulnerabilityTimer = 0.45;

        this.syncCharacter();

        return damage;

    }


    // =================================================
    // RECUPERAR VIDA
    // =================================================

    heal(amount) {

        const previous =
            this.health;

        this.health = Math.min(

            this.maxHealth,

            this.health + Math.max(0, amount)

        );

        this.syncCharacter();

        return this.health > previous;

    }


    // =================================================
    // RECUPERAR RESISTÊNCIA
    // =================================================

    recoverStamina(amount) {

        this.stamina = Math.min(

            this.maxStamina,

            this.stamina + Math.max(0, amount)

        );

        this.syncCharacter();

    }


    // =================================================
    // SINCRONIZAR FICHA RPG
    // =================================================

    syncCharacter() {

        this.character.health =
            this.health;

        this.character.stamina =
            this.stamina;

        this.character.mana =
            this.mana;

    }


    // =================================================
    // ATUALIZAR TEMPORIZADORES
    // =================================================

    updateTimers(dt) {

        this.attackCooldown = Math.max(

            0,

            this.attackCooldown - dt

        );

        this.attackTimer = Math.max(

            0,

            this.attackTimer - dt

        );

        this.invulnerabilityTimer = Math.max(

            0,

            this.invulnerabilityTimer - dt

        );

        if (
            this.attackTimer <= 0
        ) {

            this.attacking = false;

        }

    }


    // =================================================
    // MOVIMENTAR
    // =================================================

    move(dx, dy, world) {

        if (
            this.health <= 0
        ) {

            return;

        }

        const result =
            world.moveRect(

                this.getBounds(),

                dx,

                dy

            );

        this.moving =

            result.x !== this.x ||

            result.y !== this.y;

        this.x = result.x;

        this.y = result.y;

        if (this.moving) {

            this.animationTime += 1 / 60;

        }

    }


    // =================================================
    // DESENHAR PERSONAGEM
    // =================================================

    draw(ctx) {

        if (
            this.health <= 0
        ) {

            return;

        }

        const x =
            Math.round(this.x);

        const y =
            Math.round(this.y);

        ctx.save();

        // -----------------------------------------
        // SOMBRA
        // -----------------------------------------

        ctx.fillStyle =
            "rgba(0,0,0,0.30)";

        ctx.fillRect(

            x + 3,

            y + 21,

            11,

            3

        );

        // -----------------------------------------
        // BOTAS
        // -----------------------------------------

        ctx.fillStyle = "#60452c";

        const step =
            this.moving
                ? Math.floor(
                    this.animationTime * 10
                ) % 2
                : 0;

        ctx.fillRect(

            x + 4,

            y + 18 + step,

            4,

            5

        );

        ctx.fillRect(

            x + 10,

            y + 18 + (1 - step),

            4,

            5

        );

        // -----------------------------------------
        // CORPO
        // -----------------------------------------

        ctx.fillStyle = "#2e7543";

        ctx.fillRect(

            x + 3,

            y + 9,

            12,

            11

        );

        ctx.fillStyle = "#65ae62";

        ctx.fillRect(

            x + 5,

            y + 10,

            6,

            8

        );

        // -----------------------------------------
        // CINTO
        // -----------------------------------------

        ctx.fillStyle = "#775333";

        ctx.fillRect(

            x + 3,

            y + 16,

            12,

            2

        );

        // -----------------------------------------
        // CABEÇA
        // -----------------------------------------

        ctx.fillStyle = "#ebbd8b";

        ctx.fillRect(

            x + 4,

            y + 3,

            10,

            9

        );

        // -----------------------------------------
        // CABELO
        // -----------------------------------------

        ctx.fillStyle = "#95643b";

        ctx.fillRect(

            x + 4,

            y + 3,

            10,

            2

        );

        // -----------------------------------------
        // OLHOS
        // -----------------------------------------

        if (
            this.direction !== "up"
        ) {

            ctx.fillStyle = "#29231f";

            ctx.fillRect(

                x + 6,

                y + 7,

                1,

                1

            );

            ctx.fillRect(

                x + 11,

                y + 7,

                1,

                1

            );

        }

        // -----------------------------------------
        // CHAPÉU
        // -----------------------------------------

        ctx.fillStyle = "#287444";

        ctx.fillRect(

            x + 3,

            y + 1,

            12,

            4

        );

        ctx.fillRect(

            x + 7,

            y - 2,

            6,

            4

        );

        // -----------------------------------------
        // ESCUDO
        // -----------------------------------------

        if (this.blocking) {

            ctx.fillStyle = "#758b9a";

            ctx.fillRect(

                x - 4,

                y + 10,

                6,

                11

            );

        }

        // -----------------------------------------
        // ATAQUE
        // -----------------------------------------

        if (this.attacking) {

            ctx.fillStyle = "#d5e0e7";

            const direction = {

                up: [7, -12, 3, 14],

                down: [7, 21, 3, 14],

                left: [-14, 11, 15, 3],

                right: [16, 11, 15, 3]

            }[this.direction];

            if (direction) {

                ctx.fillRect(

                    x + direction[0],

                    y + direction[1],

                    direction[2],

                    direction[3]

                );

            }

        }

        ctx.restore();

    }

}


// =====================================================
// CLASSE PRINCIPAL DA ENGINE
// =====================================================

export class Game {

    constructor(canvas) {

        if (!canvas) {

            throw new Error(
                "Canvas do jogo não encontrado."
            );

        }

        this.canvas = canvas;

        this.ctx =
            canvas.getContext("2d");

        if (!this.ctx) {

            throw new Error(
                "Canvas 2D indisponível."
            );

        }

        this.canvas.width =
            GAME_CONFIG.WIDTH;

        this.canvas.height =
            GAME_CONFIG.HEIGHT;

        this.ctx.imageSmoothingEnabled =
            false;

        // -----------------------------------------
        // ESTADO
        // -----------------------------------------

        this.running = false;

        this.started = false;

        this.paused = false;

        this.menu = "TITLE";

        this.activeTab = "CHARACTER";

        this.selectedClass = 0;

        this.lastTime = 0;

        this.accumulator = 0;

        this.frameDuration =
            1 / GAME_CONFIG.FPS;

        this.keys = new Set();

        this.pressedKeys = new Set();

        this.world = null;

        this.entities = null;

        this.character = null;

        this.player = null;

        this.message = "";

        this.messageTimer = 0;

        this.selectedInventoryIndex = 0;

        this.setupInput();

    }


    // =================================================
    // CONFIGURAR TECLADO
    // =================================================

    setupInput() {

        window.addEventListener(

            "keydown",

            event => {

                const key =
                    event.key.toLowerCase();

                if ([

                    "arrowup",

                    "arrowdown",

                    "arrowleft",

                    "arrowright",

                    " ",

                    "tab"

                ].includes(key)) {

                    event.preventDefault();

                }

                if (
                    !this.keys.has(key)
                ) {

                    this.pressedKeys.add(key);

                }

                this.keys.add(key);

            }

        );

        window.addEventListener(

            "keyup",

            event => {

                const key =
                    event.key.toLowerCase();

                this.keys.delete(key);

            }

        );

        window.addEventListener(

            "blur",

            () => {

                this.keys.clear();

                this.pressedKeys.clear();

            }

        );

    }


    // =================================================
    // VERIFICAR TECLA PRESSIONADA
    // =================================================

    isDown(key) {

        return this.keys.has(key);

    }


    // =================================================
    // VERIFICAR PRESSIONAMENTO ÚNICO
    // =================================================

    wasPressed(key) {

        if (
            !this.pressedKeys.has(key)
        ) {

            return false;

        }

        this.pressedKeys.delete(key);

        return true;

    }


    // =================================================
    // EXIBIR MENSAGEM
    // =================================================

    showMessage(text, duration = 3) {

        this.message = text;

        this.messageTimer = duration;

    }


    // =================================================
    // CRIAR FICHA DO PERSONAGEM
    // =================================================

    createCharacter(classId) {

        const attributes =
            new AttributeSet(

                STARTING_ATTRIBUTES[classId] ||

                STARTING_ATTRIBUTES.warrior

            );

        const characterClass =
            new CharacterClass(classId);

        const inventory =
            new Inventory({

                slots: 40,

                gold: 30

            });

        const equipment =
            new Equipment();

        const skills =
            new SkillBook();

        const progression =
            new Progression();

        const crafting =
            new CraftingSystem();

        const maxHealth =
            attributes.calculateMaxHealth(

                80 +
                characterClass.definition.hitDie

            );

        const maxMana =
            attributes.calculateMaxMana(20);

        const maxStamina =
            attributes.calculateStamina(80);

        return {

            name: "Viajante",

            attributes,

            characterClass,

            inventory,

            equipment,

            skills,

            progression,

            crafting,

            maxHealth,

            health: maxHealth,

            maxMana,

            mana: maxMana,

            maxStamina,

            stamina: maxStamina

        };

    }


    // =================================================
    // INICIAR NOVO JOGO
    // =================================================

    newGame(classId = "warrior") {

        // -----------------------------------------
        // MUNDO
        // -----------------------------------------

        this.world = new World();

        this.world.initializeWorldSystems();

        // -----------------------------------------
        // FICHA RPG
        // -----------------------------------------

        this.character =
            this.createCharacter(classId);

        // -----------------------------------------
        // ITENS INICIAIS
        // -----------------------------------------

        this.character.inventory.addItem(

            "traveler_sword",

            1

        );

        this.character.inventory.addItem(

            "leather_armor",

            1

        );

        this.character.inventory.addItem(

            "health_potion",

            3

        );

        // -----------------------------------------
        // PERSONAGEM
        // -----------------------------------------

        const spawn =
            this.world.findSpawn();

        this.player =
            new GamePlayer(

                spawn.x,

                spawn.y,

                this.character

            );

        // -----------------------------------------
        // ENTIDADES
        // -----------------------------------------

        this.entities =
            new EntityManager(this.world);

        this.entities.spawnInitialPopulation(
            this.player
        );

        // -----------------------------------------
        // CÂMERA
        // -----------------------------------------

        this.world.snapCamera(

            this.player.centerX,

            this.player.centerY,

            GAME_CONFIG.WIDTH,

            GAME_CONFIG.HEIGHT

        );

        // -----------------------------------------
        // ESTADO
        // -----------------------------------------

        this.started = true;

        this.paused = false;

        this.menu = "GAME";

        this.showMessage(

            "Bem-vindo ao mundo, " +
            this.character.characterClass.name +
            "!"

        );

    }


    // =================================================
    // ATUALIZAR MOVIMENTAÇÃO
    // =================================================

    updateMovement(dt) {

        let dx = 0;

        let dy = 0;

        if (
            this.isDown("w") ||
            this.isDown("arrowup")
        ) {

            dy--;

        }

        if (
            this.isDown("s") ||
            this.isDown("arrowdown")
        ) {

            dy++;

        }

        if (
            this.isDown("a") ||
            this.isDown("arrowleft")
        ) {

            dx--;

        }

        if (
            this.isDown("d") ||
            this.isDown("arrowright")
        ) {

            dx++;

        }

        const direction =
            normalizeGameVector(dx, dy);

        dx = direction.x;

        dy = direction.y;

        if (
            dx !== 0 ||
            dy !== 0
        ) {

            this.player.updateDirection(
                dx,
                dy
            );

        }

        const sprinting =

            this.isDown("shift") &&

            this.player.stamina > 0 &&

            (
                dx !== 0 ||
                dy !== 0
            );

        this.player.running = sprinting;

        let speed =
            GAME_CONFIG.WALK_SPEED;

        if (sprinting) {

            speed =
                GAME_CONFIG.RUN_SPEED;

            this.player.stamina = Math.max(

                0,

                this.player.stamina -
                    12 * dt

            );

        }

        if (this.player.blocking) {

            speed *= 0.55;

        }

        this.player.move(

            dx * speed * dt,

            dy * speed * dt,

            this.world

        );

        if (
            !sprinting &&
            !this.player.blocking
        ) {

            this.player.stamina = Math.min(

                this.player.maxStamina,

                this.player.stamina + 14 * dt

            );

        }

        this.player.syncCharacter();

    }


    // =================================================
    // ATACAR
    // =================================================

    attack() {

        const player =
            this.player;

        if (
            player.health <= 0 ||
            player.attackCooldown > 0 ||
            player.blocking
        ) {

            return;

        }

        const weapon =
            this.character.equipment
                .slots.main_hand;

        const weaponDamage =
            weapon?.damage || 5;

        const strength =
            this.character.attributes
                .getStrengthModifier();

        const damage = Math.max(

            1,

            weaponDamage + strength

        );

        const range =
            weapon?.range || 32;

        this.entities.playerAttack(

            player,

            damage,

            range

        );

        player.attacking = true;

        player.attackTimer = 0.2;

        player.attackCooldown = 0.35;

        player.stamina = Math.max(

            0,

            player.stamina - 6

        );

        player.syncCharacter();

    }


    // =================================================
    // INTERAGIR COM O MUNDO
    // =================================================

    interact() {

        // -----------------------------------------
        // NPCS E COMERCIANTES
        // -----------------------------------------

        if (
            this.entities.interact(
                this.player
            )
        ) {

            return;

        }

        // -----------------------------------------
        // BAÚS E MONUMENTOS
        // -----------------------------------------

        const result =
            this.world.interact(

                this.player,

                this.character.inventory

            );

        if (
            result &&
            result.success
        ) {

            this.showMessage(

                result.reason === "OPENED"
                    ? "Baú aberto!"
                    : "Local descoberto!"

            );

        }

    }


    // =================================================
    // COMPRAR ITEM
    // =================================================

    buySelectedProduct() {

        const shop =
            this.entities.activeShop;

        if (!shop) {

            return;

        }

        const catalog =
            shop.getCatalog();

        const product =
            catalog[
                this.entities.shopSelection
            ];

        if (!product) {

            return;

        }

        const inventory =
            this.character.inventory;

        if (
            product.quantity <= 0
        ) {

            this.showMessage(
                "Produto esgotado."
            );

            return;

        }

        if (
            inventory.gold < product.price
        ) {

            this.showMessage(
                "Moedas insuficientes."
            );

            return;

        }

        const added =
            inventory.addItem({

                ...product,

                quantity: 1

            });

        if (!added) {

            this.showMessage(
                "Inventário cheio."
            );

            return;

        }

        inventory.gold -=
            product.price;

        const stockEntry =
            shop.stock.find(

                entry => {

                    return catalog.some(

                        item =>
                            item.id === product.id &&
                            item.product === entry.product

                    );

                }

            );

        // Localizar o produto pelo catálogo original.

        const shopProduct =
            shop.stock.find(

                entry => {

                    const original =
                        shop.getCatalog().find(

                            item =>
                                item.id === product.id

                        );

                    return original &&
                        entry.product ===
                        original.product;

                }

            );

        if (shopProduct) {

            shopProduct.quantity--;

        } else {

            const entry =
                shop.stock[
                    this.entities.shopSelection
                ];

            if (entry) {

                entry.quantity--;

            }

        }

        this.showMessage(

            "Comprado: " +
            product.name

        );

    }


    // =================================================
    // CONTROLAR INTERFACES
    // =================================================

    updateMenus() {

        // -----------------------------------------
        // LOJA
        // -----------------------------------------

        if (
            this.entities.activeShop
        ) {

            const shop =
                this.entities.activeShop;

            const catalog =
                shop.getCatalog();

            if (
                this.wasPressed("escape") ||
                this.wasPressed("f")
            ) {

                this.entities.closeShop();

                return;

            }

            if (
                this.wasPressed("arrowdown")
            ) {

                this.entities.shopSelection =

                    Math.min(

                        catalog.length - 1,

                        this.entities.shopSelection + 1

                    );

            }

            if (
                this.wasPressed("arrowup")
            ) {

                this.entities.shopSelection =

                    Math.max(

                        0,

                        this.entities.shopSelection - 1

                    );

            }

            if (
                this.wasPressed("enter")
            ) {

                this.buySelectedProduct();

            }

            return;

        }

        // -----------------------------------------
        // DIÁLOGO
        // -----------------------------------------

        if (
            this.entities.activeDialogue
        ) {

            if (

                this.wasPressed("f") ||

                this.wasPressed("enter") ||

                this.wasPressed("escape")

            ) {

                this.entities.closeDialogue();

            }

            return;

        }

        // -----------------------------------------
        // INVENTÁRIO
        // -----------------------------------------

        if (
            this.menu === "INVENTORY"
        ) {

            if (

                this.wasPressed("escape") ||

                this.wasPressed("i")

            ) {

                this.menu = "GAME";

                return;

            }

            if (
                this.wasPressed("arrowdown")
            ) {

                this.selectedInventoryIndex++;

            }

            if (
                this.wasPressed("arrowup")
            ) {

                this.selectedInventoryIndex--;

            }

            const items =
                this.character.inventory.items;

            this.selectedInventoryIndex =
                clampGame(

                    this.selectedInventoryIndex,

                    0,

                    Math.max(
                        0,
                        items.length - 1
                    )

                );

            if (
                this.wasPressed("enter")
            ) {

                this.useSelectedItem();

            }

            return;

        }

        // -----------------------------------------
        // MAPA
        // -----------------------------------------

        if (
            this.menu === "MAP"
        ) {

            if (

                this.wasPressed("m") ||

                this.wasPressed("escape")

            ) {

                this.menu = "GAME";

                this.world.setMapOpen(false);

            }

            return;

        }

        // -----------------------------------------
        // FICHA DO PERSONAGEM
        // -----------------------------------------

        if (
            this.menu === "CHARACTER"
        ) {

            if (

                this.wasPressed("c") ||

                this.wasPressed("escape")

            ) {

                this.menu = "GAME";

            }

            return;

        }

        // -----------------------------------------
        // EQUIPAMENTOS
        // -----------------------------------------

        if (
            this.menu === "EQUIPMENT"
        ) {

            if (

                this.wasPressed("e") ||

                this.wasPressed("escape")

            ) {

                this.menu = "GAME";

            }

            return;

        }

        // -----------------------------------------
        // HABILIDADES
        // -----------------------------------------

        if (
            this.menu === "SKILLS"
        ) {

            if (

                this.wasPressed("k") ||

                this.wasPressed("escape")

            ) {

                this.menu = "GAME";

            }

            return;

        }

        // -----------------------------------------
        // ABRIR MENUS
        // -----------------------------------------

        if (
            this.wasPressed("i")
        ) {

            this.menu = "INVENTORY";

        } else if (
            this.wasPressed("c")
        ) {

            this.menu = "CHARACTER";

        } else if (
            this.wasPressed("e")
        ) {

            this.menu = "EQUIPMENT";

        } else if (
            this.wasPressed("k")
        ) {

            this.menu = "SKILLS";

        } else if (
            this.wasPressed("m")
        ) {

            this.menu = "MAP";

            this.world.setMapOpen(true);

        }

    }


    // =================================================
    // UTILIZAR ITEM SELECIONADO
    // =================================================

    useSelectedItem() {

        const inventory =
            this.character.inventory;

        const item =
            inventory.items[
                this.selectedInventoryIndex
            ];

        if (!item) {

            return;

        }

        if (
            item.type === "consumable" ||
            item.type === "food" ||
            item.type === "potion"
        ) {

            let used = false;

            if (
                item.heal > 0 &&
                this.player.health <
                    this.player.maxHealth
            ) {

                this.player.heal(
                    item.heal
                );

                used = true;

            }

            if (
                item.mana > 0 &&
                this.player.mana <
                    this.player.maxMana
            ) {

                this.player.mana = Math.min(

                    this.player.maxMana,

                    this.player.mana + item.mana

                );

                used = true;

            }

            if (
                item.stamina > 0 &&
                this.player.stamina <
                    this.player.maxStamina
            ) {

                this.player.recoverStamina(
                    item.stamina
                );

                used = true;

            }

            if (used) {

                inventory.removeItem(

                    item.instanceId,

                    1

                );

                this.player.syncCharacter();

                this.showMessage(

                    "Item utilizado: " +
                    item.name

                );

            }

            return;

        }

        if (
            item.slot
        ) {

            const result =
                this.character.equipment.equip(

                    item,

                    this.character.characterClass

                );

            if (result.success) {

                inventory.removeItem(

                    item.instanceId,

                    1

                );

                if (result.previous) {

                    inventory.addItem(
                        result.previous
                    );

                }

                this.showMessage(

                    "Equipado: " +
                    item.name

                );

            } else {

                this.showMessage(

                    "Não possui proficiência."

                );

            }

        }

    }


    // =================================================
    // ATUALIZAÇÃO PRINCIPAL
    // =================================================

    update(dt) {

        if (
            !this.started
        ) {

            return;

        }

        dt = Math.min(

            dt,

            GAME_CONFIG.MAX_DELTA_TIME

        );

        // -----------------------------------------
        // TEMPORIZADORES
        // -----------------------------------------

        this.player.updateTimers(dt);

        this.character.skills.update(dt);

        this.messageTimer = Math.max(

            0,

            this.messageTimer - dt

        );

        // -----------------------------------------
        // MENUS
        // -----------------------------------------

        this.updateMenus();

        if (
            this.menu !== "GAME" ||
            this.entities.isInteracting()
        ) {

            return;

        }

        // -----------------------------------------
        // PERSONAGEM DERROTADO
        // -----------------------------------------

        if (
            this.player.health <= 0
        ) {

            return;

        }

        // -----------------------------------------
        // ESCUDO
        // -----------------------------------------

        this.player.blocking =

            this.isDown("l") &&

            this.player.stamina > 0;

        // -----------------------------------------
        // MOVIMENTAÇÃO
        // -----------------------------------------

        this.updateMovement(dt);

        // -----------------------------------------
        // ATAQUE
        // -----------------------------------------

        if (
            this.wasPressed("j")
        ) {

            this.attack();

        }

        // -----------------------------------------
        // INTERAÇÃO
        // -----------------------------------------

        if (
            this.wasPressed("f")
        ) {

            this.interact();

        }

        // -----------------------------------------
        // SALVAMENTO
        // -----------------------------------------

        if (
            this.wasPressed("p")
        ) {

            this.saveGame();

        }

        // -----------------------------------------
        // ENTIDADES
        // -----------------------------------------

        this.entities.update(

            dt,

            this.player,

            this.world

        );

        // -----------------------------------------
        // SISTEMAS DO MUNDO
        // -----------------------------------------

        this.world.updateSystems(

            dt,

            this.player

        );

        // -----------------------------------------
        // CÂMERA
        // -----------------------------------------

        this.world.updateCamera(

            this.player,

            GAME_CONFIG.WIDTH,

            GAME_CONFIG.HEIGHT

        );

    }


    // =================================================
    // DESENHAR BARRAS DO PERSONAGEM
    // =================================================

    drawHUD() {

        const ctx = this.ctx;

        const player =
            this.player;

        ctx.fillStyle =
            "rgba(18,30,23,0.9)";

        ctx.fillRect(

            4,

            4,

            110,

            43

        );

        ctx.strokeStyle = "#ddc47f";

        ctx.strokeRect(

            4,

            4,

            110,

            43

        );

        ctx.font = "7px monospace";

        ctx.fillStyle = "#ffffff";

        ctx.fillText(

            this.character.characterClass.name,

            10,

            13

        );

        // -----------------------------------------
        // VIDA
        // -----------------------------------------

        ctx.fillStyle = "#392526";

        ctx.fillRect(

            10,

            18,

            95,

            6

        );

        ctx.fillStyle = "#d44a49";

        ctx.fillRect(

            10,

            18,

            95 *
                player.health /
                player.maxHealth,

            6

        );

        // -----------------------------------------
        // STAMINA
        // -----------------------------------------

        ctx.fillStyle = "#27352c";

        ctx.fillRect(

            10,

            28,

            95,

            5

        );

        ctx.fillStyle = "#62c86b";

        ctx.fillRect(

            10,

            28,

            95 *
                player.stamina /
                player.maxStamina,

            5

        );

        // -----------------------------------------
        // MANA
        // -----------------------------------------

        ctx.fillStyle = "#252e43";

        ctx.fillRect(

            10,

            38,

            95,

            5

        );

        ctx.fillStyle = "#6188de";

        ctx.fillRect(

            10,

            38,

            95 *
                player.mana /
                Math.max(1, player.maxMana),

            5

        );

        // -----------------------------------------
        // MOEDAS
        // -----------------------------------------

        ctx.fillStyle = "#f2d883";

        ctx.fillText(

            "MOEDAS: " +
            this.character.inventory.gold,

            230,

            14

        );

    }


    // =================================================
    // DESENHAR PAINEL RPG
    // =================================================

    drawRPGMenu() {

        if (
            this.menu === "GAME" ||
            this.menu === "MAP"
        ) {

            return;

        }

        const ctx =
            this.ctx;

        ctx.fillStyle =
            "rgba(12,19,17,0.96)";

        ctx.fillRect(

            10,

            10,

            300,

            160

        );

        ctx.strokeStyle = "#d7bb77";

        ctx.strokeRect(

            10,

            10,

            300,

            160

        );

        ctx.fillStyle = "#f2dfad";

        ctx.font = "9px monospace";

        ctx.fillText(

            this.menu,

            22,

            26

        );

        ctx.font = "7px monospace";

        // -----------------------------------------
        // INVENTÁRIO
        // -----------------------------------------

        if (
            this.menu === "INVENTORY"
        ) {

            const items =
                this.character.inventory.items;

            for (
                let i = 0;
                i < Math.min(9, items.length);
                i++
            ) {

                const item =
                    items[i];

                if (
                    i === this.selectedInventoryIndex
                ) {

                    ctx.fillStyle = "#765932";

                    ctx.fillRect(

                        19,

                        34 + i * 13,

                        280,

                        12

                    );

                }

                ctx.fillStyle = "#ffffff";

                ctx.fillText(

                    item.name +
                    " x" +
                    item.quantity,

                    25,

                    43 + i * 13

                );

            }

            ctx.fillStyle = "#e2c47d";

            ctx.fillText(

                "ENTER usar/equipar | ESC fechar",

                22,

                160

            );

        }

        // -----------------------------------------
        // FICHA
        // -----------------------------------------

        if (
            this.menu === "CHARACTER"
        ) {

            const character =
                this.character;

            const attributes =
                character.attributes.values;

            ctx.fillStyle = "#ffffff";

            ctx.fillText(

                "Classe: " +
                character.characterClass.name,

                23,

                42

            );

            ctx.fillText(

                "Nivel: " +
                character.progression.level,

                23,

                53

            );

            let index = 0;

            for (
                const [name, value] of
                Object.entries(attributes)
            ) {

                ctx.fillText(

                    name + ": " + value,

                    23,

                    68 + index * 12

                );

                index++;

            }

        }

        // -----------------------------------------
        // EQUIPAMENTOS
        // -----------------------------------------

        if (
            this.menu === "EQUIPMENT"
        ) {

            let index = 0;

            for (
                const [slot, item] of
                Object.entries(
                    this.character.equipment.slots
                )
            ) {

                ctx.fillStyle = "#ffffff";

                ctx.fillText(

                    slot + ": " +
                    (item?.name || "Vazio"),

                    23,

                    40 + index * 11

                );

                index++;

            }

        }

        // -----------------------------------------
        // HABILIDADES
        // -----------------------------------------

        if (
            this.menu === "SKILLS"
        ) {

            const learned =
                [...this.character.skills.learned];

            ctx.fillStyle = "#ffffff";

            if (
                learned.length === 0
            ) {

                ctx.fillText(

                    "Nenhuma habilidade aprendida.",

                    23,

                    43

                );

            }

            learned.forEach(

                (skill, index) => {

                    ctx.fillText(

                        skill,

                        23,

                        43 + index * 12

                    );

                }

            );

        }

    }


    // =================================================
    // DESENHAR LOJA COM MOEDAS DO RPG
    // =================================================

    drawShopUI() {

        const shop =
            this.entities.activeShop;

        if (!shop) {

            return;

        }

        const ctx = this.ctx;

        const catalog =
            shop.getCatalog();

        ctx.fillStyle =
            "rgba(20,29,23,0.97)";

        ctx.fillRect(

            30,

            17,

            260,

            146

        );

        ctx.strokeStyle = "#d8bd75";

        ctx.strokeRect(

            30,

            17,

            260,

            146

        );

        ctx.font = "8px monospace";

        ctx.fillStyle = "#f4de9e";

        ctx.fillText(

            shop.shopName,

            40,

            31

        );

        ctx.fillText(

            "Moedas: " +
            this.character.inventory.gold,

            40,

            44

        );

        ctx.font = "7px monospace";

        for (
            let i = 0;
            i < catalog.length;
            i++
        ) {

            const item =
                catalog[i];

            const y =
                57 + i * 13;

            if (
                i === this.entities.shopSelection
            ) {

                ctx.fillStyle = "#735730";

                ctx.fillRect(

                    39,

                    y - 9,

                    242,

                    12

                );

            }

            ctx.fillStyle = "#ffffff";

            ctx.fillText(

                item.name,

                45,

                y

            );

            ctx.fillText(

                item.price + " M",

                225,

                y

            );

        }

        ctx.fillStyle = "#f4de9e";

        ctx.fillText(

            "SETAS selecionar | ENTER comprar",

            40,

            145

        );

        ctx.fillText(

            "F fechar",

            40,

            155

        );

    }


    // =================================================
    // RENDERIZAÇÃO PRINCIPAL
    // =================================================

    render() {

        const ctx =
            this.ctx;

        ctx.clearRect(

            0,

            0,

            GAME_CONFIG.WIDTH,

            GAME_CONFIG.HEIGHT

        );

        // -----------------------------------------
        // TELA INICIAL
        // -----------------------------------------

        if (!this.started) {

            this.drawTitle();

            return;

        }

        // -----------------------------------------
        // MUNDO E PERSONAGEM
        // -----------------------------------------

        this.world.draw(

            ctx,

            GAME_CONFIG.WIDTH,

            GAME_CONFIG.HEIGHT,

            this.player

        );

        // -----------------------------------------
        // ENTIDADES
        // -----------------------------------------

        ctx.save();

        ctx.translate(

            -Math.round(this.world.cameraX),

            -Math.round(this.world.cameraY)

        );

        this.entities.draw(

            ctx,

            this.world.cameraX,

            this.world.cameraY,

            GAME_CONFIG.WIDTH,

            GAME_CONFIG.HEIGHT

        );

        ctx.restore();

        // -----------------------------------------
        // AMBIENTE
        // -----------------------------------------

        this.world.drawEnvironment(

            ctx,

            GAME_CONFIG.WIDTH,

            GAME_CONFIG.HEIGHT

        );

        // -----------------------------------------
        // HUD
        // -----------------------------------------

        this.drawHUD();

        // -----------------------------------------
        // MINIMAPA E EXPLORAÇÃO
        // -----------------------------------------

        this.world.drawExplorationUI(

            ctx,

            GAME_CONFIG.WIDTH,

            GAME_CONFIG.HEIGHT

        );

        // -----------------------------------------
        // VIDA DOS CHEFES
        // -----------------------------------------

        this.entities.drawBossHUD(

            ctx,

            GAME_CONFIG.WIDTH

        );

        // -----------------------------------------
        // NOTIFICAÇÕES
        // -----------------------------------------

        this.world.drawNotifications(

            ctx,

            GAME_CONFIG.WIDTH,

            GAME_CONFIG.HEIGHT

        );

        // -----------------------------------------
        // DIÁLOGOS
        // -----------------------------------------

        this.entities.drawDialogue(

            ctx,

            GAME_CONFIG.WIDTH,

            GAME_CONFIG.HEIGHT

        );

        // -----------------------------------------
        // LOJA
        // -----------------------------------------

        this.drawShopUI();

        // -----------------------------------------
        // MENUS
        // -----------------------------------------

        this.drawRPGMenu();

        // -----------------------------------------
        // MENSAGEM
        // -----------------------------------------

        if (
            this.messageTimer > 0
        ) {

            ctx.fillStyle = "#ffffff";

            ctx.font = "7px monospace";

            ctx.fillText(

                this.message,

                85,

                52

            );

        }

        // -----------------------------------------
        // GAME OVER
        // -----------------------------------------

        if (
            this.player.health <= 0
        ) {

            ctx.fillStyle =
                "rgba(0,0,0,0.85)";

            ctx.fillRect(

                0,

                0,

                320,

                180

            );

            ctx.fillStyle = "#e75c53";

            ctx.font = "15px monospace";

            ctx.fillText(

                "GAME OVER",

                111,

                90

            );

        }

    }


    // =================================================
    // TELA DE SELEÇÃO DE CLASSES
    // =================================================

    drawTitle() {

        const ctx = this.ctx;

        ctx.fillStyle = "#14251b";

        ctx.fillRect(

            0,

            0,

            320,

            180

        );

        ctx.fillStyle = "#e5cb87";

        ctx.font = "14px monospace";

        ctx.fillText(

            "ZELDA PIXEL ADVENTURE",

            59,

            30

        );

        ctx.font = "8px monospace";

        ctx.fillText(

            "ESCOLHA SUA CLASSE",

            102,

            51

        );

        STARTING_CLASSES.forEach(

            (classId, index) => {

                const y =
                    68 + index * 13;

                if (
                    index === this.selectedClass
                ) {

                    ctx.fillStyle = "#756036";

                    ctx.fillRect(

                        80,

                        y - 9,

                        160,

                        12

                    );

                }

                ctx.fillStyle = "#ffffff";

                ctx.fillText(

                    (index + 1) +
                    " - " +
                    classId.toUpperCase(),

                    100,

                    y

                );

            }

        );

        ctx.fillStyle = "#e5cb87";

        ctx.fillText(

            "ENTER PARA INICIAR",

            102,

            162

        );

    }


    // =================================================
    // PROCESSAR TELA INICIAL
    // =================================================

    updateTitle() {

        if (
            this.wasPressed("arrowdown")
        ) {

            this.selectedClass =

                (
                    this.selectedClass + 1
                ) % STARTING_CLASSES.length;

        }

        if (
            this.wasPressed("arrowup")
        ) {

            this.selectedClass =

                (
                    this.selectedClass - 1 +
                    STARTING_CLASSES.length
                ) % STARTING_CLASSES.length;

        }

        if (
            this.wasPressed("enter")
        ) {

            this.newGame(

                STARTING_CLASSES[
                    this.selectedClass
                ]

            );

        }

    }


    // =================================================
    // SALVAMENTO
    // =================================================

    saveGame() {

        if (!this.started) {

            return false;

        }

        const state = {

            version: 1,

            classId:
                this.character.characterClass.id,

            player: {

                x: this.player.x,

                y: this.player.y,

                health: this.player.health,

                stamina: this.player.stamina,

                mana: this.player.mana

            },

            attributes:
                this.character.attributes.serialize(),

            progression: {

                level:
                    this.character.progression.level,

                experience:
                    this.character.progression.experience

            },

            inventory: {

                gold:
                    this.character.inventory.gold,

                items:
                    this.character.inventory.items

            },

            equipment:
                this.character.equipment.slots,

            world:
                this.world.exportState(),

            entities:
                this.entities.exportState()

        };

        try {

            localStorage.setItem(

                GAME_CONFIG.STORAGE_KEY,

                JSON.stringify(state)

            );

            this.showMessage(
                "Jogo salvo!"
            );

            return true;

        } catch (error) {

            console.error(error);

            this.showMessage(
                "Erro ao salvar."
            );

            return false;

        }

    }


    // =================================================
    // CARREGAR JOGO
    // =================================================

    loadGame() {

        let state;

        try {

            const raw =
                localStorage.getItem(

                    GAME_CONFIG.STORAGE_KEY

                );

            if (!raw) {

                return false;

            }

            state =
                JSON.parse(raw);

        } catch (error) {

            console.error(error);

            return false;

        }

        if (
            !state ||
            state.version !== 1 ||
            !STARTING_CLASSES.includes(
                state.classId
            )
        ) {

            return false;

        }

        // -----------------------------------------
        // CRIAR ESTRUTURA DO JOGO
        // -----------------------------------------

        this.newGame(
            state.classId
        );

        // -----------------------------------------
        // ATRIBUTOS
        // -----------------------------------------

        this.character.attributes.deserialize(

            state.attributes

        );

        // -----------------------------------------
        // PROGRESSÃO
        // -----------------------------------------

        if (
            state.progression
        ) {

            this.character.progression.level =
                state.progression.level || 1;

            this.character.progression.experience =
                state.progression.experience || 0;

        }

        // -----------------------------------------
        // INVENTÁRIO
        // -----------------------------------------

        if (
            state.inventory
        ) {

            this.character.inventory.gold =
                state.inventory.gold || 0;

            this.character.inventory.items =
                Array.isArray(state.inventory.items)
                    ? state.inventory.items
                    : [];

        }

        // -----------------------------------------
        // EQUIPAMENTOS
        // -----------------------------------------

        if (
            state.equipment
        ) {

            Object.assign(

                this.character.equipment.slots,

                state.equipment

            );

        }

        // -----------------------------------------
        // JOGADOR
        // -----------------------------------------

        if (
            state.player
        ) {

            this.player.x =
                state.player.x;

            this.player.y =
                state.player.y;

            this.player.health =
                state.player.health;

            this.player.stamina =
                state.player.stamina;

            this.player.mana =
                state.player.mana;

            this.player.syncCharacter();

        }

        // -----------------------------------------
        // MUNDO
        // -----------------------------------------

        if (
            state.world
        ) {

            this.world.importState(
                state.world
            );

        }

        // -----------------------------------------
        // ENTIDADES
        // -----------------------------------------

        if (
            state.entities
        ) {

            this.entities.importState(
                state.entities
            );

        }

        // -----------------------------------------
        // POSIÇÃO SEGURA
        // -----------------------------------------

        this.world.placePlayerSafely(

            this.player,

            this.player.x,

            this.player.y

        );

        this.showMessage(
            "Progresso carregado!"
        );

        return true;

    }


    // =================================================
    // LOOP PRINCIPAL
    // =================================================

    loop(timestamp) {

        if (!this.running) {

            return;

        }

        if (!this.lastTime) {

            this.lastTime = timestamp;

        }

        const elapsed =

            Math.min(

                (timestamp - this.lastTime) / 1000,

                0.25

            );

        this.lastTime = timestamp;

        this.accumulator += elapsed;

        const step =
            this.frameDuration;

        // -----------------------------------------
        // ATUALIZAÇÃO FIXA
        // -----------------------------------------

        while (
            this.accumulator >= step
        ) {

            if (!this.started) {

                this.updateTitle();

            } else {

                this.update(step);

            }

            this.accumulator -= step;

        }

        this.pressedKeys.clear();

        // -----------------------------------------
        // RENDERIZAÇÃO
        // -----------------------------------------

        this.render();

        requestAnimationFrame(

            time => this.loop(time)

        );

    }


    // =================================================
    // INICIAR ENGINE
    // =================================================

    start() {

        if (this.running) {

            return;

        }

        this.running = true;

        requestAnimationFrame(

            time => this.loop(time)

        );

    }


    // =================================================
    // ENCERRAR ENGINE
    // =================================================

    stop() {

        this.running = false;

    }

}

/*
========================================================
INSTALAÇÃO DOS SISTEMAS GRÁFICOS E RPG
========================================================
*/

installGameIntegration(Game);


// =====================================================
// FIM DO GAME.JS
// =====================================================
