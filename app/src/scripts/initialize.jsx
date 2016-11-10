import App from '../components/App.jsx';

window.addEventListener('load', function () {
  marked.setOptions({
    gfm: false,
    tables: false,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: false
  });

  function getWeb3(done) {
    var providerURL = '';
    var targetNetworkID;
    var network = window.location.pathname.split('/')[1];
    if (network == 'privnet') {
      providerURL = 'http://localhost:8545';
    }
    else if (network == 'testnet') {
      providerURL = window.location.protocol == 'https:' ? 'https://morden.infura.io/rKXO8uv6njXPdnUsNSeE': 'http://localhost:8545';
      targetNetworkID = 2;
    }
    else {
      providerURL = window.location.protocol == 'https:' ? 'https://infura.io/rKXO8uv6njXPdnUsNSeE': 'http://localhost:8545';
      targetNetworkID = 1;
    }
    window.infura = false;
    if (window.web3 === undefined) {
      (function (d, script) {
        script = d.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.onload = function () {
          window.web3 = new Web3(new Web3.providers.HttpProvider(providerURL));
          window.infura = window.location.protocol == 'https:';
          done();
        };
        script.src = 'https://unpkg.com/web3@0.16.0/dist/web3.js';
        d.getElementsByTagName('head')[0].appendChild(script);
      }(document));
    }
    else {
      web3.version.getNetwork(function (error, networkID) {
        if (networkID != targetNetworkID) {
          window.web3 = new Web3(new Web3.providers.HttpProvider(providerURL));
          window.infura = window.location.protocol == 'https:';
        }
        done();
      });
    }
  }

  function getContracts(done) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'contracts.json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        var contracts = JSON.parse(xhr.responseText);
        window.indexer = web3.eth.contract(contracts.Indexer.interface).at(contracts.Indexer.address);
        window.publisher = web3.eth.contract(contracts.Publisher.interface).at(contracts.Publisher.address);
        done();
      }
    };
    xhr.send(null);
  }

  getWeb3(function () {
    getContracts(function () {
      ReactDOM.render(<App />, document.getElementById('main'));
    });
  });
});
