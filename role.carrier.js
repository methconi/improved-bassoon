var roleCarrier = {
    
    run: function(creep) {
        creep.memory["idle"] = false;
        
        if (creep.store[RESOURCE_ENERGY] == 0 && !(creep.mode == "pickup")) {
            creep.memory["mode"] = "pickup";
            creep.memory["target"] = null;
        } else if (creep.memory["mode"] == "pickup" && creep.store.getFreeCapacity() == 0) {
            carrierChooseNonPickupMode(creep);
        }

        if (creep.memory["mode"] == "pickup") {
            /*var opts = {};
            if (creep.memory["onlyUpgrade"]) {
                opts.avoidStorageLevel = 1;
            } else {
                opts.avoidStorageLevel = 2;
            }**/
            var target = findEnergy(creep/*, opts*/);
            if (target) {
                var res = takeEnergy(creep, target);
                if (res == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else if (creep.store[RESOURCE_ENERGY] > 0) {
                carrierChooseNonPickupMode(creep);
            } else {
                recordEnergyUse(Game.spawns[creep.memory["spawn"]], "idleCarry",
                                creepCostPerTick(creep));
            }
        } if (creep.memory["mode"] == "store") {
            var target = findSpawnOrExtension(creep);
            if (target) {
                var res = creep.transfer(target, RESOURCE_ENERGY);
                if (res == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else if (creep.store.getFreeCapacity() == 0) {
                if (creep.memory["waited"]) {
                    carrierChooseNonPickupMode(creep);
                    creep.memory["waited"] = false;
                } else {
                    creep.memory["waited"] = true;
                }
            } else {
                creep.memory["mode"] = "pickup";
                creep.memory["target"] = null;
            }
        } if (creep.memory["mode"] == "drop") {
            var target = Game.getObjectById(creep.memory["target"]);
            if (target) {
                if (creep.pos.inRangeTo(target, creep.memory["distance"])) {
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: structure => (structure.store &&
                                              structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) });
                    if (target && (creep.transfer(target, RESOURCE_ENERGY) == OK)) {}
                    else { creep.drop(RESOURCE_ENERGY); }
                    creepRecordEnergyUse(creep, "droppedToController");
                } else {
                    creep.moveTo(target);
                }
            } else {
                carrierChooseNonPickupMode(creep);
            }
        }
    }

};
            
findSpawnOrExtension = function(creep) {
    if (creep.memory["target"]) {
        var target = Game.getObjectById(creep.memory["target"]);
        if (target && target.store && target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            return target;
        }
    }
    var target = null;
    var filter;

    if (!target) {
        filter = object => (object.structureType == STRUCTURE_SPAWN ||
                            object.structureType == STRUCTURE_EXTENSION)
            && object.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: filter });
    }
    if (!target) {
        filter = object => object.structureType == STRUCTURE_TOWER
            && (object.store.getFreeCapacity(RESOURCE_ENERGY) >
                object.store.getCapacity(RESOURCE_ENERGY) * 0.5);
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: filter });
    }
    if (!target) {
        filter = object => object.structureType == STRUCTURE_TOWER
            && (object.store.getFreeCapacity(RESOURCE_ENERGY) >
                object.store.getCapacity(RESOURCE_ENERGY) * 0.8;
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: filter });
    }
    
    if (target) {
        creep.memory["target"] = target.id;
        return target;
    } else {
        return null;
    }
}
    
carrierChooseNonPickupMode = function(creep) {
    creep.memory["target"] = null;
    var target = null;
    var softBootstrap = Game.spawns[creep.memory["spawn"]].memory["softBootstrap"];
    if ((!creep.memory["onlyUpgrade"]) || softBootstrap) {
        target = findSpawnOrExtension(creep);
    }
    if (target) {
        creep.memory["mode"] = "store";
    } else {
        creep.memory["mode"] = "drop";
        var controller = Game.spawns[creep.memory["spawn"]].room.controller
        var target = controller.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: structure => (structure.structureType == STRUCTURE_CONTAINER &&
                                  structure.pos.inRangeTo(controller, 6)) });
        if (target) {
            target = controller.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: structure => (structure.structureType == STRUCTURE_CONTAINER &&
                                      structure.store.getFreeCapacity() >= creep.store[RESOURCE_ENERGY] &&
                                      structure.pos.inRangeTo(controller, 6)) });
            if (target) {
                creep.memory["target"] = target.id;
                creep.memory["distance"] = 1;
            } else {
                target = null;
                if ((!creep.memory["onlyUpgrade"]) || softBootstrap) {
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: structure => (structure.structureType == STRUCTURE_STORAGE &&
                                              structure.store.getFreeCapacity() > 0) })
                    if (target) {
                        creep.memory["mode"] = "store";
                        creep.memory["target"] = target.id;
                    } else {
                        creep.memory["mode"] = "store";
                        creep.memory["target"] = null;
                        creep.memory["idle"] = true;
                    }
                } else {
                    creep.memory["target"] = null;
                }
                    
            }
        } else {
            creep.memory["target"] = controller.id;
            creep.memory["distance"] = 4;
        }
    }
}

carryParts = function(creep) {
    var parts = 0;
    for (var i = 0; i < creep.body.length; i++) {
        if (creep.body[i].type == CARRY) { parts += 1; }
    }
    return parts;
}
carryCapacity = function(creep) {
    return carryParts(creep) * 50;
}
module.exports = roleCarrier;
