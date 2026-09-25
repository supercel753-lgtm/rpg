
"use strict";

/*
========================================================
ZELDA PIXEL ADVENTURE
GRAPHICS + RPG INTEGRATION
BETA 3

ARQUIVO: integration.js

RESPONSABILIDADES:

01. Conectar o renderizador.
02. Conectar sprites procedurais.
03. Conectar iluminação.
04. Conectar partículas.
05. Conectar a interface RPG.
06. Integrar os atributos do personagem.
07. Integrar as classes.
08. Integrar o inventário.
09. Integrar os equipamentos.
10. Integrar o sistema de combate.
11. Integrar habilidades e magias.
12. Integrar progressão.
13. Integrar comerciantes.
14. Integrar recompensas.
15. Integrar fabricação de itens.
16. Integrar o salvamento do RPG.
17. Unificar a renderização.
18. Evitar atualizações duplicadas.

========================================================
*/


// =====================================================
// IMPORTAÇÕES GRÁFICAS
// =====================================================

import {
    PixelRenderer
} from "./renderer.js";


import {
    SpriteSystem
} from "./sprites.js";


import {
    TileRenderer
} from "./tiles.js";


import {
    ParticleSystem
} from "./particles.js";


import {
    LightingSystem
} from "./lighting.js";


import {
    GameUI,
    UI_TABS
} from "./ui.js";


// =====================================================
// IMPORTAÇÕES DO RPG
// =====================================================

import {
    ITEM_DATABASE,
    ITEM_TYPES,
    createItem
} from "./ITEMS.JS";


import {
    SKILLS,
    SKILL_TYPES
} from "./SKILLS.JS";


import {
    RECIPES
} from "./CRAFTING.JS";


// =====================================================
// CONFIGURAÇÕES
// =====================================================

const INTEGRATION_CONFIG = Object.freeze({

    VERSION: 1,

    WIDTH: 320,

    HEIGHT: 180,

    PLAYER_SPRITE_OFFSET_X: -4,

    PLAYER_SPRITE_OFFSET_Y: -7,

    ENEMY_EXPERIENCE: 25,

    BOSS_EXPERIENCE: 350,

    SKILL_RANGE: 125,

    MAX_DELTA_TIME: 0.05,

    DEFAULT_STORAGE_KEY:
        "zelda_beta3_game"

});


// =====================================================
// UTILITÁRIOS
// =====================================================

function clampIntegration(
    value,
    min,
    max
) {

    return Math.max(

        min,

        Math.min(max, value)

    );

}


function isFiniteNumber(value) {

    return (
        typeof value === "number" &&
        Number.isFinite(value)
    );

}


function getCharacterClass(game) {

    return game.character
        ?.characterClass
        ?.id || "warrior";

}


function getPlayerCenter(player) {

    return {

        x:
            player.x +
            player.width / 2,

        y:
            player.y +
            player.height / 2

    };

}


// =====================================================
// CRIAR ITEM COMPATÍVEL COM O RPG
// =====================================================

function normalizeShopItem(product) {

    if (!product) {

        return null;

    }

    // -----------------------------------------
    // UTILIZAR O CATÁLOGO RPG
    // -----------------------------------------

    const definition =
        ITEM_DATABASE[
            product.id
        ];

    if (definition) {

        return createItem(

            product.id,

            1

        );

    }

    // -----------------------------------------
    // COMPATIBILIDADE COM ITENS ANTIGOS
    // -----------------------------------------

    const oldType =
        product.type;

    let type =
        oldType;

    if (

        oldType === "food" ||

        oldType === "potion"

    ) {

        type =
            ITEM_TYPES.CONSUMABLE;

    }

    return {

        id: product.id,

        name: product.name,

        type,

        quantity: 1,

        heal:
            product.heal || 0,

        mana:
            product.mana || 0,

        stamina:
            product.stamina || 0,

        value:
            product.price || 0,

        weight:
            product.weight || 0.1,

        rarity:
            product.rarity || "common"

    };

}


// =====================================================
// ENCONTRAR PRODUTO NO ESTOQUE ANTIGO
// =====================================================

function findShopStock(
    shop,
    product
) {

    if (
        !shop ||
        !product ||
        !Array.isArray(shop.stock)
    ) {

        return null;

    }

    return shop.stock.find(

        entry =>

            typeof entry.product === "string" &&

            entry.product.toLowerCase() ===
                product.id.toLowerCase()

    ) || null;

}


// =====================================================
// CONTADOR DE IDENTIFICADORES DE ITENS
// =====================================================

function normalizeInventoryInstances(
    inventory,
    equipment = null
) {

    if (
        !inventory ||
        !Array.isArray(inventory.items)
    ) {

        return;

    }

    const seen =
        new Set();

    let nextId = 1;

    const equippedItems =
        equipment?.slots

            ? Object.values(
                equipment.slots
            ).filter(Boolean)

            : [];

    // -----------------------------------------
    // RESERVAR IDENTIFICADORES EQUIPADOS
    // -----------------------------------------

    for (const item of equippedItems) {

        if (
            Number.isSafeInteger(
                item.instanceId
            ) &&
            item.instanceId > 0 &&
            !seen.has(item.instanceId)
        ) {

            seen.add(
                item.instanceId
            );

            nextId = Math.max(

                nextId,

                item.instanceId + 1

            );

        }

    }

    // -----------------------------------------
    // IDENTIFICAR IDs JÁ UTILIZADOS
    // -----------------------------------------

    for (const item of inventory.items) {

        if (
            Number.isSafeInteger(
                item.instanceId
            ) &&
            item.instanceId > 0
        ) {

            nextId = Math.max(

                nextId,

                item.instanceId + 1

            );

        }

    }

    // -----------------------------------------
    // CORRIGIR ITENS SEM IDENTIFICADOR ÚNICO
    // -----------------------------------------

    const inventorySeen =
        new Set(seen);

    for (const item of inventory.items) {

        if (

            !Number.isSafeInteger(
                item.instanceId
            ) ||

            item.instanceId <= 0 ||

            inventorySeen.has(
                item.instanceId
            )

        ) {

            item.instanceId =
                nextId++;

        }

        inventorySeen.add(
            item.instanceId
        );

    }

}


