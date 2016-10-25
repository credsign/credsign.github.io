var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var solc = require('solc');
var Web3 = require('web3');
var spawn = require('child_process').spawn;

var solc = require('solc');
var fs = require('fs');
var net = require('net');
var path = require('path');

var geth, server;

gulp.task('privnet', (done) => {
  geth = spawn('./networks/geth', [
    '--datadir', './networks/privnet/datadir',
    'init', './networks/privnet/genesis.json'
  ]);
  geth.on('close', (code) => {
    geth = spawn('./networks/geth', [
      '--datadir=./networks/privnet/datadir',
      '--ipcpath='+getIPCPath(),
      '--rpc',
      '--rpccorsdomain=*',
      '--nodiscover',
      '--networkid=1337',
      '--verbosity=4',
      'js', './networks/privnet/miner.js'
    ]);
    geth.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    geth.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
  })
});


gulp.task('testnet', (done) => {

  geth = spawn('./networks/geth', [
    '--ipcpath='+getIPCPath(),
    '--cache=1024',
    // '--fast',
    '--rpc',
    '--rpccorsdomain=*',
    '--testnet',
    '--verbosity=4'
  ]);
  geth.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  geth.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });
});

gulp.task('terminal-build', () => {
  return gulp.src(['./terminal/src/*'])
    .pipe(sourcemaps.init())
    .pipe(babel({
        'presets': ['es2015', 'react']
    })).on('error', function (error) {
      console.error(error.toString());
      this.emit('end');
    })
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./terminal/dist'));
});

gulp.task('terminal-server', (done) => {
  server = spawn('python', ['-m', 'SimpleHTTPServer']);
  gulp.watch('./terminal/src/*', ['terminal-build']).on('change', (event) => {
    console.log('Frontend file ' + event.path + ' was ' + event.type + ', rebuilding');
  });
});

gulp.task('privnet-server', ['privnet', 'terminal-server'], () => {});
gulp.task('testnet-server', ['testnet', 'terminal-server'], () => {});

gulp.task('privnet-deploy', (done) => { deploy('privnet', 'store', done) });
gulp.task('testnet-deploy', (done) => { deploy('testnet', 'store', done) });

gulp.task('privnet-deploy-index', (done) => { deploy('privnet', 'index', done) });
gulp.task('testnet-deploy-index', (done) => { deploy('testnet', 'index', done) });

gulp.task('default', () => {});

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
  var socket = new net.Socket();
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
  var password = fs.readFileSync(path.resolve('./networks', network, 'password.txt'), 'utf-8');
  var contracts = {};
  var oldContracts = {};
  (function waitForAccounts() {
    web3.eth.getAccounts((error, result) => {
      if (error || result.length == 0) {
        setTimeout(waitForAccounts, 1000);
      }
      else {
        account = result[0];
        console.log('* Got account: '+account);

        try {
          oldContracts = JSON.parse(fs.readFileSync(path.resolve('./networks', network, 'contracts.js'), 'utf-8').split('=')[1]);
        }
        catch (e) { }

        if (mode == 'index' && oldContracts.CredSign) {
          contracts.Indexer = {
            address: oldContracts.Indexer.address,
            interface: oldContracts.Indexer.interface
          };
          contracts.CredSign = {
            address: oldContracts.CredSign.address,
            interface: oldContracts.CredSign.interface
          };
          deployContract('IterableSet', [], () => {
            deployContract('RankingTree', [], () => {
              deployContract('CredRank', [], writeContracts);
            });
          });
        }
        else {
          deployContract('Indexer', [], () => {
            deployContract('CredSign', [], () => {
              deployContract('IterableSet', [], () => {
                deployContract('RankingTree', [], () => {
                  deployContract('CredRank', [], writeContracts);
                });
              });
            });
          });
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
    fs.writeFileSync(path.resolve('./networks', network, 'contracts.js'), `window.contracts=${JSON.stringify(contracts)}\n`);
    console.log('* Contract interfaces saved');
    done();
  }
}

process.on('exit', () => {
  server && server.close();
  geth && geth.close();
});
