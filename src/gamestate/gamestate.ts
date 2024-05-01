import { Field, Poseidon, Provable, PublicKey, SmartContract, State, UInt64, method, state } from "o1js";
import { DirectionVector2D, Position2D } from "../mechanics/components";
import { Player } from "../mechanics/player/player";


export class GameState extends SmartContract {
    @state(Field) p1HashedContract = State<Field>();
    @state(Field) p2HashedContract = State<Field>();

    @state(Field) p1PositionHash = State<Field>();
    @state(Field) p2PositionHash = State<Field>();

    @state(Field) p1Health = State<Field>();
    @state(Field) p2Health = State<Field>();

    @state(UInt64) gameTick = State<UInt64>();
    @state(UInt64) subTick = State<UInt64>();


    init() {
        super.init();

        this.p1HashedContract.set(Field(0));
        this.p2HashedContract.set(Field(0));

        this.gameTick.set(UInt64.from(0));
        this.subTick.set(UInt64.from(0));

        this.p1PositionHash.set(Field(0));
        this.p2PositionHash.set(Field(0));

        this.p1Health.set(Field(0));
        this.p2Health.set(Field(0));
    }

    @method instantiatePlayerContracts(p1Contract: PublicKey, p2Contract: PublicKey) {
        // let p1PlayerZkApp = new Player(p1Contract);
        // p1PlayerZkApp.gameStateContract.getAndRequireEquals().assertEquals(this.address);

        // let p2PlayerZkApp = new Player(p2Contract);
        // p2PlayerZkApp.gameStateContract.getAndRequireEquals().assertEquals(this.address);

        let hashedP1Contract = Poseidon.hash(p1Contract.toFields());
        let hashedP2Contract = Poseidon.hash(p2Contract.toFields());
        this.p1HashedContract.set(hashedP1Contract);
        this.p2HashedContract.set(hashedP2Contract);
    }

    @method instantiatePlayerPositions(p1Position: Position2D, p2Position: Position2D) {
        // temporary: set initial positions
        // todo: replace with random position generation
        this.p1PositionHash.getAndRequireEquals().assertEquals(Field(0));
        this.p2PositionHash.getAndRequireEquals().assertEquals(Field(0));

        let hashedP1Position = Poseidon.hash(p1Position.toFields());
        let hashedP2Position = Poseidon.hash(p2Position.toFields());

        this.p1PositionHash.set(hashedP1Position);
        this.p2PositionHash.set(hashedP2Position);
    }

    @method instantiatePlayerHealth(playerHealth: Field) {
        this.p1Health.getAndRequireEquals().assertEquals(Field(0));
        this.p2Health.getAndRequireEquals().assertEquals(Field(0));

        this.p1Health.set(playerHealth);
        this.p2Health.set(playerHealth);
    }


    @method updateP1Move(playerContract: PublicKey, currentPlayerPosition: Position2D, moveDirection: Field, actionSalt: Field) {
        const playerZkApp = new Player(playerContract);
        this.gameTick.getAndRequireEquals().add(1).assertEquals(playerZkApp.actionTick.getAndRequireEquals());

        let playerPositionHash = Poseidon.hash(currentPlayerPosition.toFields());
        this.p1PositionHash.getAndRequireEquals().assertEquals(playerPositionHash);

        // verify revealed actions match pending actions from player contract
        let pendingMove = Poseidon.hash([moveDirection, actionSalt]);
        playerZkApp.pendingMoveAction.getAndRequireEquals().assertEquals(pendingMove);

        // update player position from pending move action
        let directionVector = DirectionVector2D.from(moveDirection);
        let newPlayerPosition = currentPlayerPosition.addDirectionVector(directionVector);

        let newPositionHash = Poseidon.hash(newPlayerPosition.toFields());
        this.p1PositionHash.set(newPositionHash);

        this.subTick.getAndRequireEquals().assertEquals(UInt64.from(0));
        this.subTick.set(UInt64.from(1));
    }

    @method updateP2Move(playerContract: PublicKey, currentPlayerPosition: Position2D, moveDirection: Field, actionSalt: Field) {
        const playerZkApp = new Player(playerContract);
        this.gameTick.getAndRequireEquals().add(1).assertEquals(playerZkApp.actionTick.getAndRequireEquals());

        let playerPositionHash = Poseidon.hash(currentPlayerPosition.toFields());
        this.p2PositionHash.getAndRequireEquals().assertEquals(playerPositionHash);

        // verify revealed actions match pending actions from player contract
        let pendingMove = Poseidon.hash([moveDirection, actionSalt]);
        playerZkApp.pendingMoveAction.getAndRequireEquals().assertEquals(pendingMove);

        // update player position from pending move action
        let directionVector = DirectionVector2D.from(moveDirection);
        let newPlayerPosition = currentPlayerPosition.addDirectionVector(directionVector);

        let newPositionHash = Poseidon.hash(newPlayerPosition.toFields());
        this.p2PositionHash.set(newPositionHash);

        this.subTick.getAndRequireEquals().assertEquals(UInt64.from(1));
        this.subTick.set(UInt64.from(2));
    }

