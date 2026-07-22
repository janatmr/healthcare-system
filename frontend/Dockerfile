# Phase 1 stub — replaced with multi-stage Vite production build in a later phase
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev || true

COPY . .

EXPOSE 3000

# Placeholder until React/Vite app is scaffolded
CMD ["node", "-e", "require('http').createServer((_, res) => { res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'ok',service:'frontend',phase:1})); }).listen(process.env.PORT || 3000, () => console.log('frontend stub listening'))"]
