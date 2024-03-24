const fs = require('fs');
const http = require('http');
const { exec } = require('child_process');
const random = require('string-random');

const server = http.createServer((req, res) => {
  const url = req.url;
  const timestamp = new Date().getTime();
  
  // 输出日志函数
  const log = (type, text) => {
    const ip = req.connection.remoteAddress;
    console.log(`[${ip}][${new Date().toLocaleString()}][${type}] ${text}`);
  };

  // IP黑名单文件路径
  const blackIPFilePath = 'ip/black.txt';
  // IP解封列表文件路径
  const unbanIPFilePath = 'ip/unban.txt';
  // IP请求记录文件路径
  const requestLogFilePath = 'ip/request_log.txt';

  // 检查IP是否在黑名单中
  const isIPBanned = (ip) => {
    const bannedIPs = fs.readFileSync(blackIPFilePath, 'utf-8').split('\n').filter(Boolean);
    return bannedIPs.includes(ip);
  };

  // 封禁IP
  const banIP = (ip) => {
    // 检查是否已经在黑名单中
    if (!isIPBanned(ip)) {
      fs.appendFileSync(blackIPFilePath, `${ip}\n`);
      log('\x1B[31mERROR\x1B[37m', `IP '${ip}' has been banned.`);
    }
  };

  // 解封IP
  const unbanIP = (ip) => {
    const bannedIPs = fs.readFileSync(blackIPFilePath, 'utf-8').split('\n').filter(Boolean);
    const updatedIPs = bannedIPs.filter((bannedIP) => bannedIP !== ip);
    fs.writeFileSync(blackIPFilePath, updatedIPs.join('\n'));
    log('\x1B[32mINFO\x1B[37m', `IP '${ip}' has been unbanned.`);
  };

  // 记录请求日志
  const logRequest = (ip, timestamp) => {
    const currentTime = new Date().getTime();
    const requestLogContent = fs.readFileSync(requestLogFilePath, 'utf-8').split('\n').filter(Boolean);
    const updatedRequestLogContent = requestLogContent.filter((log) => {
      const [logIP, logTimestamp] = log.split('|');
      return logIP !== ip || (currentTime - parseInt(logTimestamp)) <= 60000;
    });
    updatedRequestLogContent.push(`${ip}|${timestamp}`);
    fs.writeFileSync(requestLogFilePath, updatedRequestLogContent.join('\n'));
  };

  // 检查IP请求次数是否达到限制
  const checkRequestLimit = (ip) => {
    const requestLogContent = fs.readFileSync(requestLogFilePath, 'utf-8').split('\n').filter(Boolean);
    const requestsFromIP = requestLogContent.filter((log) => {
      const [logIP] = log.split('|');
      return logIP === ip;
    });
    return requestsFromIP.length >= 60;
  };

  // 获取封禁时长（分钟）
  const getBanDuration = (ip) => {
    const unbanLogContent = fs.readFileSync(unbanIPFilePath, 'utf-8').split('\n').filter(Boolean);
    const unbanLog = unbanLogContent.find((log) => {
      const [logIP] = log.split('|');
      return logIP === ip;
    });
    if (unbanLog) {
      const [, duration] = unbanLog.split('|');
      return parseInt(duration);
    }
    return 60; // 默认封禁时长为99999分钟
  };

  // Handle all other requests

  const ip = req.connection.remoteAddress;

  if (isIPBanned(ip)) {
    const banDuration = getBanDuration(ip);
    if (banDuration !== 99999) { // Unblock IP after 60 minutes
      setTimeout(() => {
        unbanIP(ip);
      }, banDuration * 60000);
    }

    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 403, data: 'Forbidden', time: timestamp }));

    return; // End the request processing for banned IPs
  }

  // Log the request and check request count
  logRequest(ip, timestamp);

  if (checkRequestLimit(ip)) {
    banIP(ip);
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 403, data: 'Forbidden', time: timestamp }));
    return; // End the request processing for IPs exceeding the request limit
  }

  // 引用vue3支持和html支持
  if (url.match(/\.(js|vue)$/)) {
    res.setHeader('Content-Type', 'text/javascript');
    fs.readFile(`public${url}`, (err, data) => {
      if (err) {
        log('\x1B[31mERROR\x1B[37m', err.message);
        res.statusCode = 404;
        res.end(JSON.stringify({ status: 404, data: 'Not found.', time: timestamp }));
      } else {
        res.statusCode = 200;
        res.end(data);
      }
    });
  } else if (url.match(/\.html$/)) {
    res.setHeader('Content-Type', 'text/html');
    fs.readFile(`public${url}`, (err, data) => {
      if (err) {
        log('\x1B[31mERROR\x1B[37m', err.message);
        res.statusCode = 404;
        res.end(JSON.stringify({ status: 404, data: 'Not found.', time: timestamp }));
      } else {
        res.statusCode = 200;
        res.end(data);
      }
    });
  } else if (url === '/api/card') {
    if (req.method === 'POST') {
      let requestBody = '';
      req.on('data', (chunk) => {
        requestBody += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { card, use, token } = JSON.parse(requestBody);

        if (use === 'Admin.Pat') {
          const gtoken = JSON.parse(fs.readFileSync('user/token', 'utf-8'));
          if (gtoken.includes(token)) {
            log('\x1B[32mINFO\x1B[37m', `Running command: python3 app.py`);
            exec('python3 app.py', { encoding: 'utf-8' }, (err, stdout) => {
              if (err) {
                log('\x1B[31mERROR\x1B[37m', err.message);
                res.statusCode = 500;
                res.end(JSON.stringify({ status: 500, data: 'Internal Server Error', time: timestamp }));
              } else {
                const lastOutputLine = stdout.trim().split('\n').pop();
                log('\x1B[32mSUCCESS\x1B[37m', `Command executed successfully. Output: ${lastOutputLine}`);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 200, data: lastOutputLine, time: timestamp }));
              }
            });
          } else {
          log('\x1B[31mERROR\x1B[37m', 'The token is incorrect.');
                res.statusCode = 403;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 403, data: 'The token is incorrect.', time: timestamp }));
            }
        } else if (use === 'Pat.test') {
          log('\x1B[32mINFO\x1B[37m', 'Test request received.');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 200, data: 'The test passed.', time: timestamp }));
        } else {

            const cardFilePath = `card/${use}/card.txt`;
            console.log(cardFilePath)
            const usedFilePath = `card/${use}/used.txt`;

            if (fs.existsSync(cardFilePath)) {
              const cardFileContent = fs.readFileSync(cardFilePath, 'utf-8');
              if (cardFileContent.includes(`<${card}>`)) {
                const updatedContent = cardFileContent.replace(`<${card}>`, '');
                fs.writeFileSync(cardFilePath, updatedContent);
                fs.appendFileSync(usedFilePath, `<${card}>\n`);

                log('\x1B[32mINFO\x1B[37m', `Card '${card}' found and updated. Running command: python3 app.py`);
                exec('python3 app.py', { encoding: 'utf-8' }, (err, stdout) => {
                  if (err) {
                    log('\x1B[31mERROR\x1B[37m', err.message);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ status: 500, data: 'Internal Server Error', time: timestamp }));
                  } else {
                    const lastOutputLine = stdout.trim().split('\n').pop();
                    log('\x1B[32mSUCCESS\x1B[37m', `Command executed successfully. Output: ${lastOutputLine}`);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ status: 200, data: lastOutputLine, time: timestamp }));
                  }
                });
              } else {
                const usedFileContent = fs.readFileSync(usedFilePath, 'utf-8');
                if (usedFileContent.includes(`<${card}>`)) {
                  log('\x1B[33mWARN\x1B[37m', `Card '${card}' has already been used.`);
                  res.statusCode = 403;
                  res.end(JSON.stringify({ status: 403, data: '卡密已被使用', time: timestamp }));
                } else {
                  log('\x1B[33mWARN\x1B[37m', `Card '${card}' not found in the file.`);
                  res.statusCode = 403;
                  res.end(JSON.stringify({ status: 403, data: '卡密不存在', time: timestamp }));
                }
              }
            } else {
              log('\x1B[33mWARN\x1B[37m', `Card file '${cardFilePath}' not found.`);
              res.statusCode = 404;
              res.end(JSON.stringify({ status: 404, data: '没有目标文件，请检查use是否正确', time: timestamp }));
            }
          }
        } catch (error) {
          log('\x1B[31mERROR\x1B[37m', error.message);
          res.statusCode = 400;
          res.end(JSON.stringify({ status: 400, data: 'Bad Request', time: timestamp }));
        }
      });
    } else {
      log('\x1B[32mINFO\x1B[37m', `GET request received for URL '${url}'.`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 200, data: 'GET request received', time: timestamp }));
    }
  } else if (url === '/api/auth/login' && req.method === 'POST') {
  let requestBody = '';
  req.on('data', (chunk) => {
    requestBody += chunk.toString();
  });

  req.on('end', () => {
    try {
      const { username, password } = JSON.parse(requestBody);
      console.log(JSON.parse(requestBody));
      console.log(username,password);
      const UserPath = `user/${username}.json`;
      const tokenPath = 'user/token.json';

      if (fs.existsSync(UserPath)) {
        const UserFileContent = fs.readFileSync(UserPath, 'utf-8');
        const UserData = JSON.parse(UserFileContent);

        if (UserData.username === username && UserData.password === password) {
          log('\x1B[32mINFO\x1B[37m', `User '${username}' logged in and obtained token.`);

          let token = '';
          if (!UserData.token) {
            UserData.token = [];
            token += random(20, { letters: 'abcdef' });
            console.log(token)
          } else {
            token = UserData.token;
          }
          const { permission } = UserData;
          const utoken = { username, token, permission };
          const gtoken = JSON.parse(fs.readFileSync('user/token.json', 'utf-8'));
          console.log(gtoken,utoken);
          if (!gtoken.list.includes(utoken)) {
            gtoken.list.push(utoken);
          }
          const newToken = gtoken;
          UserData.token = token;

          const updatedUserContent = JSON.stringify(UserData);
          fs.writeFileSync('user/token', JSON.stringify(gtoken));
          fs.writeFileSync(UserPath, updatedUserContent.toString());
          log('\x1B[32mSUCCESS\x1B[37m', `Login successful. User: ${username}, Token: ${token}, Permission: ${permission}`);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 200, data: true, token, permission, time: timestamp }));
        } else {
          log('\x1B[33mWARN\x1B[37m', `Login failed.`);
          res.statusCode = 403;
          res.end(JSON.stringify({ status: 403, data: `Invalid username or password.`, time: timestamp }));
        }
      } else {
        log('\x1B[33mWARN\x1B[37m', `User file for '${username}' not found.`);
        res.statusCode = 404;
        res.end(JSON.stringify({ status: 404, data: 'User not found.', time: timestamp }));
      }
    } catch (error) {
      log('\x1B[31mERROR\x1B[37m', error.message);
      res.statusCode = 400;
      res.end(JSON.stringify({ status: 400, data: 'Bad Request', time: timestamp }));
    }
  });
} else if (url === '/api/auth' && req.method === 'POST') {
  let requestBody = '';
  req.on('data', (chunk) => {
    requestBody += chunk.toString();
  });
  req.on('end', () => {
    try {
      const { username, password, token, permission } = JSON.parse(requestBody);
      const tokenPath = 'user/token.json';

      if (fs.existsSync(tokenPath)) {
        const tokenFileContent = fs.readFileSync(tokenPath, 'utf-8');
        const tokenData = JSON.parse(tokenFileContent);
        let userpermission = '';
        let usertoken = '';
        console.log(tokenData)

        for (let i = 0; i < tokenData.list.length; i++) {
          if (tokenData.list[i].token === token) {
          console.log(tokenData.list[i])
            userpermission += tokenData.list[i].permission;
            usertoken += random(20, { letters: 'abcdef' });
            break;
          }
        }

        if (parseInt(userpermission) === 10) {
          log('\x1B[32mINFO\x1B[37m', '登录成功，正在创建用户...');
          const newuser = { username, permission };
          const token = random(20, { letters: 'abcdef' });
          tokenData.list.push(newuser);
          fs.writeFileSync(tokenPath, JSON.stringify(tokenData));
          fs.writeFileSync(`user/${username}.json`, JSON.stringify({ username, password, permission, token }));
          console.log('\x1B[32mSUCCESS\x1B[37m', '创建成功');

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 200, data: true, token, permission, time: timestamp }));
        } else {
          log('\x1B[33mWARN\x1B[37m', '权限不足。');
          res.statusCode = 403;
          res.end(JSON.stringify({ status: 403, data: 'Permission denied.', time: timestamp }));
        }
      } else {
        log('\x1B[33mWARN\x1B[37m', '没有token.json，请检查文件是否完整。');
        res.statusCode = 500;
        res.end(JSON.stringify({ status: 500, data: 'Token file not found.', time: timestamp }));
      }
    } catch (error) {
      log('\x1B[31mERROR\x1B[37m', error.message);
      res.statusCode = 400;
      res.end(JSON.stringify({ status: 400, data: 'Bad Request', time: timestamp }));
    }
  });
} else if (url === '/api/auth/search' && req.method === 'POST') {
  let requestBody = '';
  req.on('data', (chunk) => {
    requestBody += chunk.toString();
  });
  req.on('end', () => {
    try {
      const { username, token } = JSON.parse(requestBody);
      const tokenPath = 'user/token.json';

      if (fs.existsSync(tokenPath)) {
        const tokenFileContent = fs.readFileSync(tokenPath, 'utf-8');
        const tokenData = JSON.parse(tokenFileContent);
        let userpermission = '';

        for (let i = 0; i < tokenData.list.length; i++) {
          if (tokenData.list[i].token === token) {
            console.log(tokenData.list[i])
            userpermission += tokenData.list[i].permission;
            break;
          }
        }

        if (parseInt(userpermission) === 10) {
          log('\x1B[32mINFO\x1B[37m', '登录成功，正在搜索用户...');
          let userlist = [];

          if (!username) {
            userlist = userlist.concat(tokenData.list);
          } else {
            for (let i = 0; i < tokenData.list.length; i++) {
              if (tokenData.list[i].username === username) {
                userlist.push(tokenData.list[i]);
                console.log(userlist);
              }
            }
          }

          console.log(userlist);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 200, data: userlist, time: timestamp }));
        } else {
          log('\x1B[33mWARN\x1B[37m', '权限不足。');
          res.statusCode = 403;
          res.end(JSON.stringify({ status: 403, data: 'Permission denied.', time: timestamp }));
        }
      } else {
        log('\x1B[33mWARN\x1B[37m', '没有token.json，请检查文件是否完整。');
        res.statusCode = 500;
        res.end(JSON.stringify({ status: 500, data: 'Token file not found.', time: timestamp }));
      }
    } catch (error) {
      log('\x1B[31mERROR\x1B[37m', error.message);
      res.statusCode = 400;
      res.end(JSON.stringify({ status: 400, data: 'Bad Request', time: timestamp }));
    }
  });
} else if (url === '/') {
    log('\x1B[32mINFO\x1B[37m', `Redirecting URL '/' to 'index.html'.`);
    res.writeHead(302, { 'Location': '/index.html' });
    res.end();
  } else {
    log('\x1B[32mINFO\x1B[37m', `GET request received for URL '${url}'.`);
    const filePath = `E:/node/public${url}`;
    if (fs.existsSync(filePath)) {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          log('\x1B[31mERROR\x1B[37m', err.message);
          res.statusCode = 404;
          res.end(JSON.stringify({ status: 404, data: 'Not found.', time: timestamp }));
        } else {
          res.statusCode = 200;
          res.end(data);
        }
      });
    } else {
      log('\x1B[31mERROR\x1B[37m', `File '${filePath}' not found.`);
      res.statusCode = 404;
      res.end(JSON.stringify({ status: 404, data: 'Not found.', time: timestamp }));
    }
  }
});

server.listen(65535, () => {
  console.log('Server started on port 65535');
});