// =====================================================
// ESTABILIZAR INVENTÁRIO
// =====================================================

function installInventoryCompatibility(
    game
) {

    const inventory =
        game.character?.inventory;

    if (!inventory) {

        return;

    }

    if (inventory.__integrationInstalled) {

        return;

    }

    const originalAddItem =
        inventory.addItem.bind(
            inventory
        );

    inventory.addItem = function (
        item,
        quantity = 1
    ) {

        // -----------------------------------------
        // MOEDAS DA ENGINE ANTIGA
        // -----------------------------------------

        if (

            item === "coins" ||

            (
                typeof item === "object" &&
                item !== null &&
                (
                    item.id === "coins" ||
                    item.name === "Moedas"
                )
            )

        ) {

            const amount =

                typeof item === "object"

                    ? item.quantity

                    : quantity;

            if (
                !Number.isSafeInteger(amount) ||
                amount <= 0
            ) {

                return false;

            }

            this.gold += amount;

            return true;

        }

        // -----------------------------------------
        // ITEM DE BAÚ OU COMERCIANTE
        // -----------------------------------------

        if (
            item &&
            typeof item === "object"
        ) {

            item = {

                ...item

            };

            if (

                item.type === "food" ||

                item.type === "potion"

            ) {

                item.type =
                    ITEM_TYPES.CONSUMABLE;

            }

        }

        // -----------------------------------------
        // ADICIONAR ITEM
        // -----------------------------------------

        const result =
            originalAddItem(

                item,

                quantity

            );

        if (result) {

            normalizeInventoryInstances(

                this,

                game.character.equipment

            );

        }

        return result;

    };

    Object.defineProperty(

        inventory,

        "__integrationInstalled",

        {
            value: true,

            enumerable: false
        }

    );

    normalizeInventoryInstances(

        inventory,

        game.character.equipment

    );

}


// =====================================================
// EQUIPAR ITEM INICIAL
// =====================================================

function equipStartingItem(
    game,
    itemId
) {

    const inventory =
        game.character.inventory;

    const equipment =
        game.character.equipment;

    const characterClass =
        game.character.characterClass;

    const item =
        inventory.items.find(

            entry =>
                entry.id === itemId

        );

    if (!item) {

        return false;

    }

    const result =
        equipment.equip(

            item,

            characterClass

        );

    if (!result.success) {

        return false;

    }

    inventory.removeItem(

        item.instanceId,

        1

    );

    if (result.previous) {

        inventory.addItem(
            result.previous
        );

    }

    return true;

}


// =====================================================
// DESENHAR ENTIDADE COM SPRITE
// =====================================================

function drawIntegratedEntity(
    game,
    entity,
    ctx
) {

    if (
        !entity ||
        !entity.isAlive()
    ) {

        return;

    }

    const type =
        entity.type;

    // -----------------------------------------
    // CHEFES
    // -----------------------------------------

    if (type === "BOSS") {

        game.spriteSystem.drawBoss(

            ctx,

            entity

        );

        return;

    }

    // -----------------------------------------
    // INIMIGOS
    // -----------------------------------------

    if (type === "ENEMY") {

        game.spriteSystem.drawEnemy(

            ctx,

            entity

        );

        return;

    }

    // -----------------------------------------
    // COMERCIANTES
    // -----------------------------------------

    if (type === "SHOPKEEPER") {

        game.spriteSystem.drawNPC(

            ctx,

            entity

        );

        return;

    }

    // -----------------------------------------
    // NPCS
    // -----------------------------------------

    if (type === "NPC") {

        game.spriteSystem.drawNPC(

            ctx,

            entity

        );

        return;

    }

    // -----------------------------------------
    // ANIMAIS
    // -----------------------------------------

    entity.draw(ctx);

}


// =====================================================
// DESENHAR ENTIDADES VISÍVEIS
// =====================================================

function drawVisibleEntities(
    game,
    ctx
) {

    if (!game.entities) {

        return;

    }

    const cameraX =
        game.world.cameraX;

    const cameraY =
        game.world.cameraY;

    const width =
        game.canvas.width;

    const height =
        game.canvas.height;

    const visible =
        game.entities.entities.filter(

            entity =>

                entity.isAlive() &&

                entity.x + entity.width >=
                    cameraX - 40 &&

                entity.x <=
                    cameraX + width + 40 &&

                entity.y + entity.height >=
                    cameraY - 40 &&

                entity.y <=
                    cameraY + height + 40

        );

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

        drawIntegratedEntity(

            game,

            entity,

            ctx

        );

    }

}


// =====================================================
// ANIMAÇÕES DOS PERSONAGENS
// =====================================================

function updateSpriteAnimations(
    game,
    dt
) {

    if (!game.player) {

        return;

    }

    game.spriteSystem.update(

        "player",

        dt,

        game.player.running
            ? 1.5
            : 1

    );

    if (!game.entities) {

        return;

    }

    for (
        const entity of
        game.entities.entities
    ) {

        if (!entity.isAlive()) {

            continue;

        }

        if (
            !entity.moving &&
            !entity.attacking
        ) {

            continue;

        }

        game.spriteSystem.update(

            entity.id,

            dt,

            entity.moving ? 1 : 0.5

        );

    }

}


