var roleAntiDowngrader = {

    run: function(creep) {

        if (creep.store[RESOURCE_ENERGY] == 0 &&
            creep.memory["role"] != "pickup") {
            creep.memory["mode"] = "pickup";
            creep.memory["target"] = null;
        } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0 &&
                   creep.memory["role"] != "upgrade") {
            creep.memory["mode"] = "upgrade";
            creep.memory["target"] = null;
        }

        if (creep.memory["mode"] == "pickup") {
            var target = findEnergy(creep);
            if (target) {
                var res = takeEnergy(creep, target);
                if (res == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
            return;
        }

        if (creep.memory["mode"] == "upgrade") {
            var controller = creep.room.controller;
            var res = creep.upgradeController(controller);
            if (res == ERR_NOT_IN_RANGE) {
                creep.moveTo(controller);
            }
        }
        
    }
};

module.exports = roleAntiDowngrader;
