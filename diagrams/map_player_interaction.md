``` mermaid
sequenceDiagram
    tog ->> map : createMapArea()
    tog ->> move : setGameInstanceMap()
    move -->> map : gets map bounds
    map -->> move : 
    tog ->> move : setInitPosition()
    tog ->> player : gives player initial position
    move --> player : 
    tog --> player : TODO
    tog ->> map : start a game tick counter
    loop Game Round
        tog ->> map : commit to player's position
        player ->> move : move(cardinal/diagonal)
        move -->> map : syncs game ticks
        map -->> move : 
        tog ->> map : update game state and increment tick
    end
```