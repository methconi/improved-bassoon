var roleHarvester = {
    
    run: function(creep) {
        var source = creep.room.find(FIND_SOURCES)[creep.memory["source"]];
        if (creep.store[RESOURCE_ENERGY] == 0 ||
            creep.store.getFreeCapacity() >= harvestCapacity(creep)) {
            creep.memory["target"] = null;
            var res = creep.harvest(source);
            if (res == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { range: 1 });
            } else if (res == OK) {
                creepRecordEnergyGain(creep, "harvested");
            } else if (creep.store[RESOURCE_ENERGY] > 0) {
                var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: structure => structure.structureType == STRUCTURE_CONTAINER });
                if (!(target && creep.transfer(target, RESOURCE_ENERGY) == OK)) {
                    creep.drop(RESOURCE_ENERGY);
                }
            }
        } else if (Game.spawns[creep.memory["spawn"]].memory["bootstrap"]) {
            var target = findSpawnOrExtension(creep);
            if (target) {
                var res = creep.transfer(target, RESOURCE_ENERGY);
                if (res == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
        } else if (creep.store[RESOURCE_ENERGY] > 0) {
            var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: structure => structure.structureType == STRUCTURE_CONTAINER });
            if (!(target && creep.transfer(target, RESOURCE_ENERGY) == OK)) {
                creep.drop(RESOURCE_ENERGY);
            }
        }
    }
    
};

harvestCapacity = function(creep) {
    var capacity = 0;
    for (var i = 0; i < creep.body.length; i++) {
        if (creep.body[i].type == WORK) { capacity += 2; }
    }
    return capacity;
}

module.exports = roleHarvester;
