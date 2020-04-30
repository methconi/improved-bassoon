var manageTower = {
    
    run: function(tower) {
        
        var target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (!target) { target = tower.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES); }
        if (target) { tower.attack(target); return; }
        
    }
    
};

module.exports = manageTower;
