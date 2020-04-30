var roleRemoteHarvester = {
    
    run: function(creep) {
        var roomName =creep.memory["remoteRoom"];
        if (creep.room.name != roomName) {
            var exitDir = creep.room.findExitTo(roomName);
            var exit = creep.pos.findClosestByRange(exitDir);
            creep.moveTo(exit);
            return;
        }
        
        var room = Game.rooms[roomName];
        
        var source = creep.room.find(FIND_SOURCES)[creep.memory["source"]];
        if (creep.store[RESOURCE_ENERGY] == 0 ||
            creep.store.getFreeCapacity() >= harvestCapacity(creep)) {
            creep.memory["target"] = null;
            var res = creep.harvest(source);
            if (res == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            } else if (res == OK) {
                creepRecordEnergyGain(creep, "remoteHarvested");
            } else if (creep.store[RESOURCE_ENERGY] > 0) {
                buildOrDrop(creep);
            }
        } else if (creep.store[RESOURCE_ENERGY] > 0) {
            buildOrDrop(creep)
        }
    }
    
};

buildOrDrop = function(creep) {
    var target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
        filter: site => creep.pos.inRangeTo(site, 5) });
    if (target) {
        var res = creep.build(target)
        if(res == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        } else if (res == OK) {
            creepRecordEnergyUse(creep, "remoteBuild")
        }
        return;
    }

    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: structure => (creep.pos.inRangeTo(structure, 5)
                              && structure.hits < structure.hitsMax )});
    if (target) {
        var res = creep.repair(target)
        if(res == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        } else if (res == OK) {
            creepRecordEnergyUse(creep, "remoteRepair")
        }
        return;
    }
    
    
    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_CONTAINER });
    if (!(target && creep.transfer(target, RESOURCE_ENERGY) == OK)) {
        creep.drop(RESOURCE_ENERGY);
    }
}

module.exports = roleRemoteHarvester;
