import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Poseidon } from 'o1js';
import { Player } from './mechanics/player/player';
import { GameState } from './gamestate/gamestate';

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
    });


});