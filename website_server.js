const express = require("express");
const path = require('path');
const app = express();
const https = require('https');
const fs = require('fs');
const compression = require('compression')
const port = 8080;
const https_port = 443;
app.use(compression());
app.use(express.static("dist", { maxAge: 1000 * 3600 }));
app.get('/', (req, res) => {
  if (req.protocol === 'http') {
    res.redirect(302, 'https://remons.cn');
    res.end()
  }
  res.sendFile(path.resolve(__dirname, './dist/@website_pages/home/index.html'))
})
const https_options = {
   key: fs.readFileSync(path.join(__dirname,'./a.key')),
   cert: fs.readFileSync(path.join(__dirname,'./a.pem'))
};
const httpsServer = https.createServer(https_options, app);
app.listen(port, () => console.log(`Example app listening on port port!`));
httpsServer.listen(https_port);


