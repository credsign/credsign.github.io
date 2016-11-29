var argv = require('yargs').argv;
var fs = require('fs');
var path = require('path');
var readlineSync = require('readline-sync');
var Socket = require('net').Socket;
var solc = require('solc');
var spawn = require('child_process').spawn;
var Web3 = require('web3');
var webpack = require('webpack');

var geth, server;


process.on('exit', () => {
  server && server.close();
  geth && geth.close();
});

if (argv.sync) {
  if (argv.network == 'mainnet') {
    startMainnetServer(() => {});
  }
  else if (argv.network == 'testnet') {
    startTestnetServer(argv.mine, () => {});
  }
  else if (argv.network == 'privnet') {
    startPrivnetServer(() => {});
  }
}
else if (argv.serve) {
  buildFrontend();
}
else if (argv.deploy) {
  var network = argv.network || '';
  var mode = argv.contracts || 'all';
  var socket = new Socket();
  deploy(network, mode, socket, (error) => {
    if (error) {
      console.log(error.toString());
    }
    socket.end();
  });
}
else {
  console.error(
    '\nCommands:\n'+
    '\t--sync --network=[mainnet|testnet|privnet] [--mine]\n'+
    '\t--serve\n'+
    '\t--deploy --network=[mainnet|testnet|privnet] --contracts=[all]\n'
  );
}

function startPrivnetServer(callback) {
  geth = spawn('./geth', [
    '--datadir', './privnet/node/datadir',
    'init', './privnet/node/genesis.json'
  ]);
  geth.on('close', (code) => {
    geth = spawn('./geth', [
      '--datadir=./privnet/node/datadir',
      '--ipcpath='+getIPCPath(),
      '--rpc',
      '--rpccorsdomain=*',
      '--nodiscover',
      '--networkid=1337',
      '--verbosity=4',
      'js', './privnet/node/miner.js'
    ]);
    callback();
    geth.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    geth.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
  })
}

function startTestnetServer(mine, callback) {
  geth = spawn('./geth', [
    '--datadir', './testnet/node/datadir',
    'init', './testnet/node/genesis.json'
  ]);
  geth.on('close', (code) => {
    geth = spawn('./geth', [
      '--datadir=./testnet/node/datadir',
      '--ipcpath='+getIPCPath(),
      '--networkid=3',
      '--verbosity=4'
    ].concat( mine ? ['js', './testnet/node/miner.js'] : [] ));

    // Create an account if this is a fresh sync with no accounts
    if (mine) {
      var socket = new Socket();
      var web3 = new Web3(new Web3.providers.IpcProvider(getIPCPath(), socket));
      (function getAccount() {
        web3.eth.getAccounts((error, result) => {
          if (error) {
            setTimeout(getAccount, 1000);
          }
          else if (result.length == 0) {
            web3.personal.newAccount(readlineSync.question(`> Password for new account: `, { hideEchoBack: true, mask: '' }), () => {
              socket.end();
              callback();
            });
          }
          else {
            socket.end();
            callback();
          }
        });
      })();
    }
    else {
      callback();
    }
    geth.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    geth.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
  })
}

function startMainnetServer(callback) {
  geth = spawn('./geth', [
    // '--ipcdisable',
    // '--port=30304',
    '--ipcpath='+getIPCPath(),
    '--cache=1024',
    '--fast',
    '--verbosity=4'
  ]);
  callback();
  geth.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  geth.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });
}

function buildFrontend() {
  server = spawn('python', ['-m', 'SimpleHTTPServer']);
  webpack({
    devtool: 'source-map',
    entry: './app/src/scripts/initialize.jsx',
    module: {
      loaders: [
        {
          test: /\.(js|jsx)$/,
          loader: 'babel-loader',
          // exclude: /node_modules/,
          query: {
            presets: ['es2015', 'react']
          }
        }
      ]
    },
    output: { path: './app/dist/', filename: 'bundle.js' },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress: { warnings: true }
      })
    ],
    watch: true
  }, function (err, stats) {
    var errors = stats.compilation.errors;
    if (errors.length == 0) {
      console.log(`Successful build at ${new Date().toLocaleTimeString()}`);
    }
    else {
      console.log(`Failed build at ${new Date().toLocaleTimeString()}`);
      console.log(stats.compilation.errors.toString());
    }
  });
}

