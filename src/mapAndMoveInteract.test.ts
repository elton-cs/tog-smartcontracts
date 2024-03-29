import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon, SmartContract, UInt64 } from 'o1js';
import { FullMovement } from './mechanics/player/fullmovement';
import { Position2D } from './mechanics/components';
import { GameMap } from './mechanics/map/map';


let proofsEnabled = true;

describe('Player Position', () => {
    let togKey: PrivateKey,
        togAddress: PublicKey,
        playerKey: PrivateKey,
        playerAddress: PublicKey,
        mapContractKey: PrivateKey,
        mapContractAddress: PublicKey,
        mapZkApp: GameMap,
        fullmoveContractKey: PrivateKey,
        fullmoveContractAddress: PublicKey,
        fullmoveZkApp: FullMovement;

    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: togKey, publicKey: togAddress } = Local.testAccounts[0]);
    ({ privateKey: playerKey, publicKey: playerAddress } = Local.testAccounts[1]);

    beforeAll(async () => {
        if (proofsEnabled) {
            await GameMap.compile();
            await FullMovement.compile();
        }
    });

    beforeEach(() => {
        mapContractKey = PrivateKey.random();
        mapContractAddress = mapContractKey.toPublicKey();
        mapZkApp = new GameMap(mapContractAddress); 

        fullmoveContractKey = PrivateKey.random();
        fullmoveContractAddress = fullmoveContractKey.toPublicKey();
        fullmoveZkApp = new FullMovement(fullmoveContractAddress); 
    });

    async function deployContract(deployerKey:PrivateKey, contractKey: PrivateKey, zkApp: SmartContract ) {
        let deployerPubKey = deployerKey.toPublicKey();
        const txn = await Mina.transaction(deployerPubKey, () => {
            AccountUpdate.fundNewAccount(deployerPubKey);
            zkApp.deploy();
        });
        await txn.prove();
        await txn.sign([deployerKey, contractKey]).send();
    }

    // unit tests
    it('generates and deploys the `Map` smart contract', async () => {
        await deployContract(togKey, mapContractKey, mapZkApp);
    
        let expectedMapBound = Position2D.new(0,0);
        let initMapBound = mapZkApp.mapBound.get();
        expect(initMapBound).toEqual(expectedMapBound);
    
        let expectedMapTick = UInt64.from(0);
        let initMapTick = mapZkApp.mapTick.get();
        expect(initMapTick).toEqual(expectedMapTick);
    });
    
});