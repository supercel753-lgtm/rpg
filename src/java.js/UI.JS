
"use strict";

/*
========================================================
ZELDA PIXEL ADVENTURE
UI ENGINE — BETA 3

ARQUIVO: ui.js

SISTEMAS:

- HUD
- Vida
- Mana
- Resistência
- Experiência
- Nível
- Moedas
- Inventário
- Equipamentos
- Ficha RPG
- Atributos
- Habilidades
- Magias
- Missões
- Fabricação
- Abas de navegação
- Seleção de itens
- Informações dos equipamentos
- Interface pixelada

========================================================
*/


// =====================================================
// CONFIGURAÇÕES
// =====================================================

export const UI_CONFIG = Object.freeze({

    WIDTH: 320,

    HEIGHT: 180,

    FONT_SIZE: 7,

    TITLE_SIZE: 9,

    PANEL_PADDING: 6,

    TAB_HEIGHT: 17,

    ITEM_HEIGHT: 13,

    MAX_VISIBLE_ITEMS: 7

});


// =====================================================
// CORES
// =====================================================

export const UI_COLORS = Object.freeze({

    background: "#172019",

    panel: "#293126",

    panelLight: "#36412f",

    panelDark: "#111a15",

    border: "#d2b775",

    borderDark: "#73613f",

    text: "#f3edd9",

    textSecondary: "#b7b7a2",

    selected: "#786339",

    hover: "#50563a",

    health: "#c94c49",

    mana: "#5d84d5",

    stamina: "#5dbd70",

    experience: "#ddbe6b",

    gold: "#e8c86e",

    rare: "#6d9cdf",

    epic: "#ab78dd",

    legendary: "#efbc63"

});


// =====================================================
// ABAS
// =====================================================

export const UI_TABS = Object.freeze({

    CHARACTER: "CHARACTER",

    INVENTORY: "INVENTORY",

    EQUIPMENT: "EQUIPMENT",

    SKILLS: "SKILLS",

    SPELLS: "SPELLS",

    JOURNAL: "JOURNAL",

    CRAFTING: "CRAFTING"

});


// =====================================================
// ORDEM DAS ABAS
// =====================================================

const TAB_ORDER = [

    UI_TABS.CHARACTER,

    UI_TABS.INVENTORY,

    UI_TABS.EQUIPMENT,

    UI_TABS.SKILLS,

    UI_TABS.SPELLS,

    UI_TABS.JOURNAL,

    UI_TABS.CRAFTING

];


// =====================================================
// NOMES DAS ABAS
// =====================================================

const TAB_LABELS = {

    CHARACTER: "PERS",

    INVENTORY: "ITENS",

    EQUIPMENT: "EQUIP",

    SKILLS: "HABIL",

    SPELLS: "MAGIA",

    JOURNAL: "MISSO",

    CRAFTING: "CRIAR"

};


// =====================================================
// UTILITÁRIOS
// =====================================================

function uiClamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}


function uiText(
    ctx,
    text,
    x,
    y,
    color = UI_COLORS.text,
    size = UI_CONFIG.FONT_SIZE
) {

    ctx.fillStyle = color;

    ctx.font =
        `${size}px monospace`;

    ctx.textBaseline =
        "top";

    ctx.fillText(

        String(text),

        Math.round(x),

        Math.round(y)

    );

}


function uiRect(
    ctx,
    x,
    y,
    width,
    height,
    color
) {

    ctx.fillStyle = color;

    ctx.fillRect(

        Math.round(x),

        Math.round(y),

        Math.round(width),

        Math.round(height)

    );

}


// =====================================================
// DESENHAR PAINEL
// =====================================================

function uiPanel(
    ctx,
    x,
    y,
    width,
    height
) {

    uiRect(

        ctx,

        x + 2,

        y + 2,

        width,

        height,

        UI_COLORS.panelDark

    );

    uiRect(

        ctx,

        x,

        y,

        width,

        height,

        UI_COLORS.panel

    );

    ctx.strokeStyle =
        UI_COLORS.border;

    ctx.lineWidth = 1;

    ctx.strokeRect(

        x + 0.5,

        y + 0.5,

        width - 1,

        height - 1

    );

}


