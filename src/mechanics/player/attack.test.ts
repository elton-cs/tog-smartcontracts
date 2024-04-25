import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon } from 'o1js';
// import { Position2D } from '../components';
import { Attack } from './attack';

let proofsEnabled = true;

describe('Player Position', () => {
    let togDeployerKey: PrivateKey,
        togDeployerAddress: PublicKey,
        playerKey: PrivateKey,
        playerAddress: PublicKey,
        attackContractKey: PrivateKey,
        attackContractAddress: PublicKey,
        attackZkApp: Attack;

    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: togDeployerKey, publicKey: togDeployerAddress } = Local.testAccounts[0]);
    ({ privateKey: playerKey, publicKey: playerAddress } = Local.testAccounts[1]);

    beforeAll(async () => {
        if (proofsEnabled) {
            await Attack.compile();
        }
    });

    beforeEach(() => {
        const Local = Mina.LocalBlockchain({ proofsEnabled });
        Mina.setActiveInstance(Local);
        ({ privateKey: togDeployerKey, publicKey: togDeployerAddress } = Local.testAccounts[0]);
        ({ privateKey: playerKey, publicKey: playerAddress } = Local.testAccounts[1]);

        attackContractKey = PrivateKey.random();
        attackContractAddress = attackContractKey.toPublicKey();
        attackZkApp = new Attack(attackContractAddress);
    });

    async function attackDeploy() {
        const txn = await Mina.transaction(togDeployerAddress, () => {
            AccountUpdate.fundNewAccount(togDeployerAddress);
            attackZkApp.deploy();
        });
        await txn.prove();
        await txn.sign([togDeployerKey, attackContractKey]).send();
    }

    // unit tests
    it('generates and deploys the `Attack` smart contract', async () => {
        await attackDeploy();

        let initPlayerPosition = Field(0);
        let initOpponentPosition = Field(0);

        let deployedInitPlayerPosition = attackZkApp.playerPosition.get();
        expect(deployedInitPlayerPosition).toEqual(initPlayerPosition);

        let deployedInitOpponentPosition = attackZkApp.opponentPosition.get();
        expect(deployedInitOpponentPosition).toEqual(initOpponentPosition);

        let initPlayerHealth = Field(10);
        let initOpponentHealth = Field(10);

        let deployedInitPlayerHealth = attackZkApp.playerHealth.get();
        expect(deployedInitPlayerHealth).toEqual(initPlayerHealth);

        let deployedInitOpponentHealth = attackZkApp.opponentHealth.get();
        expect(deployedInitOpponentHealth).toEqual(initOpponentHealth);

    });

});