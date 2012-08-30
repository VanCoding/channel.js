var net = require("net");
var channeler = require("./index.js");


net.createServer(function(c){
	c = new channeler(c);
	
	
	var c1 = c.createChannel();
	setInterval(function(){
		c1.write("Hi");
	},1000);
	
	var c2 = c.createChannel();
	setInterval(function(){
		c2.write("hello");
	},250);

	
	
}).listen(80);

var c = net.connect(80,function(){
	c = new channeler(c);
	c.on("channel",function(ch){
		ch.on("data",function(d){
			console.log("channel "+ch.id+": "+d.toString());
		});
	});
});