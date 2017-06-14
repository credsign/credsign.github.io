import React from 'react';
import {
  getContentReplyFeed,
  getAccountPostFeed,
  getAccountReplyFeed,
  getAccountReplyToFeed,
  getAccountTipSendFeed,
  getAccountTipReceiveFeed,
  getContentsMeta,
  getContentsData,
  parseHeaders,
  humanizeDuration,
  getContentSlug,
  prettifyTokenValue
} from '../scripts/formatting.js';
import Popup from './Popup.jsx';

class Account extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      balances: [],
      postActivity: [],
      replyActivity: [],
      replyNotifications: [],
      tipActivity: [],
      tipNotifications: [],
      loading: true,
      error: '',
      address: this.props.match.params.address
    };

    this.loadAccount = this.loadAccount.bind(this);
    this.withdraw = this.withdraw.bind(this);
  }

  loadAccount() {
    window.feed.getAccount(this.state.address, (error, account) => {
      let lastPostPublishedBlock = account[0];
      let lastReplyPublishedBlock = account[1];
      let lastReplyReceivedBlock = account[2];
      let lastTipSentBlock = account[3];
      let lastTipRecievedBlock = account[4];
      // account[5] = depositAddress

      let balances = [];
      let postActivity = [];
      let replyActivity = [];
      let replyNotifications = [];
      let tipActivity = [];
      let tipNotifications = [];

      let categories = 0;
      let loaded = 0;

      let onLoad = () => {
        if (categories == ++loaded) {
          this.setState({
            balances: balances,
            postActivity: postActivity,
            replyActivity: replyActivity,
            replyNotifications: replyNotifications,
            tipActivity: tipActivity,
            tipNotifications: tipNotifications,
            loading: false
          });
        }
      }

      categories++;
      window.feed.getTokenBalance(this.state.address, '0x1', (error, result) => {
        balances = [{
          value: result,
          symbol: 'ETH'
        }];
        onLoad();
      });

      if (lastPostPublishedBlock != 0) {
        categories++;
        getAccountPostFeed(this.state.address, lastPostPublishedBlock, 0, (error, results) => {
          let contentIDs = results.feed.map(entry => entry.contentID);
          getContentsMeta(contentIDs, (error, contentsMeta) => {
            let blocks = contentsMeta.map(meta => meta.postBlock);
            getContentsData(contentIDs, blocks, (error, contentsData) => {
              postActivity = contentsData.map((data, i) => {
                let result = results.feed[i];
                return {
                  contentID: data.contentID,
                  tipped: contentsMeta[i].tipped,
                  replyCount: contentsMeta[i].replyCount,
                  title: parseHeaders(data.headers).title,
                  timestamp: result.timestamp.toNumber() * 1000
                }
              });
              onLoad();
            });
          });
        });
      }
      if (lastReplyPublishedBlock != 0) {
        categories++;
        getAccountReplyFeed(this.state.address, lastReplyPublishedBlock, 0, (error, results) => {
          let contentIDs = results.feed.map(entry => entry.contentID);
          let parentContentIDs = results.feed.map(entry => entry.parentContentID);
          let allContentIDs = contentIDs.concat(parentContentIDs);
          getContentsMeta(allContentIDs, (error, contentsMeta) => {
            let blocks = contentsMeta.map(meta => meta.postBlock);
            getContentsData(allContentIDs, blocks, (error, contentsData) => {
              for (let i = 0; i < contentIDs.length; i++) {
                let result = results.feed[i];
                replyActivity.push({
                  contentID: contentsData[i].contentID,
                  title: parseHeaders(contentsData[i].headers).title,
                  parentTitle: parseHeaders(contentsData[i + contentIDs.length].headers).title,
                  timestamp: result.timestamp.toNumber() * 1000
                })
              }
              onLoad();
            });
          });
        });
      }
      if (lastReplyReceivedBlock != 0) {
        categories++;
        getAccountReplyToFeed(this.state.address, lastReplyReceivedBlock, 0, (error, results) => {
          let contentIDs = results.feed.map(entry => entry.contentID);
          let parentContentIDs = results.feed.map(entry => entry.parentContentID);
          let allContentIDs = contentIDs.concat(parentContentIDs);
          getContentsMeta(allContentIDs, (error, contentsMeta) => {
            let blocks = contentsMeta.map(meta => meta.postBlock);
            getContentsData(allContentIDs, blocks, (error, contentsData) => {
              for (let i = 0; i < contentIDs.length; i++) {
                let result = results.feed[i];
                replyNotifications.push({
                  contentID: contentsData[i].contentID,
                  title: parseHeaders(contentsData[i].headers).title,
                  parentTitle: parseHeaders(contentsData[i + contentIDs.length].headers).title,
                  timestamp: result.timestamp.toNumber() * 1000
                })
              }
              onLoad();
            });
          });
        });
      }
      if (lastTipSentBlock != 0) {
        categories++;
        getAccountTipSendFeed(this.state.address, lastTipSentBlock, 0, (error, results) => {
          let contentIDs = results.feed.map(entry => entry.contentID);
          getContentsMeta(contentIDs, (error, contentsMeta) => {
            let blocks = contentsMeta.map(meta => meta.postBlock);
            getContentsData(contentIDs, blocks, (error, contentsData) => {
              tipActivity = contentsData.map((data, i) => {
                let result = results.feed[i];
                return {
                  contentID: data.contentID,
                  title: parseHeaders(data.headers).title,
                  amount: result.amount - result.adminFee,
                  timestamp: result.timestamp.toNumber() * 1000
                }
              });
              onLoad();
            });
          });
        });
      }
      if (lastTipRecievedBlock != 0) {
        categories++;
        getAccountTipReceiveFeed(this.state.address, lastTipRecievedBlock, 0, (error, results) => {
          let contentIDs = results.feed.map(entry => entry.contentID);
          getContentsMeta(contentIDs, (error, contentsMeta) => {
            let blocks = contentsMeta.map(meta => meta.postBlock);
            getContentsData(contentIDs, blocks, (error, contentsData) => {
              tipNotifications = contentsData.map((data, i) => {
                let result = results.feed[i];
                return {
                  contentID: data.contentID,
                  title: parseHeaders(data.headers).title,
                  amount: result.amount - result.adminFee,
                  timestamp: result.timestamp.toNumber() * 1000
                }
              });
              onLoad();
            });
          });
        });
      }
    });
  }

  componentDidMount() {
    this.loadAccount();
  }

  withdraw() {
    this.setState({
      withdrawing: 'true'
    });
    window.feed.getTokenBalance(this.state.address, '0x1', (error, result) => {
      let oldBalance = result;
      let tx = {from: this.state.address, value: 0};
      window.feed.withdraw.estimateGas('0x1', oldBalance, tx, (error, result) => {
        tx.gasEstimate = result;
        window.feed.withdraw('0x1', oldBalance, tx, (error, result) => {
          if (error) {
            this.setState({
              error: error.toString()
            });
          }
          else {
            let watcherFn = () => {
              window.feed.getTokenBalance(this.state.address, '0x1', (error, result) => {
                let newBalance = result;
                if (newBalance != oldBalance) {
                  this.setState({
                    withdrawing: false,
                    balances: [{
                      value: newBalance,
                      symbol: 'ETH'
                    }]
                  });
                }
                else {
                  this.setState({
                    watcherTimeout: window.setTimeout(watcherFn, 5000)
                  });
                }
              });
            }
            watcherFn();
          }
        });
      });
    });
  }

  render() {
    let now = new Date().getTime();

    let balances = this.state.balances.map((balance, i) => {
      return (
        <div key={`balances-${i}`}>
          <div style={{float: 'left'}}>{`${prettifyTokenValue(balance.value)} ${balance.symbol}`}</div>
          <div style={{float: 'right'}}><a style={{textDecoration: 'underline'}} onClick={this.withdraw}>Withdraw</a></div>
          <div style={{float: 'none', clear: 'both'}}>&nbsp;</div>
        </div>
      );
    });

    let postActivity = this.state.postActivity.map((activity, i) => {
      return (
        <li key={`post-${i}`}>
          <a href={`#/eth/${getContentSlug(activity.title)}-${activity.contentID}`}>
            <div>{`${activity.title}`}</div>
            <span>{`${prettifyTokenValue(activity.tipped)} ETH`}</span>
            <span>{` - ${activity.replyCount} response${activity.replyCount == 1 ? '' : 's'}`}</span>
            <span>{` - published ${humanizeDuration(activity.timestamp, now)} ago`}</span>
          </a>
        </li>
      );
    });

    let replyActivity = this.state.replyActivity.map((activity, i) => {
      return (
        <li key={`reply-activity-${i}`}>
          <a href={`#/eth/${getContentSlug(activity.title)}-${activity.contentID}`}>
            <div>{`${activity.title}`}</div>
            <span>{`${humanizeDuration(activity.timestamp, now)} ago in response to ${activity.parentTitle}`}</span>
          </a>
        </li>
      )
    });

    let replyNotifications = this.state.replyNotifications.map((notification, i) => {
      return (
        <li key={`reply-notificiation-${i}`}>
          <a href={`#/eth/${getContentSlug(notification.title)}-${notification.contentID}`}>
            <div>{`${notification.title}`}</div>
            <span>{`${humanizeDuration(notification.timestamp, now)} ago in response to ${notification.parentTitle}`}</span>
          </a>
        </li>
      )
    });

    let tipActivity = this.state.tipActivity.map((activity, i) => {
      return (
        <li key={`tip-activity-${i}`}>
          <a href={`#/eth/${getContentSlug(activity.title)}-${activity.contentID}`}>
            <div>{`Tipped ${prettifyTokenValue(activity.amount)} ETH`}</div>
            <span>{`${humanizeDuration(activity.timestamp, now)} ago on ${activity.title}`}</span>
          </a>
        </li>
      )
    });

    let tipNotifications = this.state.tipNotifications.map((notification, i) => {
      return (
        <li key={`tip-notification-${i}`}>
          <a href={`#/eth/${getContentSlug(notification.title)}-${notification.contentID}`}>
            <div>{`Received ${prettifyTokenValue(notification.amount)} ETH`}</div>
            <span>{`${humanizeDuration(notification.timestamp, now)} ago on ${notification.title}`}</span>
          </a>
        </li>
      )
    });

    return (
      <div style={{width:'100%'}} className='feed flex-grow'>
        <div style={{maxWidth: '600px', margin: '0 auto'}}>
          <div style={{padding: '1em'}}>
            {`${this.state.address.substr(0,5)}...${this.state.address.substr(-3)}`}
          </div>
          <div style={{
            fontStyle: 'italic',
            margin: '1em',
            display: this.state.loading ? 'block'  : 'none'
          }}>Loading...</div>
          <div style={{display: this.state.loading ? 'none' : 'block'}}>
            <div style={{padding: '1em'}}>Balances</div>
            <div style={{padding: '0 1em'}}>{balances}</div>
            <div style={{padding: '1em'}}>Posts</div>
            <ol>{postActivity}</ol>
            <div style={{padding: '1em'}}>Responses</div>
            <ol>{replyActivity}</ol>
            <div style={{padding: '1em'}}>Tipped Content</div>
            <ol>{tipActivity}</ol>
            <div style={{padding: '1em'}}>Received Responses</div>
            <ol>{replyNotifications}</ol>
            <div style={{padding: '1em'}}>Recieved Tips</div>
            <ol>{tipNotifications}</ol>
          </div>
        </div>
        <div style={{height: '3em'}}>&nbsp;</div>
        {
          this.state.withdrawing ?
          <Popup
            onClose={() => { clearTimeout(this.state.watcherTimeout); this.setState({withdrawing: false, error: '', watcherTimeout: -1}) } }
            errorHeader={'Unable to tip'}
            errorMessage={this.state.error}
            actionHeader={'Withdrawing'}
            actionMessage={'Your balance is being withdrawn to your address! This window should close automatically within a few minutes. If it does not, try closing this message and withdrawing again.'} /> : ''
        }
      </div>
    );
  }
}

export default Account;
