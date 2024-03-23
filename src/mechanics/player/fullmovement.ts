import { Bool, Field, Poseidon, SmartContract, State, Struct, method, state } from "o1js";
import { Position2D } from "../components";

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
        let onchainPosition = this.playerPosition2D.getAndRequireEquals();
        onchainPosition.assertEquals(Field(0));

        this.isWithinMapBounds(initPosition);
        let positionHash = Poseidon.hash([initPosition.x, initPosition.y, playerSalt])
        this.playerPosition2D.set(positionHash)
    }

    @method moveCardinal(oldPosition: Position2D, directionVector: Position2D, playerSalt: Field){
        // assert function caller knows the salt, and therefore, has permission to update the position
        let oldPositionHash = this.playerPosition2D.getAndRequireEquals();
        oldPositionHash.assertEquals(Poseidon.hash([oldPosition.x, oldPosition.y, playerSalt]));
        // An addition and multiplication check to assert that `directionVector` contains a unit vector
        // multiplying the components of the directionVector should give 0
        let vectorMul = directionVector.x.mul(directionVector.y);
        vectorMul.assertEquals(Field(0));
        // adding the components of the directionVector should give either 1 or -1
        let vectorSum = directionVector.x.add(directionVector.y);
        let isCorrectDirection = vectorSum.equals(Field(1)).or(vectorSum.equals(Field(-1)));
        isCorrectDirection.assertEquals(Bool(true));

        // add the directionVector to the old position to get the updated position
        let xNew = oldPosition.x.add(directionVector.x);
        let yNew = oldPosition.y.add(directionVector.y);
        this.isWithinMapBounds({x: xNew, y: yNew});
        
        // update to the new position
        let positionHash = Poseidon.hash([xNew, yNew, playerSalt])
        this.playerPosition2D.set(positionHash)
    }

    @method moveDiagonal(oldPosition: Position2D, directionVector: Position2D, playerSalt: Field){
        // assert function caller knows the salt, and therefore, has permission to update the position
        let oldPositionHash = this.playerPosition2D.getAndRequireEquals();
        oldPositionHash.assertEquals(Poseidon.hash([oldPosition.x, oldPosition.y, playerSalt]));
        // An addition and multiplication check to assert that `directionVector` contains a diagonal vector
        // multiplying the components of the vector should give either 1 or -1
        let vectorMul = directionVector.x.mul(directionVector.y);
        let isGoodMultiply = vectorMul.equals(Field(1)).or(vectorMul.equals(Field(-1)));
        isGoodMultiply.assertEquals(Bool(true));
        // adding the components of the directionVector should give 2, 0, or -2
        let vectorSum = directionVector.x.add(directionVector.y);
        let isGoodAddition = vectorSum.equals(Field(2)).or(vectorSum.equals(Field(0))).or(vectorSum.equals(Field(-2)));
        isGoodAddition.assertEquals(Bool(true));

        // add the directionVector to the old position to get the updated position
        let xNew = oldPosition.x.add(directionVector.x);
        let yNew = oldPosition.y.add(directionVector.y);
        this.isWithinMapBounds({x: xNew, y: yNew});

        // update to the new position
        let positionHash = Poseidon.hash([xNew, yNew, playerSalt])
        this.playerPosition2D.set(positionHash)
    }
    
}