// =====================================================
// EFEITO DE IMPACTO
// =====================================================

function spawnHitEffect(
    game,
    entity,
    damage
) {

    if (!entity) {

        return;

    }

    game.particleSystem.hit(

        entity.centerX,

        entity.centerY,

        damage

    );

}


// =====================================================
// RECOMPENSA DE EXPERIÊNCIA
// =====================================================

function rewardExperience(
    game,
    entity
) {

    if (
        !entity ||
        entity.__experienceGranted
    ) {

        return;

    }

    entity.__experienceGranted = true;

    const boss =
        entity.type === "BOSS";

    const experience =
        boss

            ? INTEGRATION_CONFIG.BOSS_EXPERIENCE

            : INTEGRATION_CONFIG.ENEMY_EXPERIENCE;

    const character =
        game.character;

    const progression =
        character.progression;

    const previousLevel =
        progression.level;

    const gainedLevels =
        progression.gainExperience(

            experience

        );

    // -----------------------------------------
    // SINCRONIZAR NÍVEL DA CLASSE
    // -----------------------------------------

    character.characterClass.level =
        progression.level;

    // -----------------------------------------
    // RECALCULAR ATRIBUTOS DERIVADOS
    // -----------------------------------------

    if (
        progression.level > previousLevel
    ) {

        const healthIncrease =

            character.characterClass
                .definition
                .hitDie *

            (
                progression.level -
                previousLevel
            );

        game.player.maxHealth +=
            healthIncrease;

        game.player.health = Math.min(

            game.player.maxHealth,

            game.player.health +
            healthIncrease

        );

        character.maxHealth =
            game.player.maxHealth;

        game.player.syncCharacter();

        game.uiSystem.notify(

            "Nível " +
            progression.level +
            " alcançado!",

            4

        );

        // -------------------------------------
        // EFEITO VISUAL DE PROGRESSÃO
        // -------------------------------------

        game.particleSystem.loot(

            game.player.centerX,

            game.player.centerY

        );

    }

    // -----------------------------------------
    // MENSAGEM DE EXPERIÊNCIA
    // -----------------------------------------

    if (
        gainedLevels.length === 0
    ) {

        game.uiSystem.notify(

            "+" +
            experience +
            " XP",

            2

        );

    }

}


// =====================================================
// RECONHECER INIMIGOS DERROTADOS
// =====================================================

function processCombatResults(
    game,
    previousHealth
) {

    for (
        const entity of
        game.entities.entities
    ) {

        if (
            !previousHealth.has(entity.id)
        ) {

            continue;

        }

        const oldHealth =
            previousHealth.get(entity.id);

        const damage =
            oldHealth - entity.health;

        if (damage <= 0) {

            continue;

        }

        // -----------------------------------------
        // PARTÍCULAS
        // -----------------------------------------

        spawnHitEffect(

            game,

            entity,

            damage

        );

        // -----------------------------------------
        // EXPERIÊNCIA
        // -----------------------------------------

        if (
            !entity.isAlive() &&
            (
                entity.type === "ENEMY" ||
                entity.type === "BOSS"
            )
        ) {

            rewardExperience(

                game,

                entity

            );

            game.particleSystem.death(

                entity.centerX,

                entity.centerY

            );

        }

    }

}


// =====================================================
// CONSUMIR ITEM DO INVENTÁRIO
// =====================================================

function consumeRPGItem(
    game,
    item
) {

    if (!item) {

        return false;

    }

    const player =
        game.player;

    const inventory =
        game.character.inventory;

    let applied = false;

    // -----------------------------------------
    // RECUPERAR VIDA
    // -----------------------------------------

    if (
        item.heal > 0 &&
        player.health <
            player.maxHealth
    ) {

        const before =
            player.health;

        player.heal(
            item.heal
        );

        applied =
            player.health > before;

        if (applied) {

            game.particleSystem.heal(

                player.centerX,

                player.centerY

            );

        }

    }

    // -----------------------------------------
    // RECUPERAR MANA
    // -----------------------------------------

    if (
        item.mana > 0 &&
        player.mana <
            player.maxMana
    ) {

        player.mana = Math.min(

            player.maxMana,

            player.mana + item.mana

        );

        applied = true;

        game.particleSystem.magic(

            player.centerX,

            player.centerY

        );

    }

    // -----------------------------------------
    // RECUPERAR RESISTÊNCIA
    // -----------------------------------------

    if (
        item.stamina > 0 &&
        player.stamina <
            player.maxStamina
    ) {

        player.recoverStamina(

            item.stamina

        );

        applied = true;

    }

    if (!applied) {

        return false;

    }

    inventory.removeItem(

        item.instanceId,

        1

    );

    player.syncCharacter();

    game.uiSystem.notify(

        "Usado: " +
        item.name

    );

    return true;

}


// =====================================================
// EQUIPAR ITEM DO INVENTÁRIO
// =====================================================

function equipRPGItem(
    game,
    item
) {

    if (
        !item ||
        !item.slot
    ) {

        return false;

    }

    const character =
        game.character;

    const inventory =
        character.inventory;

    const equipment =
        character.equipment;

    const result =
        equipment.equip(

            item,

            character.characterClass

        );

    if (!result.success) {

        game.uiSystem.notify(

            "Equipamento incompatível."

        );

        return false;

    }

    inventory.removeItem(

        item.instanceId,

        1

    );

    if (result.previous) {

        inventory.addItem(

            result.previous

        );

    }

    game.uiSystem.notify(

        "Equipado: " +
        item.name

    );

    return true;

}


