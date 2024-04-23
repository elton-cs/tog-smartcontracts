import { Bool, Field, Poseidon, PublicKey, SmartContract, State, Struct, UInt64, method, state } from "o1js";
import { AttackSurface, Position2D, UnitVector2D } from "../components";
import { GameMap } from "../map/map";

const attackDistanceDefault = Field(5);

export class Attack extends SmartContract {
    // todo!
    @state(PublicKey) gameMapContract = State<PublicKey>();
    @state(Position2D) mapBound = State<Position2D>();
    @state(UInt64) actionTick = State<UInt64>();
    
    @state(Field) playerPosition = State<Field>();
    @state(Field) playerHealth = State<Field>();
    
    @state(Field) opponentPosition = State<Field>();
    @state(Field) opponentHealth = State<Field>();

    init(){
        super.init();
        // initial player position to center of map
        this.playerPosition.set(Field(0));
        this.opponentPosition.set(Field(0));

        // set default initial health to 10 hit points
        this.playerHealth.set(Field(10));
        this.opponentHealth.set(Field(10));

    }

    @method attackMelee(userPosition: Position2D, playerSalt: Field): AttackSurface {
        let position = this.playerPosition.getAndRequireEquals();
        position.assertEquals(Poseidon.hash([userPosition.x, userPosition.y, playerSalt]));

        let tempX = userPosition.x.sub(Field(1));
        let tempY = userPosition.y.sub(Field(1));
        let attackBottomLeftPoint = new Position2D({x:tempX, y: tempY});

        tempX = userPosition.x.add(Field(1));
        tempY = userPosition.y.add(Field(1));
        let attackTopRightPoint = new Position2D({x:tempX, y: tempY});

        // these points referece the corners of the square of the melee attack surface
        return new AttackSurface({
            attackStartPosition: attackBottomLeftPoint,
            attackEndPosition: attackTopRightPoint  
        });

    }

    @method attackRange(userPosition: Position2D, directionVector: Position2D, playerSalt: Field): AttackSurface {
        let position = this.playerPosition.getAndRequireEquals();
        position.assertEquals(Poseidon.hash([userPosition.x, userPosition.y, playerSalt]));

        // An addition and multiplication check to assert that `directionVector` contains a unit vector
        // multiplying the components of the directionVector should give 0
        let vectorMul = directionVector.x.mul(directionVector.y);
        vectorMul.assertEquals(Field(0));
        // adding the components of the directionVector should give either 1 or -1
        let vectorSum = directionVector.x.add(directionVector.y);
        let isCorrectDirection = vectorSum.equals(Field(1)).or(vectorSum.equals(Field(-1)));
        isCorrectDirection.assertEquals(Bool(true));

        let tempX = userPosition.x.add(Field(5)).mul(directionVector.x);
        let tempY = userPosition.y.add(Field(5)).mul(directionVector.y);

        let attackStartPoint = userPosition;
        let attackEndPoint = new Position2D({x: tempX, y: tempY});

        // these points referece the corners of the square of the melee attack surface
        return new AttackSurface({
            attackStartPosition: attackStartPoint,
            attackEndPosition: attackEndPoint  
        });
    }

    @method attackStraightShot(userPosition: Position2D, directionVector: UnitVector2D, playerSalt: Field):  AttackSurface {

        // assert provided position is the current position onchain
        let position = this.playerPosition.getAndRequireEquals();
        position.assertEquals(Poseidon.hash([userPosition.x, userPosition.y, playerSalt]));

        // validate the provided direction vector is indeed a unit vector
        directionVector.x.mul(directionVector.y).assertEquals(Field(0));
        directionVector.x.add(directionVector.y).square().assertEquals(Field(1));

        let attackVector = new Position2D({
            x: directionVector.x.mul(attackDistanceDefault),
            y: directionVector.y.mul(attackDistanceDefault),
        })

        let attackStartPoisition = userPosition.addUnitVector(directionVector);
        let attackEndPosition = userPosition.add(attackVector);

        return new AttackSurface({
            attackStartPosition: attackStartPoisition,
            attackEndPosition: attackEndPosition,  
        });
    }

    @method verifyAttackHit(userPosition: Position2D, opponentPosition: Position2D, userSaltRevealed: Field, opponentSaltRevealed: Field, attackSurface: AttackSurface): Bool {
        // assert provided user position is the current player position onchain
        let onchainUserPosition = this.playerPosition.getAndRequireEquals();
        onchainUserPosition.assertEquals(Poseidon.hash([userPosition.x, userPosition.y, userSaltRevealed]));

        // assert provided oponent position is the current opponent position onchain
        let onchainOpponentPosition = this.opponentPosition.getAndRequireEquals();
        onchainOpponentPosition.assertEquals(Poseidon.hash([opponentPosition.x, opponentPosition.y, opponentSaltRevealed]));

        // check if opponent is within the x bounds of user attack
        let isWithinX = opponentPosition.x.greaterThanOrEqual(attackSurface.attackStartPosition.x).and(opponentPosition.x.lessThanOrEqual(attackSurface.attackEndPosition.x));
        // check if opponent is within the y bounds of user attack
        let isWithinY = opponentPosition.y.greaterThanOrEqual(attackSurface.attackStartPosition.y).and(opponentPosition.y.lessThanOrEqual(attackSurface.attackEndPosition.y));

        return isWithinX.and(isWithinY);
    }
    
}