// =====================================================
// DESENHAR BARRA DE ATRIBUTO
// =====================================================

function uiBar(
    ctx,
    x,
    y,
    width,
    height,
    value,
    maximum,
    color
) {

    const percentage =

        maximum > 0

            ? uiClamp(

                value / maximum,

                0,

                1

            )

            : 0;

    uiRect(

        ctx,

        x,

        y,

        width,

        height,

        UI_COLORS.panelDark

    );

    uiRect(

        ctx,

        x,

        y,

        width * percentage,

        height,

        color

    );

}


// =====================================================
// CLASSE PRINCIPAL
// =====================================================

export class GameUI {

    constructor(options = {}) {

        this.width =
            options.width ||
            UI_CONFIG.WIDTH;

        this.height =
            options.height ||
            UI_CONFIG.HEIGHT;

        this.open = false;

        this.activeTab =
            UI_TABS.CHARACTER;

        this.selectedItem = 0;

        this.selectedEquipment = 0;

        this.selectedSkill = 0;

        this.scroll = 0;

        this.showHUD = true;

        this.showMinimap = true;

        this.showTooltips = true;

        this.notification = null;

        this.notificationTime = 0;

    }


    // =================================================
    // ABRIR MENU
    // =================================================

    openMenu(
        tab = UI_TABS.CHARACTER
    ) {

        this.open = true;

        this.setTab(tab);

    }


    // =================================================
    // FECHAR MENU
    // =================================================

    closeMenu() {

        this.open = false;

    }


    // =================================================
    // ALTERNAR MENU
    // =================================================

    toggleMenu() {

        this.open =
            !this.open;

        return this.open;

    }


    // =================================================
    // SELECIONAR ABA
    // =================================================

    setTab(tab) {

        if (
            !TAB_ORDER.includes(tab)
        ) {

            return false;

        }

        this.activeTab = tab;

        this.selectedItem = 0;

        this.scroll = 0;

        return true;

    }


    // =================================================
    // PRÓXIMA ABA
    // =================================================

    nextTab() {

        const index =
            TAB_ORDER.indexOf(
                this.activeTab
            );

        this.setTab(

            TAB_ORDER[

                (
                    index + 1
                ) % TAB_ORDER.length

            ]

        );

    }


    // =================================================
    // ABA ANTERIOR
    // =================================================

    previousTab() {

        const index =
            TAB_ORDER.indexOf(
                this.activeTab
            );

        this.setTab(

            TAB_ORDER[

                (
                    index - 1 +
                    TAB_ORDER.length
                ) % TAB_ORDER.length

            ]

        );

    }


    // =================================================
    // MOSTRAR NOTIFICAÇÃO
    // =================================================

    notify(
        text,
        duration = 3
    ) {

        this.notification = text;

        this.notificationTime =
            duration;

    }


    // =================================================
    // ATUALIZAR
    // =================================================

    update(dt) {

        if (
            this.notificationTime > 0
        ) {

            this.notificationTime =
                Math.max(

                    0,

                    this.notificationTime - dt

                );

            if (
                this.notificationTime === 0
            ) {

                this.notification = null;

            }

        }

    }


    // =================================================
    // DESENHAR HUD
    // =================================================

