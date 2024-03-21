// import { Add } from './Add';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon } from 'o1js';
import { GameMap } from '../map/map';
import { Position } from './position';
import { mapDeploy } from '../testHelpers';
import { positionDeploy } from '../testHelpers';
import { Movement } from './movement';

let proofsEnabled = true;

describe('Player Position', () => {
    let togDeployerKey: PrivateKey,
        togDeployerAddress: PublicKey,
        playerKey: PrivateKey,
        playerAddress: PublicKey,
        mapContractKey: PrivateKey,
        mapContractAddress: PublicKey,
        mapZkApp: GameMap,
        positionContractKey: PrivateKey,
        positionContractAddress: PublicKey,
        positionZkApp: Position,
        movementContractKey: PrivateKey,
        movementContractAddress: PublicKey,
        movementZkApp: Movement;

    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: togDeployerKey, publicKey: togDeployerAddress } = Local.testAccounts[0]);
    ({ privateKey: playerKey, publicKey: playerAddress } = Local.testAccounts[1]);

    
    mapContractKey = PrivateKey.random();
    mapContractAddress = mapContractKey.toPublicKey();
    mapZkApp = new GameMap(mapContractAddress); 
    
    positionContractKey = PrivateKey.random();
    positionContractAddress = positionContractKey.toPublicKey();
    positionZkApp = new Position(positionContractAddress);


    beforeAll(async () => {
        if (proofsEnabled) {
            await GameMap.compile();
            await Position.compile();
            await Movement.compile();
        }

        await mapDeploy(togDeployerKey, mapContractKey, mapZkApp);
        await positionDeploy(togDeployerKey, positionContractKey, positionZkApp);

        // creating a 10x10 map
        const txn1 = await Mina.transaction(togDeployerAddress, () => {
            mapZkApp.createMapArea(Field(10), Field(10));
        });
        await txn1.prove();
        await txn1.sign([togDeployerKey]).send();

        // setting 10x10 map as default map for position contract 
        const txn2 = await Mina.transaction(togDeployerAddress, () => {
            positionZkApp.linkMap(mapContractAddress);
        });
        await txn2.prove();
        await txn2.sign([togDeployerKey]).send();

        // setting player location in map to (2,2)
        const txn3 = await Mina.transaction(togDeployerAddress, () => {
            // player 1 at (2,2)
            positionZkApp.setInitialPosition(Field(1), Field(2), Field(2))
        });
        await txn3.prove();
        await txn3.sign([togDeployerKey]).send();

    });

    beforeEach(async () => {
        movementContractKey = PrivateKey.random();
        movementContractAddress = movementContractKey.toPublicKey();
        movementZkApp = new Movement(movementContractAddress); 
    });

    async function movementDeploy() {
        const txn = await Mina.transaction(togDeployerAddress, () => {
            AccountUpdate.fundNewAccount(togDeployerAddress);
            movementZkApp.deploy();
        });
        await txn.prove();
        await txn.sign([togDeployerKey, movementContractKey]).send();
    }

    // unit tests
    it('generates and deploys the `Movement` smart contract', async () => {
        await movementDeploy();

        let initMapContractAddress = movementZkApp.mapContractAddress.get()
        let initPositionContractAddress = movementZkApp.positionContractAddress.get()
        expect(initMapContractAddress).toEqual(PublicKey.empty())
        expect(initPositionContractAddress).toEqual(PublicKey.empty())

    });

    it('links existing `Map` and `Position` contracts to `Movement` contract', async () => {
        await movementDeploy();

        const txn = await Mina.transaction(playerAddress, () => {
            movementZkApp.linkMapAndPosition(mapContractAddress, positionContractAddress);
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

    });

    it('executes player movement one block diagonally to the right', async () => {
        await movementDeploy();
        const txn = await Mina.transaction(playerAddress, () => {
            movementZkApp.linkMapAndPosition(mapContractAddress, positionContractAddress);
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        const txn2 = await Mina.transaction(playerAddress, () => {
            movementZkApp.move(Field(1), Field(2), Field(2), Field(3), Field(3))
        });
        await txn2.prove();
        await txn2.sign([playerKey]).send();

    });
});