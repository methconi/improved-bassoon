var roleMineralHarvester = {
    
    run: function(creep) {

        var spawn = Game.spawns[creep.memory["spawn"]];
        var mineral = null;
        var storage = null;
        
        if (!creep.memory["mineral"]) {
            mineral = creep.pos.findClosestByRange(FIND_MINERALS);
            if (!mineral) { return; }
            creep.memory["mineral"] = mineral.id
        } else {
            mineral = Game.getObjectById(creep.memory["mineral"]);
            if (!mineral) { return; }
        }

        if (!creep.memory["storage"]) {
            if (spawn.memory["mineralToTerminal"]) {
                storage = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure => structure.structureType
                             == STRUCTURE_TERMINAL)});
            }
            if (!storage || storage.store.getFreeCapacity(mineral.mineralType) < 10000) {
                storage = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure => structure.structureType
                             == STRUCTURE_STORAGE)});
            }
            if (!storage) { return; }
            creep.memory["storage"] = storage.id
        } else {
            storage = Game.getObjectById(creep.memory["storage"]);
            if (!storage) { return; }
        }

        if (creep.store.getFreeCapacity(mineral.mineralType) < mineralHarvestCapacity(creep)) {
            creep.memory["mode"] = "store";
        } else if (creep.store[mineral.mineralType] == 0) {
            creep.memory["mode"] = "harvest";
        }

        if (creep.memory["mode"] == "harvest") {
            var res = creep.harvest(mineral); 
            if (res == ERR_NOT_IN_RANGE) {
                creep.moveTo(mineral);
            }
            return;
        } else if (creep.memory["mode"] == "store") {
            if (creep.pos.inRangeTo(storage, 1)) {
                creep.transfer(storage, mineral.mineralType);
                creep.moveTo(mineral);
            } else if (creep.pos.inRangeTo(storage, 2)) {
                creep.moveTo(storage);
                creep.transfer(storage, mineral.mineralType); 
            } else {
                creep.moveTo(storage);
            }
            return;
        }
        
    }
    
};

mineralHarvestCapacity = function(creep) {
    if ((typeof creep.memory["workParts"]) != "undefined") {
        return creep.memory["workParts"];
    }
        
    var workParts = 0;    
    for (var i = 0; i < creep.body.length; i++) {
        if (creep.body[i].type == WORK) { workParts += 1; }
    }
    creep.memory["workParts"] = workParts;
    return workParts;
}

module.exports = roleMineralHarvester;
