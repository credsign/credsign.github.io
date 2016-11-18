import React from 'react';
import { render } from 'react-dom';
import App from '../components/App.jsx';

window.addEventListener('load', function () {

  function getWeb3(done) {
    var providerURL = '';
    var targetNetworkID;
    var network = window.location.pathname.split('/')[1];
    window.network = network;
    window.infura = false;
    if (window.web3 === undefined) {
      // web3 is not present, fetch it and connect to the network
      (function (d, script) {
        script = d.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.onload = function () {
          if (network == 'privnet') {
            window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
          }
          else if (network == 'testnet') {
            if (window.location.protocol == 'https:') {
              window.infura = true;
              window.web3 = new Web3(new Web3.providers.HttpProvider('https://morden.infura.io/rKXO8uv6njXPdnUsNSeE'));
            }
            else {
              window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
            }
          }
          done();
        };
        script.src = 'https://unpkg.com/web3@0.16.0/dist/web3.js';
        d.getElementsByTagName('head')[0].appendChild(script);
      }(document));
    }
    else {
      // web3 is present, ensure we're connected to the right network
      web3.version.getNetwork(function (error, networkID) {
        if (network == 'privnet' && networkID <= 2) {
          window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
        }
        else if (network == 'testnet' && networkID != 2) {
          window.infura = true;
          window.web3 = new Web3(new Web3.providers.HttpProvider('https://morden.infura.io/rKXO8uv6njXPdnUsNSeE'));
        }
        done();
      });
    }
  }

  function getContracts(done) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'contracts.json?nonce='+new Date().getTime());
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        var contracts = JSON.parse(xhr.responseText);
        window.content = web3.eth.contract(contracts.Content.interface).at(contracts.Content.address);
        window.addressseries = web3.eth.contract(contracts.AddressSeries.interface).at(contracts.AddressSeries.address);
        window.channelseries = web3.eth.contract(contracts.ChannelSeries.interface).at(contracts.ChannelSeries.address);
        window.contentseries = web3.eth.contract(contracts.ContentSeries.interface).at(contracts.ContentSeries.address);
        done();
      }
    };
    xhr.send(null);
  }

  function getAccounts(done) {
    // TODO: Robust account management
    web3.eth.getAccounts((error, accounts) => {
      if (!window.infura && accounts && accounts.length > 0) {
        window.account = accounts[0];
      }
      done();
    });
  }

  getWeb3(function () {
    getContracts(function () {
      getAccounts(function () {
        render(<App />, document.getElementById('main'));
      });
    });
  });
});
