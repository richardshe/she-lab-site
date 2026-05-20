const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath == './') filePath = './spot-the-bot.html';
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
    }
    fs.readFile(filePath, (error, content) => {
        if (error) {
            console.log("SERVER 404:", filePath);
            res.writeHead(404);
            res.end('Error');
        } else {
            console.log("SERVER 200:", filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(8125, async () => {
    console.log('Server running at http://127.0.0.1:8125/');
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    
    await page.goto('http://127.0.0.1:8125/spot-the-bot.html', { waitUntil: 'networkidle0' });
    
    const passageText = await page.$eval('[data-spot="passage"]', el => el.textContent);
    console.log('Passage Text:', passageText.substring(0, 100));
    
    await browser.close();
    server.close();
});
