// import { Add } from './Add';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon } from 'o1js';
import { GameMap } from '../map/map';
import { Position } from './position';
import { mapDeploy } from '../testHelpers';
import { positionDeploy } from '../testHelpers';

let proofsEnabled = true;

describe('Player Position', () => {
    let togDeployerAccount: PublicKey,
        togDeployerKey: PrivateKey,
        playerAccount: PublicKey,
        playerKey: PrivateKey,
        mapContractAddress: PublicKey,
        mapContractKey: PrivateKey,
        mapZkApp: GameMap,
        positionContractKey: PrivateKey,
        positionContractAddress: PublicKey,
        positionZkApp: Position;


    beforeAll(async () => {
        if (proofsEnabled) {
            await GameMap.compile();
            await Position.compile();
        }
    });

    beforeEach(() => {
        const Local = Mina.LocalBlockchain({ proofsEnabled });
        Mina.setActiveInstance(Local);
        ({ privateKey: togDeployerKey, publicKey: togDeployerAccount } = 
            Local.testAccounts[0]);
        ({ privateKey: playerKey, publicKey: playerAccount } = 
            Local.testAccounts[1]);

        mapContractKey = PrivateKey.random();
        mapContractAddress = mapContractKey.toPublicKey();
        mapZkApp = new GameMap(mapContractAddress); 
        
        positionContractKey = PrivateKey.random();
        positionContractAddress = positionContractKey.toPublicKey();
        positionZkApp = new Position(positionContractAddress); 
    });

    // unit tests
    it('generates and deploys the `Position` smart contract', async () => {
        await mapDeploy(togDeployerKey, mapContractKey, mapZkApp);

        await positionDeploy(togDeployerKey, positionContractKey, positionZkApp);
        const mapAddress = positionZkApp.mapAddress.get();
        expect(mapAddress).toEqual(PublicKey.empty())

    });

    it('adds existing game map into `Position` contract', async () => {
        await mapDeploy(togDeployerKey, mapContractKey, mapZkApp);

        await positionDeploy(togDeployerKey, positionContractKey, positionZkApp);


        const txn = await Mina.transaction(togDeployerAccount, () => {
            positionZkApp.setMap(mapContractAddress);
        });
        await txn.prove();
        await txn.sign([togDeployerKey]).send();

        const mapAddress = positionZkApp.mapAddress.get();
        expect(mapAddress).toEqual(mapContractAddress)

    });

    it('adds existing game map into `Position` contract', async () => {
        await mapDeploy(togDeployerKey, mapContractKey, mapZkApp);
        await positionDeploy(togDeployerKey, positionContractKey, positionZkApp);


        // creating a 10x10 map
        const txn1 = await Mina.transaction(togDeployerAccount, () => {
            mapZkApp.createMapArea(Field(10), Field(10));
        });
        await txn1.prove();
        await txn1.sign([togDeployerKey]).send();

        // setting 10x10 map as default map for position contract 
        const txn2 = await Mina.transaction(togDeployerAccount, () => {
            positionZkApp.setMap(mapContractAddress);
        });
        await txn2.prove();
        await txn2.sign([togDeployerKey]).send();

        // setting player location in map to (2,2)
        const txn3 = await Mina.transaction(togDeployerAccount, () => {
            // player 1 at (2,2)
            positionZkApp.setInitialPosition(Field(1), Field(2), Field(2))
        });
        await txn3.prove();
        await txn3.sign([togDeployerKey]).send();

        const playerPositionHash = Poseidon.hash([Field(1), Field(2), Field(2)])
        const onchainPositionHash = positionZkApp.playerPosition.get();
        expect(onchainPositionHash).toEqual(playerPositionHash);

    });
});