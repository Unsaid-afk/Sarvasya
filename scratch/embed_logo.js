const fs = require('fs');
const path = require('path');

const imgPath = path.join('c:', 'Users', 'aarya', 'Desktop', 'work', 'accessibility yi', 'sarvasya_icon.jpg');
const htmlPath = path.join('c:', 'Users', 'aarya', 'Desktop', 'work', 'accessibility yi', 'Sarvasya_White_Paper.html');

let html = fs.readFileSync(htmlPath, 'utf8');
const imgBuffer = fs.readFileSync(imgPath);
const base64Img = imgBuffer.toString('base64');
const dataUri = `data:image/jpeg;base64,${base64Img}`;

// Replace the image src
html = html.replace('src="file:///c:/Users/aarya/Desktop/work/accessibility%20yi/sarvasya_icon.jpg"', `src="${dataUri}"`);

fs.writeFileSync(htmlPath, html);
console.log('Logo embedded as base64');
