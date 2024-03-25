import { Bool, Field, SmartContract, State, UInt64, method, state } from "o1js";
import { Position2D } from "../components";

export class GameMap extends SmartContract {
    @state(Position2D) mapBound = State<Position2D>();
    @state(UInt64) mapTick = State<UInt64>();

    init() {
        super.init();
        this.mapBound.set({x: Field(0), y: Field(0)});
        this.mapTick.set(UInt64.from(0));
    }

    @method createMapArea(newMapBound: Position2D) {
        let noMapBound = this.mapBound.getAndRequireEquals();
        let isZeroMapOnchain = noMapBound.x.equals(Field(0)).and(noMapBound.y.equals(Field(0)));
        isZeroMapOnchain.assertEquals(Bool(true));

        let isValidMap = newMapBound.x.greaterThanOrEqual(Field(4)).and(newMapBound.y.greaterThanOrEqual(Field(4)));
        isValidMap.assertTrue();

        this.mapBound.set(newMapBound);
    }

}