    drawHUD(
        ctx,
        player,
        character
    ) {

        if (
            !this.showHUD ||
            !player
        ) {

            return;

        }

        uiPanel(

            ctx,

            4,

            4,

            112,

            50

        );

        // -----------------------------------------
        // NOME E NÍVEL
        // -----------------------------------------

        uiText(

            ctx,

            character?.name ||
            "Viajante",

            10,

            8,

            UI_COLORS.text,

            8

        );

        const level =

            character?.progression?.level ||

            player.level ||

            1;

        uiText(

            ctx,

            "NV " + level,

            88,

            8,

            UI_COLORS.gold

        );

        // -----------------------------------------
        // VIDA
        // -----------------------------------------

        uiText(
            ctx,
            "HP",
            10,
            20
        );

        uiBar(

            ctx,

            28,

            20,

            79,

            5,

            player.health,

            player.maxHealth,

            UI_COLORS.health

        );

        // -----------------------------------------
        // MANA
        // -----------------------------------------

        uiText(
            ctx,
            "MP",
            10,
            30
        );

        uiBar(

            ctx,

            28,

            30,

            79,

            5,

            player.mana || 0,

            player.maxMana || 1,

            UI_COLORS.mana

        );

        // -----------------------------------------
        // RESISTÊNCIA
        // -----------------------------------------

        uiText(
            ctx,
            "ST",
            10,
            40
        );

        uiBar(

            ctx,

            28,

            40,

            79,

            5,

            player.stamina || 0,

            player.maxStamina || 1,

            UI_COLORS.stamina

        );

        // -----------------------------------------
        // MOEDAS
        // -----------------------------------------

        const coins =

            character?.inventory?.gold ??

            character?.inventory?.getCoins?.() ??

            0;

        uiText(

            ctx,

            "MOEDAS " + coins,

            this.width - 83,

            8,

            UI_COLORS.gold

        );

    }


    // =================================================
    // DESENHAR ABAS
    // =================================================

    drawTabs(ctx) {

        const startX = 10;

        const tabWidth = 43;

        for (
            let i = 0;
            i < TAB_ORDER.length;
            i++
        ) {

            const tab =
                TAB_ORDER[i];

            const x =
                startX + i * tabWidth;

            const selected =
                tab === this.activeTab;

            uiRect(

                ctx,

                x,

                13,

                tabWidth - 2,

                UI_CONFIG.TAB_HEIGHT,

                selected

                    ? UI_COLORS.selected

                    : UI_COLORS.panelDark

            );

            uiText(

                ctx,

                TAB_LABELS[tab],

                x + 4,

                18,

                selected

                    ? UI_COLORS.gold

                    : UI_COLORS.textSecondary

            );

        }

    }


    // =================================================
    // DESENHAR FICHA DO PERSONAGEM
    // =================================================

    drawCharacterTab(
        ctx,
        character
    ) {

        if (!character) {

            return;

        }

        const attributes =

            character.attributes?.values ||

            {};

        const className =

            character.characterClass?.name ||

            "Aventureiro";

        const level =

            character.progression?.level ||

            1;

        uiText(

            ctx,

            character.name ||
            "Viajante",

            20,

            39,

            UI_COLORS.gold,

            9

        );

        uiText(

            ctx,

            className +
            " - Nivel " +
            level,

            20,

            53

        );

        const names = {

            strength: "FOR",

            dexterity: "DES",

            constitution: "CON",

            intelligence: "INT",

            wisdom: "SAB",

            charisma: "CAR"

        };

        let index = 0;

        for (
            const [attribute, value] of
            Object.entries(attributes)
        ) {

            const column =
                index < 3 ? 0 : 1;

            const row =
                index % 3;

            const x =
                20 + column * 105;

            const y =
                74 + row * 20;

            uiText(

                ctx,

                (
                    names[attribute] ||
                    attribute
                ) +
                " " +
                value,

                x,

                y,

                UI_COLORS.text

            );

            const modifier =
                Math.floor(
                    (value - 10) / 2
                );

            uiText(

                ctx,

                modifier >= 0
                    ? "+" + modifier
                    : String(modifier),

                x + 60,

                y,

                UI_COLORS.gold

            );

            index++;

        }

        uiText(

            ctx,

            "Experiencia: " +
            (
                character.progression?.experience ||
                0
            ),

            20,

            143,

            UI_COLORS.textSecondary

        );

    }


    // =================================================
    // DESENHAR INVENTÁRIO
    // =================================================

