var roleRemoteClaimer = {
    
    run: function(creep) {
        var roomName =creep.memory["remoteRoom"];
        if (creep.room.name != roomName) {
            var exitDir = creep.room.findExitTo(roomName);
            var exit = creep.pos.findClosestByRange(exitDir);
            creep.moveTo(exit);
            creep.memory["justEntered"] = 3;
            return;
        }
        
        var room = Game.rooms[roomName];

        if (creep.memory["justEntered"] > 0) {
            creep.memory["justEntered"] -= 1;
            creep.moveTo(room.controller);
            return;
        }
        
        var controller = creep.room.controller;
        var myName = Game.spawns[creep.memory["spawn"]].owner.username;
        if (controller && controller.reservation &&
            (controller.reservation.username != myName)) {
            var res = creep.attackController(controller);
            if (res == ERR_NOT_IN_RANGE) {
                creep.moveTo(controller);
            }
            return;
        }
    }
    
};

module.exports = roleRemoteClaimer;
