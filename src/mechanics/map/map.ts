import { Field, SmartContract, State, method, state } from "o1js";

class GameMap extends SmartContract {
    @state(Field) maxX = State<Field>();
    @state(Field) maxY = State<Field>();

    init() {
        super.init();
        this.maxX.set(Field(0));
        this.maxY.set(Field(0));
    }

    @method setMap(maxX: Field, maxY: Field) {
        let initX = this.maxX.getAndRequireEquals();
        let initY = this.maxY.getAndRequireEquals();

        initX.assertEquals(Field(0));
        initY.assertEquals(Field(0));

        maxX.assertGreaterThan(Field(3));
        maxY.assertGreaterThan(Field(3));

        this.maxX.set(maxX);
        this.maxY.set(maxY);
    }
}