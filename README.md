# Channel
Channel lets you publish and view content using the Ethereum blockchain. It is currently in beta on the Ethereum main network at <https://channel.github.io/>. Shoutout to the folks at ChannelMe for giving us this github alias.

# Development enviroment setup

**To setup on a local privatenet**

1. Copy or link `geth` to the root of this repo.
2. Run `node dev --sync --network=privnet` to start your local node. Leave it running.
3. Run `node dev --deploy --network=privnet --contracts=all` to deploy the contracts. When prompted for a password, use `credsign`.
4. Run `node dev --serve` to compile the webapp and serve it at <http://localhost:8000/>

Modifying files in `./app/src` will trigger a recompile while the frontend server is running.

# System Architecture
All the information rendered from within the Cent app is stored on the blockchain. To achieve this, we utilize both log storage and contract storage. The primary difference between the two is that log storage is append-only, whereas contract storage can be written to and modified by a smart contract. Log storage also significantly cheaper, one word (32 bytes) of log storage costs 256 gas, whereas in contract storage it costs 20,000 gas. 

## Contract Storage
For each user, channel, and piece of content, we maintain a set of core properties in contract storage. These properties were chosen on the basis of being actionable: without them in smart contract storage, our application cannot function in a secure, decentralized way. Only a subset of the data available in the presentation layer is stored in contract storage. 
### Accounts
Each account has a deposit address for depositing funds, as well as the total balance for each currency that user currently has deposited. These variables enable depositing and spending currency within the app.
### Content
Each piece of content has the following attributes in contract storage:
- Publisher address
- Channel
- Funds tipped
- Number of responses
- Pointer to head of log storage data

Each of these attributes enables some key functionality within our app: The publisher address is needed to ensure that any money tipped through contract methods is routed to the proper recipient. The channel ensures that the tipped funds are in the same currency as the channel, preventing a post in #ether from earning Augur’s REP. Any aggregated variables, such as funds tipped and number of responses to a piece of content, are incremented with subsequent functions calls to keep tallies of user actions. For all other data, including the content itself, we use log storage and simply maintain a pointer to that data in contract storage.
## Log storage
As mentioned earlier, log storage is significantly cheaper than contract storage. Because of the cost savings, we rely on it for two key functionalities: lists of actions, and content. 
### Lists
For every action a user takes, there are several lists than can be affected, including:
- Posts in a channel
- Posts by a publisher
- Replies to a post
- Tips by a user
- Tips on a post

Keeping track of all these lists in contract storage is both expensive and unnecessary. Instead, we write these events to log storage, with each event pointing to the previous event to form a singly-linked list: 
![Log linked list](http://i.imgur.com/X64EkPh.png)
We also maintain a pointer to the head of the list in contract storage, so that we can efficiently retrieve the first entry and subsequently traverse the list.
### Content
Content is stored in log storage as a temporary measure until IPFS or Swarm are mature enough to rely upon. We use LZMA compression on the body of the post prior to publishing to minimize the number of bytes needed to store a piece of content. At present, storing 1000 words of text (~4 pages) costs X¢ based on current Ether and gas rates. Since log storage is immutable, everything published is final and stored for the indefinite future.

Content is addressed by a content ID, which is simply a hash the content. Addresses are deterministically generated, so a user knows the address of the content before it is published to the blockchain. This enables them to safely link to content, even in the event of a chain re-org. The content ID can be used as a checksum mechanism to verify the integrity of a piece of content. For instance, in light clients, logs are retrieved from some external party. Verifying that the content served is what was intended is simply a matter of hashing the content and ensuring it matches the supplied content ID.


# License

Copyright (C) 2017 Channel

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
