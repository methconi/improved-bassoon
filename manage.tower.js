var manageTower = {
    
    run: function(tower) {
        
        var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (!target) { target = tower.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES); }
        if (target) { tower.attack(target); return; }

        var filter = builderRepairFilter();
        target = findRepair(tower, filter);
        if(target) {
            var res = tower.repair(target)
            if (res == OK) {
                creepRecordEnergyUse(tower, "repair");
                return;
            }
        }
        
    }
    
};

module.exports = manageTower;
