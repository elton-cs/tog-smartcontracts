import { Field, Struct } from "o1js";

export class Position2D extends Struct({x: Field, y: Field}){
    static new(x: number, y: number){
        return {x: Field(x), y: Field(y)}
    }

    add(position: Position2D): Position2D {
        return new Position2D({
            x: this.x.add(position.x), 
            y: this.y.add(position.y),
        })
    }

    addUnitVector(unitVector: UnitVector2D): Position2D {
        return new Position2D({
            x: this.x.add(unitVector.x), 
            y: this.y.add(unitVector.y),
        })
    }
}

export class UnitVector2D extends Struct({x: Field, y: Field}){
    static up(){
        return {x: Field(0), y: Field(1)}
    }

    static down(){
        return {x: Field(0), y: Field(-1)}
    }

    static left(){
        return {x: Field(-1), y: Field(0)}
    }

    static right(){
        return {x: Field(1), y: Field(0)}
    }
}

export class AttackSurface extends Struct({
    // defines the start and end tiles for where the attack hits
    attackStartPosition: Position2D,
    attackEndPosition: Position2D,
}) {}


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