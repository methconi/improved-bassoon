var manageTower = {
    
    run: function(tower) {
        addMemory(tower);

        var spawnName = tower.memory["spawn"];
        var spawn = null;
        if (spawnName) {
            spawn = Game.spawns[spawnName];
        }

        if (spawn) {
            creepApplyRecordedEnergyUse(tower);
        }
        
        var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (!target) { target = tower.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES); }
        if (target) { tower.attack(target); return; }

        tower.memory["target"] = null;
        target = findRepair(tower);
        if(target) {
            var res = tower.repair(target);
            if (res == OK) {
                creepRecordEnergyUse(tower, "repair");
                return;
            }
        }
        
        if (spawn && spawn.memory["energyUse"]
            && !(spawn.memory["energyUse"]["wallUp"] > 0.5)
            && (tower.store[RESOURCE_ENERGY] >=
                tower.store.getCapacity(RESOURCE_ENERGY) * 0.75)) {
            var targets = tower.room.find(FIND_STRUCTURES, {
                filter: structure =>
                    (structure.hits < structure.hitsMax &&
                     (structure.structureType == STRUCTURE_WALL ||
                      structure.structureType == STRUCTURE_RAMPART)) });
            if (targets.length > 0) {
                target = targets[0];
                for (var i = 1; i < targets.length; i++) {
                    if (targets[i].hits < target.hits) {
                        target = targets[i];
                    }
                }
                var res = tower.repair(target);
                if (res == OK) {
                    creepRecordEnergyUse(tower, "wallUp");
                    return;
                }
            }
        }
    }
    
};

module.exports = manageTower;
