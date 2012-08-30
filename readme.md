#channel.js
A simple node.js module, that allows you to channel multiple streams over another stream/socket

###features
- channeling/tunneling multiple streams over one single stream
- fairly sharing the bandwith over all open channels
- one channel cannot block the other chnalles by writing huge Buffers, they get splitted to user defined chunks
- as small overhead as possible (4bytes per 4096bytes of data)

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