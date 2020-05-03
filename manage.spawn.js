var manageSpawn = {

    run: function(spawn) {
        spawnInitializeIfNeedBe(spawn);
        bootstrapIfNeedBe(spawn);
        decayEnergyUse(spawn);

        autoExtensions(spawn);

        autoRemoteWar(spawn);
        
        if (!spawn.spawning) {
            blueprint = wantedCreep(spawn);

            if (blueprint) {
                spawnFromBlueprint(spawn, blueprint);
            }
        }
    }
};

extensionsCount = function(spawn) {
    return spawn.room.find(FIND_STRUCTURES, {
        filter: { structureType: STRUCTURE_EXTENSION }
    }).length;
}

targetCreeps = function(spawn) {
    var extensions = extensionsCount(spawn);

    if (spawn.memory["bootstrap"]) {
        var bodyHarvester = [ WORK, WORK, MOVE, CARRY ];
        var bodyCarrier = [ MOVE, MOVE, CARRY, CARRY, CARRY, CARRY ];
        return [ { name: "Harvester_1", body: bodyHarvester, role: "harvester", source: 0 },
                 { name: "Carrier_1", body: bodyCarrier, role: "carrier" } ];
    } else if (extensions >= 15) {
        // Budget: 1050
        // per tick: 0.7 -> total 5.6
        // -----------
        // Harvest: 14
        // Carry: 40
        // Upgrade: 16
        // Build: 6
        var bodyHarvester = [ WORK, WORK, WORK,
                              WORK, WORK, WORK,
                              WORK, 
                              MOVE, CARRY, CARRY ];
        var bodyUpgrader = [ WORK, WORK, WORK,
                             WORK, WORK, WORK,
                             WORK, WORK,
                             MOVE, MOVE,
                             CARRY, CARRY, CARRY ];
        var bodyBuilder = [ MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY,
                            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                            WORK, WORK, WORK ];
        var bodyCarrier = [ MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY ];

        var bodyRemoteHarvester = [ WORK, WORK, WORK, WORK, // 0.43/tick
                                    MOVE, MOVE, MOVE, MOVE,
                                    CARRY ];
        var bodyRemoteCarrier = [ MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, // 0.7
                                  CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
                                  CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY ];
        var bodyRemoteFighter = [ MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                                  ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK ];
        var bodyRemoteClaimer = [ MOVE, MOVE, CLAIM ];
        return [
            { name: "Remote_Fighter_1", body: bodyRemoteFighter, role: "remoteFighter", remoteWar: true },
            { name: "Remote_Fighter_2", body: bodyRemoteFighter, role: "remoteFighter", remoteWar: true },
            
            { name: "Harvester_1", body: bodyHarvester, role: "harvester", source: 0 },
            { name: "Carrier_1", body: bodyCarrier, role: "carrier" },
            { name: "Harvester_2", body: bodyHarvester, role: "harvester", source: 1 },
            
            { name: "Upgrader_1", body: bodyUpgrader, role: "upgrader" },            
            { name: "Builder_1", body: bodyBuilder, role: "builder",
              condition: builderNeeded },
            
            { name: "Upgrader_2", body: bodyUpgrader, role: "upgrader",
              condition: (spawn => energyAvailableForUpgrade(spawn, 10) > 8) },
            { name: "Carrier_2", body: bodyCarrier, role: "carrier",
              condition: (spawn => energyAvailableForUpgrade(spawn, 10) > 8),
              mem: { onlyUpgrade: true } },
            
            { name: "Upgrader_3", body: bodyUpgrader, role: "upgrader",
              condition: (spawn => energyAvailableForUpgrade(spawn, 10) > 15)},
            { name: "Upgrader_4", body: bodyUpgrader, role: "upgrader",
              condition: (spawn => energyAvailableForUpgrade(spawn, 10) > 22)},
            { name: "Carrier_3", body: bodyCarrier, role: "carrier",
              condition: (spawn => energyAvailableForUpgrade(spawn, 10) > 22),
              mem: { onlyUpgrade: true } },
            
            { name: "Remote_Claimer_1", body: bodyRemoteClaimer, role: "remoteClaimer", remoteClaim: true },

            // Cost: 2.97, max production: 9 -> max gain 6.03/tick/remote room
            // Cost w/ upgrader: 3.67 -> max 6.33/tick upgrade gain/room
            { name: "Remote_Harvester_1", body: bodyRemoteHarvester, role: "remoteHarvester",
              remote: true, remoteIndex: 0, source: 0,
              condition: (spawn => !spawnOwnsRoomIndex(spawn, 0)) },
            { name: "Remote_Harvester_1", body: bodyHarvester, role: "remoteHarvester",
              remote: true, remoteIndex: 0, source: 0,
              condition: (spawn => spawnOwnsRoomIndex(spawn, 0)) },
            { name: "Remote_Carrier_1", body: bodyRemoteCarrier, role: "remoteCarrier",
              remote: true, remoteIndex: 0 },
            { name: "Remote_Harvester_2", body: bodyRemoteHarvester, role: "remoteHarvester",
              remote: true, remoteIndex: 0, source: 1,
              condition: (spawn => !spawnOwnsRoomIndex(spawn, 0)) },
            { name: "Remote_Harvester_2", body: bodyHarvester, role: "remoteHarvester",
              remote: true, remoteIndex: 0, source: 1,
              condition: (spawn => spawnOwnsRoomIndex(spawn, 0)) },
            { name: "Remote_Carrier_2", body: bodyRemoteCarrier, role: "remoteCarrier",
              remote: true, remoteIndex: 0, condition: (spawn => remoteCarryNeeded(spawn, 0) > 15) },
            { name: "Remote_Carrier_3", body: bodyRemoteCarrier, role: "remoteCarrier",
              remote: true, remoteIndex: 0, condition: (spawn => remoteCarryNeeded(spawn, 0) > 29)  },

            
            { name: "Remote_Harvester_2_1", body: bodyRemoteHarvester, role: "remoteHarvester",
              remote: true, remoteIndex: 1, source: 0 },
            { name: "Remote_Carrier_2_1", body: bodyRemoteCarrier, role: "remoteCarrier",
              remote: true, remoteIndex: 1 },
            { name: "Remote_Harvester_2_2", body: bodyRemoteHarvester, role: "remoteHarvester",
              remote: true, remoteIndex: 1, source: 1 },
            { name: "Remote_Carrier_2_2", body: bodyRemoteCarrier, role: "remoteCarrier",
              remote: true, remoteIndex: 1, condition: (spawn => remoteCarryNeeded(spawn, 1) > 15) },
            { name: "Remote_Carrier_2_3", body: bodyRemoteCarrier, role: "remoteCarrier",
              remote: true, remoteIndex: 1, condition: (spawn => remoteCarryNeeded(spawn, 1) > 29) },
            
            { name: "Remote_Harvester_3_1", body: bodyRemoteHarvester, role: "remoteHarvester",
              remote: true, remoteIndex: 2, source: 0 },
            { name: "Remote_Carrier_3_1", body: bodyRemoteCarrier, role: "remoteCarrier",
              remote: true, remoteIndex: 2 },
            { name: "Remote_Harvester_3_2", body: bodyRemoteHarvester, role: "remoteHarvester",
              remote: true, remoteIndex: 2, source: 1 },
            { name: "Remote_Carrier_3_2", body: bodyRemoteCarrier, role: "remoteCarrier",
              remote: true, remoteIndex: 2, condition: (spawn => remoteCarryNeeded(spawn, 2) > 15) },
            { name: "Remote_Carrier_3_3", body: bodyRemoteCarrier, role: "remoteCarrier",
              remote: true, remoteIndex: 2, condition: (spawn => remoteCarryNeeded(spawn, 2) > 29)  },
            
            { name: "Remote_Harvester_4_1", body: bodyRemoteHarvester, role: "remoteHarvester",
              remote: true, remoteIndex: 3, source: 0 },
            { name: "Remote_Carrier_4_1", body: bodyRemoteCarrier, role: "remoteCarrier",
              remote: true, remoteIndex: 3 },
            { name: "Remote_Harvester_4_2", body: bodyRemoteHarvester, role: "remoteHarvester",
              remote: true, remoteIndex: 3, source: 1 },
            { name: "Remote_Carrier_4_2", body: bodyRemoteCarrier, role: "remoteCarrier",
              remote: true, remoteIndex: 3, condition: (spawn => remoteCarryNeeded(spawn, 3) > 15) },
            { name: "Remote_Carrier_4_3", body: bodyRemoteCarrier, role: "remoteCarrier",
              remote: true, remoteIndex: 3, condition: (spawn => remoteCarryNeeded(spawn, 3) > 29)  }

        ];
    } else if (extensions >= 10) {
        // Budget: 800
        // per tick: 0.53
        // -----------
        // Harvest: 14
        // Carry: 40
        // Upgrade: 14
        // Build: 6
        var bodyHarvester = [ WORK, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, CARRY ];
        var bodyUpgrader = [ WORK, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, CARRY ];
        var bodyBuilder = [ MOVE, MOVE, MOVE, MOVE, MOVE,
                             CARRY, CARRY, CARRY, CARRY, CARRY,
                             WORK, WORK, WORK ];
        var bodyCarrier = [ MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
                            CARRY, CARRY, CARRY, CARRY, CARRY,
                            CARRY, CARRY, CARRY, CARRY, CARRY ];
        
        return [
            { name: "Harvester_1", body: bodyHarvester, role: "harvester", source: 0 },
            { name: "Carrier_1", body: bodyCarrier, role: "carrier" },
            { name: "Harvester_2", body: bodyHarvester, role: "harvester", source: 1 },
            { name: "Carrier_2", body: bodyCarrier, role: "carrier" },
            { name: "Upgrader_1", body: bodyUpgrader, role: "upgrader" },
            { name: "Builder_1", body: bodyBuilder, role: "builder" },
            /*{ name: "Carrier_3", body: bodyCarrier, role: "carrier",
              mem: { onlyUpgrade: true }},*/
            { name: "Upgrader_2", body: bodyUpgrader, role: "upgrader",
              condition: (spawn => energyAvailableForUpgrade(spawn, 10) > 8) },
            { name: "Upgrader_3", body: bodyUpgrader, role: "upgrader",
              condition: (spawn => energyAvailableForUpgrade(spawn, 10) > 15) }/*,
            { name: "Carrier_4", body: bodyCarrier, role: "carrier" },
            { name: "Builder_2", body: bodyBuilder, role: "builder" }*/ ];
    } else if (extensions >= 5) {
        // Budget: 550
        // per tick: 0.37
        // -----------
        // Harvest: 16
        // Carry: 35
        // Upgrade: 16
        // Build: 8
        var bodyHarvester = [ WORK, WORK, WORK, WORK, MOVE, CARRY ];
        var bodyUpgrader = [ WORK, WORK, WORK, WORK, MOVE, CARRY, CARRY ];
        var bodyBuilder = [ WORK, WORK, WORK, MOVE, MOVE, CARRY, CARRY, CARRY ];
        var bodyCarrier = [ MOVE, MOVE, MOVE, MOVE, CARRY,
                            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY ];
        
        return [
            { name: "Harvester_1", body: bodyHarvester, role: "harvester", source: 0 },
            { name: "Carrier_1", body: bodyCarrier, role: "carrier" },
            { name: "Harvester_2", body: bodyHarvester, role: "harvester", source: 1 },
            { name: "Carrier_2", body: bodyCarrier, role: "carrier" },
            { name: "Harvester_3", body: bodyHarvester, role: "harvester", source: 0 },
            { name: "Harvester_4", body: bodyHarvester, role: "harvester", source: 1 },
            { name: "Carrier_3", body: bodyCarrier, role: "carrier" },
            { name: "Upgrader_1", body: bodyUpgrader, role: "upgrader" },
            { name: "Builder_1", body: bodyBuilder, role: "builder" },
            { name: "Carrier_4", body: bodyCarrier, role: "carrier" },
            { name: "Builder_2", body: bodyBuilder, role: "builder" },
            { name: "Upgrader_2", body: bodyUpgrader, role: "upgrader" },
            //{ name: "Carrier_5", body: bodyCarrier, role: "carrier" },
            { name: "Upgrader_3", body: bodyUpgrader, role: "upgrader" },
            { name: "Upgrader_4", body: bodyUpgrader, role: "upgrader" } ];
    } else {
        var bodyHarvester = [ WORK, WORK, MOVE, CARRY ];
        var bodyUpgrader = [ WORK, WORK, MOVE, CARRY ];
        var bodyBuilder = [ WORK, MOVE, CARRY, CARRY, CARRY ];
        var bodyCarrier = [ MOVE, MOVE, CARRY, CARRY, CARRY, CARRY ];
        
        return [
            { name: "Harvester_1", body: bodyHarvester, role: "harvester", source: 0 },
            { name: "Carrier_1", body: bodyCarrier, role: "carrier" },
            { name: "Harvester_2", body: bodyHarvester, role: "harvester", source: 1 },
            { name: "Carrier_2", body: bodyCarrier, role: "carrier" },
            { name: "Harvester_3", body: bodyHarvester, role: "harvester", source: 0 },
            { name: "Harvester_4", body: bodyHarvester, role: "harvester", source: 1 },
            { name: "Carrier_3", body: bodyCarrier, role: "carrier" },
            { name: "Upgrader_1", body: bodyUpgrader, role: "upgrader" },
            { name: "Builder_1", body: bodyBuilder, role: "builder" },
            { name: "Carrier_4", body: bodyCarrier, role: "carrier" },
            { name: "Harvester_5", body: bodyHarvester, role: "harvester", source: 0 },
            { name: "Harvester_6", body: bodyHarvester, role: "harvester", source: 1 },
            { name: "Builder_2", body: bodyBuilder, role: "builder" },
            { name: "Upgrader_2", body: bodyUpgrader, role: "upgrader" },
            { name: "Builder_3", body: bodyBuilder, role: "builder" },
            { name: "Upgrader_3", body: bodyUpgrader, role: "upgrader" },
            //{ name: "Carrier_5", body: bodyCarrier, role: "carrier" },
            { name: "Upgrader_4", body: bodyUpgrader, role: "upgrader" } ];
    }
}