    drawInventoryTab(
        ctx,
        character
    ) {

        const inventory =
            character?.inventory;

        if (!inventory) {

            return;

        }

        const items =
            inventory.items || [];

        this.selectedItem =
            uiClamp(

                this.selectedItem,

                0,

                Math.max(
                    0,
                    items.length - 1
                )

            );

        // -----------------------------------------
        // LISTAGEM
        // -----------------------------------------

        const start = Math.max(

            0,

            Math.min(

                this.selectedItem - 3,

                Math.max(

                    0,

                    items.length -
                    UI_CONFIG.MAX_VISIBLE_ITEMS

                )

            )

        );

        for (
            let i = 0;
            i < UI_CONFIG.MAX_VISIBLE_ITEMS;
            i++
        ) {

            const index =
                start + i;

            const item =
                items[index];

            if (!item) {

                break;

            }

            const y =
                42 + i * 14;

            if (
                index === this.selectedItem
            ) {

                uiRect(

                    ctx,

                    18,

                    y - 2,

                    179,

                    12,

                    UI_COLORS.selected

                );

            }

            uiText(

                ctx,

                item.name,

                23,

                y

            );

            uiText(

                ctx,

                "x" +
                (item.quantity || 1),

                169,

                y,

                UI_COLORS.gold

            );

        }

        // -----------------------------------------
        // ITEM SELECIONADO
        // -----------------------------------------

        const selected =
            items[this.selectedItem];

        uiPanel(

            ctx,

            204,

            37,

            103,

            117

        );

        if (selected) {

            uiText(

                ctx,

                selected.name,

                210,

                44,

                UI_COLORS.gold

            );

            uiText(

                ctx,

                "Tipo: " +
                selected.type,

                210,

                61

            );

            uiText(

                ctx,

                "Raridade:",

                210,

                76

            );

            uiText(

                ctx,

                selected.rarity ||
                "common",

                210,

                87,

                UI_COLORS.rare

            );

            if (
                selected.damage
            ) {

                uiText(

                    ctx,

                    "Dano: " +
                    selected.damage,

                    210,

                    104

                );

            }

            if (
                selected.armor
            ) {

                uiText(

                    ctx,

                    "Defesa: " +
                    selected.armor,

                    210,

                    116

                );

            }

        }

        uiText(

            ctx,

            "Itens: " +
            items.length +
            "/" +
            inventory.slots,

            20,

            151,

            UI_COLORS.textSecondary

        );

    }


    // =================================================
    // DESENHAR EQUIPAMENTOS
    // =================================================

    drawEquipmentTab(
        ctx,
        character
    ) {

        const slots =

            character?.equipment?.slots ||

            {};

        let index = 0;

        for (
            const [slot, item] of
            Object.entries(slots)
        ) {

            const column =
                index < 6 ? 0 : 1;

            const row =
                index % 6;

            const x =
                20 + column * 145;

            const y =
                42 + row * 18;

            uiText(

                ctx,

                slot.replace(
                    /_/g,
                    " "
                ),

                x,

                y,

                UI_COLORS.textSecondary

            );

            uiText(

                ctx,

                item?.name ||
                "Vazio",

                x,

                y + 8,

                item
                    ? UI_COLORS.gold
                    : UI_COLORS.text

            );

            index++;

        }

        const armor =

            character?.equipment?.getArmor?.() ||

            0;

        uiText(

            ctx,

            "Defesa total: " +
            armor,

            20,

            153,

            UI_COLORS.gold

        );

    }


    // =================================================
    // DESENHAR HABILIDADES
    // =================================================

    drawSkillsTab(
        ctx,
        character
    ) {

        const skills =

            character?.skills?.learned

                ? [
                    ...character.skills.learned
                ]

                : [];

        if (
            skills.length === 0
        ) {

            uiText(

                ctx,

                "Nenhuma habilidade aprendida.",

                20,

                43

            );

            return;

        }

        for (
            let i = 0;
            i < Math.min(8, skills.length);
            i++
        ) {

            uiText(

                ctx,

                skills[i],

                20,

                43 + i * 15,

                UI_COLORS.text

            );

        }

    }