// =====================================================
// APRENDER HABILIDADE
// =====================================================

function learnCharacterSkill(
    game,
    skillId,
    spendPoint = true
) {

    const character =
        game.character;

    const skill =
        SKILLS[skillId];

    if (!skill) {

        return false;

    }

    const classId =
        getCharacterClass(game);

    if (
        !skill.classes.includes(classId)
    ) {

        return false;

    }

    if (
        character.progression.level <
        skill.level
    ) {

        return false;

    }

    if (
        character.skills.knows(skillId)
    ) {

        return false;

    }

    if (
        spendPoint &&
        character.progression.skillPoints <= 0
    ) {

        return false;

    }

    const learned =
        character.skills.learn(
            skillId
        );

    if (!learned) {

        return false;

    }

    if (spendPoint) {

        character.progression.skillPoints--;

    }

    return true;

}


// =====================================================
// DESBLOQUEAR HABILIDADES INICIAIS
// =====================================================

function unlockStartingSkills(game) {

    const classId =
        getCharacterClass(game);

    for (
        const [skillId, skill] of
        Object.entries(SKILLS)
    ) {

        if (

            skill.level === 1 &&

            skill.classes.includes(classId)

        ) {

            learnCharacterSkill(

                game,

                skillId,

                false

            );

        }

    }

}


// =====================================================
// UTILIZAR HABILIDADE ATIVA
// =====================================================

function activateCharacterSkill(
    game,
    skillId
) {

    const character =
        game.character;

    const player =
        game.player;

    const skill =
        SKILLS[skillId];

    if (
        !skill ||
        !character.skills.canUse(skillId) ||
        player.health <= 0
    ) {

        return false;

    }

    // -----------------------------------------
    // HABILIDADES PASSIVAS
    // -----------------------------------------

    if (
        skill.type ===
        SKILL_TYPES.PASSIVE
    ) {

        return false;

    }

    // -----------------------------------------
    // HABILIDADES SEM EFEITO IMPLEMENTADO
    // -----------------------------------------

    const damageSkill =

        isFiniteNumber(skill.damage) ||

        isFiniteNumber(
            skill.damageMultiplier
        );

    if (!damageSkill) {

        game.uiSystem.notify(

            "Habilidade ainda sem efeito ativo."

        );

        return false;

    }

    const manaCost =
        skill.manaCost || 0;

    const staminaCost =
        skill.staminaCost || 0;

    if (

        player.mana < manaCost ||

        player.stamina < staminaCost

    ) {

        game.uiSystem.notify(

            "Recursos insuficientes."

        );

        return false;

    }

    // -----------------------------------------
    // VERIFICAR ALVOS
    // -----------------------------------------

    const center =
        getPlayerCenter(player);

    const directions = {

        up: [0, -1],

        down: [0, 1],

        left: [-1, 0],

        right: [1, 0]

    };

    const facing =
        directions[
            player.direction
        ] || [0, 1];

    const targetRange =

        skill.type === SKILL_TYPES.SPELL

            ? INTEGRATION_CONFIG.SKILL_RANGE

            : skill.area || 45;

    const damage =

        skill.damage ||

        Math.round(

            (
                character.equipment
                    .slots.main_hand
                    ?.damage || 5
            ) *

            (
                skill.damageMultiplier || 1
            )

        );

    let hits = 0;

    for (
        const entity of
        game.entities.entities
    ) {

        if (

            !entity.isAlive() ||

            (
                entity.type !== "ENEMY" &&
                entity.type !== "BOSS"
            )

        ) {

            continue;

        }

        const dx =
            entity.centerX - center.x;

        const dy =
            entity.centerY - center.y;

        const distance =
            Math.hypot(dx, dy);

        if (
            distance > targetRange
        ) {

            continue;

        }

        // -----------------------------------------
        // VERIFICAR DIREÇÃO DO FEITIÇO
        // -----------------------------------------

        if (!skill.area) {

            const dot =

                dx * facing[0] +

                dy * facing[1];

            if (
                dot < 0
            ) {

                continue;

            }

        }

        const before =
            entity.health;

        const appliedDamage =
            entity.takeDamage(

                damage,

                player

            );

        if (
            appliedDamage <= 0
        ) {

            continue;

        }

        hits++;

        spawnHitEffect(

            game,

            entity,

            appliedDamage

        );

        // -----------------------------------------
        // RECOMPENSAS POR DERROTA
        // -----------------------------------------

        if (
            !entity.isAlive()
        ) {

            game.entities.onEntityDefeated(

                entity,

                player

            );

            rewardExperience(

                game,

                entity

            );

            game.particleSystem.death(

                entity.centerX,

                entity.centerY

            );

        }

    }

    // -----------------------------------------
    // CONSUMIR RECURSOS
    // -----------------------------------------

    player.mana -= manaCost;

    player.stamina -= staminaCost;

    player.syncCharacter();

    // -----------------------------------------
    // COOLDOWN
    // -----------------------------------------

    character.skills.startCooldown(
        skillId
    );

    // -----------------------------------------
    // PARTÍCULAS
    // -----------------------------------------

    if (
        skill.element === "fire"
    ) {

        game.particleSystem.fire(

            center.x,

            center.y

        );

    } else if (
        skill.element === "ice"
    ) {

        game.particleSystem.ice(

            center.x,

            center.y

        );

    } else if (
        skill.element === "holy"
    ) {

        game.particleSystem.heal(

            center.x,

            center.y

        );

    } else {

        game.particleSystem.magic(

            center.x,

            center.y

        );

    }

    game.uiSystem.notify(

        skill.name +
        " — " +
        hits +
        " acerto(s)",

        2

    );

    return true;

}


