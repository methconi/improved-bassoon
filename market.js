var market = {
    
    check: function(roomName, resourceType, minPrice) {
        var orders = Game.market.getAllOrders({type: ORDER_BUY,
                                               resourceType: resourceType})
        if (!Memory["market"]) { Memory["market"] = {}; }
        if (!Memory["market"]["history"]) { Memory["market"]["history"] = {}; }
        history = Memory["market"]["history"];
        for (i = 0; i < orders.length; i++) {
            var order = orders[i];
            if (order.price < minPrice) { continue; }
            if (history[order.id]) { continue; }
            history[order.id] = order;
            var distance = Game.map.getRoomLinearDistance(roomName, order.roomName, true);
            var costRatio = 1 - Math.exp(-distance/30);
            history[order.id]["distance"] = distance;
            history[order.id]["costRatio"] = costRatio;
        }
    },

    checkEnergy: function(roomName, minPrice, opts = {}) {
        var orders = Game.market.getAllOrders({type: ORDER_BUY, resourceType: RESOURCE_ENERGY});
        var terminal = null;


        var terminals = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {
            filter: (structure => structure.structureType == STRUCTURE_TERMINAL) });
        if (terminals.length < 1) { return; }
        terminal = terminals[0];
        if (terminal.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
            return;
        }
        
        for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            if (order.price <= minPrice) { continue; }
            var distance = Game.map.getRoomLinearDistance(roomName,
                                                          order.roomName);
            var costRatio = 2 - Math.exp(-distance/30);
            var gain = order.price / costRatio;
            if (gain < minPrice) { continue; }/*
            if (!Memory["market"]["energyHistory"]) { Memory["market"]["energyHistory"] = {}; }
            if (!Memory["market"]["energyHistory"][order.id]) {             
                Memory["market"]["energyHistory"][order.id] = {
                    gain: gain,
                    amount: order.amount,
                    remainingAmount: order.remainingAmount,
                    price: order.price,
                    created: order.created,
                    createdTimestamp: order.createdTimestamp };
            }
            */
            if (!(opts.doIt && gain >= opts.doItMinPrice)) { continue; }

            var sellAmount = Math.min(Math.floor(terminal.store.getUsedCapacity(RESOURCE_ENERGY)/costRatio),
                                      order.amount);
            if (sellAmount == 0) { continue; }
            var res = Game.market.deal(order.id, sellAmount, roomName);/*
            if (res == OK) {
                Memory["market"]["energyHistory"][order.id]["sold"] = sellAmount;
            } else {
                Memory["market"]["energyHistory"][order.id]["notSold"] = res;
            }*/
        }
    }
};

weeklyMarketReport = function(resourceType) {
    var history = Game.market.getHistory(resourceType);
    for (i = 0; i < history.length; i++) {
        console.log(history[i].date + ": " + history[i].avgPrice + " (" + history[i].stddevPrice + ") * "
                    + (history[i].volume/1000).toPrecision(3) + "k");
    }
    
    var Avg = 0;
    var Var = 0;
    var Vol = 0;
    
    for (i = 0; i < history.length; i++) {
        Vol += history[i].volume;
        Avg += history[i].avgPrice * history[i].volume;
    }
    Avg = Avg / Vol;
    for (i = 0; i < history.length; i++) {
        Var += history[i].volume * (Math.pow(history[i].avgPrice - Avg, 2)
                                    + Math.pow(history[i].stddevPrice, 2));
    }
    Var = Var / Vol;
    
    console.log("---------------");
    console.log(Avg.toPrecision(3) + " (" + Math.sqrt(Var).toPrecision(3) + ") * "
                + (Vol/1000000).toPrecision(3) + "M"); 
}


module.exports = market;
