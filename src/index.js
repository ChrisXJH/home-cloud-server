'use strict';

const express = require('express');
const { CommandExecutor } = require('./utils/executor.js');
const bodyParser = require('body-parser');
const config = require('./config.js');
const app = express();
const port = 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Server is running...'));

app.post('/files', (req, res) => {
  const { targetUrl } = req.body;
  const directory = config.downloadDirectory;
  const params = ["'" + targetUrl + "'", directory];
  let proc = CommandExecutor.executeScript('download.sh', params);
  res.send('Request submitted');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
