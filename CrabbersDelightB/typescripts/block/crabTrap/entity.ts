import { Dimension, Entity, ItemStack, Vector3, world, Block, ScoreboardObjective, Container, EntityInventoryComponent, system, BlockVolume, ItemDurabilityComponent } from "@minecraft/server";
import ObjectUtil from "../../lib/ObjectUtil";
import { EventAPI } from "../../lib/EventAPI";
import { RandomAPI } from "../../lib/RandomAPI";
import { ItemAPI } from "../../lib/ItemAPI";
const scoreboard = world.scoreboard;

class BlockEntity {
    //获取方块实体数据
    public blockEntityData(entity: Entity): BlockEntityData | undefined {
        try {
            const dimension: Dimension = entity?.dimension ?? undefined;
            const blockEntityDataLocation = entity.getDynamicProperty('crabbersdelight:blockEntityDataLocation') as Vector3;
            const block = dimension.getBlock(blockEntityDataLocation) as Block;
            const scoreboardObjective = scoreboard.getObjective(entity.typeId + entity.id) ?? null;
            const blockEntityData: BlockEntityData = { entity: entity, dimension: dimension, blockEntityDataLocation: blockEntityDataLocation, block: block, scoreboardObjective: scoreboardObjective }
            return blockEntityData;
        } catch (error) {
            return undefined;
        }
    };
    //对使用容器组件存储物品的方块实体检测掉落
    public entityContainerLoot(args: BlockEntityData, id: string) {
        if (!ObjectUtil.isEqual(args.entity.location, args.blockEntityDataLocation)) args.entity.teleport(args.blockEntityDataLocation);
        if (args.block?.typeId == id) return;
        const entity = args.entity as Entity;
        const dimension = args.dimension;
        const inventory = entity.getComponent("inventory") as EntityInventoryComponent
        const container = inventory.container as Container;
        for (let i = 0, length = container.size; i < length; i++) {
            const itemStack = container.getItem(i)
            if (itemStack) {
                dimension.spawnItem(itemStack, entity.location)
            }
        };
        BlockEntity.clearEntity(args);
    };
    //清除方块实体
    public static clearEntity(args: BlockEntityData) {
        if (args.scoreboardObjective) {
            scoreboard.removeObjective(args.entity.typeId + args.entity.id);
        }
        system.runTimeout(() => {
            args.entity.remove();
        });
    }
}
interface BlockEntityData {
    readonly entity: Entity,
    readonly dimension: Dimension,
    readonly blockEntityDataLocation: Vector3,
    readonly block: Block,
    readonly scoreboardObjective: ScoreboardObjective | null
}

export class CrabTrapEntity extends BlockEntity {
    @EventAPI.register(world.afterEvents.dataDrivenEntityTrigger, { entityTypes: ["crabbersdelight:crab_trap"], eventTypes: ["crabbersdelight:crab_trap_tick"] })
    tick(args: any) {
        const entityBlockData = super.blockEntityData(args.entity);
        if (!entityBlockData) return;
        const entity: Entity = entityBlockData.entity;
        super.entityContainerLoot(entityBlockData, entity.typeId);
        const chumMap: { [key: string]: string } = {
            "crabbersdelight:bucket_of_clam_chum": "crabbersdelight:clam",
            "crabbersdelight:bucket_of_clawster_chum": "crabbersdelight:raw_clawster",
            "crabbersdelight:bucket_of_crab_chum": "crabbersdelight:raw_crab",
            "crabbersdelight:bucket_of_shrimp_chum": "crabbersdelight:raw_shrimp"
        }
        const fishList = [
            "minecraft:cod",
            "minecraft:salmon",
            "minecraft:tropical_fish",
            "minecraft:pufferfish",
        ];
        if (!CrabTrapEntity.hasWaterNearby(entity)) return;

        const inventory = entity.getComponent("inventory") as EntityInventoryComponent;
        const container = inventory?.container
        if (!container) return;
        const progress: number = entity.getDynamicProperty("crabbersdelight:crab_trap_progress")  as number?? 0;
        const chumItem = container.getItem(0)?.typeId;
        for (let i = 1; i < 28; i++) {
            const slot = container.getSlot(i)
            if (slot.hasItem()){
                const hasItem = container.getSlot(i).typeId
                if (hasItem == "farmersdelight:fire_0" || hasItem == "farmersdelight:cooking_pot_arrow_0") {
                    container.setItem(i,undefined)
                    console.warn("捕蟹笼：删除非法物品")
                }
            }
           
        }
        if (!chumItem || !(chumItem in chumMap) && !fishList.includes(chumItem)) {
            CrabTrapEntity.handleEmptyChumItem(container, entity, progress);
            return;
        }
       
        CrabTrapEntity.handleChumItemProcessing(chumItem, container, entity, progress, chumMap, fishList);
    }

