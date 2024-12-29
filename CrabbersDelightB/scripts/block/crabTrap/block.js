var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { PlayerPlaceBlockAfterEvent, world } from "@minecraft/server";
import ObjectUtil from "../../lib/ObjectUtil";
import { EventAPI } from "../../lib/EventAPI";
const scoreboard = world.scoreboard;
class BlockWithEntity {
    //名为setblock实际上是放置对应方块实体的实体，若成功则返回放置的实体
    setBlock(dimension, location, entityId) {
        const entity = dimension.spawnEntity(entityId, location);
        entity.setDynamicProperty("crabbersdelight:blockEntityDataLocation", location);
        entity.setDynamicProperty("crabbersdelight:entityId", entity.id);
        return entity;
    }
    //获取方块实体数据
    entityBlockData(block, opt) {
        const dimension = block.dimension;
        const entities = dimension.getEntitiesAtBlockLocation(opt.location);
        let entityBlock = undefined;
        for (const entity of entities) {
            if (ObjectUtil.isEqual(entity.getDynamicProperty('crabbersdelight:blockEntityDataLocation'), entity.location) &&
                entity.id == entity.getDynamicProperty("crabbersdelight:entityId") &&
                entity.typeId == opt.type) {
                entityBlock = entity;
                break;
            }
            ;
        }
        ;
        if (!entityBlock)
            return undefined;
        const scoreboardObjective = scoreboard.getObjective(entityBlock.typeId + entityBlock.id) ?? null;
        const blockEntityDataLocation = entityBlock.getDynamicProperty('crabbersdelight:blockEntityDataLocation');
        return { block: block, dimension: dimension, entity: entityBlock, scoreboardObjective: scoreboardObjective, blockEntityDataLocation: blockEntityDataLocation };
    }
}
export class CrabTrap extends BlockWithEntity {
    placeBlock(args) {
        const block = args.block;
        if (block.typeId != "crabbersdelight:crab_trap")
            return;
        const { x, y, z } = block.location;
        const entity = super.setBlock(args.block.dimension, { x: x + 0.5, y: y, z: z + 0.5 }, block.typeId);
        entity.nameTag = `tile.${entity.typeId}.name`;
    }
}
__decorate([
    EventAPI.register(world.afterEvents.playerPlaceBlock),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PlayerPlaceBlockAfterEvent]),
    __metadata("design:returntype", void 0)
], CrabTrap.prototype, "placeBlock", null);
//# sourceMappingURL=block.js.map