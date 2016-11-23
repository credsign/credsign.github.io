// Invoked by geth
// Wait until an account is created and start mining
(function mine() {
  if (eth.accounts.length == 0) {
    setTimeout(mine, 1000);
  }
  else {
    miner.start();
    (function idleLoop() {
      setTimeout(idleLoop, 1000);
    })();
  }
})();