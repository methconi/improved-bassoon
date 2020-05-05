var market = {
    
    check: function(room, resourceType, minPrice) {
        var orders = Game.market.getAllOrders({type: ORDER_BUY,
                                               resourceType: resourceType})
        if (!Memory["market"]) { Memory["market"] = {}; }
        for (i = 0; i < orders.length; i++) {
            var order = orders[i];
            if (order.price < minPrice) { continue; }
            if (Memory["market"][order.id]) { continue; }
            Memory["market"][order.id] = order;
            var distance = Game.map.getRoomLinearDistance(room.name, order.roomName, true);
            var costRatio = 1 - Math.exp(-distance/30);
            Memory["market"][order.id]["distance"] = distance;
            Memory["market"][order.id]["costRatio"] = costRatio;
        }
    },

    
};

weeklyMarketReport = function(resourceType) {
    var history = Game.market.getHistory(resourceType);
    for (i = 0; i < history.length; i++) {
        console.log(history[i].date + ": " + history[i].avgPrice + " (" + history[i].stddevPrice + ") * "
                    + (history[i].volume/1000) + "k");
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