    static hasWaterNearby(entity: Entity): boolean {
        const { x, y, z }: Vector3 = entity.location;
        const fromLocation = { x: x - 1, y: y - 1, z: z - 1 };
        const toLocation = { x: x + 1, y: y + 1, z: z + 1 };
        const detectLocs = new BlockVolume(fromLocation, toLocation).getBlockLocationIterator();

        let hasWater: number = 0;
        for (const location of detectLocs) {
            const block = entity.dimension.getBlock(location);
            if (block?.typeId === 'minecraft:water') {
                hasWater += 1;
            }
        }
        return (hasWater + 1) >= 25;
    }

    static handleEmptyChumItem(container: Container, entity: Entity, progress: number): void {
        if (progress === 20 * 2000) {
            CrabTrapEntity.handleLootReplacement(container, entity);
            entity.setDynamicProperty("crabbersdelight:crab_trap_progress", 0);
        } else {
            entity.setDynamicProperty("crabbersdelight:crab_trap_progress", progress + 1);
        }
    }

    static handleLootReplacement(container: Container, entity: Entity): void {
        for (let i = 1; i < 28; i++) {
            const hasItem = container.getSlot(i).hasItem();
            if (!hasItem) {
                entity.runCommandAsync(`loot replace entity @s slot.inventory ${i} loot "crabbersdelight/gameplay/crab_trap_air"`);
                break;
            }
        }
    }

    static handleChumItemProcessing(chumItem: string, container: Container, entity: Entity, progress: number, chumMap: { [key: string]: string }, fishList: string[]): void {
        if (chumItem in chumMap) {
            CrabTrapEntity.handleChumProcessing(container, entity, progress, chumItem, chumMap);
        } else if (fishList.includes(chumItem)) {
            CrabTrapEntity.handleFishProcessing(container, entity, progress, chumItem);
        }
    }

    static handleChumProcessing(container: Container, entity: Entity, progress: number, chumItem: string, chumMap: { [key: string]: string }): void {
        if (progress >= 20 * 200) {
            CrabTrapEntity.replaceLootAndHandleDurability(container, entity, chumItem, chumMap);
        } else {
            entity.setDynamicProperty("crabbersdelight:crab_trap_progress", progress + 1);
        }
    }

    static replaceLootAndHandleDurability(container: Container, entity: Entity, chumItem: string, chumMap: { [key: string]: string }): void {
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

    static handleItemDurability(container: Container, entity: Entity): void {
        const itemStack = container.getItem(0);
        if (!itemStack) return;

        const durability = itemStack.getComponent('minecraft:durability') as ItemDurabilityComponent;
        if (!durability) return;

        const maxDurability = durability.maxDurability;
        const currentDamage = durability.damage;

        if (maxDurability > currentDamage) {
            durability.damage += 1;
            container.setItem(0, itemStack);
        } else {
            container.setItem(0, new ItemStack('minecraft:bucket'));
        }
    }

    static handleFishProcessing(container: Container, entity: Entity, progress: number, chumItem: string): void {
        if (progress >= 20 * 200) {
            
            CrabTrapEntity.replaceLootWithFish(container, entity, chumItem);
        } else {
            entity.setDynamicProperty("crabbersdelight:crab_trap_progress", progress + 1);

        }
    }

    static replaceLootWithFish(container: Container, entity: Entity, chumItem: string): void {
        for (let i = 1; i < 28; i++) {
            const hasItem = container.getSlot(i).hasItem();
            if (!hasItem) {
                entity.runCommandAsync(`loot replace entity @s slot.inventory ${i} loot "crabbersdelight/gameplay/crab_trap_${chumItem.split("minecraft:")[1]}"`);
                ItemAPI.clear(entity,0)
                break;
            }
        }
        entity.setDynamicProperty("crabbersdelight:crab_trap_progress", 0);
    }
}
