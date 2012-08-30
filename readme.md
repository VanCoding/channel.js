#channel.js
A simple node.js module, that allows you to channel multiple streams over another stream/socket

###features
- channeling/tunneling multiple streams over one single stream
- fairly sharing the bandwith over all open channels
- one channel cannot block the other chnalles by writing huge Buffers, they get splitted to user defined chunks
- as small overhead as possible (4bytes per 4096bytes of data)


###Example
    var net = require("net");
    var channeler = require("./index.js");    
    
    net.createServer(function(c){
        c = new channeler(c); //setup channeler
        c.createChannel().end("Hello"); //open 2 channels and write to them
        c.createChannel().end("World");
        
    }).listen(80);
    
    var c = net.connect(80,function(){
    	c = new channeler(c); //setup channeler
    	c.on("channel",function(ch){ //listen for channels
    		ch.on("data",function(d){ //listen for data
    			console.log("channel "+ch.id+": "+d.toString());
    		});
    	});
    });

###API
####Loading the module
`var channeler = require("channel.js");`

####Channeler
- **new channeler(stream)**; 
    constructor

- **channeler.createChannel()**
    returns new channel

- **Event 'channel'**
    function(channel){}


####Channel

- **write(data,[encoding])**
    writes data to the channel

- **end([data],[encoding])**
    closes one direction of the channel and emits the 'end' event on the other side

- **Event 'data'**
    function(d){}

- **Event 'end'**
    function(){}