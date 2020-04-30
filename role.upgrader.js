var roleUpgrader = {
    
    run: function(creep) {

        if (creep.store[RESOURCE_ENERGY] == 0 || creep.store[RESOURCE_ENERGY] < upgradeCapacity(creep)-2) {
            creep.memory["mode"] = "pickup";
            creep.memory["target"] = null;
        } else if (creep.memory["mode"] == "pickup" && creep.store.getFreeCapacity() == 0) {
            creep.memory["mode"] = "upgrade";
            creep.memory["target"] = null;
        }
        
        var controller = Game.spawns[creep.memory["spawn"]].room.controller;
        if (!creep.pos.inRangeTo(controller, 10)) {
            creep.moveTo(controller);
        } else {
            if (creep.memory["mode"] == "pickup") {
                var target = findEnergy(creep, {
                    filter: target => target.pos.inRangeTo(controller, 9)
                });
                if (target) {
                    var res = takeEnergy(creep, target);
                    if (res == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                } else {
                    creep.memory["mode"] = "upgrade";
                    creep.memory["target"] = null;
                    if (creep.store[RESOURCE_ENERGY] == 0) {
                        recordEnergyUse(Game.spawns[creep.memory["spawn"]], "missingForUpgrade",
                                        upgradeCapacity(creep));
                    }
                }            
            }
            if (creep.memory["mode"] == "upgrade") {
                var res = creep.upgradeController(controller);
                if (res == ERR_NOT_IN_RANGE) {
                    creep.moveTo(controller);
                } else if (res == OK) {
                    creepRecordEnergyUse(creep, "upgradeController")
                }
            }
        }
    }
    
};

upgradeCapacity = function(creep) {
    var capacity = 0;
    for (var i = 0; i < creep.body.length; i++) {
        if (creep.body[i].type == WORK) { capacity += 1; }
    }
    return capacity;
}

module.exports = roleUpgrader;
