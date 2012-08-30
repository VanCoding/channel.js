var events = require("events");

function channeler(c,chunksize){
	chunksize = chunksize||4096;
	var idpool = [];
	
	for(var id = 0; id < 65536; id++){
		idpool.push(id);
	}
	
	var channelindex = {};
	var channels = [];
	var self = new events.EventEmitter();
	var writing = false;
	var i = 0;
	
	self.createChannel = function(){
		var ch = new channel(self);
		ch.id = idpool.shift();
		channels.push(ch);
		channelindex[ch.id] = ch;
		return ch;
	}
	self.write = function(){
		if(!writing){
			writing = true;
			var tries = 0;
			for(;tries++ < channels.length; i = (i+1)%channels.length){
				var buf = channels[i].get(chunksize);
				if(buf){
					var head = new Buffer(4);
					head.writeUInt16LE(channels[i].id,0);
					head.writeUInt16LE(buf.length,2);
					c.write(head);
					c.write(buf);
					c.once("drain",function(){						
						writing = false;
						self.write();
					});
					
					if(buf.length == 0){
						channels[i].writable = false;
						removechannel(channels[i]);
					}
					return;
				}
			}
			writing = false;
		}
	}
	
	function removechannel(ch){
		if(!ch.readable && !ch.writable){
			delete channelindex[ch.id];
			channels.splice(channels.indexOf(ch),1);
			idpool.push(ch.id);
		}
	}
	
	var data = "";
	var head = null;
	c.on("data",function(d){
		data += d.toString("binary");
		while(true){
			if(!head){
				if(data.length >= 4){
					head = new Buffer(data.substr(0,4),"binary");
					head = {
						channel:head.readUInt16LE(0),
						length:head.readUInt16LE(2)
					};
					
					if(!channelindex[head.channel]){
						var ch = new channel(self);
						ch.id = head.channel;
						channels.push(ch);
						idpool.splice(idpool.indexOf(ch.id),1);
						channelindex[ch.id] = ch;
						self.emit("channel",ch);
					}
					head.channel = channelindex[head.channel];
					
					data = data.substr(4);
				}else{
					break;
				}
			}else{
				if(data.length >= head.length){
					var buf = new Buffer(data.substr(0,head.length),"binary");
					if(buf.length){
						head.channel.emit("data",buf);
						data = data.substr(buf.length);
					}else{
						head.channel.emit("end");
						head.channel.readable = false;
						removechannel(head.channel);
					}
					head = null;
				}else{
					break;
				}
			}
		}
	});
	
	return self;
}
function channel(c){
	var self = new events.EventEmitter();
	
	var queue = [];
	var available = 0;
	var ended = false;
	var ending = false;
	
	self.readable = true;
	self.writable = true;
	
	self.get = function(chunksize){
		if(available){
			var b = new Buffer(available>chunksize?chunksize:available);
			var pos = 0;
			var remaining = b.length;
			while(queue.length && remaining){
				var buf = queue.shift();
				var amount = buf.length > remaining?remaining:buf.length;
				buf.copy(b,pos,0,amount);
				if(amount < buf.length){
					var newbuf = new Buffer(buf.length-amount);
					buf.copy(newbuf,0,amount);
					queue.unshift(newbuf);
				}
			}
			available -= b.length;
			if(!available){
				self.emit("drain");
			}
			return b;
		}
		if(!ended && ending){
			ended = true;
			return new Buffer(0);
		}else{
			return false;
		}
	}
	
	self.write = function(d,enc){
	
		if(typeof d == "string"){
			d = new Buffer(d,enc);
		}
	
		queue.push(d);
		available += d.length;
		c.write();
	}
	self.end = function(){
		ending = true;
		if(arguments.length > 0){
			self.write.apply(self,Array.prototype.slice.call(arguments));
		}
		c.write();
	}
	
	return self;
}

module.exports = channeler;
