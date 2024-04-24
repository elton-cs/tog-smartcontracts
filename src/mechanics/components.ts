import { Field, Struct } from "o1js";

export class Position2D extends Struct({ x: Field, y: Field }) {
    static new(x: number, y: number) {
        return { x: Field(x), y: Field(y) }
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