makeCreepName = function(spawn, blueprint) {
    return spawn.name + "_" + blueprint.name;
}

wantedCreep = function(spawn) {
    var target = targetCreeps(spawn);

    for (var i = 0; i < target.length; i++) {
        if (Game.creeps[makeCreepName(spawn, target[i])]) {
            continue;
        }
        
        if (target[i].remote && !(spawn.memory["remoteRooms"] &&
                                  spawn.memory["remoteRooms"].length > target[i].remoteIndex)) {
            continue;
        }
        if (target[i].remote &&
            Game.rooms[spawn.memory["remoteRooms"][target[i].remoteIndex]] &&
            Game.rooms[spawn.memory["remoteRooms"][target[i].remoteIndex]].find(FIND_SOURCES).length <= target[i].source) {
            continue;
        }
        if (target[i].remote &&
            !Game.rooms[spawn.memory["remoteRooms"][target[i].remoteIndex]] &&
            target[i].source > 0) {
            continue;
        }
        
        if (target[i].remoteWar && !(spawn.memory["remoteWar"])) {
            continue;
        }
        if (target[i].remoteClaim && !(spawn.memory["remoteClaims"] &&
                                       spawn.memory["remoteClaims"].length > 0)) {
            continue;
        }

        if (target[i].condition && !(target[i].condition(spawn))) {
            continue;
        }
        
        return target[i];
    }
    return null
}