    // =================================================
    // DESENHAR MAGIAS
    // =================================================

    drawSpellsTab(
        ctx,
        character
    ) {

        uiText(

            ctx,

            "GRIMORIO",

            20,

            41,

            UI_COLORS.gold,

            9

        );

        const skills =

            character?.skills?.learned

                ? [
                    ...character.skills.learned
                ]

                : [];

        const spells =
            skills.filter(

                id =>

                    id.includes("spell") ||

                    id.includes("fire") ||

                    id.includes("frost") ||

                    id.includes("magic")

            );

        if (
            spells.length === 0
        ) {

            uiText(

                ctx,

                "Nenhuma magia aprendida.",

                20,

                60

            );

        }

        for (
            let i = 0;
            i < Math.min(7, spells.length);
            i++
        ) {

            uiText(

                ctx,

                spells[i],

                20,

                60 + i * 13

            );

        }

    }


    // =================================================
    // DESENHAR MISSÕES
    // =================================================

    drawJournalTab(
        ctx,
        world
    ) {

        const quests =

            world?.getQuestList?.() ||

            [];

        uiText(

            ctx,

            "DIARIO DE AVENTURA",

            20,

            41,

            UI_COLORS.gold,

            9

        );

        if (
            quests.length === 0
        ) {

            uiText(

                ctx,

                "Nenhuma missao registrada.",

                20,

                60

            );

            return;

        }

        for (
            let i = 0;
            i < Math.min(7, quests.length);
            i++
        ) {

            const quest =
                quests[i];

            uiText(

                ctx,

                quest.title,

                20,

                60 + i * 14,

                quest.state === "COMPLETED"
                    ? UI_COLORS.stamina
                    : UI_COLORS.text

            );

            uiText(

                ctx,

                quest.progress +
                "/" +
                quest.required,

                267,

                60 + i * 14,

                UI_COLORS.gold

            );

        }

    }


    // =================================================
    // DESENHAR FABRICAÇÃO
    // =================================================

    drawCraftingTab(
        ctx,
        recipes = {}
    ) {

        uiText(

            ctx,

            "FABRICACAO",

            20,

            41,

            UI_COLORS.gold,

            9

        );

        const entries =
            Object.values(recipes);

        if (
            entries.length === 0
        ) {

            uiText(

                ctx,

                "Nenhuma receita disponivel.",

                20,

                60

            );

            return;

        }

        for (
            let i = 0;
            i < Math.min(7, entries.length);
            i++
        ) {

            const recipe =
                entries[i];

            uiText(

                ctx,

                recipe.name ||
                recipe.id,

                20,

                60 + i * 14

            );

        }

    }


    // =================================================
    // DESENHAR MENU COMPLETO
    // =================================================

    drawMenu(
        ctx,
        game,
        recipes = {}
    ) {

        if (!this.open) {

            return;

        }

        const character =
            game.character;

        const world =
            game.world;

        ctx.save();

        ctx.imageSmoothingEnabled =
            false;

        // -----------------------------------------
        // ESCURECER O JOGO
        // -----------------------------------------

        uiRect(

            ctx,

            0,

            0,

            this.width,

            this.height,

            "rgba(0,0,0,0.84)"

        );

        // -----------------------------------------
        // PAINEL PRINCIPAL
        // -----------------------------------------

        uiPanel(

            ctx,

            6,

            8,

            this.width - 12,

            this.height - 16

        );

        // -----------------------------------------
        // ABAS
        // -----------------------------------------

        this.drawTabs(ctx);

        // -----------------------------------------
        // CONTEÚDO
        // -----------------------------------------

        switch (this.activeTab) {

            case UI_TABS.CHARACTER:

                this.drawCharacterTab(
                    ctx,
                    character
                );

                break;

            case UI_TABS.INVENTORY:

                this.drawInventoryTab(
                    ctx,
                    character
                );

                break;

            case UI_TABS.EQUIPMENT:

                this.drawEquipmentTab(
                    ctx,
                    character
                );

                break;

            case UI_TABS.SKILLS:

                this.drawSkillsTab(
                    ctx,
                    character
                );

                break;

            case UI_TABS.SPELLS:

                this.drawSpellsTab(
                    ctx,
                    character
                );

                break;

            case UI_TABS.JOURNAL:

                this.drawJournalTab(
                    ctx,
                    world
                );

                break;

            case UI_TABS.CRAFTING:

                this.drawCraftingTab(
                    ctx,
                    recipes
                );

                break;

        }

        ctx.restore();

    }


