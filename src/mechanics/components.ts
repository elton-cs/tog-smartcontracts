import { Bool, Field, Provable, Struct } from "o1js";

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

    getAttackRange(directionVector: DirectionVector2D, attackRange: number): AttackSurface {
        let x: Field;
        let y: Field;
        let xStart: Field;
        let xEnd: Field;
        let yStart: Field;
        let yEnd: Field;

        x = this.x;
        yStart = this.y.sub(Field(attackRange));
        yEnd = this.y.sub(Field(1));
        let down = new AttackSurface({
            attackStartPosition: new Position2D({ x, y: yStart }),
            attackEndPosition: new Position2D({ x, y: yEnd }),
        })

        y = this.y;
        xStart = this.x.sub(Field(attackRange));
        xEnd = this.x.sub(Field(1));
        let left = new AttackSurface({
            attackStartPosition: new Position2D({ x: xStart, y }),
            attackEndPosition: new Position2D({ x: xEnd, y }),
        })

        y = this.y;
        xStart = this.x.add(Field(1));
        xEnd = this.x.add(Field(attackRange));
        let right = new AttackSurface({
            attackStartPosition: new Position2D({ x: xStart, y }),
            attackEndPosition: new Position2D({ x: xEnd, y }),
        })

        x = this.x;
        yStart = this.y.add(Field(1));
        yEnd = this.y.add(Field(attackRange));
        let up = new AttackSurface({
            attackStartPosition: new Position2D({ x, y: yStart }),
            attackEndPosition: new Position2D({ x, y: yEnd }),
        })

        let attackRanges = Provable.switch(
            [
                directionVector.equals(DirectionVector2D.from(Field(2))),
                directionVector.equals(DirectionVector2D.from(Field(4))),
                directionVector.equals(DirectionVector2D.from(Field(6))),
                directionVector.equals(DirectionVector2D.from(Field(8))),
            ],
            AttackSurface,
            [down, left, right, up]
        )

        return attackRanges;
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
    static from(direction: Field): DirectionVector2D {
        let value = Provable.switch(
            [
                direction.equals(Field(1)),
                direction.equals(Field(2)),
                direction.equals(Field(3)),
                direction.equals(Field(4)),
                direction.equals(Field(5)),
                direction.equals(Field(6)),
                direction.equals(Field(7)),
                direction.equals(Field(8)),
                direction.equals(Field(9)),
            ],
            DirectionVector2D,
            [
                new DirectionVector2D({ x: Field(-1), y: Field(-1) }),
                new DirectionVector2D({ x: Field(0), y: Field(-1) }),
                new DirectionVector2D({ x: Field(1), y: Field(-1) }),
                new DirectionVector2D({ x: Field(-1), y: Field(0) }),
                new DirectionVector2D({ x: Field(0), y: Field(0) }),
                new DirectionVector2D({ x: Field(1), y: Field(0) }),
                new DirectionVector2D({ x: Field(-1), y: Field(1) }),
                new DirectionVector2D({ x: Field(0), y: Field(1) }),
                new DirectionVector2D({ x: Field(1), y: Field(1) }),
            ]
        )

        return value;
    }

    equals(direction: DirectionVector2D): Bool {
        return this.x.equals(direction.x).and(this.y.equals(direction.y));
    }

    multiply(scalar: Field): DirectionVector2D {
        return new DirectionVector2D({
            x: this.x.mul(scalar),
            y: this.y.mul(scalar),
        })
    }

}