spawnFromBlueprint = function(spawn, blueprint) {
    var name = makeCreepName(spawn, blueprint);
    var res = spawn.spawnCreep(blueprint.body, name)
    if (res == OK) {
        var creep = Game.creeps[name];
        for (key in creep.memory) {
            delete creep.memory[key];
        }
        creep.memory["role"] = blueprint.role;
        creep.memory["spawn"] = spawn.name;
        if ("source" in blueprint) {
            creep.memory["source"] = blueprint.source;
        }

        if (blueprint.remote) {
            creep.memory["remoteRoom"] =
                spawn.memory["remoteRooms"][blueprint.remoteIndex];
        }
        if (blueprint.remoteClaim) {
            creep.memory["remoteRoom"] =
                spawn.memory["remoteClaims"][0];
        }

        if (blueprint.mem) {
            for (key in blueprint.mem) {
                creep.memory[key] = blueprint.mem[key];
            }
        }
        
        recordEnergyUse(spawn, "spawn", bodyCost(blueprint.body));
    }
    return res;
}

spawnInitializeIfNeedBe = function(spawn) {
    if (spawn.memory["initialized"]) { return; }
    spawn.memory["initialized"] = true;

    var sources = spawn.room.find(FIND_SOURCES);
    for (var i = 0; i < sources.length; i++) {
        buildRoad(spawn.pos, sources[i].pos);
    }
    buildRoad(spawn.pos, spawn.room.controller.pos);
}