// =====================================================
// CRIAR FONTE DE LUZ NO MUNDO
// =====================================================

function createWorldLights(game) {

    const lighting =
        game.lightingSystem;

    const landmarks =
        game.world.landmarks || [];

    let created = 0;

    for (const landmark of landmarks) {

        if (created >= 20) {

            break;

        }

        if (
            landmark.type !== "CAMPFIRE" &&
            landmark.type !== "TORCH"
        ) {

            continue;

        }

        if (
            landmark.type === "CAMPFIRE"
        ) {

            lighting.createCampfire(

                landmark.x,

                landmark.y

            );

        } else {

            lighting.createTorch(

                landmark.x,

                landmark.y

            );

        }

        created++;

    }

}


// =====================================================
// CRIAR SISTEMAS GRÁFICOS
// =====================================================

function createGraphicsSystems(game) {

    // -----------------------------------------
    // RENDERIZADOR
    // -----------------------------------------

    game.renderer =
        new PixelRenderer(

            game.canvas,

            {

                width:
                    INTEGRATION_CONFIG.WIDTH,

                height:
                    INTEGRATION_CONFIG.HEIGHT,

                worldWidth:
                    game.world.width,

                worldHeight:
                    game.world.height

            }

        );

    game.ctx =
        game.renderer.ctx;

    game.renderer.camera.follow(

        game.player

    );

    // -----------------------------------------
    // SPRITES
    // -----------------------------------------

    game.spriteSystem =
        new SpriteSystem();

    // -----------------------------------------
    // TILES
    // -----------------------------------------

    game.tileSystem =
        new TileRenderer({

            seed:
                game.world.seed

        });

    // -----------------------------------------
    // PARTÍCULAS
    // -----------------------------------------

    game.particleSystem =
        new ParticleSystem();

    // -----------------------------------------
    // ILUMINAÇÃO
    // -----------------------------------------

    game.lightingSystem =
        new LightingSystem(

            game.canvas.width,

            game.canvas.height

        );

    // -----------------------------------------
    // INTERFACE
    // -----------------------------------------

    game.uiSystem =
        new GameUI({

            width:
                game.canvas.width,

            height:
                game.canvas.height

        });

    // -----------------------------------------
    // CONECTAR TERRENO
    // -----------------------------------------

    game.tileSystem.install(

        game.world

    );

    // -----------------------------------------
    // CRIAR LUZES
    // -----------------------------------------

    createWorldLights(
        game
    );

}


// =====================================================
// DESENHAR CENÁRIO
// =====================================================

function renderWorld(
    game,
    ctx
) {

    const world =
        game.world;

    const width =
        game.canvas.width;

    const height =
        game.canvas.height;

    // -----------------------------------------
    // RENDERIZAÇÃO ORIGINAL DO MUNDO
    // -----------------------------------------

    world.draw(

        ctx,

        width,

        height,

        game.player

    );

    /*
    O world.js continua responsável por desenhar
    o cenário e os objetos definidos anteriormente.

    O TileRenderer foi registrado no drawTerrain,
    caso a versão do World utilize esse método.
    */

}


// =====================================================
// DESENHAR SPRITES E PARTÍCULAS
// =====================================================

function renderCharactersAndEffects(
    game,
    ctx
) {

    const world =
        game.world;

    ctx.save();

    ctx.translate(

        -Math.round(world.cameraX),

        -Math.round(world.cameraY)

    );

    ctx.imageSmoothingEnabled =
        false;

    // -----------------------------------------
    // ENTIDADES
    // -----------------------------------------

    drawVisibleEntities(

        game,

        ctx

    );

    // -----------------------------------------
    // PROTAGONISTA
    // -----------------------------------------

    game.spriteSystem.drawPlayer(

        ctx,

        game.player,

        game.character

    );

    ctx.restore();

    // -----------------------------------------
    // PARTÍCULAS
    // -----------------------------------------

    game.particleSystem.draw(

        ctx,

        world.cameraX,

        world.cameraY

    );

}


// =====================================================
// DESENHAR ILUMINAÇÃO
// =====================================================

function renderLighting(
    game,
    ctx
) {

    const world =
        game.world;

    game.lightingSystem.draw(

        ctx,

        world.cameraX,

        world.cameraY

    );

}


// =====================================================
// DESENHAR CLIMA
// =====================================================

function renderWeather(
    game,
    ctx
) {

    const world =
        game.world;

    // -----------------------------------------
    // CLIMA DO WORLD.JS
    // -----------------------------------------

    if (
        typeof world.drawWeather ===
        "function"
    ) {

        world.drawWeather(

            ctx,

            game.canvas.width,

            game.canvas.height

        );

    }

}


// =====================================================
// DESENHAR HUD E MENUS
// =====================================================

