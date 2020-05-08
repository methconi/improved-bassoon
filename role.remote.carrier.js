var roleCarrier = require('role.carrier');

var roleRemoteCarrier = {
    
    run: function(creep) {

        if (remoteCarrierMeasureNeeded(creep)) {
            remoteCarrierMeasure(creep);
            return;
        }

        var spawn = Game.spawns[creep.memory["spawn"]];
        var remoteRoomName = creep.memory["remoteRoom"];
        var homeRoomName = spawn.room.name;

        if ((creep.memory["mode"] == "pickup" || creep.memory["idle"]) && creep.store[RESOURCE_ENERGY] > 0) {
            if (!creep.pos.inRangeTo(Game.spawns[creep.memory["spawn"]], 5)) {
                creep.moveTo(Game.spawns[creep.memory["spawn"]]);
                return;
            } else {
                creep.memory["idle"] = false;
                creep.drop(RESOURCE_ENERGY);
                return;
            }
        }
        
        if ((creep.memory["mode"] != "remotePickup" && creep.store[RESOURCE_ENERGY] == 0) ||
            (creep.memory["mode"] == "pickup" && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
            creep.memory["mode"] = "remotePickup";
            creep.memory["source"] = -1;
            creep.memory["target"] = null;
        }

        if (creep.memory["mode"] == "remotePickup") {
            if (creep.room.name != remoteRoomName) {
                if (clearExit(creep)) { return; }
                var exitDir = creep.room.findExitTo(remoteRoomName);
                var exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);
                return;
            } else {
                var sourceIndex;
                if (!(creep.memory["source"] >= 0)) {
                    sourceIndex = remoteCarrierChooseSource(creep);
                    creep.memory["source"] = sourceIndex;
                } else {
                    sourceIndex = creep.memory["source"];
                }
                var source = creep.room.find(FIND_SOURCES)[sourceIndex];
                var target;
                var take;

                target = source.pos.findClosestByRange(FIND_TOMBSTONES, {
                    filter: tombstone => (tombstone.store[RESOURCE_ENERGY] > 0 &&
                                          tombstone.pos.inRangeTo(creep, 5)) });
                if (target) { take = (tombstone => creep.withdraw(tombstone, RESOURCE_ENERGY)); }

                if (!target) {
                    target = source.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                        filter: resource => (resource.resourceType == RESOURCE_ENERGY &&
                                             resource.pos.inRangeTo(source, 5)) });
                    if (target) { take = (resource => creep.pickup(resource)); }
                }
                
                if (!target) {
                    target = source.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: structure => (structure.structureType == STRUCTURE_CONTAINER &&
                                              structure.store[RESOURCE_ENERGY] > 0 &&
                                              structure.pos.inRangeTo(source, 5)) });
                    if (target) { take = (structure => (creep.withdraw(structure, RESOURCE_ENERGY))); }
                }
                
                if (target && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    var res = take(target);
                    if (res == OK) {
                        return;
                    } else {
                        creep.moveTo(target);
                        return;
                    }
                } else if (!creep.pos.inRangeTo(source, 2)) {
                    creep.moveTo(source);
                    return;
                } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0 ||
                           creep.ticksToLive < 100) {
                    creep.memory["mode"] = "goingHome";
                } else {
                    return;
                }
            }
        }
        
        if (creep.memory["mode"] == "goingHome") {
            if (creep.room.name != homeRoomName) {
                /*var exitDir = creep.room.findExitTo(homeRoomName);
                var exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);*/
                creep.moveTo(spawn);
                return;
            } else {
                creep.memory["mode"] = "store";
                var target = null;
                if (!target) {
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: structure => (structure.structureType == STRUCTURE_STORAGE &&
                                              (Memory["market"] &&
                                               structure.store.getUsedCapacity(RESOURCE_ENERGY)
                                               < Memory["market"]["storedEnergyTarget"]) &&
                                              structure.store.getFreeCapacity() > 0) });
                }
                if (!target && spawn.memory["energyToTerminal"]) {
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: structure => (structure.structureType == STRUCTURE_TERMINAL &&
                                              structure.store.getUsedCapacity(RESOURCE_ENERGY)
                                              < 0.5*structure.store.getUsedCapacity()) });
                }
                if (!target) {
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: structure => (structure.structureType == STRUCTURE_STORAGE &&
                                              structure.store.getFreeCapacity() > 0) });
                }
                if (target) { creep.memory["target"] = target.id; }
                else { creep.memory["target"] = null; }
                creep.moveTo(creep.room.controller);
                return;
            }
        }
        
        roleCarrier.run(creep);
    }

};

