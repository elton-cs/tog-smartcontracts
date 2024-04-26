import { Field, Poseidon, PublicKey, SmartContract, State, UInt64, method, state } from "o1js";
import { GameState } from "../../gamestate/gamestate";

export class Player extends SmartContract {
    @state(PublicKey) gameStateContract = State<PublicKey>();

    @state(Field) pendingMoveAction = State<Field>();
    @state(Field) pendingAttackAction = State<Field>();

    @state(UInt64) actionTick = State<UInt64>();
    @state(UInt64) gameTick = State<UInt64>();


    init() {
        super.init();

        this.gameStateContract.set(PublicKey.empty());

        this.actionTick.set(UInt64.from(0));
        this.gameTick.set(UInt64.from(0));

        this.pendingMoveAction.set(Field(0));
        this.pendingAttackAction.set(Field(0));
    }

    @method joinGame(gameStateContract: PublicKey) {
        this.gameStateContract.getAndRequireEquals().assertEquals(PublicKey.empty());

        let gameStateContractInstance = new GameState(gameStateContract);
        let playerAddress = this.address;

        let isP1 = gameStateContractInstance.p1Contract.get().equals(playerAddress);
        let isP2 = gameStateContractInstance.p2Contract.get().equals(playerAddress);

        isP1.or(isP2).assertTrue();
        this.gameStateContract.set(gameStateContract);
    }

    @method setPendingActions(moveDirection: Field, attackDirection: Field, actionSalt: Field) {
        // validate action tick to verify if the player is allowed to submit actions
        let tick = this.actionTick.getAndRequireEquals();
        this.gameTick.getAndRequireEquals().assertEquals(tick);

        this.pendingMoveAction.getAndRequireEquals();
        this.pendingAttackAction.getAndRequireEquals();

        // numbers 1-9 represent valid directions for movement (cardinal or diagonal)
        moveDirection.assertGreaterThanOrEqual(Field(1));
        moveDirection.assertLessThanOrEqual(Field(9));

        // numbers 2,4,6,8 represent valid directions for movement (cardinal only)
        let isValidAttack = attackDirection.equals(Field(2)).or(attackDirection.equals(Field(4))).or(attackDirection.equals(Field(6))).or(attackDirection.equals(Field(8)));
        isValidAttack.assertTrue();

        // hash the move and attack actions
        let hiddentMoveAction = Poseidon.hash([moveDirection, actionSalt]);
        let hiddenAttackAction = Poseidon.hash([attackDirection, actionSalt]);

        // commit the actions
        this.pendingMoveAction.set(hiddentMoveAction);
        this.pendingAttackAction.set(hiddenAttackAction);

        // increment the action tick
        this.actionTick.set(tick.add(1));
    }

    @method checkGameProgress() {
        let gameStateContract = new GameState(this.gameStateContract.getAndRequireEquals());

        let gameStateGameTick = gameStateContract.gameTick.getAndRequireEquals();
        gameStateGameTick.assertEquals(this.gameTick.getAndRequireEquals().add(1));

        this.gameTick.set(gameStateGameTick);
    }
}
