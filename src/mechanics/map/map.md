This contract describes the walkable area accessible to all players inside the tower.
It's responsible for giving information to players when trying to move their characters in game and managing the movement throughout the game.

(Or rather, it describes the game map for a given game instance/session?)

Things needed for a game map:
- length of map in x dir
- length of map in y dir
- what area is walkable (ground)
- what area is not walkable (walls)

Process Flow:
- First set a map, using the x and y values to set a rectangle (later use complicated and ramdomized shapes and commit to the map possibly?)