``` mermaid
sequenceDiagram
    Player ->> Mina L1 : deposits tokens for game entry
    Player ->> ToG Zeko L2 : P1, P2, ... P5 request to join lobby
    ToG Zeko L2 ->> Mina L1 : locks P1 through P5's tokens for game
    ToG Zeko L2 ->> ToG Server : signals players are ready
    ToG Server ->> Zeko Game Instance: spins up Zeko game instance
    Zeko Game Instance ->> Player : signals game START
    loop Until Winner
        Player ->> Zeko Game Instance : sends game inputs
        Zeko Game Instance ->> Player : sends game state updates
    end
    Zeko Game Instance ->> Player : signals game END
    Zeko Game Instance ->> ToG Zeko L2 : submits proof of winner with ending game state
    Zeko Game Instance ->> ToG Server : requests to end instance
    ToG Server ->> Zeko Game Instance: ends game instance
    ToG Zeko L2  ->> Mina L1 : submits winner for token reward
    Mina L1 ->> Player : distributes reward to winner
```