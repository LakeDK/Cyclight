# Phillips Hue

This is a node.js based setup to interact with a Phillips Hue bridge over a websocket. 
Furthermore the sketch is configured to use OSC messages - which means that you can for instance train a machine learning algorithm or other external program, and send structured commands to your lighting system over a network. 

Assuming you have node.js installed, follow these steps to use the project:

To start the project, follow the installation instructions in the Hue developer section: https://developers.meethue.com/develop/get-started-2/#

Obtain your username and set the ip address of your hue-bridge in osc-single-lamp.js

Run node bridge.js from terminal 