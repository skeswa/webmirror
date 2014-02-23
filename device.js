var map = {};
var EMPTY_ARRAY = [];

var getMachines = function(userId){
	if(map[userId]) return map[userId];
	return EMPTY_ARRAY;
};

var registerMachine = function(userId, machineId, peerId, deviceType){
	if(!map[userId]) map[userId] = [];
	map[userId].push({machineId: machineId, peerId: peerId, deviceType: deviceType});
};

var unregisterMachine = function(userId, machineId){
	for(var i=0; i<map[userId].length; i++){
		if(map[userId][i].machineId === machineId){
			map[userId].splice(i, 1);
			break;
		}
	}
};

exports.get = getMachines;
exports.register = registerMachine;
exports.unregister = unregisterMachine;