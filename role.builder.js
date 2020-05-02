var roleBuilder = {
    
    run: function(creep) {
        if (creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory["mode"] = "pickup";
            creep.memory["target"] = null;
        } else if (creep.memory["mode"] == "pickup" && creep.store.getFreeCapacity() == 0) {
            builderChooseNonPickupMode(creep);
        }


        if (creep.memory["mode"] == "pickup") {
            var target = findEnergy(creep, { avoidStorageLevel: 0 });
            if (target) {
                var res = takeEnergy(creep, target);
                if (res == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else {
                builderChooseNonPickupMode(creep);
            }            
        } if (creep.memory["mode"] == "build") {
            var target = findBuild(creep, builderBuildFilter(creep));
            if(target) {
                var res = creep.build(target)
                if(res == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                } else if (res == OK) {
                    creepRecordEnergyUse(creep, "build");
                }
            } else {
                builderChooseNonPickupMode(creep);
            }
        } if (creep.memory["mode"] == "repair") {
            var filter = builderRepairFilter(creep);
            var target = findRepair(creep, filter);
            if(target) {
                var res = creep.repair(target)
                if(res == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                } else if (res == OK) {
                    creepRecordEnergyUse(creep, "repair");
                }
            } else {
                builderChooseNonPickupMode(creep);
            }
        }
        if (!creep.memory["target"]) {
            recordEnergyUse(Game.spawns[creep.memory["spawn"]], "idleBuilder",
                            creepCostPerTick(creep));
            clearRoad(creep);
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                creep.memory["mode"] = "pickup";
                creep.memory["target"] = null;
            }
        }
    }
    
};

builderChooseNonPickupMode = function(creep) {
    creep.memory["target"] = null;
    var target;

    var spawn = Game.spawns[creep.memory["spawn"]]
    if (hasTower(spawn)) {
        findBuild(creep, builderBuildFilter(creep));
        creep.memory["mode"] = "build";
        return;
    }
    
    if (Math.random() < 0.9) {
        target = findBuild(creep, builderBuildFilter(creep));
        if (target) {
            creep.memory["mode"] = "build";
        } else {
            var filter = builderRepairFilter(creep);
            findRepair(creep, filter);
            creep.memory["mode"] = "repair";
        }
    } else {
        var filter = builderRepairFilter(creep);
        target = findRepair(creep, filter);
        if (target) {
            creep.memory["mode"] = "repair";
        } else {
            findBuild(creep, builderBuildFilter(creep));
            creep.memory["mode"] = "build";
        }
    }
}

findBuild = function(creep, additionalFilter = (site => true)) {
    var target;
    if (creep.memory["target"]) {
        target = Game.getObjectById(creep.memory["target"]);
        if (target) { return target; }
    }
    var filter = (site => site.structureType == STRUCTURE_ROAD
                  && additionalFilter(site));
    target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, { filter: filter });
    if (!target) {
        filter = additionalFilter;
        target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, { filter: filter });
    }
    if (target) {
        creep.memory["target"] = target.id;
        return target;
    }
    creep.memory["target"] = null;
    return null;
}

findRepair = function(creep, additionalFilter = (structure => true)) {
    var target;
    if (creep.memory && creep.memory["target"]) {
        target = Game.getObjectById(creep.memory["target"]);
        if (target && target.hits < targetHits(target)) { return target; }
    }
    target = null;
    var filter;

    if (!target) {
        filter = object => object.hits == 1 &&
            additionalFilter(object);
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: filter });
    }
    if (!target) {
        filter = object => object.hits < (targetHits(object) / 2) &&
            object.structureType != STRUCTURE_ROAD &&
            additionalFilter(object);
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: filter });
    }
    if (!target) {
        filter = object => object.hits < targetHits(object) &&
            object.structureType != STRUCTURE_ROAD &&
            additionalFilter(object);
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: filter });
    }
    if (!target) {
        filter = object => object.hits < (targetHits(object) / 2) &&
            additionalFilter(object);
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: filter });
    }
    if (!target) {
        filter = object => object.hits < targetHits(object) &&
            additionalFilter(object);
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: filter });
    }
    if (target) {
        if (creep.memory) { creep.memory["target"] = target.id; }
        return target;
    }
    if (creep.memory) { creep.memory["target"] = null; }
    return null;
}

builderRepairFilter = function(creep) {
    return (structure => (creep.pos.inRangeTo(structure, 15) ||
                          (creep.ticksToLive > 500 &&
                           creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0)));
}

builderBuildFilter = function(creep) {
    return (site => (creep.pos.inRangeTo(site, 10) ||
                     (creep.ticksToLive > 3*creep.pos.getRangeTo(site) &&
                      creep.store[RESOURCE_ENERGY] >= 0.8*creep.store.getCapacity(RESOURCE_ENERGY))));
}
            

module.exports = roleBuilder;
