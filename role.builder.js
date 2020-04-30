var roleBuilder = {
    
    run: function(creep) {
        if (creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory["mode"] = "pickup";
            creep.memory["target"] = null;
        } else if (creep.memory["mode"] == "pickup" && creep.store.getFreeCapacity() == 0) {
            builderChooseNonPickupMode(creep);
        }


        if (creep.memory["mode"] == "pickup") {
            var target = findEnergy(creep);
            if (target) {
                var res = takeEnergy(creep, target);
                if (res == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else {
                builderChooseNonPickupMode(creep);
            }            
        } if (creep.memory["mode"] == "build") {
            var target = findBuild(creep);
            if(target) {
                var res = creep.build(target)
                if(res == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                } else if (res == OK) {
                    creepRecordEnergyUse(creep, "build")
                }
            } else {
                builderChooseNonPickupMode(creep);
            }
        } if (creep.memory["mode"] == "repair") {
            var target = findRepair(creep);
            if(target) {
                var res = creep.repair(target)
                if(res == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                } else if (res == OK) {
                    creepRecordEnergyUse(creep, "repair")
                }
            } else {
                builderChooseNonPickupMode(creep);
            }
        }
        if (!creep.memory["target"]) {
            recordEnergyUse(Game.spawns[creep.memory["spawn"]], "idleBuilder",
                            creepCostPerTick(creep));
            clearRoad(creep);
        }
    }
    
};

builderChooseNonPickupMode = function(creep) {
    creep.memory["target"] = null;
    var target;
    if (Math.random() < 0.9) {
        target = findBuild(creep);
        if (target) {
            creep.memory["mode"] = "build";
        } else {
            findRepair(creep);
            creep.memory["mode"] = "repair";
        }
    } else {
        target = findRepair(creep);
        if (target) {
            creep.memory["mode"] = "repair";
        } else {
            findBuild(creep);
            creep.memory["mode"] = "build";
        }
    }
}

findBuild = function(creep) {
    var target;
    if (creep.memory["target"]) {
        target = Game.getObjectById(creep.memory["target"]);
        if (target) { return target; }
    }
    var filter = site => site.structureType == STRUCTURE_ROAD;
    target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, { filter: filter });
    if (!target) { 
        target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    }
    if (target) {
        creep.memory["target"] = target.id;
        return target;
    }
    creep.memory["target"] = null;
    return null;
}

findRepair = function(creep) {
    var target;
    if (creep.memory["target"]) {
        target = Game.getObjectById(creep.memory["target"]);
        if (target && target.hits < target.hitsMax) { return target; }
    }
    var filter = object => object.hits < (object.hitsMax / 2) &&
        object.structureType != STRUCTURE_ROAD;
    target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: filter });
    if (!target) {
        filter = object => object.hits < object.hitsMax &&
            object.structureType != STRUCTURE_ROAD;
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: filter });
    }
    if (!target) {
        filter = object => object.hits < (object.hitsMax / 2);
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: filter });
    }
    if (!target) {
        filter = object => object.hits < object.hitsMax;
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: filter });
    }
    if (target) {
        creep.memory["target"] = target.id;
        return target;
    }
    creep.memory["target"] = null;
    return null;
}

module.exports = roleBuilder;
