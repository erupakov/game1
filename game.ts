enum UnitStatus {
    alive, killed
}

// create units
const units = new Array();
const fieldUnits = new Array();
const mines = new Array();

class Position {
    public x: number;
    public y: number;

    constructor(_x:number, _y: number) {
        this.x = _x;
        this.y = _y;
    }
    equals(pos: Position):boolean {
        return this.x == pos.x && this.y == pos.y;
    }
}

type ResultFunction = (field: IUnit[]) => boolean;

interface IAction {
    name: String;
}

interface IUnit {
    name: String;
    status: UnitStatus;
    position: Position;
    kill(): boolean;
}

interface IMovingUnit extends IUnit {
    speed: Number;
    startMove(distance: Number): Position;
    stopMove(): boolean;
    moveTo(to: Position): Position;
    moveForward():Position;
}

interface IContainerUnit extends IUnit {
    add(unit: IUnit): boolean;
    remove(unit: IUnit): boolean;
    list(): IUnit[];
}

interface ICombinedUnit extends IUnit {
    children: IUnit[];
    add(child: IUnit): boolean;
    remove(child: IUnit): boolean;
}

interface IShooterUnitAction extends IUnit, IAction {
    caliber: Number;
    shootRange: Number;
    shoot(_amount: Number): boolean;
    reload(): boolean;
}

interface ITowableUnit extends IMovingUnit {
    towTo(to: Position): Position;
}

interface ITowingUnit extends IMovingUnit {
    hook(towable: ITowableUnit): boolean;
    unhook(towable: ITowableUnit): boolean;
}

class BasicUnit implements IUnit {
    public name: String;
    public status: UnitStatus;
    public position: Position;

    constructor(_name: String, _position: Position) {
        this.name = _name;
        this.status = UnitStatus.alive;
        this.position = _position;
    }

    public kill() {
        if (this.status == UnitStatus.killed) {
            return false;
        } else {
            this.status = UnitStatus.killed;
            console.log('This unit is killed: ' + this.name);
            return true;
        }
    }
}

class BasicMovingUnit extends BasicUnit implements IMovingUnit {
    public speed: Number;

    constructor(_name: String, _speed: Number, _position: Position) {
        super(_name, _position);
        this.speed = _speed;
    }
    public moveTo(to: Position): Position {
        if (this.status == UnitStatus.alive) {
            this.position = to;
        } else {
            console.log('This unit is killed: ' + this.name);
        }
        return this.position;
    }

    public startMove(distance: Number): Position {
        return this.position;
    }

    public stopMove(): boolean {
        return true;
    }

    public moveForward(): Position {
        if (this.status == UnitStatus.alive) {
            this.position.y++;
        } else {
            console.log(this.name + ' is killed');
        }
        return this.position;
    }
}

class BasicMovingShooter extends BasicMovingUnit implements IShooterUnitAction {
    caliber: Number;
    shootRange: Number;

    constructor(_name: String, _caliber: Number, _range: Number, _speed: Number, _position: Position) {
        super(_name, _speed, _position);
        this.shootRange = _range;
        this.caliber = _caliber;
    }

    public shoot(_amount: Number): boolean {
        if (this.status == UnitStatus.killed) {
            console.log(this.name + ' is killed');
            return false;
        } else {
            console.log(this.name + 'Boom!')
            return true;
        }
    }

    public reload() {
        if (this.status == UnitStatus.killed) {
            console.log(this.name + ' is killed');
            return false;
        } else {
            console.log(this.name + ' is reloading...');
            return true;
        }
    }
}

class BasicTowableShooter extends BasicUnit implements ITowableUnit, IShooterUnitAction {
    public caliber: Number;
    public shootRange: Number;
    public speed: Number;

    constructor(_name: String, _caliber: Number, _range: Number, _position: Position) {
        super(_name, _position);
        this.shootRange = _range;
        this.caliber = _caliber;
        this.speed = 0;
    }

    public shoot(_amount: Number): boolean {
        if (this.status == UnitStatus.killed) {
            console.log(this.name + ' is killed');
            return false;
        } else {
            console.log(this.name + 'Boom!')
            return true;
        }
    }

