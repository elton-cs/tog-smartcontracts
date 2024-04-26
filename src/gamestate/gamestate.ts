import { Field, Poseidon, Provable, PublicKey, SmartContract, State, UInt64, method, state } from "o1js";
import { DirectionVector2D, Position2D } from "../mechanics/components";
import { Player } from "../mechanics/player/player";


export class GameState extends SmartContract {
    @state(PublicKey) p1Contract = State<PublicKey>();
    @state(Position2D) p1Position = State<Position2D>();
    @state(Field) p1Health = State<Field>();

    @state(PublicKey) p2Contract = State<PublicKey>();
    @state(Position2D) p2Position = State<Position2D>();
    @state(Field) p2Health = State<Field>();

    @state(UInt64) gameTick = State<UInt64>();
    @state(UInt64) subTick = State<UInt64>();


    init() {
        super.init();

        this.p1Contract.set(PublicKey.empty());
        this.p2Contract.set(PublicKey.empty());

        this.gameTick.set(UInt64.from(0));
        this.subTick.set(UInt64.from(0));

        // temporary: set initial positions
        // todo: replace with random position generation
        this.p1Position.set(Position2D.new(3, 5));
        this.p2Position.set(Position2D.new(8, 6));

        this.p1Health.set(Field(10));
        this.p2Health.set(Field(10));
    }

    @method instantiatePlayers(p1Contract: PublicKey, p2Contract: PublicKey) {
        this.p1Contract.getAndRequireEquals().assertEquals(PublicKey.empty());
        this.p2Contract.getAndRequireEquals().assertEquals(PublicKey.empty());

        // assert that the player contracts are not the same
        let isSame = p1Contract.equals(p2Contract);
        isSame.assertFalse();

        this.p1Contract.set(p1Contract);
        this.p2Contract.set(p2Contract);
    }

    @method updatePlayerPositions(moveDirection: Field, actionSalt: Field) {
        // create contract instances from player contract
        const p1Contract = new Player(this.p1Contract.getAndRequireEquals());

        this.gameTick.getAndRequireEquals().assertEquals(p1Contract.actionTick.getAndRequireEquals().add(1));

        // verify revealed actions match pending actions from player contract
        let pendingMove = Poseidon.hash([moveDirection, actionSalt]);
        p1Contract.pendingMoveAction.getAndRequireEquals().assertEquals(pendingMove);

        // update player position from pending move action
        let directionVector = DirectionVector2D.from(moveDirection);
        let newP1Position = this.p1Position.getAndRequireEquals().addDirectionVector(directionVector);
        this.p1Position.set(newP1Position);

        // update the sub tick
        let tick = this.subTick.getAndRequireEquals();
        tick.assertEquals(UInt64.from(0));
        this.subTick.set(tick.add(1));
    }

    @method updatePlayerHealt(attackDirection: Field, actionSalt: Field) {
        // create contract instances from player contract
        const p1Contract = new Player(this.p1Contract.getAndRequireEquals());

        this.gameTick.getAndRequireEquals().assertEquals(p1Contract.actionTick.getAndRequireEquals().add(1));

        // verify revealed actions match pending actions from player contract
        let pendingAttack = Poseidon.hash([attackDirection, actionSalt]);
        p1Contract.pendingAttackAction.getAndRequireEquals().assertEquals(pendingAttack);

        // creat attack range from attack direction
        let directionVector = DirectionVector2D.from(attackDirection);
        let attackRangeStart = this.p1Position.getAndRequireEquals().addDirectionVector(directionVector);
        let attackRangeEnd = this.p1Position.getAndRequireEquals().addDirectionVector(directionVector.multiply(Field(5)));

        // update player health based on attack range
        let p2Position = this.p2Position.getAndRequireEquals();
        let xMatches = p2Position.x.greaterThanOrEqual(attackRangeStart.x).and(p2Position.x.lessThanOrEqual(attackRangeEnd.x)).and(p2Position.y.equals(attackRangeStart.y));
        let yMatches = p2Position.y.greaterThanOrEqual(attackRangeStart.y).and(p2Position.y.lessThanOrEqual(attackRangeEnd.y)).and(p2Position.x.equals(attackRangeStart.x));

        let attackWillHit = xMatches.or(yMatches);

        let p2Health = this.p2Health.getAndRequireEquals();

        let newP2Health = Provable.if(
            attackWillHit,
            p2Health.sub(Field(2)),
            p2Health
        );

        this.p2Health.set(newP2Health);

        // update the sub tick
        let tick = this.subTick.getAndRequireEquals();
        tick.assertEquals(UInt64.from(1));
        this.subTick.set(tick.add(1));
    }

    @method completeRound() {
        // reset sub tick
        let tick = this.subTick.getAndRequireEquals();
        tick.assertEquals(UInt64.from(2));
        this.subTick.set(UInt64.from(0));

        // update game tick
        let gameTick = this.gameTick.getAndRequireEquals();
        this.gameTick.set(gameTick.add(1));
    }

}