import { Field, Mina, PrivateKey, PublicKey, AccountUpdate } from 'o1js';
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
});