bootstrapIfNeedBe = function(spawn) {
    var foundCarrier = false;
    var foundGoodCarrier = false;
    spawn.memory["bootstrap"] = true;
    spawn.memory["softBootstrap"] = true;
    var foundHarvester = false;
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory["spawn"] == spawn.name) {
            if (creep.memory["role"] == "harvester") {
                foundHarvester = true;
            } else if (creep.memory["role"] == "carrier") {
                foundCarrier = true;
                if (!creep.memory["onlyUpgrade"] && !creep.spawning) {
                    foundGoodCarrier = true;
                }
            }
        }
        if (foundHarvester && foundCarrier) {
            spawn.memory["bootstrap"] = false;
        }
        if (foundHarvester && foundGoodCarrier) {
            spawn.memory["softBootstrap"] = false;
            return;
        }
    }
}

bodyCost = function(body) {
    var cost = 0;
    for (var i = 0; i < body.length; i++) {
        cost += BODYPART_COST[body[i]];
    }
    return cost;
}
creepCost = function(creep) {
    var cost = 0;
    for (var i = 0; i < creep.body.length; i++) {
        cost += BODYPART_COST[creep.body[i].type];
    }
    return cost;
}
creepCostPerTick = function(creep) {
    return creepCost(creep)/1500;
}

