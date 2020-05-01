var manageTower = {
    
    run: function(tower) {
        addMemory(tower);
        
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
        
    }
    
};

module.exports = manageTower;
