# The Distributed News Terminal
Credsign lets you publish and view content using the Ethereum blockchain. The result is an always available, censorship resistant source of information. It is currently in beta on the Ethereum test network, available at <https://credsign.github.io/testnet>.

# Development enviroment setup

**To setup on a local privatenet**

1. Copy or link `geth` to the root of this repo.
2. Run `node dev --privnet` to start your local node. Leave it running.
3. Run `node dev --contracts --deploy=storage --network=privnet` to deploy the contracts. When prompted for a password, use `credsign`.
4. Run `node dev --frontend` to compile the webapp and serve it at <http://localhost:8000/>

Modifying files in `./app/src` will trigger a recompile while the frontend server is running.

# License

Credsign - The Distributed News Terminal - Copyright (C) 2016 Cameron Hejazi

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