function getIPCPath() {
  // Geth Testnet uses a different IPC path than mainnet by default
  // Overwrite the default so the integration with Mist doesn't break
  if (process.platform === 'darwin') {
    return path.resolve(process.env['HOME'], 'Library/Ethereum/geth.ipc');
  }
  else if (process.platform === 'freebsd' || process.platform === 'linux' || process.platform === 'sunos') {
    return path.resolve(process.env['HOME'], '.ethereum/geth.ipc');
  }
  else if (process.platform === 'win32') {
    return '\\\\.\\pipe\\geth.ipc';
  }
  else {
    throw new Error('Unsupported platform');
  }
}

function deploy(network, mode, socket, done) {
  var web3 = new Web3(new Web3.providers.IpcProvider(getIPCPath(), socket));

  var sources = {};
  (function readContracts(base, sub) {
    fs.readdirSync(base + sub).forEach(function(file) {
      var path = sub + file;
      if (fs.statSync(base + path).isDirectory()) {
        readContracts(base, path + '/');
      }
      else if (path.slice(-4) == '.sol') {
        sources[path] = fs.readFileSync(base + path, 'utf-8')
      }
    });
  })('./contracts/', '');
  console.log(`* Loaded ${Object.keys(sources).length} contracts`);

  var compiled = {};
  var compilation = solc.compile({sources: sources});
  if (compilation.errors) {
    console.log('x Failed to compile contracts');
    done(compilation.errors);
    return;
  }
  console.log('* Compiled contracts');

  var account;
  var password;
  var contracts = {};
  var oldContracts = {};
  (function getAccount() {
    web3.eth.getAccounts((error, result) => {
      if (error) {
        setTimeout(getAccount, 1000);
      }
      else if (result.length == 0) {
        throw new Error('No accounts available');
      }
      else {
        account = result[0];
        password = readlineSync.question(`> Account password (${account}): `, { hideEchoBack: true, mask: '' });

        try {
          oldContracts = JSON.parse(fs.readFileSync(path.resolve(network, 'contracts.json'), 'utf-8'));
        }
        catch (e) { }

        if (mode == 'all') {
          deployContract('Identity', [], () => {
            deployContract('Index', [], () => {
              deployContract('Content', [], () => {
                deployContract('ChannelSeries', [ contracts['Content'].address ], () => {
                  deployContract('ContentSeries', [ contracts['Content'].address ], () => {
                    deployContract('AddressSeries', [ contracts['Content'].address ], writeContracts);
                  });
                });
              });
            });
          });
        }
        else {
          throw new Error(`Deploy mode ${mode} not defined`);
        }
      }
    });
  })();

  function deployContract(symbolName, constructorArgs, callback) {
    var interface = JSON.parse(compilation.contracts[symbolName].interface);
    var bytecode = compilation.contracts[symbolName].bytecode;
    var dependencies = {};
    Object.keys(contracts).forEach((symbol) => {
      dependencies[symbol] = contracts[symbol].address;
    });
    var contract = web3.eth.contract(interface);
    bytecode = contract.new.getData.apply(this, constructorArgs.concat({
      data: solc.linkBytecode(bytecode, dependencies)
    }));
    web3.personal.unlockAccount(account, password, 300, (error) => {
      if (error) {
        done(error.toString());
        return;
      }
      web3.eth.estimateGas({data: bytecode, from: account}, (error, gasEstimate) => {
        if (error) {
          done(error.toString());
          return;
        }
        contract.new({data: bytecode, from: account, gas: gasEstimate}, (error, result) => {
          if (error) {
            done(error.toString());
            return;
          }
          if (result.address && !contracts.hasOwnProperty(symbolName)) {
            contracts[symbolName] = {
              address: result.address,
              interface: interface
            };
            console.log(`* Deployed ${symbolName} contract`);
            callback();
          }
        });
      });
    });
  }

  function writeContracts() {
    var directory = network == 'mainnet' ? '' : network;
    var filepath = path.resolve(process.cwd(), directory, 'contracts.json');
    fs.writeFileSync(filepath, JSON.stringify(contracts));
    console.log(`* Contract interfaces written to: ${filepath}`);
    done();
  }
}
