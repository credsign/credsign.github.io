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

gulp.task('privnet', function (done) {
  geth = spawn('./networks/geth', [
    '--datadir', './networks/privnet/datadir',
    'init', './networks/privnet/genesis.json'
  ]);
  geth.on('close', function (code) {
    geth = spawn('./networks/geth', [
      '--datadir=./networks/privnet/datadir',
      '--ipcpath='+getIPCPath(),
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

gulp.task('testnet', function (done) {

  geth = spawn('./networks/geth', [
    '--ipcpath='+getIPCPath(),
    '--cache=1024',
    '--fast',
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

function deploy(network, done) {
  var socket = new net.Socket();
  var web3 = new Web3(new Web3.providers.IpcProvider(getIPCPath(), socket));
  var password = fs.readFileSync(path.resolve('./networks', network, 'password.txt'), 'utf-8');

  var Contract = function () {
    return {
      address: null,
      bytecode: null,
      dependencies: [],
      deploying: false,
      interface: null,
    }
  };

  var address;
  var sources = {};
  var contracts = {};
  var deployedCounter = 0;

  (function waitForAccounts() {
    web3.eth.getAccounts(function (error, result) {
      if (error || result.length == 0) {
        setTimeout(waitForAccounts, 1000);
      }
      else {
        address = result[0];
        console.log('* Got account: '+address);
        compile();
      }
    });
  })();

  function compile() {
    try {
      fs.readdirSync('./contracts')
      .filter(function (filename) { return filename.slice(-4) == '.sol' })
      .map(function (filename) {
        var symbolName = filename.slice(0, -4);
        if (contracts[symbolName] === undefined) {
          var source = {};
          if (sources[filename] === undefined) {
            sources[filename] = fs.readFileSync(path.resolve('./contracts', filename), 'utf-8');
          }
          source[symbolName] = sources[filename];
          var contract = contracts[symbolName] = Contract();
          var compilation = solc.compile({sources: source}, 0, function (dependencyFilename) {
            var dependencySymbolName = dependencyFilename.slice(0, -4)
            contract.dependencies.push(dependencySymbolName);
            if (!sources[dependencyFilename]) {
              sources[dependencyFilename] = fs.readFileSync(path.resolve('./contracts', dependencyFilename), 'utf-8');
            }
            return {
              contents: sources[dependencyFilename]
            };
          });
          if (compilation.errors) {
            throw new Error(compilation.errors.toString());
          }
          console.log('* Compiled ' + symbolName);
          contract.bytecode = compilation.contracts[symbolName].bytecode;
          contract.interface = JSON.parse(compilation.contracts[symbolName].interface);
        }
        return symbolName;
      })
      .forEach(recursiveDeploy);
    }
    catch (e) {
      console.log(e.toString());
      done();
    }
  }

  function recursiveDeploy(symbolName) {
    var contract = contracts[symbolName];
    var contractDependencies = {};
    contract.dependencies.forEach(function (dependencyName) {
      if (contracts[dependencyName].deploying) {
        if (contracts[dependencyName].address != null) {
          contractDependencies[dependencyName] = contracts[dependencyName].address;
        }
      }
      else {
        recursiveDeploy(dependencyName);
      }
    });
    if (Object.keys(contractDependencies).length == contract.dependencies.length) {
      if (!contract.deploying) {
        contract.deploying = true;
        contract.bytecode = solc.linkBytecode(contract.bytecode, contractDependencies);
        web3.eth.estimateGas({data: contract.bytecode, from: address}, function (error, gasEstimate) {
          web3.personal.unlockAccount(address, password, 60, function (error) {
            if (error) {
              console.log(error.toString());
            }
            web3.eth.contract(contract.interface).new({data: contract.bytecode, from: address, gas: gasEstimate}, function (error, result) {
              if (error) {
                console.log(error.toString());
              }
              if (result.address) {
                contract.address = result.address;
                console.log('* Deployed ' + symbolName);
                if (Object.keys(contracts).length == ++deployedCounter){
                  customInitialization();
                }
              }
            });
          });
        });
      }
    }
    else {
      setTimeout(function () {
        recursiveDeploy(symbolName);
      }, 1000);
    }
  };

  function customInitialization() {
    fs.writeFileSync(path.resolve('./networks', network, 'contracts.js'), 'window.contracts='+JSON.stringify(contracts));
    console.log('* Contract interfaces saved');
    var batchAPI = web3.eth.contract(contracts.BatchRead.interface).at(contracts.BatchRead.address);
    batchAPI.init.estimateGas(contracts.CredSign.address, function (error, gasEstimate) {
      batchAPI.init(contracts.CredSign.address, {from: address, value: 0, gas: gasEstimate}, done);
    });
  };
}

gulp.task('webapp-build', function () {
  return gulp.src(['./webapp/src/*'])
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
    .pipe(gulp.dest('./webapp/dist'));
});

gulp.task('webapp-server', function (done) {
  server = spawn('python', ['-m', 'SimpleHTTPServer']);
  gulp.watch('./webapp/src/*', ['webapp-build']).on('change', function(event) {
    console.log('Frontend file ' + event.path + ' was ' + event.type + ', rebuilding');
  });
});

gulp.task('privnet-contracts-deploy', function (done) {
  deploy('privnet', done);
});
gulp.task('testnet-contracts-deploy', function (done) {
  deploy('testnet', done);
});

gulp.task('privnet-deploy', ['privnet-contracts-deploy', 'webapp-build'], function () {});
gulp.task('privnet-server', ['privnet', 'webapp-server'], function () {});

gulp.task('testnet-deploy', ['testnet-contracts-deploy', 'webapp-build'], function () {});
gulp.task('testnet-server', ['testnet', 'webapp-server'], function () {});

gulp.task('default', function () {});

process.on('exit', function (){
  server && server.close();
  geth && geth.close();
});
