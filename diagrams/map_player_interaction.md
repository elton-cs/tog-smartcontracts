# Map and Move Contract Interactions

## Interaction Diagram
``` mermaid
sequenceDiagram
    tog ->> map : createMapArea()
    tog ->> move : setGameInstanceMap()
    tog ->> move : setInitPosition()
    tog ->> network : broadcasts initial player position
    network -->> player : 
    loop Game Loop
        tog ->> map : commitAllPlayerActions()
        player ->> move : moveCardinal() or moveDiagonal()
        tog -->> move : reads for action tick update
        move -->> tog : 
    end
```
## Interaction Details
1. createMapArea(): the unique game instance server (tog) runs this function to set the game map's x and y bounds. 
2. setGameInstanceMap(): tog sets this map bound as the default map area for the player movement contract. Running this function from the move contract pulls the map bound data from the map contract that was set in the previous function call.
3. setInitPosition(): tog sets the initial position for the player. This will be based on a randomizer function to be implemented later. This increments the action tick on the move contract.
4. tog broadcasts the player's initial position to the player.
5. commitAllPlayerActions(): tog commits the game's position state by syncing the map tick to the action tick, and committing the hash of the map tick and the player position, which officially marks the start of the game loop.
6. moveCardinal() or moveDiagonal(): player calls either function to commit to a move action. Can only be called once to progress the action tick.
7. tog observse the player's move contract for updates to the action tick. When updated, tog calls commitAllPlayerActions() again, which commits the player's action, increments the map tick, syncing it to the action tick, and initiating the game loop to allow the player to make another move.