import { Field, Poseidon, PublicKey, SmartContract, State, method, state } from "o1js";
import { GameMap } from "../map/map";

export class Position extends SmartContract {
    @state(Field) playerPosition = State<Field>();
    @state(PublicKey) mapAddress = State<PublicKey>();

    init(){
        super.init();
        let emptyPK = PublicKey.empty();
        this.mapAddress.set(emptyPK)
    }

    @method setMap(mapAddress: PublicKey) {
        let emptyAddress = this.mapAddress.getAndRequireEquals();
        emptyAddress.assertEquals(PublicKey.empty())
        this.mapAddress.set(mapAddress);
    }

    @method setInitialPosition(playerNumber: Field, posX: Field, posY: Field) {
        // currently, the number of players in a match is hard-coded
        playerNumber.assertGreaterThanOrEqual(Field(1));
        playerNumber.assertLessThanOrEqual(Field(5));
        posX.assertGreaterThan(Field(0));
        posY.assertGreaterThan(Field(0));

        let mapAddress = this.mapAddress.getAndRequireEquals();
        const gameMap = new GameMap(mapAddress);
        let x = gameMap.maxX.getAndRequireEquals();
        let y = gameMap.maxY.getAndRequireEquals();

        posX.assertLessThanOrEqual(x);
        posY.assertLessThanOrEqual(y);

        let position = Poseidon.hash([playerNumber, posX, posY]);
        this.playerPosition.set(position);
    }
}