import LZString from 'lz-string';
import marked from 'marked';
import toMarkdown from './toMarkdown.js';

marked.setOptions({
  gfm: false,
  tables: false,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: false
});

export function getContentSlug(title) {
  var slug = (title || '').toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
  if (slug.length == 0) {
    return 'content';
  }
  else {
    return slug;
  }
}

export function parseHeaders(headerStr) {
  let headers = {};
  headerStr.split('\n').forEach((header) => {
    let index = header.indexOf(':');
    if (index > 0) {
      headers[header.substr(0, index).toLowerCase()] = header.substr(index + 1);
    }
  });
  return headers;
}
export function serializeHeaders(headers) {
  return Object
    .keys(headers)
    .map((header) => `${header.toLowerCase()}:${headers[header].trim().replace(/\n/g, '')}`)
    .join('\n');
}

export function parseDocument(serializedDocument, format, compression) {
  if (format == 'markdown' && compression == 'lz-string-valid-utf16') {
    return marked(LZString.decompressFromUTF16(serializedDocument));
  }
  else {
    throw new Error('Invalid document');
  }
}

export function serializeDocument(treeDocument, format, compression) {
  if (format == 'markdown' && compression == 'lz-string-valid-utf16') {
    var x = toMarkdown(treeDocument);
    return LZString.compressToUTF16(toMarkdown(treeDocument));
  }
  else {
    throw new Error('Invalid document');
  }
}

function getFeed(eventName, filterObj, nextBlockKey, blockNum, thruTime, results, callback) {
  window.feed[eventName](filterObj, { fromBlock: blockNum, toBlock: blockNum }).get((error, result) => {
    let entries = result.map(r => r.args).sort(r => r[nextBlockKey] < r[nextBlockKey]);
    results.push.apply(results, entries);
    let lastEntry = results[results.length - 1];
    let nextBlockNum = lastEntry[nextBlockKey];
    if (nextBlockNum == 0 || lastEntry.timestamp < thruTime) {
      callback(null, {
        feed: results,
        next: nextBlockNum
      });
    }
    else {
      getFeed(eventName, filterObj, nextBlockKey, nextBlockNum, thruTime, results, callback);
    }
  });
}

export function getChannelFeed(token, startBlock, thruTime, callback) {
  getFeed('Post', { token: token }, 'prevTokenPostBlock', startBlock, thruTime, [], callback);
}

export function getContentReplyFeed(contentID, startBlock, thruTime, callback) {
  getFeed('Reply', { parentContentID: contentID }, 'prevReplyToContentBlock', startBlock, thruTime, [], callback);
}

export function getAccountPostFeed(address, startBlock, thruTime, callback) {
  getFeed('Post', { publisher: address }, 'prevPublisherPostBlock', startBlock, thruTime, [], callback);
}

export function getAccountReplyFeed(address, startBlock, thruTime, callback) {
  getFeed('Reply', { publisher: address }, 'prevPublisherReplyBlock', startBlock, thruTime, [], callback);
}

export function getAccountReplyToFeed(address, startBlock, thruTime, callback) {
  getFeed('Reply', { parentPublisher: address }, 'prevReplyToPublisherBlock', startBlock, thruTime, [], callback);
}

export function getAccountTipSendFeed(address, startBlock, thruTime, callback) {
  getFeed('Tip', { sender: address }, 'prevSenderBlock', startBlock, thruTime, [], callback);
}

export function getAccountTipReceiveFeed(address, startBlock, thruTime, callback) {
  getFeed('Tip', { recipient: address }, 'prevRecipientBlock', startBlock, thruTime, [], callback);
}

export function cacheContent(contentID, content) {
  window.contentCache[contentID] = {
    contentID: contentID,
    publisher: content.args.publisher,
    token: content.args.token,
    headers: content.args.headers,
    document: content.args.document,
    parentID: content.args.parentID,
    timestamp: content.args.timestamp.toNumber()
  };
}

export function getContentsMeta(contentIDs, callback) {
  window.batch.getContents(contentIDs, (error, rawProps) => {
    let contentProps = [];
    for (let i = 0; i < contentIDs.length; i++) {
      let ether = web3.toWei(1);
      let props = {
        contentID: contentIDs[i],
        api: rawProps[0][i],
        publisher: rawProps[1][i],
        token: rawProps[2][i],
        postBlock: rawProps[3][i].toNumber(),
        replyCount: rawProps[4][i].toNumber(),
        tipped: rawProps[5][i].toString()
      };

      // Reddit decays in 45000s intervals, or 12.5hrs
      // Assuming 15s block time, 12.5hrs == 3000 blocks
      props.score = props.postBlock / 3000;
      if (props.tipped > 1) {
        props.score += Math.log(props.tipped);
      }
      contentProps.push(props);
    }
    callback(null, contentProps);
  });
}

