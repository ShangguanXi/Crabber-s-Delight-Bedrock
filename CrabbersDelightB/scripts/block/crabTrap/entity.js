var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ItemStack, world, system, BlockVolume } from "@minecraft/server";
import ObjectUtil from "../../lib/ObjectUtil";
import { EventAPI } from "../../lib/EventAPI";
import { ItemAPI } from "../../lib/ItemAPI";
const scoreboard = world.scoreboard;
class BlockEntity {
    //获取方块实体数据
    blockEntityData(entity) {
        try {
            const dimension = entity?.dimension ?? undefined;
            const blockEntityDataLocation = entity.getDynamicProperty('crabbersdelight:blockEntityDataLocation');
            const block = dimension.getBlock(blockEntityDataLocation);
            const scoreboardObjective = scoreboard.getObjective(entity.typeId + entity.id) ?? null;
            const blockEntityData = { entity: entity, dimension: dimension, blockEntityDataLocation: blockEntityDataLocation, block: block, scoreboardObjective: scoreboardObjective };
            return blockEntityData;
        }
        catch (error) {
            return undefined;
        }
    }
    ;
    //对使用容器组件存储物品的方块实体检测掉落
    entityContainerLoot(args, id) {
        if (!ObjectUtil.isEqual(args.entity.location, args.blockEntityDataLocation))
            args.entity.teleport(args.blockEntityDataLocation);
        if (args.block?.typeId == id)
            return;
        const entity = args.entity;
        const dimension = args.dimension;
        const inventory = entity.getComponent("inventory");
        const container = inventory.container;
        for (let i = 0, length = container.size; i < length; i++) {
            const itemStack = container.getItem(i);
            if (itemStack) {
                dimension.spawnItem(itemStack, entity.location);
            }
        }
        ;
        BlockEntity.clearEntity(args);
    }
    ;
    //清除方块实体
    static clearEntity(args) {
        if (args.scoreboardObjective) {
            scoreboard.removeObjective(args.entity.typeId + args.entity.id);
        }
        system.runTimeout(() => {
            args.entity.remove();
        });
    }
}
export class CrabTrapEntity extends BlockEntity {
    tick(args) {
        const entityBlockData = super.blockEntityData(args.entity);
        if (!entityBlockData)
            return;
        const entity = entityBlockData.entity;
        super.entityContainerLoot(entityBlockData, entity.typeId);
        const chumMap = {
            "crabbersdelight:bucket_of_clam_chum": "crabbersdelight:clam",
            "crabbersdelight:bucket_of_clawster_chum": "crabbersdelight:raw_clawster",
            "crabbersdelight:bucket_of_crab_chum": "crabbersdelight:raw_crab",
            "crabbersdelight:bucket_of_shrimp_chum": "crabbersdelight:raw_shrimp"
        };
        const fishList = [
            "minecraft:cod",
            "minecraft:salmon",
            "minecraft:tropical_fish",
            "minecraft:pufferfish",
        ];
        if (!CrabTrapEntity.hasWaterNearby(entity))
            return;
        const inventory = entity.getComponent("inventory");
        const container = inventory?.container;
        if (!container)
            return;
        const progress = entity.getDynamicProperty("crabbersdelight:crab_trap_progress") ?? 0;
        const chumItem = container.getItem(0)?.typeId;
        for (let i = 1; i < 28; i++) {
            const slot = container.getSlot(i);
            if (slot.hasItem()) {
                const hasItem = container.getSlot(i).typeId;
                if (hasItem == "farmersdelight:fire_0" || hasItem == "farmersdelight:cooking_pot_arrow_0") {
                    container.setItem(i, undefined);
                    console.warn("捕蟹笼：删除非法物品");
                }
            }
        }
        if (!chumItem || !(chumItem in chumMap) && !fishList.includes(chumItem)) {
            CrabTrapEntity.handleEmptyChumItem(container, entity, progress);
            return;
        }
        CrabTrapEntity.handleChumItemProcessing(chumItem, container, entity, progress, chumMap, fishList);
    }
    static hasWaterNearby(entity) {
        const { x, y, z } = entity.location;
        const fromLocation = { x: x - 5, y: y - 5, z: z - 5 };
        const toLocation = { x: x + 5, y: y + 5, z: z + 5 };
        const detectLocs = new BlockVolume(fromLocation, toLocation).getBlockLocationIterator();
        let hasWater = 0;
        for (const location of detectLocs) {
            const block = entity.dimension.getBlock(location);
            if (block?.typeId === 'minecraft:water') {
                hasWater += 1;
            }
        }
        return (hasWater + 1) >= 60;
    }
    static handleEmptyChumItem(container, entity, progress) {
        if (progress === 20 * 2000) {
            CrabTrapEntity.handleLootReplacement(container, entity);
            entity.setDynamicProperty("crabbersdelight:crab_trap_progress", 0);
        }
        else {
            entity.setDynamicProperty("crabbersdelight:crab_trap_progress", progress + 1);
        }
    }
    static handleLootReplacement(container, entity) {
        for (let i = 1; i < 28; i++) {
            const hasItem = container.getSlot(i).hasItem();
            if (!hasItem) {
                entity.runCommandAsync(`loot replace entity @s slot.inventory ${i} loot "crabbersdelight/gameplay/crab_trap_air"`);
                break;
            }
        }
    }
    static handleChumItemProcessing(chumItem, container, entity, progress, chumMap, fishList) {
        if (chumItem in chumMap) {
            CrabTrapEntity.handleChumProcessing(container, entity, progress, chumItem, chumMap);
        }
        else if (fishList.includes(chumItem)) {
            CrabTrapEntity.handleFishProcessing(container, entity, progress, chumItem);
        }
    }
    static handleChumProcessing(container, entity, progress, chumItem, chumMap) {
        if (progress >= 20 * 200) {
            CrabTrapEntity.replaceLootAndHandleDurability(container, entity, chumItem, chumMap);
        }
        else {
            entity.setDynamicProperty("crabbersdelight:crab_trap_progress", progress + 1);
        }
    }
    static replaceLootAndHandleDurability(container, entity, chumItem, chumMap) {
        for (let i = 1; i < 28; i++) {
            const hasItem = container.getSlot(i).hasItem();
            if (!hasItem) {
                container.setItem(i, new ItemStack(chumMap[chumItem], 1));
                CrabTrapEntity.handleItemDurability(container, entity);
                break;
            }
        }
        entity.setDynamicProperty("crabbersdelight:crab_trap_progress", 0);
    }
    static handleItemDurability(container, entity) {
        const itemStack = container.getItem(0);
        if (!itemStack)
            return;
        const durability = itemStack.getComponent('minecraft:durability');
        if (!durability)
            return;
        const maxDurability = durability.maxDurability;
        const currentDamage = durability.damage;
        if (maxDurability > currentDamage) {
            durability.damage += 1;
            container.setItem(0, itemStack);
        }
        else {
            container.setItem(0, new ItemStack('minecraft:bucket'));
        }
    }
    static handleFishProcessing(container, entity, progress, chumItem) {
        if (progress >= 20 * 200) {
            CrabTrapEntity.replaceLootWithFish(container, entity, chumItem);
        }
        else {
            entity.setDynamicProperty("crabbersdelight:crab_trap_progress", progress + 1);
        }
    }
    static replaceLootWithFish(container, entity, chumItem) {
        for (let i = 1; i < 28; i++) {
            const hasItem = container.getSlot(i).hasItem();
            if (!hasItem) {
                entity.runCommandAsync(`loot replace entity @s slot.inventory ${i} loot "crabbersdelight/gameplay/crab_trap_${chumItem.split("minecraft:")[1]}"`);
                ItemAPI.clear(entity, 0);
                break;
            }
        }
        entity.setDynamicProperty("crabbersdelight:crab_trap_progress", 0);
    }
}
__decorate([
    EventAPI.register(world.afterEvents.dataDrivenEntityTrigger, { entityTypes: ["crabbersdelight:crab_trap"], eventTypes: ["crabbersdelight:crab_trap_tick"] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CrabTrapEntity.prototype, "tick", null);
//# sourceMappingURL=entity.js.map