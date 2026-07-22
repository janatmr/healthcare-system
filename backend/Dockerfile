# Phase 1 stub — replaced with multi-stage production build in a later phase
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev || true

COPY . .

EXPOSE 5000

# Placeholder until Express app is added in Phase 2
CMD ["node", "-e", "require('http').createServer((_, res) => { res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'ok',service:'backend',phase:1})); }).listen(process.env.PORT || 5000, () => console.log('backend stub listening'))"]
