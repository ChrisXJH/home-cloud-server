const express = require('express');
const fs = require('fs');
const { CommandExecutor } = require('./utils/executor.js');
const bodyParser = require('body-parser');
const AuthService = require('./services/auth-service.js');
const config = require('./config.js');
const { port } = config;
const app = express();

app.use(bodyParser.json());

app.get('/', logRequest, (req, res) => res.send('Server is running...'));

app.get('/storage', logRequest, authenticateUser, (req, res) => {
  handleListStorageRequest(req, res);
});

app.get('/storage/videos', logRequest, authenticateUser, (req, res) => {
  handleListStorageRequest(req, res, [/.*\.mp4/, /.*\.avi/]);
});

app.get('/storage/audios', logRequest, authenticateUser, (req, res) => {
  handleListStorageRequest(req, res, [/.*\.mp3/]);
});

app.get('/storage/:filename', logRequest, authenticateUser, (req, res) => {
  const extension = getExtensionByFilename(req.params.filename);
  const genericMediaType = getGenericMediaTypeByExtension(extension);
  if (genericMediaType === 'video' || genericMediaType === 'audio') {
    handleMediaStreamingRequest(req, res, `${genericMediaType}/${extension}`);
  } else if (genericMediaType === 'application') {
    handleGetFileRequest(req, res, `${genericMediaType}/${extension}`);
  } else {
    res.status(400).end();
  }
});

app.get(
  '/storage/videos/:filename',
  logRequest,
  authenticateUser,
  (req, res) => {
    const extension = getExtensionByFilename(req.params.filename);
    handleMediaStreamingRequest(req, res, `video/${extension}`);
  }
);

app.get(
  '/storage/audios/:filename',
  logRequest,
  authenticateUser,
  (req, res) => {
    const extension = getExtensionByFilename(req.params.filename);
    handleMediaStreamingRequest(req, res, `audio/${extension}`);
  }
);

app.post('/storage', logRequest, authenticateUser, (req, res) => {
  const { targetUrl } = req.body;
  const directory = config.downloadDirectory;
  const params = ["'" + targetUrl + "'", directory];
  CommandExecutor.executeScript('download.sh', params);
  res.send({
    message: 'Request submitted.'
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

function logRequest(req, res, next) {
  console.log('Handling incomming http request...');
  const { headers, query, params, body } = req;
  console.log({ headers, query, params, body });
  next();
}

function authenticateUser(req, res, next) {
  const authToken = req.headers.authorization
    ? req.headers.authorization.replace(/Bearer /, '')
    : req.query.accessToken;

  if (!authToken) {
    res.status(403).end();
    console.log('Failed to authenticate user. No authorization token present.');
    return;
  }
  AuthService.authenticateToken(authToken)
    .then(next)
    .catch(() => res.status(403).end());
}

function handleGetFileRequest(req, res, mediaType) {
  const path = getActualFilePath(req.params.filename);
  const file = fs.createReadStream(path);
  const stat = fs.statSync(path);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Type', mediaType);
  file.pipe(res);
}

function handleListStorageRequest(req, res, resultFilters = []) {
  let { filters } = req.query;
  filters = filters ? filters.split(',') : [];
  filters = filters.map(regexStr => new RegExp(regexStr));
  listAllFilesInStorage(filters)
    .then(result => {
      res.send(
        result.filter(
          filename =>
            resultFilters.length <= 0 ||
            resultFilters.some(filter => filename.match(filter))
        )
      );
    })
    .catch(err => {
      console.error(err);
      res.status(404).end();
    });
}

function handleMediaStreamingRequest(req, res, mediaType) {
  const { filename } = req.params;
  const range = req.headers.range;
  const { status, header, stream } = mediaStreaming(
    getActualFilePath(filename),
    range,
    mediaType
  );
  res.writeHead(status, header);
  stream.pipe(res);
}

function mediaStreaming(path, range, contentType) {
  const stat = fs.statSync(path);
  const fileSize = stat.size;
  let status, header, stream;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    stream = fs.createReadStream(path, { start, end });
    header = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType
    };
    status = 206;
  } else {
    header = {
      'Content-Length': fileSize,
      'Content-Type': contentType
    };
    status = 200;
    stream = fs.createReadStream(path);
  }
  return { status, header, stream };
}

function getGenericMediaTypeByExtension(extStr) {
  let result;
  if (extStr.match(/(mp4|avi)/)) {
    result = 'video';
  } else if (extStr.match(/(mp3)/)) {
    result = 'audio';
  } else if (extStr.match(/(pdf)/)) {
    result = 'application';
  }
  return result;
}

function listAllFilesInStorage(extensions = []) {
  const storageDir = config.storageDirectory;
  return CommandExecutor.execute(`cd ${storageDir} && ls -m`).then(result =>
    result
      .replace(/\n/g, '')
      .split(', ')
      .filter(
        filename =>
          extensions.length <= 0 ||
          extensions.some(regex => filename.match(regex))
      )
  );
}

function getActualFilePath(filename) {
  return `${config.storageDirectory}/${filename}`;
}

function getExtensionByFilename(filename) {
  const extension = filename.match(/\..*/)[0];
  return extension ? extension.replace('.', '') : '';
}
