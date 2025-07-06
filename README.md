# 🥔 Hot Potato

Receive an airdrop, don't hold it for too long. On-chain Hot Potato, to make people socialize more.

⚙️ Hot Potato is an onchain social game built for the Zircuit testnet, where players pass a digital "potato" between each other by tapping Arx NFC wristbands. Each potato has a limited lifetime (10 minutes), and if it's not passed in time, it "burns", and rewards are distributed based on how many successful passes occurred and how early a player participated.

The game logic is enforced entirely by a smart contract (HotPotato.sol). It tracks:

- current potato holder
- time when the potato was received
- recent holders (to prevent passing back to the same players)
- transfer history (used for scoring)

Players interact with the system via a mobile-first frontend that integrates with arx.org wristbands using libhalo. Wristbands cryptographically sign messages to authorize potato passes. This allows trustless verification of who initiated each pass without requiring players to pay gas directly - passes are submitted on their behalf by a backend relayer.

Key features:

- Arx wristband support for physical interactions
- Verifiable off-chain signature system
- Potato lifetime countdown
- Burn logic + scoring based on interaction history
- Real-time status UI with dark mode and playful graphics

Built with:

- Solidity (Hardhat 3)
- Next.js + Tailwind (mobile-first)
- Arx / libhalo for NFC and signature verification
- Vercel for hosting (frontend + backend)
- Zircuit Garfield Testnet for deployment

This project is a playful experiment in physical cryptonetworks, social proximity games, and gasless UX using off-chain signatures and onchain enforcement.