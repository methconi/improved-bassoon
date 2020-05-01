var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleCarrier = require('role.carrier');

var manageSpawn = require("manage.spawn");
var manageTower = require("manage.tower");

var roleRemoteFighter = require('role.remote.fighter');
var roleRemoteClaimer = require('role.remote.claimer');
var roleRemoteHarvester = require('role.remote.harvester');
var roleRemoteCarrier = require('role.remote.carrier');

module.exports.loop = function () {
    maybeCleanupDeadCreepsMemory();

    for(var name in Game.structures) {
        var structure = Game.structures[name];
        if (structure.structureType == STRUCTURE_TOWER) {
            manageTower.run(structure);
        }
    }

    var spawn = Game.spawns["Spawn1"];
    manageSpawn.run(spawn);
    
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.spawning) { continue; }
        
        creepApplyRecordedEnergyUse(creep)
        
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        } else if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        } else if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        } else if(creep.memory.role == 'carrier') {
            roleCarrier.run(creep);
        } else if(creep.memory.role == 'remoteFighter') {
            roleRemoteFighter.run(creep);
        } else if(creep.memory.role == 'remoteClaimer') {
            roleRemoteClaimer.run(creep);
        } else if(creep.memory.role == 'remoteHarvester') {
            roleRemoteHarvester.run(creep);
        } else if(creep.memory.role == 'remoteCarrier') {
            roleRemoteCarrier.run(creep);
        }
    }
    
}

closestEnergyOrContainer = function(creep, additionalFilter = (resource => true), avoidStorage = true, minEnergy = 1) {
    var upgrader = creep.memory["role"] == "upgrader";
    var controller = creep.room.controller;
    var filter = resource => (resource.resourceType == RESOURCE_ENERGY &&
                              resource.amount >= minEnergy &&
                              (upgrader || !resource.pos.inRangeTo(controller, 5)) &&
                              additionalFilter(resource));
    var resource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, { filter: filter });
    filter = structure => ((structure.structureType == STRUCTURE_CONTAINER
                            || (structure.structureType == STRUCTURE_STORAGE && !avoidStorage)) &&
                           structure.store.getUsedCapacity(RESOURCE_ENERGY) >= minEnergy &&
                           (upgrader || !structure.pos.inRangeTo(controller, 5)) &&
                           additionalFilter(structure));
    var structure = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: filter });
    
    if ((!resource) && (!structure)) {
        target = null;
    } else if (!resource) {
        target = structure;
    } else if (!structure) {
        target = resource;
    } else {
        var rangeStructure = creep.pos.getRangeTo(structure);
        var rangeResource = creep.pos.getRangeTo(resource);
        if (rangeResource < 5 || rangeResource <= rangeStructure) {
            target = resource;
        } else {
            target = structure;
        }
    }
    return target;
}
findEnergy = function(creep, opts = {}) {
    var additionalFilter;
    if (opts.filter) {
        additionalFilter = opts.filter;
    } else {
        additionalFilter = (resource => true)
    }
    var avoidStorageLevel; // 0: treat storage and non-storage equally
                           // 1: prefer faraway well-filled non-storage over any nearby storage
                           // 2: prefer any non-storage over any storage
    if ((typeof opts.avoidStorageLevel) == "number") {
        avoidStorageLevel = opts.avoidStorageLevel;
    } else {
        avoidStorageLevel = 1;
    }
    
    if (creep.memory["target"]) {
        var target = Game.getObjectById(creep.memory["target"]);
        if (target && (target.resourceType == RESOURCE_ENERGY ||
                       (target.store && target.store[RESOURCE_ENERGY] > 0))) {
            return target;
        }
        if (target && creep.memory["energyHope"] > 0 &&
            creep.pos.findClosestByRange(FIND_SOURCES, {
                filter: source => (creep.pos.inRangeTo(source, 3)
                                   && source.energy > 0) })) {
            creep.memory["energyHope"] -= 1;
            return target;
        }
    }
    var target;
    
    var upgrader = creep.memory["role"] == "upgrader";
    var controller = creep.room.controller;
    var filter = tombstone => ((upgrader || !tombstone.pos.inRangeTo(controller, 5)) &&
                               tombstone.store[RESOURCE_ENERGY] > 0 &&
                               (tombstone.store[RESOURCE_ENERGY] > 50 ||
                                tombstone.pos.inRangeTo(creep, 2)) &&
                               additionalFilter(tombstone)); 
    var tombstone = creep.pos.findClosestByRange(FIND_TOMBSTONES, { filter: filter });

    if (tombstone) {
        target = tombstone;
    } else {
        target = closestEnergyOrContainer(creep, additionalFilter, (avoidStorageLevel >= 1),
                                          creep.store.getFreeCapacity(RESOURCE_ENERGY));
        if (!target) {
            target = closestEnergyOrContainer(creep, additionalFilter, (avoidStorageLevel >= 2), 1);
        }
        if (!target) {
            creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: structure => (structure.structureType == STRUCTURE_STORAGE &&
                                      structure.store.getFreeCapacity() > 0) });
        }
    }
        
    if (target) {
        creep.memory["target"] = target.id;
        console.log(creep.name + " " + target.id);
        return target;
    } else {
        creep.memory["target"] = null;
        return null;
    }
}
takeEnergy = function(creep, target) {
    var res;
    if (target.resourceType == RESOURCE_ENERGY) {
        res = creep.pickup(target);
    } else {
        res = creep.withdraw(target, RESOURCE_ENERGY);
    }
    if (res == OK) {
        creep.memory["energyHope"] = 2;
    }
}

buildRoad = function(from, to) {
    var path = from.findPathTo(to);
    var terrain = new Room.Terrain(from.roomName);
    var room = Game.rooms[from.roomName];
    for (var i = 0; i < path.length; i++) {
        if (terrain.get(path[i].x,path[i].y) != TERRAIN_MASK_WALL) {
            room.createConstructionSite(path[i].x,path[i].y, STRUCTURE_ROAD);
        }
    }
}

maybeCleanupDeadCreepsMemory = function() {
    if (Math.random() >= 0.001) { return; }
    for(var i in Memory.creeps) {
        if(!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }
}

logEnergyUse = function(time="") {
    var energyUse = Game.spawns["Spawn1"].memory["energyUse"+time];
    for (var key in energyUse) {
        console.log(key + ": " + energyUse[key].toPrecision(4));
    }
}

randomMove = function(creep) {
    var directions = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT,
                  BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT];
    creep.move(directions[Math.floor(Math.random()*directions.length)]);
}
clearRoad = function(creep) {
    var targets = creep.room.lookForAt(LOOK_STRUCTURES, creep);
    for (var i = 0; i < targets.length; i++) {
        if (targets[i].structureType == STRUCTURE_ROAD) {
            randomMove(creep);
            return;
        }
    }
}        

targetHits = function(object) {
    if (object.structureType == STRUCTURE_WALL ||
        object.structureType == STRUCTURE_RAMPART) {
        return 30000;
    } else {
        return object.maxHits;
    }
}

addMemory = function(object) {
    if (object.memory) { return; }
    if (!Memory["objects"]) { Memory["objects"] = {}; }
    if (!Memory["objects"][object.id]) { Memory["objects"][object.id] = {}; }
    object["memory"] = Memory["objects"][object.id];
}
