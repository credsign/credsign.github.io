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
