import { Dimension, Entity, ItemStack, Vector3, world, Block, ScoreboardObjective, Container, EntityInventoryComponent, system } from "@minecraft/server";
import ObjectUtil from "../../lib/ObjectUtil";
import {EventAPI} from "../../lib/EventAPI";
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
    public entityContainerLoot(args: BlockEntityData, id: string){
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
interface BlockEntityData{
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
        const { x, y, z }: Vector3 = entity.location;
        const block: Block = entityBlockData.block;
        const inventory = entity.getComponent("inventory") as EntityInventoryComponent
        const container = inventory.container;
        if (!container) return;
        const progress: number = entity.getDynamicProperty("crabbersdelight:crab_trap_progress") as number ?? 0
        console.warn(entity.dimension.getBlock({ x, y, z })?.typeId,block.typeId)
        
    }
}