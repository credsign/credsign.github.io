// Invoked by geth
// This privnet miner only runs when there are txns to process

var mining = false;
var address = eth.accounts.length > 0 ? eth.accounts[eth.accounts.length - 1] : personal.newAccount("credsign");

(function toggleMiner() {
  if (mining) {
    if (txpool.status.queued == 0 && txpool.status.pending == 0) {
      mining = false;
      miner.stop();
    }
  }
  else {
    if (txpool.status.queued > 0 || txpool.status.pending > 0 || eth.getBalance(eth.accounts[0]) == 0) {
      mining = true;
      miner.start();
    }
  }
  setTimeout(toggleMiner, 1000);
})();