function renderInterface(
    game,
    ctx
) {

    // -----------------------------------------
    // HUD E FICHA RPG
    // -----------------------------------------

    game.uiSystem.draw(

        ctx,

        game,

        RECIPES

    );

    // -----------------------------------------
    // MAPA DO MUNDO
    // -----------------------------------------

    game.world.drawExplorationUI(

        ctx,

        game.canvas.width,

        game.canvas.height

    );

    // -----------------------------------------
    // BARRA DE VIDA DOS CHEFES
    // -----------------------------------------

    game.entities.drawBossHUD(

        ctx,

        game.canvas.width

    );

    // -----------------------------------------
    // DIÁLOGOS
    // -----------------------------------------

    game.entities.drawDialogue(

        ctx,

        game.canvas.width,

        game.canvas.height

    );

    // -----------------------------------------
    // LOJAS
    // -----------------------------------------

    game.drawShopUI();

    // -----------------------------------------
    // NOTIFICAÇÕES DO MUNDO
    // -----------------------------------------

    game.world.drawNotifications(

        ctx,

        game.canvas.width,

        game.canvas.height

    );

}


// =====================================================
// RENDERIZAÇÃO UNIFICADA
// =====================================================

function renderIntegratedGame(game) {

    const ctx =
        game.ctx;

    if (!game.started) {

        game.drawTitle();

        return;

    }

    // -----------------------------------------
    // INICIAR QUADRO
    // -----------------------------------------

    game.renderer.beginFrame();

    // -----------------------------------------
    // 1. MUNDO
    // -----------------------------------------

    renderWorld(

        game,

        ctx

    );

    // -----------------------------------------
    // 2. SPRITES E EFEITOS
    // -----------------------------------------

    renderCharactersAndEffects(

        game,

        ctx

    );

    // -----------------------------------------
    // 3. ILUMINAÇÃO
    // -----------------------------------------

    renderLighting(

        game,

        ctx

    );

    // -----------------------------------------
    // 4. CLIMA
    // -----------------------------------------

    renderWeather(

        game,

        ctx

    );

    // -----------------------------------------
    // 5. INTERFACE
    // -----------------------------------------

    renderInterface(

        game,

        ctx

    );

    // -----------------------------------------
    // 6. PARTÍCULAS DE TELA
    // -----------------------------------------

    game.particleSystem.drawScreen(
        ctx
    );

    // -----------------------------------------
    // 7. GAME OVER
    // -----------------------------------------

    if (
        game.player.health <= 0
    ) {

        ctx.fillStyle =
            "rgba(0,0,0,0.82)";

        ctx.fillRect(

            0,

            0,

            game.canvas.width,

            game.canvas.height

        );

        ctx.font =
            "16px monospace";

        ctx.fillStyle =
            "#e35c54";

        ctx.textAlign =
            "center";

        ctx.fillText(

            "GAME OVER",

            game.canvas.width / 2,

            game.canvas.height / 2

        );

        ctx.textAlign =
            "left";

    }

    // -----------------------------------------
    // FINALIZAR QUADRO
    // -----------------------------------------

    game.renderer.endFrame();

}


// =====================================================
// PROCESSAR MENU RPG
// =====================================================

function handleRPGMenu(
    game
) {

    const ui =
        game.uiSystem;

    // -----------------------------------------
    // ABRIR MENU PRINCIPAL
    // -----------------------------------------

    if (
        !ui.open &&
        game.wasPressed("tab")
    ) {

        ui.openMenu(
            UI_TABS.CHARACTER
        );

        return true;

    }

    if (!ui.open) {

        return false;

    }

    // -----------------------------------------
    // PROCESSAR ENTRADAS
    // -----------------------------------------

    const keys = [

        "escape",

        "tab",

        "arrowleft",

        "arrowright",

        "arrowup",

        "arrowdown",

        "enter"

    ];

    for (const key of keys) {

        if (!game.wasPressed(key)) {

            continue;

        }

        if (
            ui.activeTab ===
            UI_TABS.EQUIPMENT
        ) {

            if (
                key === "arrowdown"
            ) {

                ui.selectedEquipment++;

                continue;

            }

            if (
                key === "arrowup"
            ) {

                ui.selectedEquipment = Math.max(

                    0,

                    ui.selectedEquipment - 1

                );

                continue;

            }

        }

        ui.handleKey(

            key,

            game

        );

    }

    return ui.open;

}


// =====================================================
// INSTALAR INTEGRAÇÃO NA ENGINE
// =====================================================

