dominion-server is an open source text based server for playing the board game dominion. It is designed to be usable by both human and computer players. It is written in javascript to be run using node.js. 

you can start the server from the root of this project by running

node server/server.js

this will start the server listening on all local ips, port 5678, there is a debug log on http port 5679

dominion-client contains a few sample ai's to get you started as we as a few slightly more complex examples that use a simple machine learning algorithm. 

they are a bit more complicated to get started on their own. 

there is a testing framework in test.js that can run many ai's against each other to compare how they perform.

when the server is running on the local machine run

node client/test.js
