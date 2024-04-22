import { Bool, Field, Poseidon, PublicKey, SmartContract, State, Struct, UInt64, method, state } from "o1js";
import { Position2D, UnitVector2D } from "../components";
import { GameMap } from "../map/map";

const attackDistanceDefault = Field(5);

export class Attack extends SmartContract {
    // todo!
    @state(PublicKey) gameMapContract = State<PublicKey>();
    @state(Position2D) mapBound = State<Position2D>();
    @state(UInt64) actionTick = State<UInt64>();
    
    @state(Field) playerPosition = State<Field>();
    @state(Field) opponentPosition = State<Field>();

    init(){
        super.init();
        // initial player position to center of map
        this.playerPosition.set(Field(0));
        this.opponentPosition.set(Field(0));
    }

    @method attackMelee(userPosition: Position2D, playerSalt: Field): [Position2D, Position2D]{
        let position = this.playerPosition.getAndRequireEquals();
        position.assertEquals(Poseidon.hash([userPosition.x, userPosition.y, playerSalt]));

        let tempX = userPosition.x.sub(Field(1));
        let tempY = userPosition.y.sub(Field(1));
        let attackBottomLeftPoint = new Position2D({x:tempX, y: tempY});

        tempX = userPosition.x.add(Field(1));
        tempY = userPosition.y.add(Field(1));
        let attackTopRightPoint = new Position2D({x:tempX, y: tempY});

        // these points referece the corners of the square of the melee attack surface
        return [attackBottomLeftPoint, attackTopRightPoint];

    }

    @method attackRange(userPosition: Position2D, directionVector: Position2D, playerSalt: Field): [Position2D, Position2D]{
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
        return [attackStartPoint, attackEndPoint];

    }

    @method attackStraightShot(userPosition: Position2D, directionVector: UnitVector2D, playerSalt: Field):  [Position2D, Position2D]{

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

        return [attackStartPoisition, attackEndPosition];
    }

    
}