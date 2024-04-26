import { Field, Poseidon, SmartContract, State, UInt64, method, state } from "o1js";

export class Player extends SmartContract {

    @state(Field) pendingMoveAction = State<Field>();
    @state(Field) pendingAttackAction = State<Field>();

    @state(UInt64) actionTick = State<UInt64>();
    @state(UInt64) gameTick = State<UInt64>();


    init() {
        super.init();
        this.actionTick.set(UInt64.from(0));
        this.gameTick.set(UInt64.from(0));

        this.pendingMoveAction.set(Field(0));
        this.pendingAttackAction.set(Field(0));
    }

    @method setPendingActions(moveDirection: Field, attackDirection: Field, actionSalt: Field) {
        let tick = this.actionTick.getAndRequireEquals();
        this.gameTick.getAndRequireEquals().assertEquals(tick);

        this.pendingMoveAction.getAndRequireEquals();
        this.pendingAttackAction.getAndRequireEquals();

        // numbers 1-9 represent valid directions for movement and attacking (based on number pad notation)
        moveDirection.assertGreaterThanOrEqual(Field(1));
        moveDirection.assertLessThanOrEqual(Field(9));

        attackDirection.assertGreaterThanOrEqual(Field(1));
        attackDirection.assertLessThanOrEqual(Field(9));

        let hiddentMoveAction = Poseidon.hash([moveDirection, actionSalt]);
        let hiddenAttackAction = Poseidon.hash([attackDirection, actionSalt]);

        this.pendingMoveAction.set(hiddentMoveAction);
        this.pendingAttackAction.set(hiddenAttackAction);

        this.actionTick.set(tick.add(1));
    }
}
