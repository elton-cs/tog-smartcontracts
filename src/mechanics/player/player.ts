import { Field, PublicKey, SmartContract, State, UInt64, assert, method, state } from "o1js";
import { Attack } from "./attack";

export class Player extends SmartContract {
    // one state contract for the player movement
    @state(PublicKey) movementContract = State<PublicKey>();
    @state(Field) pendingMoveAction = State<Field>();
    // one state contract for the player attacks
    @state(PublicKey) attackContract = State<PublicKey>();
    @state(Field) pendingAttackAction = State<Field>();

    @state(UInt64) currentTick = State<UInt64>();

    init() {
        super.init();
        this.currentTick.set(UInt64.from(0));

        this.movementContract.set(PublicKey.empty());
        this.attackContract.set(PublicKey.empty());

        this.pendingMoveAction.set(Field(0));
        this.pendingAttackAction.set(Field(0));
    }

    @method setContracts(movementContract: PublicKey, attackContract: PublicKey) {
        let onchainMovementContract = this.movementContract.getAndRequireEquals();
        let onchainAttackContract = this.attackContract.getAndRequireEquals();

        onchainMovementContract.assertEquals(PublicKey.empty());
        onchainAttackContract.assertEquals(PublicKey.empty());

        this.movementContract.set(movementContract);
        this.attackContract.set(attackContract);
    }

}
