import { Bool, Field, Poseidon, PublicKey, SmartContract, State, assert, method, state } from "o1js";
import { GameMap } from "../map/map";
import { Position } from "./position";

export class Movement extends SmartContract {
    @state(PublicKey) mapContractAddress = State<PublicKey>();
    @state(PublicKey) positionContractAddress = State<PublicKey>();


    init(){
        super.init();
        let emptyPK = PublicKey.empty();
        this.mapContractAddress.set(emptyPK);
        this.positionContractAddress.set(emptyPK);

    }

    @method linkMapAndPosition(mapContractAddress: PublicKey, positionContractAddress: PublicKey ) {
        this.mapContractAddress.requireEquals(PublicKey.empty());
        this.mapContractAddress.set(mapContractAddress);

        this.positionContractAddress.requireEquals(PublicKey.empty());
        this.positionContractAddress.set(positionContractAddress);
    }

    @method move(playerNumber: Field, oldX: Field, oldY: Field, newX: Field, newY: Field) {

        let mapContract = this.mapContractAddress.getAndRequireEquals();
        assert(mapContract.isEmpty().not());

        let positionContract = this.positionContractAddress.getAndRequireEquals();
        assert(positionContract.isEmpty().not());
        
        // asserts that new position is still within the map
        let mapZkApp = new GameMap(mapContract);
        let boundedX = mapZkApp.maxX.getAndRequireEquals();
        let boundedY = mapZkApp.maxY.getAndRequireEquals();
        newX.assertGreaterThanOrEqual(Field(0));
        newY.assertGreaterThanOrEqual(Field(0));
        newX.assertLessThanOrEqual(boundedX);
        newY.assertLessThanOrEqual(boundedY);
                
        // asserts that player selects a valid new position that's only 1 step away from old position
        let positionZkApp = new Position(positionContract);
        let initPosition = positionZkApp.playerPosition.getAndRequireEquals();
        initPosition.assertEquals(Poseidon.hash([playerNumber, oldX, oldY]));
        let xDiff = oldX.sub(newX);
        let isValidX = xDiff.equals(Field(1)).or(xDiff.equals(Field(-1)));
        let yDiff = oldY.sub(newY);
        let isValidY = yDiff.equals(Field(1)).or(yDiff.equals(Field(-1)));
        let isValidMove = isValidX.and(isValidY); 
        isValidMove.assertEquals(Bool(true));
        
        let newPosition = Poseidon.hash([playerNumber, newX, newY]);
        positionZkApp.playerPosition.set(newPosition);
    }
}