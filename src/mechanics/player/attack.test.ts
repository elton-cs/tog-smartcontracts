import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon } from 'o1js';
// import { Position2D } from '../components';
import { Attack } from './attack';
import { Position2D } from '../components';

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

    it('tests set player position method', async () => {
        await attackDeploy();

        let playerPosition = Position2D.new(5, 5);
        let playerSalt = Field(123);
        let newPlayerPosition = Poseidon.hash([playerPosition.x, playerPosition.y, playerSalt]);

        let txn = await Mina.transaction(playerAddress, () => {
            attackZkApp.setPlayerPosition(playerPosition, playerSalt);
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        let deployedPlayerPosition = attackZkApp.playerPosition.get();
        expect(deployedPlayerPosition).toEqual(newPlayerPosition);



        playerPosition = Position2D.new(100, 62);
        playerSalt = Field(123);
        newPlayerPosition = Poseidon.hash([playerPosition.x, playerPosition.y, playerSalt]);

        txn = await Mina.transaction(playerAddress, () => {
            attackZkApp.setPlayerPosition(playerPosition, playerSalt);
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        deployedPlayerPosition = attackZkApp.playerPosition.get();
        expect(deployedPlayerPosition).toEqual(newPlayerPosition);
    });

    it('tests set opponent position method', async () => {
        await attackDeploy();

        let opponentPosition = Position2D.new(19, 21);
        let opponentSalt = Field(123);
        let newOpponentPosition = Poseidon.hash([opponentPosition.x, opponentPosition.y, opponentSalt]);

        let txn = await Mina.transaction(playerAddress, () => {
            attackZkApp.setOpponentPosition(opponentPosition, opponentSalt);
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        let deployedOpponentPosition = attackZkApp.opponentPosition.get();
        expect(deployedOpponentPosition).toEqual(newOpponentPosition);



        opponentPosition = Position2D.new(54, 758);
        opponentSalt = Field(123);
        newOpponentPosition = Poseidon.hash([opponentPosition.x, opponentPosition.y, opponentSalt]);

        txn = await Mina.transaction(playerAddress, () => {
            attackZkApp.setOpponentPosition(opponentPosition, opponentSalt);
        });
        await txn.prove();
        await txn.sign([playerKey]).send();

        deployedOpponentPosition = attackZkApp.opponentPosition.get();
        expect(deployedOpponentPosition).toEqual(newOpponentPosition);
    });

});