// import { Add } from './Add';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon } from 'o1js';
import { GameMap } from './map';

let proofsEnabled = true;

describe('Map', () => {
    let togDeployerAccount: PublicKey,
        togDeployerKey: PrivateKey,
        mapContractAddress: PublicKey,
        mapContractKey: PrivateKey,
        mapZkApp: GameMap;

    beforeAll(async () => {
        if (proofsEnabled) {
            await GameMap.compile();
        }
    });

    beforeEach(() => {
        const Local = Mina.LocalBlockchain({ proofsEnabled });
        Mina.setActiveInstance(Local);
        ({ privateKey: togDeployerKey, publicKey: togDeployerAccount } = 
            Local.testAccounts[0]);

        mapContractKey = PrivateKey.random();
        mapContractAddress = mapContractKey.toPublicKey();
        mapZkApp = new GameMap(mapContractAddress);
    });

    // unit tests
    it('generates and deploys the `GameMap` smart contract', async () => {
        await mapDeploy(togDeployerKey, mapContractKey, mapZkApp);

        const maxX = mapZkApp.maxX.get();
        expect(maxX).toEqual(Field(0));
        const maxY = mapZkApp.maxY.get();
        expect(maxY).toEqual(Field(0));
    });

    it('creates a basic 10x10 game map', async () => {
        await mapDeploy(togDeployerKey, mapContractKey, mapZkApp);

        const txn = await Mina.transaction(togDeployerAccount, () => {
            mapZkApp.createMapArea(Field(10), Field(10));
        });
        await txn.prove();
        await txn.sign([togDeployerKey]).send();

        const maxX = mapZkApp.maxX.get();
        expect(maxX).toEqual(Field(10));
        const maxY = mapZkApp.maxY.get();
        expect(maxY).toEqual(Field(10));
    });
});

// re-usable util functions from map testing
export async function mapDeploy(deployerKey: PrivateKey, zkAppKey: PrivateKey, zkApp: GameMap) {
    const pubkey = deployerKey.toPublicKey();
    const txn = await Mina.transaction(pubkey, () => {
        AccountUpdate.fundNewAccount(pubkey);
        zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppKey]).send();
}