    // =================================================
    // DESENHAR NOTIFICAÇÃO
    // =================================================

    drawNotification(ctx) {

        if (
            !this.notification ||
            this.notificationTime <= 0
        ) {

            return;

        }

        const width = 200;

        const x =
            (this.width - width) / 2;

        uiPanel(

            ctx,

            x,

            55,

            width,

            22

        );

        uiText(

            ctx,

            this.notification,

            x + 8,

            62,

            UI_COLORS.gold

        );

    }


    // =================================================
    // RENDERIZAR INTERFACE
    // =================================================

    draw(
        ctx,
        game,
        recipes = {}
    ) {

        if (
            !ctx ||
            !game
        ) {

            return;

        }

        ctx.save();

        ctx.imageSmoothingEnabled =
            false;

        // -----------------------------------------
        // HUD
        // -----------------------------------------

        if (
            game.player &&
            game.character
        ) {

            this.drawHUD(

                ctx,

                game.player,

                game.character

            );

        }

        // -----------------------------------------
        // MENU
        // -----------------------------------------

        this.drawMenu(

            ctx,

            game,

            recipes

        );

        // -----------------------------------------
        // NOTIFICAÇÕES
        // -----------------------------------------

        this.drawNotification(ctx);

        ctx.restore();

    }


    // =================================================
    // PROCESSAR TECLAS DO MENU
    // =================================================

    handleKey(
        key,
        game
    ) {

        const normalized =
            String(key).toLowerCase();

        // -----------------------------------------
        // ABRIR MENU
        // -----------------------------------------

        if (!this.open) {

            if (
                normalized === "tab"
            ) {

                this.openMenu();

                return true;

            }

            return false;

        }

        // -----------------------------------------
        // FECHAR MENU
        // -----------------------------------------

        if (

            normalized === "escape" ||

            normalized === "tab"

        ) {

            this.closeMenu();

            return true;

        }

        // -----------------------------------------
        // TROCAR ABAS
        // -----------------------------------------

        if (
            normalized === "arrowright"
        ) {

            this.nextTab();

            return true;

        }

        if (
            normalized === "arrowleft"
        ) {

            this.previousTab();

            return true;

        }

        // -----------------------------------------
        // SELECIONAR ITEM
        // -----------------------------------------

        if (
            this.activeTab ===
            UI_TABS.INVENTORY
        ) {

            const items =

                game?.character?.inventory?.items ||

                [];

            if (
                normalized === "arrowdown"
            ) {

                this.selectedItem =
                    uiClamp(

                        this.selectedItem + 1,

                        0,

                        Math.max(
                            0,
                            items.length - 1
                        )

                    );

                return true;

            }

            if (
                normalized === "arrowup"
            ) {

                this.selectedItem =
                    uiClamp(

                        this.selectedItem - 1,

                        0,

                        Math.max(
                            0,
                            items.length - 1
                        )

                    );

                return true;

            }

            if (
                normalized === "enter"
            ) {

                if (
                    typeof game.useSelectedItem ===
                    "function"
                ) {

                    game.selectedInventoryIndex =
                        this.selectedItem;

                    game.useSelectedItem();

                }

                return true;

            }

        }

        return true;

    }

}


// =====================================================
// INSTÂNCIA COMPARTILHADA
// =====================================================

export const ui =
    new GameUI();


// =====================================================
// FIM DO UI.JS
// =====================================================
