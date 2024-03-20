import { Field, Poseidon, PublicKey, SmartContract, State, method, state } from "o1js";
import { GameMap } from "../map/map";

export class Position extends SmartContract {
    @state(Field) playerPosition = State<Field>();
    @state(PublicKey) mapContractAddress = State<PublicKey>();

    init(){
        super.init();
        let emptyPK = PublicKey.empty();
        this.mapContractAddress.set(emptyPK)
    }

    @method linkMap(mapContractAddress: PublicKey) {
        this.mapContractAddress.requireEquals(PublicKey.empty())
        this.mapContractAddress.set(mapContractAddress);
    }

    @method setInitialPosition(playerNumber: Field, posX: Field, posY: Field) {
        // currently, the number of players in a match is hard-coded
        playerNumber.assertGreaterThanOrEqual(Field(1));
        playerNumber.assertLessThanOrEqual(Field(5));
        posX.assertGreaterThanOrEqual(Field(0));
        posY.assertGreaterThanOrEqual(Field(0));

        let mapContractAddress = this.mapContractAddress.getAndRequireEquals();
        const gameMap = new GameMap(mapContractAddress);
        let boundedX = gameMap.maxX.getAndRequireEquals();
        let boundedY = gameMap.maxY.getAndRequireEquals();

        posX.assertLessThanOrEqual(boundedX);
        posY.assertLessThanOrEqual(boundedY);

        let position = Poseidon.hash([playerNumber, posX, posY]);
        this.playerPosition.set(position);
    }
}