decayEnergyUse = function(spawn) {
    if (!spawn.memory["energyUse"]) { spawn.memory["energyUse"] = {};}
    for (type in spawn.memory["energyUse"]) {
        spawn.memory["energyUse"][type] *= (1-1/300);
    }
    
    if (!spawn.memory["energyUse10"]) { spawn.memory["energyUse10"] = {};}
    for (type in spawn.memory["energyUse10"]) {
        spawn.memory["energyUse10"][type] *= (1-1/3000);
    }

    if (!spawn.memory["energyUse100"]) { spawn.memory["energyUse100"] = {};}
    for (type in spawn.memory["energyUse100"]) {
        spawn.memory["energyUse100"][type] *= (1-1/30000);
    }
}
recordEnergyUse = function(spawn, type, amount) {
    if (!spawn.memory["energyUse"]) { spawn.memory["energyUse"] = {};}
    if (!spawn.memory["energyUse"][type]) { spawn.memory["energyUse"][type] = 0; }
    spawn.memory["energyUse"][type] += amount/300;
    
    if (!spawn.memory["energyUse10"]) { spawn.memory["energyUse10"] = {};}
    if (!spawn.memory["energyUse10"][type]) { spawn.memory["energyUse10"][type] = 0; }
    spawn.memory["energyUse10"][type] += amount/3000;

    if (!spawn.memory["energyUse100"]) { spawn.memory["energyUse100"] = {};}
    if (!spawn.memory["energyUse100"][type]) { spawn.memory["energyUse100"][type] = 0; }
    spawn.memory["energyUse100"][type] += amount/30000;
}

creepRecordEnergyUse = function(creep, type) {
    creep.memory["energyUseType"] = type;
    creep.memory["energyUseBefore"] = creep.store[RESOURCE_ENERGY];
}
creepRecordEnergyGain = function(creep, type) {
    creep.memory["energyUseType"] = type;
    creep.memory["energyUseBefore"] = -creep.store[RESOURCE_ENERGY];
}
creepApplyRecordedEnergyUse = function(creep) {
    if (!creep.memory["energyUseType"]) return;
    var spawn = Game.spawns[creep.memory["spawn"]];
    var oldAmount = creep.memory["energyUseBefore"];
    var amount;
    if (oldAmount > 0) {
        amount = oldAmount - creep.store[RESOURCE_ENERGY];
    } else {
        amount = creep.store[RESOURCE_ENERGY] + oldAmount;
    }
    var type = creep.memory["energyUseType"];
    recordEnergyUse(spawn, type, amount);
    creep.memory["energyUseType"] = null;
}

autoRemoteWar = function(spawn) {
    var hostileStructures = spawn.room.find(FIND_HOSTILE_STRUCTURES);
    var hostileCreeps = spawn.room.find(FIND_HOSTILE_CREEPS);
    if (hostileStructures.length > 0 || hostileCreeps.length > 0) {
        spawn.memory["remoteWar"] = spawn.room.name;
        return;
    }
    
    if (!spawn.memory["remoteRooms"]) { return; }
    var unknown = false;
    for (var i = 0; i < spawn.memory["remoteRooms"].length; i++) {
        var remoteRoom = Game.rooms[spawn.memory["remoteRooms"][i]];
        if (!remoteRoom) { unknown = true; continue; }
        hostileStructures = remoteRoom.find(FIND_HOSTILE_STRUCTURES);
        hostileCreeps = remoteRoom.find(FIND_HOSTILE_CREEPS);
        if (hostileStructures.length == 0 && hostileCreeps.length == 0) { continue; }
        spawn.memory["remoteWar"] = remoteRoom.name;
        return;
    }
    if (!unknown) { spawn.memory["remoteWar"] = null; }
}

