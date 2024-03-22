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

    @method moveCardinal(oldPosition: Position2D, directionVector: Position2D, playerSalt: Field){
        // An addition and multiplication check to assert that `directionVector` contains a unit vector
        // aka: exactly one 0 value and either a 1 or -1 in the x or y direction
        let vectorMul = directionVector.x.mul(directionVector.y);
        vectorMul.assertEquals(Field(0));
        let vectorSum = directionVector.x.add(directionVector.y);
        let isCorrectDirection = vectorSum.equals(Field(1)).or(vectorSum.equals(Field(-1)));
        isCorrectDirection.assertEquals(Bool(true));

        let xNew = oldPosition.x.add(directionVector.x);
        let yNew = oldPosition.y.add(directionVector.y);
        this.isWithinMapBounds({x: xNew, y: yNew});

        let positionHash = Poseidon.hash([xNew, yNew, playerSalt])
        this.playerPosition2D.set(positionHash)
    }
    
}