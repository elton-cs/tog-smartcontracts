// import { Add } from './Add';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate } from 'o1js';
import { GameMap } from './map/map';
import { Position } from './player/position';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = true;

describe('Player Placement on Map Integration', () => {
    let togDeployerAccount: PublicKey,
        togDeployerKey: PrivateKey,
        mapContractAddress: PublicKey,
        mapContractKey: PrivateKey,
        mapZkApp: GameMap;

    
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
        mapContractKey = PrivateKey.random();
        mapContractAddress = mapContractKey.toPublicKey();
        mapZkApp = new GameMap(mapContractAddress);  
    });

    async function localDeploy() {
        const txn = await Mina.transaction(togDeployerAccount, () => {
            AccountUpdate.fundNewAccount(togDeployerAccount);
            mapZkApp.deploy();
        });
        await txn.prove();
        // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
        await txn.sign([togDeployerKey, mapContractKey]).send();
    }

    it('generates and deploys the `GameMap` smart contract', async () => {
        await localDeploy();
        const maxX = mapZkApp.maxX.get();
        expect(maxX).toEqual(Field(0));
        const maxY = mapZkApp.maxY.get();
        expect(maxY).toEqual(Field(0));
    });

    it('creates a basic 10x10 game map', async () => {
        await localDeploy();

        const txn = await Mina.transaction(togDeployerAccount, () => {
            mapZkApp.setMap(Field(10), Field(10));
        });
        await txn.prove();
        await txn.sign([togDeployerKey]).send();

        const maxX = mapZkApp.maxX.get();
        expect(maxX).toEqual(Field(10));
        const maxY = mapZkApp.maxY.get();
        expect(maxY).toEqual(Field(10));
    });

    
});