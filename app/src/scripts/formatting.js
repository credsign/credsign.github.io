import LZString from 'lz-string';

export function getChannelName(channelID) {
  var channelName = '';
  while (channelID != 0) {
    channelName = String.fromCharCode(channelID.mod(256)) + channelName;
    channelID = channelID.div(256).floor();
  }
  return channelName;
}

export function getContentTitle(header) {
  var title = null;
  try {
    title = JSON.parse(header).title || '(untitled)';
  }
  catch (e) {
    console.log(`Invalid JSON: ${header}`);
  }

  // If the title is empty or just spaces, return empty
  if (title.replace(/ /g, '').length == 0) {
    title = null;
  }
  return title;
}

export function encodeContentBody(bodyStr) {
  console.log(bodyStr.length);
  bodyStr = LZString.compress(bodyStr);
  console.log(bodyStr.length);
  var result = '0x';
  for (var i = 0; i < bodyStr.length; i++) {
    var bytes = bodyStr.charCodeAt(i).toString(16);
    while (bytes.length % 4 !== 0) {
      bytes = '0' + bytes;
    }
    result += bytes;
  }
  return result;
}

export function decodeContentBody(bodyHex, encoding) {
  if (encoding == 'plain') {
    return window.web3.toUtf8(bodyHex);
  }
  else if (encoding == 'lz-string') {
    bodyHex = bodyHex.substr(2); // remove '0x'
    while (bodyHex.length % 4 != 0) {
      bodyHex = '0' + bodyHex;
    }
    var bodyCompressed = window.eval('\''+ '\\u' + bodyHex.match(/..../g).join('\\u')  + '\'');
    return LZString.decompress(bodyCompressed);
  }
}
