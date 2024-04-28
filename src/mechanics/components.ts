import { Field, Struct } from "o1js";

export class Position2D extends Struct({ x: Field, y: Field }) {
    static new(x: number, y: number) {
        return new Position2D({
            x: Field(x),
            y: Field(y),
        })
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

    addDirectionVector(directionVector: DirectionVector2D): Position2D {
        return new Position2D({
            x: this.x.add(directionVector.x),
            y: this.y.add(directionVector.y),
        })
    }

    toFields() {
        return [this.x, this.y];
    }
}

export class UnitVector2D extends Struct({ x: Field, y: Field }) {
    static up() {
        return { x: Field(0), y: Field(1) }
    }

    static down() {
        return { x: Field(0), y: Field(-1) }
    }

    static left() {
        return { x: Field(-1), y: Field(0) }
    }

    static right() {
        return { x: Field(1), y: Field(0) }
    }
}

export class AttackSurface extends Struct({
    // defines the start and end tiles for where the attack hits
    attackStartPosition: Position2D,
    attackEndPosition: Position2D,
}) { }

export class DamageComponent extends Struct({
    damage: Field,
    attackType: Field,
    attackRange: AttackSurface
}) { }


export class DirectionVector2D extends Struct({ x: Field, y: Field }) {
    static from(direction: Field) {
        switch (direction) {
            case Field(1):
                return new DirectionVector2D({ x: Field(-1), y: Field(-1) });
            case Field(2):
                return new DirectionVector2D({ x: Field(0), y: Field(-1) });
            case Field(3):
                return new DirectionVector2D({ x: Field(1), y: Field(-1) });
            case Field(4):
                return new DirectionVector2D({ x: Field(-1), y: Field(0) });
            case Field(5):
                return new DirectionVector2D({ x: Field(0), y: Field(0) });
            case Field(6):
                return new DirectionVector2D({ x: Field(1), y: Field(0) });
            case Field(7):
                return new DirectionVector2D({ x: Field(-1), y: Field(1) });
            case Field(8):
                return new DirectionVector2D({ x: Field(0), y: Field(1) });
            case Field(9):
                return new DirectionVector2D({ x: Field(1), y: Field(1) });
            default:
                return new DirectionVector2D({ x: Field(0), y: Field(0) });
        }
    }

    multiply(scalar: Field): DirectionVector2D {
        return new DirectionVector2D({
            x: this.x.mul(scalar),
            y: this.y.mul(scalar),
        })
    }

}