    public reload() {
        if (this.status == UnitStatus.killed) {
            console.log(this.name + ' is killed');
            return false;
        } else {
            console.log(this.name + ' is reloading...');
            return true;
        }
    }
    public moveTo(to: Position): Position {
        // cannot move by itself
        console.log(this.name + ' cannot move by itself');
        return this.position;
    }

    public startMove(distance: Number): Position {
        return this.position;
    }

    public stopMove(): boolean {
        return true;
    }

    public moveForward(): Position {
        if (this.status == UnitStatus.alive) {
            this.position.y++;
        } else {
            console.log(this.name + ' is killed');
        }
        return this.position;
    }

    public towTo(to: Position): Position {
        if (this.status == UnitStatus.alive) {
            this.position = to;
        } else {
            throw ('This unit is killed: ' + this.name);
        }
        return this.position;
    }
}

class BasicTowingShooter extends BasicMovingShooter implements ITowingUnit {
    private _hookedUnit: ITowableUnit | null;

    constructor(_name: String, _caliber: Number, _range: Number, _speed: Number, _position: Position) {
        super(_name, _speed, _range, _speed, _position);
        this._hookedUnit = null;
    }

    public hook(towable: ITowableUnit): boolean {
        if (!this._hookedUnit) {
            this._hookedUnit = towable;
        }
        return false;
    }

    public unhook(towable: ITowableUnit): boolean {
        if (this._hookedUnit && this._hookedUnit == towable) {
            this._hookedUnit = null;
            return true;
        }
        return false;
    }

    public moveTo(to: Position): Position {
        if (this._hookedUnit) {
            this.moveTo(to);
            this._hookedUnit.towTo(to);
        }
        return this.position;
    }
    public moveForward(): Position {
        if (this.status == UnitStatus.alive) {
            this.position.y++;
            if (this._hookedUnit) {
                this._hookedUnit.towTo(this.position);
            }
        } else {
            console.log(this.name + ' is killed');
        }
        return this.position;
    }
}

class Soldier extends BasicMovingShooter {
    public rank: String;

    constructor(_name: String, _speed: Number, _rank: String, _position: Position) {
        super(_name, 7.62, 2, _speed, _position);
        this.rank = _rank;
    }
}

class Gun extends BasicTowableShooter {
    constructor(_name: String, _caliber: Number, _range: Number, _position: Position) {
        super(_name, _caliber, _range, _position);
    }
}

class Tank extends BasicMovingShooter {
    public model: String;

    constructor(_name: String, _model: String, _position: Position) {
        super(_name, 120, 4, 30, _position);
        this.model = _model;
    }
}

class BTR extends BasicTowingShooter implements IContainerUnit {
    public model: String;
    private _storage: IUnit[];

    constructor(_name: String, _model: String, _position: Position) {
        super(_name, 30, 3, 40, _position);
        this.model = _model;
        this._storage = new Array<IUnit>();
    }

    public kill(): boolean {
        if (this.status == UnitStatus.alive) {
            this.status = UnitStatus.killed;
            this._storage.forEach(u => u.kill());
            return true;
        } else {
            return false;
        }
    }

    add(unit: IUnit): boolean {
        this._storage.push(unit);
        return true;
    }

    remove(unit: IUnit): boolean {
        const i = this._storage.indexOf(unit);
        if (i > -1) {
            this._storage.splice(i, 1);
            return true;
        }
        return false;
    }

    list(): IUnit[] {
        return this._storage;
    }
}

class Squad extends BasicTowingShooter implements ICombinedUnit {
    public children: IUnit[];

    constructor(_name: String, _speed: Number, _position: Position) {
        super(_name, 7.62, 2, _speed, _position);
        this.children = new Array<IUnit>();
    }

    public kill(): boolean {
        if (this.status == UnitStatus.alive) {
            this.status = UnitStatus.killed;
            this.children.forEach(u => u.kill());
            return true;
        } else {
            return false;
        }
    }

    public add(child: IUnit):boolean {
        this.children.push(child);
        return true;
    }

    public remove(child: IUnit): boolean {
        const i = this.children.indexOf(child);
        if (i > -1) {
            this.children.splice(i, 1);
            return true;
        }
        return false;
    }
}