    @method updateP1Attack(playerContract: PublicKey, updatedP1Position: Position2D, updatedP2Position: Position2D, attackDirection: Field, actionSalt: Field) {
        const playerZkApp = new Player(playerContract);
        this.gameTick.getAndRequireEquals().add(1).assertEquals(playerZkApp.actionTick.getAndRequireEquals());

        // verify revealed actions match pending actions from player contract
        let pendingAttack = Poseidon.hash([attackDirection, actionSalt]);
        playerZkApp.pendingAttackAction.getAndRequireEquals().assertEquals(pendingAttack);

        this.p1PositionHash.getAndRequireEquals().assertEquals(Poseidon.hash(updatedP1Position.toFields()));

        // creat attack range from attack direction
        let attackRanges = updatedP1Position.getAttackRange(DirectionVector2D.from(attackDirection), 5);
        let attackRangeStart = attackRanges.attackStartPosition;
        let attackRangeEnd = attackRanges.attackEndPosition;

        this.p2PositionHash.getAndRequireEquals().assertEquals(Poseidon.hash(updatedP2Position.toFields()));

        // update player health based on attack range
        let xMatches = updatedP2Position.x.greaterThanOrEqual(attackRangeStart.x).and(updatedP2Position.x.lessThanOrEqual(attackRangeEnd.x)).and(updatedP2Position.y.equals(attackRangeStart.y));
        let yMatches = updatedP2Position.y.greaterThanOrEqual(attackRangeStart.y).and(updatedP2Position.y.lessThanOrEqual(attackRangeEnd.y)).and(updatedP2Position.x.equals(attackRangeStart.x));

        let attackWillHit = xMatches.or(yMatches);

        let p2Health = this.p2Health.getAndRequireEquals();

        p2Health.assertGreaterThanOrEqual(Field(2));

        let newP2Health = Provable.if(
            attackWillHit,
            p2Health.sub(Field(2)),
            p2Health
        );

        this.p2Health.set(newP2Health);

        this.subTick.getAndRequireEquals().assertEquals(UInt64.from(2));
        this.subTick.set(UInt64.from(3));
    }

    @method updateP2Attack(playerContract: PublicKey, updatedP1Position: Position2D, updatedP2Position: Position2D, attackDirection: Field, actionSalt: Field) {
        const playerZkApp = new Player(playerContract);
        this.gameTick.getAndRequireEquals().add(1).assertEquals(playerZkApp.actionTick.getAndRequireEquals());

        // verify revealed actions match pending actions from player contract
        let pendingAttack = Poseidon.hash([attackDirection, actionSalt]);
        playerZkApp.pendingAttackAction.getAndRequireEquals().assertEquals(pendingAttack);

        this.p2PositionHash.getAndRequireEquals().assertEquals(Poseidon.hash(updatedP2Position.toFields()));

        // creat attack range from attack direction
        let attackRanges = updatedP2Position.getAttackRange(DirectionVector2D.from(attackDirection), 5);
        let attackRangeStart = attackRanges.attackStartPosition;
        let attackRangeEnd = attackRanges.attackEndPosition;

        this.p1PositionHash.getAndRequireEquals().assertEquals(Poseidon.hash(updatedP1Position.toFields()));

        // update player health based on attack range
        let xMatches = updatedP1Position.x.greaterThanOrEqual(attackRangeStart.x).and(updatedP1Position.x.lessThanOrEqual(attackRangeEnd.x)).and(updatedP1Position.y.equals(attackRangeStart.y));
        let yMatches = updatedP1Position.y.greaterThanOrEqual(attackRangeStart.y).and(updatedP1Position.y.lessThanOrEqual(attackRangeEnd.y)).and(updatedP1Position.x.equals(attackRangeStart.x));

        let attackWillHit = xMatches.or(yMatches);

        let p1Health = this.p1Health.getAndRequireEquals();

        p1Health.assertGreaterThanOrEqual(Field(2));

        let newP1Health = Provable.if(
            attackWillHit,
            p1Health.sub(Field(2)),
            p1Health
        );

        this.p1Health.set(newP1Health);

        this.subTick.getAndRequireEquals().assertEquals(UInt64.from(3));
        this.subTick.set(UInt64.from(4));
    }

    @method completeRound() {
        // reset sub tick
        let tick = this.subTick.getAndRequireEquals();
        tick.assertEquals(UInt64.from(4));
        this.subTick.set(UInt64.from(0));

        // update game tick
        let gameTick = this.gameTick.getAndRequireEquals();
        this.gameTick.set(gameTick.add(1));
    }

}