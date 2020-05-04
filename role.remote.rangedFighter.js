var roleRemoteRangedFighter = {
    
    run: function(creep) {

        var targetKill = null;
        var targetSplit = null;
        var target = null;
        var killAttacker = false;
        
        if (creep.memory["targetKill"]) {
            targetKill = Game.getObjectById(creep.memory["targetKill"]);
            if (targetKill && targetKill.pos.roomName != creep.pos.roomName) {
                targetKill = null;
            }
        }
        if (!targetKill) {
            targetKill = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (hostile => hasPart(hostile, RANGED_ATTACK) || hasPart(hostile, ATTACK)) });
        }
        if (!targetKill) {
            targetKill = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        }
        if (targetKill) {
            creep.memory["targetKill"] = targetKill.id;
            killAttacker = hasPart(targetKill, RANGED_ATTACK) || hasPart(targetKill, ATTACK);
        } else {
            creep.memory["targetKill"] = null;
        }

        if (killAttacker) {
            if (creep.memory["targetSplit"]) {
                targetSplit = Game.getObjectById(creep.memory["targetSplit"]);
                if (targetSplit && targetSplit.pos.roomName != creep.pos.roomName) {
                    targetSplit = null;
                }
            }
            if (!targetSplit || targetSplit.id == targetKill.id) {
                targetSplit = targetKill.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: (hostile => hasPart(hostile, HEAL) && hostile.id != targetKill.id) });
            }
        }
        if (targetSplit) {
            creep.memory["targetSplit"] = targetSplit.id;
        } else {
            creep.memory["targetSplit"] = null;
        }

        if (targetSplit) {
            creep.moveTo(splitPoint(targetSplit, targetKill));
            var res;
            if (!targetSplit.alreadyHarassed) {
                res = creep.rangedAttack(targetSplit);
                if (res == ERR_NOT_IN_RANGE) {
                    creep.rangedAttack(targetKill);
                } else if (res == OK) {
                    targetSplit.alreadyHarassed = true;
                }
            } else {
                res = creep.rangedAttack(targetKill);
                if (res == ERR_NOT_IN_RANGE) {
                    creep.rangedAttack(targetSplit);
                }
            }
            return;
        } else if (targetKill) {
            var res = creep.rangedAttack(targetKill);
            if (res == ERR_NOT_IN_RANGE) {
                creep.moveTo(targetKill);
            }
            return;
        }
        

        // -----------------------------

        
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

const splitPoint = function(targetKill, targetSplit) {
    var deltax = 0;
    var deltay = 0;
    if (targetKill.pos.x < targetSplit.pos.x) {
        deltax = Math.min(Math.ceil((targetSplit.pos.x - targetKill.pos.x)/2), 3);
    } else if (targetKill.pos.x > targetSplit.pos.x) {
        deltax = -Math.min(Math.ceil((targetKill.pos.x - targetSplit.pos.x)/2), 3);
    }

    if (targetKill.pos.y < targetSplit.pos.y) {
        deltay = Math.min(Math.ceil((targetSplit.pos.y - targetKill.pos.y)/2), 3);
    } else if (targetKill.pos.y > targetSplit.pos.y) {
        deltay = -Math.min(Math.ceil((targetKill.pos.y - targetSplit.pos.y)/2), 3);
    }

    var pointx = targetKill.pos.x+deltax;
    var pointy = targetKill.pos.y+deltay;

    if (pointx < 1) {pointx = 1;}
    else if (pointx > 48) {pointx = 48;}
    if (pointy < 1) {pointy = 1;}
    else if (pointy > 48) {pointy = 48;}
    
    return (new RoomPosition(pointx, pointy, targetKill.pos.roomName));
};

/*
const harassingSplits = function(creep, targetKill, targetSplit) {
    var splitsx = (targetKill.pos.x <= creep.pos.x && creep.pos.x <= targetSplit.pos.x)
        || (targetSplit.pos.x <= creep.pos.x && creep.pos.x <= targetKill.pos.x);
    var splitsy = (targetKill.pos.y <= creep.pos.y && creep.pos.y <= targetSplit.pos.y)
        || (targetSplit.pos.y <= creep.pos.y && creep.pos.y <= targetKill.pos.y);

    return splitsx && splitsy;
}
*/

module.exports = roleRemoteRangedFighter;
