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
    }
    
};
module.exports = market;
