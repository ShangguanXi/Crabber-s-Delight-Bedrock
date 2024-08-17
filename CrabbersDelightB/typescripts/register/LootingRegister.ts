import { EntityEquippableComponent, EntityHurtAfterEvent, EquipmentSlot, ItemStack, world } from "@minecraft/server"
import { EventAPI } from "../lib/EventAPI"
import { RandomAPI } from "../lib/RandomAPI";
import { ItemAPI } from "../lib/ItemAPI";

export class LootingRegister {
    @EventAPI.register(world.afterEvents.entityHurt)
    knifeLoot(args: EntityHurtAfterEvent) {
        const entity = args.damageSource.damagingEntity
        const hurtEntity = args.hurtEntity
        if (!entity || !hurtEntity)
            return;
        const equipment = entity.getComponent(EntityEquippableComponent.componentId);
        const onFire = hurtEntity.getComponent('minecraft:onfire')?.onFireTicksRemaining;
        const mainHand = equipment?.getEquipmentSlot(EquipmentSlot.Mainhand);
        if(!mainHand)return;
        if (!mainHand?.hasTag('farmersdelight:is_knife')) return;
        const health = hurtEntity.getComponent('minecraft:health');
        if (!health?.currentValue && hurtEntity.typeId === 'minecraft:squid') {
            if (onFire != undefined) {
                try {
                    ItemAPI.spawn(hurtEntity, 'crabbersdelight:cooked_squid_tentacles', RandomAPI.RandomInt(2));
                }
                catch (error) {
                }
            } else {
                try {
                    ItemAPI.spawn(hurtEntity, 'crabbersdelight:raw_squid_tentacles', RandomAPI.RandomInt(2));
                }
                catch (error) {
                }
            }
        }
        if (!health?.currentValue && hurtEntity.typeId === 'minecraft:glow_squid') {
            if (onFire != undefined) {
                try {
                    ItemAPI.spawn(hurtEntity, 'crabbersdelight:cooked_glow_squid_tentacles', RandomAPI.RandomInt(2));
                }
                catch (error) {
                }
            } else {
                try {
                    ItemAPI.spawn(hurtEntity, 'crabbersdelight:raw_glow_squid_tentacles', RandomAPI.RandomInt(2));
                }
                catch (error) {
                }
            }
        }
        if (!health?.currentValue && hurtEntity.typeId === 'minecraft:frog') {
            if (onFire != undefined) {
                try {
                    ItemAPI.spawn(hurtEntity, 'crabbersdelight:cooked_frog_leg', RandomAPI.RandomInt(2));
                }
                catch (error) {
                }
            } else {
                try {
                    ItemAPI.spawn(hurtEntity, 'crabbersdelight:raw_frog_leg', RandomAPI.RandomInt(2));
                }
                catch (error) {
                }
            }
        }
    }
    
    @EventAPI.register(world.afterEvents.entityHurt)
    Loot(args: EntityHurtAfterEvent) {
        const entity = args.damageSource.damagingEntity
        const hurtEntity = args.hurtEntity
        if (!entity || !hurtEntity)
            return;
        const seaFood = ['crabbersdelight:raw_shrimp','crabbersdelight:raw_clawster','crabbersdelight:raw_crab','crabbersdelight:clam']
        const health = hurtEntity.getComponent('minecraft:health');
        if (!health?.currentValue && (hurtEntity.typeId == 'minecraft:guardian'||hurtEntity.typeId == 'minecraft:elder_guardian')) {
            ItemAPI.spawn(hurtEntity, seaFood[RandomAPI.RandomInt(2)], 1);
        }
    }
}