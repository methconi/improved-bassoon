var manageRemoteSpawn = {

    run: function(spawn) {
        
        if (!spawn.spawning) {
            var name = spawn.name + "_AntiDowngrader";
            if (spawn.room.controller.ticksToDowngrade <= 15000 && !Game.creeps[name]) {
                var res = spawn.spawnCreep([ MOVE, MOVE, CARRY, CARRY, WORK ], name);
                if (res == OK) {
                    var creep = Game.creeps[name];
                    creep.memory={};
                    creep.memory["role"]="antiDowngrader";
                }
            }
        }
    }
};

module.exports = manageRemoteSpawn;