energyAvailableForUpgrade = function(spawn, time="") {
    var energyUse = Game.spawns["Spawn1"].memory["energyUse"+time];
    if (!energyUse["harvested"]) { energyUse["harvested"] = 0; }
    if (!energyUse["remoteHarvested"]) { energyUse["remoteHarvested"] = 0; }
    if (!energyUse["spawn"]) { energyUse["spawn"] = 0; }
    if (!energyUse["build"]) { energyUse["build"] = 0; }
    if (!energyUse["remoteBuild"]) { energyUse["remoteBuild"] = 0; }
    if (!energyUse["repair"]) { energyUse["repair"] = 0; }
    if (!energyUse["remoteRepair"]) { energyUse["remoteRepair"] = 0; }
    if (!energyUse["wallUp"]) { energyUse["wallUp"] = 0; }
    return (energyUse["harvested"]+energyUse["remoteHarvested"]
            -energyUse["spawn"]
            -energyUse["build"]-energyUse["remoteBuild"]
            -energyUse["repair"]-energyUse["remoteRepair"]
            -energyUse["wallUp"]);
}

remoteCarryNeeded = function(spawn, remoteRoomIndex) {
    var defaultNumber = 14;
    
    if (!spawn.memory["remoteRooms"]) { return defaultNumber; }
    if (remoteRoomIndex >= spawn.memory["remoteRooms"].length) { return defaultNumber; }
    var remoteRoomName = spawn.memory["remoteRooms"][remoteRoomIndex];
    if (!spawn.memory["remoteRoomsData"]) { return defaultNumber; }
    if (!spawn.memory["remoteRoomsData"][remoteRoomName]) { return defaultNumber; }
    if (!spawn.memory["remoteRoomsData"][remoteRoomName]["timeToSource"]) { return defaultNumber; }
    var timesArray = spawn.memory["remoteRoomsData"][remoteRoomName]["timeToSource"];
    var totalTime = 0;
    for (var i = 0; i < timesArray.length; i++) {
        if (timesArray[i] < 0) { return defaultNumber; }
        totalTime += timesArray[i] + 10;
    }
    return 0.09 * totalTime;
}

autoExtensions = function(spawn) {
    var controller = spawn.room.controller;
    var maxExtensions = [0, 0, 5, 10, 20, 30, 40, 50, 60][controller.level];
    for (flagName in Game.flags) {
        var flag = Game.flags[flagName];
        if (flag.color == COLOR_YELLOW &&
            flag.memory["order"] <= maxExtensions &&
            flag.memory["spawn"] == spawn.name) {
            var res = spawn.room.createConstructionSite(flag.pos.x,flag.pos.y,
                                                        STRUCTURE_EXTENSION);
            if (res == OK) { flag.remove(); }
        }
    }
    
}

/*
for (i = 1; i <= 60; i++) {
    if (Game.flags["Extension_"+i]) {
        Game.flags["Extension_"+i].memory["order"]=i;
        Game.flags["Extension_"+i].memory["spawn"]="Spawn1";
    }
}
*/

builderNeeded = function(spawn) {
    for (id in Game.constructionSites) {
        var site = Game.constructionSites[id];
        if (site.room && site.room.name == spawn.room.name) {
            return true;
        }
    }
    
    return !hasTower(spawn);
}

hasTower = function(spawn) {
    if (typeof spawn.hasTower == "boolean") {
        return spawn.hasTower;
    }
    if (spawn.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure => structure.structureType == STRUCTURE_TOWER) })) {
        spawn.hasTower = true;
    } else {
        spawn.hasTower = false;
    }
    return spawn.hasTower;
}

spawnOwnsRoomIndex = function(spawn, index) {
    var roomName;
    var roomMemory;
    if (!(spawn.memory["remoteRooms"] && spawn.memory["remoteRooms"][index])) { return false; }
    roomName = spawn.memory["remoteRooms"] && spawn.memory["remoteRooms"][index];
    if (!(spawn.memory["remoteRoomsData"] && spawn.memory["remoteRoomsData"][roomName])) { return false; }
    roomMemory = spawn.memory["remoteRoomsData"][roomName];
    
    return !!roomMemory["owned"]
}


module.exports = manageSpawn;
