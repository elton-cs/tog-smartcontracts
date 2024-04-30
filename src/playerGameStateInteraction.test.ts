import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, UInt64 } from 'o1js';
import { Player } from './mechanics/player/player';
import { GameState } from './gamestate/gamestate';
import { DirectionVector2D, Position2D } from './mechanics/components';

let proofsEnabled = true;

describe('Player Position', () => {
    let togDeployerKey: PrivateKey,
        togDeployerAddress: PublicKey,
        p1Key: PrivateKey,
        p1Address: PublicKey,
        p2Key: PrivateKey,
        p2Address: PublicKey,
        p1PlayerContractKey: PrivateKey,
        p1PlayerContractAddress: PublicKey,
        p1PlayerZkApp: Player,
        p2PlayerContractKey: PrivateKey,
        p2PlayerContractAddress: PublicKey,
        p2PlayerZkApp: Player,
        gameStateContractKey: PrivateKey,
        gameStateContractAddress: PublicKey,
        gameStateZkApp: GameState;

    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: togDeployerKey, publicKey: togDeployerAddress } = Local.testAccounts[0]);
    ({ privateKey: p1Key, publicKey: p1Address } = Local.testAccounts[1]);
    ({ privateKey: p2Key, publicKey: p2Address } = Local.testAccounts[2]);

    gameStateContractKey = PrivateKey.random();
    gameStateContractAddress = gameStateContractKey.toPublicKey();
    gameStateZkApp = new GameState(gameStateContractAddress);

    p1PlayerContractKey = PrivateKey.random();
    p1PlayerContractAddress = p1PlayerContractKey.toPublicKey();
    p1PlayerZkApp = new Player(p1PlayerContractAddress);

    p2PlayerContractKey = PrivateKey.random();
    p2PlayerContractAddress = p2PlayerContractKey.toPublicKey();
    p2PlayerZkApp = new Player(p2PlayerContractAddress);

    beforeAll(async () => {
        if (proofsEnabled) {
            await GameState.compile();
            await Player.compile();

        }
    });

    async function gameStateDeploy() {
        const txn = await Mina.transaction(togDeployerAddress, () => {
            AccountUpdate.fundNewAccount(togDeployerAddress);
            gameStateZkApp.deploy();
        });
        await txn.prove();
        await txn.sign([togDeployerKey, gameStateContractKey]).send();
    }

    async function playerDeploy(playerAddress: PublicKey, playerKey: PrivateKey, playerContractKey: PrivateKey, playerZkApp: Player) {
        const txn = await Mina.transaction(playerAddress, () => {
            AccountUpdate.fundNewAccount(playerAddress);
            playerZkApp.deploy();
        });
        await txn.prove();
        await txn.sign([playerKey, playerContractKey]).send();
    }

    // unit tests
    it('deploys GameState and Player contracts', async () => {
        await gameStateDeploy();
        await playerDeploy(p1Address, p1Key, p1PlayerContractKey, p1PlayerZkApp);
        await playerDeploy(p2Address, p2Key, p2PlayerContractKey, p2PlayerZkApp);

        expect(gameStateZkApp.subTick.get()).toEqual(UInt64.from(0));
        expect(gameStateZkApp.gameTick.get()).toEqual(UInt64.from(0));
        expect(p1PlayerZkApp.gameTick.get()).toEqual(UInt64.from(0));
        expect(p2PlayerZkApp.gameTick.get()).toEqual(UInt64.from(0));
    });

    it('instantiates players in GameState contract', async () => {
        expect(gameStateZkApp.p1HashedContract.get()).toEqual(Field(0));
        expect(gameStateZkApp.p2HashedContract.get()).toEqual(Field(0));

        let txn = await Mina.transaction(togDeployerAddress, () => {
            gameStateZkApp.instantiatePlayerContracts(p1PlayerContractAddress, p2PlayerContractAddress);
        });
        await txn.prove();
        await txn.sign([togDeployerKey]).send();

        let p1ContractHash = Poseidon.hash(p1PlayerContractAddress.toFields());
        let p2ContractHash = Poseidon.hash(p2PlayerContractAddress.toFields());
        expect(gameStateZkApp.p1HashedContract.get()).toEqual(p1ContractHash);
        expect(gameStateZkApp.p2HashedContract.get()).toEqual(p2ContractHash);

    });

    it('instantiates player positions in GameState contract', async () => {
        expect(gameStateZkApp.p1PositionHash.get()).toEqual(Field(0));
        expect(gameStateZkApp.p2PositionHash.get()).toEqual(Field(0));

        let p1Position = Position2D.new(1, 4);
        let p2Position = Position2D.new(7, 5);

        let txn = await Mina.transaction(togDeployerAddress, () => {
            gameStateZkApp.instantiatePlayerPositions(p1Position, p2Position);
        });
        await txn.prove();
        await txn.sign([togDeployerKey]).send();

        let p1PositionHash = Poseidon.hash(p1Position.toFields());
        let p2PositionHash = Poseidon.hash(p2Position.toFields());
        expect(gameStateZkApp.p1PositionHash.get()).toEqual(p1PositionHash);
        expect(gameStateZkApp.p2PositionHash.get()).toEqual(p2PositionHash);

    });

    it('instantiates player health in GameState contract', async () => {
        expect(gameStateZkApp.p1Health.get()).toEqual(Field(0));
        expect(gameStateZkApp.p2Health.get()).toEqual(Field(0));

        let playerHealth = Field(100);

        let txn = await Mina.transaction(togDeployerAddress, () => {
            gameStateZkApp.instantiatePlayerHealth(playerHealth);
        });
        await txn.prove();
        await txn.sign([togDeployerKey]).send();

        expect(gameStateZkApp.p1Health.get()).toEqual(playerHealth);
        expect(gameStateZkApp.p2Health.get()).toEqual(playerHealth);
    });

    it('joins players from Player contract to GameState contract', async () => {
        expect(p1PlayerZkApp.gameStateContract.get()).toEqual(PublicKey.empty());

        let txn = await Mina.transaction(p1Address, () => {
            p1PlayerZkApp.joinPlayer1(gameStateContractAddress);
        });
        await txn.prove();
        await txn.sign([p1Key]).send();

        expect(p1PlayerZkApp.gameStateContract.get()).toEqual(gameStateContractAddress);

        expect(p2PlayerZkApp.gameStateContract.get()).toEqual(PublicKey.empty());

        txn = await Mina.transaction(p2Address, () => {
            p2PlayerZkApp.joinPlayer2(gameStateContractAddress);
        });
        await txn.prove();
        await txn.sign([p2Key]).send();

        expect(p2PlayerZkApp.gameStateContract.get()).toEqual(gameStateContractAddress);

    });

    it('sets pending actions for player 1', async () => {
        let p1move = Field(6);
        let p1attack = Field(2);
        let p1salt = Field(42069);

        expect(p1PlayerZkApp.pendingMoveAction.get()).toEqual(Field(0));
        expect(p1PlayerZkApp.pendingAttackAction.get()).toEqual(Field(0));
        expect(p1PlayerZkApp.actionTick.get()).toEqual(UInt64.from(0));
        expect(p1PlayerZkApp.gameTick.get()).toEqual(UInt64.from(0));

        let txn = await Mina.transaction(p1Address, () => {
            p1PlayerZkApp.setPendingActions(p1move, p1attack, p1salt);
        });
        await txn.prove();
        await txn.sign([p1Key]).send();

        expect(p1PlayerZkApp.pendingMoveAction.get()).toEqual(Poseidon.hash([p1move, p1salt]));
        expect(p1PlayerZkApp.pendingAttackAction.get()).toEqual(Poseidon.hash([p1attack, p1salt]));
        expect(p1PlayerZkApp.actionTick.get()).toEqual(UInt64.from(1));
        expect(p1PlayerZkApp.gameTick.get()).toEqual(UInt64.from(0));

    });

    it('sets pending actions for player 2', async () => {
        let p2move = Field(1);
        let p2attack = Field(4);
        let p2salt = Field(69420);

        expect(p2PlayerZkApp.pendingMoveAction.get()).toEqual(Field(0));
        expect(p2PlayerZkApp.pendingAttackAction.get()).toEqual(Field(0));
        expect(p2PlayerZkApp.actionTick.get()).toEqual(UInt64.from(0));
        expect(p2PlayerZkApp.gameTick.get()).toEqual(UInt64.from(0));

        let txn = await Mina.transaction(p2Address, () => {
            p2PlayerZkApp.setPendingActions(p2move, p2attack, p2salt);
        });
        await txn.prove();
        await txn.sign([p2Key]).send();

        expect(p2PlayerZkApp.pendingMoveAction.get()).toEqual(Poseidon.hash([p2move, p2salt]));
        expect(p2PlayerZkApp.pendingAttackAction.get()).toEqual(Poseidon.hash([p2attack, p2salt]));
        expect(p2PlayerZkApp.actionTick.get()).toEqual(UInt64.from(1));
        expect(p2PlayerZkApp.gameTick.get()).toEqual(UInt64.from(0));

    });

    it('updates player 1 move in GameState contract', async () => {
        // p1 reveals their move and temp salt value
        let p1move = Field(6);
        let p1salt = Field(42069);

        expect(gameStateZkApp.subTick.get()).toEqual(UInt64.from(0));

        let p1Position = Position2D.new(1, 4);
        let p1NewPosition = p1Position.addDirectionVector(DirectionVector2D.from(p1move));

        expect(gameStateZkApp.p1PositionHash.get()).toEqual(Poseidon.hash(p1Position.toFields()));

        let txn = await Mina.transaction(togDeployerAddress, () => {
            gameStateZkApp.updateP1Move(p1PlayerContractAddress, p1Position, p1move, p1salt);
        });
        await txn.prove();
        await txn.sign([togDeployerKey]).send();

        expect(gameStateZkApp.p1PositionHash.get()).toEqual(Poseidon.hash(p1NewPosition.toFields()));
        expect(gameStateZkApp.subTick.get()).toEqual(UInt64.from(1));

    });

    it('updates player 2 move in GameState contract', async () => {
        // p2 reveals their move and temp salt value
        let p2move = Field(1);
        let p2salt = Field(69420);

        expect(gameStateZkApp.subTick.get()).toEqual(UInt64.from(1));

        let p2Position = Position2D.new(7, 5);
        let p2NewPosition = p2Position.addDirectionVector(DirectionVector2D.from(p2move));

        expect(gameStateZkApp.p2PositionHash.get()).toEqual(Poseidon.hash(p2Position.toFields()));

        let txn = await Mina.transaction(togDeployerAddress, () => {
            gameStateZkApp.updateP2Move(p2PlayerContractAddress, p2Position, p2move, p2salt);
        });
        await txn.prove();
        await txn.sign([togDeployerKey]).send();

        expect(gameStateZkApp.p2PositionHash.get()).toEqual(Poseidon.hash(p2NewPosition.toFields()));
        expect(gameStateZkApp.subTick.get()).toEqual(UInt64.from(2));

    });

    it('updates player 1 attack and health in GameState contract', async () => {
        // p1 reveals their attack and temp salt value
        let p1attack = Field(2);
        let p1salt = Field(42069);

        // p1 revealed move value
        let p1move = Field(6);
        let p2move = Field(1);

        expect(gameStateZkApp.subTick.get()).toEqual(UInt64.from(2));

        let p1Position = Position2D.new(1, 4);
        let p1NewPosition = p1Position.addDirectionVector(DirectionVector2D.from(p1move));

        let p2Position = Position2D.new(7, 5);
        let p2NewPosition = p2Position.addDirectionVector(DirectionVector2D.from(p2move));

        expect(gameStateZkApp.p2Health.get()).toEqual(Field(100));

        expect(gameStateZkApp.p1PositionHash.get()).toEqual(Poseidon.hash(p1NewPosition.toFields()));
        expect(gameStateZkApp.p2PositionHash.get()).toEqual(Poseidon.hash(p2NewPosition.toFields()));

        let txn = await Mina.transaction(togDeployerAddress, () => {
            gameStateZkApp.updateP1Attack(p1PlayerContractAddress, p1NewPosition, p2NewPosition, p1attack, p1salt);
        });
        await txn.prove();
        await txn.sign([togDeployerKey]).send();

        expect(gameStateZkApp.p2Health.get()).toEqual(Field(100));
        expect(gameStateZkApp.subTick.get()).toEqual(UInt64.from(3));

    });

    it('updates player 2 attack and health in GameState contract', async () => {
        // p2 reveals their attack and temp salt value
        let p2attack = Field(4);
        let p2salt = Field(69420);

        // p1 revealed move value
        let p1move = Field(6);
        let p2move = Field(1);

        expect(gameStateZkApp.subTick.get()).toEqual(UInt64.from(3));

        let p1Position = Position2D.new(1, 4);
        let p1NewPosition = p1Position.addDirectionVector(DirectionVector2D.from(p1move));

        let p2Position = Position2D.new(7, 5);
        let p2NewPosition = p2Position.addDirectionVector(DirectionVector2D.from(p2move));

        expect(gameStateZkApp.p1Health.get()).toEqual(Field(100));

        expect(gameStateZkApp.p1PositionHash.get()).toEqual(Poseidon.hash(p1NewPosition.toFields()));
        expect(gameStateZkApp.p2PositionHash.get()).toEqual(Poseidon.hash(p2NewPosition.toFields()));

        let txn = await Mina.transaction(togDeployerAddress, () => {
            gameStateZkApp.updateP2Attack(p2PlayerContractAddress, p1NewPosition, p2NewPosition, p2attack, p2salt);
        });
        await txn.prove();
        await txn.sign([togDeployerKey]).send();

        expect(gameStateZkApp.p1Health.get()).toEqual(Field(100));
        expect(gameStateZkApp.subTick.get()).toEqual(UInt64.from(4));

    });

    it('completes a full round', async () => {
        gameStateZkApp.subTick.get().assertEquals(UInt64.from(4));
        gameStateZkApp.gameTick.get().assertEquals(UInt64.from(0));

        let txn = await Mina.transaction(togDeployerAddress, () => {
            gameStateZkApp.completeRound();
        });
        await txn.prove();
        await txn.sign([togDeployerKey]).send();

        gameStateZkApp.subTick.get().assertEquals(UInt64.from(0));
        gameStateZkApp.gameTick.get().assertEquals(UInt64.from(1));
    });

});