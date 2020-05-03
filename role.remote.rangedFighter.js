var roleRemoteRangedFighter = {
    
    run: function(creep) {

        var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (target) {
            var res = creep.rangedAttack(target);
            if (res == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            } else if {res == OK) {
                // Shit-grade kiting
                creep.move(target.pos.getDirectionTo(creep));
            }
            return;
        }
        target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
        if (target) {
            var res = creep.rangedAttack(target);
            if (res == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            return;
        }

        var spawn = Game.spawns[creep.memory["spawn"]];
        var remoteWar = spawn.memory["remoteWar"];

        if (remoteWar) {
            if (creep.room.name != remoteWar) {
                var exitDir = creep.room.findExitTo(remoteWar);
                var exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);
                creep.memory["justEntered"] = 3;
                return;
            } else if (creep.memory["justEntered"] > 0) {
                creep.memory["justEntered"] -= 1;
                creep.moveTo(creep.room.controller);
                return;
            }
        } else {
            if (!creep.pos.inRangeTo(creep.room.controller, 10)) {
                creep.moveTo(creep.room.controller);
                return;
            } else {
                clearRoad(creep);
                return;
            }
        }

    }
    
};

module.exports = roleRemoteRangedFighter;
