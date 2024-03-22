import { Bool, Field, Poseidon, SmartContract, State, Struct, method, state } from "o1js";

class Position2D extends Struct({x: Field, y: Field}){}

export class FullMovement extends SmartContract {
    @state(Field) playerPosition2D = State<Field>();
    @state(Position2D) rectangleMapBound = State<Position2D>();


    init(){
        super.init();
        // initial player position to center of map
        this.playerPosition2D.set(Field(0));
        // set max rectangle map bound to (10,10)
        this.rectangleMapBound.set({x: Field(10), y: Field(10)});
    }

    @method isWithinMapBounds(position: Position2D) {
        let mapBound = this.rectangleMapBound.getAndRequireEquals();
        position.x.assertGreaterThanOrEqual(Field(0));
        position.x.assertLessThanOrEqual(mapBound.x);
        position.y.assertGreaterThanOrEqual(Field(0));
        position.y.assertLessThanOrEqual(mapBound.y);
    }

    @method setInitPosition(initPosition: Position2D, playerSalt: Field){
        this.isWithinMapBounds(initPosition);
        let positionHash = Poseidon.hash([initPosition.x, initPosition.y, playerSalt])
        this.playerPosition2D.set(positionHash)
    }
    
}