remoteCarrierChooseSource = function(creep) {
    var sources = creep.room.find(FIND_SOURCES);
    var availableEnergy = new Array(sources.length);
    availableEnergy.fill(0);
    var totalAvailableEnergy = 0;
    
    for (var i = 0; i < sources.length; i++) {
        var source = sources[i];
        var targets = source.pos.findInRange(FIND_DROPPED_RESOURCES, 5);
        for (var j = 0; j < targets.length; j++) {
            if (targets[j].resourceType == RESOURCE_ENERGY) {
                availableEnergy[i] += targets[j].amount;
                totalAvailableEnergy += targets[j].amount;
            }
        }
        targets = source.pos.findInRange(FIND_STRUCTURES, 5);
        for (var j = 0; j < targets.length; j++) {
            if (targets[j].structureType == STRUCTURE_CONTAINER) {
                availableEnergy[i] += targets[j].store[RESOURCE_ENERGY];
                totalAvailableEnergy += targets[j].store[RESOURCE_ENERGY];
            }
        }
    }
    var r = Math.random()*totalAvailableEnergy;
    for (var i = 0; i < sources.length; i++) {
        r -= availableEnergy[i];
        if (r <= 0) { return i; }
    }

    return sources.length-1;
}

remoteCarrierMeasure = function(creep) {
    if (!creep.memory["measureTime"]) {
        creep.memory["measureTime"] = 0;
    }

    var spawn = Game.spawns[creep.memory["spawn"]];
    var remoteRoomName = creep.memory["remoteRoom"];
    var homeRoomName = spawn.room.name;

    var terrain = creep.room.getTerrain();
    var onRoad = false;
    creep.room.lookAt(creep).forEach(function (lookObject) {
        if (lookObject.type == LOOK_STRUCTURES &&
            lookObject[LOOK_STRUCTURES].structureType == STRUCTURE_ROAD) {
            onRoad = true;
        }
    })
    var onPlain = (terrain.get(creep.pos.x, creep.pos.y) == 0);
            

    if (!spawn.memory["remoteRoomsData"]) { spawn.memory["remoteRoomsData"] = {}; }
    if (!spawn.memory["remoteRoomsData"][remoteRoomName]) {
        spawn.memory["remoteRoomsData"][remoteRoomName] = {}; }
    var remoteRoomData = spawn.memory["remoteRoomsData"][remoteRoomName];
    
    if (!creep.memory["measureReachedSource"]) {
        if (creep.fatigue == 0) {
            if (onRoad || onPlain) {
                creep.memory["measureTime"] += 1;
            } else {
                creep.memory["measureTime"] += 2;
            }
        }
        
        if (creep.room.name != remoteRoomName) {
            if (clearExit(creep)) { return; }
            var exitDir = creep.room.findExitTo(remoteRoomName);
            var exit = creep.pos.findClosestByRange(exitDir);
            creep.moveTo(exit);
            return;
        } else {
            var sourceIndex;
            if (typeof creep.memory["measureSource"] != "number") {
                var nbSources = creep.room.find(FIND_SOURCES).length;
                creep.memory["measureNbSources"] = nbSources;

                if (!remoteRoomData["timeToSourceNextMeasure"]) {
                    remoteRoomData["timeToSourceNextMeasure"] = 0;
                }
                
                if (remoteRoomData["timeToSourceNextMeasure"] >= nbSources) {
                    remoteRoomData["timeToSourceNextMeasure"] = 0;
                }
                sourceIndex = remoteRoomData["timeToSourceNextMeasure"];
                remoteRoomData["timeToSourceNextMeasure"] += 1;
                
                creep.memory["measureSource"] = sourceIndex;
            } else {
                sourceIndex = creep.memory["measureSource"];
            }
            var source = creep.room.find(FIND_SOURCES)[sourceIndex];
            var target;
            var take;
            
            target = source.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                filter: resource => (resource.resourceType == RESOURCE_ENERGY &&
                                     resource.pos.inRangeTo(source, 5)) });
            if (target) { take = (resource => creep.pickup(resource)); }

            if (!target) {
                target = source.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: structure => (structure.store &&
                                          structure.store[RESOURCE_ENERGY] > 0 &&
                                          structure.pos.inRangeTo(source, 5)) });
                if (target) { take = (structure => (creep.withdraw(structure, RESOURCE_ENERGY))); }
            }

            if (target && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                var res = take(target);
                if (res == OK) {
                    return;
                } else {
                    creep.moveTo(target);
                    return;
                }
            } else if (!creep.pos.inRangeTo(source, 2)) {
                creep.moveTo(source);
                return;
            } else {
                creep.memory["measureReachedSource"] = true;
                creep.memory["target"] = null;
                return;
            }
        }
    } else {
        if (creep.fatigue == 0) {
            if (onRoad) {
                creep.memory["measureTime"] += 1;
            } else if (onPlain) {
                creep.memory["measureTime"] += 2;
            } else {
                creep.memory["measureTime"] += 4;
            }
        }
        
        if (creep.room.name != homeRoomName) {/*
            var exitDir = creep.room.findExitTo(homeRoomName);
            var exit = creep.pos.findClosestByRange(exitDir);
            creep.moveTo(exit);*/
            creep.moveTo(spawn);
            return;
        } else {
            var target = Game.getObjectById(creep.memory["target"]);
            if (!target) { target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure => structure.structureType == STRUCTURE_STORAGE) }); }
            if (!target) { target = spawn; }
            creep.memory["target"] = target.id;
                
            if (!creep.pos.inRangeTo(target, 1)) {
                creep.moveTo(target);
                return;
            } else {
                creep.memory["measureDone"] = true;
                creep.memory["mode"] = "store";
                creep.memory["target"] = null;
                
                if (!remoteRoomData["timeToSource"]) {
                    remoteRoomData["timeToSource"] = new Array(creep.memory["measureNbSources"]);
                    remoteRoomData["timeToSource"].fill(-1);
                }
                var timesArray = remoteRoomData["timeToSource"];
                var sourceIndex = creep.memory["measureSource"];
                var time = creep.memory["measureTime"];
                if (timesArray[sourceIndex] < 0) {
                    timesArray[sourceIndex] = time;
                } else {
                    timesArray[sourceIndex] = timesArray[sourceIndex] * 0.75 + time*0.25;
                }
            }
        }
    }
}


remoteCarrierMeasureNeeded = function(creep) {
    if ((typeof creep.memory["measureDone"]) == "boolean") {
        return !creep.memory["measureDone"];
    }
    var spawn = Game.spawns[creep.memory["spawn"]];
    
    creep.memory["measureDone"] = false;
    
    if (!spawn.memory["remoteRoomsData"]) { return true; }
    
    var remoteRoomName = creep.memory["remoteRoom"];
    var remoteRoomData = spawn.memory["remoteRoomsData"][remoteRoomName];
    if (!remoteRoomData) { return true; }
    
    var timesArray = remoteRoomData["timeToSource"];
    if (!timesArray) { return true; }
    
    for (var i = 0; i < timesArray.length; i++) {
        if (timesArray[i] < 0) { return true; }
    }
    
    var needed = Math.random() < 0.1;
    creep.memory["measureDone"] = !needed;
    return needed;
}

module.exports = roleRemoteCarrier;
