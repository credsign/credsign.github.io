import React from 'react';
import { render } from 'react-dom';
import App from '../components/App.jsx';

window.addEventListener('load', function () {

  function getWeb3(done) {
    var network = window.location.pathname.split('/')[1] || 'mainnet';
    window.network = network;
    window.infura = false;

    // web3 is not present, fetch it and connect to the right network
    if (window.web3 === undefined) {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.onload = function () {
        var Web3 = window.Web3;
        // Dev is on HTTP, unless you use something like Charles Proxy to map production host to localhost
        if (window.location.protocol == 'http:' || network == 'privnet') {
          window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
        }
        else if (network == 'mainnet') {
          window.infura = true;
          window.web3 = new Web3(new Web3.providers.HttpProvider('https://credhot.com'));
        }
        else if (network == 'testnet') {
          window.infura = true;
          window.web3 = new Web3(new Web3.providers.HttpProvider('https://testnet.infura.io/rKXO8uv6njXPdnUsNSeE'));
        }
        done();
      };
      script.src = 'https://unpkg.com/web3@0.16.0/dist/web3.js';
      document.getElementsByTagName('head')[0].appendChild(script);
    }
    else {
      var Web3 = window.Web3 || web3.constructor;
        // Ensure we're connected to the right network
      web3.version.getNetwork(function (error, networkID) {
        if (network == 'mainnet' && networkID != 1) {
          window.infura = true;
          window.web3 = new Web3(new Web3.providers.HttpProvider('https://credhot.com'));
        }
        else if (network == 'testnet' && networkID != 3) {
          window.infura = true;
          window.web3 = new Web3(new Web3.providers.HttpProvider('https://testnet.infura.io/rKXO8uv6njXPdnUsNSeE'));
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
        window.feed = web3.eth.contract(contracts.Feed.interface).at(contracts.Feed.address);
        window.read = web3.eth.contract(contracts.Read.interface).at(contracts.Read.address);
        window.post = web3.eth.contract(contracts.Post.interface).at(contracts.Post.address);
        done();
      }
    };
    xhr.send(null);
  }

  function getAccounts(done) {
    // TODO: Robust account management
    if (window.infura) {
      done();
    }
    else {
      web3.eth.getAccounts((error, accounts) => {
        if (accounts && accounts.length > 0) {
          window.account = accounts[0];
        }
        done();
      });
    }
  }

  getWeb3(function () {
    getContracts(function () {
      getAccounts(function () {
        window.contentCache = {};
        render(<App />, document.getElementById('main'));
      });
    });
  });
});