export function installGameIntegration(
    GameClass
) {

    if (
        !GameClass ||
        !GameClass.prototype
    ) {

        throw new Error(

            "Classe Game inválida."

        );

    }

    const prototype =
        GameClass.prototype;

    if (
        prototype.__graphicsRPGInstalled
    ) {

        return;

    }

    // -----------------------------------------
    // PRESERVAR MÉTODOS ORIGINAIS
    // -----------------------------------------

    const originalNewGame =
        prototype.newGame;

    const originalUpdate =
        prototype.update;

    const originalAttack =
        prototype.attack;

    const originalSaveGame =
        prototype.saveGame;

    const originalLoadGame =
        prototype.loadGame;

    // =================================================
    // NOVO JOGO
    // =================================================

    prototype.newGame = function (
        classId = "warrior"
    ) {

        originalNewGame.call(

            this,

            classId

        );

        // -------------------------------------
        // ADAPTAR INVENTÁRIO
        // -------------------------------------

        installInventoryCompatibility(
            this
        );

        // -------------------------------------
        // EQUIPAR ARMA INICIAL
        // -------------------------------------

        equipStartingItem(

            this,

            "traveler_sword"

        );

        // -------------------------------------
        // EQUIPAR ARMADURA INICIAL
        // -------------------------------------

        equipStartingItem(

            this,

            "leather_armor"

        );

        // -------------------------------------
        // HABILIDADES INICIAIS
        // -------------------------------------

        unlockStartingSkills(
            this
        );

        // -------------------------------------
        // SISTEMAS GRÁFICOS
        // -------------------------------------

        createGraphicsSystems(
            this
        );

        // -------------------------------------
        // ILUMINAÇÃO INICIAL
        // -------------------------------------

        this.lightingSystem.update(

            0.016,

            this.world

        );

    };


    // =================================================
    // SISTEMA DE COMPRA
    // =================================================

    prototype.buySelectedProduct = function () {

        const shop =
            this.entities?.activeShop;

        if (!shop) {

            return false;

        }

        const catalog =
            shop.getCatalog();

        const product =
            catalog[
                this.entities.shopSelection
            ];

        if (!product) {

            return false;

        }

        const stock =
            findShopStock(

                shop,

                product

            );

        if (
            !stock ||
            stock.quantity <= 0
        ) {

            this.uiSystem.notify(

                "Produto esgotado."

            );

            return false;

        }

        const inventory =
            this.character.inventory;

        // -------------------------------------
        // VERIFICAR MOEDAS
        // -------------------------------------

        if (
            inventory.gold <
            product.price
        ) {

            this.uiSystem.notify(

                "Moedas insuficientes."

            );

            return false;

        }

        // -------------------------------------
        // PREPARAR ITEM
        // -------------------------------------

        const item =
            normalizeShopItem(
                product
            );

        if (!item) {

            return false;

        }

        // -------------------------------------
        // VERIFICAR ESPAÇO
        // -------------------------------------

        const existing =
            inventory.items.find(

                entry =>
                    entry.id === item.id

            );

        const stackable = [

            ITEM_TYPES.CONSUMABLE,

            ITEM_TYPES.MATERIAL,

            ITEM_TYPES.AMMO

        ].includes(item.type);

        if (

            inventory.items.length >=
                inventory.slots &&

            !(stackable && existing)

        ) {

            this.uiSystem.notify(

                "Inventário cheio."

            );

            return false;

        }

        // -------------------------------------
        // ADICIONAR ITEM
        // -------------------------------------

        const added =
            inventory.addItem(
                item
            );

        if (!added) {

            return false;

        }

        // -------------------------------------
        // COBRAR E ATUALIZAR ESTOQUE
        // -------------------------------------

        inventory.gold -=
            product.price;

        stock.quantity--;

        this.uiSystem.notify(

            "Comprado: " +
            product.name

        );

        this.particleSystem.loot(

            this.player.centerX,

            this.player.centerY

        );

        return true;

    };


    // =================================================
    // USAR ITEM SELECIONADO
    // =================================================

    prototype.useSelectedItem = function () {

        const inventory =
            this.character.inventory;

        const index =

            this.uiSystem?.open

                ? this.uiSystem.selectedItem

                : this.selectedInventoryIndex;

        const item =
            inventory.items[index];

        if (!item) {

            return false;

        }

        if (
            item.type ===
                ITEM_TYPES.CONSUMABLE ||
            item.type === "food" ||
            item.type === "potion"
        ) {

            return consumeRPGItem(

                this,

                item

            );

        }

        if (item.slot) {

            return equipRPGItem(

                this,

                item

            );

        }

        return false;

    };


    // =================================================
    // APRENDER HABILIDADE
    // =================================================

    prototype.learnSkill = function (
        skillId
    ) {

        const learned =
            learnCharacterSkill(

                this,

                skillId,

                true

            );

        if (learned) {

            this.uiSystem.notify(

                "Habilidade aprendida: " +
                SKILLS[skillId].name

            );

        }

        return learned;

    };


    // =================================================
    // UTILIZAR HABILIDADE
    // =================================================

    prototype.useSkill = function (
        skillId
    ) {

        if (
            this.menu !== "GAME" ||
            this.uiSystem.open ||
            this.entities.isInteracting()
        ) {

            return false;

        }

        return activateCharacterSkill(

            this,

            skillId

        );

    };


    // =================================================
    // FABRICAR ITEM
    // =================================================

    prototype.craftItem = function (
        recipeId
    ) {

        const inventory =
            this.character.inventory;

        const crafting =
            this.character.crafting;

        const recipe =
            RECIPES[recipeId];

        if (!recipe) {

            return false;

        }

        // -------------------------------------
        // VERIFICAR INGREDIENTES
        // -------------------------------------

        if (
            !crafting.canCraft(

                recipeId,

                inventory

            )
        ) {

            this.uiSystem.notify(

                "Ingredientes insuficientes."

            );

            return false;

        }

        // -------------------------------------
        // VERIFICAR ESPAÇO NO INVENTÁRIO
        // -------------------------------------

        const resultDefinition =
            ITEM_DATABASE[
                recipe.result
            ];

        if (!resultDefinition) {

            return false;

        }

        const stackable = [

            ITEM_TYPES.CONSUMABLE,

            ITEM_TYPES.MATERIAL,

            ITEM_TYPES.AMMO

        ].includes(
            resultDefinition.type
        );

        const existing =
            inventory.items.some(

                item =>
                    item.id === recipe.result

            );

        if (

            inventory.items.length >=
                inventory.slots &&

            !(stackable && existing)

        ) {

            this.uiSystem.notify(

                "Inventário cheio."

            );

            return false;

        }

        // -------------------------------------
        // FABRICAR
        // -------------------------------------

        const result =
            crafting.craft(

                recipeId,

                inventory

            );

        if (result) {

            this.particleSystem.magic(

                this.player.centerX,

                this.player.centerY

            );

            this.uiSystem.notify(

                "Item fabricado!"

            );

        }

        return result;

    };


    // =================================================
    // ATAQUE FÍSICO
    // =================================================

    prototype.attack = function () {

        const previousHealth =
            new Map();

        for (
            const entity of
            this.entities.entities
        ) {

            previousHealth.set(

                entity.id,

                entity.health

            );

        }

        // -------------------------------------
        // EXECUTAR ATAQUE ORIGINAL
        // -------------------------------------

        originalAttack.call(this);

        // -------------------------------------
        // APLICAR EFEITOS
        // -------------------------------------

        processCombatResults(

            this,

            previousHealth

        );

    };


    // =================================================
    // ATUALIZAÇÃO GRÁFICA E RPG
    // =================================================

    prototype.update = function (
        deltaTime
    ) {

        if (!this.started) {

            return;

        }

        const dt = Math.min(

            deltaTime,

            INTEGRATION_CONFIG.MAX_DELTA_TIME

        );

        // -------------------------------------
        // INTERFACE RPG
        // -------------------------------------

        const menuOpen =
            handleRPGMenu(
                this
            );

        // -------------------------------------
        // ATUALIZAR SISTEMAS DO JOGO
        // -------------------------------------

        if (!menuOpen) {

            originalUpdate.call(

                this,

                dt

            );

        }

        // -------------------------------------
        // ATUALIZAR SPRITES
        // -------------------------------------

        if (
            this.menu === "GAME" &&
            !menuOpen
        ) {

            updateSpriteAnimations(

                this,

                dt

            );

        }

        // -------------------------------------
        // ATUALIZAR PARTÍCULAS
        // -------------------------------------

        this.particleSystem.update(
            dt
        );

        // -------------------------------------
        // ATUALIZAR ILUMINAÇÃO
        // -------------------------------------

        this.lightingSystem.update(

            dt,

            this.world

        );

        // -------------------------------------
        // SINCRONIZAR FLASH DE TEMPESTADE
        // -------------------------------------

        if (
            this.world.lightningTimer > 0 &&
            !this.__lightningActive
        ) {

            this.lightingSystem.flash();

            this.__lightningActive = true;

        }

        if (
            this.world.lightningTimer <= 0
        ) {

            this.__lightningActive = false;

        }

        // -------------------------------------
        // ATUALIZAR INTERFACE
        // -------------------------------------

        this.uiSystem.update(
            dt
        );

        // -------------------------------------
        // MANTER FICHA SINCRONIZADA
        // -------------------------------------

        this.character.characterClass.level =
            this.character.progression.level;

    };


    // =================================================
    // RENDERIZAÇÃO
    // =================================================

    prototype.render = function () {

        if (
            !this.started
        ) {

            this.drawTitle();

            return;

        }

        renderIntegratedGame(
            this
        );

    };


    // =================================================
    // SALVAMENTO RPG COMPLEMENTAR
    // =================================================

    prototype.saveGame = function () {

        const saved =
            originalSaveGame.call(this);

        if (!saved) {

            return false;

        }

        try {

            const key =
                INTEGRATION_CONFIG
                    .DEFAULT_STORAGE_KEY;

            const raw =
                localStorage.getItem(key);

            const state =
                JSON.parse(raw);

            // -------------------------------------
            // DADOS COMPLEMENTARES
            // -------------------------------------

            state.rpgIntegration = {

                version:
                    INTEGRATION_CONFIG.VERSION,

                skillPoints:
                    this.character.progression
                        .skillPoints,

                attributePoints:
                    this.character.progression
                        .attributePoints,

                classLevel:
                    this.character.characterClass
                        .level,

                learnedSkills: [

                    ...this.character.skills.learned

                ],

                equipment:

                    structuredClone(

                        this.character.equipment.slots

                    )

            };

            localStorage.setItem(

                key,

                JSON.stringify(state)

            );

            return true;

        } catch (error) {

            console.error(

                "Falha ao salvar dados RPG:",

                error

            );

            return false;

        }

    };


    // =================================================
    // CARREGAMENTO RPG COMPLEMENTAR
    // =================================================

    prototype.loadGame = function () {

        let extra = null;

        try {

            const raw =
                localStorage.getItem(

                    INTEGRATION_CONFIG
                        .DEFAULT_STORAGE_KEY

                );

            if (raw) {

                const state =
                    JSON.parse(raw);

                extra =
                    state.rpgIntegration || null;

            }

        } catch (error) {

            console.error(error);

        }

        const loaded =
            originalLoadGame.call(this);

        if (!loaded) {

            return false;

        }

        // -------------------------------------
        // RECUPERAR HABILIDADES
        // -------------------------------------

        if (
            extra &&
            extra.version ===
                INTEGRATION_CONFIG.VERSION
        ) {

            const progression =
                this.character.progression;

            progression.skillPoints = Math.max(

                0,

                extra.skillPoints || 0

            );

            progression.attributePoints = Math.max(

                0,

                extra.attributePoints || 0

            );

            this.character.characterClass.level =
                progression.level;

            if (
                Array.isArray(
                    extra.learnedSkills
                )
            ) {

                this.character.skills.learned =
                    new Set(

                        extra.learnedSkills.filter(

                            id =>
                                Boolean(SKILLS[id])

                        )

                    );

            }

        }

        // -------------------------------------
        // NORMALIZAR IDENTIFICADORES
        // -------------------------------------

        installInventoryCompatibility(
            this
        );

        normalizeInventoryInstances(

            this.character.inventory,

            this.character.equipment

        );

        return true;

    };


    // =================================================
    // INSTALAÇÃO CONCLUÍDA
    // =================================================

    Object.defineProperty(

        prototype,

        "__graphicsRPGInstalled",

        {

            value: true,

            enumerable: false

        }

    );

}
