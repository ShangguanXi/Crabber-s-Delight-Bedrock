import { ItemStopUseAfterEvent, world } from "@minecraft/server";
import { EventAPI } from "../lib/EventAPI";
export class Foodsregister {
    @EventAPI.register(world.afterEvents.itemStopUse)
    eat(args: ItemStopUseAfterEvent) {
        const itemStack = args.itemStack;
        const player = args.source
        const useDuration = args.useDuration
        if (itemStack && useDuration == 0) {
            switch (itemStack.typeId) {
                case "crabbersdelight:sea_pickle_juice":
                    player.addEffect('water_breathing', 3600, { amplifier: 0 });
                    player.addEffect('nausea', 300, { amplifier: 0 });
                    break;
                
            }
        }
    }
}