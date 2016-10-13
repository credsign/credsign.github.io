# CredSign - The Distributed News Terminal
CredSign is a content ranking app on the Ethereum network. It provides users with an interface to write and publish content to the Ethereum blockchain. Users can influence content rankings by signing content with there own funds. Signed funds are stored in the contract and can be retrieved at any time. When funds are signed, the rank goes up; when funds are retrieved the rank goes down.

# Development enviroment setup

First, copy or link `geth` to the `./networks` directory of this repo.

**To setup on a local privatenet**

1. In one terminal tab run `npm run privnet-server` and leave it running
2. In another terminal tab run `npm run privnet-deploy`
3. Leave `privnet-server` running to access the app on <http://localhost:8000>

**To setup on the Morden testnet**

1. Update `./networks/testnet/password.txt` with the password for your primary account (`web3.eth.accounts[0]`)
2. In one terminal tab run `npm run testnet-server` and let fully sync (otherwise the deploy will hang). This currently leaves your account unlocked and anyone can spend your testnet funds (!)
3. In another terminal tab run `npm run testnet-deploy`
4. Leave `testnet-server` running to access the app on <http://localhost:8000>

Modifications to the react source files in `./webapp` will automatically recompile while the server is running.

# License

CredSign - The Distributed News Terminal - Copyright (C) 2016 Cameron Hejazi

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
