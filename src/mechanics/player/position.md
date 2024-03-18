This contract manages setting the initial position of a player after a game map is set.
The idea here is to have separate contracts per player, each of which can be used to interact with the game and input movement.

First, the ToG L2 sets the player's position randomly into the game map using this contract.
After which, the player can then take over and perform their movements while following the game map's grid.