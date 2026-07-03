# 🧹 WhatsApp Duplicate Cleaner (Headless Bot)

Ever been in a college or community WhatsApp group where 15 different people forward the *exact same* PDF, meme, or announcement? Yeah, it destroys your phone storage and your sanity.

This is a lightweight, headless Node.js bot that silently runs in the background of your WhatsApp account. It acts as an invisible garbage collector, instantly deleting exact duplicates of images, videos, documents, and annoying copypasta texts from your groups.

*Note: It uses "Delete for me", so it cleans your phone without annoying everyone else in the group with "This message was deleted" notifications.*

## ✨ Features

- **Media Hashing:** Downloads images/videos/docs, calculates a SHA-256 hash, and deletes exact duplicates.
- **Fuzzy Text Matcher:** Strips emojis, punctuation, and spaces before comparing text. (e.g., `Happy Bday 🎂!!` and `happybday` are treated as the same spam and deleted).
- **Short-Text Safe:** Ignores normal short conversation texts (like "ok", "sure") unless they are explicitly forwarded.
- **30-Day Memory:** Keeps a rolling 30-day memory of message signatures to prevent long-term spam cycles without eating up disk space.
- **Headless Chrome:** Built on `whatsapp-web.js` and Puppeteer. Runs perfectly on a cloud VM.

## 🚀 Installation (Local Machine)

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the bot:
   ```bash
   npm start
   ```
   *(Pro tip: If you want it to run silently in the background without keeping your terminal open all day, install PM2 with `npm install -g pm2`, and then run `pm2 start server.js`)*
4. A QR code will appear in your terminal. Open WhatsApp on your phone -> Linked Devices -> Link a Device, and scan the terminal screen.

## ☁️ Deployment (Cloud VM / Azure / AWS)

Want it running 24/7 without keeping your laptop open? Deploy it to a Linux VM (Ubuntu recommended, minimum 2GB RAM).

1. SSH into your VM and install Node.js and PM2:
   ```bash
   sudo apt update
   sudo apt install nodejs npm -y
   sudo npm install -g pm2
   ```
2. Install required Linux graphical libraries for Puppeteer (Chrome):
   ```bash
   sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libx11-xcb1
   ```
3. Clone the repo and install dependencies (`npm install`).
4. Start the bot using PM2 so it runs forever:
   ```bash
   pm2 start server.js --name "wa-cleaner"
   pm2 logs wa-cleaner
   ```
5. Scan the QR code, then press `Ctrl+C` to exit the logs. 
6. Save the background process so it survives server reboots:
   ```bash
   pm2 save
   pm2 startup
   ```

## ☕ Support

If this saved your phone storage (or your sanity), consider dropping a tip! 

- **🇮🇳 India (UPI):** `ajojose12345678910@oksbi`
  - *Scan this QR code from any UPI app:*<br>
  ![UPI QR Code](https://quickchart.io/qr?text=upi%3A%2F%2Fpay%3Fpa%3Dajojose12345678910%40oksbi%26pn%3DAjo%26cu%3DINR&size=200)

## ⚠️ Disclaimer
This is an unofficial automation tool. It is not affiliated with WhatsApp or Meta. Use at your own risk.
