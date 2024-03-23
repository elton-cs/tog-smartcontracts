import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon } from 'o1js';
import { FullMovement, Position2D } from './fullmovement';

let proofsEnabled = true;

describe('Player Position', () => {
    let togDeployerKey: PrivateKey,
        togDeployerAddress: PublicKey,
        playerKey: PrivateKey,
        playerAddress: PublicKey,
        fullmoveContractKey: PrivateKey,
        fullmoveContractAddress: PublicKey,
        fullmoveZkApp: FullMovement;

    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: togDeployerKey, publicKey: togDeployerAddress } = Local.testAccounts[0]);
    ({ privateKey: playerKey, publicKey: playerAddress } = Local.testAccounts[1]);

    beforeAll(async () => {
        if (proofsEnabled) {
            await FullMovement.compile();
        }
    });

    beforeEach(() => {
        const Local = Mina.LocalBlockchain({ proofsEnabled });
        Mina.setActiveInstance(Local);
        ({ privateKey: togDeployerKey, publicKey: togDeployerAddress } = Local.testAccounts[0]);
        ({ privateKey: playerKey, publicKey: playerAddress } = Local.testAccounts[1]);

        fullmoveContractKey = PrivateKey.random();
        fullmoveContractAddress = fullmoveContractKey.toPublicKey();
        fullmoveZkApp = new FullMovement(fullmoveContractAddress); 
    });

    async function fullmoveDeploy() {
        const txn = await Mina.transaction(togDeployerAddress, () => {
            AccountUpdate.fundNewAccount(togDeployerAddress);
            fullmoveZkApp.deploy();
        });
        await txn.prove();
        await txn.sign([togDeployerKey, fullmoveContractKey]).send();
    }

    // unit tests
    it('generates and deploys the `FullMovement` smart contract', async () => {
        await fullmoveDeploy();

        let initPosition = Field(0);
        let initMapBound = new Position2D({x: Field(10), y: Field(10)});

        let deployedInitPosition = fullmoveZkApp.playerPosition2D.get();
        expect(deployedInitPosition).toEqual(initPosition);

        let deployedInitMapBound = fullmoveZkApp.rectangleMapBound.get(); 
        expect(deployedInitMapBound).toEqual(initMapBound);

    });

    it('sets initial position for player', async () => {
        await fullmoveDeploy();

        let myCurrentPosition = new Position2D({x: Field(2), y: Field(2)});
        let mySecretSalt = Field(42069);
        
        const txn = await Mina.transaction(playerAddress, () => {
            fullmoveZkApp.setInitPosition(myCurrentPosition, mySecretSalt);
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        let myCurrentPositionHash = Poseidon.hash([myCurrentPosition.x, myCurrentPosition.y, mySecretSalt])
        
        let onchainPosition = fullmoveZkApp.playerPosition2D.get();
        expect(onchainPosition).toEqual(myCurrentPositionHash);
    });

    it('moves player position in all cardinal directions', async () => {
        // init position setup
        await fullmoveDeploy();
        let myCurrentPosition = new Position2D({x: Field(2), y: Field(2)});
        let mySecretSalt = Field(42069);
        let myCurrentPositionHash: Field;
        let onchainPosition: Field;

        // sets initial position to (2,2)
        let txn = await Mina.transaction(playerAddress, () => {
            fullmoveZkApp.setInitPosition(myCurrentPosition, mySecretSalt);
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        let directionVectors = {
            UP: {x: Field(0), y: Field(1)},
            DOWN: {x: Field(0), y: Field(-1)},
            LEFT: {x: Field(-1), y: Field(0)},
            RIGHT: {x: Field(1), y: Field(0)},
        }

        // MOVING UP:
        txn = await Mina.transaction(playerAddress, () => {
            fullmoveZkApp.moveCardinal(myCurrentPosition, directionVectors.UP, mySecretSalt )
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        myCurrentPosition = {x: Field(2), y: Field(3)};
        myCurrentPositionHash = Poseidon.hash([myCurrentPosition.x, myCurrentPosition.y, mySecretSalt]);
        
        onchainPosition = fullmoveZkApp.playerPosition2D.get();
        expect(onchainPosition).toEqual(myCurrentPositionHash);
        
        // MOVING RIGHT:
        txn = await Mina.transaction(playerAddress, () => {
            fullmoveZkApp.moveCardinal(myCurrentPosition, directionVectors.RIGHT, mySecretSalt )
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        myCurrentPosition = {x: Field(3), y: Field(3)};
        myCurrentPositionHash = Poseidon.hash([myCurrentPosition.x, myCurrentPosition.y, mySecretSalt]);
        
        onchainPosition = fullmoveZkApp.playerPosition2D.get();
        expect(onchainPosition).toEqual(myCurrentPositionHash);
        
        
        // MOVING DOWN:
        txn = await Mina.transaction(playerAddress, () => {
            fullmoveZkApp.moveCardinal(myCurrentPosition, directionVectors.DOWN, mySecretSalt )
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        myCurrentPosition = {x: Field(3), y: Field(2)};
        myCurrentPositionHash = Poseidon.hash([myCurrentPosition.x, myCurrentPosition.y, mySecretSalt]);
        
        onchainPosition = fullmoveZkApp.playerPosition2D.get();
        expect(onchainPosition).toEqual(myCurrentPositionHash);
        
        // MOVING LEFT:
        txn = await Mina.transaction(playerAddress, () => {
            fullmoveZkApp.moveCardinal(myCurrentPosition, directionVectors.LEFT, mySecretSalt )
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        myCurrentPosition = {x: Field(2), y: Field(2)};
        myCurrentPositionHash = Poseidon.hash([myCurrentPosition.x, myCurrentPosition.y, mySecretSalt]);
        
        onchainPosition = fullmoveZkApp.playerPosition2D.get();
        expect(onchainPosition).toEqual(myCurrentPositionHash);

    });

    it('moves player position in all diagonal directions', async () => {
        // init position setup
        await fullmoveDeploy();
        let myCurrentPosition = new Position2D({x: Field(2), y: Field(2)});
        let mySecretSalt = Field(42069);
        let myCurrentPositionHash: Field;
        let onchainPosition: Field;

        // sets initial position to (2,2)
        let txn = await Mina.transaction(playerAddress, () => {
            fullmoveZkApp.setInitPosition(myCurrentPosition, mySecretSalt);
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        let directionVectors = {
            UP_RIGHT: {x: Field(1), y: Field(1)},
            UP_LEFT: {x: Field(-1), y: Field(1)},
            DOWN_RIGHT: {x: Field(1), y: Field(-1)},
            DOWN_LEFT: {x: Field(-1), y: Field(-1)},
        }

        // MOVING UP_RIGHT:
        txn = await Mina.transaction(playerAddress, () => {
            fullmoveZkApp.moveDiagonal(myCurrentPosition, directionVectors.UP_RIGHT, mySecretSalt )
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        myCurrentPosition = {x: Field(3), y: Field(3)};
        myCurrentPositionHash = Poseidon.hash([myCurrentPosition.x, myCurrentPosition.y, mySecretSalt]);
        
        onchainPosition = fullmoveZkApp.playerPosition2D.get();
        expect(onchainPosition).toEqual(myCurrentPositionHash);
        
        // MOVING DOWN_RIGHT:
        txn = await Mina.transaction(playerAddress, () => {
            fullmoveZkApp.moveDiagonal(myCurrentPosition, directionVectors.DOWN_RIGHT, mySecretSalt )
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        myCurrentPosition = {x: Field(4), y: Field(2)};
        myCurrentPositionHash = Poseidon.hash([myCurrentPosition.x, myCurrentPosition.y, mySecretSalt]);
        
        onchainPosition = fullmoveZkApp.playerPosition2D.get();
        expect(onchainPosition).toEqual(myCurrentPositionHash);
        
        
        // MOVING DOWN_LEFT:
        txn = await Mina.transaction(playerAddress, () => {
            fullmoveZkApp.moveDiagonal(myCurrentPosition, directionVectors.DOWN_LEFT, mySecretSalt )
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        myCurrentPosition = {x: Field(3), y: Field(1)};
        myCurrentPositionHash = Poseidon.hash([myCurrentPosition.x, myCurrentPosition.y, mySecretSalt]);
        
        onchainPosition = fullmoveZkApp.playerPosition2D.get();
        expect(onchainPosition).toEqual(myCurrentPositionHash);
        
        // MOVING UP_LEFT:
        txn = await Mina.transaction(playerAddress, () => {
            fullmoveZkApp.moveDiagonal(myCurrentPosition, directionVectors.UP_LEFT, mySecretSalt )
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        myCurrentPosition = {x: Field(2), y: Field(2)};
        myCurrentPositionHash = Poseidon.hash([myCurrentPosition.x, myCurrentPosition.y, mySecretSalt]);
        
        onchainPosition = fullmoveZkApp.playerPosition2D.get();
        expect(onchainPosition).toEqual(myCurrentPositionHash);

    });

});