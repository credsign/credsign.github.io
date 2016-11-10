var argv = require('yargs').argv;
var fs = require('fs');
var path = require('path');
var readlineSync = require('readline-sync');
var Socket = require('net').Socket;
var solc = require('solc');
var spawn = require('child_process').spawn;
var Web3 = require('web3');
var webpack = require('webpack');

var geth, server, socket;


process.on('exit', () => {
  server && server.close();
  geth && geth.close();
  socket && socket.end();
});

if (argv.privnet) {
  startPrivnetServer(() => {});
}
else if (argv.testnet) {
  startTestnetServer(() => {});
}
else if (argv.frontend) {
  buildFrontend();
}
else if (argv.contracts) {
  var network = argv.network || '';
  var mode = argv.deploy || 'storage';
  deploy(network, mode, () => {});
}
else {
  console.error(
    '\nCommands:\n'+
    '\t--privnet\n'+
    '\t--testnet\n'+
    '\t--frontend\n'+
    '\t--contracts --network=[testnet|privnet] --mode=[storage]\n'
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

function startTestnetServer(callback) {
  geth = spawn('./geth', [
    '--ipcpath='+getIPCPath(),
    '--cache=1024',
    // '--fast',
    '--rpc',
    '--rpccorsdomain=*',
    '--testnet',
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
    context: path.resolve(process.cwd(), 'app', 'src'),
    entry: './scripts/initialize.jsx',
    module: {
      loaders: [
        {
          test: /\.(js|jsx)$/,
          loader: 'babel-loader',
          // exclude: /node_modules/,
          plugins: [
            // new webpack.optimize.UglifyJsPlugin({
            //   compress: { warnings: false }
            // })
          ],
          query: {
            presets: ['es2015', 'react']
          }
        }
      ]
    },
    output: { path: './app/dist/', filename: 'bundle.js' },
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

function deploy(network, mode, done) {
  socket = new Socket();
  var web3 = new Web3(new Web3.providers.IpcProvider(getIPCPath(), socket));

  var sources = {};
  try {
    fs.readdirSync('./contracts')
    .filter((filename) => filename.slice(-4) == '.sol')
    .forEach((filename) => {
      var symbolName = filename.slice(0, -4);
      if (sources[symbolName] === undefined) {
        var dependencies = [];
        var compilation = solc.compile({
          sources: { [symbolName]: fs.readFileSync(path.resolve('./contracts', filename), 'utf-8') }
        }, 0, (dependencyFilename) => {
          dependencies.push(dependencyFilename.slice(0, -4));
          return {
            contents: fs.readFileSync(path.resolve('./contracts', dependencyFilename), 'utf-8')
          };
        });

        if (compilation.errors) {
          throw new Error(compilation.errors.toString());
        }
        sources[symbolName] = {
          bytecode: compilation.contracts[symbolName].bytecode,
          dependencies: dependencies,
          interface: JSON.parse(compilation.contracts[symbolName].interface),
        };
        console.log('* Compiled ' + symbolName);
      }
    });
  }
  catch (e) {
    done(e);
  }

  var account;
  var password;
  var contracts = {};
  var oldContracts = {};
  (function waitForAccounts() {
    web3.eth.getAccounts((error, result) => {
      if (error || result.length == 0) {
        setTimeout(waitForAccounts, 1000);
      }
      else {
        account = result[0];
        password = readlineSync.question(`Password for account ${account}: `, { hideEchoBack: true, mask: '' });

        try {
          oldContracts = JSON.parse(fs.readFileSync(path.resolve(network, 'contracts.json'), 'utf-8'));
        }
        catch (e) { }

        if (mode == 'storage') {
          deployContract('Indexer', [], () => {
            deployContract('Publisher', [], writeContracts);
          });
        }
        else {
          throw new Error(`Deploy mode ${mode} not defined`);
        }
      }
    });
  })();

  function deployContract(symbolName, constructorArgs, callback) {
    var interface = sources[symbolName].interface;
    var bytecode = sources[symbolName].bytecode;
    var contract = web3.eth.contract(interface);
    var dependencies = {};
    sources[symbolName].dependencies.forEach((dependency) => {
      dependencies[dependency] = contracts[dependency].address;
    });
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
            console.log('* Deployed ' + symbolName);
            callback();
          }
        });
      });
    });
  }

  function writeContracts() {
    fs.writeFileSync(path.resolve(process.cwd(), network, 'contracts.json'), JSON.stringify(contracts));
    console.log('* Contract interfaces saved');
    socket.end();
    done();
  }
}