function isMovingUnit(a: any): a is IMovingUnit {
    return ('speed' in a && 'moveTo' in a && 'moveForward' in a);
}

class Game {
    private fieldSize: number;
    private mines: Position[];
    private units: IUnit[];
    private currentLine: number;
    private checkResults: ResultFunction;

    constructor(_fieldSize: number, _mines: number, _units: Array<IUnit>, _resultFunc: ResultFunction) {
        this.fieldSize = _fieldSize;
        this.mines = new Array<Position>();

        for (var i = 0; i < _mines-1; i++) {
            const newMine = new Position(Math.floor(Math.random()*10), Math.floor(Math.random()*10));
            this.mines.push(newMine);
        }
        this.currentLine = 0;
        this.units = _units;
        this.checkResults = _resultFunc;
    }

    public step(): boolean {
        if (this.currentLine==this.fieldSize) {
            return false;
        }
        this.checkMines();
        for (var i = 0; i < this.fieldSize; i++) {
            const newPos = new Position(i, this.currentLine);
            this.units.forEach((u)=>{
                if (isMovingUnit(u)) {
                    u.moveForward();
                }
            })
        }

        this.currentLine++;
        this.checkMines();
        return this.checkResults(this.units);
    }

    private checkMines(): boolean {
        var blast:boolean = false;
        this.mines.forEach((m)=>{
            this.units.forEach((u)=>{
                if (u.status==UnitStatus.alive) {
                    if (u.position==m) {
                        u.kill();
                        blast = true;
                    }
                }
            })
        })
        return blast;
    }
}

function checkResult(_units: IUnit[]): boolean {
    let soldiers = 0;
    let tanks = 0;
    let btrs = 0;
    let guns = 0;

    _units.forEach((u)=>{
        if (u.status==UnitStatus.alive) {
            if (u instanceof Soldier) {
                soldiers++;
            }
            if (u instanceof Tank) {
                tanks++;
            }
            if (u instanceof BTR) {
                btrs++;
            }
            if (u instanceof Gun) {
                guns++;
            }
        }
    })

    return (soldiers>=4 || tanks>=2);
}

// Generate units
let s1 = new Soldier('Солдат 1', 6, 'рядовой', new Position(Math.floor(Math.random()*10), 0));
let s2 = new Soldier('Солдат 2', 6, 'рядовой', new Position(Math.floor(Math.random()*10), 0));
let s3 = new Soldier('Солдат 3', 6, 'рядовой', new Position(Math.floor(Math.random()*10), 0));
let s4 = new Soldier('Солдат 4', 6, 'ефрейтор', new Position(Math.floor(Math.random()*10), 0));
units.push(s1,s2,s3,s4);

let sq = new Squad('Взвод 1', 6, new Position(Math.floor(Math.random()*10), 0));
sq.add(s1);
sq.add(s2);
fieldUnits.push(s3,s4,sq);

const b1 = new BTR('БТР 1', 'БТР90', new Position(Math.floor(Math.random()*10), 0));
const b2 = new BTR('БТР 2', 'БТР90', new Position(Math.floor(Math.random()*10), 0));
const b3 = new BTR('БТР 3', 'БТР90', new Position(Math.floor(Math.random()*10), 0));

units.push(b1, b2, b3);
fieldUnits.push(b1, b2, b3);

const t1 = new Tank('Танк 1', 'Т90', new Position(Math.floor(Math.random()*10), 0));
const t2 = new Tank('Танк 2', 'Т90', new Position(Math.floor(Math.random()*10), 0));
units.push(t1, t2);
fieldUnits.push(t1, t2);

const g1 = new Gun('Пушка 1', 122, 20, new Position(Math.floor(Math.random()*10), 0));
const g2 = new Gun('Пушка 2', 122, 20, new Position(Math.floor(Math.random()*10), 0));
units.push(g1, g2);
fieldUnits.push(g1, g2);
sq.hook(g1);
b2.hook(g2);

const g = new Game(10, 35, fieldUnits, checkResult);
for (var i=0; i<10; i++) {
    if (!g.step()) {
        console.log('We lost on step %d!', i + 1);
        break;
    }
}
if (checkResult(units)) {
    console.log('We won!!!');
}