export function getContentMeta(contentID, callback) {
  window.feed.getContent(contentID, (error, rawProps) => {
    callback(null, {
      contentID: contentID,
      api: rawProps[0],
      publisher: rawProps[1],
      token: rawProps[2],
      lastReplyBlock: rawProps[3].toNumber(),
      lastTipBlock: rawProps[4].toNumber(),
      postBlock: rawProps[5].toNumber(),
      replyCount: rawProps[6].toNumber(),
      tipped: rawProps[7].toString()
    });
  });
}

export function getContentsData(contentIDs, blocks, callback) {
  let loaded = 0;
  for (let i = 0; i < contentIDs.length; i++) {
    let contentID = contentIDs[i];
    if (window.contentCache[contentID]) {
      if (++loaded == contentIDs.length) {
        callback(null, contentIDs.map(contentID => Object.assign({}, window.contentCache[contentID])));
      }
    }
    else {
      let filter = window.post.Content({contentID: contentID}, {fromBlock: blocks[i], toBlock: blocks[i]})
      filter.get((error, rawPost) => {
        if (rawPost && rawPost.length == 1) {
          // TODO: Save to local storage here
          cacheContent(contentID, rawPost[0]);
        }
        if (++loaded == contentIDs.length) {
          callback(null, contentIDs.map(contentID => Object.assign({}, window.contentCache[contentID])));
        }
      });
    }
  }
}

export function getContentData(contentID, block, callback) {
  if (window.contentCache[contentID]) {
    callback(null, Object.assign({}, window.contentCache[contentID]));
  }
  else {
    window.post.Content({contentID: contentID}, {fromBlock: block, toBlock: block}).get((error, rawPost) => {
      if (rawPost && rawPost.length == 1) {
        // TODO: Save to local storage here
        cacheContent(contentID, rawPost[0]);
      }
      callback(null, Object.assign({}, window.contentCache[contentID]));
    });
  }
}

export function submitPost(title, serializedDocument, token, parentID, callback) {
  title = title || '(untitled)';
  if (title.length > 140) {
    title = title.substr(0, 137).split(' ').slice(0, -1).join(' ') + '...';
  }
  let headers = {
    title: title,
    format: 'markdown',
    compression: 'lz-string-valid-utf16'
  };
  let serializedHeaders = serializeHeaders(headers);
  let tx = {
    from: window.account,
    value: 0
  };
  window.post.toContentID(window.account, serializedHeaders, serializedDocument, token, parentID, (error, contentID) => {
    window.post.publish.estimateGas(serializedHeaders, serializedDocument, token, parentID, tx, (error, gasEstimate) => {
      console.log(gasEstimate);
      tx.gas = gasEstimate;
      window.post.publish(serializedHeaders, serializedDocument, token, parentID, tx, (error) => {
        callback(error, contentID);
      });
    });
  });
}

export function submitReply(title, doc, token, parentID, callback) {
  title = title || doc.innerText || '(untitled)';
  if (title.length > 140) {
    title = title.substr(0, 137).split(' ').slice(0, -1).join(' ') + '...';
  }
  let headers = {
    title: title,
    format: 'markdown',
    compression: 'lz-string-valid-utf16'
  };
  let serializedHeaders = serializeHeaders(headers);
  let serializedDocument = serializeDocument(doc, headers.format, headers.compression);
  let tx = {
    from: window.account,
    value: 0
  };
  window.post.toContentID(window.account, serializedHeaders, serializedDocument, token, parentID, (error, contentID) => {
    window.post.publish.estimateGas(serializedHeaders, serializedDocument, token, parentID, tx, (error, gasEstimate) => {
      console.log(gasEstimate);
      tx.gas = gasEstimate;
      window.post.publish(serializedHeaders, serializedDocument, token, parentID, tx, (error) => {
        callback(error, contentID);
      });
    });
  });
}

// expects a bignumber value
export function prettifyTokenValue(value) {
  let ether = web3.toWei(1);
  return new web3.BigNumber(value || 0).dividedBy(ether).toFixed(2);
}

export function humanizeDuration(timestamp, now) {
  var result = '';
  var age = now - timestamp;
  if (age > 86400000) {
    age = Math.floor(age / 86400000);
    result += age + (age > 1 ? ' days' : ' day');
  }
  else if (age > 3600000) {
    age = Math.floor(age / 3600000);
    result += age + (age > 1 ? ' hours' : ' hour');
  }
  else if (age > 60000) {
    age = Math.floor(age / 60000);
    result += age + (age > 1 ? ' minutes' : ' minute');
  }
  else if (age > 1000) {
    age = Math.floor(age / 1000);
    result += age + (age > 1 ? ' seconds' : ' second');
  }
  return result;
}

